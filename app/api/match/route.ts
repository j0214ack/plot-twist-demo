import { checkSemanticRateLimit, type SemanticRateLimit } from "../../../db/semantic-rate-limit";

type Candidate = {
  id: string;
  title: string;
  matchHint: string;
  keywords: string[];
  interpretationEcho: string | undefined;
};

function rateLimitHeaders(rateLimit: SemanticRateLimit) {
  return {
    "RateLimit-Limit": String(rateLimit.limit),
    "RateLimit-Remaining": String(rateLimit.remaining),
    "RateLimit-Reset": String(rateLimit.retryAfterSeconds),
  };
}

type MatchPayload = {
  interpretation?: unknown;
  playerId?: unknown;
  defaultBranchId?: unknown;
  candidates?: unknown;
};

function normalizeCandidates(value: unknown): Candidate[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 12)
    .map((candidate) => {
      if (!candidate || typeof candidate !== "object") return null;
      const item = candidate as Record<string, unknown>;
      if (
        typeof item.id !== "string" ||
        typeof item.title !== "string" ||
        typeof item.matchHint !== "string"
      ) {
        return null;
      }

      return {
        id: item.id.slice(0, 64),
        title: item.title.slice(0, 100),
        matchHint: item.matchHint.slice(0, 360),
        keywords: Array.isArray(item.keywords)
          ? item.keywords.filter((keyword): keyword is string => typeof keyword === "string").slice(0, 16)
          : [],
        interpretationEcho:
          typeof item.interpretationEcho === "string" ? item.interpretationEcho.slice(0, 120) : undefined,
      };
    })
    .filter((candidate): candidate is Candidate => Boolean(candidate));
}

function fallbackMatch(interpretation: string, candidates: Candidate[], defaultBranchId?: string) {
  const normalizedInput = interpretation.toLocaleLowerCase("zh-Hant");
  let best = candidates[0];
  let bestKeywordScore = -1;
  let bestOverlapScore = -1;

  for (const candidate of candidates) {
    const keywordScore = candidate.keywords.reduce(
      (score, keyword) => score + (normalizedInput.includes(keyword.toLocaleLowerCase("zh-Hant")) ? 4 : 0),
      0,
    );
    const hintCharacters = new Set(candidate.matchHint.replace(/[\s，。、；：「」]/g, ""));
    const overlapScore = [...normalizedInput].reduce(
      (score, character) => score + (hintCharacters.has(character) ? 0.08 : 0),
      0,
    );
    if (
      keywordScore > bestKeywordScore ||
      (keywordScore === bestKeywordScore && overlapScore > bestOverlapScore)
    ) {
      best = candidate;
      bestKeywordScore = keywordScore;
      bestOverlapScore = overlapScore;
    }
  }

  if (bestKeywordScore === 0 && defaultBranchId) {
    best = candidates.find((candidate) => candidate.id === defaultBranchId) ?? best;
  }

  return {
    match: {
      branchId: best.id,
      rationale: "以 prototype 關鍵語意規則完成配對。",
      echo:
        best.interpretationEcho ||
        `你從眼前的沉默裡，看見了「${best.title}」。`,
      source: "fallback" as const,
    },
    matchedKeywordScore: Math.max(0, bestKeywordScore),
  };
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return null;

  for (const item of response.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const record = part as Record<string, unknown>;
      if (record.type === "output_text" && typeof record.text === "string") return record.text;
    }
  }
  return null;
}

export async function POST(request: Request) {
  let payload: MatchPayload;
  try {
    payload = (await request.json()) as MatchPayload;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const interpretation =
    typeof payload.interpretation === "string" ? payload.interpretation.trim().slice(0, 100) : "";
  const candidates = normalizeCandidates(payload.candidates);

  if (!interpretation || candidates.length === 0) {
    return Response.json({ error: "missing_interpretation_or_candidates" }, { status: 400 });
  }

  const defaultBranchId =
    typeof payload.defaultBranchId === "string" &&
    candidates.some((candidate) => candidate.id === payload.defaultBranchId)
      ? payload.defaultBranchId
      : undefined;
  const ruleEvaluation = fallbackMatch(interpretation, candidates, defaultBranchId);
  const fallback = ruleEvaluation.match;
  if (ruleEvaluation.matchedKeywordScore > 0) {
    return Response.json({
      ...fallback,
      rationale: "以高信心語意規則完成配對。",
      source: "rule",
    });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json(fallback);

  const rateLimit = await checkSemanticRateLimit(request);
  const responseHeaders = rateLimitHeaders(rateLimit);
  if (!rateLimit.allowOpenAI) {
    return Response.json(
      {
        ...fallback,
        rateLimited: rateLimit.reason === "limited",
      },
      { headers: responseHeaders },
    );
  }

  const candidateIds = candidates.map((candidate) => candidate.id);

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-nano",
        store: false,
        reasoning: { effort: "minimal" },
        max_output_tokens: 180,
        safety_identifier:
          typeof payload.playerId === "string" && /^[a-zA-Z0-9-]{8,80}$/.test(payload.playerId)
            ? payload.playerId
            : undefined,
        input: [
          {
            role: "developer",
            content:
              "你是互動敘事遊戲的劇情路由器。根據玩家對場景的自由解讀，選出語意最接近的唯一故事分支。不要新增分支；若玩家沒有明顯敵意或關心判斷、承認資訊不足或只是想等待，選 neutral。另將玩家的解讀轉寫成第二人稱的繁體中文敘事回聲，18 至 38 字，可用「你覺得」起頭；不要提到 AI、配對或分支，也不要新增候選故事以外的事實。",
          },
          {
            role: "user",
            content: JSON.stringify({ interpretation, defaultBranchId, candidates }),
          },
        ],
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "story_branch_match",
            strict: true,
            schema: {
              type: "object",
              properties: {
                branchId: { type: "string", enum: candidateIds },
                echo: { type: "string" },
              },
              required: ["branchId", "echo"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!openAIResponse.ok) {
      console.error("OpenAI story route failed", {
        status: openAIResponse.status,
        body: (await openAIResponse.text()).slice(0, 1000),
      });
      return Response.json(fallback, { headers: responseHeaders });
    }
    const responseData = (await openAIResponse.json()) as Record<string, unknown>;
    const outputText = extractOutputText(responseData);
    if (!outputText) {
      console.warn("OpenAI story route returned no output text", {
        status: responseData.status,
        incompleteDetails: responseData.incomplete_details,
      });
      return Response.json(fallback, { headers: responseHeaders });
    }

    const result = JSON.parse(outputText) as {
      branchId?: unknown;
      echo?: unknown;
    };
    if (typeof result.branchId !== "string" || !candidateIds.includes(result.branchId)) {
      return Response.json(fallback, { headers: responseHeaders });
    }

    return Response.json(
      {
        branchId: result.branchId,
        rationale: "語意配對完成。",
        echo:
          typeof result.echo === "string" && result.echo.trim()
            ? result.echo.trim().slice(0, 120)
            : fallback.echo,
        source: "openai",
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error("OpenAI story route threw", error);
    return Response.json(fallback, { headers: responseHeaders });
  }
}

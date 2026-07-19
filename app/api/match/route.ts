type Candidate = {
  id: string;
  title: string;
  matchHint: string;
  keywords: string[];
};

type MatchPayload = {
  interpretation?: unknown;
  playerId?: unknown;
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
      };
    })
    .filter((candidate): candidate is Candidate => Boolean(candidate));
}

function fallbackMatch(interpretation: string, candidates: Candidate[]) {
  const normalizedInput = interpretation.toLocaleLowerCase("zh-Hant");
  let best = candidates[0];
  let bestScore = -1;

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
    const totalScore = keywordScore + overlapScore;

    if (totalScore > bestScore) {
      best = candidate;
      bestScore = totalScore;
    }
  }

  return {
    branchId: best.id,
    rationale: "以 prototype 關鍵語意規則完成配對。",
    source: "fallback" as const,
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
    typeof payload.interpretation === "string" ? payload.interpretation.trim().slice(0, 500) : "";
  const candidates = normalizeCandidates(payload.candidates);

  if (!interpretation || candidates.length === 0) {
    return Response.json({ error: "missing_interpretation_or_candidates" }, { status: 400 });
  }

  const fallback = fallbackMatch(interpretation, candidates);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json(fallback);

  const candidateIds = candidates.map((candidate) => candidate.id);

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: 180,
        safety_identifier:
          typeof payload.playerId === "string" && /^[a-zA-Z0-9-]{8,80}$/.test(payload.playerId)
            ? payload.playerId
            : undefined,
        input: [
          {
            role: "developer",
            content:
              "你是互動敘事遊戲的劇情路由器。根據玩家對場景的自由解讀，選出語意最接近的唯一故事分支。不要新增分支；理由保持一句話。",
          },
          {
            role: "user",
            content: JSON.stringify({ interpretation, candidates }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "story_branch_match",
            strict: true,
            schema: {
              type: "object",
              properties: {
                branchId: { type: "string", enum: candidateIds },
                rationale: { type: "string" },
              },
              required: ["branchId", "rationale"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!openAIResponse.ok) return Response.json(fallback);
    const responseData = (await openAIResponse.json()) as Record<string, unknown>;
    const outputText = extractOutputText(responseData);
    if (!outputText) return Response.json(fallback);

    const result = JSON.parse(outputText) as { branchId?: unknown; rationale?: unknown };
    if (typeof result.branchId !== "string" || !candidateIds.includes(result.branchId)) {
      return Response.json(fallback);
    }

    return Response.json({
      branchId: result.branchId,
      rationale: typeof result.rationale === "string" ? result.rationale : "語意配對完成。",
      source: "openai",
    });
  } catch {
    return Response.json(fallback);
  }
}

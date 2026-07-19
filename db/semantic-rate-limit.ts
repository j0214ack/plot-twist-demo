const WINDOW_MS = 10 * 60 * 1000;
const MAX_LLM_REQUESTS_PER_WINDOW = 12;

type RateLimitRow = {
  request_count: number;
};

export type SemanticRateLimit = {
  allowOpenAI: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  reason: "allowed" | "limited" | "unavailable";
};

function getClientIp(request: Request) {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedIp || null;
}

async function hashIp(ip: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(ip));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function checkSemanticRateLimit(request: Request): Promise<SemanticRateLimit> {
  const now = Date.now();
  const windowStartedAt = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStartedAt + WINDOW_MS - now) / 1000));
  const clientIp = getClientIp(request);
  const secret = process.env.RATE_LIMIT_SECRET;

  if (!clientIp || !secret) {
    console.error("Semantic rate limiter is unavailable", {
      hasClientIp: Boolean(clientIp),
      hasSecret: Boolean(secret),
      hasDatabase: false,
    });
    return {
      allowOpenAI: false,
      limit: MAX_LLM_REQUESTS_PER_WINDOW,
      remaining: 0,
      retryAfterSeconds,
      reason: "unavailable",
    };
  }

  try {
    const { env } = await import("cloudflare:workers");
    if (!env.DB) throw new Error("rate_limit_database_missing");
    const ipHash = await hashIp(clientIp, secret);
    const row = await env.DB.prepare(
      `INSERT INTO semantic_rate_limits (ip_hash, window_started_at, request_count, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(ip_hash) DO UPDATE SET
         request_count = CASE
           WHEN semantic_rate_limits.window_started_at = excluded.window_started_at
             THEN semantic_rate_limits.request_count + 1
           ELSE 1
         END,
         window_started_at = excluded.window_started_at,
         updated_at = excluded.updated_at
       RETURNING request_count`,
    )
      .bind(ipHash, windowStartedAt, now)
      .first<RateLimitRow>();

    if (!row) throw new Error("rate_limit_counter_missing");
    const remaining = Math.max(0, MAX_LLM_REQUESTS_PER_WINDOW - row.request_count);
    const allowOpenAI = row.request_count <= MAX_LLM_REQUESTS_PER_WINDOW;

    return {
      allowOpenAI,
      limit: MAX_LLM_REQUESTS_PER_WINDOW,
      remaining,
      retryAfterSeconds,
      reason: allowOpenAI ? "allowed" : "limited",
    };
  } catch (error) {
    console.error("Semantic rate limiter failed", error);
    return {
      allowOpenAI: false,
      limit: MAX_LLM_REQUESTS_PER_WINDOW,
      remaining: 0,
      retryAfterSeconds,
      reason: "unavailable",
    };
  }
}

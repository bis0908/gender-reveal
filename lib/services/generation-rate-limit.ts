import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getEncodedSecret } from "@/lib/env.server";
import { createRateLimitError, createRedisError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";

export type GenerationEndpoint = "/api/generate-token" | "/api/dday/create";

export const GENERATION_RATE_LIMIT_POLICY = {
  maxRequests: 5,
  windowSeconds: 60,
  failureMode: "closed",
} as const;

const GENERATION_RATE_LIMIT_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
local needsExpiration = count == 1

if not needsExpiration then
  local currentTtl = redis.call("TTL", KEYS[1])
  needsExpiration = currentTtl < 0
end

if needsExpiration then
  local expirationApplied = redis.call("EXPIRE", KEYS[1], ARGV[1])
  if expirationApplied ~= 1 then
    redis.call("DEL", KEYS[1])
    return redis.error_reply("RATE_LIMIT_EXPIRE_FAILED")
  end
end

return count
`;

export interface EnforceGenerationRateLimitOptions {
  request: Pick<Request, "headers">;
  endpoint: GenerationEndpoint;
}

export async function enforceGenerationRateLimit(
  options: EnforceGenerationRateLimitOptions,
): Promise<void> {
  const { request, endpoint } = options;
  let requestCount: number;

  try {
    const clientIdentifier = createClientIdentifier(request);
    const redis = await getRedisClient();
    const key = `ratelimit:create:${clientIdentifier}`;
    const result: unknown = await redis.eval(GENERATION_RATE_LIMIT_SCRIPT, {
      keys: [key],
      arguments: [String(GENERATION_RATE_LIMIT_POLICY.windowSeconds)],
    });

    if (typeof result !== "number" || !Number.isInteger(result) || result < 1) {
      throw new Error("Redis rate limit count가 올바르지 않습니다.");
    }

    requestCount = result;
  } catch {
    logger.serverMetric("generation_rate_limit_failure", {
      endpoint,
      errorCode: "REDIS_RATE_LIMIT_ERROR",
      failureMode: GENERATION_RATE_LIMIT_POLICY.failureMode,
    });
    throw createRedisError("생성 요청 제한 서비스를 사용할 수 없습니다.");
  }

  if (requestCount > GENERATION_RATE_LIMIT_POLICY.maxRequests) {
    throw createRateLimitError(
      "생성 요청이 너무 많습니다. 1분 후 다시 시도해주세요.",
    );
  }
}

function createClientIdentifier(request: Pick<Request, "headers">): string {
  const identity = getTrustedClientIdentity(request);
  return createHmac("sha256", getEncodedSecret())
    .update(identity)
    .digest("hex");
}

function getTrustedClientIdentity(request: Pick<Request, "headers">): string {
  if (process.env.VERCEL !== "1") {
    return "unverified-client";
  }

  const forwardedFor = request.headers.get("x-vercel-forwarded-for")?.trim();

  if (!forwardedFor || forwardedFor.length > 64 || isIP(forwardedFor) === 0) {
    return "unverified-client";
  }

  return `ip:${forwardedFor.toLowerCase()}`;
}

/**
 * Rate Limiter (Redis 전용)
 *
 * Vercel Serverless 환경에서는 인스턴스 간 메모리 공유가 불가능하므로
 * In-Memory Fallback은 의미 없음. Redis 사용 권장.
 * Redis 미설정 시 rate limit을 스킵하고 요청 허용.
 */

import { getRedisClient, isRedisConnected } from "./redis";
import { logger } from "./logger";

/**
 * Rate limit 설정
 */
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 60 * 1000, // 1시간
  maxRequests: 5, // 최대 5회
} as const;

/**
 * Redis 사용 가능 여부 확인
 */
async function isRedisAvailable(): Promise<boolean> {
  try {
    if (isRedisConnected()) return true;
    if (!process.env.REDIS_URL) return false;
    await getRedisClient();
    return true;
  } catch {
    return false;
  }
}

/**
 * IP 주소에 대한 rate limit 체크
 *
 * @param ip - 클라이언트 IP 주소
 * @returns true면 허용, false면 제한 초과
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const { windowMs, maxRequests } = RATE_LIMIT_CONFIG;

  // Redis 미사용 시 rate limit 스킵 (허용)
  if (!(await isRedisAvailable())) {
    logger.warn("Redis 미연결, rate limit 스킵", { ip });
    return true;
  }

  try {
    const client = await getRedisClient();
    const key = `rate_limit:feedback:${ip}`;

    // 현재 카운트 조회 및 증가
    const currentCount = await client.incr(key);

    // 키가 처음 생성된 경우 만료 시간 설정
    if (currentCount === 1) {
      await client.expire(key, Math.floor(windowMs / 1000));
    }

    if (currentCount > maxRequests) {
      logger.warn("Rate limit 초과", { ip, count: currentCount });
      return false;
    }

    return true;
  } catch (error) {
    // Redis 에러 시 허용 (fail-open)
    logger.error("Rate limit 체크 실패, 요청 허용", { ip }, error as Error);
    return true;
  }
}

/**
 * 특정 IP의 rate limit 상태 조회
 */
export async function getRateLimitStatus(ip: string): Promise<{
  remaining: number;
  resetAt: Date | null;
}> {
  const { windowMs, maxRequests } = RATE_LIMIT_CONFIG;
  const now = Date.now();

  if (!(await isRedisAvailable())) {
    return { remaining: maxRequests, resetAt: null };
  }

  try {
    const client = await getRedisClient();
    const key = `rate_limit:feedback:${ip}`;

    const count = parseInt((await client.get(key)) || "0", 10);
    const ttl = await client.ttl(key);

    const remaining = Math.max(0, maxRequests - count);
    const resetAt = ttl > 0 ? new Date(now + ttl * 1000) : null;

    return { remaining, resetAt };
  } catch (error) {
    logger.error("Rate limit 상태 조회 실패", { ip }, error as Error);
    return { remaining: maxRequests, resetAt: null };
  }
}

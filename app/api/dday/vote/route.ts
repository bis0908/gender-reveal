/**
 * D-Day 투표 API
 * GET /api/dday/vote - 투표 현황 조회
 * POST /api/dday/vote - 투표 제출
 */

import { type NextRequest, NextResponse } from "next/server";
import { parseRequestBody } from "@/lib/api-utils";
import {
  createAlreadyVotedError,
  createBadRequestError,
  createErrorResponse,
  createNotFoundError,
  createRateLimitError,
  normalizeError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import { voteQuerySchema, voteSchema } from "@/lib/schemas/dday-schema";

// Rate limiting 설정: IP당 1분 내 10회 투표 제한
const VOTE_RATE_LIMIT_WINDOW = 60;
const VOTE_RATE_LIMIT_MAX = 10;

// Redis 키 접두사
const REDIS_KEYS = {
  vote: (revealId: string) => `vote:${revealId}`,
  voter: (revealId: string, deviceId: string) =>
    `voter:${revealId}:${deviceId}`,
  revealed: (revealId: string) => `reveal:${revealId}:revealed`,
  rateLimit: (ip: string) => `ratelimit:vote:${ip}`,
};

/**
 * GET: 투표 현황 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Query parameter 추출
    const { searchParams } = new URL(request.url);
    const revealId = searchParams.get("revealId");

    // 2. 검증
    const parseResult = voteQuerySchema.safeParse({ revealId });
    if (!parseResult.success) {
      throw createBadRequestError("revealId가 필요합니다.");
    }

    // 3. Redis에서 데이터 조회
    const redis = await getRedisClient();
    const voteKey = REDIS_KEYS.vote(revealId!);

    // 투표 데이터 존재 확인
    const exists = await redis.exists(voteKey);
    if (!exists) {
      throw createNotFoundError("존재하지 않는 투표입니다.");
    }

    // 투표 현황 조회
    const voteData = await redis.hGetAll(voteKey);
    const prince = parseInt(voteData.prince || "0", 10);
    const princess = parseInt(voteData.princess || "0", 10);

    // 공개 여부 확인
    const revealedKey = REDIS_KEYS.revealed(revealId!);
    const isRevealedRaw = await redis.get(revealedKey);
    const isRevealed = isRevealedRaw === "true";

    logger.debug("투표 현황 조회", { revealId, prince, princess, isRevealed });

    return NextResponse.json({
      success: true,
      votes: {
        prince,
        princess,
      },
      total: prince + princess,
      isRevealed,
      serverTime: Date.now(),
    });
  } catch (error) {
    const appError = normalizeError(error);
    logger.error(
      "투표 현황 조회 실패",
      { endpoint: "/api/dday/vote" },
      appError,
    );
    return createErrorResponse(appError);
  }
}

/**
 * Rate limiting 확인
 */
async function checkVoteRateLimit(ip: string): Promise<boolean> {
  const redis = await getRedisClient();
  const key = REDIS_KEYS.rateLimit(ip);

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, VOTE_RATE_LIMIT_WINDOW);
  }

  return count <= VOTE_RATE_LIMIT_MAX;
}

/**
 * POST: 투표 제출
 */
export async function POST(request: NextRequest) {
  try {
    // 1. IP 추출 및 Rate Limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const isAllowed = await checkVoteRateLimit(ip);
    if (!isAllowed) {
      throw createRateLimitError(
        "투표 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      );
    }

    // 2. 요청 본문 파싱
    const rawData = await parseRequestBody<{
      revealId: string;
      vote: "prince" | "princess";
      deviceId: string;
    }>(request);

    // 3. Zod 스키마 검증
    const parseResult = voteSchema.safeParse(rawData);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((e) => e.message)
        .join(", ");
      throw createBadRequestError(errorMessage);
    }

    const { revealId, vote, deviceId } = parseResult.data;

    // 4. Redis 연결
    const redis = await getRedisClient();
    const voteKey = REDIS_KEYS.vote(revealId);
    const voterKey = REDIS_KEYS.voter(revealId, deviceId);

    // 5. 투표 데이터 존재 확인
    const exists = await redis.exists(voteKey);
    if (!exists) {
      throw createNotFoundError("존재하지 않는 투표입니다.");
    }

    // 6. 중복 투표 확인
    const previousVote = await redis.get(voterKey);
    if (previousVote) {
      throw createAlreadyVotedError(previousVote);
    }

    // 7. 투표 처리 (SET NX로 원자적 처리)
    // 투표 키의 TTL 가져오기
    const ttl = await redis.ttl(voteKey);
    const voterTTL = ttl > 0 ? ttl : 30 * 24 * 60 * 60; // 기본 30일

    // SET NX로 중복 방지 (다른 요청이 먼저 투표했을 수 있음)
    const setResult = await redis.set(voterKey, vote, {
      NX: true,
      EX: voterTTL,
    });

    if (!setResult) {
      // 다른 요청이 먼저 투표함
      const actualVote = await redis.get(voterKey);
      throw createAlreadyVotedError(actualVote || vote);
    }

    // 8. 투표 집계 (HINCRBY로 원자적 증가)
    const newCount = await redis.hIncrBy(voteKey, vote, 1);

    // 9. 최신 상태 조회
    const otherVote = vote === "prince" ? "princess" : "prince";
    const otherCountRaw = await redis.hGet(voteKey, otherVote);
    const otherCount = parseInt(otherCountRaw || "0", 10);

    const votes =
      vote === "prince"
        ? { prince: newCount, princess: otherCount }
        : { prince: otherCount, princess: newCount };

    logger.info("투표 성공", {
      revealId,
      vote,
      deviceId: deviceId.slice(0, 8),
    });

    return NextResponse.json({
      success: true,
      message: "투표가 완료되었습니다. 감사합니다!",
      votes,
    });
  } catch (error) {
    const appError = normalizeError(error);
    logger.error("투표 제출 실패", { endpoint: "/api/dday/vote" }, appError);
    return createErrorResponse(appError);
  }
}

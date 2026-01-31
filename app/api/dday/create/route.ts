/**
 * D-Day 예약 생성 API
 * POST /api/dday/create
 */

import * as jose from "jose";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { parseRequestBody } from "@/lib/api-utils";
import { getEncodedSecret } from "@/lib/env.server";
import {
  createBadRequestError,
  createErrorResponse,
  createRateLimitError,
  createRedisError,
  createValidationError,
  normalizeError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import {
  type DDayCreateInput,
  ddayCreateSchema,
} from "@/lib/schemas/dday-schema";

// Rate limiting 설정: IP당 1분 내 5회 생성 제한
const RATE_LIMIT_WINDOW = 60; // 초
const RATE_LIMIT_MAX_REQUESTS = 5;

// Redis 키 접두사
const REDIS_KEYS = {
  vote: (revealId: string) => `vote:${revealId}`,
  rateLimit: (ip: string) => `ratelimit:create:${ip}`,
};

/**
 * D-Day 토큰 만료 시간 (고정 30일)
 * scheduledAt과 무관하게 생성 시점부터 30일간 유효
 */
const TOKEN_EXPIRATION = "30d";

/**
 * Redis TTL 계산 (scheduledAt + 30일)
 */
function calculateRedisTTL(scheduledAt: string): number {
  const scheduledDate = new Date(scheduledAt);
  const ttlEnd = new Date(scheduledDate);
  ttlEnd.setDate(ttlEnd.getDate() + 30);
  return Math.floor((ttlEnd.getTime() - Date.now()) / 1000);
}

/**
 * Rate limiting 확인
 */
async function checkRateLimit(ip: string): Promise<boolean> {
  const redis = await getRedisClient();
  const key = REDIS_KEYS.rateLimit(ip);

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }

  return count <= RATE_LIMIT_MAX_REQUESTS;
}

/**
 * 고유 revealId 생성 (충돌 방지)
 */
async function generateUniqueRevealId(
  redis: Awaited<ReturnType<typeof getRedisClient>>,
): Promise<string> {
  const MAX_RETRIES = 3;

  for (let i = 0; i < MAX_RETRIES; i++) {
    const revealId = nanoid(8);
    const exists = await redis.exists(REDIS_KEYS.vote(revealId));

    if (!exists) {
      return revealId;
    }

    logger.warn("RevealId 충돌 발생, 재시도", { attempt: i + 1, revealId });
  }

  throw createRedisError("고유 ID 생성에 실패했습니다. 다시 시도해주세요.");
}

export async function POST(request: Request) {
  try {
    // 1. IP 추출 및 Rate Limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const isAllowed = await checkRateLimit(ip);
    if (!isAllowed) {
      throw createRateLimitError(
        "D-Day 생성 요청이 너무 많습니다. 1분 후 다시 시도해주세요.",
      );
    }

    // 2. 요청 본문 파싱
    const rawData = await parseRequestBody<DDayCreateInput>(request);

    // 3. Zod 스키마 검증
    const parseResult = ddayCreateSchema.safeParse(rawData);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((e) => e.message)
        .join(", ");
      throw createValidationError(errorMessage, parseResult.error.errors);
    }

    const data = parseResult.data;

    // 4. Redis 연결 및 고유 ID 생성
    const redis = await getRedisClient();
    const revealId = await generateUniqueRevealId(redis);

    // 5. Redis TTL 계산
    const redisTTL = calculateRedisTTL(data.scheduledAt);

    // 6. Redis에 투표 데이터 초기화
    const voteKey = REDIS_KEYS.vote(revealId);
    await redis.hSet(voteKey, { prince: 0, princess: 0 });
    await redis.expire(voteKey, redisTTL);

    // 7. JWT 토큰 생성
    const JWT_SECRET = getEncodedSecret();

    // 카운트다운 토큰 (친지용 - reveal 페이지에 필요한 전체 정보 포함)
    const countdownTokenData = {
      motherName: data.motherName,
      fatherName: data.fatherName,
      babyName: data.babyName,
      gender: data.gender,
      dueDate: data.dueDate,
      message: data.message,
      animationType: data.animationType,
      countdownTime: data.countdownTime,
      isMultiple: data.isMultiple,
      babiesInfo: data.babiesInfo,
      scheduledAt: data.scheduledAt,
      revealId,
      type: "countdown",
    };

    const countdownToken = await new jose.SignJWT(countdownTokenData)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRATION)
      .sign(JWT_SECRET);

    // 리빌 토큰 (부모용 - 기존 형식 유지)
    const revealTokenData = {
      motherName: data.motherName,
      fatherName: data.fatherName,
      babyName: data.babyName,
      gender: data.gender,
      dueDate: data.dueDate,
      message: data.message,
      animationType: data.animationType,
      countdownTime: data.countdownTime,
      isMultiple: data.isMultiple,
      babiesInfo: data.babiesInfo,
      scheduledAt: data.scheduledAt,
      revealId,
    };

    const revealToken = await new jose.SignJWT(
      revealTokenData as unknown as Record<string, unknown>,
    )
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRATION)
      .sign(JWT_SECRET);

    logger.info("D-Day 예약 생성 성공", {
      revealId,
      scheduledAt: data.scheduledAt,
      redisTTL,
    });

    return NextResponse.json({
      success: true,
      countdownToken,
      revealToken,
      revealId,
    });
  } catch (error) {
    const appError = normalizeError(error);

    logger.error("D-Day 생성 실패", { endpoint: "/api/dday/create" }, appError);

    return createErrorResponse(appError);
  }
}

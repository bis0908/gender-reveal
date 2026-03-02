import { NextResponse } from "next/server";
import * as jose from "jose";
import { parseRequestBody } from "@/lib/api-utils";
import { getEncodedSecret } from "@/lib/env.server";
import {
  createBadRequestError,
  createErrorResponse,
  createForbiddenError,
  createNotFoundError,
  createUnauthorizedError,
  normalizeError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import {
  ensureRevealTimeReached,
  getStringField,
  markAsRevealed,
  parseStoredRevealData,
  REDIS_KEYS,
} from "@/lib/dday-utils";

interface RevealDataRequest {
  token: string;
}

export async function POST(request: Request) {
  try {
    // 1. 요청 본문 파싱
    const { token } = await parseRequestBody<RevealDataRequest>(request);

    if (!token) {
      throw createBadRequestError("토큰이 필요합니다.");
    }

    // 2. JWT 검증
    const JWT_SECRET = getEncodedSecret();
    let payload: jose.JWTPayload;

    try {
      const verifyResult = await jose.jwtVerify(token, JWT_SECRET);
      payload = verifyResult.payload;
    } catch (verifyError) {
      logger.warn("토큰 검증 실패", {
        endpoint: "/api/dday/reveal-data",
        error: verifyError instanceof Error ? verifyError.message : "Unknown error",
      });
      throw createUnauthorizedError("유효하지 않거나 만료된 토큰입니다.");
    }

    // 3. countdown 토큰 타입 확인 (이 엔드포인트는 countdown 전용)
    const payloadData = payload as Record<string, unknown>;
    if (payloadData.type !== "countdown") {
      throw createForbiddenError("카운트다운 토큰만 이 엔드포인트를 사용할 수 있습니다.");
    }

    // 4. revealId로 Redis 조회
    const revealId = getStringField(payloadData, "revealId");
    if (!revealId) {
      throw createNotFoundError("공개 데이터를 찾을 수 없습니다.");
    }

    const redis = await getRedisClient();
    const rawRevealData = await redis.get(REDIS_KEYS.revealData(revealId));
    const storedRevealData = parseStoredRevealData(rawRevealData);

    if (!storedRevealData) {
      throw createNotFoundError("공개 데이터를 찾을 수 없습니다.");
    }

    // 5. D-Day 확인 (공개 시간 전이면 403)
    const scheduledAt = getStringField(storedRevealData, "scheduledAt");
    ensureRevealTimeReached(scheduledAt);

    // 6. 공개 완료 플래그 설정
    try {
      await markAsRevealed(redis, revealId);
    } catch (markError) {
      logger.warn("공개 완료 플래그 저장 실패", {
        endpoint: "/api/dday/reveal-data",
        revealId,
        error: markError instanceof Error ? markError.message : "Unknown error",
      });
    }

    logger.info("D-Day reveal-data 조회 성공", {
      endpoint: "/api/dday/reveal-data",
      revealId,
    });

    return NextResponse.json({ data: storedRevealData });
  } catch (error) {
    const appError = normalizeError(error);

    logger.error("D-Day reveal-data 조회 실패", { endpoint: "/api/dday/reveal-data" }, appError);

    return createErrorResponse(appError);
  }
}

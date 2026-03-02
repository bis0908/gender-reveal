import { NextResponse } from "next/server";
import * as jose from "jose";
import { parseRequestBody } from "@/lib/api-utils";
import {
  ensureRevealTimeReached,
  getStringField,
  markAsRevealed,
  parseStoredRevealData,
  REDIS_KEYS,
} from "@/lib/dday-utils";
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

type TokenPurpose = "countdown" | "reveal";

interface VerifyTokenRequest {
  token: string;
  purpose?: TokenPurpose;
}

function parsePurpose(rawPurpose: unknown): TokenPurpose {
  if (rawPurpose === undefined) {
    return "reveal";
  }

  if (rawPurpose !== "countdown" && rawPurpose !== "reveal") {
    throw createBadRequestError("purpose 값이 올바르지 않습니다.");
  }

  return rawPurpose;
}

function parseTokenType(rawType: unknown): TokenPurpose | undefined {
  if (rawType === undefined) {
    return undefined;
  }

  if (rawType === "countdown" || rawType === "reveal") {
    return rawType;
  }

  throw createUnauthorizedError("토큰 유형이 올바르지 않습니다.");
}

function ensurePurposeAccessAllowed(
  purpose: TokenPurpose,
  tokenType?: TokenPurpose,
): void {
  if (!purpose) {
    throw createBadRequestError("purpose 값이 필요합니다.");
  }

  // purpose는 요청 의도, tokenType은 JWT에 서명된 접근 권한이다.
  // 충돌 시 tokenType을 우선하여 접근을 차단한다.
  if (purpose === "reveal" && tokenType === "countdown") {
    throw createForbiddenError(
      "카운트다운 토큰으로는 공개 정보를 조회할 수 없습니다.",
    );
  }
}

function buildCountdownSafeData(
  sourceData: Record<string, unknown>,
): { babyName: string; scheduledAt: string; revealId: string; type: "countdown" } {
  if (!sourceData) {
    throw createBadRequestError("카운트다운 데이터가 필요합니다.");
  }

  const babyName = getStringField(sourceData, "babyName");
  const scheduledAt = getStringField(sourceData, "scheduledAt");
  const revealId = getStringField(sourceData, "revealId");

  if (!babyName || !scheduledAt || !revealId) {
    throw createBadRequestError("카운트다운 데이터가 올바르지 않습니다.");
  }

  return {
    babyName,
    scheduledAt,
    revealId,
    type: "countdown",
  };
}

export async function POST(request: Request) {
  try {
    // 1. 요청 본문 파싱
    const { token, purpose: rawPurpose } =
      await parseRequestBody<VerifyTokenRequest>(request);

    // 2. 필수 값 검증
    if (!token) {
      throw createBadRequestError("토큰이 필요합니다.");
    }

    const purpose = parsePurpose(rawPurpose);

    // 3. JWT 검증
    const JWT_SECRET = getEncodedSecret();
    let payload: jose.JWTPayload;

    try {
      const verifyResult = await jose.jwtVerify(token, JWT_SECRET);
      payload = verifyResult.payload;
    } catch (verifyError) {
      logger.warn("토큰 검증 실패", {
        endpoint: "/api/verify-token",
        error: verifyError instanceof Error ? verifyError.message : "Unknown error",
      });
      throw createUnauthorizedError("유효하지 않거나 만료된 토큰입니다.");
    }

    // 4. Redis 공개 데이터 조회
    const payloadData = payload as Record<string, unknown>;
    const revealId = getStringField(payloadData, "revealId");
    const tokenType = parseTokenType(payloadData.type);
    ensurePurposeAccessAllowed(purpose, tokenType);
    let redisClient: Awaited<ReturnType<typeof getRedisClient>> | null = null;
    let storedRevealData: Record<string, unknown> | null = null;

    if (revealId) {
      redisClient = await getRedisClient();
      const revealDataKey = REDIS_KEYS.revealData(revealId);
      const rawRevealData = await redisClient.get(revealDataKey);
      storedRevealData = parseStoredRevealData(rawRevealData);
    }

    // 5. purpose 분기 처리
    if (purpose === "countdown") {
      const countdownSource = storedRevealData || payloadData;
      const safeData = buildCountdownSafeData(countdownSource);
      return NextResponse.json({ data: safeData });
    }

    const revealSource = storedRevealData || payloadData;

    if (!storedRevealData && !revealId) {
      // 기존 즉시 공개 토큰 경로: revealId가 없어도 payload 그대로 사용
      logger.info("legacy 즉시 공개 토큰 검증", {
        endpoint: "/api/verify-token",
      });
    }

    if (!revealSource) {
      throw createNotFoundError("공개 데이터를 찾을 수 없습니다.");
    }

    const scheduledAt = getStringField(revealSource, "scheduledAt");
    ensureRevealTimeReached(scheduledAt);

    if (revealId && redisClient) {
      try {
        await markAsRevealed(redisClient, revealId);
      } catch (markError) {
        logger.warn("공개 완료 플래그 저장 실패", {
          endpoint: "/api/verify-token",
          revealId,
          error:
            markError instanceof Error ? markError.message : "Unknown error",
        });
      }
    }

    logger.info("토큰 검증 성공", {
      endpoint: "/api/verify-token",
      purpose,
      revealId,
      hasStoredData: !!storedRevealData,
    });

    return NextResponse.json({ data: revealSource });
  } catch (error) {
    const appError = normalizeError(error);

    logger.error("토큰 검증 실패", { endpoint: "/api/verify-token" }, appError);

    return createErrorResponse(appError);
  }
}

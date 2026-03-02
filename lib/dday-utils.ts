/**
 * D-Day 공통 유틸리티
 * verify-token 및 dday/reveal-data API에서 공유하는 함수들
 */

import {
  createBadRequestError,
  createForbiddenError,
  createRedisError,
} from "@/lib/errors";
import { getRedisClient } from "@/lib/redis";

export const REDIS_KEYS = {
  revealData: (revealId: string) => `reveal:${revealId}:data`,
  revealed: (revealId: string) => `reveal:${revealId}:revealed`,
};

export function getStringField(
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  if (!data || !key) {
    throw createBadRequestError("필수 파라미터가 누락되었습니다.");
  }

  const value = data[key];
  return typeof value === "string" ? value : undefined;
}

export function parseStoredRevealData(
  rawData: string | null,
): Record<string, unknown> | null {
  if (rawData === null) {
    return null;
  }

  if (!rawData) {
    throw createRedisError("공개 데이터가 비어 있습니다.");
  }

  try {
    const parsed = JSON.parse(rawData);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid reveal data");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw createRedisError(
      error instanceof Error
        ? `공개 데이터 파싱에 실패했습니다: ${error.message}`
        : "공개 데이터 파싱에 실패했습니다.",
    );
  }
}

export function ensureRevealTimeReached(scheduledAt?: string): void {
  if (!scheduledAt) {
    return;
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    throw createBadRequestError("예약 시간 형식이 올바르지 않습니다.");
  }

  if (scheduledDate.getTime() > Date.now()) {
    throw createForbiddenError("아직 공개 시간이 아닙니다.", {
      revealAt: scheduledAt,
    });
  }
}

export async function markAsRevealed(
  redis: Awaited<ReturnType<typeof getRedisClient>>,
  revealId: string,
): Promise<void> {
  if (!redis || !revealId) {
    throw createBadRequestError("공개 완료 처리에 필요한 정보가 누락되었습니다.");
  }

  const revealDataTTL = await redis.ttl(REDIS_KEYS.revealData(revealId));
  const revealedTTL = revealDataTTL > 0 ? revealDataTTL : 30 * 24 * 60 * 60;

  await redis.set(REDIS_KEYS.revealed(revealId), "true", {
    EX: revealedTTL,
  });
}

/**
 * API 유틸리티 함수
 */

import type { NextResponse } from "next/server";
import {
  AppError,
  createBadRequestError,
  createErrorResponse,
  createValidationError,
  normalizeError,
} from "./errors";
import { logger } from "./logger";

/**
 * API 핸들러 래퍼
 * 에러를 자동으로 캐치하고 표준화된 응답으로 변환
 */
export function withErrorHandler<T>(
  handler: (request: Request, ...args: unknown[]) => Promise<NextResponse<T>>,
) {
  return async (
    request: Request,
    ...args: unknown[]
  ): Promise<NextResponse<T>> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      const appError = normalizeError(error);

      logger.error(
        "API 에러 발생",
        {
          path: new URL(request.url).pathname,
          method: request.method,
          errorCode: appError.code,
        },
        appError,
      );

      return createErrorResponse(appError) as NextResponse<T>;
    }
  };
}

/**
 * 요청 본문 파싱 헬퍼
 */
export async function parseRequestBody<T>(request: Request): Promise<T> {
  const text = await request.text();

  if (!text || text.trim() === "") {
    throw createBadRequestError("요청 본문이 비어있습니다.");
  }

  try {
    return JSON.parse(text) as T;
  } catch (_) {
    throw createBadRequestError("잘못된 JSON 형식입니다.");
  }
}

/**
 * 필수 필드 검증 헬퍼
 */
export function validateRequiredFields<T extends object>(
  data: T,
  requiredFields: (keyof T)[],
): void {
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw createValidationError("필수 정보가 누락되었습니다.", {
      missingFields,
    });
  }
}

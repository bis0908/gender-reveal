/**
 * 표준화된 에러 타입 및 핸들러
 */

import { NextResponse } from "next/server";

// 에러 코드 정의
export enum ErrorCode {
  // 클라이언트 에러 (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // 서버 에러 (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  JWT_ERROR = "JWT_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

// 에러 응답 인터페이스
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  success: false;
}

/**
 * 커스텀 에러 클래스
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorResponse {
    const errorObj: ErrorResponse = {
      error: {
        code: this.code,
        message: this.message,
      },
      success: false,
    };

    if (this.details) {
      errorObj.error.details = this.details;
    }

    return errorObj;
  }
}

/**
 * 에러 팩토리 함수들
 */
export const createBadRequestError = (message: string, details?: unknown) =>
  new AppError(ErrorCode.BAD_REQUEST, message, 400, details);

export const createUnauthorizedError = (
  message: string = "인증이 필요합니다.",
) => new AppError(ErrorCode.UNAUTHORIZED, message, 401);

export const createValidationError = (message: string, details?: unknown) =>
  new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);

export const createJWTError = (
  message: string = "JWT 처리 중 오류가 발생했습니다.",
) => new AppError(ErrorCode.JWT_ERROR, message, 500);

export const createInternalError = (
  message: string = "서버 오류가 발생했습니다.",
) => new AppError(ErrorCode.INTERNAL_ERROR, message, 500);

/**
 * NextResponse로 에러 응답 생성
 */
export function createErrorResponse(
  error: AppError,
): NextResponse<ErrorResponse> {
  return NextResponse.json(error.toJSON(), { status: error.statusCode });
}

/**
 * 일반 Error를 AppError로 변환
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return createInternalError(error.message);
  }

  return createInternalError("알 수 없는 오류가 발생했습니다.");
}

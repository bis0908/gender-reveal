/**
 * 구조화된 로깅 유틸리티
 * 환경에 따라 적절한 로그 레벨과 형식을 제공
 */

import { ENV } from "./env";

// 로그 레벨 정의
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

// 로그 컨텍스트 (메타데이터)
interface LogContext {
  userId?: string;
  requestId?: string;
  timestamp?: Date;
  [key: string]: unknown;
}

// 민감 정보 필터링 키워드
const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "authorization",
  "cookie",
  "session",
];

/**
 * 민감 정보 마스킹
 */
function maskSensitiveData(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((sensitive) =>
      lowerKey.includes(sensitive),
    );

    if (isSensitive && typeof value === "string") {
      // 앞 4자와 뒤 4자만 표시
      masked[key] =
        value.length > 8
          ? `${value.slice(0, 4)}****${value.slice(-4)}`
          : "****";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * 로그 포매터
 */
function formatLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error,
): string {
  const timestamp = new Date().toISOString();
  const masked = context ? maskSensitiveData(context) : {};

  const logData: Record<string, unknown> = {
    timestamp,
    level,
    message,
  };

  if (masked && typeof masked === "object" && Object.keys(masked).length > 0) {
    logData.context = masked;
  }

  if (error) {
    logData.error = {
      name: error.name,
      message: error.message,
      ...(ENV.IS_DEVELOPMENT && { stack: error.stack }),
    };
  }

  return JSON.stringify(logData);
}

/**
 * Logger 클래스
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    // 프로덕션에서는 ERROR, WARN만 출력
    if (ENV.IS_PRODUCTION) {
      return level === LogLevel.ERROR || level === LogLevel.WARN;
    }
    // 개발 환경에서는 모든 레벨 출력
    return true;
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(formatLog(LogLevel.ERROR, message, context, error));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(formatLog(LogLevel.WARN, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(formatLog(LogLevel.INFO, message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(formatLog(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * API 요청 로깅 헬퍼
   */
  logApiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API 요청: ${method} ${path}`, context);
  }

  /**
   * API 에러 로깅 헬퍼
   */
  logApiError(
    method: string,
    path: string,
    error: Error,
    context?: LogContext,
  ): void {
    this.error(
      `API 에러: ${method} ${path}`,
      { ...context, path, method },
      error,
    );
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

// 편의 함수들
export const logError = (
  message: string,
  context?: LogContext,
  error?: Error,
) => logger.error(message, context, error);

export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);

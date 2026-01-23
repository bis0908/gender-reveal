/**
 * Redis 클라이언트 유틸리티
 * D-Day 투표 기능을 위한 Redis Cloud 연결 관리
 */

import { createClient, type RedisClientType } from "redis";

import { logger } from "./logger";

// Redis 클라이언트 싱글톤
let client: RedisClientType | null = null;
let isConnecting = false;

/**
 * Redis URL 환경변수 검증
 */
function getRedisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL 환경변수가 설정되지 않았습니다.");
  }
  return url;
}

/**
 * Redis 클라이언트 인스턴스 반환
 * 연결이 없으면 새로 생성하고, 이미 있으면 기존 연결 반환
 */
export async function getRedisClient(): Promise<RedisClientType> {
  // 이미 연결된 클라이언트가 있으면 반환
  if (client?.isOpen) {
    return client;
  }

  // 동시 연결 시도 방지
  if (isConnecting) {
    // 연결 완료까지 대기
    await new Promise<void>((resolve) => {
      const checkConnection = setInterval(() => {
        if (!isConnecting && client?.isOpen) {
          clearInterval(checkConnection);
          resolve();
        }
      }, 50);
    });
    return client!;
  }

  isConnecting = true;

  try {
    const redisUrl = getRedisUrl();

    client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.error("Redis 재연결 최대 시도 횟수 초과", { retries });
            return new Error("Redis 재연결 실패");
          }
          return Math.min(retries * 100, 1000);
        },
      },
    });

    // 에러 핸들러 등록
    client.on("error", (err) => {
      logger.error("Redis 클라이언트 에러", {}, err);
    });

    client.on("connect", () => {
      logger.info("Redis 연결 시작");
    });

    client.on("ready", () => {
      logger.info("Redis 연결 준비 완료");
    });

    client.on("reconnecting", () => {
      logger.warn("Redis 재연결 시도 중");
    });

    await client.connect();

    // 연결 후 설정 정보 로깅 (persistence 확인용)
    try {
      const info = await client.info("memory");
      const maxmemoryPolicy =
        info.match(/maxmemory_policy:(\w+)/)?.[1] || "unknown";
      logger.info("Redis 연결 성공", { maxmemoryPolicy });
    } catch {
      logger.info("Redis 연결 성공 (INFO 조회 실패)");
    }

    return client;
  } catch (error) {
    logger.error(
      "Redis 연결 실패",
      {},
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * Redis 연결 종료
 */
export async function closeRedisClient(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    logger.info("Redis 연결 종료");
  }
}

/**
 * Redis 연결 상태 확인
 */
export function isRedisConnected(): boolean {
  return client?.isOpen ?? false;
}

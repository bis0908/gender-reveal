/** @jest-environment node */

import { POST as createDday } from "@/app/api/dday/create/route";
import { POST as generateToken } from "@/app/api/generate-token/route";
import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import { recordGenerationMetric } from "@/lib/services/generation-metrics";

const EVENT_ID = "550e8400-e29b-41d4-a716-446655440000";

jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("node:crypto", () => ({
  ...jest.requireActual("node:crypto"),
  randomUUID: jest.fn(() => EVENT_ID),
}));
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "reveal123"),
}));
jest.mock("@/lib/redis", () => ({
  getRedisClient: jest.fn(),
}));
jest.mock("@/lib/services/generation-metrics", () => ({
  recordGenerationMetric: jest.fn(),
}));
jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    serverMetric: jest.fn(),
  },
}));

const mockedGetRedisClient = jest.mocked(getRedisClient);
const mockedRecordGenerationMetric = jest.mocked(recordGenerationMetric);
const mockedServerMetric = jest.mocked(logger.serverMetric);
const redis = {
  eval: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  hSet: jest.fn(),
  set: jest.fn(),
};
const originalVercel = process.env.VERCEL;

function createRequest(path: string, body: Record<string, unknown>): Request {
  return new Request(`https://example.com${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0",
    },
    body: JSON.stringify(body),
  });
}

function createBody(overrides: Record<string, unknown> = {}) {
  return {
    motherName: "엄마",
    fatherName: "아빠",
    babyName: "복덩이",
    gender: "boy",
    animationType: "confetti",
    countdownTime: 5,
    isMultiple: false,
    ...overrides,
  };
}

describe("생성 API 공통 rate limiter 통합", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VERCEL = "1";
    mockedGetRedisClient.mockResolvedValue(redis as never);
    mockedRecordGenerationMetric.mockResolvedValue(true);
    redis.eval.mockResolvedValue(1);
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(true);
    redis.exists.mockResolvedValue(0);
    redis.hSet.mockResolvedValue(1);
    redis.set.mockResolvedValue("OK");
  });

  afterAll(() => {
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
      return;
    }

    process.env.VERCEL = originalVercel;
  });

  test("Given 신뢰 IP 헤더가 누락됐지만 Redis가 정상일 때 When 즉시 생성하면 Then 고정 fallback bucket으로 제한을 적용하고 200을 반환한다", async () => {
    // Given
    const request = createRequest("/api/generate-token", createBody());

    // When
    const response = await generateToken(request);

    // Then
    expect(response.status).toBe(200);
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("INCR", KEYS[1])'),
      {
        keys: [expect.stringMatching(/^ratelimit:create:[0-9a-f]{64}$/)],
        arguments: ["60"],
      },
    );
    expect(redis.incr).not.toHaveBeenCalled();
    expect(redis.expire).not.toHaveBeenCalled();
    expect(mockedRecordGenerationMetric).toHaveBeenCalledTimes(1);
  });

  test("Given 같은 생성 bucket의 여섯 번째 요청일 때 When 즉시 생성하면 Then 429를 반환하고 메트릭을 기록하지 않는다", async () => {
    // Given
    redis.eval.mockResolvedValue(6);
    const request = createRequest("/api/generate-token", createBody());

    // When
    const response = await generateToken(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(mockedRecordGenerationMetric).not.toHaveBeenCalled();
  });

  test("Given REDIS_URL 미설정 상태일 때 When 즉시 생성하면 Then fail-closed 500을 반환하고 핵심·메트릭 작업을 실행하지 않는다", async () => {
    // Given
    mockedGetRedisClient.mockRejectedValue(
      new Error("REDIS_URL 환경변수가 설정되지 않았습니다."),
    );
    const request = createRequest("/api/generate-token", createBody());

    // When
    const response = await generateToken(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(body.error.code).toBe("REDIS_ERROR");
    expect(mockedRecordGenerationMetric).not.toHaveBeenCalled();
  });

  test("Given Redis EVAL 원문 오류가 있을 때 When D-Day 생성하면 Then fail-closed 500과 정제 로그를 반환하고 저장·메트릭을 건너뛴다", async () => {
    // Given
    redis.eval.mockRejectedValue(
      new Error("redis://user:raw-password@example.com 연결 실패"),
    );
    const request = createRequest(
      "/api/dday/create",
      createBody({
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    );

    // When
    const response = await createDday(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(body.error.code).toBe("REDIS_ERROR");
    expect(redis.set).not.toHaveBeenCalled();
    expect(mockedRecordGenerationMetric).not.toHaveBeenCalled();
    expect(mockedServerMetric).toHaveBeenCalledWith(
      "generation_rate_limit_failure",
      expect.objectContaining({ failureMode: "closed" }),
    );
    expect(JSON.stringify(mockedServerMetric.mock.calls)).not.toContain(
      "raw-password",
    );
  });
});

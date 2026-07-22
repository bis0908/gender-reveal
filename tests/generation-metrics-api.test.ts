/** @jest-environment node */

import * as jose from "jose";
import { POST as createDday } from "@/app/api/dday/create/route";
import { POST as generateToken } from "@/app/api/generate-token/route";
import { createRateLimitError, createRedisError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import { recordGenerationMetric } from "@/lib/services/generation-metrics";
import { enforceGenerationRateLimit } from "@/lib/services/generation-rate-limit";

const EVENT_ID = "550e8400-e29b-41d4-a716-446655440000";

jest.mock("node:crypto", () => ({
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

jest.mock("@/lib/services/generation-rate-limit", () => ({
  enforceGenerationRateLimit: jest.fn(),
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

const mockedRecordMetric = jest.mocked(recordGenerationMetric);
const mockedEnforceGenerationRateLimit = jest.mocked(
  enforceGenerationRateLimit,
);
const mockedGetRedisClient = jest.mocked(getRedisClient);
const mockedServerMetric = jest.mocked(logger.serverMetric);
const mockRedisClient = {
  incr: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  hSet: jest.fn(),
  set: jest.fn(),
};

function createRequest(path: string, body: Record<string, unknown>): Request {
  return new Request(`https://example.com${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 (Linux; Android 14)",
      "x-vercel-ip-country": "KR",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

function createBaseBody(overrides: Record<string, unknown> = {}) {
  return {
    motherName: "엄마",
    fatherName: "아빠",
    babyName: "복덩이",
    gender: "boy",
    animationType: "confetti",
    countdownTime: 5,
    isMultiple: false,
    dueDate: "2026-07-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("생성 API 메트릭 연결", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRecordMetric.mockResolvedValue(true);
    mockedEnforceGenerationRateLimit.mockResolvedValue();
    mockedGetRedisClient.mockResolvedValue(mockRedisClient as never);
    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(true);
    mockRedisClient.exists.mockResolvedValue(0);
    mockRedisClient.hSet.mockResolvedValue(1);
    mockRedisClient.set.mockResolvedValue("OK");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("Given 즉시 생성이 성공할 때 When 응답하면 Then instant 메트릭을 한 번 기록한다", async () => {
    // Given
    const request = createRequest("/api/generate-token", createBaseBody());

    // When
    const response = await generateToken(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockedRecordMetric).toHaveBeenCalledTimes(1);
    expect(mockedRecordMetric).toHaveBeenCalledWith({
      eventId: EVENT_ID,
      creationMode: "instant",
      endpoint: "/api/generate-token",
      request,
      data: expect.objectContaining({ animationType: "confetti" }),
    });
    expect(mockedEnforceGenerationRateLimit).toHaveBeenCalledWith({
      request,
      endpoint: "/api/generate-token",
    });
  });

  test("Given 즉시 생성이 공통 한도를 초과할 때 When 요청하면 Then 핵심 작업 전에 429를 반환하고 메트릭을 기록하지 않는다", async () => {
    // Given
    mockedEnforceGenerationRateLimit.mockRejectedValue(
      createRateLimitError("생성 요청이 너무 많습니다."),
    );
    const request = createRequest("/api/generate-token", createBaseBody());

    // When
    const response = await generateToken(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(mockedRecordMetric).not.toHaveBeenCalled();
  });

  test("Given 즉시 생성의 메트릭 서비스가 예외를 던질 때 When 응답하면 Then 링크 생성은 성공하고 정제된 실패 로그를 남긴다", async () => {
    // Given
    mockedRecordMetric.mockRejectedValue(
      new Error("SUPABASE_SECRET_KEY=절대-로그-금지"),
    );
    const request = createRequest("/api/generate-token", createBaseBody());

    // When
    const response = await generateToken(request);

    // Then
    expect(response.status).toBe(200);
    expect(mockedServerMetric).toHaveBeenCalledWith("metrics_record_failure", {
      endpoint: "/api/generate-token",
      creationMode: "instant",
      eventId: EVENT_ID,
      errorCode: "UNEXPECTED_METRICS_ERROR",
    });
    expect(JSON.stringify(mockedServerMetric.mock.calls)).not.toContain(
      "절대-로그-금지",
    );
  });

  test("Given 즉시 생성의 JWT 서명이 실패할 때 When 요청하면 Then 메트릭을 기록하지 않는다", async () => {
    // Given
    jest
      .spyOn(jose.SignJWT.prototype, "sign")
      .mockRejectedValueOnce(new Error("JWT failure"));
    const request = createRequest("/api/generate-token", createBaseBody());

    // When / Then
    await expect(generateToken(request)).rejects.toMatchObject({
      code: "JWT_ERROR",
    });
    expect(mockedRecordMetric).not.toHaveBeenCalled();
  });

  test("Given D-Day 생성이 성공할 때 When 응답하면 Then dday 메트릭을 한 번 기록한다", async () => {
    // Given
    const request = createRequest(
      "/api/dday/create",
      createBaseBody({
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    );

    // When
    const response = await createDday(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockedRecordMetric).toHaveBeenCalledTimes(1);
    expect(mockedRecordMetric).toHaveBeenCalledWith({
      eventId: EVENT_ID,
      creationMode: "dday",
      endpoint: "/api/dday/create",
      request,
      data: expect.objectContaining({ scheduledAt: expect.any(String) }),
    });
    expect(mockedEnforceGenerationRateLimit).toHaveBeenCalledWith({
      request,
      endpoint: "/api/dday/create",
    });
  });

  test("Given D-Day 생성이 공통 한도를 초과할 때 When 요청하면 Then Redis 저장 전에 429를 반환하고 메트릭을 기록하지 않는다", async () => {
    // Given
    mockedEnforceGenerationRateLimit.mockRejectedValue(
      createRateLimitError("생성 요청이 너무 많습니다."),
    );
    const request = createRequest(
      "/api/dday/create",
      createBaseBody({
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    );

    // When
    const response = await createDday(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(mockedGetRedisClient).not.toHaveBeenCalled();
    expect(mockedRecordMetric).not.toHaveBeenCalled();
  });

  test("Given 공통 limiter Redis가 실패할 때 When 즉시 생성을 요청하면 Then fail-closed 500과 메트릭 0회를 유지한다", async () => {
    // Given
    mockedEnforceGenerationRateLimit.mockRejectedValue(
      createRedisError("생성 요청 제한 서비스를 사용할 수 없습니다."),
    );
    const request = createRequest("/api/generate-token", createBaseBody());

    // When
    const response = await generateToken(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(body.error.code).toBe("REDIS_ERROR");
    expect(mockedRecordMetric).not.toHaveBeenCalled();
  });

  test("Given D-Day 생성의 메트릭 서비스가 예외를 던질 때 When 응답하면 Then 두 링크 생성은 성공한다", async () => {
    // Given
    mockedRecordMetric.mockRejectedValue(new Error("raw database error"));
    const request = createRequest(
      "/api/dday/create",
      createBaseBody({
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    );

    // When
    const response = await createDday(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.countdownToken).toBeDefined();
    expect(body.revealToken).toBeDefined();
    expect(mockedServerMetric).toHaveBeenCalledWith("metrics_record_failure", {
      endpoint: "/api/dday/create",
      creationMode: "dday",
      eventId: EVENT_ID,
      errorCode: "UNEXPECTED_METRICS_ERROR",
    });
  });

  test("Given D-Day Redis 저장이 실패할 때 When 요청하면 Then 메트릭을 기록하지 않는다", async () => {
    // Given
    mockRedisClient.set.mockRejectedValueOnce(new Error("Redis failure"));
    const request = createRequest(
      "/api/dday/create",
      createBaseBody({
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    );

    // When
    const response = await createDday(request);

    // Then
    expect(response.status).toBe(500);
    expect(mockedRecordMetric).not.toHaveBeenCalled();
  });

  test("Given D-Day JWT 서명이 실패할 때 When 요청하면 Then 메트릭을 기록하지 않는다", async () => {
    // Given
    jest
      .spyOn(jose.SignJWT.prototype, "sign")
      .mockRejectedValueOnce(new Error("JWT failure"));
    const request = createRequest(
      "/api/dday/create",
      createBaseBody({
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    );

    // When
    const response = await createDday(request);

    // Then
    expect(response.status).toBe(500);
    expect(mockedRecordMetric).not.toHaveBeenCalled();
  });
});

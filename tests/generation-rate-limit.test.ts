/** @jest-environment node */

import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import {
  enforceGenerationRateLimit,
  GENERATION_RATE_LIMIT_POLICY,
} from "@/lib/services/generation-rate-limit";

jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@/lib/redis", () => ({
  getRedisClient: jest.fn(),
}));
jest.mock("@/lib/logger", () => ({
  logger: {
    serverMetric: jest.fn(),
  },
}));

const mockedGetRedisClient = jest.mocked(getRedisClient);
const mockedServerMetric = jest.mocked(logger.serverMetric);
const redis = {
  eval: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
};
const originalVercel = process.env.VERCEL;

function createRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/generate-token", { headers });
}

function enforce(request: Request) {
  return enforceGenerationRateLimit({
    request,
    endpoint: "/api/generate-token",
  });
}

describe("공통 생성 rate limiter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VERCEL = "1";
    mockedGetRedisClient.mockResolvedValue(redis as never);
    redis.eval.mockResolvedValue(1);
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(true);
    redis.del.mockResolvedValue(1);
  });

  afterAll(() => {
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
      return;
    }

    process.env.VERCEL = originalVercel;
  });

  test("Given Vercel이 보장한 유효 IP가 있을 때 When 제한을 확인하면 Then 원 IP가 아닌 고정 길이 해시 key로 5회/60초 정책을 적용한다", async () => {
    // Given
    redis.eval.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const firstRequest = createRequest({
      "x-vercel-forwarded-for": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1",
    });
    const secondRequest = createRequest({
      "x-vercel-forwarded-for": "203.0.113.10",
      "x-forwarded-for": "192.0.2.200",
    });

    // When
    await enforce(firstRequest);
    await enforce(secondRequest);

    // Then
    expect(redis.eval).toHaveBeenCalledTimes(2);
    const [script, firstOptions] = redis.eval.mock.calls[0] as unknown as [
      string,
      { keys: string[]; arguments: string[] },
    ];
    const [, secondOptions] = redis.eval.mock.calls[1] as unknown as [
      string,
      { keys: string[]; arguments: string[] },
    ];
    const firstKey = firstOptions.keys[0];
    const secondKey = secondOptions.keys[0];
    expect(firstKey).toBe(secondKey);
    expect(firstKey).toMatch(/^ratelimit:create:[0-9a-f]{64}$/);
    expect(firstKey).not.toContain("203.0.113.10");
    expect(firstKey).not.toContain("198.51.100.1");
    expect(firstOptions.arguments).toEqual(["60"]);
    expect(script).toContain('redis.call("INCR", KEYS[1])');
    expect(script).toContain('redis.call("EXPIRE", KEYS[1], ARGV[1])');
    expect(script).toContain('redis.call("DEL", KEYS[1])');
    expect(script).toContain('redis.call("TTL", KEYS[1])');
    expect(script).toContain("local needsExpiration = count == 1");
    expect(script).toContain("needsExpiration = currentTtl < 0");
    expect(script).toContain('redis.error_reply("RATE_LIMIT_EXPIRE_FAILED")');
    expect(redis.incr).not.toHaveBeenCalled();
    expect(redis.expire).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
    expect(GENERATION_RATE_LIMIT_POLICY).toEqual({
      maxRequests: 5,
      windowSeconds: 60,
      failureMode: "closed",
    });
  });

  test("Given 비Vercel spoof 또는 부적합한 Vercel IP일 때 When 제한을 확인하면 Then 모두 제한 가능한 고정 fallback bucket을 공유한다", async () => {
    // Given
    process.env.VERCEL = "0";
    const spoofedRequest = createRequest({
      "x-vercel-forwarded-for": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1",
    });
    const otherSpoofedRequest = createRequest({
      "x-vercel-forwarded-for": "192.0.2.10",
      "x-forwarded-for": "198.51.100.2",
    });

    // When
    await enforce(spoofedRequest);
    await enforce(otherSpoofedRequest);
    process.env.VERCEL = "1";
    await enforce(
      createRequest({ "x-vercel-forwarded-for": "203.0.113.10, 10.0.0.1" }),
    );

    // Then
    const keys = redis.eval.mock.calls.map(
      ([, options]) =>
        (options as { keys: string[]; arguments: string[] }).keys[0],
    );
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toMatch(/^ratelimit:create:[0-9a-f]{64}$/);
  });

  test("Given 기존 카운터에 TTL이 없을 때 When Lua 제한 계약을 실행하면 Then 같은 원자 script 안에서 EXPIRE를 복구하고 실패 시 key를 삭제한다", async () => {
    // Given
    redis.eval.mockResolvedValue(2);

    // When
    await enforce(createRequest());

    // Then
    expect(redis.eval).toHaveBeenCalledTimes(1);
    const [script] = redis.eval.mock.calls[0] as unknown as [string];
    expect(script).toContain('local currentTtl = redis.call("TTL", KEYS[1])');
    expect(script).toContain("needsExpiration = currentTtl < 0");
    expect(script).toContain('redis.call("EXPIRE", KEYS[1], ARGV[1])');
    expect(script).toContain('redis.call("DEL", KEYS[1])');
    expect(script).toContain('redis.error_reply("RATE_LIMIT_EXPIRE_FAILED")');
  });

  test("Given 같은 생성 bucket의 여섯 번째 요청일 때 When 제한을 확인하면 Then 429 AppError로 거부한다", async () => {
    // Given
    redis.eval.mockResolvedValue(6);

    // When / Then
    await expect(
      enforce(createRequest({ "x-vercel-forwarded-for": "2001:db8::1234" })),
    ).rejects.toMatchObject({
      code: "RATE_LIMIT_EXCEEDED",
      statusCode: 429,
    });
  });

  test("Given Redis 연결 원문 오류가 발생할 때 When 제한을 확인하면 Then fail-closed 500과 정제된 운영 로그만 남긴다", async () => {
    // Given
    mockedGetRedisClient.mockRejectedValue(
      new Error("REDIS_URL=redis://user:raw-password@example.com"),
    );

    // When / Then
    await expect(enforce(createRequest())).rejects.toMatchObject({
      code: "REDIS_ERROR",
      statusCode: 500,
    });
    expect(mockedServerMetric).toHaveBeenCalledWith(
      "generation_rate_limit_failure",
      {
        endpoint: "/api/generate-token",
        errorCode: "REDIS_RATE_LIMIT_ERROR",
        failureMode: "closed",
      },
    );
    expect(JSON.stringify(mockedServerMetric.mock.calls)).not.toContain(
      "raw-password",
    );
  });

  test.each([
    0,
    -1,
    1.5,
    "1",
    null,
  ])("Given Lua 결과가 유효한 양의 정수가 아닌 %p일 때 When 제한을 확인하면 Then fail-closed 500으로 거부한다", async (invalidResult) => {
    // Given
    redis.eval.mockResolvedValue(invalidResult);

    // When / Then
    await expect(enforce(createRequest())).rejects.toMatchObject({
      code: "REDIS_ERROR",
      statusCode: 500,
    });
    expect(mockedServerMetric).toHaveBeenCalledWith(
      "generation_rate_limit_failure",
      expect.objectContaining({ failureMode: "closed" }),
    );
  });

  test("Given Lua 내부 TTL 설정·복구가 실패할 때 When EVAL이 error reply로 거부되면 Then 영구 key를 허용하지 않고 fail-closed한다", async () => {
    // Given
    redis.eval.mockRejectedValue(new Error("RATE_LIMIT_EXPIRE_FAILED"));

    // When / Then
    await expect(enforce(createRequest())).rejects.toMatchObject({
      code: "REDIS_ERROR",
      statusCode: 500,
    });
    expect(mockedServerMetric).toHaveBeenCalledWith(
      "generation_rate_limit_failure",
      expect.objectContaining({ failureMode: "closed" }),
    );
  });
});

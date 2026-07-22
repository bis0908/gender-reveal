/** @jest-environment node */

const mockUpstashClient = {
  eval: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  get: jest.fn(),
  hset: jest.fn(),
  incr: jest.fn(),
  set: jest.fn(),
  ttl: jest.fn(),
};
const mockUpstashRedis = jest.fn(() => mockUpstashClient);

jest.mock("@upstash/redis", () => ({
  Redis: mockUpstashRedis,
}));

const mockLegacyRedisClient = {
  connect: jest.fn(),
  eval: jest.fn(),
  info: jest.fn(),
  isOpen: true,
  on: jest.fn(),
  set: jest.fn(),
};

jest.mock("redis", () => ({
  createClient: jest.fn(() => mockLegacyRedisClient),
}));

describe("Upstash Redis 어댑터", () => {
  const originalEnvironment = {
    legacyUrl: process.env.REDIS_URL,
    restToken: process.env.UPSTASH_REDIS_URL_KV_REST_API_TOKEN,
    restUrl: process.env.UPSTASH_REDIS_URL_KV_REST_API_URL,
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.UPSTASH_REDIS_URL_KV_REST_API_URL =
      "https://example.upstash.io";
    process.env.UPSTASH_REDIS_URL_KV_REST_API_TOKEN = "test-upstash-token";
    process.env.REDIS_URL = "redis://localhost:6379";
    mockUpstashClient.eval.mockResolvedValue(1);
    mockUpstashClient.set.mockResolvedValue("OK");
    mockLegacyRedisClient.eval.mockResolvedValue(1);
    mockLegacyRedisClient.info.mockResolvedValue("maxmemory_policy:noeviction");
    mockLegacyRedisClient.set.mockResolvedValue("OK");
  });

  afterAll(() => {
    if (originalEnvironment.restUrl === undefined) {
      delete process.env.UPSTASH_REDIS_URL_KV_REST_API_URL;
    } else {
      process.env.UPSTASH_REDIS_URL_KV_REST_API_URL =
        originalEnvironment.restUrl;
    }

    if (originalEnvironment.restToken === undefined) {
      delete process.env.UPSTASH_REDIS_URL_KV_REST_API_TOKEN;
    } else {
      process.env.UPSTASH_REDIS_URL_KV_REST_API_TOKEN =
        originalEnvironment.restToken;
    }

    if (originalEnvironment.legacyUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalEnvironment.legacyUrl;
    }
  });

  test("Given Upstash REST 환경 변수가 있을 때 When 클라이언트를 요청하면 Then REST SDK를 쓰기 토큰으로 초기화한다", async () => {
    // Given
    const { getRedisClient } = await import("@/lib/redis");

    // When
    await getRedisClient();

    // Then
    expect(mockUpstashRedis).toHaveBeenCalledWith({
      enableTelemetry: false,
      token: "test-upstash-token",
      url: "https://example.upstash.io",
    });
  });

  test("Given 기존 SET 옵션이 있을 때 When 값을 저장하면 Then Upstash 옵션 형식으로 변환한다", async () => {
    // Given
    const { getRedisClient } = await import("@/lib/redis");
    const redis = await getRedisClient();

    // When
    const result = await redis.set("reveal:test", "value", {
      EX: 60,
      NX: true,
    });

    // Then
    expect(result).toBe("OK");
    expect(mockUpstashClient.set).toHaveBeenCalledWith("reveal:test", "value", {
      ex: 60,
      nx: true,
    });
  });

  test("Given 생성 요청 제한 Lua가 있을 때 When EVAL을 실행하면 Then 키와 인자를 REST SDK 형식으로 전달한다", async () => {
    // Given
    const { getRedisClient } = await import("@/lib/redis");
    const redis = await getRedisClient();
    const script = "return redis.call('INCR', KEYS[1])";

    // When
    const result = await redis.eval(script, {
      arguments: ["60"],
      keys: ["ratelimit:create:test"],
    });

    // Then
    expect(result).toBe(1);
    expect(mockUpstashClient.eval).toHaveBeenCalledWith(
      script,
      ["ratelimit:create:test"],
      ["60"],
    );
  });
});

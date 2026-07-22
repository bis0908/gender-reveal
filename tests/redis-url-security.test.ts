/**
 * @jest-environment node
 */

const mockRedisClient = {
  isOpen: false,
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue("maxmemory_policy:noeviction"),
  on: jest.fn(),
};

const mockCreateClient = jest.fn(() => mockRedisClient);
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

jest.mock("redis", () => ({
  createClient: mockCreateClient,
}));

jest.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

describe("Redis URL 전송 보안", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
      return;
    }

    process.env.REDIS_URL = originalRedisUrl;
  });

  test("Given 원격 redis URL일 때 When 클라이언트를 요청하면 Then 생성 전에 연결을 거부한다", async () => {
    // Given
    process.env.REDIS_URL = "redis://cache.example.com:6379";
    const { getRedisClient } = await import("@/lib/redis");

    // When
    const requestClient = getRedisClient();

    // Then
    await expect(requestClient).rejects.toThrow(
      "원격 Redis 연결에는 TLS가 적용된 rediss:// URL이 필요합니다.",
    );
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  test("Given 원격 rediss URL일 때 When 클라이언트를 요청하면 Then TLS URL로 생성한다", async () => {
    // Given
    const redisUrl = "rediss://cache.example.com:6379";
    process.env.REDIS_URL = redisUrl;
    const { getRedisClient } = await import("@/lib/redis");

    // When
    await getRedisClient();

    // Then
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ url: redisUrl }),
    );
  });

  test.each([
    ["localhost", "redis://localhost:6379"],
    ["IPv4", "redis://127.0.0.1:6379"],
    ["IPv6", "redis://[::1]:6379"],
  ])("Given %s 루프백 redis URL일 때 When 클라이언트를 요청하면 Then 개발 연결을 허용한다", async (_loopbackType, redisUrl) => {
    // Given
    process.env.REDIS_URL = redisUrl;
    const { getRedisClient } = await import("@/lib/redis");

    // When
    await getRedisClient();

    // Then
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ url: redisUrl }),
    );
  });
});

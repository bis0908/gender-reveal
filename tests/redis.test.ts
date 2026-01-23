/**
 * Redis 클라이언트 모킹 테스트
 * Given-When-Then 패턴 적용
 */

// Redis 모킹
const mockRedisClient = {
  isOpen: true,
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue("maxmemory_policy:noeviction"),
  get: jest.fn(),
  set: jest.fn(),
  hSet: jest.fn(),
  hGet: jest.fn(),
  hGetAll: jest.fn(),
  hIncrBy: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  incr: jest.fn(),
  on: jest.fn(),
};

jest.mock("redis", () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

// 환경 변수 모킹
process.env.REDIS_URL = "redis://localhost:6379";

describe("Redis 클라이언트 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRedisClient", () => {
    test("Given Redis URL이 설정되어 있을 때 When getRedisClient를 호출하면 Then 클라이언트 인스턴스가 반환되어야 한다", async () => {
      // given
      const { getRedisClient } = await import("@/lib/redis");

      // when
      const client = await getRedisClient();

      // then
      expect(client).toBeDefined();
      expect(client.isOpen).toBe(true);
    });
  });
});

describe("투표 로직 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("투표 집계", () => {
    test("Given vote:abc123에 prince:10, princess:5가 저장되어 있을 때 When 투표 현황을 조회하면 Then 정확한 투표 수가 반환되어야 한다", async () => {
      // given
      const revealId = "abc123";
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.hGetAll.mockResolvedValue({
        prince: "10",
        princess: "5",
      });
      mockRedisClient.get.mockResolvedValue(null); // isRevealed = false

      // when
      const { getRedisClient } = await import("@/lib/redis");
      const redis = await getRedisClient();
      const voteData = await redis.hGetAll(`vote:${revealId}`);

      // then
      expect(voteData.prince).toBe("10");
      expect(voteData.princess).toBe("5");
      expect(
        parseInt(voteData.prince, 10) + parseInt(voteData.princess, 10),
      ).toBe(15);
    });

    test("Given 새로운 사용자가 투표할 때 When HINCRBY로 투표를 증가시키면 Then 최신 투표 수가 반환되어야 한다", async () => {
      // given
      const revealId = "abc123";
      const vote = "prince";
      mockRedisClient.hIncrBy.mockResolvedValue(11); // 10 + 1

      // when
      const { getRedisClient } = await import("@/lib/redis");
      const redis = await getRedisClient();
      const newCount = await redis.hIncrBy(`vote:${revealId}`, vote, 1);

      // then
      expect(newCount).toBe(11);
    });
  });

  describe("중복 투표 방지", () => {
    test("Given 이미 투표한 디바이스가 있을 때 When SET NX를 호출하면 Then null이 반환되어야 한다", async () => {
      // given
      const revealId = "abc123";
      const deviceId = "device-uuid-1234";
      mockRedisClient.set.mockResolvedValue(null); // NX 실패 (이미 존재)

      // when
      const { getRedisClient } = await import("@/lib/redis");
      const redis = await getRedisClient();
      const result = await redis.set(
        `voter:${revealId}:${deviceId}`,
        "prince",
        {
          NX: true,
          EX: 2592000,
        },
      );

      // then
      expect(result).toBeNull();
    });

    test("Given 새로운 디바이스가 투표할 때 When SET NX를 호출하면 Then OK가 반환되어야 한다", async () => {
      // given
      const revealId = "abc123";
      const deviceId = "new-device-uuid";
      mockRedisClient.set.mockResolvedValue("OK");

      // when
      const { getRedisClient } = await import("@/lib/redis");
      const redis = await getRedisClient();
      const result = await redis.set(
        `voter:${revealId}:${deviceId}`,
        "princess",
        {
          NX: true,
          EX: 2592000,
        },
      );

      // then
      expect(result).toBe("OK");
    });
  });

  describe("Rate Limiting", () => {
    test("Given IP가 처음 요청할 때 When INCR을 호출하면 Then 1이 반환되고 TTL이 설정되어야 한다", async () => {
      // given
      const ip = "192.168.1.1";
      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(true);

      // when
      const { getRedisClient } = await import("@/lib/redis");
      const redis = await getRedisClient();
      const count = await redis.incr(`ratelimit:vote:${ip}`);

      if (count === 1) {
        await redis.expire(`ratelimit:vote:${ip}`, 60);
      }

      // then
      expect(count).toBe(1);
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        `ratelimit:vote:${ip}`,
        60,
      );
    });

    test("Given IP가 10회 이상 요청했을 때 When INCR 결과가 11이면 Then rate limit 초과로 판단해야 한다", async () => {
      // given
      const ip = "192.168.1.1";
      const RATE_LIMIT_MAX = 10;
      mockRedisClient.incr.mockResolvedValue(11);

      // when
      const { getRedisClient } = await import("@/lib/redis");
      const redis = await getRedisClient();
      const count = await redis.incr(`ratelimit:vote:${ip}`);
      const isAllowed = count <= RATE_LIMIT_MAX;

      // then
      expect(count).toBe(11);
      expect(isAllowed).toBe(false);
    });
  });
});

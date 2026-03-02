/**
 * D-Day 투표 API 서버 식별 기반 중복 방지 테스트
 * Given-When-Then 패턴 적용
 */

import { POST as votePost } from "@/app/api/dday/vote/route";
import { getRedisClient } from "@/lib/redis";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => body,
      cookies: {
        set: jest.fn(),
      },
    }),
  },
}));

jest.mock("@/lib/redis", () => ({
  getRedisClient: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRedisClient = {
  incr: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  get: jest.fn(),
  ttl: jest.fn(),
  set: jest.fn(),
  hIncrBy: jest.fn(),
  hGet: jest.fn(),
};

function createMockRequest(
  body: Record<string, unknown>,
  options: {
    ip?: string;
    voterCookie?: string;
  } = {},
): Request {
  if (!body || Object.keys(body).length === 0) {
    throw new Error("요청 본문은 비어 있을 수 없습니다.");
  }

  const ip = options.ip || "203.0.113.10";

  return {
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    headers: {
      get: jest.fn((key: string) => {
        if (key.toLowerCase() === "x-forwarded-for") {
          return ip;
        }
        return null;
      }),
    },
    cookies: {
      get: jest.fn((name: string) => {
        if (name !== "gr-voter-id" || !options.voterCookie) {
          return undefined;
        }
        return { name, value: options.voterCookie };
      }),
    },
  } as unknown as Request;
}

describe("D-Day 투표 API 서버 식별 기반 중복 방지", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient);

    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(true);
    mockRedisClient.exists.mockResolvedValue(1);
    mockRedisClient.ttl.mockResolvedValue(3600);
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.hIncrBy.mockResolvedValue(1);
    mockRedisClient.hGet.mockResolvedValue("0");
    mockRedisClient.get.mockResolvedValue(null);
  });

  test("Given 서버 식별 쿠키가 없을 때 When 첫 투표를 제출하면 Then HttpOnly 쿠키를 발급해야 한다", async () => {
    // Given
    const request = createMockRequest({
      revealId: "reveal123",
      vote: "prince",
      deviceId: "11111111-1111-4111-8111-111111111111",
    });

    // When
    const response = await votePost(request as never);
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(response.cookies.set).toHaveBeenCalledTimes(1);

    const cookieConfig = (response.cookies.set as jest.Mock).mock
      .calls[0][0] as Record<string, unknown>;

    expect(cookieConfig.name).toBe("gr-voter-id");
    expect(cookieConfig.httpOnly).toBe(true);
    expect(cookieConfig.sameSite).toBe("lax");
    expect(cookieConfig.path).toBe("/");
    expect(typeof cookieConfig.value).toBe("string");
    expect((cookieConfig.value as string).length).toBeGreaterThan(0);

    expect(mockRedisClient.set).toHaveBeenCalledWith(
      `voter:reveal123:${cookieConfig.value as string}`,
      "prince",
      expect.objectContaining({ NX: true, EX: 3600 }),
    );
  });

  test("Given 동일 서버 식별 쿠키를 가진 요청에서 deviceId를 변경할 때 When 재투표를 제출하면 Then ALREADY_VOTED가 반환되어야 한다", async () => {
    // Given
    const voterCookie = "22222222-2222-4222-8222-222222222222";
    mockRedisClient.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("prince");

    const firstRequest = createMockRequest(
      {
        revealId: "reveal123",
        vote: "prince",
        deviceId: "33333333-3333-4333-8333-333333333333",
      },
      { voterCookie },
    );

    const secondRequest = createMockRequest(
      {
        revealId: "reveal123",
        vote: "princess",
        deviceId: "44444444-4444-4444-8444-444444444444",
      },
      { voterCookie },
    );

    // When
    const firstResponse = await votePost(firstRequest as never);
    const secondResponse = await votePost(secondRequest as never);
    const secondBody = await secondResponse.json();

    // Then
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(400);
    expect(secondBody.error.code).toBe("ALREADY_VOTED");
    expect(secondBody.success).toBe(false);
    expect(mockRedisClient.get).toHaveBeenNthCalledWith(
      1,
      `voter:reveal123:${voterCookie}`,
    );
    expect(mockRedisClient.get).toHaveBeenNthCalledWith(
      2,
      `voter:reveal123:${voterCookie}`,
    );
  });
});


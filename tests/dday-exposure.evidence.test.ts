/**
 * D-Day 생성 API 보안 정책 테스트
 * Given-When-Then 패턴 적용
 */

import * as jose from "jose";
import { POST as createDdayPost } from "@/app/api/dday/create/route";
import { getRedisClient } from "@/lib/redis";
import { ddayCreateSchema } from "@/lib/schemas/dday-schema";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
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
  hSet: jest.fn(),
  set: jest.fn(),
};

function createMockRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Request {
  if (!body || Object.keys(body).length === 0) {
    throw new Error("요청 본문은 비어 있을 수 없습니다.");
  }

  return {
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    headers: {
      get: jest.fn((key: string) => headers[key.toLowerCase()] || null),
    },
  } as unknown as Request;
}

describe("D-Day 생성 API 보안 정책", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient);
    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(true);
    mockRedisClient.exists.mockResolvedValue(0);
    mockRedisClient.hSet.mockResolvedValue(1);
    mockRedisClient.set.mockResolvedValue("OK");
  });

  test("Given D-day 예약 생성 요청이 있을 때 When 토큰을 디코드하면 Then 민감정보가 포함되지 않아야 한다", async () => {
    // Given
    const scheduledAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const request = createMockRequest(
      {
        motherName: "엄마",
        fatherName: "아빠",
        babyName: "복덩이",
        gender: "boy",
        animationType: "confetti",
        countdownTime: 5,
        isMultiple: false,
        scheduledAt,
      },
      {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.10",
      },
    );

    // When
    const response = await createDdayPost(request);
    const body = await response.json();
    const decodedCountdown = jose.decodeJwt(body.countdownToken) as Record<
      string,
      unknown
    >;
    const decodedReveal = jose.decodeJwt(body.revealToken) as Record<
      string,
      unknown
    >;

    // Then
    expect(response.status).toBe(200);
    expect(decodedCountdown.revealId).toBe("reveal123");
    expect(decodedCountdown.type).toBe("countdown");
    expect(decodedReveal.revealId).toBe("reveal123");
    expect(decodedReveal.type).toBe("reveal");

    expect(decodedCountdown.gender).toBeUndefined();
    expect(decodedCountdown.motherName).toBeUndefined();
    expect(decodedCountdown.fatherName).toBeUndefined();
    expect(decodedCountdown.babiesInfo).toBeUndefined();

    expect(decodedReveal.gender).toBeUndefined();
    expect(decodedReveal.motherName).toBeUndefined();
    expect(decodedReveal.fatherName).toBeUndefined();
    expect(decodedReveal.babiesInfo).toBeUndefined();
  });

  test("Given D-day 예약 생성 요청이 있을 때 When API를 호출하면 Then 공개 데이터가 Redis에 저장되고 TTL이 적용되어야 한다", async () => {
    // Given
    const scheduledAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const request = createMockRequest(
      {
        motherName: "엄마",
        fatherName: "아빠",
        babyName: "복덩이",
        gender: "boy",
        animationType: "confetti",
        countdownTime: 5,
        isMultiple: false,
        scheduledAt,
      },
      {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.10",
      },
    );

    // When
    const response = await createDdayPost(request);

    // Then
    expect(response.status).toBe(200);
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      "reveal:reveal123:data",
      expect.any(String),
      expect.objectContaining({ EX: expect.any(Number) }),
    );
  });

  test("Given 스키마 우회로 과거 예약 시간이 전달될 때 When API를 호출하면 Then 만료된 예약 시간 에러를 반환해야 한다", async () => {
    // Given
    const expiredScheduledAt = new Date(
      Date.now() - 31 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const safeParseSpy = jest
      .spyOn(ddayCreateSchema, "safeParse")
      .mockReturnValue({
        success: true,
        data: {
          motherName: "엄마",
          fatherName: "아빠",
          babyName: "복덩이",
          gender: "boy",
          animationType: "confetti",
          countdownTime: 5,
          isMultiple: false,
          scheduledAt: expiredScheduledAt,
        },
      } as never);

    const request = createMockRequest(
      {
        motherName: "엄마",
        fatherName: "아빠",
        babyName: "복덩이",
        gender: "boy",
        animationType: "confetti",
        countdownTime: 5,
        isMultiple: false,
        scheduledAt: expiredScheduledAt,
      },
      {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.10",
      },
    );

    try {
      // When
      const response = await createDdayPost(request);
      const body = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(body.error.message).toContain("예약 시간이 만료");
      expect(mockRedisClient.hSet).not.toHaveBeenCalled();
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    } finally {
      safeParseSpy.mockRestore();
    }
  });
});

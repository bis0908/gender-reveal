/**
 * verify-token D-Day 공개 게이트 테스트
 * Given-When-Then 패턴 적용
 */

import * as jose from "jose";
import { POST as verifyTokenPost } from "@/app/api/verify-token/route";
import { getEncodedSecret } from "@/lib/env.server";
import { getRedisClient } from "@/lib/redis";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => body,
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
  get: jest.fn(),
  set: jest.fn(),
  ttl: jest.fn(),
};

function createMockRequest(body: Record<string, unknown>): Request {
  if (!body || Object.keys(body).length === 0) {
    throw new Error("요청 본문은 비어 있을 수 없습니다.");
  }

  return {
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    headers: {
      get: jest.fn(() => null),
    },
  } as unknown as Request;
}

async function createToken(
  payload: Record<string, unknown>,
  exp: string = "30d",
): Promise<string> {
  if (!payload || Object.keys(payload).length === 0) {
    throw new Error("토큰 payload는 비어 있을 수 없습니다.");
  }

  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(getEncodedSecret());
}

describe("verify-token D-Day 공개 게이트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient);
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.ttl.mockResolvedValue(3600);
  });

  test("Given countdown 목적 검증 요청일 때 When verify-token을 호출하면 Then 안전 필드만 반환되어야 한다", async () => {
    // Given
    const scheduledAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();
    const token = await createToken({
      revealId: "reveal123",
      type: "countdown",
    });
    mockRedisClient.get.mockResolvedValue(
      JSON.stringify({
        motherName: "엄마",
        fatherName: "아빠",
        babyName: "복덩이",
        gender: "boy",
        animationType: "confetti",
        countdownTime: 5,
        scheduledAt,
        revealId: "reveal123",
      }),
    );
    const request = createMockRequest({ token, purpose: "countdown" });

    // When
    const response = await verifyTokenPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.data.babyName).toBe("복덩이");
    expect(body.data.scheduledAt).toBe(scheduledAt);
    expect(body.data.revealId).toBe("reveal123");
    expect(body.data.type).toBe("countdown");
    expect(body.data.gender).toBeUndefined();
    expect(body.data.motherName).toBeUndefined();
  });

  test("Given reveal 목적 요청이고 공개 시점 전일 때 When verify-token을 호출하면 Then 403이 반환되어야 한다", async () => {
    // Given
    const scheduledAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();
    const token = await createToken({
      revealId: "reveal123",
      type: "reveal",
    });
    mockRedisClient.get.mockResolvedValue(
      JSON.stringify({
        motherName: "엄마",
        fatherName: "아빠",
        babyName: "복덩이",
        gender: "boy",
        animationType: "confetti",
        countdownTime: 5,
        scheduledAt,
        revealId: "reveal123",
      }),
    );
    const request = createMockRequest({ token, purpose: "reveal" });

    // When
    const response = await verifyTokenPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  test("Given reveal 목적 요청이고 공개 시점 후일 때 When verify-token을 호출하면 Then 공개 데이터가 반환되어야 한다", async () => {
    // Given
    const scheduledAt = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const token = await createToken({
      revealId: "reveal123",
      type: "reveal",
    });
    mockRedisClient.get.mockResolvedValue(
      JSON.stringify({
        motherName: "엄마",
        fatherName: "아빠",
        babyName: "복덩이",
        gender: "boy",
        animationType: "confetti",
        countdownTime: 5,
        scheduledAt,
        revealId: "reveal123",
      }),
    );
    const request = createMockRequest({ token, purpose: "reveal" });

    // When
    const response = await verifyTokenPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.data.gender).toBe("boy");
    expect(body.data.motherName).toBe("엄마");
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      "reveal:reveal123:revealed",
      "true",
      expect.objectContaining({ EX: expect.any(Number) }),
    );
  });

  test("Given legacy 토큰이고 공개 시점 전일 때 When verify-token을 호출하면 Then 하위 호환 경로에서도 403이 반환되어야 한다", async () => {
    // Given
    const scheduledAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();
    const legacyToken = await createToken({
      motherName: "엄마",
      fatherName: "아빠",
      babyName: "복덩이",
      gender: "boy",
      animationType: "confetti",
      countdownTime: 5,
      scheduledAt,
      revealId: "legacy123",
    });
    mockRedisClient.get.mockResolvedValue(null);
    const request = createMockRequest({ token: legacyToken, purpose: "reveal" });

    // When
    const response = await verifyTokenPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  test("Given countdown 토큰일 때 When reveal 목적으로 verify-token을 호출하면 Then 403이 반환되어야 한다", async () => {
    // Given
    const scheduledAt = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const token = await createToken({
      revealId: "reveal123",
      type: "countdown",
    });
    mockRedisClient.get.mockResolvedValue(
      JSON.stringify({
        motherName: "엄마",
        fatherName: "아빠",
        babyName: "복덩이",
        gender: "boy",
        animationType: "confetti",
        countdownTime: 5,
        scheduledAt,
        revealId: "reveal123",
      }),
    );
    const request = createMockRequest({ token, purpose: "reveal" });

    // When
    const response = await verifyTokenPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});

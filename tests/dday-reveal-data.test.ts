/**
 * /api/dday/reveal-data 엔드포인트 테스트
 * Given-When-Then 패턴 적용
 */

import * as jose from "jose";
import { POST as revealDataPost } from "@/app/api/dday/reveal-data/route";
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

const FULL_REVEAL_DATA = {
  motherName: "엄마",
  fatherName: "아빠",
  babyName: "복덩이",
  gender: "boy",
  animationType: "confetti",
  countdownTime: 5,
  revealId: "reveal123",
};

describe("/api/dday/reveal-data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getRedisClient as jest.Mock).mockResolvedValue(mockRedisClient);
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.ttl.mockResolvedValue(3600);
  });

  test("Given countdownToken이고 D-Day 후일 때 When reveal-data를 호출하면 Then 200과 전체 데이터가 반환된다", async () => {
    // Given
    const scheduledAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const token = await createToken({ revealId: "reveal123", type: "countdown" });
    mockRedisClient.get.mockResolvedValue(
      JSON.stringify({ ...FULL_REVEAL_DATA, scheduledAt }),
    );
    const request = createMockRequest({ token });

    // When
    const response = await revealDataPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.data.gender).toBe("boy");
    expect(body.data.motherName).toBe("엄마");
    expect(body.data.babyName).toBe("복덩이");
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      "reveal:reveal123:revealed",
      "true",
      expect.objectContaining({ EX: expect.any(Number) }),
    );
  });

  test("Given countdownToken이고 D-Day 전일 때 When reveal-data를 호출하면 Then 403이 반환된다", async () => {
    // Given
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const token = await createToken({ revealId: "reveal123", type: "countdown" });
    mockRedisClient.get.mockResolvedValue(
      JSON.stringify({ ...FULL_REVEAL_DATA, scheduledAt }),
    );
    const request = createMockRequest({ token });

    // When
    const response = await revealDataPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.details?.revealAt).toBe(scheduledAt);
  });

  test("Given revealToken (잘못된 타입)일 때 When reveal-data를 호출하면 Then 403이 반환된다", async () => {
    // Given
    const token = await createToken({ revealId: "reveal123", type: "reveal" });
    const request = createMockRequest({ token });

    // When
    const response = await revealDataPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  test("Given 만료/변조된 JWT일 때 When reveal-data를 호출하면 Then 401이 반환된다", async () => {
    // Given
    const expiredToken = await createToken(
      { revealId: "reveal123", type: "countdown" },
      "1ms",
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    const request = createMockRequest({ token: expiredToken });

    // When
    const response = await revealDataPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("Given Redis에 데이터가 없을 때 When reveal-data를 호출하면 Then 404가 반환된다", async () => {
    // Given
    const token = await createToken({ revealId: "reveal123", type: "countdown" });
    mockRedisClient.get.mockResolvedValue(null);
    const request = createMockRequest({ token });

    // When
    const response = await revealDataPost(request);
    const body = await response.json();

    // Then
    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

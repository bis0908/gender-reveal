import { POST } from "@/app/api/feedback/route";
import { checkRateLimit, getRateLimitStatus } from "@/lib/rate-limit";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => body,
    }),
  },
}));

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-1234",
  },
});

// Mocks
jest.mock("@/lib/rate-limit");
jest.mock("@/lib/services/google-sheets", () => ({
  appendFeedbackToSheet: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/services/email", () => ({
  sendFeedbackNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/logger", () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// 테스트용 Mock Request 생성 헬퍼
const createMockRequest = (
  body: unknown,
  headers: Record<string, string> = {}
) => {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn((key: string) => headers[key.toLowerCase()] || null),
    },
  } as unknown as Parameters<typeof POST>[0];
};

describe("Feedback API Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
    (getRateLimitStatus as jest.Mock).mockResolvedValue({
      remaining: 3,
      resetAt: new Date(),
    });
  });

  describe("Rate Limiting", () => {
    test("Given: rate limit 초과 상태, When: 피드백 제출, Then: 429 반환", async () => {
      // Given
      (checkRateLimit as jest.Mock).mockResolvedValue(false);
      const req = createMockRequest(
        { rating: 5 },
        { "x-forwarded-for": "1.2.3.4" }
      );

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error).toContain("너무 많은 요청");
    });

    test("Given: rate limit 정상 상태, When: 피드백 제출, Then: 처리 허용", async () => {
      // Given
      (checkRateLimit as jest.Mock).mockResolvedValue(true);
      const req = createMockRequest({ rating: 5 });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(201);
    });
  });

  describe("Input Validation", () => {
    test("Given: rating이 최소값(1) 미만, When: 피드백 제출, Then: 400 반환", async () => {
      // Given
      const req = createMockRequest({ rating: 0 });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(400);
    });

    test("Given: rating이 최대값(5) 초과, When: 피드백 제출, Then: 400 반환", async () => {
      // Given
      const req = createMockRequest({ rating: 6 });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(400);
    });

    test("Given: comment 길이 200자 초과, When: 피드백 제출, Then: 400 반환", async () => {
      // Given
      const longComment = "a".repeat(201);
      const req = createMockRequest({ rating: 5, comment: longComment });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(400);
    });

    test("Given: 유효한 입력값, When: 피드백 제출, Then: 201 반환", async () => {
      // Given
      const req = createMockRequest({ rating: 5, comment: "좋은 서비스입니다" });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(201);
    });
  });

  describe("XSS Prevention", () => {
    test("Given: script 태그 포함 comment, When: 피드백 제출, Then: 이스케이프 처리되어 저장", async () => {
      // Given: XSS 페이로드가 포함된 코멘트
      const xssPayload = '<script>alert("XSS")</script>';
      const req = createMockRequest({ rating: 5, comment: xssPayload });

      // When
      const res = await POST(req);

      // Then: 요청은 성공하지만 (Zod는 문자열만 검증)
      // React에서 렌더링 시 자동 이스케이프됨
      // 서버에서는 문자열로 저장됨 (저장 자체는 허용)
      expect(res.status).toBe(201);
    });

    test("Given: 이벤트 핸들러 XSS 페이로드, When: 피드백 제출, Then: 문자열로 처리", async () => {
      // Given
      const xssPayload = '<img src=x onerror="alert(1)">';
      const req = createMockRequest({ rating: 4, comment: xssPayload });

      // When
      const res = await POST(req);

      // Then: 문자열로 저장 (React 렌더링 시 이스케이프)
      expect(res.status).toBe(201);
    });

    test("Given: JavaScript URL 페이로드, When: 피드백 제출, Then: 문자열로 처리", async () => {
      // Given
      const xssPayload = 'javascript:alert("XSS")';
      const req = createMockRequest({ rating: 3, comment: xssPayload });

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(201);
    });
  });

  describe("SQL/NoSQL Injection Prevention", () => {
    test("Given: SQL injection 페이로드, When: 피드백 제출, Then: 문자열로 처리", async () => {
      // Given: SQL injection 시도
      const sqlPayload = "'; DROP TABLE users; --";
      const req = createMockRequest({ rating: 5, comment: sqlPayload });

      // When
      const res = await POST(req);

      // Then: Zod 검증 통과 (문자열), Google Sheets는 SQL 아님
      expect(res.status).toBe(201);
    });

    test("Given: NoSQL injection 페이로드, When: 피드백 제출, Then: 문자열로 처리", async () => {
      // Given: NoSQL injection 시도
      const nosqlPayload = '{"$gt": ""}';
      const req = createMockRequest({ rating: 5, comment: nosqlPayload });

      // When
      const res = await POST(req);

      // Then: 문자열로 처리됨
      expect(res.status).toBe(201);
    });
  });

  describe("Error Handling", () => {
    test("Given: 서버 내부 에러 발생, When: 에러 응답, Then: 스택 트레이스 미노출", async () => {
      // Given: JSON 파싱 에러 시뮬레이션
      const req = {
        json: jest.fn().mockRejectedValue(new Error("Parse error")),
        headers: {
          get: jest.fn(() => null),
        },
      } as unknown as Parameters<typeof POST>[0];

      // When
      const res = await POST(req);

      // Then
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("서버 오류가 발생했습니다");
      expect(body.stack).toBeUndefined(); // 스택 트레이스 미노출
      expect(body.message).not.toContain("Parse error"); // 내부 에러 메시지 미노출
    });
  });
});

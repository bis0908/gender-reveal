import { NextRequest, NextResponse } from "next/server";
import { feedbackFormSchema } from "@/lib/schemas/feedback-schema";
import { appendFeedbackToSheet } from "@/lib/services/google-sheets";
import { sendFeedbackNotification } from "@/lib/services/email";
import { checkRateLimit, getRateLimitStatus } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import type { FeedbackData } from "@/lib/schemas/feedback-schema";

/**
 * 클라이언트 IP 주소 추출
 */
function getClientIp(request: NextRequest): string {
  // Vercel/프록시 환경에서 실제 IP 추출
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // 로컬 개발 환경
  return "127.0.0.1";
}

/**
 * 한국 시간(KST) 문자열 생성
 */
function getKSTTimestamp(): string {
  return new Date()
    .toLocaleString("sv-SE", {
      timeZone: "Asia/Seoul",
    })
    .replace("T", " ");
}

/**
 * POST /api/feedback
 * 피드백 제출 처리
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const context = { requestId, path: "/api/feedback", method: "POST" };

  try {
    // 1. Rate limiting 체크
    const clientIp = getClientIp(request);
    
    // Async check for rate limit (Redis support)
    const isAllowed = await checkRateLimit(clientIp);

    if (!isAllowed) {
      const status = await getRateLimitStatus(clientIp);
      logger.warn("Rate limit exceeded", { ...context, clientIp });
      
      return NextResponse.json(
        {
          error: "너무 많은 요청을 보냈습니다",
          message: `잠시 후 다시 시도해주세요. (리셋: ${status.resetAt?.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})`,
        },
        { status: 429 },
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();

    // 3. Zod 스키마 검증
    const validationResult = feedbackFormSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Validation failed", { ...context, errors: validationResult.error.flatten() });
      return NextResponse.json(
        {
          error: "입력값이 올바르지 않습니다",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { rating, comment } = validationResult.data;

    // 4. 서버 메타데이터 추가
    const feedbackData: FeedbackData = {
      rating,
      comment: comment || "",
      userAgent: request.headers.get("user-agent") || "",
      pageUrl: request.headers.get("referer") || "",
      timestamp: getKSTTimestamp(),
    };

    // 5. Google Sheets 저장 및 이메일 발송 (병렬 처리)
    logger.info("Processing feedback submission", context);
    
    const [sheetsResult, emailResult] = await Promise.allSettled([
      appendFeedbackToSheet(feedbackData),
      sendFeedbackNotification(feedbackData),
    ]);

    // 6. 결과 확인
    const errors: string[] = [];

    if (sheetsResult.status === "rejected") {
      logger.error("Google Sheets save failed", context, sheetsResult.reason as Error);
      errors.push("피드백 저장 실패");
    }

    if (emailResult.status === "rejected") {
      logger.error("Email notification failed", context, emailResult.reason as Error);
      errors.push("이메일 알림 실패");
    }

    // 7. 응답 반환
    if (errors.length > 0) {
      // 부분 실패 (최소 하나는 성공)
      return NextResponse.json(
        {
          success: true,
          message: "피드백이 제출되었습니다",
          warnings: errors,
        },
        { status: 207 }, // Multi-Status
      );
    }

    // 완전 성공
    logger.info("Feedback submitted successfully", context);
    return NextResponse.json(
      {
        success: true,
        message: "피드백이 성공적으로 제출되었습니다",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Server error processing feedback", context, error as Error);

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다",
        message: "잠시 후 다시 시도해주세요",
      },
      { status: 500 },
    );
  }
}
import { Resend } from "resend";
import type { FeedbackData } from "@/lib/schemas/feedback-schema";

/**
 * Resend 클라이언트 초기화
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY 환경 변수가 설정되지 않았습니다");
  }

  return new Resend(apiKey);
}

/**
 * 관리자에게 피드백 알림 이메일 발송
 *
 * @param data - 피드백 데이터
 * @throws Resend API 오류
 */
export async function sendFeedbackNotification(
  data: FeedbackData,
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL 환경 변수가 설정되지 않았습니다");
  }

  const resend = getResendClient();

  // 별점을 별 이모지로 표시
  const stars = "⭐".repeat(data.rating);
  const emptyStars = "☆".repeat(5 - data.rating);

  try {
    await resend.emails.send({
      from: "Gender Reveal Feedback <onboarding@resend.dev>",
      to: adminEmail,
      subject: `[Gender Reveal] 새 피드백 도착: ${stars}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 30px;
              }
              .rating {
                font-size: 32px;
                margin: 10px 0;
              }
              .content {
                background: #f9fafb;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .field {
                margin-bottom: 15px;
              }
              .label {
                font-weight: 600;
                color: #6b7280;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .value {
                margin-top: 5px;
                font-size: 16px;
                color: #111827;
              }
              .comment {
                background: white;
                padding: 15px;
                border-left: 4px solid #667eea;
                border-radius: 4px;
                font-style: italic;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0 0 10px 0;">🎉 새로운 피드백 도착!</h1>
              <div class="rating">${stars}${emptyStars}</div>
              <p style="margin: 0; opacity: 0.9;">${data.rating}/5점</p>
            </div>

            <div class="content">
              <div class="field">
                <div class="label">제출 시간</div>
                <div class="value">${data.timestamp}</div>
              </div>

              ${
                data.comment
                  ? `
                <div class="field">
                  <div class="label">코멘트</div>
                  <div class="value">
                    <div class="comment">${data.comment}</div>
                  </div>
                </div>
              `
                  : ""
              }

              <div class="field">
                <div class="label">페이지</div>
                <div class="value">${data.pageUrl || "(알 수 없음)"}</div>
              </div>

              <div class="field">
                <div class="label">브라우저</div>
                <div class="value" style="font-size: 12px; color: #6b7280;">
                  ${data.userAgent || "(알 수 없음)"}
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Gender Reveal 피드백 시스템</p>
              <p style="margin: 5px 0 0 0;">
                <a href="https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SPREADSHEET_ID}"
                   style="color: #667eea; text-decoration: none;">
                  📊 Google Sheets에서 모든 피드백 보기
                </a>
              </p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("이메일 발송 실패:", error);
    throw new Error("피드백 알림 이메일 발송에 실패했습니다");
  }
}

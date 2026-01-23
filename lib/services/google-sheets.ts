import { google } from "googleapis";
import type { FeedbackData } from "@/lib/schemas/feedback-schema";

/**
 * Google Sheets API 인증 설정
 */
function getGoogleAuth() {
  const credentials = {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("Google Sheets 환경 변수가 설정되지 않았습니다");
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/**
 * 피드백 데이터를 Google Sheets에 추가
 *
 * @param data - 피드백 데이터
 * @throws Google Sheets API 오류
 */
export async function appendFeedbackToSheet(data: FeedbackData): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SPREADSHEET_ID 환경 변수가 설정되지 않았습니다");
  }

  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Google Sheets에 추가할 행 데이터
  // 헤더 순서: Timestamp (KST) | Rating | Comment | User Agent | Page URL
  const rowData = [
    data.timestamp,
    data.rating,
    data.comment || "",
    data.userAgent || "",
    data.pageUrl || "",
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Creator Feedback!A:E", // A부터 E까지 5개 컬럼
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });
  } catch (error) {
    console.error("Google Sheets 저장 실패:", error);
    throw new Error("피드백 저장에 실패했습니다");
  }
}

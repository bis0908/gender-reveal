import * as z from "zod";

/**
 * 클라이언트에서 전송하는 피드백 데이터 스키마
 */
export const feedbackFormSchema = z.object({
  rating: z
    .number()
    .int("별점은 정수여야 합니다")
    .min(1, "최소 1점을 선택해주세요")
    .max(5, "최대 5점까지 선택 가능합니다"),
  comment: z
    .string()
    .max(200, "코멘트는 최대 200자까지 입력 가능합니다")
    .optional()
    .or(z.literal("")),
});

/**
 * 서버에서 처리하는 전체 피드백 데이터 스키마
 * (클라이언트 데이터 + 서버 메타데이터)
 */
export const feedbackDataSchema = feedbackFormSchema.extend({
  userAgent: z.string().optional(),
  pageUrl: z.string().optional(),
  timestamp: z.string(), // KST 형식 문자열
});

/**
 * Google Sheets에 저장되는 피드백 데이터 타입
 */
export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;
export type FeedbackData = z.infer<typeof feedbackDataSchema>;

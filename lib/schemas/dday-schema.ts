/**
 * D-Day 예약 및 투표 기능을 위한 Zod 스키마
 */

import * as z from "zod";

// 아기 정보 스키마 (기존 스키마 재사용)
const babyInfoSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(["boy", "girl"]),
});

/**
 * D-Day 생성 요청 스키마
 */
export const ddayCreateSchema = z.object({
  // 기존 RevealData 필드들
  motherName: z.string().min(1, "엄마 이름을 입력해주세요"),
  fatherName: z.string().min(1, "아빠 이름을 입력해주세요"),
  babyName: z.string().min(1, "태명을 입력해주세요"),
  gender: z.enum(["boy", "girl"]),
  dueDate: z.string().optional(),
  message: z.string().optional(),
  animationType: z.enum([
    "confetti",
    "balloons",
    "fireworks",
    "falling",
    "reveal",
  ]),
  countdownTime: z.number().min(3).max(10).default(5),
  isMultiple: z.boolean().default(false),
  babiesInfo: z.array(babyInfoSchema).optional(),

  // D-Day 전용 필드
  scheduledAt: z.string().refine(
    (val) => {
      const scheduledDate = new Date(val);
      const now = new Date();
      // 최소 1시간 이상 미래여야 함
      return scheduledDate.getTime() > now.getTime() + 60 * 60 * 1000;
    },
    { message: "예약 시간은 현재보다 최소 1시간 이상 미래여야 합니다" },
  ),
});

/**
 * 투표 요청 스키마
 */
export const voteSchema = z.object({
  revealId: z.string().min(1, "revealId가 필요합니다"),
  vote: z.enum(["prince", "princess"]),
  deviceId: z.string().uuid("유효한 deviceId가 필요합니다"),
});

/**
 * 투표 조회 스키마
 */
export const voteQuerySchema = z.object({
  revealId: z.string().min(1, "revealId가 필요합니다"),
});

// 타입 추론
export type DDayCreateInput = z.infer<typeof ddayCreateSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type VoteQueryInput = z.infer<typeof voteQuerySchema>;

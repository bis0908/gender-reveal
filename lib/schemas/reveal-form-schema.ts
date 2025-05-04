import * as z from 'zod';

// 아기 정보를 위한 스키마
export const babyInfoSchema = z.object({
  name: z.string().min(1, "태명을 입력해주세요"),
  gender: z.enum(["boy", "girl"])
});

export const formSchema = z.object({
  motherName: z.string().min(1, "엄마 이름을 입력해주세요"),
  fatherName: z.string().min(1, "아빠 이름을 입력해주세요"),
  babyName: z.string().min(1, "태명을 입력해주세요").optional(),
  gender: z.enum(["boy", "girl"]).optional(),
  dueDate: z.date().optional(),
  message: z.string().optional(),
  animationType: z.enum(["confetti", "balloons", "fireworks", "falling", "reveal"]),
  countdownTime: z.number().min(3).max(10).default(5),
  isMultiple: z.boolean().default(false),
  babiesInfo: z.array(babyInfoSchema).optional()
}).refine(data => {
  // 다태아가 아니면 단일 아기 정보가 필요
  if (!data.isMultiple) {
    return !!data.babyName && !!data.gender;
  }
  // 다태아면 babiesInfo가 필요하며 최소 2개 이상
  return !!data.babiesInfo && data.babiesInfo.length >= 2;
}, {
  message: "아기 정보를 올바르게 입력해주세요",
  path: ["babiesInfo"]
}).refine(data => {
  // 다태아인 경우 모든 아기의 태명이 입력되었는지 확인
  if (data.isMultiple && data.babiesInfo) {
    return data.babiesInfo.every(baby => !!baby.name && baby.name.trim() !== "");
  }
  return true;
}, {
  message: "모든 아기의 태명을 입력해주세요",
  path: ["babiesInfo"]
});

export type FormValues = z.infer<typeof formSchema>;
export type BabyInfo = z.infer<typeof babyInfoSchema>; 
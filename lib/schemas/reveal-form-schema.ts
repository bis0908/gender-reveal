import * as z from 'zod';

// 아기 정보를 위한 스키마
export const babyInfoSchema = z.object({
  name: z.string().min(1, "태명을 입력해주세요"),
  gender: z.enum(["boy", "girl"])
});

// 조건부 스키마 적용을 위한 구조
export const formSchema = z.discriminatedUnion('isMultiple', [
  // 단태아 스키마 (isMultiple: false)
  z.object({
    motherName: z.string().min(1, "엄마 이름을 입력해주세요"),
    fatherName: z.string().min(1, "아빠 이름을 입력해주세요"),
    babyName: z.string().min(1, "태명을 입력해주세요"),
    gender: z.enum(["boy", "girl"]),
    dueDate: z.date().optional(),
    message: z.string().optional(),
    animationType: z.enum(["confetti", "balloons", "fireworks", "falling", "reveal"]),
    countdownTime: z.number().min(3).max(10).default(5),
    isMultiple: z.literal(false),
    // 단태아에서는 babiesInfo를 옵셔널로 처리하고 검증하지 않음
    babiesInfo: z.array(babyInfoSchema).optional().or(z.array(babyInfoSchema).length(0))
  }),

  // 다태아 스키마 (isMultiple: true)
  z.object({
    motherName: z.string().min(1, "엄마 이름을 입력해주세요"),
    fatherName: z.string().min(1, "아빠 이름을 입력해주세요"),
    babyName: z.string().optional(), // 다태아에서는 필요 없음
    gender: z.enum(["boy", "girl"]).optional(), // 다태아에서는 필요 없음
    dueDate: z.date().optional(),
    message: z.string().optional(),
    animationType: z.enum(["confetti", "balloons", "fireworks", "falling", "reveal"]),
    countdownTime: z.number().min(3).max(10).default(5),
    isMultiple: z.literal(true),
    // 다태아에서는 babiesInfo가 필수이며 최소 2개 이상 필요
    babiesInfo: z.array(babyInfoSchema).min(2, "최소 2명 이상의 아기 정보가 필요합니다")
      .refine(
        babies => babies.every(baby => !!baby.name && baby.name.trim() !== ""), 
        { message: "모든 아기의 태명을 입력해주세요" }
      )
  })
]);

export type FormValues = z.infer<typeof formSchema>;
export type BabyInfo = z.infer<typeof babyInfoSchema>; 
/**
 * D-Day API 엔드포인트 테스트
 * Given-When-Then 패턴 적용
 */

import {
  ddayCreateSchema,
  voteQuerySchema,
  voteSchema,
} from "@/lib/schemas/dday-schema";

describe("D-Day 스키마 검증 테스트", () => {
  describe("ddayCreateSchema", () => {
    const validData = {
      motherName: "김민지",
      fatherName: "이준호",
      babyName: "이하늘",
      gender: "boy" as const,
      dueDate: "2026-03-15",
      message: "우리 아기를 기다려요",
      animationType: "confetti" as const,
      countdownTime: 5,
      isMultiple: false,
      babiesInfo: undefined as
        | { name: string; gender: "boy" | "girl" }[]
        | undefined,
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
    };

    test("Given 유효한 D-Day 생성 데이터가 있을 때 When 스키마로 검증하면 Then 검증이 통과해야 한다", () => {
      // given
      const data = { ...validData };

      // when
      const result = ddayCreateSchema.safeParse(data);

      // then
      expect(result.success).toBe(true);
    });

    test("Given scheduledAt이 과거 시간일 때 When 스키마로 검증하면 Then 검증이 실패해야 한다", () => {
      // given
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1시간 전
      const data = { ...validData, scheduledAt: pastDate };

      // when
      const result = ddayCreateSchema.safeParse(data);

      // then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("미래");
      }
    });

    test("Given scheduledAt이 1시간 미만 미래일 때 When 스키마로 검증하면 Then 검증이 실패해야 한다", () => {
      // given
      const nearFuture = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30분 후
      const data = { ...validData, scheduledAt: nearFuture };

      // when
      const result = ddayCreateSchema.safeParse(data);

      // then
      expect(result.success).toBe(false);
    });

    test("Given motherName이 누락되었을 때 When 스키마로 검증하면 Then 검증이 실패해야 한다", () => {
      // given
      const { motherName, ...dataWithoutMotherName } = validData;

      // when
      const result = ddayCreateSchema.safeParse(dataWithoutMotherName);

      // then
      expect(result.success).toBe(false);
    });

    test("Given scheduledAt이 누락되었을 때 When 스키마로 검증하면 Then 검증이 실패해야 한다", () => {
      // given
      const { scheduledAt, ...dataWithoutScheduledAt } = validData;

      // when
      const result = ddayCreateSchema.safeParse(dataWithoutScheduledAt);

      // then
      expect(result.success).toBe(false);
    });

    /**
     * Optional 필드 누락 테스트 - D-Day 예약 기능 영향도 검증
     */
    describe("Optional 필드 누락 시 D-Day 예약 기능 정상 동작 검증", () => {
      test("Given dueDate가 누락되었을 때 When 스키마로 검증하면 Then 검증이 통과해야 한다", () => {
        // given
        const { dueDate, ...dataWithoutDueDate } = validData;

        // when
        const result = ddayCreateSchema.safeParse(dataWithoutDueDate);

        // then
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.dueDate).toBeUndefined();
        }
      });

      test("Given message가 누락되었을 때 When 스키마로 검증하면 Then 검증이 통과해야 한다", () => {
        // given
        const { message, ...dataWithoutMessage } = validData;

        // when
        const result = ddayCreateSchema.safeParse(dataWithoutMessage);

        // then
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.message).toBeUndefined();
        }
      });

      test("Given countdownTime이 누락되었을 때 When 스키마로 검증하면 Then 기본값 5가 적용되어야 한다", () => {
        // given
        const { countdownTime, ...dataWithoutCountdownTime } = validData;

        // when
        const result = ddayCreateSchema.safeParse(dataWithoutCountdownTime);

        // then
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.countdownTime).toBe(5);
        }
      });

      test("Given isMultiple이 누락되었을 때 When 스키마로 검증하면 Then 기본값 false가 적용되어야 한다", () => {
        // given
        const { isMultiple, ...dataWithoutIsMultiple } = validData;

        // when
        const result = ddayCreateSchema.safeParse(dataWithoutIsMultiple);

        // then
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isMultiple).toBe(false);
        }
      });

      test("Given babiesInfo가 누락되었을 때 When 스키마로 검증하면 Then 검증이 통과해야 한다", () => {
        // given
        const { babiesInfo, ...dataWithoutBabiesInfo } = validData;

        // when
        const result = ddayCreateSchema.safeParse(dataWithoutBabiesInfo);

        // then
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.babiesInfo).toBeUndefined();
        }
      });

      test("Given 모든 optional 필드가 누락되었을 때 When 스키마로 검증하면 Then 검증이 통과해야 한다", () => {
        // given - 필수 필드만 포함
        const minimalData = {
          motherName: "김민지",
          fatherName: "이준호",
          babyName: "이하늘",
          gender: "boy" as const,
          animationType: "confetti" as const,
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        };

        // when
        const result = ddayCreateSchema.safeParse(minimalData);

        // then
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.dueDate).toBeUndefined();
          expect(result.data.message).toBeUndefined();
          expect(result.data.countdownTime).toBe(5); // 기본값
          expect(result.data.isMultiple).toBe(false); // 기본값
          expect(result.data.babiesInfo).toBeUndefined();
        }
      });

      test("Given optional 필드에 빈 문자열이 있을 때 When 스키마로 검증하면 Then 검증이 통과해야 한다", () => {
        // given
        const dataWithEmptyOptionals = {
          ...validData,
          dueDate: "",
          message: "",
        };

        // when
        const result = ddayCreateSchema.safeParse(dataWithEmptyOptionals);

        // then
        expect(result.success).toBe(true);
      });
    });
  });

  describe("voteSchema", () => {
    test("Given 유효한 투표 데이터가 있을 때 When 스키마로 검증하면 Then 검증이 통과해야 한다", () => {
      // given
      const data = {
        revealId: "abc12345",
        vote: "prince" as const,
        deviceId: "550e8400-e29b-41d4-a716-446655440000",
      };

      // when
      const result = voteSchema.safeParse(data);

      // then
      expect(result.success).toBe(true);
    });

    test("Given vote가 유효하지 않은 값일 때 When 스키마로 검증하면 Then 검증이 실패해야 한다", () => {
      // given
      const data = {
        revealId: "abc12345",
        vote: "invalid_vote",
        deviceId: "550e8400-e29b-41d4-a716-446655440000",
      };

      // when
      const result = voteSchema.safeParse(data);

      // then
      expect(result.success).toBe(false);
    });

    test("Given deviceId가 UUID 형식이 아닐 때 When 스키마로 검증하면 Then 검증이 실패해야 한다", () => {
      // given
      const data = {
        revealId: "abc12345",
        vote: "princess" as const,
        deviceId: "not-a-uuid",
      };

      // when
      const result = voteSchema.safeParse(data);

      // then
      expect(result.success).toBe(false);
    });

    test("Given revealId가 빈 문자열일 때 When 스키마로 검증하면 Then 검증이 실패해야 한다", () => {
      // given
      const data = {
        revealId: "",
        vote: "prince" as const,
        deviceId: "550e8400-e29b-41d4-a716-446655440000",
      };

      // when
      const result = voteSchema.safeParse(data);

      // then
      expect(result.success).toBe(false);
    });
  });

  describe("voteQuerySchema", () => {
    test("Given 유효한 revealId가 있을 때 When 스키마로 검증하면 Then 검증이 통과해야 한다", () => {
      // given
      const data = { revealId: "abc12345" };

      // when
      const result = voteQuerySchema.safeParse(data);

      // then
      expect(result.success).toBe(true);
    });

    test("Given revealId가 누락되었을 때 When 스키마로 검증하면 Then 검증이 실패해야 한다", () => {
      // given
      const data = {};

      // when
      const result = voteQuerySchema.safeParse(data);

      // then
      expect(result.success).toBe(false);
    });
  });
});

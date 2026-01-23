/**
 * 투표 로직 단위 테스트
 * Given-When-Then 패턴 적용
 */

describe("투표 퍼센트 계산 테스트", () => {
  /**
   * 투표 퍼센트 계산 함수
   */
  function calculatePercentage(count: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  test("Given prince: 45, princess: 32일 때 When 퍼센트를 계산하면 Then 왕자 58%, 공주 42%가 되어야 한다", () => {
    // given
    const prince = 45;
    const princess = 32;
    const total = prince + princess;

    // when
    const princePercent = calculatePercentage(prince, total);
    const princessPercent = calculatePercentage(princess, total);

    // then
    expect(princePercent).toBe(58);
    expect(princessPercent).toBe(42);
    // 합이 100% 근처여야 함 (반올림 오차 허용)
    expect(Math.abs(princePercent + princessPercent - 100)).toBeLessThanOrEqual(
      1,
    );
  });

  test("Given 투표가 없을 때 When 퍼센트를 계산하면 Then 0%가 되어야 한다", () => {
    // given
    const prince = 0;
    const princess = 0;
    const total = 0;

    // when
    const princePercent = calculatePercentage(prince, total);
    const princessPercent = calculatePercentage(princess, total);

    // then
    expect(princePercent).toBe(0);
    expect(princessPercent).toBe(0);
  });

  test("Given 한 쪽만 투표가 있을 때 When 퍼센트를 계산하면 Then 100%가 되어야 한다", () => {
    // given
    const prince = 10;
    const princess = 0;
    const total = prince + princess;

    // when
    const princePercent = calculatePercentage(prince, total);
    const princessPercent = calculatePercentage(princess, total);

    // then
    expect(princePercent).toBe(100);
    expect(princessPercent).toBe(0);
  });

  test("Given 동점일 때 When 퍼센트를 계산하면 Then 각각 50%가 되어야 한다", () => {
    // given
    const prince = 25;
    const princess = 25;
    const total = prince + princess;

    // when
    const princePercent = calculatePercentage(prince, total);
    const princessPercent = calculatePercentage(princess, total);

    // then
    expect(princePercent).toBe(50);
    expect(princessPercent).toBe(50);
  });
});

describe("카운트다운 계산 테스트", () => {
  /**
   * 남은 시간 계산 함수 (올림 처리)
   */
  function calculateTimeRemaining(scheduledAt: string, now: Date = new Date()) {
    const targetDate = new Date(scheduledAt);
    const diffMs = targetDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { days: 0, hours: 0, isExpired: true };
    }

    const totalHours = diffMs / (1000 * 60 * 60);
    const days = Math.floor(totalHours / 24);
    const remainingHours = Math.ceil(totalHours - days * 24);

    // hours가 24가 되면 다음 날로
    const adjustedHours = remainingHours >= 24 ? 0 : remainingHours;
    const adjustedDays = remainingHours >= 24 ? days + 1 : days;

    return {
      days: adjustedDays,
      hours: adjustedHours,
      isExpired: false,
    };
  }

  test("Given 2일 14시간 30분 남았을 때 When 남은 시간을 계산하면 Then 2일 15시간이어야 한다 (올림)", () => {
    // given
    const now = new Date("2026-01-20T10:00:00+09:00");
    const scheduledAt = "2026-01-23T00:30:00+09:00"; // 2일 14시간 30분 후

    // when
    const result = calculateTimeRemaining(scheduledAt, now);

    // then
    expect(result.days).toBe(2);
    expect(result.hours).toBe(15); // 14.5시간 올림
    expect(result.isExpired).toBe(false);
  });

  test("Given 예약 시간이 지났을 때 When 남은 시간을 계산하면 Then isExpired가 true여야 한다", () => {
    // given
    const now = new Date("2026-01-20T10:00:00+09:00");
    const scheduledAt = "2026-01-20T09:00:00+09:00"; // 1시간 전

    // when
    const result = calculateTimeRemaining(scheduledAt, now);

    // then
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.isExpired).toBe(true);
  });

  test("Given 59분 남았을 때 When 남은 시간을 계산하면 Then 0일 1시간이어야 한다 (올림)", () => {
    // given
    const now = new Date("2026-01-20T10:00:00+09:00");
    const scheduledAt = "2026-01-20T10:59:00+09:00"; // 59분 후

    // when
    const result = calculateTimeRemaining(scheduledAt, now);

    // then
    expect(result.days).toBe(0);
    expect(result.hours).toBe(1); // 올림
    expect(result.isExpired).toBe(false);
  });

  test("Given 정확히 24시간 남았을 때 When 남은 시간을 계산하면 Then 1일 0시간이어야 한다", () => {
    // given
    const now = new Date("2026-01-20T10:00:00+09:00");
    const scheduledAt = "2026-01-21T10:00:00+09:00"; // 정확히 24시간 후

    // when
    const result = calculateTimeRemaining(scheduledAt, now);

    // then
    expect(result.days).toBe(1);
    expect(result.hours).toBe(0);
    expect(result.isExpired).toBe(false);
  });
});

describe("Redis TTL 계산 테스트", () => {
  /**
   * Redis TTL 계산 (scheduledAt + 30일)
   */
  function calculateRedisTTL(
    scheduledAt: string,
    now: Date = new Date(),
  ): number {
    const scheduledDate = new Date(scheduledAt);
    const ttlEnd = new Date(scheduledDate);
    ttlEnd.setDate(ttlEnd.getDate() + 30);
    return Math.floor((ttlEnd.getTime() - now.getTime()) / 1000);
  }

  test("Given scheduledAt이 10일 후일 때 When TTL을 계산하면 Then 약 40일(10+30)의 초가 반환되어야 한다", () => {
    // given
    const now = new Date("2026-01-20T10:00:00+09:00");
    const scheduledAt = "2026-01-30T10:00:00+09:00"; // 10일 후

    // when
    const ttl = calculateRedisTTL(scheduledAt, now);

    // then
    const expectedDays = 40; // 10일 후 + 30일
    const expectedSeconds = expectedDays * 24 * 60 * 60;
    expect(ttl).toBe(expectedSeconds);
  });

  test("Given scheduledAt이 1일 후일 때 When TTL을 계산하면 Then 약 31일의 초가 반환되어야 한다", () => {
    // given
    const now = new Date("2026-01-20T10:00:00+09:00");
    const scheduledAt = "2026-01-21T10:00:00+09:00"; // 1일 후

    // when
    const ttl = calculateRedisTTL(scheduledAt, now);

    // then
    const expectedDays = 31;
    const expectedSeconds = expectedDays * 24 * 60 * 60;
    expect(ttl).toBe(expectedSeconds);
  });
});

describe("토큰 만료 시간 계산 테스트", () => {
  /**
   * D-Day 토큰 만료 시간 계산 (scheduledAt + 7일)
   */
  function calculateTokenExpiration(
    scheduledAt: string,
    now: Date = new Date(),
  ): number {
    const scheduledDate = new Date(scheduledAt);
    scheduledDate.setDate(scheduledDate.getDate() + 7);
    return Math.floor((scheduledDate.getTime() - now.getTime()) / 1000);
  }

  test("Given scheduledAt이 3일 후일 때 When 토큰 만료 시간을 계산하면 Then 10일(3+7)의 초가 반환되어야 한다", () => {
    // given
    const now = new Date("2026-01-20T10:00:00+09:00");
    const scheduledAt = "2026-01-23T10:00:00+09:00"; // 3일 후

    // when
    const expirationSeconds = calculateTokenExpiration(scheduledAt, now);

    // then
    const expectedDays = 10; // 3일 + 7일
    const expectedSeconds = expectedDays * 24 * 60 * 60;
    expect(expirationSeconds).toBe(expectedSeconds);
  });
});

/**
 * 시간 계산 유틸리티
 * CountdownTimer와 테스트에서 공유하여 로직 불일치 방지
 */

export interface TimeRemaining {
  days: number;
  hours: number;
  isExpired: boolean;
}

/**
 * 남은 시간 계산 (올림 처리)
 *
 * @param scheduledAt - 목표 시간 (ISO 8601 문자열, 예: "2026-01-25T00:00:00Z")
 * @param serverTime - 서버 시간 (Unix timestamp, UTC 밀리초), null이면 클라이언트 시간 사용
 * @returns 남은 일수, 시간, 만료 여부. 잘못된 scheduledAt이면 만료 상태 반환.
 *
 * @example
 * const result = calculateTimeRemaining("2026-01-25T00:00:00Z", Date.now());
 * // { days: 2, hours: 15, isExpired: false }
 */
export function calculateTimeRemaining(
  scheduledAt: string,
  serverTime?: number | null,
): TimeRemaining {
  const targetDate = new Date(scheduledAt);

  // 잘못된 ISO 8601 문자열 처리
  if (Number.isNaN(targetDate.getTime())) {
    return { days: 0, hours: 0, isExpired: true };
  }

  // 서버 시간이 있으면 서버 시간 기준으로 계산, 없으면 클라이언트 시간 사용
  const now = serverTime ? new Date(serverTime) : new Date();

  // 과거 시간이면 만료 처리 (serverTime 기준으로 비교)
  if (targetDate.getTime() <= now.getTime()) {
    return { days: 0, hours: 0, isExpired: true };
  }

  // 밀리초 단위로 시간 차이 계산하여 올림 처리 가능하도록
  const diffMs = targetDate.getTime() - now.getTime();
  const totalHours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);

  // 남은 시간 올림 처리 (1시간 1분 → 2시간)
  const remainingHoursAfterDays = Math.ceil(totalHours - days * 24);

  // hours가 24가 되면 다음 날로 넘김
  const adjustedHours =
    remainingHoursAfterDays >= 24 ? 0 : remainingHoursAfterDays;
  const adjustedDays = remainingHoursAfterDays >= 24 ? days + 1 : days;

  return {
    days: Math.max(0, adjustedDays),
    hours: Math.max(0, adjustedHours),
    isExpired: false,
  };
}

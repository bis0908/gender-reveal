/**
 * 간단한 in-memory rate limiter
 * IP 주소별로 요청 횟수를 제한
 */

// IP별 요청 타임스탬프를 저장하는 Map
const rateLimitMap = new Map<string, number[]>();

/**
 * Rate limit 설정
 */
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 60 * 1000, // 1시간
  maxRequests: 3, // 최대 3회
} as const;

/**
 * IP 주소에 대한 rate limit 체크
 *
 * @param ip - 클라이언트 IP 주소
 * @returns true면 허용, false면 제한 초과
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const { windowMs, maxRequests } = RATE_LIMIT_CONFIG;

  // 해당 IP의 요청 기록 가져오기
  const requests = rateLimitMap.get(ip) || [];

  // 시간 윈도우 내의 요청만 필터링
  const recentRequests = requests.filter((time) => now - time < windowMs);

  // 최대 요청 수 초과 여부 확인
  if (recentRequests.length >= maxRequests) {
    return false;
  }

  // 현재 요청 추가
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);

  return true;
}

/**
 * 특정 IP의 rate limit 상태 조회
 *
 * @param ip - 클라이언트 IP 주소
 * @returns 남은 요청 횟수와 리셋 시간
 */
export function getRateLimitStatus(ip: string): {
  remaining: number;
  resetAt: Date | null;
} {
  const now = Date.now();
  const { windowMs, maxRequests } = RATE_LIMIT_CONFIG;

  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter((time) => now - time < windowMs);

  const remaining = Math.max(0, maxRequests - recentRequests.length);
  const oldestRequest = recentRequests[0];
  const resetAt = oldestRequest
    ? new Date(oldestRequest + windowMs)
    : null;

  return { remaining, resetAt };
}

/**
 * 주기적으로 오래된 데이터 정리 (메모리 관리)
 * 프로덕션 환경에서는 Redis 등 외부 저장소 사용 권장
 */
export function cleanupOldRateLimitData(): void {
  const now = Date.now();
  const { windowMs } = RATE_LIMIT_CONFIG;

  // Array.from을 사용하여 타입스크립트 호환성 개선
  const entries = Array.from(rateLimitMap.entries());

  for (const [ip, requests] of entries) {
    const recentRequests = requests.filter((time) => now - time < windowMs);

    if (recentRequests.length === 0) {
      // 최근 요청이 없으면 삭제
      rateLimitMap.delete(ip);
    } else {
      // 최근 요청만 유지
      rateLimitMap.set(ip, recentRequests);
    }
  }
}

// 1시간마다 자동 정리 (서버 시작 시)
if (typeof window === "undefined") {
  setInterval(cleanupOldRateLimitData, 60 * 60 * 1000);
}

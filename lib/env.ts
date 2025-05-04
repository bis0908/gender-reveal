/**
 * 환경 변수를 관리하는 모듈
 * 
 * 프로덕션에서는 실제 환경 변수를 사용하고,
 * 개발 환경이나 환경 변수가 설정되지 않은 경우 기본값을 제공합니다.
 */

// JWT 비밀 키 (프로덕션에서는 복잡한 키로 변경 필요)
export const JWT_SECRET = process.env.JWT_SECRET || 'gender-reveal-secret-key-2025';

// JWT 만료 시간 (기본값: 7일)
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

// 환경 변수를 TextEncoder로 인코딩하는 유틸리티 함수
export function getEncodedSecret(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
} 
/**
 * 환경 변수를 관리하는 모듈
 * 
 * 프로덕션에서는 실제 환경 변수를 사용하고,
 * 개발 환경이나 환경 변수가 설정되지 않은 경우 기본값을 제공합니다.
 */

// 개발 환경 여부 확인
const isDevelopment = process.env.NODE_ENV === 'development';
console.log("🔥 / env.ts:10 / isDevelopment:", isDevelopment)

// JWT 비밀 키 - process.env.JWT_SECRET이 undefined인 경우 기본값 사용
const DEFAULT_JWT_SECRET = 'gender-reveal-default-secret-key-2025';
export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

// JWT 만료 시간 (기본값: 7일)
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

// 환경 변수를 TextEncoder로 인코딩하는 유틸리티 함수
export function getEncodedSecret(): Uint8Array {
  try {
    // JWT_SECRET이 빈 문자열이면 기본값 사용
    const secretToUse = JWT_SECRET.trim() === '' ? DEFAULT_JWT_SECRET : JWT_SECRET;
    return new TextEncoder().encode(secretToUse);
  } catch (error) {
    console.error('[ENV] 비밀키 인코딩 중 오류 발생:', error);
    // 오류 발생 시 기본 비밀키 사용
    return new TextEncoder().encode(DEFAULT_JWT_SECRET);
  }
} 
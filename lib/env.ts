/**
 * 환경 변수를 관리하는 모듈
 * 
 * 프로덕션에서는 실제 환경 변수를 사용하고,
 * 개발 환경이나 환경 변수가 설정되지 않은 경우 기본값을 제공합니다.
 */

// 개발 환경 여부 확인
const isDevelopment = process.env.NODE_ENV === 'development';
console.log('[ENV] 실행 환경:', process.env.NODE_ENV);

// JWT 비밀 키 (프로덕션에서는 복잡한 키로 변경 필요)
export const JWT_SECRET = process.env.JWT_SECRET || 'gender-reveal-secret-key-2025';
console.log('[ENV] JWT_SECRET 환경변수 설정됨:', Boolean(process.env.JWT_SECRET));

// JWT 만료 시간 (기본값: 7일)
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';
console.log('[ENV] JWT_EXPIRATION 환경변수 설정됨:', Boolean(process.env.JWT_EXPIRATION));

// 환경 변수를 TextEncoder로 인코딩하는 유틸리티 함수
export function getEncodedSecret(): Uint8Array {
  console.log('[ENV] getEncodedSecret 호출됨, 비밀키 길이:', JWT_SECRET.length);
  return new TextEncoder().encode(JWT_SECRET);
} 
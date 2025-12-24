/**
 * 클라이언트/서버 공통 설정
 * process.env를 직접 참조하지 않고 런타임 환경 판단
 *
 * 이 파일은 클라이언트 번들에 포함되어도 안전하도록 설계됨
 * - typeof window를 사용하여 브라우저 환경 감지
 * - process.env는 서버 사이드에서만 조건부 접근
 */

// 환경 타입 정의
export type Environment = 'development' | 'production' | 'test';

// 런타임 환경 판단 (클라이언트 안전)
export const IS_BROWSER = typeof window !== 'undefined';
export const IS_SERVER = !IS_BROWSER;

// 서버 사이드에서만 NODE_ENV 접근
export const NODE_ENV: Environment = IS_SERVER
  ? (process.env.NODE_ENV as Environment || 'development')
  : 'production'; // 클라이언트는 항상 production으로 간주

export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';

// 공개 설정 정보 (클라이언트에서도 안전)
export const CONFIG = {
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  IS_BROWSER,
  IS_SERVER,
} as const;

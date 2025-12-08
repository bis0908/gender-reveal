/**
 * 환경 변수 관리 및 검증
 * 프로덕션 환경에서는 반드시 환경 변수가 설정되어야 함
 */

// 환경 타입 정의
type Environment = 'development' | 'production' | 'test';

// 환경 변수 검증 결과
interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 현재 환경
const NODE_ENV = (process.env.NODE_ENV || 'development') as Environment;
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_DEVELOPMENT = NODE_ENV === 'development';

/**
 * 환경 변수 검증 함수
 */
function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // JWT_SECRET 검증
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    if (IS_PRODUCTION) {
      errors.push('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    } else {
      warnings.push('JWT_SECRET이 설정되지 않아 개발용 기본값을 사용합니다.');
    }
  } else if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET은 최소 32자 이상이어야 합니다.');
  }

  // JWT_EXPIRATION 검증
  const jwtExpiration = process.env.JWT_EXPIRATION;
  if (jwtExpiration) {
    const validPattern = /^\d+[smhd]$/;
    if (!validPattern.test(jwtExpiration)) {
      errors.push('JWT_EXPIRATION 형식이 올바르지 않습니다. (예: 7d, 24h, 60m)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// 검증 실행
const validation = validateEnvironmentVariables();

// 에러가 있으면 프로세스 종료 (프로덕션)
if (!validation.isValid && IS_PRODUCTION) {
  console.error('❌ 환경 변수 검증 실패:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

// 개발 환경에서 경고 출력
if (IS_DEVELOPMENT && validation.warnings.length > 0) {
  console.warn('⚠️ 환경 변수 경고:');
  validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
}

// JWT 비밀키 (개발 환경에서만 기본값 허용)
export const JWT_SECRET = process.env.JWT_SECRET ||
  (IS_DEVELOPMENT ? 'dev-secret-key-DO-NOT-USE-IN-PRODUCTION' : '');

// JWT 만료 시간
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

// 환경 정보 (디버깅용, 민감 정보 제외)
export const ENV = {
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  JWT_EXPIRATION,
  // JWT_SECRET은 노출하지 않음
} as const;

/**
 * 인코딩된 비밀키 반환 (에러 처리 강화)
 */
export function getEncodedSecret(): Uint8Array {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET이 설정되지 않았습니다.');
  }

  try {
    return new TextEncoder().encode(JWT_SECRET);
  } catch (error) {
    throw new Error(`JWT_SECRET 인코딩 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 환경 변수 검증 상태 확인 (헬스체크용)
 */
export function getEnvValidationStatus(): EnvValidationResult {
  return validation;
}

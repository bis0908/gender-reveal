/**
 * 서버 전용 유틸리티 함수
 * JWT 토큰 생성/검증에 사용
 *
 * ⚠️ 이 파일은 클라이언트 번들에 절대 포함되지 않음 (.server.ts 파일명 규칙)
 * - Next.js가 .server.ts 파일을 서버 전용으로 인식
 * - 클라이언트 번들에서 자동으로 제외됨
 * - API 라우트에서만 사용해야 함
 */

import * as jose from 'jose';
import type { RevealData } from './types';
import { getEncodedSecret, JWT_EXPIRATION } from './env.server';

/**
 * RevealData를 JWT 토큰으로 암호화
 * @param data - Gender Reveal 데이터
 * @returns JWT 토큰 문자열
 */
export async function encryptData(data: RevealData): Promise<string> {
  try {
    // 안전한 타입 변환을 위해 unknown으로 먼저 변환
    const jwtData = { ...data } as unknown as Record<string, unknown>;
    const JWT_SECRET = getEncodedSecret();

    return await new jose.SignJWT(jwtData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET);
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw error;
  }
}

/**
 * JWT 토큰을 RevealData로 복호화
 * @param token - JWT 토큰 문자열
 * @returns Gender Reveal 데이터 또는 null (검증 실패 시)
 */
export async function decryptData(token: string): Promise<RevealData | null> {
  try {
    const JWT_SECRET = getEncodedSecret();
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    // 안전한 타입 변환을 위해 unknown으로 먼저 변환
    return payload as unknown as RevealData;
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
}

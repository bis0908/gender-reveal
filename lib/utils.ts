import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as jose from 'jose';
import type { RevealData } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 환경 변수에서 인코딩된 비밀 키 가져오기
import { getEncodedSecret, JWT_EXPIRATION } from './env';

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

export function getGenderColor(gender: "boy" | "girl", variant: "light" | "DEFAULT" | "dark" = "DEFAULT") {
  return gender === "boy" 
    ? `baby-blue-${variant === "DEFAULT" ? "" : variant}` 
    : `baby-pink-${variant === "DEFAULT" ? "" : variant}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
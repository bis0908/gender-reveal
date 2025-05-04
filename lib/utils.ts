import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as jose from 'jose';
import type { RevealData } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// JWT Secret - In a production environment, this should be an environment variable
const JWT_SECRET = new TextEncoder().encode('gender-reveal-secret-key-2025');

export async function encryptData(data: RevealData): Promise<string> {
  try {
    // 안전한 타입 변환을 위해 unknown으로 먼저 변환
    const jwtData = data as unknown as Record<string, unknown>;
    return await new jose.SignJWT(jwtData)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(JWT_SECRET);
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw error;
  }
}

export async function decryptData(token: string): Promise<RevealData | null> {
  try {
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
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스 병합 유틸리티
 * shadcn/ui 컴포넌트에서 조건부 스타일링에 사용
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
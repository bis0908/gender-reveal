import type { Gender } from "@/lib/types";

/**
 * 리빌 애니메이션 색상 팔레트 단일 소스.
 *
 * tailwind.config.ts 의 `baby.blue` / `baby.pink` 토큰과 동일한 hex 값을 런타임
 * JS(예: react-confetti, 인라인 style)에서 사용하기 위한 상수다. Tailwind 토큰은
 * className 으로만 쓸 수 있으므로, JS 로직에서 같은 색이 필요할 때 이 모듈을 참조한다.
 *
 * Tailwind 토큰 대응:
 * - boy  → baby.blue (light #E0F2FE / DEFAULT #93C5FD / dark #3B82F6)
 * - girl → baby.pink (light #FCE7F3 / DEFAULT #F9A8D4 / dark #EC4899)
 *
 * 주의: 여기에는 baby 토큰에 대응하는 3단계(light/DEFAULT/dark)만 둔다. 개별
 * 애니메이션이 추가로 쓰는 강조색(예: #1D4ED8 / #DB2777)이나 흰색(#ffffff)은 baby
 * 토큰이 아니므로 각 애니메이션이 자체 보유한다(모듈 범위를 넓히지 않는다).
 */

/** baby.blue 토큰 대응 (boy) */
export const BABY_BLUE = {
  light: "#E0F2FE",
  DEFAULT: "#93C5FD",
  dark: "#3B82F6",
} as const;

/** baby.pink 토큰 대응 (girl) */
export const BABY_PINK = {
  light: "#FCE7F3",
  DEFAULT: "#F9A8D4",
  dark: "#EC4899",
} as const;

/** 성별별 3단계 색상 팔레트 타입 */
export interface GenderColorPalette {
  light: string;
  DEFAULT: string;
  dark: string;
}

/**
 * 성별('boy' | 'girl')에 대응하는 색상 팔레트({light, DEFAULT, dark})를 반환한다.
 * boy → baby.blue, girl → baby.pink.
 */
export function getGenderColors(gender: Gender): GenderColorPalette {
  return gender === "boy" ? BABY_BLUE : BABY_PINK;
}

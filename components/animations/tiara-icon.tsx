import type { SVGProps } from "react";

/**
 * 티아라(여성용 왕관) 아이콘 — lucide 에 티아라가 없어 직접 정의한다.
 *
 * lucide 아이콘과 동일한 사용 계약을 따른다: stroke="currentColor" 이므로 `style.color`
 * 또는 부모의 text-color 로 색을 지정하고, `strokeWidth`·`className` 을 그대로 받는다.
 * 시각: 아치형 머리띠 + 가운데가 가장 높은 세 갈래 첨탑 + 첨탑마다 보석(원). 남아용
 * lucide `Crown` 과 구분되도록 곡선 띠와 보석을 강조해 여성용 왕관 실루엣을 만든다.
 */
export function TiaraIcon({
  strokeWidth = 2,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: 장식용 아이콘 — 호출부에서 aria-hidden 을 전달하므로 title 불필요.
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* 아치형 머리띠 */}
      <path d="M3.5 16.8c2.6 1.5 14.4 1.5 17 0" />
      {/* 세 갈래 첨탑 — 가운데가 가장 높다 */}
      <path d="M4 16.8 6.4 12 9.2 14 12 8 14.8 14 17.6 12 20 16.8" />
      {/* 보석 — 중앙(큰) + 좌우(작은) */}
      <circle cx="12" cy="6.4" r="1.5" />
      <circle cx="6.4" cy="10.7" r="1" />
      <circle cx="17.6" cy="10.7" r="1" />
    </svg>
  );
}

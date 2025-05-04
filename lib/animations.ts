import type { Animation } from './types';

export const animationOptions: Animation[] = [
  {
    id: "confetti",
    name: "색종이",
    description: "성별을 드러내는 알록달록한 색종이 폭발",
    thumbnail: "/images/confetti-thumb.jpg"
  },
  {
    id: "balloons",
    name: "풍선",
    description: "화면을 가득 채우는 파란색 또는 분홍색 풍선들",
    thumbnail: "/images/balloons-thumb.jpg"
  },
  {
    id: "fireworks",
    name: "불꽃놀이",
    description: "성별 색상으로 빛나는 화려한 불꽃놀이",
    thumbnail: "/images/fireworks-thumb.jpg"
  },
  {
    id: "falling",
    name: "떨어지는 아이템",
    description: "위에서 떨어지는 파란색 또는 분홍색 아기 용품들",
    thumbnail: "/images/falling-thumb.jpg"
  },
  {
    id: "reveal",
    name: "심플 공개",
    description: "단순하고 우아한 공개 애니메이션",
    thumbnail: "/images/reveal-thumb.jpg"
  }
];

export function getAnimationByType(type: string): Animation {
  return animationOptions.find(anim => anim.id === type) || animationOptions[0];
}
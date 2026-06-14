import en from "./i18n/locales/en.json";
import jp from "./i18n/locales/jp.json";
import ko from "./i18n/locales/ko.json";
import type { Language } from "./i18n/types";
import type { Animation } from "./types";

const translations = { ko, en, jp };

/**
 * 리빌 오케스트레이션 타이밍 상수 (단위: ms).
 *
 * 페이지·애니메이션 래퍼에 흩어져 있던 매직넘버를 중앙화한다. UX(공지 뒤 잠시 후
 * 결과 표시)를 기존과 동일하게 보존하기 위한 값이며, 임의로 크게 바꾸지 않는다.
 */
export const REVEAL_TIMING = {
  /** 애니메이션 공지 완료 후 결과 화면으로 전환하기까지의 지연 */
  AFTER_ANIMATION_DELAY_MS: 4000,
  /** 결과 영역 마운트 후 스크롤을 시작하기까지의 지연 */
  SCROLL_TO_RESULT_DELAY_MS: 500,
  /** 개별 애니메이션 onComplete 미발화를 대비한 백업 타이머 (정상 콜백보다 충분히 김) */
  ANIMATION_BACKUP_MS: 8000,
} as const;

export function getAnimationOptions(language: Language = "ko"): Animation[] {
  const t = translations[language] || translations.ko;

  return [
    {
      id: "confetti",
      name: t.animations.confettiName,
      description: t.animations.confettiDesc,
      thumbnail: "/images/confetti-thumb.png",
    },
    {
      id: "balloons",
      name: t.animations.balloonsName,
      description: t.animations.balloonsDesc,
      thumbnail: "/images/balloons-thumb.png",
    },
    {
      id: "fireworks",
      name: t.animations.fireworksName,
      description: t.animations.fireworksDesc,
      thumbnail: "/images/fireworks-thumb.png",
    },
    {
      id: "falling",
      name: t.animations.fallingName,
      description: t.animations.fallingDesc,
      thumbnail: "/images/falling-thumb.png",
    },
    {
      id: "reveal",
      name: t.animations.revealName,
      description: t.animations.revealDesc,
      thumbnail: "/images/reveal-thumb.png",
    },
  ];
}

// 하위 호환성을 위한 기본 옵션 (한국어)
export const animationOptions: Animation[] = getAnimationOptions("ko");

export function getAnimationByType(
  type: string,
  language: Language = "ko",
): Animation {
  const options = getAnimationOptions(language);
  return options.find((anim) => anim.id === type) || options[0];
}

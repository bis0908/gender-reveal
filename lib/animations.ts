import en from "./i18n/locales/en.json";
import jp from "./i18n/locales/jp.json";
import ko from "./i18n/locales/ko.json";
import type { Language } from "./i18n/types";
import type { Animation } from "./types";

const translations = { ko, en, jp };

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

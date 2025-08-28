import type { Animation } from './types';
import type { Language } from './i18n/types';
import ko from './i18n/locales/ko.json';
import en from './i18n/locales/en.json';

const translations = { ko, en };

export function getAnimationOptions(language: Language = 'ko'): Animation[] {
  const t = translations[language];
  
  return [
    {
      id: "confetti",
      name: t.animations.confettiName,
      description: t.animations.confettiDesc,
      thumbnail: "/images/confetti-thumb.jpg"
    },
    {
      id: "balloons",
      name: t.animations.balloonsName,
      description: t.animations.balloonsDesc,
      thumbnail: "/images/balloons-thumb.jpg"
    },
    {
      id: "fireworks",
      name: t.animations.fireworksName,
      description: t.animations.fireworksDesc,
      thumbnail: "/images/fireworks-thumb.jpg"
    },
    {
      id: "falling",
      name: t.animations.fallingName,
      description: t.animations.fallingDesc,
      thumbnail: "/images/falling-thumb.jpg"
    },
    {
      id: "reveal",
      name: t.animations.revealName,
      description: t.animations.revealDesc,
      thumbnail: "/images/reveal-thumb.jpg"
    }
  ];
}

// 하위 호환성을 위한 기본 옵션 (한국어)
export const animationOptions: Animation[] = getAnimationOptions('ko');

export function getAnimationByType(type: string, language: Language = 'ko'): Animation {
  const options = getAnimationOptions(language);
  return options.find(anim => anim.id === type) || options[0];
}
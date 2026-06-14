"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import type { Gender } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * 공지 텍스트 표현 방식.
 * - "announcement": 한 줄 공지(예: "공주님 입니다!"). animations.boy/girlAnnouncement 사용.
 * - "title": 두 줄 강조(예: "공주님" + "입니다!"). animations.boy/girlTitle + finalText 사용.
 */
export type AnnouncementVariant = "announcement" | "title";

interface AnnouncementTextProps {
  gender: Gender;
  /** 공지 표현 방식. 기본값 "announcement". */
  variant?: AnnouncementVariant;
  /** 진입 모션 지연(초). 각 애니메이션의 기존 타이밍을 보존하기 위해 조절한다. 기본값 1. */
  delay?: number;
  /** 컨테이너에 덧붙일 추가 클래스(레이아웃 보정용). */
  className?: string;
}

/**
 * 5종 리빌 애니메이션의 중앙 공지 텍스트 공용 컴포넌트.
 *
 * - 접근성: 컨테이너에 role="status" aria-live="polite" 를 부여해 성별 결과가
 *   스크린리더에 전달되게 한다.
 * - 감속: useReducedMotion() 이 true 면 scale/translate 진입 모션을 제거하고
 *   즉시(opacity 1) 표시한다.
 * - 시각 보존: text-7xl sm:text-9xl(announcement) / text-8xl sm:text-9xl 2줄(title),
 *   font-bold, drop-shadow, 색은 baby.* 정적 Tailwind 클래스로 표현한다.
 */
export function AnnouncementText({
  gender,
  variant = "announcement",
  delay = 1,
  className,
}: AnnouncementTextProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // 성별 결과 색상 — 정적 Tailwind 클래스(퍼지 안전).
  const colorClass =
    gender === "boy" ? "text-baby-blue-dark" : "text-baby-pink-dark";

  // 감속 모드: 진입 시 위치/스케일 변화를 제거하고 opacity 만 사용.
  const initial = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 };
  const animate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  if (variant === "title") {
    const titleText =
      gender === "boy" ? t("animations.boyTitle") : t("animations.girlTitle");
    const finalText = t("animations.finalText");

    return (
      // biome-ignore lint/a11y/useSemanticElements: 라이브 리전(role=status)에 대응하는 시맨틱 HTML 요소가 없어 성별 결과 안내를 위해 의도적으로 사용한다.
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex flex-col items-center justify-center text-center",
          className,
        )}
      >
        <motion.div
          className={cn(
            "text-8xl sm:text-9xl font-bold drop-shadow-lg",
            colorClass,
          )}
          initial={initial}
          animate={animate}
          transition={{ duration: 0.5, delay }}
        >
          {titleText}
        </motion.div>
        <motion.div
          className={cn(
            "text-8xl sm:text-9xl font-bold drop-shadow-lg mt-4",
            colorClass,
          )}
          initial={initial}
          animate={animate}
          transition={{ duration: 0.5, delay: delay + 0.4 }}
        >
          {finalText}
        </motion.div>
      </div>
    );
  }

  // variant === "announcement"
  const announcementText =
    gender === "boy"
      ? t("animations.boyAnnouncement")
      : t("animations.girlAnnouncement");

  return (
    // biome-ignore lint/a11y/useSemanticElements: 라이브 리전(role=status)에 대응하는 시맨틱 HTML 요소가 없어 성별 결과 안내를 위해 의도적으로 사용한다.
    <div role="status" aria-live="polite" className={className}>
      <motion.div
        className={cn(
          "text-7xl sm:text-9xl text-center font-bold drop-shadow-lg",
          colorClass,
        )}
        initial={initial}
        animate={animate}
        transition={{ duration: 0.5, delay }}
      >
        {announcementText}
      </motion.div>
    </div>
  );
}

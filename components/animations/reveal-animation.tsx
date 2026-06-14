"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Gender } from "@/lib/types";
import { AnnouncementText } from "./announcement-text";

interface RevealAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

export function RevealAnimation({
  gender,
  revealed,
  onComplete,
}: RevealAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  // onComplete 1회 발화 가드 및 타이머 정리용 ref.
  // 페이지가 결과 표시 시 이 컴포넌트를 언마운트하므로(B1), 대기 중인
  // setTimeout 을 cleanup 에서 반드시 해제해 언마운트 후 setState 를 방지한다.
  const hasCompletedRef = useRef(false);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 언마운트 시 대기 중인 onComplete 타이머 해제.
    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  // B2 버그 수정: 동적 클래스(`bg-${genderColor}-light`)는 Tailwind JIT 이
  // 감지하지 못해 배경색이 생성되지 않는다. 완전 리터럴 정적 클래스로 교체한다.
  const backgroundClass =
    gender === "boy" ? "bg-baby-blue-light" : "bg-baby-pink-light";

  const handleBackgroundComplete = () => {
    if (!revealed) {
      return;
    }
    // onComplete 는 시각 종료(공지 표시 후 2초) 시점에 정확히 1회만 발화.
    if (hasCompletedRef.current || !onComplete) {
      return;
    }
    hasCompletedRef.current = true;
    completeTimerRef.current = setTimeout(onComplete, 2000);
  };

  // 감속 모드: 중앙 스케일 래퍼의 scale/translate 진입을 제거하고 opacity 만 사용.
  const scaleInitial = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.8 };
  const scaleAnimate = shouldReduceMotion
    ? { opacity: revealed ? 1 : 0 }
    : { opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.8 };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <motion.div
        className={`absolute inset-0 ${backgroundClass} flex items-center justify-center`}
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
        onAnimationComplete={handleBackgroundComplete}
      >
        <motion.div
          className="relative"
          initial={scaleInitial}
          animate={scaleAnimate}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* 중앙 공지 텍스트만 공용 컴포넌트로 위임(바깥 스케일 래퍼·배경은 유지).
              variant="title" + delay=0.6 → 제목 0.6초 / finalText 1.0초 타이밍 보존. */}
          <AnnouncementText gender={gender} variant="title" delay={0.6} />
        </motion.div>
      </motion.div>
    </div>
  );
}

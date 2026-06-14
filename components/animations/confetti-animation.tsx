"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ReactConfetti from "react-confetti";
import { getGenderColors } from "@/lib/animation-colors";
import type { Gender } from "@/lib/types";
import { AnnouncementText } from "./announcement-text";

interface ConfettiAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

/** 컨페티 시각 종료 후 onComplete 발화까지의 지연(ms). */
const COMPLETE_DELAY_MS = 3000;
/** 컨페티 조각 수(감속 모드가 아닐 때). */
const CONFETTI_PIECES = 500;

export function ConfettiAnimation({
  gender,
  revealed,
  onComplete,
}: ConfettiAnimationProps) {
  const shouldReduceMotion = useReducedMotion();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  // onComplete 1회 발화 가드(effect 재실행·중복 호출 방지).
  const hasCompletedRef = useRef(false);

  // 컨페티 색상 — 공유 팔레트(baby 토큰)의 DEFAULT/dark/light + 자체 흰색.
  const baseColors = getGenderColors(gender);
  const colors = [
    baseColors.DEFAULT,
    baseColors.dark,
    baseColors.light,
    "#ffffff",
  ];

  // 리사이즈 리스너: revealed 와 무관하게 1회만 등록/해제해 누수를 방지한다(B5).
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // reveal 완료 처리: revealed 진입 시 컨페티 표시 + onComplete 1회 발화 타이머.
  useEffect(() => {
    if (!revealed) return;

    setShowConfetti(true);

    const timer = setTimeout(() => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      onComplete?.();
    }, COMPLETE_DELAY_MS);

    // 언마운트/재실행 시 타이머 해제 — 언마운트 후 발화를 방지한다.
    return () => clearTimeout(timer);
  }, [revealed, onComplete]);

  // 감속 모드: 진입 스케일/페이드를 제거하고 컨페티 조각도 생략한다.
  const wrapperInitial = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.8 };
  const wrapperAnimate = revealed
    ? shouldReduceMotion
      ? { opacity: 1 }
      : { opacity: 1, scale: 1 }
    : shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.8 };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {showConfetti && (
        <ReactConfetti
          width={dimensions.width}
          height={dimensions.height}
          colors={colors}
          numberOfPieces={revealed && !shouldReduceMotion ? CONFETTI_PIECES : 0}
          recycle={false}
          gravity={0.2}
        />
      )}

      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={wrapperInitial}
        animate={wrapperAnimate}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <AnnouncementText gender={gender} delay={1} />
      </motion.div>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/context";

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  gender?: "boy" | "girl";
  babyName?: string;
}

export function CountdownTimer({
  seconds,
  onComplete,
  gender,
  babyName,
}: CountdownTimerProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isActive, onComplete]);

  // 성별에 관계없이 중립적인 색상 사용
  const colorClass = "text-baby-neutral";

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl sm:text-3xl font-bold text-baby-neutral mb-8 text-center"
      >
        {t("countdown.revealMessage", {
          babyName: babyName || t("countdown.defaultBabyName"),
        })}
      </motion.div>

      <motion.div
        key={timeLeft}
        initial={shouldReduceMotion ? { opacity: 0 } : { scale: 2, opacity: 0 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`text-9xl font-bold ${colorClass}`}
      >
        {timeLeft > 0 ? timeLeft : ""}
      </motion.div>
    </div>
  );
}

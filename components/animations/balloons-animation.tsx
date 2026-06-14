"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getGenderColors } from "@/lib/animation-colors";
import type { Gender } from "@/lib/types";
import { AnnouncementText } from "./announcement-text";

interface BalloonsAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

/**
 * 풍선 1개의 렌더에 필요한 값.
 *
 * x-드리프트·부유 시간·끈 회전 등 무작위 값은 모두 풍선 생성 시점에 1회 계산해
 * 여기에 고정 보관한다. 렌더 경로(animate/style)에서 Math.random() 을 호출하면
 * 리렌더마다 값이 바뀌어 애니메이션이 튀므로, 고정값을 props 로 전달한다.
 */
interface BalloonConfig {
  id: number;
  /** 풍선 본체 채움 색(인라인 style 이므로 hex 직접 사용). */
  color: string;
  /** 시작 가로 위치(0-100%). */
  x: number;
  /** 감속 모드 정적 표시용 세로 위치(0-100%). 비행 애니메이션에는 사용하지 않는다. */
  yStatic: number;
  /** 부유 종료 시 가로 드리프트 오프셋(px). */
  xDrift: number;
  /** 진입 지연(초). */
  delay: number;
  /** 부유 지속 시간(초). */
  duration: number;
  /** 풍선 지름(px). */
  size: number;
  /** 끈 회전각(deg). */
  stringRotation: number;
}

// 단일 풍선 컴포넌트 — 모든 무작위 값은 config 로 주입받아 렌더 중 재계산하지 않는다.
// shouldReduceMotion=true 면 전체 화면 비행(y 100vh→-120vh)·x 드리프트를 생략하고
// 화면 내 분포된 정적 위치에 opacity 페이드로만 표시한다(풍선이 주 비주얼이라 제거 대신 정적 표시).
const Balloon = ({
  config,
  shouldReduceMotion,
}: {
  config: BalloonConfig;
  shouldReduceMotion: boolean;
}) => {
  const { color, x, yStatic, xDrift, delay, duration, size, stringRotation } =
    config;

  // 풍선 시각 본체 — 두 모드가 동일하게 공유한다(중복 방지·평시 시각 보존).
  const balloonVisual = (
    <>
      {/* 풍선 본체 */}
      <div
        className="relative overflow-hidden"
        style={{
          width: size,
          height: size * 1.18,
          backgroundColor: color,
          borderRadius: "50%",
        }}
      >
        {/* 빛 반사 효과(단일) — paint 부담을 줄이기 위해 1개로 단순화. */}
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.5,
            height: size * 0.3,
            background:
              "radial-gradient(circle at center, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%)",
            top: size * 0.15,
            left: size * 0.1,
            transform: "rotate(10deg)",
          }}
        />
      </div>

      {/* 풍선 끈 */}
      <div className="relative">
        <div
          className="absolute -bottom-16 left-1/2"
          style={{
            width: size * 0.03,
            height: 64,
            maxWidth: "2px",
            minWidth: "1px",
            transform: `translateX(-50%) rotate(${stringRotation}deg)`,
            background: "linear-gradient(to bottom, #888888, #bbbbbb)",
          }}
        />

        {/* 끈 끝 매듭(단일) — 과한 box-shadow 제거. */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: size * 0.08,
            height: size * 0.08,
            backgroundColor: color,
          }}
        />
      </div>
    </>
  );

  // 감속 모드: 비행/드리프트 transform 없이 정적 위치 + opacity 페이드만 실행한다.
  if (shouldReduceMotion) {
    return (
      <motion.div
        className="absolute"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay }}
        style={{ left: `${x}%`, top: `${yStatic}%` }}
      >
        {balloonVisual}
      </motion.div>
    );
  }

  // 평시: 기존 전체 화면 비행 + x 드리프트(시각 그대로 보존).
  return (
    <motion.div
      className="absolute bottom-0"
      initial={{ y: "100vh", x }}
      animate={{ y: "-120vh", x: x + xDrift }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.67, 0.25, 1.01],
      }}
      style={{ left: `${x}%` }}
    >
      {balloonVisual}
    </motion.div>
  );
};

export function BalloonsAnimation({
  gender,
  revealed,
  onComplete,
}: BalloonsAnimationProps) {
  const shouldReduceMotion = useReducedMotion();
  const [balloons, setBalloons] = useState<BalloonConfig[]>([]);
  // 컴포넌트 마운트 상태 추적(언마운트 후 setState/콜백 방지).
  const isMounted = useRef(true);
  // 콜백 1회성 실행 가드.
  const callbackExecuted = useRef(false);

  // 애니메이션 완료 처리 — onComplete 를 정확히 1회만 발화한다.
  const completeAnimation = () => {
    // 이미 실행되었거나 컴포넌트가 언마운트된 경우 중단.
    if (callbackExecuted.current || !isMounted.current) return;

    callbackExecuted.current = true;
    onComplete?.();
  };

  // 마운트/언마운트 상태 관리.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: completeAnimation 은 ref 가드로 안정적이며, balloons 1회 생성 트리거만 의존한다.
  useEffect(() => {
    if (!revealed) return;
    // 이미 풍선이 생성되었으면 다시 생성하지 않음.
    if (balloons.length > 0) return;

    // 감속 모드면 풍선 수를 절반 수준으로 축소(8-10개), 평시 15-20개.
    const count = shouldReduceMotion
      ? 8 + Math.floor(Math.random() * 3)
      : 15 + Math.floor(Math.random() * 5);

    // 색상: 본체 채움은 공유 팔레트(baby 토큰)의 dark/DEFAULT 사용.
    // 강조색은 baby 토큰이 아니므로 balloons 가 자체 보유한다.
    const palette = getGenderColors(gender);
    const accentColor = gender === "boy" ? "#1D4ED8" : "#DB2777";

    // 모든 무작위 값을 생성 시점에 1회 계산해 config 로 고정한다.
    const newBalloons: BalloonConfig[] = [];
    for (let i = 0; i < count; i++) {
      const colorRand = Math.random();
      const color =
        colorRand > 0.6
          ? palette.dark
          : colorRand > 0.3
            ? palette.DEFAULT
            : accentColor;

      newBalloons.push({
        id: i,
        color,
        x: Math.random() * 100, // 0-100%
        yStatic: 8 + Math.random() * 72, // 감속 모드 정적 세로 위치(8-80%)
        xDrift: Math.random() * 100 - 50, // -50 ~ +50px
        delay: 0.1 + Math.random() * 2, // 0.1-2.1s
        duration: 15 + Math.random() * 10, // 15-25s
        size: 50 + Math.random() * 50, // 50-100px
        stringRotation: Math.random() * 6 - 3, // -3 ~ +3deg
      });
    }

    setBalloons(newBalloons);

    // 시각 종료 시점 self-timer(2.5s). 텍스트 애니메이션과 일관성 유지.
    const timer = setTimeout(completeAnimation, 2500);
    // onComplete 미발화 대비 balloons-local 백업 타이머(4s).
    const guaranteeTimer = setTimeout(completeAnimation, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(guaranteeTimer);
    };
  }, [revealed, gender, balloons.length, shouldReduceMotion]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {balloons.map((config) => (
        <Balloon
          key={config.id}
          config={config}
          shouldReduceMotion={shouldReduceMotion ?? false}
        />
      ))}

      {/* 중앙 공지 — 바깥 scale(0.8→1) 진입 래퍼는 유지하되, 감속 모드면 opacity-only 로 표현. */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={
          shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }
        }
        animate={
          shouldReduceMotion
            ? { opacity: revealed ? 1 : 0 }
            : revealed
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.8 }
        }
        transition={{ duration: 0.5, delay: 1 }}
      >
        <AnnouncementText gender={gender} delay={1.5} />
      </motion.div>
    </div>
  );
}

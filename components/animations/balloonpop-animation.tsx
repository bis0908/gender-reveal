"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { getGenderColors } from "@/lib/animation-colors";
import { useTranslation } from "@/lib/i18n/context";
import type { Gender } from "@/lib/types";
import { AnnouncementText } from "./announcement-text";
import { LightBloomFinale } from "./firework-accent";
import { useDelayedRevealButton } from "./use-delayed-reveal-button";

interface BalloonpopAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

/** 누름 피드백(찌그러짐→부풀기) 단계 길이(ms). */
const PRESS_MS = 380;
/** 팝 climax 시작 후 onComplete 발화까지의 지연(ms). 파편·콘페티·공지 노출 시간 확보. */
const POP_COMPLETE_DELAY_MS = 2600;
/** 라텍스 조각 수(감속 모드가 아닐 때). */
const POP_SHARDS = 18;
/**
 * 공지 컨테이너 등장 지연(초). 중앙 CoreFlash(흰 섬광)는 약 0.76s 에 소멸하므로, 그 이후에
 * 텍스트가 떠오르도록 지연을 둔다. 섬광 절정(~0.3s)과 글자 페이드인이 겹치면 흰빛이 저투명
 * 글자를 씻어내 "한 번 깜빡"이는 현상이 생긴다(원인: 섬광-텍스트 타이밍 중첩).
 */
const ANNOUNCE_WRAP_DELAY_S = 0.7;
/** 공지 글자 자체 등장 지연(초). 컨테이너보다 약간 늦게 떠올라 섬광 종료 후 또렷이 보인다. */
const ANNOUNCE_TEXT_DELAY_S = 0.9;

type BalloonPhase = "idle" | "pressing" | "popped";

/** 팝 전 스포일러 방지용 검정 본체색. 인터랙션 전 표면은 중립색, 성별색은 climax 이후에만. */
const BALLOON_NEUTRAL = {
  light: "#52525B",
  DEFAULT: "#27272A",
  dark: "#09090B",
} as const;

/**
 * 풍선 터트리기(balloonpop) 인터랙티브 애니메이션.
 *
 * 연출 흐름: 끈에 매달려 부유 → 클릭 시 찌그러짐→부풀어 커짐(누름 피드백) →
 * 정점에서 순간 사라지며 라텍스 조각 비산 + 충격파 링 + Light Bloom 사방 팝 산란 →
 * 공지 바운스 → onComplete.
 *
 * 보존: {gender, revealed, onComplete} 계약, hasCompletedRef+isMountedRef 1회 발화,
 * getGenderColors 단일 소스, AnnouncementText 재사용, useReducedMotion 분기, Pointer Events
 * 단일 코드패스, touch-action:manipulation, transform/opacity 한정 모션(C-12).
 */
export function BalloonpopAnimation({
  gender,
  revealed,
  onComplete,
}: BalloonpopAnimationProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<BalloonPhase>("idle");
  const hasCompletedRef = useRef(false);
  const isMountedRef = useRef(true);
  const { showRevealAll, markInteracted } = useDelayedRevealButton({
    revealed,
  });

  const colors = getGenderColors(gender);
  const popped = phase === "popped";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fireComplete = useCallback(() => {
    if (hasCompletedRef.current || !isMountedRef.current) return;
    hasCompletedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  // 풍선 누름 — 1회만 동작. 누름 피드백 단계로 진입한다.
  const handlePop = useCallback(() => {
    markInteracted();
    setPhase((prev) => (prev === "idle" ? "pressing" : prev));
  }, [markInteracted]);

  const handleRevealAll = useCallback(() => {
    setPhase("popped");
    fireComplete();
  }, [fireComplete]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handlePop();
      }
    },
    [handlePop],
  );

  // 누름 → 팝 전이. 감속 모드는 피드백을 건너뛰고 즉시 팝.
  useEffect(() => {
    if (phase !== "pressing") return;
    if (shouldReduceMotion) {
      setPhase("popped");
      return;
    }
    const timer = setTimeout(() => setPhase("popped"), PRESS_MS);
    return () => clearTimeout(timer);
  }, [phase, shouldReduceMotion]);

  // 팝 진입 시 연출 종료 후 onComplete 1회 발화.
  useEffect(() => {
    if (phase !== "popped") return;
    const timer = setTimeout(fireComplete, POP_COMPLETE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, fireComplete]);

  if (!revealed) return null;

  const shards = Array.from({ length: POP_SHARDS }, (_, i) => i);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 풍선·피날레 공유 중앙 스테이지 — 컨테이너 정중앙(50%/50%)을 공통 기준점으로 삼는다.
          팝 전 풍선과 팝 후 피날레(코어 섬광·충격파·willow 입자·공지)가 모두 이 중심에 정렬되어
          "풍선이 있던 정 가운데에서 터지는" 정합을 보장한다. 이전에는 프롬프트·버튼이 같은
          flex 컬럼의 형제로 끼어, 팝 전후 자식 구성이 달라지며 수직 중심이 어긋났다(약 60px).
          프롬프트·버튼은 이 스테이지 밖 하단으로 분리해 중심 위치에 영향을 주지 않는다. */}
      <div className="absolute inset-0 flex items-center justify-center">
        {!popped ? (
          // 성별색 풍선 — 부유 → 클릭 시 찌그러짐→부풀기(누름 피드백) → 팝.
          <motion.div
            role="button"
            tabIndex={0}
            aria-label={t("animations.balloonpopPrompt")}
            onPointerDown={handlePop}
            onKeyDown={handleKeyDown}
            className="relative cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-primary/50 rounded-full"
            style={{ touchAction: "manipulation" }}
            animate={
              shouldReduceMotion
                ? undefined
                : phase === "pressing"
                  ? {
                      scaleX: [1, 1.12, 1, 1.35],
                      scaleY: [1, 0.88, 1, 1.35],
                      rotate: [0, -1.5, 1.5, 0],
                      // 부유 float 잔차를 누름 단계에서 0으로 정착 → 팝 순간 풍선이 정확히
                      // 중심(피날레 발생점)에 위치한다(위치 추적 불필요).
                      y: 0,
                    }
                  : { y: [0, -10, 0] }
            }
            transition={
              shouldReduceMotion
                ? undefined
                : phase === "pressing"
                  ? { duration: PRESS_MS / 1000, ease: "easeOut" }
                  : {
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }
            }
          >
            <Balloon colors={BALLOON_NEUTRAL} />
          </motion.div>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* 충격파 링 — border 정적, scale/opacity 만 애니메이트. */}
            {!shouldReduceMotion && (
              <motion.div
                className="absolute h-24 w-24 rounded-full border-4"
                style={{ borderColor: colors.DEFAULT }}
                initial={{ scale: 0.3, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            )}

            {/* 라텍스 조각 — 불규칙 회전·포물선 비산. */}
            {!shouldReduceMotion &&
              shards.map((i) => {
                const angle = (i / POP_SHARDS) * Math.PI * 2 + (i % 2) * 0.3;
                const distance = 120 + (i % 4) * 35;
                return (
                  <motion.span
                    key={`shard-${i}`}
                    className="absolute rounded-sm"
                    style={{
                      width: 10,
                      height: 16,
                      backgroundColor:
                        i % 2 === 0 ? colors.dark : colors.DEFAULT,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance + 90,
                      opacity: 0,
                      rotate: (i % 2 === 0 ? 1 : -1) * (180 + i * 12),
                      scale: 0.5,
                    }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                  />
                );
              })}

            {/* Light Bloom 피날레 — 중앙 집중 대형 개화(코어 섬광 + 동심 2링). */}
            {!shouldReduceMotion && <LightBloomFinale colors={colors} />}

            {/* 공개 텍스트 — 바운스 등장. 중앙 흰 섬광(CoreFlash) 소멸 후 떠올라 씻김(깜빡임)을 피한다. */}
            <AnimatePresence>
              <motion.div
                className="relative z-10 flex items-center justify-center"
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.6 }
                }
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: [0.6, 1.1, 1] }
                }
                transition={{
                  duration: 0.5,
                  delay: shouldReduceMotion ? 0 : ANNOUNCE_WRAP_DELAY_S,
                  times: shouldReduceMotion ? undefined : [0, 0.6, 1],
                }}
              >
                <AnnouncementText
                  gender={gender}
                  delay={shouldReduceMotion ? 0 : ANNOUNCE_TEXT_DELAY_S}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 — 프롬프트 + 전체공개 버튼. 중앙 스테이지(풍선/피날레) 밖에 두어
          중심 위치에 영향을 주지 않는다. */}
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-4">
        {/* 인터랙션 프롬프트(미팝 시) */}
        {!popped && (
          <p className="text-lg font-medium text-foreground/70">
            {t("animations.balloonpopPrompt")}
          </p>
        )}

        {/* 전체 공개(escape hatch) — 항상 DOM 존재, 지연 노출 + 포커스 시 즉시 가시(opacity 전환). */}
        <button
          type="button"
          onClick={handleRevealAll}
          className={`rounded-full border border-border bg-background/80 px-5 py-2 text-sm font-medium text-foreground/80 shadow-sm backdrop-blur-sm transition-opacity duration-500 hover:bg-muted focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            showRevealAll ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {t("animations.revealAll")}
        </button>
      </div>
    </div>
  );
}

/**
 * 풍선 시각(본체 + 광택 + 끈). 인라인 style 은 hex 직접 사용.
 *
 * 스포일러 방지: 팝 전 풍선 본체·매듭은 검정 중립색으로만 그린다.
 * 성별색은 팝 후 조각·충격파·LightBloom·공지에서만 등장한다.
 */
function Balloon({
  colors,
}: {
  colors: { light: string; DEFAULT: string; dark: string };
}) {
  return (
    <div className="relative">
      <div
        className="relative h-44 w-40 overflow-hidden"
        style={{
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 32%, ${colors.light}, ${colors.dark})`,
        }}
      >
        <span
          className="absolute rounded-full"
          style={{
            width: 40,
            height: 24,
            top: 26,
            left: 28,
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)",
          }}
        />
      </div>
      {/* 매듭 */}
      <div
        className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2"
        style={{
          backgroundColor: colors.dark,
          clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
        }}
      />
      {/* 끈 */}
      <div className="absolute -bottom-16 left-1/2 h-16 w-px -translate-x-1/2 bg-gray-400" />
    </div>
  );
}

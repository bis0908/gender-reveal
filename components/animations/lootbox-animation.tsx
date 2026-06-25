"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { getGenderColors, getNeutralColors } from "@/lib/animation-colors";
import { useTranslation } from "@/lib/i18n/context";
import type { Gender } from "@/lib/types";
import { AnnouncementText } from "./announcement-text";
import { LightBloomFinale } from "./firework-accent";
import {
  BOX,
  ISO_CAMERA,
  ISO_PERSPECTIVE,
  IsoBoxBody,
  IsoBoxLid,
} from "./iso-gift-box";
import { useDelayedRevealButton } from "./use-delayed-reveal-button";

interface LootboxAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

/** 클릭 후 충전(가속 흔들림) 단계 길이(ms). */
const CHARGE_MS = 700;
/** 폭발 climax 시작 후 onComplete 발화까지의 지연(ms). 피날레·뚜껑 발사·공지 노출 시간 확보. */
const EXPLODE_COMPLETE_DELAY_MS = 2600;
/** 공개 텍스트가 상자 중심(내부)에서 위로 떠오르는 거리(px). 상자 위로 겹침 없이 올라온다. */
const TEXT_RISE_PX = 170;

type LootboxPhase = "closed" | "charging" | "exploding";

/**
 * 상자 열기(lootbox) 인터랙티브 애니메이션.
 *
 * 입체(3D) 선물상자 — 윗면·앞면·오른쪽면 3면이 동시에 보이는 등각 시점(iso-gift-box).
 * 몸통(어두운 보라)과 뚜껑(밝은 중립색 + 금색 리본·매듭)은 음영·오버행·리본으로 구분된다.
 *
 * 연출 흐름: 위에서 떨어져 squash&stretch 착지 → 대기 시 호흡 흔들림 → 클릭 시 충전(가속
 * 흔들림 + 부풂) → 폭발 시 **뚜껑이 몸통에서 발사되어 화면 밖으로** 날아가고 열린 몸통(내부)
 * 노출 + **배경 Light Bloom 피날레**(balloonpop·scratch 와 동일) → 공지가 상자 안에서 작게
 * 숨어 있다가 상자 위로 떠올라 등장 → onComplete.
 *
 * 스포일러 방지: 닫힌/충전 상태의 상자는 **성별 중립색(보라/금)**으로만 그린다(몸통·뚜껑·리본).
 * 성별색(getGenderColors)은 **오픈 후** 빛기둥·Light Bloom 버스트·AnnouncementText 에서만 등장한다.
 *
 * 3D 주의: preserve-3d 체인 안에서는 opacity/filter/overflow 가 면을 평면으로 붕괴시키므로,
 * 뚜껑 발사는 opacity 없이 transform(이동·회전)으로만 처리하고, 빛기둥/플래시(블러·opacity)는
 * 장면 밖 오버레이로 둔다.
 *
 * 보존: {gender, revealed, onComplete} 계약, hasCompletedRef+isMountedRef 1회 발화,
 * getGenderColors 단일 소스, AnnouncementText 재사용, useReducedMotion 분기, Pointer Events
 * 단일 코드패스, touch-action:manipulation, transform/opacity 한정 모션(C-12).
 */
export function LootboxAnimation({
  gender,
  revealed,
  onComplete,
}: LootboxAnimationProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<LootboxPhase>("closed");
  // onComplete 1회 발화 가드(중복/언마운트 후 발화 방지).
  const hasCompletedRef = useRef(false);
  const isMountedRef = useRef(true);
  const { showRevealAll, markInteracted } = useDelayedRevealButton({
    revealed,
  });

  const colors = getGenderColors(gender);
  // 오픈 전 표면 전용 중립 팔레트(성별 비노출).
  const neutral = getNeutralColors();
  const opened = phase === "exploding";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // onComplete 단일 발화 — 자연 인터랙션 종료/전체 공개 버튼이 공통으로 호출한다.
  const fireComplete = useCallback(() => {
    if (hasCompletedRef.current || !isMountedRef.current) return;
    hasCompletedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  // 상자 열기 — 1회만 동작. 충전 단계로 진입한다.
  const handleOpen = useCallback(() => {
    markInteracted();
    setPhase((prev) => (prev === "closed" ? "charging" : prev));
  }, [markInteracted]);

  // 전체 공개(escape hatch) — 즉시 폭발 상태 + onComplete.
  const handleRevealAll = useCallback(() => {
    setPhase("exploding");
    fireComplete();
  }, [fireComplete]);

  // 키보드 동작(Enter/Space) — 클릭과 동일하게 상자를 연다.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleOpen();
      }
    },
    [handleOpen],
  );

  // 충전 → 폭발 전이. 감속 모드는 충전을 건너뛰고 즉시 폭발한다.
  useEffect(() => {
    if (phase !== "charging") return;
    if (shouldReduceMotion) {
      setPhase("exploding");
      return;
    }
    const timer = setTimeout(() => setPhase("exploding"), CHARGE_MS);
    return () => clearTimeout(timer);
  }, [phase, shouldReduceMotion]);

  // 폭발 진입 시 연출 종료 후 onComplete 1회 발화.
  useEffect(() => {
    if (phase !== "exploding") return;
    const timer = setTimeout(fireComplete, EXPLODE_COMPLETE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, fireComplete]);

  if (!revealed) return null;

  // 대기/충전 단계의 흔들림 — 충전 시 진폭·속도 증가.
  const idleAnimate =
    phase === "charging"
      ? { rotate: [0, -6, 6, -6, 6, 0], scale: 1.08 }
      : { y: [0, -6, 0], rotate: [0, -2, 2, 0], scale: 1 };
  const idleTransition =
    phase === "charging"
      ? { duration: CHARGE_MS / 1000, ease: "easeIn" as const }
      : {
          duration: 2.4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut" as const,
        };

  // 외곽 래퍼 모션 — 낙하 진입 + 대기/충전 흔들림, 폭발 시 정착(흔들림 정지).
  const boxInitial = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -180, scaleY: 0.8 };
  const boxAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : opened
      ? { opacity: 1, y: 0, scaleY: 1, rotate: 0, scale: 1 }
      : { opacity: 1, y: 0, scaleY: [0.8, 1.1, 1], ...idleAnimate };
  const boxTransition = shouldReduceMotion
    ? { duration: 0.3 }
    : opened
      ? { duration: 0.4, ease: "easeOut" as const }
      : {
          opacity: { duration: 0.3 },
          y: { duration: 0.5, ease: "easeOut" as const },
          scaleY: { duration: 0.5, ease: "easeOut" as const },
          default: idleTransition,
        };

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center gap-8">
      {/* 입체 상자 무대 — 고정 크기. 모든 단계에서 상자를 유지하고 폭발 효과를 겹친다. */}
      <div className="relative flex h-72 w-72 items-center justify-center">
        {/* 배경 Light Bloom 피날레 — 상자 뒤에서 개화(balloonpop·scratch 와 동일 효과). */}
        {opened && !shouldReduceMotion && (
          <div className="pointer-events-none absolute inset-0">
            <LightBloomFinale colors={colors} />
          </div>
        )}

        {/* 클릭/포커스 대상 + 낙하/대기/충전/정착 모션. 자식 3D 장면은 2D 레이어로 합성된다. */}
        <motion.div
          role="button"
          tabIndex={0}
          aria-label={t("animations.lootboxPrompt")}
          onPointerDown={handleOpen}
          onKeyDown={handleKeyDown}
          className="relative z-[1] cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-primary/50 rounded-2xl"
          style={{ touchAction: "manipulation" }}
          initial={boxInitial}
          animate={boxAnimate}
          transition={boxTransition}
        >
          {/* 원근 호스트 — 여기서만 perspective 를 건다(2D 래퍼와 분리). */}
          <div
            className="flex items-center justify-center"
            style={{
              perspective: ISO_PERSPECTIVE,
              perspectiveOrigin: "50% 45%",
            }}
          >
            {/* 장면(preserve-3d) + 등각 카메라 — 윗면·앞면·오른쪽면 3면 노출. */}
            <div
              style={{
                position: "relative",
                width: BOX.bodyW,
                height: BOX.bodyH + BOX.lidH,
                transformStyle: "preserve-3d",
                transform: `translateY(8px) ${ISO_CAMERA}`,
              }}
            >
              <IsoBoxBody />
              {/* 뚜껑 — 폭발 시 발사·텀블되어 화면 밖으로 날아간다(opacity 없이 transform 으로만). */}
              <motion.div
                className="absolute inset-0"
                style={{ transformStyle: "preserve-3d" }}
                initial={false}
                animate={
                  opened && !shouldReduceMotion
                    ? { y: -720, rotateX: -210, rotateZ: 24 }
                    : { y: 0, rotateX: 0, rotateZ: 0 }
                }
                transition={
                  opened
                    ? { duration: 0.9, ease: "easeOut" }
                    : { duration: 0.3 }
                }
              >
                <IsoBoxLid neutral={neutral} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 공개 텍스트 — 상자 안에 작게 숨어 있다가 상자 위로 떠올라 겹침 없이 등장. */}
        {opened && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 0, y: -TEXT_RISE_PX }
                  : { opacity: 0, scale: 0.1, y: 0 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1, y: -TEXT_RISE_PX }
                  : {
                      // 셋 다 3키프레임 + 공유 times — opacity 가 scale 정점에서 1이 되어
                      // "작게 시작 → 커지며 상자 위로" 성장 과정이 보이게 한다(투명 중 성장 방지).
                      opacity: [0, 1, 1],
                      scale: [0.1, 1.12, 1],
                      y: [0, -TEXT_RISE_PX, -TEXT_RISE_PX],
                    }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0.3 }
                  : {
                      duration: 0.9,
                      delay: 0.3,
                      ease: "easeOut",
                      times: [0, 0.6, 1],
                    }
              }
            >
              <AnnouncementText
                gender={gender}
                delay={shouldReduceMotion ? 0 : 0.2}
              />
            </motion.div>
          </div>
        )}
      </div>

      {/* 인터랙션 프롬프트(미오픈 시) */}
      {!opened && (
        <p className="text-lg font-medium text-foreground/70">
          {t("animations.lootboxPrompt")}
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
  );
}

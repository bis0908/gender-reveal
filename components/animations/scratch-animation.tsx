"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { getGenderColors, getNeutralColors } from "@/lib/animation-colors";
import { useTranslation } from "@/lib/i18n/context";
import type { Gender } from "@/lib/types";
import { AnnouncementText } from "./announcement-text";
import { LightBloomFinale } from "./firework-accent";
import { TiaraIcon } from "./tiara-icon";
import { useDelayedRevealButton } from "./use-delayed-reveal-button";

interface ScratchAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

/** 전체 공개 트리거가 되는 긁힌 비율 임계값(0~1). */
const SCRATCH_THRESHOLD = 0.5;
/** 긁기 브러시 반지름(CSS px). */
const BRUSH_RADIUS = 28;
/** 긁힌 비율 샘플링용 다운스케일 버퍼 한 변 크기(px). 전체 getImageData 대신 사용. */
const SAMPLE_SIZE = 64;
/** 은박 커버 색(성별 중립 회색 그라데이션 단색 근사). */
const FOIL_COLOR = "#9CA3AF";
/** 부스러기 파티클 방출 스로틀 — 이 횟수마다 1개 방출(pointermove 폭주 방지). */
const CRUMB_EMIT_EVERY = 4;
/** 동시 보유 부스러기 파티클 상한. */
const MAX_CRUMBS = 18;
/** 임계 도달(카드 리빌) 후 onComplete 발화까지의 지연(ms). burst-off+플립+폭죽+공지 노출 확보. */
const REVEAL_COMPLETE_DELAY_MS = 3200;
/** 복권 푸터의 1D 바코드 막대 — 폭(px)·뒤따르는 간격(px)을 함께 가진 고정 불규칙 시퀀스(그래프 아님, 런타임 랜덤 없음). */
const BARCODE_BARS = [
  [2, 1],
  [1, 2],
  [3, 1],
  [1, 1],
  [2, 3],
  [4, 1],
  [1, 2],
  [2, 1],
  [3, 2],
  [1, 1],
  [1, 3],
  [2, 1],
  [4, 2],
  [1, 1],
  [2, 2],
  [3, 1],
  [1, 2],
  [1, 1],
  [2, 3],
  [3, 1],
  [1, 1],
  [4, 2],
  [2, 1],
  [1, 3],
  [3, 1],
  [2, 2],
].map(([w, gap], i) => ({ id: `bar-${i}`, w, gap }));

/** 포인터 위치에서 튀는 부스러기 파티클 1개. */
interface Crumb {
  id: number;
  /** 컨테이너 기준 발생 위치(px). */
  x: number;
  y: number;
  /** 비산 오프셋(px). */
  dx: number;
  dy: number;
}

/**
 * 스포일러 방지: 긁기 전 티켓 chrome 은 중립색, 성별색은 은박 밑 아이콘·뒷면 공지·bloom 등 리빌 경로에서만 등장.
 *
 * 복권 긁기(scratch) 인터랙티브 애니메이션 — Canvas 기반.
 *
 * 연출 흐름: 은박 긁기(destination-out) → 긁기 시작 시 밑면 성별 아이콘(Crown/Tiara) 노출 +
 * 부스러기 파티클·sparkle → 임계 도달 시 남은 은박 burst-off → 카드가 rotateY 플립 → 뒷면에
 * AnnouncementText + 폭죽 → (지연 후) onComplete.
 *
 * 모바일 필수 처리:
 *  1) 캔버스 touch-action:none — 드래그가 페이지 스크롤로 새는 것을 막는다.
 *  2) devicePixelRatio 로 백버퍼 스케일 + resize 시 재초기화.
 *  3) onPointerDown 에서 setPointerCapture — 포인터가 캔버스를 벗어나도 드래그 유지.
 *  4) 긁힌 비율은 다운스케일 버퍼(SAMPLE_SIZE)에서 rAF 스로틀로 샘플. 부스러기 방출도
 *     CRUMB_EMIT_EVERY 로 스로틀해 pointermove 폭주 시 React 노드 churn 을 막는다.
 *
 * 타이밍: 임계 도달 시 revealCard()(climax 재생)와 fireComplete()(지연 발화)를 분리한다.
 * onComplete 가 즉시 발화하면 상위가 화면을 전환해 climax 가 잘리므로(하드컷), 백업 타이머가
 * 제거된 본 경로에서 지연 fireComplete 가 유일한 완료 경로다. 전체 공개 버튼은 즉시 발화.
 */
export function ScratchAnimation({
  gender,
  revealed,
  onComplete,
}: ScratchAnimationProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  // 긁기 중 아이콘 노출 여부.
  const [scratchStarted, setScratchStarted] = useState(false);
  // 임계 도달 → climax(burst-off·플립·폭죽) 재생 상태.
  const [cardRevealed, setCardRevealed] = useState(false);
  // 부스러기 파티클.
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);

  // 은박 캔버스의 크기 산정 기준 = 스크래치 패널(전체 카드가 아니라 티켓 내부 패널).
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isScratchingRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const isMountedRef = useRef(true);
  // rAF 스로틀: 다중 pointermove 동안 비율 측정을 1프레임당 1회로 묶는다.
  const sampleRafRef = useRef<number | null>(null);
  const cardRevealedRef = useRef(false);
  // 은박이 실제로 칠해졌는지 — 미칠 상태(투명 백버퍼)를 "100% 긁힘"으로 오인해 즉시
  // 리빌하는 것을 막는 fail-safe 가드.
  const foilPaintedRef = useRef(false);
  // 부스러기 방출·id 카운터.
  const moveCountRef = useRef(0);
  const crumbIdRef = useRef(0);

  const colors = getGenderColors(gender);
  // 긁기 전 티켓 chrome 전용 중립색(성별 비노출).
  const neutral = getNeutralColors();
  const { showRevealAll, markInteracted } = useDelayedRevealButton({
    revealed,
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (sampleRafRef.current !== null) {
        cancelAnimationFrame(sampleRafRef.current);
      }
    };
  }, []);

  // onComplete 단일 발화 — 지연 후 또는 전체 공개 버튼이 호출한다.
  const fireComplete = useCallback(() => {
    if (hasCompletedRef.current || !isMountedRef.current) return;
    hasCompletedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  // 임계 도달 시 climax 재생(상태 전환만). onComplete 는 별도 지연 타이머가 담당한다.
  const revealCard = useCallback(() => {
    if (cardRevealedRef.current) return;
    cardRevealedRef.current = true;
    setCardRevealed(true);
  }, []);

  // 전체 공개(escape hatch) — 즉시 climax + onComplete(사용자 이탈).
  const handleRevealAll = useCallback(() => {
    revealCard();
    fireComplete();
  }, [revealCard, fireComplete]);

  // 은박 커버 그리기 — devicePixelRatio 로 백버퍼를 스케일한다. resize 마다 재호출.
  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    const panel = panelRef.current;
    if (!canvas || !panel) return;

    const rect = panel.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = FOIL_COLOR;
    ctx.fillRect(0, 0, rect.width, rect.height);
    // 은박 질감(가벼운 사선 줄무늬).
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 6;
    for (let x = -rect.height; x < rect.width; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + rect.height, rect.height);
      ctx.stroke();
    }
    foilPaintedRef.current = true;
  }, []);

  // 긁힌 비율 측정 — 다운스케일 샘플로 투명 픽셀 비율을 계산한다.
  const measureScratchedRatio = useCallback((): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    // 백버퍼를 1회 읽고 SAMPLE_SIZE 그리드로 다운샘플한다. getImageData 호출 자체는
    // 백버퍼 전체를 읽지만, rAF 스로틀(scheduleSample)로 프레임당 1회로 묶여 pointermove
    // 마다 발생하지 않는다. 루프는 stepX/Y 간격으로만 픽셀을 샘플해 비용을 더 낮춘다.
    const stepX = Math.max(1, Math.floor(canvas.width / SAMPLE_SIZE));
    const stepY = Math.max(1, Math.floor(canvas.height / SAMPLE_SIZE));
    let transparent = 0;
    let total = 0;
    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let y = 0; y < canvas.height; y += stepY) {
        for (let x = 0; x < canvas.width; x += stepX) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha < 128) transparent++;
          total++;
        }
      }
    } catch {
      return 0;
    }
    return total === 0 ? 0 : transparent / total;
  }, []);

  // rAF 스로틀로 비율을 측정하고 임계 도달 시 카드 리빌.
  const scheduleSample = useCallback(() => {
    if (sampleRafRef.current !== null) return;
    sampleRafRef.current = requestAnimationFrame(() => {
      sampleRafRef.current = null;
      if (cardRevealedRef.current) return;
      // 은박이 칠해지기 전(투명 백버퍼)에는 완료시키지 않는다(fail-safe).
      if (!foilPaintedRef.current) return;
      const ratio = measureScratchedRatio();
      if (ratio >= SCRATCH_THRESHOLD) {
        revealCard();
      }
    });
  }, [measureScratchedRatio, revealCard]);

  // 캔버스 좌표로 변환해 브러시 자국(destination-out)을 그린다.
  const scratchAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    return { x, y };
  }, []);

  // 부스러기 파티클 방출 — CRUMB_EMIT_EVERY 스로틀, 상한 유지, 자동 제거.
  const emitCrumb = useCallback(
    (x: number, y: number) => {
      if (shouldReduceMotion) return;
      moveCountRef.current += 1;
      if (moveCountRef.current % CRUMB_EMIT_EVERY !== 0) return;
      const id = crumbIdRef.current++;
      const crumb: Crumb = {
        id,
        x,
        y,
        dx: Math.random() * 40 - 20,
        dy: -20 - Math.random() * 30,
      };
      setCrumbs((prev) => [...prev, crumb].slice(-MAX_CRUMBS));
      // 애니메이션 종료 후 제거(누적 방지).
      setTimeout(() => {
        if (isMountedRef.current) {
          setCrumbs((prev) => prev.filter((c) => c.id !== id));
        }
      }, 700);
    },
    [shouldReduceMotion],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (cardRevealedRef.current) return;
      isScratchingRef.current = true;
      markInteracted();
      if (!scratchStarted) setScratchStarted(true);
      // 포인터가 캔버스를 벗어나도 드래그를 유지한다.
      event.currentTarget.setPointerCapture(event.pointerId);
      const pos = scratchAt(event.clientX, event.clientY);
      if (pos) emitCrumb(pos.x, pos.y);
      scheduleSample();
    },
    [scratchAt, scheduleSample, emitCrumb, markInteracted, scratchStarted],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isScratchingRef.current || cardRevealedRef.current) return;
      const pos = scratchAt(event.clientX, event.clientY);
      if (pos) emitCrumb(pos.x, pos.y);
      scheduleSample();
    },
    [scratchAt, scheduleSample, emitCrumb],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      isScratchingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      scheduleSample();
    },
    [scheduleSample],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        markInteracted();
        revealCard();
        fireComplete();
      }
    },
    [revealCard, fireComplete, markInteracted],
  );

  // 캔버스 초기 페인트 — 첫 페인트 전에 은박이 덮이도록 useLayoutEffect 사용(첫 프레임 깜빡임 방지).
  // 이 컴포넌트는 "use client" 이고 `if (!revealed) return null` 이후에만 실행되므로 SSR 경고 낮음.
  useLayoutEffect(() => {
    if (!revealed || cardRevealed) return;
    paintFoil();
  }, [revealed, cardRevealed, paintFoil]);

  // resize 시 은박 재초기화. revealed 이고 카드 리빌 전일 때만 활성.
  useEffect(() => {
    if (!revealed || cardRevealed) return;
    const handleResize = () => paintFoil();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [revealed, cardRevealed, paintFoil]);

  // 카드 리빌 시 climax 종료 후 onComplete 1회 발화(지연 = 유일한 완료 경로).
  useEffect(() => {
    if (!cardRevealed) return;
    const timer = setTimeout(fireComplete, REVEAL_COMPLETE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [cardRevealed, fireComplete]);

  if (!revealed) return null;

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col items-center justify-center gap-6">
      {/* 플립 원근 컨테이너 — 티켓(앞면)이 플립되어 뒷면 공지를 드러낸다. */}
      <div
        className="relative h-56 w-[20rem] max-w-[90vw]"
        style={{ perspective: "1000px" }}
      >
        {/* Light Bloom 피날레 — 카드 리빌 시 중앙 집중 대형 개화. 코어 섬광이 플립 edge-on
            순간(~0.3s)에 관통하고, 동심 링이 카드 정면 도달(~0.6s)에 맞춰 개화한다. */}
        {cardRevealed && !shouldReduceMotion && (
          <LightBloomFinale colors={colors} />
        )}

        {/* 플립 카드 — rotateY 0→180. preserve-3d 로 앞/뒤 면 구성. */}
        <motion.div
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
          initial={false}
          animate={{ rotateY: cardRevealed ? 180 : 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.6,
            ease: "easeInOut",
          }}
        >
          {/* 앞면 — 복권 티켓: 헤더(타이틀·일련번호) + 은박 스크래치 패널 + 바코드 푸터. */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border-2 p-3 shadow-md"
            style={{
              backfaceVisibility: "hidden",
              borderColor: neutral.DEFAULT,
              background: "#FFFDF6",
            }}
          >
            {/* 헤더 — 복권 타이틀 + 가짜 일련번호 */}
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-1.5 text-sm font-extrabold tracking-wide"
                style={{ color: neutral.dark }}
              >
                <Sparkles
                  className="h-4 w-4"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {t("animations.scratchTicketTitle")}
              </span>
              <span
                className="font-mono text-[10px] tracking-widest"
                style={{ color: neutral.DEFAULT }}
              >
                No. 06·16
              </span>
            </div>

            {/* 천공선(perforation) 느낌의 점선 구분 */}
            <div
              className="mt-1.5 border-t border-dashed"
              style={{ borderColor: neutral.DEFAULT }}
            />

            {/* 은박 스크래치 패널 — paintFoil 의 캔버스 크기 산정 기준(panelRef).
                긁기 좌표(scratchAt)·부스러기 좌표가 모두 이 패널 기준이 된다. */}
            <div
              ref={panelRef}
              className="relative mt-2 flex-1 overflow-hidden rounded-lg border"
              style={{ borderColor: neutral.DEFAULT }}
            >
              {/* 아이콘 층(캔버스 뒤) — 긁기 시작 시 성별색으로 부드럽게 노출. */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.light}, ${colors.DEFAULT})`,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: scratchStarted ? 1 : 0,
                    scale: scratchStarted ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.4 }}
                >
                  {gender === "boy" ? (
                    <Crown
                      className="h-20 w-20"
                      style={{ color: colors.dark }}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  ) : (
                    <TiaraIcon
                      className="h-20 w-20"
                      style={{ color: colors.dark }}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  )}
                </motion.div>
              </div>

              {/* 은박 커버 캔버스 — 카드 리빌 전까지만 노출. touch-action:none 필수.
                  리빌 시 burst-off(scale 확대 + 페이드)로 사라진다. */}
              <AnimatePresence>
                {!cardRevealed && (
                  <motion.canvas
                    ref={canvasRef}
                    role="button"
                    tabIndex={0}
                    aria-label={t("animations.scratchPrompt")}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onKeyDown={handleKeyDown}
                    className="absolute inset-0 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
                    style={{ touchAction: "none" }}
                    initial={false}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 1.15 }
                    }
                    transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
                  />
                )}
              </AnimatePresence>

              {/* 부스러기 파티클 — 포인터 따라 튀어오른다(좌표는 패널/캔버스 기준). */}
              {crumbs.map((crumb) => (
                <motion.span
                  key={crumb.id}
                  className="pointer-events-none absolute h-1.5 w-1.5 rounded-sm"
                  style={{
                    left: crumb.x,
                    top: crumb.y,
                    backgroundColor: FOIL_COLOR,
                  }}
                  initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                  animate={{
                    x: crumb.dx,
                    y: [0, crumb.dy, crumb.dy + 50],
                    opacity: 0,
                    scale: 0.4,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              ))}
            </div>

            {/* 푸터 — 가짜 바코드 + 행운 표식(복권 인쇄 질감). */}
            <div className="mt-2 flex items-end justify-between">
              <span className="flex h-5" aria-hidden="true">
                {BARCODE_BARS.map((bar) => (
                  <span
                    key={bar.id}
                    style={{
                      width: `${bar.w}px`,
                      marginRight: `${bar.gap}px`,
                      backgroundColor: neutral.dark,
                    }}
                  />
                ))}
              </span>
              <span
                className="text-xs tracking-widest"
                style={{ color: neutral.DEFAULT }}
                aria-hidden="true"
              >
                ★★★
              </span>
            </div>
          </div>

          {/* 뒷면 — 공지 텍스트(180° 회전 상태로 배치). */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border border-border shadow-md"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: `linear-gradient(135deg, ${colors.light}, ${colors.DEFAULT})`,
            }}
          >
            {cardRevealed && (
              <div className="scale-[0.42]">
                <AnnouncementText
                  gender={gender}
                  delay={shouldReduceMotion ? 0 : 0.3}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 인터랙션 프롬프트(미공개 시) */}
      {!cardRevealed && (
        <p className="text-lg font-medium text-foreground/70">
          {t("animations.scratchPrompt")}
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

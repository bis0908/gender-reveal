"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { BLOOM_GOLD, BLOOM_WHITE } from "@/lib/animation-colors";

/**
 * "Light Bloom" 입자계 — 균일 단색 원의 기계적 방사 대신 보케·글로우·혼합 컨페티·스파클
 * 4계층으로 깊이와 다양성을 만든다. 모든 모션은 transform(x/y/scale/rotate)·opacity·정적
 * filter(blur)만 사용한다(C-12 성능 게이트 유지). 무작위 값은 useMemo 로 1회 생성한다.
 *
 * 계층 구성(성능 스코프):
 *  - LightBloomAmbient: 보케 광망울 + 스파클 더스트. **애니메이션당 1세트**(버스트 수와 무관),
 *    blur 노드(보케)는 상한 BOKEH_COUNT 로 고정 — 다중 버스트에서도 비싼 blur 가 늘지 않는다.
 *  - LightBloomBurst: 글로우 코어 + 혼합 컨페티. **버스트마다** 추가(blur 없음, 저비용).
 */

interface BloomColors {
  /** 성별 light. */
  light: string;
  /** 성별 DEFAULT. */
  DEFAULT: string;
  /** 성별 dark. */
  dark: string;
}

/** 보케 광망울 수(blur 노드 — 상한 고정). */
const BOKEH_COUNT = 7;
/** 스파클 더스트 수. */
const SPARKLE_COUNT = 16;
/** 글로우 코어 수(버스트당). */
const GLOW_CORE_COUNT = 5;
/** 혼합 컨페티 수(버스트당). */
const CONFETTI_COUNT = 20;

/** 결정적이지 않아도 되는 작은 난수 헬퍼. */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 중력 궤적 키프레임 수(많을수록 곡선이 매끄럽다 — DOM 노드 비용 아님). */
const TRAJECTORY_STEPS = 14;
/** 중력 arc 모드 코어 수명(초). 밝은 선두 — 짧게. */
const CORE_ARC_DURATION = 1.3;
/** 중력 arc 모드 컨페티 수명(초). 완만히 떨어지는 트레일 — 길게(완료 지연 한도 내). */
const CONFETTI_ARC_DURATION = 2;

/**
 * 중력 포물선 궤적을 정규화 수명 u∈[0,1] 에서 균등 샘플한다(완만한 곡선 수식).
 *
 * 화면 좌표(+y 아래)의 단순 발사체 모델:
 *  - 초기 속도 v=(cos·speed, sin·speed) 로 방사 발사(angle 이 방향).
 *  - 일정 중력 gravity 가 수직으로만 가속 → x 는 등속, y 는 포물선.
 *      x(u) = vx·u,   y(u) = vy·u + ½·gravity·u²
 * 반환 xs/ys 는 motion 키프레임 배열. ease "linear" + times 생략(균등 분배)으로 보간하면
 * 실제 시간 대비 위치가 그대로 포물선이 되어 부드럽게 솟았다 완만히 떨어진다.
 */
function sampleArc(
  angle: number,
  speed: number,
  gravity: number,
): { xs: number[]; ys: number[] } {
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= TRAJECTORY_STEPS; i++) {
    const u = i / TRAJECTORY_STEPS;
    xs.push(vx * u);
    ys.push(vy * u + 0.5 * gravity * u * u);
  }
  return { xs, ys };
}

/** 별 모양 clip-path(5각). */
const STAR_CLIP =
  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
/**
 * 하트 clip-path(polygon 근사). base transform 에 의존하지 않으므로 텀블 회전(animate rotate)
 * 과 충돌하지 않는다 — 회전해도 하트 형태가 유지된다.
 */
const HEART_CLIP =
  "polygon(50% 100%, 15% 62%, 0% 38%, 8% 16%, 28% 8%, 50% 22%, 72% 8%, 92% 16%, 100% 38%, 85% 62%)";

type ConfettiShape = "circle" | "star" | "heart";

interface AmbientConfig {
  bokeh: {
    id: number;
    size: number;
    x: number;
    y: number;
    driftX: number;
    driftY: number;
    duration: number;
    delay: number;
    opacity: number;
    color: string;
  }[];
  sparkles: {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    color: string;
  }[];
}

/**
 * 보케 광망울 + 스파클 더스트(애니메이션당 1세트). 컨테이너 전체에 분포한다.
 * - 보케: 큰 흐릿한 빛망울이 느리게 바깥+위로 부유(배경 깊이감). blur 정적.
 * - 스파클: 작은 백/금 점이 트윙클(scale 펄스 + opacity).
 */
export function LightBloomAmbient({ colors }: { colors: BloomColors }) {
  const config = useMemo<AmbientConfig>(() => {
    const bokehColors = [colors.light, BLOOM_GOLD, colors.DEFAULT];
    const bokeh = Array.from({ length: BOKEH_COUNT }, (_, id) => ({
      id,
      size: rand(24, 48),
      x: rand(8, 92),
      y: rand(20, 85),
      driftX: rand(-30, 30),
      driftY: rand(-80, -30),
      duration: rand(2, 3),
      delay: rand(0, 0.4),
      opacity: rand(0.15, 0.4),
      color: bokehColors[id % bokehColors.length],
    }));
    const sparkles = Array.from({ length: SPARKLE_COUNT }, (_, id) => ({
      id,
      x: rand(5, 95),
      y: rand(10, 90),
      size: rand(2, 4),
      delay: rand(0, 1.2),
      duration: rand(0.6, 1.1),
      color: Math.random() > 0.5 ? BLOOM_WHITE : BLOOM_GOLD,
    }));
    return { bokeh, sparkles };
  }, [colors.light, colors.DEFAULT]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {config.bokeh.map((b) => (
        <motion.span
          key={`bokeh-${b.id}`}
          className="absolute rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            backgroundColor: b.color,
            filter: "blur(12px)",
          }}
          initial={{ x: 0, y: 0, scale: 0.8, opacity: 0 }}
          animate={{
            x: b.driftX,
            y: b.driftY,
            scale: [0.8, 1.1, 0.95],
            opacity: [0, b.opacity, 0],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: "easeOut",
          }}
        />
      ))}
      {config.sparkles.map((s) => (
        <motion.span
          key={`sparkle-${s.id}`}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            ease: "easeInOut",
            repeat: 1,
            repeatType: "loop",
          }}
        />
      ))}
    </div>
  );
}

/** 입자 공통 궤적 키프레임(중력 arc 또는 레거시 3점). */
interface ParticleArc {
  /** x 키프레임(px). */
  xKeys: number[];
  /** y 키프레임(px, +아래). */
  yKeys: number[];
  /** true → 중력 궤적(linear 보간), false → 레거시 3점(easeOut+times). */
  arc: boolean;
}

interface BurstConfig {
  cores: (ParticleArc & {
    id: number;
    size: number;
    delay: number;
    halo: string;
  })[];
  confetti: (ParticleArc & {
    id: number;
    size: number;
    delay: number;
    spin: number;
    color: string;
    shape: ConfettiShape;
  })[];
}

interface LightBloomBurstProps {
  colors: BloomColors;
  /** 컨테이너 기준 폭발 중심 x(%). */
  x: number;
  /** 컨테이너 기준 폭발 중심 y(%). */
  y: number;
  /** 폭발 시작 지연(초). */
  delay?: number;
  /** 분출 기준 방향(라디안). 기본값 -π/2(위쪽 편향). */
  baseAngle?: number;
  /** 기준 방향 주변 분산 폭(라디안). 작을수록 한 방향으로 모인다. */
  spread?: number;
  /** 거리 스케일(px). */
  radius?: number;
  /** 글로우 코어 수(기본 GLOW_CORE_COUNT). 링별 밀도 조절용. */
  coreCount?: number;
  /** 혼합 컨페티 수(기본 CONFETTI_COUNT). 링별 밀도 조절용. */
  confettiCount?: number;
  /**
   * 중력 계수(radius 배수). 지정 시 입자가 중력 포물선으로 솟았다 완만히 떨어진다(폭죽 willow).
   * 미지정(undefined) 시 레거시 3점 모션(상향 분수, lootbox 호환). 클수록 빨리 떨어진다.
   */
  gravity?: number;
}

/**
 * 글로우 코어 + 혼합 컨페티 단발 버스트(버스트마다 추가, blur 없음).
 *
 * - 각도: baseAngle 주변 무작위 분산(균등 방사 금지).
 * - 물리: gravity 지정 시 발사체 중력 포물선(솟았다 완만히 낙하, willow), 미지정 시 레거시
 *   3점 모션(상향 분수). 각도/속도 입자별 편차 + 스태거 + 텀블 회전.
 * - 글로우 코어: radial-gradient(흰 중심→성별 헤일로→투명)로 빛망울(filter 미사용).
 * - 컨페티: 원/별/하트 혼합, 성별색 + 금 + 백.
 */
export function LightBloomBurst({
  colors,
  x,
  y,
  delay = 0,
  baseAngle = -Math.PI / 2,
  spread = Math.PI,
  radius = 120,
  coreCount = GLOW_CORE_COUNT,
  confettiCount = CONFETTI_COUNT,
  gravity,
}: LightBloomBurstProps) {
  const config = useMemo<BurstConfig>(() => {
    const useArc = gravity !== undefined;
    const g = radius * (gravity ?? 0);
    const cores = Array.from({ length: coreCount }, (_, id) => {
      const angle = baseAngle + rand(-spread / 2, spread / 2);
      const base = {
        id,
        size: rand(12, 20),
        delay: rand(0, 0.12),
        halo: id % 2 === 0 ? colors.DEFAULT : colors.light,
      };
      if (useArc) {
        const { xs, ys } = sampleArc(angle, radius * rand(0.7, 1.1), g);
        return { ...base, xKeys: xs, yKeys: ys, arc: true };
      }
      const distance = radius * rand(0.5, 1.1);
      const targetX = Math.cos(angle) * distance;
      const upY = -Math.abs(Math.sin(angle) * distance * rand(0.6, 1));
      return {
        ...base,
        xKeys: [0, targetX],
        yKeys: [0, upY, upY + 60],
        arc: false,
      };
    });
    const confettiColors = [
      colors.light,
      colors.DEFAULT,
      colors.dark,
      BLOOM_GOLD,
      BLOOM_WHITE,
    ];
    const shapes: ConfettiShape[] = ["circle", "star", "heart"];
    const confetti = Array.from({ length: confettiCount }, (_, id) => {
      const angle = baseAngle + rand(-spread / 2, spread / 2);
      const base = {
        id,
        size: rand(6, 12),
        delay: rand(0, 0.15),
        spin: (Math.random() > 0.5 ? 1 : -1) * rand(180, 540),
        color: confettiColors[id % confettiColors.length],
        shape: shapes[id % shapes.length],
      };
      if (useArc) {
        const { xs, ys } = sampleArc(angle, radius * rand(1, 1.8), g);
        return { ...base, xKeys: xs, yKeys: ys, arc: true };
      }
      const distance = radius * rand(0.7, 1.8);
      const peak = distance * rand(0.7, 1.1);
      const targetX = Math.cos(angle) * distance;
      const upY = -Math.abs(Math.sin(angle) * peak);
      return {
        ...base,
        xKeys: [0, targetX, targetX * 1.1],
        yKeys: [0, upY, peak + rand(120, 260)],
        arc: false,
      };
    });
    return { cores, confetti };
  }, [
    colors.light,
    colors.DEFAULT,
    colors.dark,
    baseAngle,
    spread,
    radius,
    coreCount,
    confettiCount,
    gravity,
  ]);

  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {/* 글로우 코어 — 빠르게 솟구쳐 포물선, radial-gradient 헤일로. */}
      {config.cores.map((c) => (
        <motion.span
          key={`core-${c.id}`}
          className="absolute rounded-full"
          style={{
            width: c.size,
            height: c.size,
            background: `radial-gradient(circle, ${BLOOM_WHITE} 0%, ${c.halo} 45%, transparent 75%)`,
          }}
          initial={{ x: 0, y: 0, scale: c.arc ? 0.5 : 0.4, opacity: 1 }}
          animate={
            c.arc
              ? {
                  x: c.xKeys,
                  y: c.yKeys,
                  scale: [0.5, 1.2, 0.9, 0.4],
                  opacity: [1, 1, 0.7, 0],
                }
              : {
                  x: c.xKeys,
                  y: c.yKeys,
                  scale: [0.4, 1.1, 0.6],
                  opacity: [1, 1, 0],
                }
          }
          transition={
            c.arc
              ? {
                  duration: CORE_ARC_DURATION,
                  delay: delay + c.delay,
                  ease: "linear",
                }
              : {
                  duration: 1.1,
                  delay: delay + c.delay,
                  ease: "easeOut",
                  times: [0, 0.45, 1],
                }
          }
        />
      ))}

      {/* 혼합 컨페티 — 원/별/하트, 중력 포물선 + 텀블 회전. */}
      {config.confetti.map((p) => {
        // 별/하트는 clip-path(base transform 비의존)로 그려 텀블 회전과 충돌하지 않는다.
        const clipPath =
          p.shape === "star"
            ? STAR_CLIP
            : p.shape === "heart"
              ? HEART_CLIP
              : undefined;
        return (
          <motion.span
            key={`confetti-${p.id}`}
            className="absolute"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === "circle" ? "50%" : undefined,
              clipPath,
            }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
            animate={
              p.arc
                ? {
                    x: p.xKeys,
                    y: p.yKeys,
                    rotate: [0, p.spin],
                    opacity: [1, 1, 1, 0],
                    scale: [1, 1, 0.85, 0.6],
                  }
                : {
                    x: p.xKeys,
                    y: p.yKeys,
                    rotate: [0, p.spin],
                    opacity: [1, 1, 0],
                    scale: [1, 1, 0.6],
                  }
            }
            transition={
              p.arc
                ? {
                    duration: CONFETTI_ARC_DURATION,
                    delay: delay + p.delay,
                    ease: "linear",
                  }
                : {
                    duration: 1.5,
                    delay: delay + p.delay,
                    ease: "easeOut",
                    times: [0, 0.4, 1],
                  }
            }
          />
        );
      })}
    </div>
  );
}

/** 피날레 코어 섬광 겹수(중앙 detonation flash). */
const FINALE_FLASH_COUNT = 3;

/**
 * 중앙 detonation 섬광 — radial-gradient 가 한 점에서 빠르게 확장하며 페이드한다(focal "boom").
 * 첫 섬광 peak(약 0.3s)이 scratch 플립의 edge-on 순간에 겹치도록 지연을 0부터 둔다 — 카드가
 * 얇은 사선일 때 관통해 가려지지 않는다. balloonpop 에서는 공지 등장 배경 플래시로 작동한다.
 * filter 미사용 — scale/opacity 만 애니메이트(C-12).
 */
function CoreFlash({
  colors,
  x,
  y,
}: {
  colors: BloomColors;
  x: number;
  y: number;
}) {
  const flashes = useMemo(
    () =>
      Array.from({ length: FINALE_FLASH_COUNT }, (_, id) => ({
        id,
        // 폭발력 강화 — 섬광을 크게(detonation 확대).
        size: 120 + id * 60,
        // 0, 0.08, 0.16 — 첫 섬광 peak(~0.3s)이 플립 edge-on 순간 관통.
        delay: id * 0.08,
        halo: id % 2 === 0 ? colors.light : BLOOM_GOLD,
      })),
    [colors.light],
  );
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {flashes.map((f) => (
        <motion.span
          key={`flash-${f.id}`}
          className="absolute rounded-full"
          style={{
            width: f.size,
            height: f.size,
            // 발생점 중심에 정렬.
            marginLeft: -f.size / 2,
            marginTop: -f.size / 2,
            background: `radial-gradient(circle, ${BLOOM_WHITE} 0%, ${f.halo} 38%, transparent 72%)`,
          }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 1.6, 2.7], opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, delay: f.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/**
 * 블라스트 충격파 — 중심에서 빠르게 확장하며 페이드하는 링(폭발력 강조). 백/성별색 2겹 스태거.
 * border 정적, scale/opacity 만 애니메이트(C-12). balloonpop 팝 충격파와 동일 패턴.
 */
function BlastShockwave({
  colors,
  x,
  y,
}: {
  colors: BloomColors;
  x: number;
  y: number;
}) {
  const rings = [
    { id: 0, size: 96, color: BLOOM_WHITE, toScale: 7.5, delay: 0 },
    { id: 1, size: 72, color: colors.DEFAULT, toScale: 6, delay: 0.08 },
  ];
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {rings.map((r) => (
        <motion.span
          key={`shock-${r.id}`}
          className="absolute rounded-full"
          style={{
            width: r.size,
            height: r.size,
            marginLeft: -r.size / 2,
            marginTop: -r.size / 2,
            border: `3px solid ${r.color}`,
          }}
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: r.toScale, opacity: 0 }}
          transition={{ duration: 0.55, delay: r.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

interface LightBloomFinaleProps {
  colors: BloomColors;
  /** 폭발 중심 x(%). 기본 중앙(50). */
  x?: number;
  /** 폭발 중심 y(%). 기본 중앙(50). */
  y?: number;
}

/**
 * 중앙 집중형 대형 피날레 — 흩뿌린 다발 대신 한 점에서 동심 파동으로 개화한다.
 *
 * 구성(전부 중심 집중):
 *  - 코어 섬광(CoreFlash): 중앙 detonation 빛 폭발(focal "boom"). 플립 edge-on 관통.
 *  - 블라스트 충격파(BlastShockwave): 중심에서 확장하는 링 — 폭발력 강조.
 *  - 안쪽 주개화 링(radius 540·고밀도): 밝은 심장부. 상향 편향(spread 1.7π) 방사 후 중력
 *    포물선으로 솟았다 완만히 떨어진다. 입자수(core 10·confetti 50)로 밀도 확보. 상향 편향이라
 *    카드(scratch) 위/옆으로 솟아 가림이 적다.
 *  - 바깥 willow 파동 링(radius 810·지연 0.16): 큰 반경으로 더 멀리 솟구쳐 더 긴 낙하 트레일(core 6·confetti 42).
 *    절대 중력 g=radius·gravity 라 계수(2.4)는 낮아도 g 자체는 안쪽보다 크다.
 *  - 지속 보케/스파클(LightBloomAmbient): 1세트(blur 상한 보존).
 *
 * 폭발력 강화(반경 3배 + 섬광 확대 + 충격파): g=radius·gravity 라 반경만 3배로 올리면 중력도
 * 3배가 되어 궤적이 동일 형태로 3배 확대된다(완만한 낙하 곡선 보존, 더 멀리·빠르게).
 * balloonpop·scratch 의 climax 폭죽이 공유한다(DRY). 소비자가 !shouldReduceMotion 으로 게이팅.
 * 입자 합계 ≈ 136노드(blur 7) — transform/opacity·정적 blur 한정(C-12).
 */
export function LightBloomFinale({
  colors,
  x = 50,
  y = 50,
}: LightBloomFinaleProps) {
  return (
    <>
      <LightBloomAmbient colors={colors} />
      <CoreFlash colors={colors} x={x} y={y} />
      <BlastShockwave colors={colors} x={x} y={y} />
      {/* 안쪽 주개화 — 고밀도. 상향 편향 방사 후 중력으로 완만히 낙하(willow). 폭발력 3배(반경). */}
      <LightBloomBurst
        colors={colors}
        x={x}
        y={y}
        baseAngle={-Math.PI / 2}
        spread={Math.PI * 1.7}
        radius={540}
        gravity={3}
        coreCount={10}
        confettiCount={50}
      />
      {/* 바깥 willow 파동 — 약간 지연, 큰 반경으로 더 멀리 솟구쳐 더 긴 낙하 트레일. 폭발력 3배(반경). */}
      <LightBloomBurst
        colors={colors}
        x={x}
        y={y}
        delay={0.16}
        baseAngle={-Math.PI / 2}
        spread={Math.PI * 1.5}
        radius={810}
        gravity={2.4}
        coreCount={6}
        confettiCount={42}
      />
    </>
  );
}

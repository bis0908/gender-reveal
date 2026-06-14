"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getGenderColors } from "@/lib/animation-colors";
import type { Gender } from "@/lib/types";
import { AnnouncementText } from "./announcement-text";
import styles from "./fireworks-animation.module.css";

interface FireworksAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

// B1 발사 상한/누적 방지 상수
const MAX_WAVES = 5; // 추가 로켓 발사 웨이브 상한 (이후 clearInterval)
const MAX_ACTIVE_FIREWORKS = 24; // 폭발 효과 동시 보유 상한 (오래된 항목 prune)
const WAVE_INTERVAL_MS = 2000; // 추가 발사 인터벌
const FIREWORK_LIFETIME_MS = 2000; // 폭발 후 상태에서 제거되기까지의 수명

// CSS 애니메이션 기반 파티클 컴포넌트
const FireworkParticle = ({
  color,
  size,
  angle,
  distance,
  duration,
}: {
  color: string;
  size: number;
  angle: number;
  distance: number;
  duration: number;
}) => {
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance;

  return (
    <div
      className={styles.particle}
      style={
        {
          "--size": `${size}px`,
          "--color": color,
          "--duration": `${duration}s`,
          "--target-x": `${targetX}px`,
          "--target-y": `${targetY}px`,
        } as React.CSSProperties
      }
    />
  );
};

// CSS 애니메이션 기반 불꽃 폭발 효과
const Firework = ({
  color,
  lightColor,
  x,
  y,
  delay,
  particleCount = 30, // 성능 최적화: 30개로 제한 (기존 40-60)
  size = 1,
  onFinished,
}: {
  color: string;
  lightColor: string;
  x: number;
  y: number;
  delay: number;
  particleCount?: number;
  size?: number;
  // 폭발 효과가 끝나 상태에서 제거돼야 할 때 호출 (B1 prune)
  onFinished?: () => void;
}) => {
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    // 언마운트 후 setState 방지용 플래그
    let mounted = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 지연 후 폭발 생성
    const explodeTimer = setTimeout(() => {
      if (!mounted) return;
      const count = particleCount + Math.floor(Math.random() * 10);
      const newParticles = [];

      // 폭발 순간의 플래시 효과
      setShowFlash(true);
      const flashTimer = setTimeout(() => {
        if (mounted) setShowFlash(false);
      }, 200);
      timers.push(flashTimer);

      for (let i = 0; i < count; i++) {
        const particleColor = Math.random() > 0.6 ? color : lightColor;
        const particleSize = size * (2 + Math.random() * 5);
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 150;
        const duration = 0.8 + Math.random() * 0.8;

        newParticles.push(
          <FireworkParticle
            key={i}
            color={particleColor}
            size={particleSize}
            angle={angle}
            distance={distance}
            duration={duration}
          />,
        );
      }

      setParticles(newParticles);

      // 파티클 애니메이션 종료 후 부모 상태에서 자신을 제거 (B1 누적 방지)
      const finishTimer = setTimeout(() => {
        if (mounted) onFinished?.();
      }, FIREWORK_LIFETIME_MS);
      timers.push(finishTimer);
    }, delay * 1000);
    timers.push(explodeTimer);

    return () => {
      // self-cleanup: 언마운트 시 타이머 전부 해제
      mounted = false;
      for (const timer of timers) clearTimeout(timer);
    };
  }, [color, lightColor, delay, particleCount, size, onFinished]);

  return (
    <div
      className={styles.firework}
      style={
        {
          "--x": `${x}px`,
          "--y": `${y}px`,
        } as React.CSSProperties
      }
    >
      {/* 폭발 순간의 플래시 효과 */}
      {showFlash && <div className={styles.flash} />}
      {particles}
    </div>
  );
};

// CSS 애니메이션 기반 불꽃 발사 로켓 효과
const FireworkRocket = ({
  color,
  startX,
  endX,
  endY,
  delay,
  onExplode,
}: {
  color: string;
  startX: number;
  endX: number;
  endY: number;
  delay: number;
  onExplode: () => void;
}) => {
  const duration = 1 + Math.random() * 0.5;

  // 로켓 발사 각도 계산 (degree)
  const deltaX = endX - startX;
  const deltaY = -endY; // Y는 아래가 양수이므로 반전
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  // 직진 거리 계산 (향후 속도 조절에 사용 가능)
  const _distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(
      () => {
        if (mounted) onExplode();
      },
      (delay + duration) * 1000,
    );

    return () => {
      // self-cleanup: 언마운트 시 폭발 콜백 타이머 해제
      mounted = false;
      clearTimeout(timer);
    };
  }, [delay, duration, onExplode]);

  return (
    <div
      className={styles.rocket}
      style={
        {
          "--color": color,
          "--start-x": `${startX}px`,
          "--end-x": `${endX - startX}px`,
          "--end-y": `${-endY}px`,
          "--angle": `${angle}deg`,
          "--duration": `${duration}s`,
          "--delay": `${delay}s`,
        } as React.CSSProperties
      }
    />
  );
};

export function FireworksAnimation({
  gender,
  revealed,
  onComplete,
}: FireworksAnimationProps) {
  const [fireworks, setFireworks] = useState<JSX.Element[]>([]);
  const [rockets, setRockets] = useState<JSX.Element[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fireworkCountRef = useRef(0);
  // onComplete 1회 발화 가드
  const completedRef = useRef(false);

  // 폭발 효과가 끝난 firework 를 상태에서 제거 (B1 누적 방지)
  const handleFireworkFinished = useCallback((key: string) => {
    setFireworks((prev) => prev.filter((fw) => fw.key !== key));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!revealed || !container) return;

    // 언마운트 후 setState 방지 플래그
    let mounted = true;
    // 공유 색상 팔레트 — 하드코딩 hex 제거
    const colors = getGenderColors(gender);
    const mainColor = colors.dark; // boy #3B82F6 / girl #EC4899
    const lightColor = colors.DEFAULT; // boy #93C5FD / girl #F9A8D4

    // 화면 크기 측정
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 로켓 발사와 폭발 효과 연결
    const launchFirework = (delay = 0) => {
      const id = fireworkCountRef.current++;
      const rocketKey = `rocket-${id}`;
      const fireworkKey = `fw-${id}`;
      const startX = 100 + Math.random() * (containerWidth - 200);
      const endX = startX + (Math.random() * 100 - 50);
      const endY = 100 + Math.random() * (containerHeight - 300);

      // 로켓 생성
      const newRocket = (
        <FireworkRocket
          key={rocketKey}
          color={lightColor}
          startX={startX}
          endX={endX}
          endY={endY}
          delay={delay}
          onExplode={() => {
            if (!mounted) return;
            // 로켓이 도착하면 폭발 효과 생성
            const newFirework = (
              <Firework
                key={fireworkKey}
                color={mainColor}
                lightColor={lightColor}
                x={endX}
                y={containerHeight - endY}
                delay={0}
                size={gender === "boy" ? 1.2 : 1.5}
                onFinished={() => handleFireworkFinished(fireworkKey)}
              />
            );

            // 동시 보유 상한 적용: 상한 초과 시 가장 오래된 항목부터 prune
            setFireworks((prev) =>
              [...prev, newFirework].slice(-MAX_ACTIVE_FIREWORKS),
            );

            // 로켓 요소 제거
            setRockets((prev) => prev.filter((r) => r.key !== rocketKey));
          }}
        />
      );

      setRockets((prev) => [...prev, newRocket]);
    };

    // 초기 로켓 발사
    for (let i = 0; i < 5; i++) {
      launchFirework(i * 0.4);
    }

    // 추가 로켓 발사 — 웨이브 상한(MAX_WAVES) 도달 시 정지 (B1 무한 발사 방지)
    let waveCount = 0;
    const interval = setInterval(() => {
      waveCount++;
      if (waveCount > MAX_WAVES) {
        clearInterval(interval);
        return;
      }
      for (let i = 0; i < 3; i++) {
        launchFirework(i * 0.3);
      }
    }, WAVE_INTERVAL_MS);

    // 시각 종료 시점에 onComplete 1회만 발화
    const completeTimer = setTimeout(() => {
      if (!mounted || completedRef.current) return;
      completedRef.current = true;
      onComplete?.();
    }, 5000);

    return () => {
      // self-cleanup: 인터벌·타이머 전부 정리 (상한 추가 후에도 유지)
      mounted = false;
      clearInterval(interval);
      clearTimeout(completeTimer);
    };
  }, [revealed, gender, onComplete, handleFireworkFinished]);

  return (
    <div ref={containerRef} className={styles.container}>
      {/* 별빛 효과 배경 */}
      <div className={styles.starsBackground} />

      {/* 로켓과 불꽃 효과 */}
      {rockets}
      {fireworks}

      {/* 공지 텍스트 — 공용 AnnouncementText(진입 지연 2초로 기존 타이밍 보존) */}
      {revealed && (
        <div className={styles.announcement}>
          <AnnouncementText gender={gender} delay={2} />
        </div>
      )}
    </div>
  );
}

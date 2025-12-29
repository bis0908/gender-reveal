"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/context";
import type { Gender } from "@/lib/types";
import styles from "./fireworks-animation.module.css";

interface FireworksAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

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
}: {
  color: string;
  lightColor: string;
  x: number;
  y: number;
  delay: number;
  particleCount?: number;
  size?: number;
}) => {
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    // Create explosion after delay
    const timer = setTimeout(() => {
      const count = particleCount + Math.floor(Math.random() * 10);
      const newParticles = [];

      // Flash effect when firework explodes
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);

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
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [color, lightColor, delay, particleCount, size]);

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
    const timer = setTimeout(
      () => {
        onExplode();
      },
      (delay + duration) * 1000,
    );

    return () => clearTimeout(timer);
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
  const { t } = useTranslation();
  const [fireworks, setFireworks] = useState<JSX.Element[]>([]);
  const [rockets, setRockets] = useState<JSX.Element[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fireworkCountRef = useRef(0);

  useEffect(() => {
    if (!revealed || !containerRef.current) return;

    const mainColor = gender === "boy" ? "#3B82F6" : "#EC4899";
    const lightColor = gender === "boy" ? "#93C5FD" : "#F9A8D4";

    // 화면 크기 측정
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // 로켓 발사와 폭발 효과 연결
    const launchFirework = (delay = 0) => {
      const id = fireworkCountRef.current++;
      const startX = 100 + Math.random() * (containerWidth - 200);
      const endX = startX + (Math.random() * 100 - 50);
      const endY = 100 + Math.random() * (containerHeight - 300);
      const rocketDelay = delay;

      // 로켓 생성
      const newRocket = (
        <FireworkRocket
          key={`rocket-${id}`}
          color={gender === "boy" ? "#93C5FD" : "#F9A8D4"}
          startX={startX}
          endX={endX}
          endY={endY}
          delay={rocketDelay}
          onExplode={() => {
            // 로켓이 도착하면 폭발 효과 생성
            const newFirework = (
              <Firework
                key={`fw-${id}`}
                color={mainColor}
                lightColor={lightColor}
                x={endX}
                y={containerHeight - endY}
                delay={0}
                size={gender === "boy" ? 1.2 : 1.5}
              />
            );

            setFireworks((prev) => [...prev, newFirework]);

            // 로켓 요소 제거
            setRockets((prev) => prev.filter((r) => r.key !== `rocket-${id}`));
          }}
        />
      );

      setRockets((prev) => [...prev, newRocket]);
    };

    // 초기 로켓 발사
    for (let i = 0; i < 5; i++) {
      launchFirework(i * 0.4);
    }

    // 추가 로켓 발사
    const interval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        launchFirework(i * 0.3);
      }
    }, 2000);

    // Trigger callback after a delay
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [revealed, gender, onComplete]);

  return (
    <div ref={containerRef} className={styles.container}>
      {/* 별빛 효과 배경 */}
      <div className={styles.starsBackground} />

      {/* 로켓과 불꽃 효과 */}
      {rockets}
      {fireworks}

      {/* 텍스트 공지 */}
      <div
        className={styles.announcement}
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "scale(1)" : "scale(0.8)",
          transition: "opacity 0.5s 1.5s, transform 0.5s 1.5s",
        }}
      >
        <div
          className={`${styles.announcementText} ${gender === "boy" ? styles.textBoy : styles.textGirl}`}
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s 2s, transform 0.5s 2s",
          }}
        >
          {gender === "boy"
            ? t("animations.boyAnnouncement")
            : t("animations.girlAnnouncement")}
        </div>
      </div>
    </div>
  );
}

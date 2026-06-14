"use client";

import { useEffect, useRef, useState } from "react";
import { getGenderColors } from "@/lib/animation-colors";
import type { Gender } from "@/lib/types";
import { AnnouncementText } from "./announcement-text";
import styles from "./falling-animation.module.css";

interface FallingAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

// CSS 애니메이션 기반 낙하 아이템 컴포넌트
const FallingItem = ({
  icon,
  color,
  x,
  delay,
  duration,
  rotate,
  size,
  opacity,
  swing = false,
}: {
  icon: string;
  color: string;
  x: number;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
  opacity: number;
  swing?: boolean;
}) => {
  return (
    <div
      className={
        swing ? `${styles.fallingItem} ${styles.swing}` : styles.fallingItem
      }
      style={
        {
          "--x-pos": `${x}%`,
          "--delay": `${delay}s`,
          "--duration": `${duration}s`,
          "--rotation": `${rotate}deg`,
          "--target-opacity": opacity,
          "--color": color,
          fontSize: `${size}rem`,
        } as React.CSSProperties
      }
    >
      {icon}
    </div>
  );
};

// 아기 관련 이모지 아이콘
const boyIcons = [
  "👦",
  "👕",
  "🧦",
  "🧸",
  "🍼",
  "🚂",
  "🚙",
  "⚾",
  "🏈",
  "🚀",
  "🧩",
  "🐘",
  "🦖",
  "👟",
  "🧢",
];
const girlIcons = [
  "👧",
  "👗",
  "🧦",
  "🧸",
  "🍼",
  "🎀",
  "👑",
  "🦄",
  "🌸",
  "⭐",
  "🦋",
  "🧚‍♀️",
  "🎠",
  "👒",
  "🩰",
];

// baby 토큰 외 강조색 — getGenderColors(baby 토큰 3단계)에 포함되지 않으므로
// falling 이 자체 보유한다(공유 색상 모듈 범위를 넓히지 않는다).
const ACCENT_COLOR: Record<Gender, string> = {
  boy: "#1D4ED8",
  girl: "#DB2777",
};

// 재사용 가능한 아이템 생성 함수 (성능 최적화: 30개 고정)
const generateFallingItems = (gender: Gender) => {
  const newItems = [];

  const icons = gender === "boy" ? boyIcons : girlIcons;
  // 공유 색상 팔레트 채택: baby 토큰의 dark/DEFAULT 를 메인/라이트로 사용.
  const palette = getGenderColors(gender);
  const mainColor = palette.dark; // boy #3B82F6 / girl #EC4899
  const lightColor = palette.DEFAULT; // boy #93C5FD / girl #F9A8D4
  const accentColor = ACCENT_COLOR[gender]; // baby 토큰 외 강조색

  // 성능 최적화: 30개로 제한 (기존 50-80개)
  const count = 30;

  // 화면의 전체 너비를 균등하게 분할
  const segments = 20;
  const segmentWidth = 100 / segments;

  for (let i = 0; i < count; i++) {
    const icon = icons[Math.floor(Math.random() * icons.length)];

    // 화면 전체에 균등하게 분포시키기 위한 위치 계산
    const segmentIndex = i % segments;
    const x = segmentIndex * segmentWidth + Math.random() * segmentWidth;

    // 다양한 특성 추가
    const delay = Math.random() * 5; // 0-5초 딜레이
    const duration = 4 + Math.random() * 6; // 4-10초 지속
    const rotate = Math.random() * 720 - 360; // -360 ~ 360도 회전
    const size = 1 + Math.random() * 2; // 크기 다양화 (1-3rem)
    const colorRand = Math.random();
    const color =
      colorRand > 0.6 ? mainColor : colorRand > 0.3 ? lightColor : accentColor;
    const opacity = 0.7 + Math.random() * 0.3; // 70-100% 불투명도
    const swing = Math.random() > 0.7; // 30%의 아이템에 흔들림 효과 추가

    newItems.push(
      <FallingItem
        key={`item-${gender}-${i}`}
        icon={icon}
        color={color}
        x={x}
        delay={delay}
        duration={duration}
        rotate={rotate}
        size={size}
        opacity={opacity}
        swing={swing}
      />,
    );
  }

  return newItems;
};

export function FallingAnimation({
  gender,
  revealed,
  onComplete,
}: FallingAnimationProps) {
  const [items, setItems] = useState<JSX.Element[]>([]);
  // 애니메이션 시작(아이템 생성) 1회성 가드
  const animationStarted = useRef(false);
  // onComplete 중복 발화 방지 가드
  const callbackExecuted = useRef(false);
  // 언마운트 후 setState/콜백 방지를 위한 마운트 상태 추적
  const isMounted = useRef(true);

  // 컴포넌트 마운트/언마운트 관리 (결과 표시 시 언마운트되므로 정리 필수)
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!revealed) {
      animationStarted.current = false;
      return;
    }

    // 이미 애니메이션이 시작되었다면 재시작하지 않음
    if (animationStarted.current) return;

    // 애니메이션 시작 상태를 true로 설정
    animationStarted.current = true;

    // Generate falling items (성능 최적화: 30개 고정)
    const newItems = generateFallingItems(gender);
    setItems(newItems);

    // 시각 종료 시점에 onComplete 를 정확히 1회만 발화.
    const timer = setTimeout(() => {
      // 이미 호출되었거나 언마운트된 경우 중단
      if (callbackExecuted.current || !isMounted.current) return;
      callbackExecuted.current = true;
      onComplete?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, [revealed, gender, onComplete]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 배경색 그라데이션으로 부드럽게 */}
      <div
        className={`${styles.background} ${gender === "boy" ? styles.backgroundBoy : styles.backgroundGirl}`}
        style={{
          opacity: revealed ? 1 : 0,
        }}
      />

      {/* 아이템들 - CSS 애니메이션 사용 */}
      {revealed && items}

      {/* 텍스트 공지 — 공용 AnnouncementText 채택(접근성 aria-live·감속 위임). */}
      {revealed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <AnnouncementText gender={gender} delay={1.5} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Gender } from '@/lib/types';

interface FallingAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

// Create a falling item component
const FallingItem = ({ 
  icon, 
  color,
  x, 
  delay,
  duration, 
  rotate,
  size,
  opacity,
  swing = false
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
  // 좌우 흔들림 효과
  const swingAnimation = swing ? {
    x: [x - 30, x + 30, x - 15, x + 15, x],
  } : { x };

  return (
    <motion.div
      className="absolute top-0 text-4xl"
      style={{ 
        color,
        fontSize: `${size}rem`,
        opacity,
        left: `${x}%`,
        filter: "drop-shadow(0 0 2px rgba(0,0,0,0.3))"
      }}
      initial={{ y: -50, rotate: 0, opacity: 0 }}
      animate={{ 
        y: 'calc(100vh + 100px)', 
        rotate,
        opacity: [0, opacity, opacity, 0],
        ...swingAnimation
      }}
      transition={{ 
        duration, 
        delay,
        ease: "linear",
        times: [0, 0.1, 0.9, 1],
        x: {
          duration,
          times: [0, 0.3, 0.5, 0.7, 1],
          ease: "easeInOut"
        }
      }}
    >
      {icon}
    </motion.div>
  );
};

// Baby-related emoji icons
const boyIcons = ["👶", "👕", "🧦", "🧸", "🍼", "🚂", "🚙", "⚾", "🏈", "🚀", "🧩", "🐘", "🦖", "👟", "🧢"];
const girlIcons = ["👶", "👗", "🧦", "🧸", "🍼", "🎀", "👑", "🦄", "🌸", "⭐", "🦋", "🧚‍♀️", "🎠", "👒", "🩰"];

// 재사용 가능한 아이템 생성 함수
const generateFallingItems = (gender: Gender, count: number) => {
  const newItems = [];
  
  const icons = gender === 'boy' ? boyIcons : girlIcons;
  const mainColor = gender === 'boy' ? '#3B82F6' : '#EC4899';
  const lightColor = gender === 'boy' ? '#93C5FD' : '#F9A8D4';
  const darkColor = gender === 'boy' ? '#1D4ED8' : '#DB2777';
  
  // 화면의 전체 너비를 균등하게 분할
  const segments = 20;
  const segmentWidth = 100 / segments;
  
  for (let i = 0; i < count; i++) {
    const icon = icons[Math.floor(Math.random() * icons.length)];
    
    // 화면 전체에 균등하게 분포시키기 위한 위치 계산
    const segmentIndex = i % segments;
    const x = (segmentIndex * segmentWidth) + (Math.random() * segmentWidth);
    
    // 다양한 특성 추가
    const delay = Math.random() * 5; // 0-5초 딜레이
    const duration = 4 + Math.random() * 6; // 4-10초 지속
    const rotate = Math.random() * 720 - 360; // -360 ~ 360도 회전
    const size = 1 + Math.random() * 2; // 크기 다양화 (1-3rem)
    const colorRand = Math.random();
    const color = colorRand > 0.6 ? mainColor : (colorRand > 0.3 ? lightColor : darkColor);
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
      />
    );
  }
  
  return newItems;
};

export function FallingAnimation({ gender, revealed, onComplete }: FallingAnimationProps) {
  const [items, setItems] = useState<JSX.Element[]>([]);
  const animationStarted = useRef(false);
  
  useEffect(() => {
    if (!revealed) {
      animationStarted.current = false;
      return;
    }
    
    // 이미 애니메이션이 시작되었다면 재시작하지 않음
    if (animationStarted.current) return;
    
    // 애니메이션 시작 상태를 true로 설정
    animationStarted.current = true;
    
    // Generate falling items
    const count = 50 + Math.floor(Math.random() * 30); // 50-80 아이템
    const newItems = generateFallingItems(gender, count);
    setItems(newItems);
    
    // Trigger callback after a delay
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [revealed, gender, onComplete]);
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 배경색 그라데이션으로 부드럽게 */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: revealed ? 1 : 0,
          background: gender === 'boy' 
            ? 'radial-gradient(circle, rgba(239,246,255,1) 0%, rgba(219,234,254,1) 100%)' 
            : 'radial-gradient(circle, rgba(253,242,248,1) 0%, rgba(252,231,243,1) 100%)'
        }}
      />
      
      {/* 아이템들 */}
      <AnimatePresence>
        {revealed && items}
      </AnimatePresence>
      
      <motion.div 
        className="absolute inset-0 flex items-center justify-center z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <motion.div 
          className={`text-7xl sm:text-9xl font-bold ${gender === 'boy' ? 'text-baby-blue-dark' : 'text-baby-pink-dark'} drop-shadow-lg`}
          initial={{ opacity: 0, y: 20 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          {gender === 'boy' ? '왕자님 입니다!' : '공주님 입니다!'}
        </motion.div>
      </motion.div>
    </div>
  );
}
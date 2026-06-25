import { useEffect, useRef } from "react";
import { AnimationRenderer } from "@/components/animation-renderer";
import { CountdownTimer } from "@/components/countdown-timer";
import { isInteractiveAnimation, REVEAL_TIMING } from "@/lib/animations";
import type { AnimationType, Gender } from "@/lib/types";

interface RevealAnimationProps {
  isRevealed: boolean;
  gender: Gender;
  babyName: string;
  animationType: AnimationType;
  countdownTime: number;
  currentBabyIndex?: number;
  totalBabies?: number;
  onCountdownComplete: () => void;
  onAnimationComplete: () => void;
}

export function RevealAnimation({
  isRevealed,
  gender,
  babyName,
  animationType,
  countdownTime,
  currentBabyIndex,
  totalBabies,
  onCountdownComplete,
  onAnimationComplete,
}: RevealAnimationProps) {
  const isMultiple =
    currentBabyIndex !== undefined && totalBabies !== undefined;

  // 백업 타이머 1회성 가드 (마운트당 1회만 발화 → 이중 발화 방지, B4).
  // 다태아는 page 의 key={currentBabyIndex} 로 재마운트되어 ref 가 자연히 리셋된다.
  const backupFiredRef = useRef(false);

  // 개별 애니메이션의 onComplete 가 발화하지 않을 경우를 대비한 백업 타이머.
  // 정상 콜백·page 의 완료 가드와 함께 동작하므로 여기서는 1회만 호출하면 된다.
  // 단, 인터랙티브 애니메이션(상자/풍선/긁기)은 사용자 주도 onComplete + 컴포넌트의
  // "전체 공개" 버튼이 escape hatch 이므로 시간 기반 백업 타이머를 건너뛴다.
  useEffect(() => {
    if (!isRevealed) return;
    if (isInteractiveAnimation(animationType)) return;

    const backupTimer = setTimeout(() => {
      if (backupFiredRef.current) return;
      backupFiredRef.current = true;
      onAnimationComplete();
    }, REVEAL_TIMING.ANIMATION_BACKUP_MS);

    return () => clearTimeout(backupTimer);
  }, [isRevealed, animationType, onAnimationComplete]);

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {!isRevealed ? (
        <CountdownTimer
          seconds={countdownTime || 5}
          onComplete={onCountdownComplete}
          gender={gender}
          babyName={babyName}
        />
      ) : (
        <div className="relative h-full animation-container">
          <AnimationRenderer
            gender={gender}
            animationType={animationType}
            isRevealed={isRevealed}
            onComplete={onAnimationComplete}
          />

          {isMultiple && (
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
              <p className="text-lg font-medium">
                아기 {currentBabyIndex + 1}/{totalBabies}: {babyName}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

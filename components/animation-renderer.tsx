"use client";

import { BalloonsAnimation } from "@/components/animations/balloons-animation";
import { ConfettiAnimation } from "@/components/animations/confetti-animation";
import { FallingAnimation } from "@/components/animations/falling-animation";
import { FireworksAnimation } from "@/components/animations/fireworks-animation";
import { RevealAnimation } from "@/components/animations/reveal-animation";
import type { AnimationType, Gender } from "@/lib/types";

interface AnimationRendererProps {
  gender: Gender;
  animationType: AnimationType;
  isRevealed: boolean;
  onComplete?: () => void;
}

export function AnimationRenderer({
  gender,
  animationType,
  isRevealed,
  onComplete,
}: AnimationRendererProps) {
  // onComplete 를 그대로 전달한다(불필요한 래퍼 제거 → 자식 effect 재실행 방지, B3).
  const renderAnimation = () => {
    switch (animationType) {
      case "confetti":
        return (
          <ConfettiAnimation
            gender={gender}
            revealed={isRevealed}
            onComplete={onComplete}
          />
        );
      case "balloons":
        return (
          <BalloonsAnimation
            gender={gender}
            revealed={isRevealed}
            onComplete={onComplete}
          />
        );
      case "fireworks":
        return (
          <FireworksAnimation
            gender={gender}
            revealed={isRevealed}
            onComplete={onComplete}
          />
        );
      case "falling":
        return (
          <FallingAnimation
            gender={gender}
            revealed={isRevealed}
            onComplete={onComplete}
          />
        );
      case "reveal":
        return (
          <RevealAnimation
            gender={gender}
            revealed={isRevealed}
            onComplete={onComplete}
          />
        );
      default:
        return (
          <ConfettiAnimation
            gender={gender}
            revealed={isRevealed}
            onComplete={onComplete}
          />
        );
    }
  };

  return <div className="w-full h-full">{renderAnimation()}</div>;
}

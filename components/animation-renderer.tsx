"use client";

import type { AnimationType, Gender } from "@/lib/types";
import { ConfettiAnimation } from "@/components/animations/confetti-animation";
import { BalloonsAnimation } from "@/components/animations/balloons-animation";
import { FireworksAnimation } from "@/components/animations/fireworks-animation";
import { FallingAnimation } from "@/components/animations/falling-animation";
import { RevealAnimation } from "@/components/animations/reveal-animation";

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
	const handleComplete = () => {
		if (onComplete) {
			onComplete();
		}
	};

	const renderAnimation = () => {
		switch (animationType) {
			case "confetti":
				return (
					<ConfettiAnimation
						gender={gender}
						revealed={isRevealed}
						onComplete={handleComplete}
					/>
				);
			case "balloons":
				return (
					<BalloonsAnimation
						gender={gender}
						revealed={isRevealed}
						onComplete={handleComplete}
					/>
				);
			case "fireworks":
				return (
					<FireworksAnimation
						gender={gender}
						revealed={isRevealed}
						onComplete={handleComplete}
					/>
				);
			case "falling":
				return (
					<FallingAnimation
						gender={gender}
						revealed={isRevealed}
						onComplete={handleComplete}
					/>
				);
			case "reveal":
				return (
					<RevealAnimation
						gender={gender}
						revealed={isRevealed}
						onComplete={handleComplete}
					/>
				);
			default:
				return (
					<ConfettiAnimation
						gender={gender}
						revealed={isRevealed}
						onComplete={handleComplete}
					/>
				);
		}
	};

	return <div className="w-full h-full">{renderAnimation()}</div>;
}

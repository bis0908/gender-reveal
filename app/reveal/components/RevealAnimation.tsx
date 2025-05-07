import { useEffect } from "react";
import { CountdownTimer } from "@/components/countdown-timer";
import { AnimationRenderer } from "@/components/animation-renderer";
import type { Gender, AnimationType } from "@/lib/types";

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

	// 애니메이션이 표시된 후 백업 타이머
	useEffect(() => {
		console.log("RevealAnimation - isRevealed 변경됨:", isRevealed);
		if (isRevealed) {
			// 애니메이션이 완료되지 않을 경우를 대비한 백업 타이머
			const backupTimer = setTimeout(() => {
				console.log("RevealAnimation - 백업 타이머로 애니메이션 완료 처리");
				onAnimationComplete();
			}, 6000); // 6초 후 강제 완료

			return () => clearTimeout(backupTimer);
		}
	}, [isRevealed, onAnimationComplete]);

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

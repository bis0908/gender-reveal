"use client";

import { useState, useEffect } from "react";
import ReactConfetti from "react-confetti";
import { motion } from "framer-motion";
import type { Gender } from "@/lib/types";

interface ConfettiAnimationProps {
	gender: Gender;
	revealed: boolean;
	onComplete?: () => void;
}

export function ConfettiAnimation({
	gender,
	revealed,
	onComplete,
}: ConfettiAnimationProps) {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [showConfetti, setShowConfetti] = useState(false);

	// Set confetti colors based on gender
	const colors =
		gender === "boy"
			? ["#93C5FD", "#3B82F6", "#E0F2FE", "#ffffff"]
			: ["#F9A8D4", "#EC4899", "#FCE7F3", "#ffffff"];

	useEffect(() => {
		// Update dimensions on mount and window resize
		const updateDimensions = () => {
			setDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		updateDimensions();
		window.addEventListener("resize", updateDimensions);

		// Start animation once revealed is true
		if (revealed) {
			setShowConfetti(true);

			// Trigger callback after a delay
			const timer = setTimeout(() => {
				if (onComplete) onComplete();
			}, 3000);

			return () => clearTimeout(timer);
		}

		return () => window.removeEventListener("resize", updateDimensions);
	}, [revealed, onComplete]);

	return (
		<div className="relative h-full w-full overflow-hidden">
			{showConfetti && (
				<ReactConfetti
					width={dimensions.width}
					height={dimensions.height}
					colors={colors}
					numberOfPieces={revealed ? 500 : 0}
					recycle={false}
					gravity={0.2}
				/>
			)}

			<motion.div
				className="absolute inset-0 flex items-center justify-center"
				initial={{ opacity: 0, scale: 0.8 }}
				animate={
					revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
				}
				transition={{ duration: 0.5, delay: 0.5 }}
			>
				<motion.div
					className={`text-7xl sm:text-9xl text-center font-bold ${gender === "boy" ? "text-baby-blue-dark" : "text-baby-pink-dark"}`}
					initial={{ opacity: 0, y: 20 }}
					animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5, delay: 1 }}
				>
					{gender === "boy" ? "왕자님 입니다!" : "공주님 입니다!"}
				</motion.div>
			</motion.div>
		</div>
	);
}

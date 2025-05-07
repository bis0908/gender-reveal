"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Gender } from "@/lib/types";

interface BalloonsAnimationProps {
	gender: Gender;
	revealed: boolean;
	onComplete?: () => void;
}

// Create a single balloon component
const Balloon = ({
	color,
	x,
	delay,
	size,
}: {
	color: string;
	x: number;
	delay: number;
	size: number;
}) => {
	return (
		<motion.div
			className="absolute bottom-0"
			initial={{ y: "100vh", x }}
			animate={{ y: "-120vh", x: x + (Math.random() * 100 - 50) }}
			transition={{
				duration: 15 + Math.random() * 10,
				delay,
				ease: [0.21, 0.67, 0.25, 1.01],
			}}
			style={{ left: `${x}%` }}
		>
			<div
				className="relative"
				style={{
					width: size,
					height: size * 1.2,
					backgroundColor: color,
					borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
					clipPath: "ellipse(50% 50% at 50% 45%)",
					boxShadow: `0 0 10px rgba(0, 0, 0, 0.1), inset ${size / 20}px ${size / 10}px ${size / 5}px rgba(255, 255, 255, 0.3)`,
				}}
			>
				<div
					className="absolute rounded-full"
					style={{
						width: size * 0.4,
						height: size * 0.2,
						backgroundColor: "rgba(255, 255, 255, 0.4)",
						top: size * 0.15,
						left: size * 0.15,
						transform: "rotate(30deg)",
					}}
				/>
			</div>
			<div className="relative">
				<div
					className="absolute w-0.5 h-16 bg-gray-400 -bottom-16 left-1/2 -translate-x-1/2"
					style={{
						transform: `translateX(-50%) rotate(${Math.random() * 10 - 5}deg)`,
						background: "linear-gradient(to bottom, #666666, #999999)",
					}}
				/>
				<div
					className="absolute w-1.5 h-1.5 rounded-full bg-gray-500 -bottom-4 left-1/2 -translate-x-1/2"
					style={{
						boxShadow: "0 0 2px rgba(0, 0, 0, 0.3)",
					}}
				/>
			</div>
		</motion.div>
	);
};

export function BalloonsAnimation({
	gender,
	revealed,
	onComplete,
}: BalloonsAnimationProps) {
	const [balloons, setBalloons] = useState<JSX.Element[]>([]);

	useEffect(() => {
		if (!revealed) return;

		// Generate 15-20 balloons
		const count = 15 + Math.floor(Math.random() * 5);
		const newBalloons = [];

		const mainColor = gender === "boy" ? "#3B82F6" : "#EC4899";
		const lightColor = gender === "boy" ? "#93C5FD" : "#F9A8D4";
		const thirdColor = gender === "boy" ? "#1D4ED8" : "#DB2777";

		for (let i = 0; i < count; i++) {
			const colorRand = Math.random();
			const color =
				colorRand > 0.6 ? mainColor : colorRand > 0.3 ? lightColor : thirdColor;
			const size = 50 + Math.random() * 50; // 50-100px
			const x = Math.random() * 100; // 0-100%
			const delay = 0.1 + Math.random() * 2; // 0.1-2.1s

			newBalloons.push(
				<Balloon key={i} color={color} x={x} delay={delay} size={size} />,
			);
		}

		setBalloons(newBalloons);

		// Trigger callback after a delay
		const timer = setTimeout(() => {
			if (onComplete) onComplete();
		}, 3000);

		return () => clearTimeout(timer);
	}, [revealed, gender, onComplete]);

	return (
		<div className="relative h-full w-full overflow-hidden">
			{balloons}

			<motion.div
				className="absolute inset-0 flex items-center justify-center"
				initial={{ opacity: 0, scale: 0.8 }}
				animate={
					revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
				}
				transition={{ duration: 0.5, delay: 1 }}
			>
				<motion.div
					className={`text-7xl sm:text-9xl text-center font-bold ${gender === "boy" ? "text-baby-blue-dark" : "text-baby-pink-dark"}`}
					initial={{ opacity: 0, y: 20 }}
					animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5, delay: 1.5 }}
				>
					{gender === "boy" ? "왕자님 입니다!" : "공주님 입니다!"}
				</motion.div>
			</motion.div>
		</div>
	);
}

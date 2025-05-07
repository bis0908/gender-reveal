"use client";

import { useState, useEffect, useRef } from "react";
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
			{/* 풍선 본체 */}
			<div
				className="relative"
				style={{
					width: size,
					height: size * 1.18,
					backgroundColor: color,
					borderRadius: "50%", // 더 둥근 형태로 변경
					boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
					position: "relative",
					overflow: "hidden", // 빛 반사 효과가 풍선 밖으로 나가지 않도록
				}}
			>
				{/* 주요 빛 반사 효과 - 왼쪽 상단 */}
				<div
					className="absolute rounded-full"
					style={{
						width: size * 0.5,
						height: size * 0.3,
						background:
							"radial-gradient(circle at center, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%)",
						top: size * 0.15,
						left: size * 0.1,
						transform: "rotate(10deg)",
					}}
				/>

				{/* 작은 빛 반사 효과 - 오른쪽 */}
				<div
					className="absolute rounded-full"
					style={{
						width: size * 0.25,
						height: size * 0.15,
						background:
							"radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 70%)",
						top: size * 0.4,
						right: size * 0.15,
					}}
				/>

				{/* 풍선 하단 매듭 부분 */}
				<div
					className="absolute"
					style={{
						width: size * 0.2,
						height: size * 0.15,
						backgroundColor: color,
						bottom: -size * 0.03,
						left: "50%",
						transform: "translateX(-50%)",
						borderRadius: "0 0 40% 40%",
						filter: "brightness(0.8)",
					}}
				/>
			</div>

			{/* 풍선 끈 */}
			<div className="relative">
				<div
					className="absolute h-16 bg-gray-400 -bottom-16 left-1/2 -translate-x-1/2"
					style={{
						width: size * 0.03,
						maxWidth: "2px",
						minWidth: "1px",
						transform: `translateX(-50%) rotate(${Math.random() * 6 - 3}deg)`,
						background: "linear-gradient(to bottom, #888888, #bbbbbb)",
					}}
				/>

				{/* 매듭 부분 */}
				<div
					className="absolute rounded-full -bottom-4 left-1/2 -translate-x-1/2"
					style={{
						width: size * 0.08,
						height: size * 0.08,
						backgroundColor: color,
						filter: "brightness(0.85)",
						boxShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
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
	const [animationCompleted, setAnimationCompleted] = useState(false);
	// 컴포넌트 마운트 상태 추적
	const isMounted = useRef(true);
	// 콜백 실행 상태 추적
	const callbackExecuted = useRef(false);

	// 애니메이션 완료 처리를 위한 함수
	const completeAnimation = () => {
		// 이미 실행되었거나 컴포넌트가 언마운트된 경우 중단
		if (callbackExecuted.current || !isMounted.current) return;

		callbackExecuted.current = true;
		setAnimationCompleted(true);

		if (onComplete) {
			onComplete();
		}
	};

	// 컴포넌트 마운트/언마운트 관리
	useEffect(() => {
		isMounted.current = true;

		return () => {
			isMounted.current = false;
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!revealed) return;

		// 이미 풍선이 생성되었으면 다시 생성하지 않음
		if (balloons.length > 0) return;

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
			completeAnimation();
		}, 2500); // 2.5초로 조정 (텍스트 애니메이션과 일관성 유지)

		// 콜백 실행을 보장하는 추가 타이머 (마지막 안전장치)
		const guaranteeTimer = setTimeout(() => {
			completeAnimation();
		}, 4000); // 4초 후 반드시 실행

		return () => {
			clearTimeout(timer);
			clearTimeout(guaranteeTimer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [revealed, gender, balloons.length]);

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
					onAnimationComplete={() => {
						if (revealed) {
							// framer-motion 애니메이션 완료 이벤트를 추가로 활용
							setTimeout(completeAnimation, 1500);
						}
					}}
				>
					{gender === "boy" ? "왕자님 입니다!" : "공주님 입니다!"}
				</motion.div>
			</motion.div>
		</div>
	);
}

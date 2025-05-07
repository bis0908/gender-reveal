"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Gender } from "@/lib/types";

interface FireworksAnimationProps {
	gender: Gender;
	revealed: boolean;
	onComplete?: () => void;
}

// Firework particle component with improved visibility
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
		<motion.div
			className="absolute rounded-full"
			style={{
				width: size,
				height: size,
				backgroundColor: color,
				boxShadow: `0 0 ${size * 2}px ${size / 2}px ${color}`,
				top: 0,
				left: 0,
				zIndex: 10,
			}}
			initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
			animate={{
				x: targetX,
				y: targetY,
				scale: [0, 1, 0.5, 0],
				opacity: [1, 1, 0.8, 0],
			}}
			transition={{
				duration,
				times: [0, 0.2, 0.8, 1],
				ease: "easeOut",
			}}
		/>
	);
};

// Single firework explosion effect with improved visibility
const Firework = ({
	color,
	lightColor,
	x,
	y,
	delay,
	particleCount = 40,
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
			const count = particleCount + Math.floor(Math.random() * 20);
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
		<div className="absolute" style={{ left: x, top: y, zIndex: 5 }}>
			{/* 폭발 순간의 플래시 효과 */}
			{showFlash && (
				<div
					className="absolute rounded-full"
					style={{
						width: 30,
						height: 30,
						backgroundColor: "white",
						boxShadow: "0 0 40px 20px white",
						transform: "translate(-50%, -50%)",
						zIndex: 4,
					}}
				/>
			)}
			{particles}
		</div>
	);
};

// 불꽃 발사 로켓 효과
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
	return (
		<motion.div
			className="absolute w-2 h-2 rounded-full"
			style={{
				backgroundColor: color,
				boxShadow: `0 0 6px 3px ${color}`,
				bottom: 0,
				left: startX,
				zIndex: 2,
			}}
			initial={{ y: 0 }}
			animate={{ y: -endY, x: endX - startX }}
			transition={{
				duration: 1 + Math.random() * 0.5,
				delay,
				ease: [0.2, 0.8, 0.4, 1],
			}}
			onAnimationComplete={onExplode}
		/>
	);
};

export function FireworksAnimation({
	gender,
	revealed,
	onComplete,
}: FireworksAnimationProps) {
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
		<div
			ref={containerRef}
			className="relative h-full w-full overflow-hidden bg-gray-900"
		>
			{/* 별빛 효과 배경 */}
			<div className="absolute inset-0 bg-stars-pattern opacity-30" />

			{/* 로켓과 불꽃 효과 */}
			{rockets}
			{fireworks}

			<motion.div
				className="absolute inset-0 flex items-center justify-center z-20"
				initial={{ opacity: 0, scale: 0.8 }}
				animate={
					revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
				}
				transition={{ duration: 0.5, delay: 1.5 }}
			>
				<motion.div
					className={`text-7xl sm:text-9xl text-center font-bold ${gender === "boy" ? "text-baby-blue" : "text-baby-pink"} drop-shadow-md`}
					initial={{ opacity: 0, y: 20 }}
					animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5, delay: 2 }}
				>
					{gender === "boy" ? "왕자님 입니다!" : "공주님 입니다!"}
				</motion.div>
			</motion.div>
		</div>
	);
}

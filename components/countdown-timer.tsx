"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  gender?: 'boy' | 'girl';
}

export function CountdownTimer({ seconds, onComplete, gender }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isActive, onComplete]);

  const colorClass = gender === 'boy' 
    ? 'text-baby-blue-dark' 
    : gender === 'girl' 
      ? 'text-baby-pink-dark' 
      : 'text-baby-mint-dark';

  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        key={timeLeft}
        initial={{ scale: 2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className={`text-9xl font-bold ${colorClass}`}
      >
        {timeLeft > 0 ? timeLeft : ''}
      </motion.div>
    </div>
  );
}
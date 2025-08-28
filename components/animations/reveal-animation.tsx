"use client";

import { motion } from 'framer-motion';
import type { Gender } from '@/lib/types';
import { useTranslation } from "@/lib/i18n/context";

interface RevealAnimationProps {
  gender: Gender;
  revealed: boolean;
  onComplete?: () => void;
}

export function RevealAnimation({ gender, revealed, onComplete }: RevealAnimationProps) {
  const { t } = useTranslation();
  const genderColor = gender === 'boy' ? 'baby-blue' : 'baby-pink';
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      <motion.div 
        className={`absolute inset-0 bg-${genderColor}-light flex items-center justify-center`}
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
        onAnimationComplete={() => {
          if (revealed && onComplete) {
            setTimeout(onComplete, 2000);
          }
        }}
      >
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div
            className={`text-8xl sm:text-9xl font-bold text-${genderColor}-dark text-center`}
            initial={{ y: 50, opacity: 0 }}
            animate={revealed ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {gender === 'boy' ? t('animations.boyTitle') : t('animations.girlTitle')}
          </motion.div>
          
          <motion.div
            className={`text-8xl sm:text-9xl font-bold text-${genderColor}-dark mt-4 text-center`}
            initial={{ y: 70, opacity: 0 }}
            animate={revealed ? { y: 0, opacity: 1 } : { y: 70, opacity: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            {t('animations.finalText')}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
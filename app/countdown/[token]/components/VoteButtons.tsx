"use client";

/**
 * 투표 버튼 컴포넌트
 * 왕자/공주 투표 버튼 UI
 */

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import type { VoteType } from "@/lib/types";

interface VoteButtonsProps {
  onVote: (vote: VoteType) => void;
  isVoting: boolean;
  disabled: boolean;
}

const buttonVariants = {
  hover: { scale: 1.02, y: -2 },
  tap: { scale: 0.98 },
};

export function VoteButtons({ onVote, isVoting, disabled }: VoteButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6">
      {/* Team Blue 버튼 */}
      <motion.button
        type="button"
        onClick={() => onVote("prince")}
        disabled={disabled || isVoting}
        variants={buttonVariants}
        whileHover={!disabled && !isVoting ? "hover" : undefined}
        whileTap={!disabled && !isVoting ? "tap" : undefined}
        className="vote-button vote-button-blue"
      >
        {isVoting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span className="text-xl">👑</span>
            <span>{t("dday.votePrince")}</span>
          </>
        )}
      </motion.button>

      {/* Team Pink 버튼 */}
      <motion.button
        type="button"
        onClick={() => onVote("princess")}
        disabled={disabled || isVoting}
        variants={buttonVariants}
        whileHover={!disabled && !isVoting ? "hover" : undefined}
        whileTap={!disabled && !isVoting ? "tap" : undefined}
        className="vote-button vote-button-pink"
      >
        {isVoting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span className="text-xl">👸</span>
            <span>{t("dday.votePrincess")}</span>
          </>
        )}
      </motion.button>

      <style jsx global>{`
        .vote-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 160px;
        }

        .vote-button-blue {
          background: linear-gradient(135deg, #60a5fa, #3b82f6, #2563eb);
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
        }

        .vote-button-blue:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }

        .vote-button-pink {
          background: linear-gradient(135deg, #f472b6, #ec4899, #db2777);
          box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
        }

        .vote-button-pink:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5);
        }

        .vote-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
}

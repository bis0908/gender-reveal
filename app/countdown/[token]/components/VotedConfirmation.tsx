"use client";

/**
 * 투표 완료 확인 메시지 컴포넌트
 */

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import type { VoteType } from "@/lib/types";

interface VotedConfirmationProps {
  selectedVote: VoteType;
  isReturningVoter?: boolean;
}

export function VotedConfirmation({
  selectedVote,
  isReturningVoter = false,
}: VotedConfirmationProps) {
  const { t } = useTranslation();

  const voteInfo = {
    prince: {
      label: "👑",
      labelText: t("dday.votePrince").split("!")[0] + "!",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    princess: {
      label: "👸",
      labelText: t("dday.votePrincess").split("!")[0] + "!",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
    },
  };

  const info = voteInfo[selectedVote];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mt-6 p-4 rounded-xl border ${info.bgColor} ${info.borderColor} text-center`}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-green-500 text-xl">✓</span>
        <span className="text-2xl">{info.label}</span>
        <span className={`font-bold text-lg ${info.color}`}>
          {info.labelText}
        </span>
        <span className="text-gray-600">{t("dday.votedFor")}</span>
      </div>

      <p className="text-gray-600">
        {isReturningVoter ? t("dday.alreadyVoted") : t("dday.thanksForVoting")}
      </p>
    </motion.div>
  );
}

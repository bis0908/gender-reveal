"use client";

/**
 * 투표 게이지 바 컴포넌트
 * 왕자/공주 투표 현황을 시각적으로 표시
 */

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

interface VoteGaugeBarProps {
  label: string;
  icon: string;
  count: number;
  total: number;
  color: "blue" | "pink";
}

export function VoteGaugeBar({
  label,
  icon,
  count,
  total,
  color,
}: VoteGaugeBarProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  const colorClasses = {
    blue: {
      gradient: "from-blue-400 via-blue-500 to-blue-600",
      glow: "shadow-[0_0_12px_rgba(59,130,246,0.5)]",
      text: "text-blue-600",
    },
    pink: {
      gradient: "from-pink-400 via-pink-500 to-pink-600",
      glow: "shadow-[0_0_12px_rgba(236,72,153,0.5)]",
      text: "text-pink-600",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="flex items-center gap-3 my-3">
      {/* 레이블 */}
      <div
        className={`flex items-center gap-1.5 min-w-[110px] font-medium ${colors.text}`}
      >
        <span className="text-xl">{icon}</span>
        <span>{label}</span>
      </div>

      {/* 게이지 바 트랙 */}
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} ${colors.glow}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* 퍼센트 */}
      <div className={`font-semibold min-w-[45px] text-right ${colors.text}`}>
        {percentage}%
      </div>
    </div>
  );
}

interface VoteGaugeSectionProps {
  prince: number;
  princess: number;
}

export function VoteGaugeSection({ prince, princess }: VoteGaugeSectionProps) {
  const { t } = useTranslation();
  const total = prince + princess;

  return (
    <div className="my-6 px-2">
      <VoteGaugeBar
        label={t("dday.teamBlue")}
        icon="👑"
        count={prince}
        total={total}
        color="blue"
      />
      <VoteGaugeBar
        label={t("dday.teamPink")}
        icon="👸"
        count={princess}
        total={total}
        color="pink"
      />

      {total > 0 && (
        <p className="text-center text-sm text-gray-500 mt-3">
          {t("dday.totalVotes", { count: String(total) })}
        </p>
      )}
    </div>
  );
}

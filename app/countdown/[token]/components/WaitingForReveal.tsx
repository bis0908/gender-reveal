"use client";

/**
 * D-Day 도달 후 공개 대기 상태 UI
 */

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export function WaitingForReveal() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-8"
    >
      <div className="text-5xl mb-4">✨</div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent mb-3">
        {t("dday.waitingTitle")}
      </h2>

      <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
        <span className="text-2xl">🎁</span>
        <span>{t("dday.waitingMessage")}</span>
      </div>

      <div className="flex justify-center mb-4">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>

      <p className="text-sm text-gray-500">{t("dday.autoUpdate")}</p>
    </motion.div>
  );
}

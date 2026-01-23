"use client";

/**
 * 성별 공개 완료 후 리다이렉트 UI
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface RevealedRedirectProps {
  revealToken: string;
}

export function RevealedRedirect({ revealToken }: RevealedRedirectProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-8"
    >
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
        {t("dday.revealedTitle")}
      </h2>

      <Link
        href={`/reveal?token=${revealToken}`}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg text-white
          bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
          shadow-lg shadow-purple-500/30
          hover:shadow-xl hover:shadow-purple-500/40
          hover:-translate-y-0.5
          transition-all duration-200"
      >
        <span className="text-xl">👑</span>
        <span>{t("dday.goToCelebrate")}</span>
        <span className="text-xl">👸</span>
      </Link>
    </motion.div>
  );
}

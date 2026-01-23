"use client";

/**
 * 카운트다운 카드 컨테이너
 * 글래스모피즘 스타일의 메인 카드 UI
 */

import type { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n/context";

interface CountdownCardProps {
  babyName: string;
  children: ReactNode;
}

export function CountdownCard({ babyName, children }: CountdownCardProps) {
  const { t } = useTranslation();

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* 그라데이션 테두리 효과 */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-[2px]">
        <div className="h-full w-full rounded-3xl bg-white/95 backdrop-blur-sm" />
      </div>

      {/* 카드 콘텐츠 */}
      <div className="relative rounded-3xl p-6 sm:p-8">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🍼</div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {t("dday.cardTitle", { babyName })}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {t("dday.cardSubtitle", { babyName })}
          </p>
        </div>

        {/* 자식 컴포넌트 (타이머, 투표 영역 등) */}
        {children}
      </div>
    </div>
  );
}

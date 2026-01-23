"use client";

/**
 * 카운트다운 타이머 컴포넌트
 * 일/시간 단위로 남은 시간 표시
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/context";
import {
  calculateTimeRemaining,
  type TimeRemaining,
} from "@/lib/utils/time";

interface CountdownTimerProps {
  scheduledAt: string;
  serverTime?: number | null;
  onExpired: () => void;
}

export function CountdownTimer({
  scheduledAt,
  serverTime,
  onExpired,
}: CountdownTimerProps) {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(scheduledAt, serverTime),
  );
  // onExpired 중복 호출 방지
  const [hasCalledExpired, setHasCalledExpired] = useState(false);

  const updateTime = useCallback(() => {
    const newTime = calculateTimeRemaining(scheduledAt, serverTime);
    setTimeRemaining(newTime);

    // 만료 시 한 번만 호출
    if (newTime.isExpired && !hasCalledExpired) {
      setHasCalledExpired(true);
      onExpired();
    }
  }, [scheduledAt, serverTime, onExpired, hasCalledExpired]);

  // serverTime 변경 시 즉시 재계산
  useEffect(() => {
    const newTime = calculateTimeRemaining(scheduledAt, serverTime);
    setTimeRemaining(newTime);
  }, [scheduledAt, serverTime]);

  useEffect(() => {
    // 초기 계산
    updateTime();

    // 1분마다 업데이트
    const intervalId = setInterval(updateTime, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [updateTime]);

  if (timeRemaining.isExpired) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✨</div>
        <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
          {t("dday.ddayReached")}
        </p>
        <p className="text-gray-500 mt-2">{t("dday.genderRevealSoon")}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-4 sm:gap-6 my-6">
      {/* Days 타일 */}
      <div className="bg-gradient-to-b from-slate-50 to-slate-200 border border-indigo-500/20 rounded-2xl py-4 px-6 sm:py-6 sm:px-8 min-w-[80px] sm:min-w-[100px] text-center shadow-md">
        <div className="text-[2rem] sm:text-[2.5rem] font-bold bg-gradient-to-br from-blue-500 to-violet-500 bg-clip-text text-transparent">
          {String(timeRemaining.days).padStart(2, "0")}
        </div>
        <div className="text-sm text-slate-500 uppercase tracking-wide mt-1">
          {t("dday.daysLabel")}
        </div>
      </div>

      {/* Hours 타일 */}
      <div className="bg-gradient-to-b from-slate-50 to-slate-200 border border-indigo-500/20 rounded-2xl py-4 px-6 sm:py-6 sm:px-8 min-w-[80px] sm:min-w-[100px] text-center shadow-md">
        <div className="text-[2rem] sm:text-[2.5rem] font-bold bg-gradient-to-br from-blue-500 to-violet-500 bg-clip-text text-transparent">
          {String(timeRemaining.hours).padStart(2, "0")}
        </div>
        <div className="text-sm text-slate-500 uppercase tracking-wide mt-1">
          {t("dday.hoursLabel")}
        </div>
      </div>
    </div>
  );
}

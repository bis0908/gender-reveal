"use client";

/**
 * 피드백 모달 24시간 노출 제한 훅
 * localStorage에 마지막 표시 시간을 저장하여 24시간 이내 재표시 방지
 */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gr-feedback-last-shown";
const THROTTLE_DURATION_MS = 24 * 60 * 60 * 1000; // 24시간

interface UseFeedbackModalThrottleReturn {
  canShow: boolean; // 모달 표시 가능 여부
  markAsShown: () => void; // 표시 완료 마킹
  remainingHours: number | null; // 남은 시간 (디버깅용)
  lastShownDate: Date | null; // 마지막 표시 날짜 (디버깅용)
}

export function useFeedbackModalThrottle(): UseFeedbackModalThrottleReturn {
  const [canShow, setCanShow] = useState<boolean>(true);
  const [remainingHours, setRemainingHours] = useState<number | null>(null);
  const [lastShownDate, setLastShownDate] = useState<Date | null>(null);

  useEffect(() => {
    try {
      // localStorage에서 마지막 표시 시간 읽기
      const lastShownStr = localStorage.getItem(STORAGE_KEY);

      // 최초 방문자 (localStorage 비어있음)
      if (!lastShownStr) {
        setCanShow(true);
        return;
      }

      // 타임스탬프 파싱
      const lastShownTime = new Date(lastShownStr).getTime();

      // 잘못된 타임스탬프 처리
      if (Number.isNaN(lastShownTime)) {
        console.warn(
          "[useFeedbackModalThrottle] 잘못된 타임스탬프 발견, localStorage 초기화",
        );
        localStorage.removeItem(STORAGE_KEY);
        setCanShow(true);
        return;
      }

      // 24시간 경과 확인
      const now = Date.now();
      const elapsedMs = now - lastShownTime;

      if (elapsedMs >= THROTTLE_DURATION_MS) {
        // 24시간 경과 → 표시 가능
        setCanShow(true);
        setRemainingHours(0);
      } else {
        // 24시간 미경과 → 표시 불가
        setCanShow(false);
        const remainingMs = THROTTLE_DURATION_MS - elapsedMs;
        setRemainingHours(Math.ceil(remainingMs / (60 * 60 * 1000)));
      }

      // 디버깅용 날짜 설정
      setLastShownDate(new Date(lastShownTime));
    } catch (error) {
      // localStorage 비활성화 (시크릿 모드) 등 예외 처리
      console.warn(
        "[useFeedbackModalThrottle] localStorage 접근 실패, 기본값 사용:",
        error,
      );
      setCanShow(true);
    }
  }, []);

  // 모달 표시 완료 마킹
  const markAsShown = useCallback(() => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, now);
      setCanShow(false);
      setLastShownDate(new Date(now));
      setRemainingHours(24);
      console.log(`[useFeedbackModalThrottle] 모달 표시 시간 저장: ${now}`);
    } catch (error) {
      console.warn("[useFeedbackModalThrottle] localStorage 저장 실패:", error);
    }
  }, []);

  return {
    canShow,
    markAsShown,
    remainingHours,
    lastShownDate,
  };
}

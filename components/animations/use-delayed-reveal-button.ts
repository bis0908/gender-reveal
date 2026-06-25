"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** revealed 후 상호작용이 없을 때 "전체 공개" 링크를 노출하기까지의 지연(ms). */
const REVEAL_BUTTON_DELAY_MS = 5000;

interface UseDelayedRevealButtonOptions {
  /** 리빌 단계 진입 여부. true 가 되면 지연 타이머를 시작한다. */
  revealed: boolean;
}

interface UseDelayedRevealButtonResult {
  /** "전체 공개" 링크를 시각적으로 노출할지 여부(opacity 전환용). */
  showRevealAll: boolean;
  /** 사용자가 상호작용을 시작했음을 알린다 — 지연 노출 타이머를 취소한다. */
  markInteracted: () => void;
}

/**
 * 인터랙티브 리빌(상자/풍선/긁기) 3종이 공유하는 "전체 공개" 링크 지연 노출 로직.
 *
 * - revealed 진입 후 REVEAL_BUTTON_DELAY_MS 동안 상호작용(클릭/탭/긁기)이 없으면
 *   showRevealAll 을 true 로 전환한다(escape hatch 안내).
 * - 사용자가 상호작용을 시작하면 markInteracted() 로 타이머를 취소해 링크를 띄우지 않는다.
 * - 접근성: 이 훅은 시각 노출(opacity)만 제어한다. 링크 자체는 항상 DOM 에 존재해야 하며
 *   키보드 포커스(focus-visible) 시 즉시 보이게 하는 처리는 각 컴포넌트의 className 이 담당한다.
 */
export function useDelayedRevealButton({
  revealed,
}: UseDelayedRevealButtonOptions): UseDelayedRevealButtonResult {
  const [showRevealAll, setShowRevealAll] = useState(false);
  // 상호작용 발생 후 타이머가 다시 켜지지 않도록 하는 가드.
  const interactedRef = useRef(false);

  const markInteracted = useCallback(() => {
    interactedRef.current = true;
    setShowRevealAll(false);
  }, []);

  useEffect(() => {
    if (!revealed || interactedRef.current) return;

    const timer = setTimeout(() => {
      // 상호작용이 없었던 경우에만 노출한다.
      if (!interactedRef.current) setShowRevealAll(true);
    }, REVEAL_BUTTON_DELAY_MS);

    return () => clearTimeout(timer);
  }, [revealed]);

  return { showRevealAll, markInteracted };
}

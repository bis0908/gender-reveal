"use client";

/**
 * 투표 상태 관리 훅
 * 투표 현황 polling + localStorage 기반 투표 여부 추적
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { VoteStatus, VoteType } from "@/lib/types";

interface UseVoteStatusReturn {
  votes: VoteStatus | null;
  hasVoted: boolean;
  myVote: VoteType | null;
  isRevealed: boolean;
  isLoading: boolean;
  serverTime: number | null;
  refetch: () => Promise<void>;
  markAsVoted: (vote: VoteType) => void;
}

const VOTE_KEY_PREFIX = "gr-voted-";
const POLLING_INTERVAL = 3000; // 3초

export function useVoteStatus(revealId: string): UseVoteStatusReturn {
  const [votes, setVotes] = useState<VoteStatus | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [myVote, setMyVote] = useState<VoteType | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverTime, setServerTime] = useState<number | null>(null);

  // localStorage에서 투표 여부 확인
  useEffect(() => {
    if (!revealId) return;

    const voted = localStorage.getItem(`${VOTE_KEY_PREFIX}${revealId}`);
    if (voted) {
      setHasVoted(true);
      setMyVote(voted as VoteType);
    }
  }, [revealId]);

  const isFetching = useRef(false);

  // 투표 현황 조회
  const fetchVoteStatus = useCallback(async () => {
    if (!revealId || isFetching.current) return;

    isFetching.current = true;
    try {
      const res = await fetch(`/api/dday/vote?revealId=${revealId}`);
      if (!res.ok) {
        console.error("투표 현황 조회 실패:", res.status);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setVotes({
          prince: data.votes.prince,
          princess: data.votes.princess,
          total: data.total,
        });
        setIsRevealed(data.isRevealed);
        setServerTime(data.serverTime);
      }
    } catch (error) {
      console.error("Polling 실패:", error);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [revealId]);

  // Polling with Page Visibility API
  useEffect(() => {
    if (!revealId) return;

    let intervalId: NodeJS.Timeout;

    const poll = () => {
      // 탭이 비활성화되면 polling 스킵
      if (document.hidden) return;
      fetchVoteStatus();
    };

    // 초기 실행
    poll();

    // 3초 간격 polling
    intervalId = setInterval(poll, POLLING_INTERVAL);

    // visibility change 이벤트 핸들러
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 탭이 다시 활성화되면 즉시 fetch
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [revealId, fetchVoteStatus]);

  // 투표 완료 시 localStorage 업데이트 (외부에서 호출)
  const markAsVoted = useCallback(
    (vote: VoteType) => {
      localStorage.setItem(`${VOTE_KEY_PREFIX}${revealId}`, vote);
      setHasVoted(true);
      setMyVote(vote);
    },
    [revealId],
  );

  return {
    votes,
    hasVoted,
    myVote,
    isRevealed,
    isLoading,
    serverTime,
    refetch: fetchVoteStatus,
    markAsVoted,
  };
}

/**
 * 투표 완료 마킹 헬퍼 (외부에서 사용)
 */
export function markVoteComplete(revealId: string, vote: VoteType): void {
  localStorage.setItem(`${VOTE_KEY_PREFIX}${revealId}`, vote);
}

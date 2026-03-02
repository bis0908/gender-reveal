"use client";

/**
 * D-Day 카운트다운 페이지
 * /countdown/[token] 라우트
 */

import { isPast } from "date-fns";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useVoteStatus } from "@/hooks/useVoteStatus";
import { useTranslation } from "@/lib/i18n/context";
import type { VoteType } from "@/lib/types";

import { CountdownCard } from "./components/CountdownCard";
import { CountdownTimer } from "./components/CountdownTimer";
import { RevealedRedirect } from "./components/RevealedRedirect";
import { VoteButtons } from "./components/VoteButtons";
import { VotedConfirmation } from "./components/VotedConfirmation";
import { VoteGaugeSection } from "./components/VoteGaugeBar";
import { WaitingForReveal } from "./components/WaitingForReveal";

// 페이지 상태
type PageState = "loading" | "countdown" | "waiting" | "revealed" | "error";

// 토큰 데이터
interface TokenData {
  babyName: string;
  scheduledAt: string;
  revealId: string;
  type: "countdown";
}

export default function CountdownPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const deviceId = useDeviceId();
  const { t } = useTranslation();

  // 페이지 상태
  const [pageState, setPageState] = useState<PageState>("loading");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [revealToken, setRevealToken] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 투표 상태
  const [isVoting, setIsVoting] = useState(false);
  const [isReturningVoter, setIsReturningVoter] = useState(false);

  // 투표 현황 polling
  const {
    votes,
    hasVoted,
    myVote,
    isRevealed,
    isLoading,
    serverTime,
    markAsVoted,
  } = useVoteStatus(tokenData?.revealId || "");

  // 토큰 검증
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError(t("dday.noToken"));
        setPageState("error");
        return;
      }

      try {
        const res = await fetch("/api/verify-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, purpose: "countdown" }),
        });

        if (!res.ok) {
          const data = await res.json();
          const errorMessage =
            data?.error?.message ||
            (typeof data?.error === "string" ? data.error : undefined);
          throw new Error(errorMessage || t("dday.tokenVerifyFailed"));
        }

        const response = await res.json();
        const payload = response.data;

        // countdown 토큰인지 확인
        if (payload.type !== "countdown") {
          // 일반 reveal 토큰이면 reveal 페이지로 리다이렉트
          window.location.href = `/reveal?token=${token}`;
          return;
        }

        setTokenData({
          babyName: payload.babyName,
          scheduledAt: payload.scheduledAt,
          revealId: payload.revealId,
          type: "countdown",
        });

        // revealToken은 같은 토큰에서 추출 (또는 별도 저장)
        setRevealToken(token);

        // 상태 결정
        const scheduledDate = new Date(payload.scheduledAt);
        if (isPast(scheduledDate)) {
          // D-Day가 지났으면 바로 reveal 페이지로 이동
          router.replace(`/reveal?token=${token}&source=countdown`);
          return;
        } else {
          setPageState("countdown");
        }
      } catch (err) {
        console.error("토큰 검증 에러:", err);
        setError(err instanceof Error ? err.message : t("dday.unknownError"));
        setPageState("error");
      }
    }

    verifyToken();
  }, [token, router, t]);

  // 공개 상태 감지
  useEffect(() => {
    if (isRevealed) {
      setPageState("revealed");
    }
  }, [isRevealed]);

  // hasVoted 초기 상태 확인 (재방문자)
  useEffect(() => {
    if (hasVoted && myVote) {
      setIsReturningVoter(true);
    }
  }, [hasVoted, myVote]);

  // D-Day 도달 핸들러
  const handleExpired = useCallback(() => {
    // 카운트다운 종료 시 바로 리다이렉트
    setPageState("loading");
    router.replace(`/reveal?token=${token}&source=countdown`);
  }, [router, token]);

  // 투표 핸들러
  const handleVote = useCallback(
    async (vote: VoteType) => {
      if (!tokenData || !deviceId || isVoting) return;

      setIsVoting(true);

      try {
        const res = await fetch("/api/dday/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            revealId: tokenData.revealId,
            vote,
            deviceId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          // 이미 투표한 경우
          if (data.error?.code === "ALREADY_VOTED") {
            markAsVoted(data.error.details.previousVote);
            setIsReturningVoter(true);
          } else {
            throw new Error(data.error?.message || t("dday.voteFailed"));
          }
        } else {
          // 투표 성공
          markAsVoted(vote);
        }
      } catch (err) {
        console.error("투표 에러:", err);
        alert(err instanceof Error ? err.message : t("dday.voteFailed"));
      } finally {
        setIsVoting(false);
      }
    },
    [tokenData, deviceId, isVoting, markAsVoted, t],
  );

  // 로딩 상태
  if (pageState === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-600">{t("dday.loading")}</p>
      </div>
    );
  }

  // 에러 상태
  if (pageState === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-5xl mb-4">😢</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {t("dday.errorTitle")}
        </h1>
        <p className="text-gray-600 text-center">{error}</p>
      </div>
    );
  }

  // 토큰 데이터가 없으면 로딩
  if (!tokenData) {
    return null;
  }

  return (
    <CountdownCard babyName={tokenData.babyName}>
      {/* 공개 완료 상태 */}
      {pageState === "revealed" && (
        <RevealedRedirect revealToken={revealToken} />
      )}

      {/* D-Day 대기 상태 */}
      {pageState === "waiting" && !isRevealed && (
        <>
          <WaitingForReveal />
          {votes && (
            <VoteGaugeSection prince={votes.prince} princess={votes.princess} />
          )}
          {hasVoted && myVote && (
            <VotedConfirmation selectedVote={myVote} isReturningVoter={true} />
          )}
        </>
      )}

      {/* 카운트다운 상태 */}
      {pageState === "countdown" && (
        <>
          <CountdownTimer
            scheduledAt={tokenData.scheduledAt}
            serverTime={serverTime}
            onExpired={handleExpired}
          />

          {/* 투표 현황 */}
          {votes && (
            <VoteGaugeSection prince={votes.prince} princess={votes.princess} />
          )}

          {/* 투표 영역 */}
          {hasVoted && myVote ? (
            <VotedConfirmation
              selectedVote={myVote}
              isReturningVoter={isReturningVoter}
            />
          ) : (
            <VoteButtons
              onVote={handleVote}
              isVoting={isVoting}
              disabled={!deviceId}
            />
          )}
        </>
      )}
    </CountdownCard>
  );
}

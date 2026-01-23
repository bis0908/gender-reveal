"use client";

/**
 * D-Day 생성 결과 카드 컴포넌트
 * 카운트다운 링크와 공개 링크 두 개를 표시
 */

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  PartyPopper,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface DDayGeneratedLinkCardProps {
  countdownLink: string;
  revealLink: string;
  scheduledAt: string;
}

interface LinkCopyRowProps {
  label: string;
  icon: React.ReactNode;
  link: string;
  description: string;
  color: "blue" | "pink";
}

function LinkCopyRow({
  label,
  icon,
  link,
  description,
  color,
}: LinkCopyRowProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "링크 복사 완료!",
        description: "클립보드에 복사되었습니다.",
        variant: "default",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "복사 실패",
        description: "링크를 수동으로 복사해주세요.",
        variant: "destructive",
      });
    }
  };

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      iconBg: "bg-blue-100",
    },
    pink: {
      bg: "bg-pink-50",
      border: "border-pink-200",
      text: "text-pink-700",
      iconBg: "bg-pink-100",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-full ${colors.iconBg}`}>{icon}</div>
        <span className={`font-semibold ${colors.text}`}>{label}</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="flex gap-2">
        <Input
          value={link}
          readOnly
          className="flex-1 text-sm"
          onClick={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex-shrink-0"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
          <span className="ml-1.5 hidden sm:inline">
            {copied ? "복사됨" : "복사"}
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.open(link, "_blank")}
          className="flex-shrink-0"
        >
          <ExternalLinkIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DDayGeneratedLinkCard({
  countdownLink,
  revealLink,
  scheduledAt,
}: DDayGeneratedLinkCardProps) {
  const scheduledDate = new Date(scheduledAt);
  const formattedDate = format(scheduledDate, "yyyy년 M월 d일 (EEE) HH:mm", {
    locale: ko,
  });

  return (
    <div className="mt-6 space-y-4">
      {/* 헤더 */}
      <div className="text-center p-4 rounded-xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-purple-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CalendarIcon className="h-5 w-5 text-purple-600" />
          <span className="text-lg font-bold text-purple-800">
            D-Day 예약 완료!
          </span>
          <PartyPopper className="h-5 w-5 text-purple-600" />
        </div>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-purple-700">{formattedDate}</span>
          에 성별이 공개됩니다
        </p>
      </div>

      {/* 링크 목록 */}
      <div className="space-y-3">
        <LinkCopyRow
          label="👥 카운트다운 링크"
          icon={<Users className="h-4 w-4 text-blue-600" />}
          link={countdownLink}
          description="친구와 가족에게 공유하세요! 투표하고 함께 기다릴 수 있어요."
          color="blue"
        />

        <LinkCopyRow
          label="🎁 성별 공개 링크"
          icon={<PartyPopper className="h-4 w-4 text-pink-600" />}
          link={revealLink}
          description="D-Day에 이 링크로 성별을 공개하세요! (부모님 전용)"
          color="pink"
        />
      </div>

      {/* 안내 메시지 */}
      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
        <p className="text-sm text-gray-600">
          💡 <span className="font-medium">사용 방법:</span>
        </p>
        <ol className="text-sm text-gray-600 mt-2 space-y-1 ml-4 list-decimal">
          <li>카운트다운 링크를 친구와 가족에게 공유하세요</li>
          <li>D-Day까지 투표를 받으세요</li>
          <li>D-Day가 되면 성별 공개 링크로 접속하여 공개하세요!</li>
        </ol>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeedbackForm } from "./feedback-form";
import { useTranslation } from "@/lib/i18n/context";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoOpenDelay?: number; // 자동 오픈 딜레이 (ms)
}

/**
 * 피드백 수집 모달
 * 링크 생성 완료 후 자동으로 표시됨
 */
export function FeedbackModal({
  open,
  onOpenChange,
  autoOpenDelay = 3000,
}: FeedbackModalProps) {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(false);

  // 성공 시 confetti 애니메이션 표시
  const handleSuccess = () => {
    setShowConfetti(true);

    // 2초 후 confetti 중지 및 모달 닫기
    setTimeout(() => {
      setShowConfetti(false);
      onOpenChange(false);
    }, 2000);
  };

  return (
    <>
      {/* Confetti 애니메이션 */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {t("feedback.modalTitle")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("feedback.modalDescription")}
            </DialogDescription>
          </DialogHeader>

          <FeedbackForm
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

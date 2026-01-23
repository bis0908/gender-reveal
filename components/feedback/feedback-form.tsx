"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  feedbackFormSchema,
  type FeedbackFormData,
} from "@/lib/schemas/feedback-schema";
import { RatingStars } from "./rating-stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/context";

interface FeedbackFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 피드백 제출 폼 컴포넌트
 */
export function FeedbackForm({ onSuccess, onCancel }: FeedbackFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const rating = watch("rating");

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "피드백 제출에 실패했습니다");
      }

      // 성공 토스트
      toast({
        title: t("feedback.successTitle"),
        description: t("feedback.successDescription"),
      });

      // 성공 콜백
      onSuccess?.();
    } catch (error) {
      console.error("피드백 제출 오류:", error);

      toast({
        variant: "destructive",
        title: t("feedback.errorTitle"),
        description:
          error instanceof Error ? error.message : t("feedback.errorDescription"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 별점 선택 */}
      <div className="space-y-2">
        <label className="block text-center text-sm font-medium text-gray-700">
          {t("feedback.ratingLabel")}
        </label>
        <RatingStars
          value={rating}
          onChange={(newRating) => setValue("rating", newRating)}
          disabled={isSubmitting}
        />
        {errors.rating && (
          <p className="text-center text-sm text-red-500">
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* 코멘트 입력 */}
      <div className="space-y-2">
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-gray-700"
        >
          {t("feedback.commentLabel")}
        </label>
        <Textarea
          id="comment"
          placeholder={t("feedback.commentPlaceholder")}
          className="min-h-[100px] resize-none"
          maxLength={200}
          disabled={isSubmitting}
          {...register("comment")}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{errors.comment ? errors.comment.message : ""}</span>
          <span>{watch("comment")?.length || 0}/200</span>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            {t("feedback.laterButton")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("feedback.submitting")}
            </>
          ) : (
            t("feedback.submitButton")
          )}
        </Button>
      </div>
    </form>
  );
}

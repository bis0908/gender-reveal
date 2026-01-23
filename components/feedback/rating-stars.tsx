"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface RatingStarsProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

/**
 * 별점 선택 컴포넌트
 * 1-5점까지 선택 가능하며, 호버 효과 제공
 */
export function RatingStars({ value, onChange, disabled = false }: RatingStarsProps) {
  const { t } = useTranslation();
  const [hoverRating, setHoverRating] = useState<number>(0);

  const displayRating = hoverRating || value;

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            disabled={disabled}
            className={cn(
              "transition-all duration-200",
              "hover:scale-110 active:scale-95",
              disabled && "cursor-not-allowed opacity-50",
            )}
            aria-label={`${rating}${t("feedback.ratingPlaceholder")}`}
          >
            <Star
              className={cn(
                "h-10 w-10 transition-colors duration-200",
                rating <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300",
                !disabled && "cursor-pointer",
              )}
            />
          </button>
        ))}
      </div>

      {/* 별점 설명 텍스트 */}
      <div className="text-center">
        {value > 0 ? (
          <p className="text-sm font-medium text-gray-700">
            {t(`feedback.ratings.${value}`)}
          </p>
        ) : (
          <p className="text-sm text-gray-500">{t("feedback.ratingPlaceholder")}</p>
        )}
      </div>
    </div>
  );
}

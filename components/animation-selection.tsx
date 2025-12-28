"use client";

import { RadioGroup } from "@radix-ui/react-radio-group";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getAnimationOptions } from "@/lib/animations";
import { useTranslation } from "@/lib/i18n/context";
import type { AnimationType } from "@/lib/types";

interface AnimationSelectionProps {
  value: AnimationType;
  onChange: (value: AnimationType) => void;
}

export function AnimationSelection({
  value,
  onChange,
}: AnimationSelectionProps) {
  const { language } = useTranslation();
  const animationOptions = getAnimationOptions(language);

  const handleChange = (newValue: string) => {
    onChange(newValue as AnimationType);
  };

  return (
    <RadioGroup
      value={value}
      onValueChange={handleChange}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
    >
      {animationOptions.map((animation) => (
        <div className="relative" key={animation.id}>
          <Card
            className={`animation-card p-3 cursor-pointer ${value === animation.id ? "selected" : ""}`}
            onClick={() => handleChange(animation.id)}
          >
            <div className="aspect-video relative rounded-md overflow-hidden mb-3">
              <Image
                src={animation.thumbnail}
                alt={animation.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-medium text-base">{animation.name}</Label>
              <p className="text-sm text-gray-500">{animation.description}</p>
            </div>
          </Card>
        </div>
      ))}
    </RadioGroup>
  );
}

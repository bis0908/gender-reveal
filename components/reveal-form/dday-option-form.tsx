"use client";

/**
 * D-Day 예약 옵션 컴포넌트
 * 폼에서 D-Day 예약 여부와 날짜/시간을 선택
 */

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { FormValues } from "@/lib/schemas/reveal-form-schema";

interface DDayOptionFormProps {
  form: UseFormReturn<FormValues>;
}

// 시간 옵션 생성 (00:00 ~ 23:00)
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, "0"),
  label: `${String(i).padStart(2, "0")}:00`,
}));

export function DDayOptionForm({ form }: DDayOptionFormProps) {
  // 폼 상태에서 scheduledAt 값을 감시
  const scheduledAtValue = form.watch("scheduledAt");

  // 로컬 UI 상태 (폼 값에서 파싱하여 초기화)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<string>("12");

  // D-Day 활성화 상태는 scheduledAt 값 존재 여부로 결정 (derived state)
  const isDDayEnabled = !!scheduledAtValue;

  // 컴포넌트 마운트 및 scheduledAt 값 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (scheduledAtValue) {
      try {
        const date = new Date(scheduledAtValue);
        setSelectedDate(date);
        setSelectedHour(String(date.getHours()).padStart(2, "0"));
      } catch (error) {
        console.error("Invalid scheduledAt value:", error);
      }
    } else {
      // scheduledAt이 없으면 기본값으로 초기화
      setSelectedDate(undefined);
      setSelectedHour("12");
    }
  }, [scheduledAtValue]);

  // D-Day 토글 핸들러
  const handleDDayToggle = (enabled: boolean) => {
    if (!enabled) {
      // D-Day 비활성화 시 scheduledAt 삭제
      form.setValue("scheduledAt", undefined);
      setSelectedDate(undefined);
      setSelectedHour("12");
    } else if (!scheduledAtValue) {
      // D-Day 활성화 시 기본값 설정 (내일 12:00)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);

      form.setValue("scheduledAt", tomorrow.toISOString());
      setSelectedDate(tomorrow);
      setSelectedHour("12");
    }
  };

  // 날짜/시간 변경 시 scheduledAt 업데이트
  const updateScheduledAt = (date?: Date, hour?: string) => {
    if (!date) {
      form.setValue("scheduledAt", undefined);
      return;
    }

    const scheduledDate = new Date(date);
    scheduledDate.setHours(parseInt(hour || selectedHour, 10), 0, 0, 0);
    form.setValue("scheduledAt", scheduledDate.toISOString());
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    updateScheduledAt(date, selectedHour);
  };

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour);
    updateScheduledAt(selectedDate, hour);
  };

  // 최소 날짜: 내일
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4 p-4 rounded-xl border border-purple-200 bg-purple-50/50">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <FormLabel className="text-base font-semibold text-purple-800">
            📅 D-Day 예약
          </FormLabel>
          <p className="text-sm text-purple-600">
            특정 날짜에 성별을 공개하고 싶으신가요?
          </p>
        </div>
        <Switch
          checked={isDDayEnabled}
          onCheckedChange={handleDDayToggle}
          className="data-[state=checked]:bg-purple-500"
        />
      </div>

      {isDDayEnabled && (
        <div className="space-y-4 pt-4 border-t border-purple-200">
          <p className="text-sm text-gray-600">
            친구와 가족에게 카운트다운 링크를 공유하세요!
            <br />
            D-Day가 되면 모두 함께 성별을 확인할 수 있어요 🎉
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 날짜 선택 */}
            <FormField
              control={form.control}
              name="scheduledAt"
              render={() => (
                <FormItem className="flex flex-col">
                  <FormLabel>공개 날짜</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !selectedDate && "text-muted-foreground",
                          )}
                        >
                          {selectedDate ? (
                            format(selectedDate, "PPP", { locale: ko })
                          ) : (
                            <span>날짜 선택</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateChange}
                        disabled={(date) => date < tomorrow}
                        initialFocus
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 시간 선택 */}
            <FormItem className="flex flex-col">
              <FormLabel>공개 시간</FormLabel>
              <Select value={selectedHour} onValueChange={handleHourChange}>
                <FormControl>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <SelectValue placeholder="시간 선택" />
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {HOUR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          </div>

          {selectedDate && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-pink-50 border border-purple-100">
              <p className="text-sm text-center">
                <span className="font-semibold text-purple-700">
                  {format(selectedDate, "yyyy년 M월 d일", { locale: ko })}{" "}
                  {selectedHour}:00
                </span>
                <span className="text-gray-600">에 성별이 공개됩니다!</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

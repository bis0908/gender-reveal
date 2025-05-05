"use client";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, ArrowRightIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BabyInfoForm } from '@/components/reveal-form/baby-info-form';
import { MultipleBabiesForm } from '@/components/reveal-form/multiple-babies-form';
import type { UseFormReturn } from 'react-hook-form';
import type { FormValues } from '@/lib/schemas/reveal-form-schema';

interface FamilyDetailsFormProps {
  form: UseFormReturn<FormValues>;
  onNextStep: () => void;
}

export function FamilyDetailsForm({ form, onNextStep }: FamilyDetailsFormProps) {
  const isMultiple = form.watch("isMultiple");

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">1단계: 가족 정보 입력</h3>
        <p className="text-sm text-gray-500">아래 정보를 모두 입력해주세요</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="motherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>엄마 이름</FormLabel>
              <FormControl>
                <Input placeholder="엄마 이름 입력" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="fatherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>아빠 이름</FormLabel>
              <FormControl>
                <Input placeholder="아빠 이름 입력" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="isMultiple"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>다태아 여부</FormLabel>
              <FormDescription>
                쌍둥이, 세쌍둥이 등 다태아인 경우 선택하세요
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {!isMultiple ? (
        <BabyInfoForm form={form} />
      ) : (
        <MultipleBabiesForm form={form} />
      )}
      
      <FormField
        control={form.control}
        name="dueDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>출산 예정일 (선택사항)</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "yyyy년 MM월 dd일", { locale: ko })
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
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>메시지 (선택사항)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="초대 메시지를 입력하세요"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="flex justify-end pt-6">
        <Button 
          type="button" 
          onClick={onNextStep}
          className="flex items-center gap-2 bg-baby-blue-dark text-white"
        >
          다음
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 
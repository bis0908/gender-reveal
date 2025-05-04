"use client";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { UseFormReturn } from 'react-hook-form';
import type { FormValues } from '@/lib/schemas/reveal-form-schema';

interface BabyInfoFormProps {
  form: UseFormReturn<FormValues>;
}

export function BabyInfoForm({ form }: BabyInfoFormProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="babyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>태명</FormLabel>
            <FormDescription className="text-xs mt-0 mb-2">
              아기의 태명이나 별명을 입력해주세요
            </FormDescription>
            <FormControl>
              <Input placeholder="예: 콩이, 팥이, 새콩이" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="gender"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>성별</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="boy" id="boy" />
                  <Label htmlFor="boy" className="text-baby-blue-dark font-medium">남자아이</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="girl" id="girl" />
                  <Label htmlFor="girl" className="text-baby-pink-dark font-medium">여자아이</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
} 
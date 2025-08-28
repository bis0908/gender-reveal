"use client";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, ArrowRightIcon } from 'lucide-react';
import { formatDateWithLocale, getDateLocale } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { BabyInfoForm } from '@/components/reveal-form/baby-info-form';
import { MultipleBabiesForm } from '@/components/reveal-form/multiple-babies-form';
import type { UseFormReturn } from 'react-hook-form';
import type { FormValues } from '@/lib/schemas/reveal-form-schema';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

interface FamilyDetailsFormProps {
  form: UseFormReturn<FormValues>;
  onNextStep: () => void;
}

export function FamilyDetailsForm({ form, onNextStep }: FamilyDetailsFormProps) {
  const isMultiple = form.watch("isMultiple");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{t('form.step1Title')}</h3>
        <p className="text-sm text-gray-500">{t('form.step1Description')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="motherName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.motherName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.motherNamePlaceholder')} {...field} />
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
              <FormLabel>{t('form.fatherName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.fatherNamePlaceholder')} {...field} />
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
              <FormLabel>{t('form.isMultipleLabel')}</FormLabel>
              <FormDescription>
                {t('form.isMultipleDescription')}
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
            <FormLabel>{t('form.dueDateLabel')}</FormLabel>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                      formatDateWithLocale(field.value, language)
                    ) : (
                      <span>{t('form.dueDatePlaceholder')}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                  locale={getDateLocale(language)}
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
            <FormLabel>{t('form.messageLabel')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('form.messagePlaceholder')}
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
          {t('common.next')}
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 
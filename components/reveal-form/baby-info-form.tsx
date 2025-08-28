"use client";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { UseFormReturn } from 'react-hook-form';
import type { FormValues } from '@/lib/schemas/reveal-form-schema';
import { useTranslation } from '@/lib/i18n/context';

interface BabyInfoFormProps {
  form: UseFormReturn<FormValues>;
}

export function BabyInfoForm({ form }: BabyInfoFormProps) {
  const { t } = useTranslation();
  
  return (
    <>
      <FormField
        control={form.control}
        name="babyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.babyName')}</FormLabel>
            <FormDescription className="text-xs mt-0 mb-2">
              {t('form.babyNameDescription')}
            </FormDescription>
            <FormControl>
              <Input placeholder={t('form.babyNamePlaceholderExample')} {...field} />
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
            <FormLabel>{t('form.genderLabel')}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="boy" id="boy" />
                  <Label htmlFor="boy" className="text-baby-blue-dark font-medium">{t('gender.boy')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="girl" id="girl" />
                  <Label htmlFor="girl" className="text-baby-pink-dark font-medium">{t('gender.girl')}</Label>
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
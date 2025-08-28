"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircleIcon, TrashIcon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormValues } from '@/lib/schemas/reveal-form-schema';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from '@/lib/i18n/context';

interface MultipleBabiesFormProps {
  form: UseFormReturn<FormValues>;
}

export function MultipleBabiesForm({ form }: MultipleBabiesFormProps) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "babiesInfo"
  });

  // 아기 추가 핸들러
  const handleAddBaby = () => {
    append({ name: "", gender: "boy" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <FormLabel className="text-base">{t('form.babyInfo')}</FormLabel>
          <FormDescription className="mt-1">
            {t('form.babyInfoDescription')}
          </FormDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddBaby}
          className="flex items-center gap-1"
        >
          <PlusCircleIcon className="h-4 w-4" />
          {t('form.addBaby')}
        </Button>
      </div>
      
      {fields.map((field, index) => (
        <Card key={field.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{t('form.babyNumber', { number: (index + 1).toString() })}</h4>
              {index > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="h-8 w-8 p-0"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span className="sr-only">{t('form.removeBaby')}</span>
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`babiesInfo.${index}.name`}
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
                name={`babiesInfo.${index}.gender`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.genderLabel')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="boy" id={`boy-${index}`} />
                          <Label htmlFor={`boy-${index}`} className="text-baby-blue-dark font-medium">{t('gender.boy')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="girl" id={`girl-${index}`} />
                          <Label htmlFor={`girl-${index}`} className="text-baby-pink-dark font-medium">{t('gender.girl')}</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      
      {form.formState.errors.babiesInfo && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.babiesInfo.message}
        </p>
      )}
    </div>
  );
} 
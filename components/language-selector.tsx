"use client";

import { useTranslation } from '@/lib/i18n/context';
import { Language, SUPPORTED_LANGUAGES } from '@/lib/i18n/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

export function LanguageSelector() {
  const { language: currentLanguage, changeLanguage, isLoading } = useTranslation();

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage !== currentLanguage && !isLoading) {
      await changeLanguage(newLanguage);
    }
  };

  // 현재 언어의 정보 찾기
  const currentLanguageInfo = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === currentLanguage
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 h-8 px-2"
          disabled={isLoading}
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">
            {currentLanguageInfo?.nativeName || 'Language'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{lang.nativeName}</span>
            {currentLanguage === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
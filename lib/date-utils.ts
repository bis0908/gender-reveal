import { format as formatDate, Locale } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { enUS } from 'date-fns/locale/en-US';
import { Language } from './i18n/types';

// 언어별 date-fns 로케일 매핑
const DATE_LOCALES: Record<Language, Locale> = {
  ko: ko,
  en: enUS,
};

// 언어별 날짜 형식 매핑
const DATE_FORMATS: Record<Language, string> = {
  ko: "yyyy년 MM월 dd일 EEEE",
  en: "EEEE, MMMM dd, yyyy",
};

/**
 * 현재 언어에 맞는 date-fns 로케일을 반환합니다.
 * @param language 현재 언어 코드
 * @returns date-fns Locale 객체
 */
export const getDateLocale = (language: Language): Locale => {
  return DATE_LOCALES[language] || DATE_LOCALES.ko;
};

/**
 * 현재 언어에 맞는 날짜 형식을 반환합니다.
 * @param language 현재 언어 코드
 * @returns 날짜 형식 문자열
 */
export const getDateFormat = (language: Language): string => {
  return DATE_FORMATS[language] || DATE_FORMATS.ko;
};

/**
 * 현재 언어에 맞게 날짜를 형식화합니다.
 * @param date 형식화할 날짜
 * @param language 현재 언어 코드
 * @param customFormat 사용자 정의 형식 (옵션)
 * @returns 형식화된 날짜 문자열
 */
export const formatDateWithLocale = (
  date: Date, 
  language: Language, 
  customFormat?: string
): string => {
  const locale = getDateLocale(language);
  const format = customFormat || getDateFormat(language);
  
  return formatDate(date, format, { locale });
};

/**
 * 간단한 날짜 형식 (년월일만)
 */
export const formatSimpleDateWithLocale = (
  date: Date, 
  language: Language
): string => {
  const locale = getDateLocale(language);
  const format = language === 'ko' ? 'yyyy년 MM월 dd일' : 'MMM dd, yyyy';
  
  return formatDate(date, format, { locale });
};
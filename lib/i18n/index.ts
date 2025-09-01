import { Language, DEFAULT_LANGUAGE, Translations } from './types';

// 브라우저에서 localStorage 키
const LANGUAGE_STORAGE_KEY = 'gender-reveal-language';

// 번역 파일 로더
const loadTranslations = async (language: Language): Promise<Translations> => {
  try {
    const translations = await import(`./locales/${language}.json`);
    return translations.default;
  } catch (error) {
    console.error(`번역 파일을 불러올 수 없습니다: ${language}`, error);
    // 기본 언어로 폴백
    if (language !== DEFAULT_LANGUAGE) {
      return loadTranslations(DEFAULT_LANGUAGE);
    }
    throw new Error(`기본 번역 파일(${DEFAULT_LANGUAGE})을 불러올 수 없습니다`);
  }
};

// 저장된 언어 설정 불러오기 (브라우저 전용)
export const getSavedLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }
  
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (saved && ['ko', 'en', 'jp'].includes(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn('localStorage에서 언어 설정을 읽을 수 없습니다:', error);
  }
  
  return DEFAULT_LANGUAGE;
};

// 언어 설정 저장 (브라우저 전용)
export const saveLanguage = (language: Language): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('localStorage에 언어 설정을 저장할 수 없습니다:', error);
  }
};

// 번역 키를 사용하여 중첩된 객체에서 값 추출
export const getNestedTranslation = (
  translations: Translations,
  key: string
): string => {
  const keys = key.split('.');
  let current: any = translations;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      console.warn(`번역 키를 찾을 수 없습니다: ${key}`);
      return key; // 키 자체를 반환하여 디버깅에 도움
    }
  }
  
  return typeof current === 'string' ? current : key;
};

export { loadTranslations };
"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSavedLanguage, loadTranslations, saveLanguage } from "./index";
import { DEFAULT_LANGUAGE, type Language, type Translations } from "./types";

// Context 타입 정의
interface I18nContextType {
  language: Language;
  translations: Translations | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  changeLanguage: (newLanguage: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

// Context 생성
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider 컴포넌트 Props
interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

// Provider 컴포넌트
export function LanguageProvider({
  children,
  initialLanguage,
}: LanguageProviderProps) {
  // 서버/클라이언트 일관성을 위해 초기 언어를 안정적으로 설정
  const [language, setLanguage] = useState<Language>(
    () => initialLanguage || DEFAULT_LANGUAGE,
  );
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 번역 로드 함수
  const loadLanguageTranslations = async (lang: Language) => {
    try {
      setIsLoading(true);
      setError(null);
      const newTranslations = await loadTranslations(lang);
      setTranslations(newTranslations);
      setLanguage(lang);
      saveLanguage(lang);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다";
      setError(errorMessage);
      console.error("번역 로드 중 오류:", err);
      // 에러 발생 시에도 초기화 완료로 처리하여 UI 블록 방지
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 언어 변경 함수
  const changeLanguage = async (newLanguage: Language) => {
    if (newLanguage !== language) {
      await loadLanguageTranslations(newLanguage);
    }
  };

  // 번역 함수
  const t = (key: string, params?: Record<string, string>): string => {
    if (!translations || !key || typeof key !== "string") {
      // 번역이 로드되지 않았을 때 의미있는 기본값 반환
      if (!isInitialized) {
        return ""; // 로딩 중에는 빈 문자열 반환
      }
      return key || "";
    }

    // 중첩 키 처리
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`번역 키를 찾을 수 없습니다: ${key}`);
        // 초기화되지 않은 상태에서는 빈 문자열, 그 외에는 키 반환
        return isInitialized ? key : "";
      }
    }

    if (typeof value !== "string") {
      console.warn(`번역 값이 문자열이 아닙니다: ${key}`);
      return isInitialized ? key : "";
    }

    // 매개변수 치환
    if (params) {
      return Object.entries(params).reduce(
        (text, [param, paramValue]) =>
          text.replace(new RegExp(`{{${param}}}`, "g"), paramValue),
        value,
      );
    }

    return value;
  };

  // 클라이언트 마운트 감지
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 초기 번역 로딩 (즉시 실행)
  useEffect(() => {
    const initializeTranslations = async () => {
      if (!isClient) {
        // 서버에서는 기본 언어로 즉시 번역 로드
        await loadLanguageTranslations(initialLanguage || DEFAULT_LANGUAGE);
        return;
      }

      // 클라이언트에서는 저장된 언어 우선 사용
      const savedLanguage = getSavedLanguage();
      await loadLanguageTranslations(savedLanguage);
    };

    initializeTranslations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, initialLanguage]);

  const contextValue: I18nContextType = {
    language,
    translations,
    isLoading,
    isInitialized,
    error,
    changeLanguage,
    t,
  };

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}

// 커스텀 훅
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n은 LanguageProvider 내부에서 사용되어야 합니다");
  }
  return context;
}

// 단축 번역 훅 (자주 사용하는 t 함수만)
export function useTranslation() {
  const { t, language, changeLanguage, isLoading, isInitialized } = useI18n();
  return { t, language, changeLanguage, isLoading, isInitialized };
}

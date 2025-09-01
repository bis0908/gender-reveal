import type { RevealData } from '@/lib/types';
import type { Language } from '@/lib/i18n/types';
import { getExamplesByLanguage } from '@/lib/examples-data';

// 언어별 메시지 템플릿
const messageTemplates = {
  ko: {
    example1: "우리 {{babyName}}가 드디어 성별을 알려드립니다! 함께 축하해주세요!",
    example2: "우리 {{babyName}}의 성별을 알려드려요. 많이 축하해주세요!",
    example3: "드디어 우리 {{babyName}}의 성별을 알려드립니다!",
    example4: "우리 {{babyName}}의 성별이 궁금하셨죠? 지금 확인하세요!"
  },
  en: {
    example1: "Our little {{babyName}} is finally ready to reveal the gender! Please celebrate with us!",
    example2: "We're excited to share {{babyName}}'s gender with you. Congratulations to us!",
    example3: "Finally, our {{babyName}} is revealing the gender!",
    example4: "Were you curious about {{babyName}}'s gender? Find out now!"
  },
  jp: {
    example1: "{{babyName}}がついに性別を発表します！一緒にお祝いしてください！",
    example2: "{{babyName}}の性別をお知らせいたします。お祝いをよろしくお願いします！",
    example3: "ついに{{babyName}}の性別を発表いたします！",
    example4: "{{babyName}}の性別が気になっていましたか？今すぐ確認してください！"
  }
};

/**
 * 언어에 맞는 데모 예시 데이터를 반환합니다.
 * /examples 페이지와 동일한 데이터를 사용합니다.
 * @param language 현재 언어 코드
 * @returns 해당 언어의 데모 예시 데이터
 */
export const getDemoExamples = (language: Language): Record<string, RevealData> => {
  const examples = getExamplesByLanguage(language);
  const templates = messageTemplates[language as keyof typeof messageTemplates];
  
  const demoData: Record<string, RevealData> = {};
  
  examples.forEach((example) => {
    const messageKey = example.id as keyof typeof templates;
    const message = templates?.[messageKey]?.replace('{{babyName}}', example.babyName) || '';
    
    demoData[example.id] = {
      motherName: example.motherName,
      fatherName: example.fatherName,
      babyName: example.babyName,
      gender: example.gender,
      dueDate: getDueDateForExample(example.id),
      message: message,
      animationType: example.animationType,
      countdownTime: 5
    };
  });
  
  return demoData;
};

// 예시별 출산 예정일 (고정값)
const getDueDateForExample = (exampleId: string): string => {
  const dueDates: Record<string, string> = {
    example1: "2023-12-25",
    example2: "2023-11-15", 
    example3: "2023-10-10",
    example4: "2024-01-20"
  };
  return dueDates[exampleId] || "2024-01-01";
};

// 하위 호환성을 위한 기본 데모 예시 (한국어)
export const demoExamples: Record<string, RevealData> = getDemoExamples('ko'); 
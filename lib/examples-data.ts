import { Language } from './i18n/types';

export interface ExampleData {
  id: string;
  motherName: string;
  fatherName: string;
  babyName: string;
  gender: 'boy' | 'girl';
  image: string;
  animationType: 'confetti' | 'balloons' | 'fireworks' | 'falling';
  description: string;
}

// 한국어 예시 데이터
const koreanExamples: ExampleData[] = [
  {
    id: "example1",
    motherName: "지현",
    fatherName: "민준",
    babyName: "콩이",
    gender: "boy",
    image: "/images/example1.jpg",
    animationType: "confetti",
    description: "파란색 색종이가 폭발하는 효과와 함께 귀여운 남자아이 Gender reveal",
  },
  {
    id: "example2",
    motherName: "소연",
    fatherName: "준서",
    babyName: "콩콩이",
    gender: "girl",
    image: "/images/example2.jpg",
    animationType: "balloons",
    description: "분홍색 풍선이 하늘로 날아오르는 효과와 함께하는 여자아이 Gender reveal",
  },
  {
    id: "example3",
    motherName: "지은",
    fatherName: "도현",
    babyName: "꼬맹이",
    gender: "boy",
    image: "/images/example3.jpg",
    animationType: "fireworks",
    description: "화려한 파란색 불꽃놀이가 터지는 멋진 남자아이 Gender reveal",
  },
  {
    id: "example4",
    motherName: "서연",
    fatherName: "재원",
    babyName: "애기",
    gender: "girl",
    image: "/images/example4.jpg",
    animationType: "falling",
    description: "분홍색 작은 아기 용품들이 내려오는 사랑스러운 여자아이 Gender reveal",
  },
];

// 영어 예시 데이터 (미국식 이름)
const englishExamples: ExampleData[] = [
  {
    id: "example1",
    motherName: "Sarah",
    fatherName: "Michael",
    babyName: "Peanut",
    gender: "boy",
    image: "/images/example1.jpg",
    animationType: "confetti",
    description: "Adorable boy gender reveal with exploding blue confetti effects",
  },
  {
    id: "example2",
    motherName: "Emily",
    fatherName: "David",
    babyName: "Little Bean",
    gender: "girl",
    image: "/images/example2.jpg",
    animationType: "balloons",
    description: "Sweet girl gender reveal with pink balloons floating up to the sky",
  },
  {
    id: "example3",
    motherName: "Jessica",
    fatherName: "Christopher",
    babyName: "Sweetpea",
    gender: "boy",
    image: "/images/example3.jpg",
    animationType: "fireworks",
    description: "Spectacular boy gender reveal with gorgeous blue fireworks display",
  },
  {
    id: "example4",
    motherName: "Ashley",
    fatherName: "Matthew",
    babyName: "Nugget",
    gender: "girl",
    image: "/images/example4.jpg",
    animationType: "falling",
    description: "Lovely girl gender reveal with pink baby items falling down",
  },
];

// 일본어 예시 데이터 (일본식 이름)
const japaneseExamples: ExampleData[] = [
  {
    id: "example1",
    motherName: "あさみ",
    fatherName: "ゆうき",
    babyName: "こんちゃん",
    gender: "boy",
    image: "/images/example1.jpg",
    animationType: "confetti",
    description: "爆発するブルーの紙吹雪エフェクトと一緒の可愛い男の子のジェンダーリビール",
  },
  {
    id: "example2",
    motherName: "みさき",
    fatherName: "だいすけ",
    babyName: "あずきちゃん",
    gender: "girl",
    image: "/images/example2.jpg",
    animationType: "balloons",
    description: "空に舞い上がるピンクの風船と一緒の女の子のジェンダーリビール",
  },
  {
    id: "example3",
    motherName: "なつみ",
    fatherName: "りょうた",
    babyName: "まめちゃん",
    gender: "boy",
    image: "/images/example3.jpg",
    animationType: "fireworks",
    description: "華やかなブルーの花火が爆発する素敵な男の子のジェンダーリビール",
  },
  {
    id: "example4",
    motherName: "ゆりか",
    fatherName: "たかし",
    babyName: "ひなちゃん",
    gender: "girl",
    image: "/images/example4.jpg",
    animationType: "falling",
    description: "ピンクの小さなベビー用品が降ってくる愛らしい女の子のジェンダーリビール",
  },
];

/**
 * 현재 언어에 맞는 예시 데이터를 반환합니다.
 * @param language 현재 언어 코드
 * @returns 해당 언어의 예시 데이터 배열
 */
export const getExamplesByLanguage = (language: Language): ExampleData[] => {
  switch (language) {
    case 'ko':
      return koreanExamples;
    case 'jp':
      return japaneseExamples;
    case 'en':
    default:
      return englishExamples;
  }
};

/**
 * 애니메이션 타입의 다국어 이름을 반환합니다.
 * @param animationType 애니메이션 타입
 * @param language 현재 언어 코드
 * @returns 해당 언어의 애니메이션 타입명
 */
export const getAnimationTypeName = (
  animationType: ExampleData['animationType'], 
  language: Language
): string => {
  const typeNames = {
    ko: {
      confetti: '색종이',
      balloons: '풍선',
      fireworks: '불꽃놀이',
      falling: '떨어지는 아이템',
    },
    en: {
      confetti: 'Confetti',
      balloons: 'Balloons', 
      fireworks: 'Fireworks',
      falling: 'Falling Items',
    },
    jp: {
      confetti: '紙吹雪',
      balloons: '風船',
      fireworks: '花火',
      falling: '降下アイテム',
    },
  };
  
  return typeNames[language]?.[animationType] || typeNames['en'][animationType];
};
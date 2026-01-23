// 지원하는 언어 타입
export type Language = "ko" | "en" | "jp";

// 번역 객체의 타입 정의
export interface Translations {
  // 공통 UI 텍스트
  common: {
    home: string;
    create: string;
    examples: string;
    genderReveal: string;
    loading: string;
    error: string;
    success: string;
    next: string;
    previous: string;
    submit: string;
    cancel: string;
    copy: string;
    share: string;
  };

  // 네비게이션
  nav: {
    home: string;
    createGenderReveal: string;
    examples: string;
    about: string;
    menu: string;
  };

  // 메인 페이지
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroDescription: string;
    createButton: string;
    examplesButton: string;
    howToUseTitle: string;
    featureCreateTitle: string;
    featureCreateDescription: string;
    featureAnimationTitle: string;
    featureAnimationDescription: string;
    featureShareTitle: string;
    featureShareDescription: string;
    ctaTitle: string;
    ctaDescription: string;
  };

  // 생성 페이지
  create: {
    title: string;
    subtitle: string;
    cardTitle: string;
    cardDescription: string;
    privacyNotice: string;
  };

  // 폼 관련
  form: {
    // 가족 정보
    step1Title: string;
    step1Description: string;
    motherName: string;
    fatherName: string;
    babyName: string;
    isMultipleLabel: string;
    isMultipleDescription: string;
    dueDateLabel: string;
    dueDatePlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;

    // 애니메이션 설정
    step2Title: string;
    animationType: string;
    countdownTime: string;

    // 플레이스홀더
    motherNamePlaceholder: string;
    fatherNamePlaceholder: string;
    babyNamePlaceholder: string;

    // 다태아 폼
    addBaby: string;
    removeBaby: string;
    babyNumber: string;
  };

  // 에러 메시지
  errors: {
    required: string;
    motherNameRequired: string;
    fatherNameRequired: string;
    babyNameRequired: string;
    allBabyNamesRequired: string;
    tokenGenerationFailed: string;
    serverError: string;
    emptyResponse: string;
    parsingError: string;
    invalidToken: string;
    validationError: string;
  };

  // 성공 메시지
  success: {
    linkGenerated: string;
    linkGeneratedDescription: string;
    linkCopied: string;
  };

  // 애니메이션 관련
  animations: {
    confetti: string;
    balloons: string;
    fireworks: string;
    falling: string;
    reveal: string;
  };

  // 성별
  gender: {
    boy: string;
    girl: string;
    boys: string;
    girls: string;
  };

  // 푸터
  footer: {
    description: string;
    madeWithLove: string;
    quickLinks: string;
    contact: string;
    copyright: string;
  };

  // 카운트다운
  countdown: {
    seconds: string;
    ready: string;
  };

  // D-Day 카운트다운 페이지
  dday: {
    // 카드 헤더
    cardTitle: string;
    cardSubtitle: string;

    // 로딩/에러 상태
    loading: string;
    errorTitle: string;
    noToken: string;
    tokenVerifyFailed: string;
    unknownError: string;

    // 타이머
    daysLabel: string;
    hoursLabel: string;
    ddayReached: string;
    genderRevealSoon: string;

    // 투표 버튼
    votePrince: string;
    votePrincess: string;

    // 투표 게이지
    teamBlue: string;
    teamPink: string;
    totalVotes: string;

    // 투표 확인
    votedFor: string;
    thanksForVoting: string;
    alreadyVoted: string;
    voteFailed: string;

    // 대기 상태
    waitingTitle: string;
    waitingMessage: string;
    autoUpdate: string;

    // 공개 완료
    revealedTitle: string;
    goToCelebrate: string;
  };
}

// 언어 정보
export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
}

// 지원 언어 목록
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "jp", name: "Japanese", nativeName: "日本語" },
];

// 기본 언어
export const DEFAULT_LANGUAGE: Language = "ko";

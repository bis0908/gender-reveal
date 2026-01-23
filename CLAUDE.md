# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Gender Reveal 이벤트를 위한 Next.js 15+ 웹 애플리케이션입니다. 사용자가 아기 정보를 입력하고 JWT 토큰을 통해 보안된 Gender Reveal 링크를 생성하여 공유할 수 있습니다.

## 공통 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint

# 테스트 실행
npm test

# 테스트 (watch 모드)
npm run test:watch

# JWT 비밀키 생성
npm run generate-secret
```

## 핵심 아키텍처

### App Router 구조

- **Next.js 15 App Router** 사용
- **app/** 디렉토리 기반 라우팅
- **Server Components 우선** (필요시에만 'use client')

### 주요 라우트

- `/` - 메인 페이지 (홍보 및 시작점)
- `/create` - Gender Reveal 링크 생성 폼
- `/reveal` - 생성된 토큰으로 Gender Reveal 표시
- `/examples` - 예시 페이지

### API 엔드포인트

- `/api/generate-token` - JWT 토큰 생성 (POST)
- `/api/verify-token` - JWT 토큰 검증 (POST)

### 상태 관리

- **Zustand** 사용 (`lib/store.ts`)
- 폼 데이터 전역 상태 관리
- `useRevealStore`로 접근

### 데이터 검증

- **Zod 스키마** (`lib/schemas/reveal-form-schema.ts`)
- 단일/다태아 구분하는 discriminated union
- React Hook Form과 통합

## 기술 스택 상세

### 핵심 프레임워크

- **Next.js 15+** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

### UI 컴포넌트

- **shadcn/ui** (`components/ui/`)
- **Radix UI** 기반 컴포넌트
- **Framer Motion** 애니메이션

### 인증 및 보안

- **jose** 라이브러리 (JWT 토큰 관리)
- 환경 변수 기반 비밀키 관리 (`lib/env.ts`)
- 보안 강화 계획서: `SECURITY-IMPLEMENTATION-PLAN.md`

### 개발 도구

- **Jest** + **Testing Library** (테스트)
- **ESLint** (린팅)
- **TypeScript** (타입 검사)

## 파일 구조 패턴

### 컴포넌트 구조

```dir
components/
├── ui/                    # shadcn/ui 컴포넌트
├── animations/            # 애니메이션 컴포넌트들
├── reveal-form/           # 폼 관련 하위 컴포넌트들
└── [기타 공통 컴포넌트]
```

### 라이브러리 구조

```dir
lib/
├── schemas/              # Zod 검증 스키마
├── types.ts              # TypeScript 타입 정의
├── store.ts              # Zustand 스토어
├── utils.ts              # 유틸리티 함수들
├── env.ts                # 환경 변수 처리
└── animations.ts         # 애니메이션 설정
```

## 중요한 개발 규칙

### 언어 및 주석

- **모든 주석과 문서는 한국어로 작성**
- 변수명과 함수명은 영어 사용 (camelCase)

### 테스트 패턴

- **Given-When-Then 패턴** 사용
- 테스트 파일: `tests/` 디렉토리
- Jest + Testing Library 조합

### 보안 고려사항

- JWT 토큰은 7-30일 만료 설정
- 환경 변수로 비밀키 관리
- `SECURITY-IMPLEMENTATION-PLAN.md` 참조

### 코드 스타일 (Cursor Rules)

- **함수형 및 선언적 프로그래밍** 패턴
- **Early return** 사용으로 가독성 향상
- **TypeScript** 엄격 사용 (interfaces 선호)
- **DRY 원칙** 준수

### 컴포넌트 패턴

- **Server Components 우선** 사용
- 상태 필요시에만 'use client' 지시어
- 명명된 export 사용
- 이벤트 핸들러는 "handle" 접두사

## 환경 설정

- 이 프로젝트는 다국어 지원을 하고 있습니다. 컴포넌트/레이아웃/api 작성시 유의하세요.
- 다국어 지원 경로 `@lib\i18n`

### 필수 환경 변수

```bash
# .env.local
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRATION=7d
```

### 비밀키 생성

```bash
node scripts/generate-secret.js
```

### 개발 환경 설정 세부사항

`ENV-SETUP.md` 파일 참조

## 테스트 전략

### 테스트 실행

```bash
# 전체 테스트
npm test

# Watch 모드
npm run test:watch

# 특정 파일
npm test -- jwt.test.ts
```

### 커버리지

- Jest 커버리지 리포트 생성
- `coverage/` 디렉토리 확인

## 주의사항

### 절대 하지 말 것

- JWT 비밀키를 코드에 하드코딩
- 프로덕션에서 민감한 정보 로깅

### 권장사항

- 새로운 컴포넌트 추가 시 기존 패턴 따라하기
- 타입 안전성을 위해 Zod 스키마 먼저 정의
- 보안 관련 변경은 `SECURITY-IMPLEMENTATION-PLAN.md` 검토

## 배포

### Vercel 배포

- 자동 배포 설정됨
- 환경 변수를 Vercel 대시보드에서 설정 필요
- `vercel.json` 설정 파일 사용

### Google Analytics

- Google AdSense 통합됨 (`ca-pub-9465556807993641`)
- Vercel Analytics & Speed Insights 활성화

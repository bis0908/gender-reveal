# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Gender Reveal 이벤트를 위한 Next.js 15+ 웹 애플리케이션입니다. 사용자가 아기 정보를 입력하고 JWT 토큰을 통해 보안된 Gender Reveal 링크를 생성하여 공유할 수 있습니다.

## 공통 개발 명령어

```bash
# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 린트 검사 (권위: Biome — biome.json)
pnpm exec biome check

# 테스트 실행
pnpm test

# 테스트 (watch 모드)
pnpm test:watch

# JWT 비밀키 생성
pnpm generate-secret
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
- **React 18.2**
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
pnpm test

# Watch 모드
pnpm test:watch

# 특정 파일
pnpm test -- jwt.test.ts
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

## 하네스: gender-reveal 플랫폼

**목표:** claude-harness 골격(검증·학습·추적·조율 에이전트 팀 + orchestrate)을 도입해, platform-restructure 마이그레이션과 멀티 캠페인 확장을 마일스톤 단위로 안전하게 진행한다. 배경·도입 결정은 [ADR-01](docs/harness/decisions/ADR-01-harness-adoption.md).

**트리거:** 마일스톤/기능 구현·재실행·보완·리팩토링·버그 증상·정합성 검증·재개 프롬프트·compound 정리 요청 시 `orchestrate` 스킬을 사용한다. 단순 질문은 직접 응답 가능.

**역할 → 실제 에이전트 바인딩 (orchestrate 필수):**

| 역할 | 실제 에이전트 | 비고 |
|------|--------------|------|
| 프론트 구현 에이전트 | `gender-reveal-front` | Next.js App Router·TSX·i18n·shadcn/Framer |
| 백엔드 구현 에이전트 | `gender-reveal-server` | API·jose JWT·Redis·Zod·연동 |
| 레거시 분석 에이전트 | (해당 없음) | greenfield — Phase 2 레거시 분석 건너뜀 |

**프로젝트 컨벤션 (qa-guard 검증 기준):**

- 패키지 매니저: **pnpm** (`pnpm-lock.yaml`). `npm` 명령은 사용하지 않는다(본 문서 상단의 `npm` 표기는 마이그레이션 전 잔재).
- 린터 권위: **Biome** (`biome.json`). qa-guard는 `pnpm exec biome check`로 검증한다. (`next lint`(eslint)도 설치돼 있으나 권위 기준은 Biome.)
- 언어/런타임: **TypeScript** 전용, **React 18.2**(React 19 전용 API 금지 — `useActionState` 등), Server Components 우선.
- i18n: 사용자 가시 문자열은 `lib/i18n`(목표 `shared/i18n`) 번역 키 경유. **로케일 파일(언어 집합 ko/en/jp)**: `lib/i18n/locales/ko.json`·`lib/i18n/locales/en.json`·`lib/i18n/locales/jp.json`. 새 키는 3개 파일 모두에 동일 키로 추가한다(한 곳이라도 누락하면 폴백되어 그 언어에서 키 문자열이 그대로 노출). 이 3개 경로가 qa-guard **i18n 키 패리티** 체크의 대조 대상이다 — 새 키 도입 시 3파일 전체에 동일 키 존재(누락 ✗)·고아 키 부재(✗)를 grep 대조한다.
- 모듈 경계(`docs/plans/2026-03-12-platform-restructure`): `shared↛modules`, `server↛페이지경로`, `app/api`는 도메인 규칙 미소유(`modules/*/server`·`server/*` 조합만). 주석·문서는 한국어, 식별자는 camelCase.

**동작 레이어 화이트리스트 (evaluator 게이팅 prefix):** 버그 경로에서 아래 prefix에 닿는 파일이 1개 이상이면 full evaluator를 실행한다.
```
app/api/   modules/   server/   lib/   (JWT·Redis·검증·서비스·도메인 규칙 레이어)
```
순수 스타일/마크업(className·JSX-only, `components/ui/`·`app/**/*.css`)만 변경되면 evaluator 스킵.

**변경 이력 작성 규칙:**
- 1행 = 1~3문장 + 대상 + 대응 ADR 링크(있을 시). 다단락 산문 금지.
- 3문장 초과·다단락 결정은 `docs/harness/decisions/ADR-NN-{slug}.md`로 분리하고 표에는 1줄 요약 + 링크만.
- 보존: 최근 90일 또는 마지막 10행. 초과분은 `docs/harness/history/YYYY-Q{N}.md`로 분기 아카이브.
- 자동 로딩: `orchestrate`·`compound`·`bugfix` 스킬 진입 시 본 표의 ADR 링크를 1회 로드한다.

**변경 이력 (L1 인덱스):**

| 날짜 | 변경 내용 | 대상 | ADR / 사유 |
|------|----------|------|------|
| 2026-06-14 | 하네스 초기 도입 — 골격 9에이전트+10스킬 복사, 구현 에이전트 2종(front·server) 생성, 역할 바인딩·컨벤션 등록 | 전체 | [ADR-01](docs/harness/decisions/ADR-01-harness-adoption.md) |
| 2026-06-14 | 진화 감사 Tier1+2+3 구현 — 골격 검증층(qa/tdd/design-review) 스택무관 재조준+위임(주입/검증·원자성·비밀 비로깅·i18n 패리티), 디자인 정적 성능 게이트 C-12/13·프론트 애니메이션 규칙 추가, 신규 에이전트 2종(공급망·경계) 추가 및 orchestrate 통합 | `.claude/skills/{qa,tdd,design-review,gender-reveal-front-build,supply-chain-audit,boundary-guard,orchestrate}`, `.claude/agents/{qa-guard,tdd-agent,design-reviewer,security-supply-chain,architecture-boundary-guard}`, CLAUDE.md | audit: [2026-06-14](docs/harness/audits/2026-06-14-agent-team-evolution-audit.md) · [ADR-02](docs/harness/decisions/ADR-02-security-supply-chain-agent.md) · [ADR-03](docs/harness/decisions/ADR-03-architecture-boundary-guard.md) |

# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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

## oms-codex 운영

### 기본 구현 에이전트

| 구현 영역 | 기본 에이전트 | 상태 |
|---|---|---|
| 프론트 구현 | `page-builder` | 설치됨 |
| 백엔드/API/데이터 구현 | `data-layer` | 설치됨 |
| 일반 코드/스크립트/인프라/결정 문서 | 오케스트레이터 직접 수행 | 확정 |

### 에이전트 실행 프로필

- 선택: `balanced`
- 선택 근거: 사용자 최초 선택
- 프로필 정본: `.agents/skills/init-project/references/agent-profiles.json`
- topology: `lean`
- topology 정본: `.agents/skills/init-project/references/topology-profiles.json`

| 에이전트 | 모델 | effort |
|---|---|---|
| `data-layer` | `gpt-5.6-sol` | `high` |
| `design-reviewer` | `gpt-5.6-sol` | `high` |
| `evaluator` | `gpt-5.6-sol` | `xhigh` |
| `page-builder` | `gpt-5.6-sol` | `high` |
| `qa-guard` | `gpt-5.6-terra` | `high` |
| `security-auditor` | `gpt-5.6-sol` | `xhigh` |

### 설치된 하네스

| 항목 | 경로 | 상태 |
|---|---|---|
| `page-builder` | `.codex/agents/page-builder.toml` | 설치됨 |
| `data-layer` | `.codex/agents/data-layer.toml` | 설치됨 |
| `design-reviewer` | `.codex/agents/design-reviewer.toml` | 설치됨 |
| `qa-guard` | `.codex/agents/qa-guard.toml` | 설치됨 |
| `security-auditor` | `.codex/agents/security-auditor.toml` | 설치됨 |
| `evaluator` | `.codex/agents/evaluator.toml` | 설치됨 |
| `plan-auditor` | `.codex/agents/plan-auditor.toml` | lean topology 미설치 |
| `compound-learner` | `.codex/agents/compound-learner.toml` | lean topology 미설치 |
| `compound-curator` | `.codex/agents/compound-curator.toml` | lean topology 미설치 |

### 에이전트 라우팅

| 작업 유형 | 우선 에이전트 | 게이트 후보 |
|---|---|---|
| 프론트 구현 | `page-builder` | `design-reviewer`, `qa-guard`, `evaluator` |
| 백엔드/API/데이터 구현 | `data-layer` + `tdd` skill | `security-auditor`, `qa-guard`, `evaluator` |
| 요구사항 검증 | `evaluator` | `qa-guard`, `design-reviewer`, `security-auditor` |
| 계획 감사 | 오케스트레이터 + `plan-audit` skill | 없음 |
| 진행 관리 | 오케스트레이터 + `milestone-track` skill | `evaluator` |
| 반복 학습 추가·정리 | 오케스트레이터 + `compound` skill | 없음 |
| 일반 코드·문서·인프라 | 오케스트레이터 | `qa-guard`, `evaluator` |

### 프로젝트 최적화

- 판정 유형: 풀스택 신규 개발
- 판정 근거: Next.js App Router UI와 `app/api/`, `lib/services/`, Redis/JWT 계층이 함께 존재한다.
- 적용 라우팅: 데이터 계약과 API는 `data-layer`, UI는 `page-builder`가 담당한다.
- override 상태: 기존 프로젝트 override 폐기, OMS Codex 기본 agent 사용
- 커밋 정책: `ask`
- commit-local capability: 사용 가능
- 프로젝트 컨벤션: pnpm, Biome, TypeScript, React 18.2, Server Components 우선, ko/en/jp i18n 키 패리티를 유지한다.
- 모듈 경계: `docs/plans/2026-03-12-platform-restructure`의 `shared↛modules`, `server↛페이지경로`, `app/api` 도메인 규칙 미소유 원칙을 유지한다.

### 설치 검증

- `.codex/agents/` 필수 에이전트 상태: lean core 6개 설치 확인
- 실행 프로필과 대상 agent TOML 일치: `balanced` 통과
- `.agents/skills/` 필수 스킬 상태: OMS Codex 1.2.0의 13개 skill 설치 확인
- 선택 에이전트 상태: lean topology이므로 선택 agent 3개 미설치
- 충돌/확인 필요: 없음

### 경로와 게이트

- 동작 레이어 prefix: `app/api/`, `lib/`
- 보안 고위험 prefix: `app/api/`, `lib/env.server.ts`, `lib/redis.ts`, `lib/rate-limit.ts`, `lib/services/`
- 보안 고위험 키워드: `auth`, `session`, `token`, `cookie`, `secret`, `credential`, `인증`, `인가`, `세션`, `토큰`, `쿠키`
- 시각 전용 prefix: `app/globals.css`, `components/animations/*.module.css`
- 마이그레이션/스키마/백필 위험 클래스: 현재 경로 근거 없음. `migration`, `schema`, `backfill`, `DDL`, `마이그레이션`, `스키마`, `백필` 키워드 매칭 시 확인한다.
- 기능형 버그는 경로만으로 evaluator를 스킵하지 않는다. 시각 전용 prefix에만 한정된 순수 시각 변경은 사용자 시각 검증으로 대체할 수 있다.

### 문서 경로

- 진행 정본: `docs/progress/milestone-status.md`
- 마일스톤 작업 로그: `docs/progress/milestones/M{N}.md`
- 반복 학습: `docs/compound/`
- 임시 검증 산출물: `_workspace/`

### 실행 규칙

- 마일스톤·기능 구현·구조 개선·버그·감사 요청은 `orchestrate` skill로 분기한다.
- `docs/progress/milestone-status.md`의 기존 마일스톤 목표·범위·완료 기준을 정본으로 사용한다. 괄호 안 역할 주석보다 이 섹션의 에이전트 라우팅을 우선한다.
- 주석과 저장 문서는 한국어로 작성하고, 사용자 가시 문자열은 `lib/i18n` 번역 키를 사용한다.

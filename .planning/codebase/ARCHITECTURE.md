# Architecture

**Analysis Date:** 2026-03-12

## Pattern Overview

**Overall:** Next.js App Router 기반 단일 웹 애플리케이션 + 서버리스 API 조합

**Key Characteristics:**
- 페이지 렌더링과 API 처리가 동일 저장소 안에서 동작한다.
- 즉시 공개 링크와 D-Day 예약 링크가 서로 다른 토큰 모델을 사용한다.
- 공개용 사용자 데이터는 대부분 stateless URL 접근으로 소비되지만, 예약 공개와 투표는 Redis 상태에 의존한다.
- 클라이언트 상호작용이 많은 화면은 `"use client"` 컴포넌트로 구현된다.

## Layers

**Presentation Layer:**
- Purpose: 랜딩, 생성, 공개, 카운트다운, 예시, 변경 이력 화면을 렌더링한다.
- Contains: `app/page.tsx`, `app/create/page.tsx`, `app/reveal/page.tsx`, `app/countdown/[token]/page.tsx`, `app/changelog/page.tsx`
- Depends on: 공통 컴포넌트, i18n 컨텍스트, API route
- Used by: 브라우저 사용자

**Feature Component Layer:**
- Purpose: 생성 폼, 공개 애니메이션, 피드백 모달, 투표 UI 같은 기능 단위를 캡슐화한다.
- Contains: `components/reveal-form/**`, `app/reveal/components/**`, `app/countdown/[token]/components/**`, `components/feedback/**`
- Depends on: UI 컴포넌트, hooks, schema, 번역 함수
- Used by: 페이지 컴포넌트

**Boundary / Validation Layer:**
- Purpose: 요청 파싱, 스키마 검증, 공통 에러 변환, 환경 검증을 담당한다.
- Contains: `lib/api-utils.ts`, `lib/errors.ts`, `lib/env.server.ts`, `lib/schemas/*.ts`, `lib/dday-utils.ts`
- Depends on: Zod, jose, Redis client
- Used by: API route, 폼 컴포넌트

**Application Service Layer:**
- Purpose: 외부 연동과 횡단 관심사를 캡슐화한다.
- Contains: `lib/redis.ts`, `lib/rate-limit.ts`, `lib/services/google-sheets.ts`, `lib/services/email.ts`, `lib/logger.ts`
- Depends on: 환경 변수, 외부 SDK
- Used by: API route

**State / Session Layer:**
- Purpose: 클라이언트 측 번역 상태, 투표 상태, 디바이스 식별자를 유지한다.
- Contains: `lib/i18n/context.tsx`, `hooks/useVoteStatus.ts`, `hooks/useDeviceId.ts`, `lib/store.ts`
- Depends on: Browser APIs, fetch
- Used by: 클라이언트 컴포넌트

## Data Flow

**즉시 공개 링크 생성:**
1. 사용자가 `/create`에서 `RevealForm`을 제출한다. 근거: `components/reveal-form/reveal-form.tsx`
2. 폼은 `formSchema`로 클라이언트 검증을 수행한다. 근거: `lib/schemas/reveal-form-schema.ts`
3. `/api/generate-token`이 요청을 파싱하고 필수 필드를 검증한 뒤 JWT를 생성한다. 근거: `app/api/generate-token/route.ts`
4. 클라이언트는 `/reveal?token=...` URL을 생성하고 공유한다.
5. `/reveal` 페이지는 `/api/verify-token`으로 토큰을 검증하고 결과를 렌더링한다. 근거: `app/reveal/page.tsx`, `app/api/verify-token/route.ts`

**D-Day 예약 공개:**
1. 사용자가 생성 폼에서 `scheduledAt`을 포함해 제출한다. 근거: `components/reveal-form/reveal-form.tsx`
2. `/api/dday/create`가 Zod 검증 후 `revealId`를 생성하고 Redis에 공개 데이터와 투표 상태를 저장한다. 근거: `app/api/dday/create/route.ts`
3. 서버는 `countdownToken`과 `revealToken`을 별도로 발급한다.
4. `/countdown/[token]` 페이지는 `/api/verify-token`에 `purpose: "countdown"`을 전달해 안전한 최소 데이터만 받는다. 근거: `app/countdown/[token]/page.tsx`
5. 시간이 도래하면 `/reveal?token=...&source=countdown` 경로로 이동하고 `/api/dday/reveal-data` 또는 `/api/verify-token`이 최종 공개 데이터를 반환한다.

**피드백 수집:**
1. 생성 완료 후 피드백 모달이 노출된다. 근거: `app/create/page.tsx`, `components/feedback/feedback-modal.tsx`
2. `/api/feedback`는 rate limit과 Zod 검증을 수행한다. 근거: `app/api/feedback/route.ts`
3. Google Sheets 저장과 Resend 메일 발송을 병렬 수행한다.
4. 부분 성공 시 `207 Multi-Status`, 완전 성공 시 `201`을 반환한다.

**State Management:**
- 페이지 지역 상태는 React `useState` 중심이다.
- 글로벌 번역 상태는 `LanguageProvider`가 관리한다. 근거: `lib/i18n/context.tsx`, `app/layout.tsx`
- 레거시 또는 보조 폼 상태는 Zustand store에 존재한다. 근거: `lib/store.ts`
- 투표 상태는 server polling + localStorage + httpOnly cookie 조합이다. 근거: `hooks/useVoteStatus.ts`, `app/api/dday/vote/route.ts`

## Key Abstractions

**AppError:**
- Purpose: API 경계에서 일관된 에러 코드와 메시지를 유지한다.
- Examples: `createBadRequestError`, `createForbiddenError`, `normalizeError`
- Pattern: 커스텀 예외 + `createErrorResponse` 직렬화. 근거: `lib/errors.ts`

**Token Purpose / Type:**
- Purpose: 카운트다운용 토큰과 공개용 토큰의 접근 범위를 분리한다.
- Examples: `purpose: "countdown" | "reveal"`, payload `type`
- Pattern: request intent와 signed token type 교차 검증. 근거: `app/api/verify-token/route.ts`

**Schema First Validation:**
- Purpose: 폼과 API의 입력 경계를 명시적으로 유지한다.
- Examples: `formSchema`, `ddayCreateSchema`, `feedbackFormSchema`, `voteSchema`
- Pattern: Zod safeParse + 조기 반환. 근거: `lib/schemas/*.ts`

## Entry Points

**Application Shell:**
- Location: `app/layout.tsx`
- Triggers: 모든 페이지 요청
- Responsibilities: 폰트, ThemeProvider, LanguageProvider, Analytics, AdSense를 초기화한다.

**User Pages:**
- `app/page.tsx` - 메인 랜딩 페이지
- `app/create/page.tsx` - 링크 생성 진입점
- `app/reveal/page.tsx` - 공개 애니메이션과 결과 렌더링
- `app/countdown/[token]/page.tsx` - D-Day 대기와 투표 UI

**API Boundaries:**
- `app/api/generate-token/route.ts`
- `app/api/verify-token/route.ts`
- `app/api/dday/create/route.ts`
- `app/api/dday/vote/route.ts`
- `app/api/dday/reveal-data/route.ts`
- `app/api/feedback/route.ts`

## Error Handling

**Strategy:** API route 내부에서 `try/catch` 후 `normalizeError` 또는 직접 `NextResponse.json`으로 변환한다.

**Patterns:**
- 파라미터 누락과 형식 오류는 함수 초반 guard clause로 차단한다. 근거: `lib/api-utils.ts`, `lib/dday-utils.ts`, `app/api/verify-token/route.ts`
- 비즈니스 오류는 `AppError` factory를 사용한다. 근거: `lib/errors.ts`
- 외부 연동 실패는 logger에 context와 함께 기록한다. 근거: `app/api/feedback/route.ts`, `lib/redis.ts`
- 클라이언트는 toast, alert, 에러 상태 화면으로 실패를 노출한다. 근거: `components/reveal-form/reveal-form.tsx`, `app/reveal/components/ErrorState.tsx`

## Cross-Cutting Concerns

**Logging:**
- `lib/logger.ts`가 JSON 로그와 민감정보 마스킹을 제공한다.

**Validation:**
- 폼은 React Hook Form + Zod, API는 Zod 또는 수동 필수값 검증을 조합한다.

**Internationalization:**
- `LanguageProvider`가 로케일 로딩과 문자열 치환을 담당한다. 근거: `lib/i18n/context.tsx`

**Security:**
- JWT 서명 검증, 공개 시각 검사, Redis 기반 rate limit, httpOnly cookie 기반 재투표 방지가 핵심 축이다.

---
*Architecture analysis: 2026-03-12*
*Update when major patterns change*

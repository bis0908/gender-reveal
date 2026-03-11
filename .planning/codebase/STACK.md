# Technology Stack

**Analysis Date:** 2026-03-12

## Languages

**Primary:**
- TypeScript - 애플리케이션 코드 전반. `app/`, `components/`, `lib/`, `hooks/`, `tests/`에서 사용한다.

**Secondary:**
- JavaScript - 런타임 설정과 스크립트. `next.config.js`, `jest.config.js`, `scripts/generate-secret.js`, `scripts/check-redis-connection.js`에 존재한다.
- JSON - 로케일과 도구 설정. `lib/i18n/locales/*.json`, `tsconfig.json`, `biome.json`, `components.json`에서 사용한다.
- Markdown - 사용자 문서와 변경 이력. `README.md`, `CLAUDE.md`, `content/changelog/*.md`에 존재한다.
- CSS - 전역 스타일과 애니메이션 스타일. `app/globals.css`, `components/animations/*.module.css`에 존재한다.

## Runtime

**Environment:**
- Node.js 기반 Next.js 서버 런타임 - App Router와 API Route 실행. 근거: `package.json`, `app/api/**/route.ts`
- Browser runtime - `"use client"` 컴포넌트와 훅이 폼 상태, 번역, 투표 UI를 처리한다. 근거: `app/page.tsx`, `app/create/page.tsx`, `app/reveal/page.tsx`, `app/countdown/[token]/page.tsx`

**Package Manager:**
- npm - 스크립트와 의존성 관리에 사용한다. 근거: `package.json`
- Lockfile: `package-lock.json` 존재

## Frameworks

**Core:**
- Next.js 15.5.11 - App Router 기반 웹 애플리케이션과 서버리스 API를 구성한다. 근거: `package.json`, `app/layout.tsx`
- React 18.2.0 - 클라이언트 인터랙션과 상태 기반 UI를 담당한다. 근거: `package.json`
- TypeScript 5.2.2 - 애플리케이션 타입 안전성을 제공한다. 근거: `package.json`, `tsconfig.json`
- Tailwind CSS 3.3.3 - 유틸리티 클래스 기반 스타일링을 담당한다. 근거: `package.json`, `tailwind.config.ts`, `app/globals.css`

**UI / Interaction:**
- Radix UI + shadcn/ui - 폼, 탭, 토스트, 카드 등 공통 UI 베이스를 제공한다. 근거: `package.json`, `components/ui/**`
- Framer Motion 11.1.8 - 공개 애니메이션과 전환 효과를 담당한다. 근거: `package.json`, `components/animations/**`
- React Hook Form + Zod - 생성 폼과 피드백 폼의 입력 검증 경계를 구성한다. 근거: `components/reveal-form/reveal-form.tsx`, `components/feedback/feedback-form.tsx`, `lib/schemas/*.ts`

**Testing:**
- Jest 29.7.0 - 테스트 러너. 근거: `package.json`, `jest.config.js`
- Testing Library - React 컴포넌트 통합 테스트. 근거: `package.json`, `tests/countdown-timer.integration.test.tsx`
- next/jest - Next.js 환경에 맞춘 Jest 설정 생성기. 근거: `jest.config.js`

## Key Dependencies

**Critical:**
- `jose` - JWT 생성과 검증. 즉시 공개 및 D-Day 공개 토큰 모두 여기에 의존한다. 근거: `app/api/generate-token/route.ts`, `app/api/verify-token/route.ts`, `app/api/dday/create/route.ts`
- `redis` - D-Day 예약 데이터, 투표 집계, rate limit 저장소. 근거: `lib/redis.ts`, `app/api/dday/**`, `lib/rate-limit.ts`
- `zod` - API와 폼 입력 스키마 검증. 근거: `lib/schemas/reveal-form-schema.ts`, `lib/schemas/dday-schema.ts`, `lib/schemas/feedback-schema.ts`
- `react-hook-form` + `@hookform/resolvers` - 생성 폼 상태와 검증 연결. 근거: `components/reveal-form/reveal-form.tsx`
- `zustand` - 과거 또는 보조 폼 상태 저장소. 근거: `lib/store.ts`

**Infrastructure / Content:**
- `googleapis` - 피드백을 Google Sheets에 적재한다. 근거: `lib/services/google-sheets.ts`
- `resend` - 관리자 피드백 알림 메일을 발송한다. 근거: `lib/services/email.ts`
- `remark` + `remark-html` + `gray-matter` - 변경 이력 Markdown 렌더링에 사용한다. 근거: `package.json`, `app/changelog/changelog-markdown.tsx`, `lib/markdown.ts`
- `@vercel/analytics` + `@vercel/speed-insights` - 운영 분석과 성능 계측을 삽입한다. 근거: `app/layout.tsx`

## Configuration

**Environment:**
- `.env.local`, `.env.development.local`, `.env.example`를 사용한다. 근거: 저장소 루트 파일 목록
- 서버 전용 환경 검증은 `lib/env.server.ts`에 집중되어 있다.
- 런타임 환경 플래그는 `lib/config.ts`에서 계산한다.

**Build / Tooling:**
- `next.config.js` - ESLint build 무시, 이미지 최적화 비활성화 설정을 가진다.
- `tsconfig.json` - `@/*` 경로 별칭과 `strict` 모드를 설정한다.
- `biome.json` - 포매터, 린터, import organize 설정을 가진다.
- `jest.config.js` - 테스트 매칭, coverage, `jose` mock 매핑을 설정한다.

## Platform Requirements

**Development:**
- Node.js + npm 환경이 필요하다.
- Redis 연동 기능을 검증하려면 `REDIS_URL`이 필요하다. 근거: `lib/redis.ts`, `scripts/check-redis-connection.js`
- JWT 기능을 검증하려면 `JWT_SECRET`이 필요하다. 근거: `lib/env.server.ts`

**Production:**
- Vercel 배포를 전제로 설계되어 있다. 근거: `README.md`, `.vercel/project.json`, `vercel.json`, `app/layout.tsx`
- 외부 서비스 의존성 없이 즉시 공개 링크는 동작할 수 있지만, D-Day 예약, 피드백 적재, 관리자 알림은 Redis / Google Sheets / Resend 구성이 있어야 완전하게 동작한다.

---
*Stack analysis: 2026-03-12*
*Update after major dependency changes*

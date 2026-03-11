# Coding Conventions

**Analysis Date:** 2026-03-12

## Naming Patterns

**Files:**
- Route 파일은 Next.js 규약 파일명을 사용한다: `page.tsx`, `layout.tsx`, `route.ts`
- 일반 모듈과 기능 컴포넌트 파일은 kebab-case가 우세하다. 예: `social-share.tsx`, `feedback-modal.tsx`, `reveal-form-schema.ts`
- Hook 파일은 `useXxx.ts` 패턴을 사용한다. 예: `hooks/useVoteStatus.ts`, `hooks/useDeviceId.ts`
- 테스트 파일은 `.test.ts`, `.test.tsx`, `.integration.test.tsx` 패턴을 사용한다.

**Functions:**
- 함수와 변수는 camelCase를 사용한다.
- 이벤트 핸들러는 `handle*` 접두어가 일반적이다. 예: `handleVote`, `handleTabChange`, `handleExpired`
- 비동기 함수도 별도 접두어 없이 camelCase를 사용한다. 예: `verifyToken`, `checkRateLimit`

**Variables / Constants:**
- 지역 변수는 camelCase를 사용한다.
- 상수는 UPPER_SNAKE_CASE를 사용한다. 예: `RATE_LIMIT_WINDOW`, `TOKEN_EXPIRATION`, `DEVICE_ID_KEY`
- enum 이름은 PascalCase, 값은 UPPER_SNAKE_CASE를 사용한다. 근거: `lib/errors.ts`

**Types:**
- interface, type alias, enum 모두 PascalCase를 사용한다. 예: `RevealRequest`, `UseVoteStatusReturn`, `ErrorCode`
- `I` 접두어는 i18n context 타입처럼 일부 예외만 존재하며, 일반 규칙은 아니다. 근거: `lib/i18n/context.tsx`

## Code Style

**Formatting:**
- TypeScript strict 모드를 사용한다. 근거: `tsconfig.json`
- 세미콜론 사용이 기본이다.
- Biome는 공백 들여쓰기, 80자 폭, double quote를 설정한다. 근거: `biome.json`
- 실제 코드에는 single quote와 double quote가 혼재한다. 신규 수정 시 전역 정리보다 파일 로컬 스타일을 우선 맞추는 편이 안전하다.

**Linting:**
- ESLint는 Next.js 규칙 기반이다. 근거: `package.json`, `.eslintrc.json`
- `next.config.js`에서 build 시 lint 오류를 무시한다. 따라서 린트는 로컬 검증 책임이 크다.
- Biome linter도 설정되어 있으나 현재 `package.json` 스크립트에는 직접 연결되어 있지 않다.

## Import Organization

**Observed Order:**
1. 외부 패키지
2. 내부 절대 경로 import (`@/`)
3. 같은 디렉터리 또는 상대 경로 import

**Grouping:**
- import 그룹 사이에 빈 줄을 두는 파일이 많다.
- `@/*` 경로 별칭을 광범위하게 사용한다. 근거: `tsconfig.json`, `jest.config.js`
- `import type`는 필요한 곳에서 선택적으로 사용한다. 예: `app/api/generate-token/route.ts`, `lib/services/google-sheets.ts`

## Error Handling

**Patterns:**
- 필수 파라미터 검증을 함수 초반에 둔다. 예: `parsePurpose`, `buildCountdownSafeData`, `calculateRedisTTL`, `getRedisUrl`
- API route는 `try/catch`로 감싼 뒤 `AppError` 계열로 정규화한다. 근거: `app/api/verify-token/route.ts`, `app/api/dday/create/route.ts`
- 재사용 에러 코드는 `lib/errors.ts`의 factory 함수로 만든다.
- 예상 가능한 입력 실패는 throw 후 상위 경계에서 JSON 응답으로 변환한다.

## Logging

**Framework:**
- `lib/logger.ts`의 커스텀 logger를 사용한다.
- 레벨은 `error`, `warn`, `info`, `debug` 네 단계다.

**Patterns:**
- 로그는 JSON 문자열로 출력한다.
- `token`, `secret`, `cookie`, `authorization` 등 민감 키는 마스킹한다.
- API 경계와 외부 연동 경계에서 context object와 함께 기록한다.
- 다만 일부 클라이언트 코드와 서비스에는 `console.log` / `console.error`가 남아 있다. 예: `app/create/page.tsx`, `components/reveal-form/reveal-form.tsx`, `lib/services/google-sheets.ts`

## Comments

**When to Comment:**
- 주석과 문서는 한국어가 기본이다. 근거: `CLAUDE.md`, 현재 소스 주석
- 단계 설명, 예외 사유, 보안 의도를 설명하는 주석이 많다.
- 단순한 대입 설명보다 왜 이런 흐름이 필요한지 설명하는 편이 우세하다.

**JSDoc / TSDoc:**
- 공통 유틸과 API helper에는 블록 주석이 자주 붙는다. 예: `lib/api-utils.ts`, `lib/dday-utils.ts`, `lib/redis.ts`
- React 컴포넌트는 함수 시그니처만으로 충분한 경우 별도 JSDoc 없이 구현되는 경우가 많다.

## Function Design

**Parameters:**
- 객체형 payload를 받아 필요한 필드를 추출하는 패턴이 많다.
- 스키마 검증과 guard clause를 조합해 early return / early throw를 선호한다.

**Return Values:**
- API 함수는 `NextResponse.json(...)`을 직접 반환한다.
- helper 함수는 실패 시 `undefined` 또는 예외를 사용하고, 성공 시 명시적 값을 반환한다.

**Complexity:**
- 단일 route 파일 안에 여러 helper가 같이 존재하는 편이다. 예: `app/api/verify-token/route.ts`, `app/api/dday/vote/route.ts`
- 복잡도가 커지면 `lib/`로 분리하지만 아직 route 내부 로직 비중이 높은 편이다.

## Module Design

**Exports:**
- 유틸, 훅, 서비스는 named export를 주로 사용한다.
- Next.js 페이지와 레이아웃은 default export를 사용한다.

**Design Bias:**
- 검증 로직은 스키마 또는 helper로 재사용한다.
- 페이지 전용 세부 UI는 라우트 하위 `components/`에 배치한다.
- 전역 배럴 export 패턴은 거의 사용하지 않는다.

---
*Convention analysis: 2026-03-12*
*Update when patterns change*

# Testing Patterns

**Analysis Date:** 2026-03-12

## Test Framework

**Runner:**
- Jest 29.7.0
- Config: `jest.config.js`
- Next.js integration: `next/jest`

**Assertion Library:**
- Jest 내장 `expect`
- React DOM matcher: `@testing-library/jest-dom`

**Run Commands:**
```bash
npm test
npm run test:watch
npm test -- jwt.test.ts
```

## Test File Organization

**Location:**
- 테스트는 주로 루트 `tests/` 디렉터리에 모아 둔다.
- 하위 기능별 서브디렉터리를 사용한다. 예: `tests/security/`
- mock 파일은 `tests/__mocks__/`에 둔다.

**Naming:**
- 기본 패턴: `*.test.ts`, `*.test.tsx`
- 통합 성격은 `.integration.test.tsx`를 사용한다. 예: `tests/countdown-timer.integration.test.tsx`
- 보안 성격은 하위 폴더 + 의미 있는 파일명 조합을 사용한다. 예: `tests/security/feedback-security.test.ts`

**Structure Example:**
```text
tests/
  __mocks__/jose.js
  countdown-timer.integration.test.tsx
  dday-reveal-data.test.ts
  verify-token-dday-gate.test.ts
  security/feedback-security.test.ts
```

## Test Structure

**Suite Organization:**
- `describe` 중첩으로 모듈 또는 시나리오를 나눈다.
- 테스트 이름은 Given-When-Then 문장 패턴을 강하게 따른다. 근거: `tests/security/feedback-security.test.ts`, `tests/countdown-timer.integration.test.tsx`
- `beforeEach`에서 mock 초기화, fake timer 설정, 공통 상태 재설정을 수행한다.
- `afterEach`에서 timer 복구와 mock 정리를 수행한다.

**Patterns:**
- Arrange/Act/Assert를 주석 또는 Given/When/Then 명명으로 드러낸다.
- 경계 조건과 오류 응답을 별도 테스트로 분리한다.
- 비동기 테스트는 `async/await`와 `waitFor`를 조합한다.

## Mocking

**Framework:**
- `jest.mock()` 기반 모듈 mock 사용
- `jest.fn()` 기반 함수 mock 사용

**Patterns:**
- Next.js 런타임 객체를 직접 mock 한다. 예: `next/server` mock in `tests/security/feedback-security.test.ts`
- 외부 서비스는 항상 mock 한다. 예: `@/lib/services/google-sheets`, `@/lib/services/email`, `@/lib/redis`
- `jose`는 전역 moduleNameMapper로 `tests/__mocks__/jose.js`에 연결한다. 근거: `jest.config.js`
- 타이머 기반 UI는 `jest.useFakeTimers()`와 `jest.advanceTimersByTime()`로 검증한다. 근거: `tests/countdown-timer.integration.test.tsx`

**What Gets Mocked:**
- Redis
- Email / Google Sheets
- NextResponse
- i18n context
- crypto.randomUUID

## Fixtures and Factories

**Test Data:**
- 간단한 fixture는 테스트 파일 내부 함수로 생성한다. 예: `createMockRequest` in `tests/security/feedback-security.test.ts`
- JWT payload 생성은 테스트 파일 내부 helper로 둔다. 예: `createToken` 류 helper in D-Day 관련 테스트
- 공용 mock은 `tests/__mocks__/jose.js`에 둔다.

## Coverage

**Configuration:**
- `collectCoverage: true`
- `coverageDirectory: coverage`
- 수집 대상: `app/**/*.{js,ts,tsx}`와 `src/**/*.{js,ts,tsx}`. 현재 저장소에는 `src/`가 없어 사실상 `app/` 중심으로 동작한다.

**Requirements:**
- 명시된 최소 coverage threshold는 없다.
- coverage는 회귀 탐지와 가시성 목적에 가깝다.

## Test Types

**Route / Utility Tests:**
- API route handler를 직접 import 해 호출한다.
- 내부 로직은 실제 구현을 사용하고 외부 경계만 mock 한다.
- Examples: `tests/dday-reveal-data.test.ts`, `tests/verify-token-dday-gate.test.ts`

**Client Integration Tests:**
- 컴포넌트를 실제 렌더링하고 DOM 결과를 검증한다.
- 타이머, 렌더링, 번역 stub을 함께 다룬다.
- Example: `tests/countdown-timer.integration.test.tsx`

**Security Regression Tests:**
- rate limit, 입력 검증, XSS/인젝션 처리, 에러 노출 여부를 다룬다.
- Example: `tests/security/feedback-security.test.ts`

## Common Patterns

**Async Testing:**
- `await POST(req)`처럼 route handler를 직접 호출한다.
- `await waitFor(...)`로 비동기 UI 업데이트를 기다린다.

**Error Testing:**
- 잘못된 입력 -> HTTP status와 error payload 검증
- 예외 노출 방지 -> body 내부에 stack/message 누락 여부 검증

**Snapshot Testing:**
- 확인된 snapshot 테스트는 없다.
- 명시적 DOM / JSON assertion을 선호한다.

---
*Testing analysis: 2026-03-12*
*Update when test patterns change*

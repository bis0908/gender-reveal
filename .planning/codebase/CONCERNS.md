# Codebase Concerns

**Analysis Date:** 2026-03-12

## Tech Debt

**즉시 공개 토큰 경로와 D-Day 토큰 경로의 이중 모델**
- Issue: 즉시 공개는 JWT 자체에 공개 데이터를 담고, D-Day는 Redis + `revealId` 참조 모델을 사용한다.
- Evidence: `app/api/generate-token/route.ts`, `app/api/dday/create/route.ts`, `app/api/verify-token/route.ts`
- Impact: 토큰 검증 경로가 복잡해지고, 두 흐름의 보안/버그 수정이 쉽게 분기된다.
- Fix approach: 토큰 모델을 하나로 통일하고, 가능하면 즉시 공개도 Redis 참조형으로 맞춘다.

**Route 내부 로직 집중**
- Issue: route 파일 안에 helper, 검증, 비즈니스 로직이 함께 들어 있는 파일이 많다.
- Evidence: `app/api/verify-token/route.ts`, `app/api/dday/vote/route.ts`, `app/api/generate-token/route.ts`
- Impact: 변경 범위가 넓고 테스트 대상을 분리하기 어렵다.
- Fix approach: 토큰 서비스, 투표 서비스, request parser를 `lib/` 하위 모듈로 분리한다.

**포매팅/린팅 체계 분산**
- Issue: Biome와 ESLint가 함께 존재하지만 스크립트 통합이 약하고 build 시 ESLint가 무시된다.
- Evidence: `biome.json`, `next.config.js`, `package.json`
- Impact: 파일별 스타일 편차와 린트 회귀가 누적될 수 있다.
- Fix approach: 하나의 formatter/linter 경로를 정하고 CI 또는 pre-commit에 연결한다.

## Security Considerations

**피드백 rate limit fail-open**
- Risk: Redis 연결이 없거나 실패하면 피드백 endpoint가 요청을 허용한다.
- Evidence: `lib/rate-limit.ts`
- Current mitigation: 경고 로그만 남긴다.
- Recommendations: 프로덕션에서는 fail-closed 또는 대체 rate limit 전략을 사용한다.

**즉시 공개 토큰의 개인정보 포함**
- Risk: 즉시 공개 URL이 로그, 분석, 브라우저 기록으로 노출되면 부모/아기 정보가 토큰 payload와 함께 유출될 수 있다.
- Evidence: `app/api/generate-token/route.ts`, `app/api/verify-token/route.ts`
- Current mitigation: JWT 서명으로 위변조만 막는다.
- Recommendations: 즉시 공개 흐름도 Redis 참조형 토큰으로 전환하고 URL payload를 최소화한다.

**투표 식별의 브라우저 의존성**
- Risk: 재투표 방지가 계정이 아니라 cookie/localStorage 수준이라 브라우저 초기화나 다른 기기에서는 우회가 가능하다.
- Evidence: `app/api/dday/vote/route.ts`, `hooks/useDeviceId.ts`, `hooks/useVoteStatus.ts`
- Current mitigation: IP rate limit + httpOnly cookie + localStorage 조합
- Recommendations: 요구 수준이 높다면 signed voter token 또는 초대 단위 제한 정책을 추가한다.

## Performance Bottlenecks

**3초 polling 기반 투표 상태 조회**
- Problem: 카운트다운 페이지가 표시된 동안 모든 클라이언트가 3초마다 `/api/dday/vote`를 호출한다.
- Evidence: `hooks/useVoteStatus.ts`
- Cause: 실시간성 구현을 polling으로 해결한다.
- Improvement path: Server-Sent Events, WebSocket, 또는 adaptive polling으로 전환한다.

**이미지 최적화 비활성화**
- Problem: Next.js 이미지 최적화가 꺼져 있다.
- Evidence: `next.config.js`
- Cause: 단순 배포 또는 호환성 이유로 `images.unoptimized = true`
- Improvement path: 운영 환경에서 이미지 최적화를 복원하고 큰 히어로 이미지를 점검한다.

## Fragile Areas

**카운트다운 공개 전환 계약**
- Why fragile: `/countdown/[token]` -> `/api/verify-token` -> `/reveal?source=countdown` -> `/api/dday/reveal-data` 흐름이 query param과 token `type`에 의존한다.
- Files: `app/countdown/[token]/page.tsx`, `app/reveal/page.tsx`, `app/api/verify-token/route.ts`, `app/api/dday/reveal-data/route.ts`
- Common failures: 잘못된 token type 처리, source 누락, 공개 시점 판정 불일치
- Safe modification: 토큰 계약을 바꾸기 전에 관련 route 테스트를 먼저 확장한다.
- Test coverage: 일부 route 테스트는 있으나 전체 브라우저 플로우 E2E는 없다.

**번역 초기화와 클라이언트 로딩 상태**
- Why fragile: 다수 페이지가 `isInitialized`와 `isLoading`에 의존해 로딩 UI를 분기한다.
- Files: `lib/i18n/context.tsx`, `app/page.tsx`, `app/create/page.tsx`
- Common failures: hydration 타이밍 이슈, 키 누락 시 빈 문자열 또는 key 노출
- Safe modification: 번역 로딩 규칙을 바꿀 때는 초기 렌더와 언어 전환 시나리오를 함께 검증한다.

## Test Coverage Gaps

**전체 사용자 흐름 E2E 부재**
- What's not tested: 링크 생성 -> countdown 공유 -> 투표 -> 공개 -> 결과 화면 전체 흐름
- Risk: 개별 route가 통과해도 실제 브라우저 전환에서 깨질 수 있다.
- Priority: High
- Evidence: `tests/`에는 unit/integration 수준 검증만 존재한다.

**외부 연동 계약 테스트 부재**
- What's not tested: Google Sheets / Resend 실제 계약과 실패 재시도 정책
- Risk: 배포 후 환경 변수 또는 외부 API 변경을 사전에 감지하기 어렵다.
- Priority: Medium
- Evidence: `app/api/feedback/route.ts`, `lib/services/google-sheets.ts`, `lib/services/email.ts`

**Lint 품질 게이트 부재**
- What's not tested: 빌드 시 린트 위반과 포맷 드리프트
- Risk: 코드 품질 문제와 경고가 누적된다.
- Priority: Medium
- Evidence: `next.config.js`, `package.json`, `biome.json`

---
*Concerns audit: 2026-03-12*
*Update as issues are fixed or new ones discovered*

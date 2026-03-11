# External Integrations

**Analysis Date:** 2026-03-12

## APIs & External Services

**Google Sheets:**
- 사용자 피드백을 스프레드시트에 적재한다.
  - SDK/Client: `googleapis`
  - Auth: `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`
  - Usage: `lib/services/google-sheets.ts`, `app/api/feedback/route.ts`

**Resend Email:**
- 피드백 제출 시 관리자에게 알림 메일을 발송한다.
  - SDK/Client: `resend`
  - Auth: `RESEND_API_KEY`, `ADMIN_EMAIL`
  - Usage: `lib/services/email.ts`, `app/api/feedback/route.ts`

**Kakao Share SDK:**
- 공유 컴포넌트에서 카카오 공유 기능을 호출한다.
  - Integration method: 브라우저 `window.Kakao`
  - Auth: `NEXT_PUBLIC_KAKAO_API_KEY`
  - Usage: `components/social-share.tsx`

**Google AdSense:**
- 광고 스크립트를 루트 레이아웃에서 로드한다.
  - Integration method: `<Script>` 삽입
  - Account: `ca-pub-9465556807993641`
  - Usage: `app/layout.tsx`

## Data Storage

**Redis:**
- D-Day 예약 공개 데이터, 투표 상태, rate limit 카운터를 저장한다.
  - Connection: `REDIS_URL`
  - Client: `redis`
  - Usage: `lib/redis.ts`, `app/api/dday/create/route.ts`, `app/api/dday/vote/route.ts`, `app/api/dday/reveal-data/route.ts`, `app/api/verify-token/route.ts`, `lib/rate-limit.ts`

**In-Process / Browser Storage:**
- 브라우저 `localStorage`에 투표 여부와 디바이스 ID를 저장한다.
  - Keys: `gr-voted-*`, `gr-device-id`
  - Usage: `hooks/useVoteStatus.ts`, `hooks/useDeviceId.ts`

**Static Assets / Content:**
- 공개 이미지와 favicon은 `public/images/**`에 존재한다.
- 변경 이력은 `content/changelog/*.md`에 저장된다.

## Authentication & Identity

**Custom JWT:**
- 사용자 인증이 아니라 링크 보호용 토큰 체계를 사용한다.
  - Implementation: `jose`
  - Secret: `JWT_SECRET`, `JWT_EXPIRATION`
  - Immediate reveal: 토큰 자체에 공개 데이터를 서명한다. 근거: `app/api/generate-token/route.ts`
  - Scheduled reveal: 토큰에는 `revealId`와 `type`만 두고 실제 공개 데이터는 Redis에 저장한다. 근거: `app/api/dday/create/route.ts`

**Voting Identity:**
- 서버는 `gr-voter-id` httpOnly cookie를 생성해 재투표를 방지한다.
  - Cookie issuance: `app/api/dday/vote/route.ts`
  - Client hint: `deviceId`를 함께 보내지만 서버 판단의 주체는 cookie 기반 `voterId`이다.

## Monitoring & Observability

**Application Logs:**
- 외부 로그 SaaS는 연결되어 있지 않고 stdout/stderr 구조화 로그를 사용한다.
  - Implementation: `lib/logger.ts`
  - 특징: 민감 키 마스킹, JSON 로그 포맷

**Vercel Analytics / Speed Insights:**
- 운영 페이지 뷰와 성능 계측을 삽입한다.
  - Usage: `app/layout.tsx`

## CI/CD & Deployment

**Hosting:**
- Vercel 배포를 전제로 둔다.
  - Evidence: `README.md`, `vercel.json`, `.vercel/project.json`
  - Environment vars: Vercel 대시보드 또는 로컬 `.env*` 파일

**Build / Delivery:**
- 별도 CI 워크플로 파일은 현재 저장소에서 확인되지 않았다.
- 기본 실행 스크립트는 `package.json`의 `dev`, `build`, `start`, `test`, `lint`에 한정된다.

## Environment Configuration

**Development:**
- 최소 필수: `JWT_SECRET`
- 기능별 필수:
  - D-Day / rate limit: `REDIS_URL`
  - 피드백 Sheets 저장: `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, `GOOGLE_SPREADSHEET_ID`
  - 관리자 메일: `RESEND_API_KEY`, `ADMIN_EMAIL`
  - 배포 URL / 공유: `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_KAKAO_API_KEY`

**Production:**
- `lib/env.server.ts`가 프로덕션에서 잘못된 JWT 환경을 강하게 차단한다.
- Redis 미연결 시 피드백 rate limit은 fail-open으로 동작한다. 근거: `lib/rate-limit.ts`

## Webhooks & Callbacks

**Incoming:**
- 확인된 외부 webhook endpoint는 없다.

**Outgoing:**
- Google Sheets append 요청 - 피드백 저장 시 발생. 근거: `lib/services/google-sheets.ts`
- Resend email 발송 - 피드백 저장 시 발생. 근거: `lib/services/email.ts`

---
*Integration audit: 2026-03-12*
*Update when adding/removing external services*

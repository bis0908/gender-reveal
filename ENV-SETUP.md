# 환경 변수 설정 가이드

## 개요
이 프로젝트는 환경 변수를 사용하여 JWT, Redis, Supabase 인증 및 메트릭 설정을 관리합니다. 로컬 개발 환경과 프로덕션 환경에서 적절하게 환경 변수를 설정하는 방법을 아래에 설명합니다.

## 안전한 JWT 비밀 키 생성

프로젝트에 포함된 스크립트를 사용해 안전한 비밀 키를 생성할 수 있습니다:

```bash
pnpm generate-secret
```

이 명령을 실행하면 안전한 비밀 키가 생성되며, 이를 `.env.local` 파일에 복사하여 사용하면 됩니다.

## 로컬 개발 환경 설정

1. 프로젝트 루트 디렉토리에 `.env.local` 파일을 생성합니다.
2. 아래 내용을 파일에 추가합니다:

```
# JWT 비밀 키 (개발용)
JWT_SECRET=your-secure-jwt-secret-key

# JWT 토큰 만료 시간
JWT_EXPIRATION=7d

# 즉시 공개 및 D-Day 생성 API의 공통 요청 제한
# 로컬 루프백 연결에만 평문 redis://를 사용할 수 있습니다.
REDIS_URL=redis://localhost:6379

# 원격 Redis를 사용하는 경우 TLS 연결이 필수입니다.
# REDIS_URL=rediss://username:password@host:6379

# Supabase 관리자 인증 및 생성 메트릭
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-server-only-supabase-secret-key
```

## 프로덕션 환경 설정 (Vercel)

Vercel에 배포할 경우:

1. 먼저 안전한 비밀 키 생성:
   ```bash
   pnpm generate-secret
   ```

2. Vercel 대시보드에서 프로젝트 설정으로 이동합니다.
3. "Environment Variables" 섹션에서 다음 변수를 추가합니다:
   - `JWT_SECRET`: 생성된 보안성 높은 비밀 키
   - `JWT_EXPIRATION`: 토큰 만료 시간 (예: '30d', '7d', '24h' 등)
   - `REDIS_URL`: 즉시 공개 및 D-Day 생성 API가 공통 요청 제한에 사용할 `rediss://` Redis 연결 URL
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 HTTPS URL. 각 환경이 사용할 프로젝트 값으로 설정
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: 브라우저 인증에 사용할 publishable key. 각 환경이 사용할 프로젝트 값으로 설정
   - `SUPABASE_SECRET_KEY`: 메트릭 기록과 집계에만 사용할 서버 전용 secret key. 운영 프로젝트 값은 Production에만 설정

## 참고사항

- 프로덕션 환경에서는 반드시 강력한 비밀 키를 사용하세요.
- `SUPABASE_SECRET_KEY`와 `REDIS_URL`은 클라이언트 코드, 로그 또는 공개 문서에 실제 값을 기록하지 마세요.
- Preview·Development에는 운영 `SUPABASE_SECRET_KEY`를 복제하지 마세요. 비운영 Supabase 프로젝트의 별도 secret을 사용하거나 해당 서버 기능을 비활성화하세요.
- `NEXT_PUBLIC_SUPABASE_URL`은 반드시 HTTPS URL을 사용하세요.
- 원격 Redis 연결에는 TLS가 적용된 `rediss://` URL을 사용해야 합니다. 평문 `redis://`는 `localhost`, `127.0.0.0/8`, `::1` 루프백 연결에만 허용됩니다.
- `REDIS_URL`이 없거나 Redis 요청 제한이 실패하면 두 생성 API는 안전하게 요청을 거부합니다.
- `.env.local` 파일은 절대 깃 저장소에 커밋하지 마세요. (기본적으로 `.gitignore`에 포함되어 있습니다)
- `JWT_SECRET`의 개발용 대체 값은 `lib/env.server.ts`에서만 허용되며, 프로덕션에서 누락되면 시작 검증이 실패합니다.
- 생성된 JWT 토큰은 기본적으로 7일 후에 만료됩니다. 만료 시간을 변경하려면 `JWT_EXPIRATION` 환경 변수를 수정하세요.

## 환경 변수 목록

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `JWT_SECRET` | JWT 토큰 서명에 사용되는 비밀 키 | 개발 환경 전용 대체 값, 프로덕션 없음 |
| `JWT_EXPIRATION` | JWT 토큰 만료 시간 | '7d' |
| `REDIS_URL` | 생성 API 공통 요청 제한과 D-Day 데이터 저장에 사용할 Redis URL. 원격 연결은 `rediss://` 필수 | 없음 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 HTTPS URL | 없음 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 관리자 로그인용 공개 키 | 없음 |
| `SUPABASE_SECRET_KEY` | 서버 메트릭 기록 및 집계용 secret key | 없음 |

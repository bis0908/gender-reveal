# 환경 변수 설정 가이드

## 개요
이 프로젝트는 환경 변수를 사용하여 JWT 비밀 키 및 설정을 관리합니다. 로컬 개발 환경과 프로덕션 환경에서 적절하게 환경 변수를 설정하는 방법을 아래에 설명합니다.

## 안전한 JWT 비밀 키 생성

프로젝트에 포함된 스크립트를 사용해 안전한 비밀 키를 생성할 수 있습니다:

```bash
node scripts/generate-secret.js
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
```

## 프로덕션 환경 설정 (Vercel)

Vercel에 배포할 경우:

1. 먼저 안전한 비밀 키 생성:
   ```bash
   node scripts/generate-secret.js
   ```

2. Vercel 대시보드에서 프로젝트 설정으로 이동합니다.
3. "Environment Variables" 섹션에서 다음 변수를 추가합니다:
   - `JWT_SECRET`: 생성된 보안성 높은 비밀 키
   - `JWT_EXPIRATION`: 토큰 만료 시간 (예: '30d', '7d', '24h' 등)

## 참고사항

- 프로덕션 환경에서는 반드시 강력한 비밀 키를 사용하세요.
- `.env.local` 파일은 절대 깃 저장소에 커밋하지 마세요. (기본적으로 `.gitignore`에 포함되어 있습니다)
- 환경 변수가 설정되지 않은 경우 `lib/env.ts`에 정의된 기본값이 사용됩니다.
- 생성된 JWT 토큰은 기본적으로 7일 후에 만료됩니다. 만료 시간을 변경하려면 `JWT_EXPIRATION` 환경 변수를 수정하세요.

## 환경 변수 목록

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `JWT_SECRET` | JWT 토큰 서명에 사용되는 비밀 키 | 'gender-reveal-secret-key-2025' |
| `JWT_EXPIRATION` | JWT 토큰 만료 시간 | '30d' | 
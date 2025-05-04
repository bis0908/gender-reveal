# Gender Reveal 애플리케이션

Gender Reveal 이벤트를 위한 웹 애플리케이션입니다. 사용자가 아기 정보를 입력하고 Gender Reveal 링크를 생성하여 공유할 수 있습니다.

## 기능

- 부모 및 아기 정보 입력
- 다양한 애니메이션 스타일 선택
- 링크 생성 및 공유 기능
- 카운트다운 타이머
- Gender Reveal 애니메이션

## 기술 스택

- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui 컴포넌트
- Framer Motion 애니메이션
- jose (JWT 토큰 관리)

## 설치 및 실행

1. 저장소 클론
```bash
git clone <repository-url>
cd gender-reveal
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 필요한 환경 변수를 설정합니다.
(자세한 내용은 `ENV-SETUP.md` 파일 참조)

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 http://localhost:3000 접속

## 환경 변수 설정

이 프로젝트는 JWT 토큰을 사용하여 Gender Reveal 데이터를 암호화합니다. 환경 변수 설정에 대한 자세한 내용은 `ENV-SETUP.md` 파일을 참조하세요.

주요 환경 변수:
- `JWT_SECRET`: JWT 토큰 서명에 사용되는 비밀 키
- `JWT_EXPIRATION`: JWT 토큰 만료 시간 (기본값: 7일)

## 배포

이 프로젝트는 Vercel에 쉽게 배포할 수 있습니다:

1. [Vercel](https://vercel.com) 계정 연결
2. 저장소 가져오기
3. 필요한 환경 변수 설정
4. 배포 진행

## 라이선스

MIT 
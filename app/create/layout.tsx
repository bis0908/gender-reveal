import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gender Reveal 만들기 - 나만의 젠더 리빌 파티 생성',
  description: '간단한 단계를 통해 가족과 친구들과 공유할 수 있는 아름다운 젠더 리빌 경험을 만들어보세요.',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: 'Gender Reveal 만들기 - 나만의 젠더 리빌 파티 생성',
    description: '간단한 단계를 통해 가족과 친구들과 공유할 수 있는 아름다운 젠더 리빌 경험을 만들어보세요.',
    siteName: 'Gender Reveal',
    images: [
      {
        url: '/images/gender_reveal_og.png',
        width: 1200,
        height: 630,
        alt: 'Gender Reveal 만들기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gender Reveal 만들기 - 나만의 젠더 리빌 파티 생성',
    description: '간단한 단계를 통해 가족과 친구들과 공유할 수 있는 아름다운 젠더 리빌 경험을 만들어보세요.',
    images: ['/images/gender_reveal_og.png'],
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
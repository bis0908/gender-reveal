import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gender Reveal 예시 - 다양한 젠더 리빌 애니메이션 미리보기',
  description: '다양한 젠더 리빌 애니메이션 예시를 확인하고 나만의 특별한 순간을 위한 아이디어를 얻어보세요.',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: 'Gender Reveal 예시 - 다양한 젠더 리빌 애니메이션 미리보기',
    description: '다양한 젠더 리빌 애니메이션 예시를 확인하고 나만의 특별한 순간을 위한 아이디어를 얻어보세요.',
    siteName: 'Gender Reveal',
    images: [
      {
        url: '/images/gender_reveal_og.png',
        width: 1200,
        height: 630,
        alt: 'Gender Reveal 예시',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gender Reveal 예시 - 다양한 젠더 리빌 애니메이션 미리보기',
    description: '다양한 젠더 리빌 애니메이션 예시를 확인하고 나만의 특별한 순간을 위한 아이디어를 얻어보세요.',
    images: ['/images/gender_reveal_og.png'],
  },
};

export default function ExamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
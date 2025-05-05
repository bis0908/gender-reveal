import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gender Reveal - 아기의 성별을 확인하세요',
  description: '특별한 순간을 함께 나누고 아기의 성별을 확인해보세요. 진정한 서프라이즈를 경험하세요!',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: 'Gender Reveal - 아기의 성별을 확인하세요',
    description: '특별한 순간을 함께 나누고 아기의 성별을 확인해보세요. 진정한 서프라이즈를 경험하세요!',
    siteName: 'Gender Reveal',
    images: [
      {
        url: '/images/gender_reveal_og.png',
        width: 1200,
        height: 630,
        alt: 'Gender Reveal 페이지',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gender Reveal - 아기의 성별을 확인하세요',
    description: '특별한 순간을 함께 나누고 아기의 성별을 확인해보세요. 진정한 서프라이즈를 경험하세요!',
    images: ['/images/gender_reveal_og.png'],
  },
};

export default function RevealLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
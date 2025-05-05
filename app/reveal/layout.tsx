import type { Metadata } from 'next';
import { headers } from 'next/headers';

type Props = {
  params: Record<string, never>;
  searchParams: { token?: string; demo?: string };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const token = searchParams.token;
  const demo = searchParams.demo;

  const title = 'Gender Reveal - 아기의 성별을 확인하세요';
  const description = '특별한 순간을 함께 나누고 아기의 성별을 확인해보세요. 진정한 서프라이즈를 경험하세요!';

  // 동적 내용을 가져오려면 API를 호출할 수 있지만, 
  // 현재 페이지에서는 토큰이 URL에만 있고 서버에서 데이터를 확인하기 어려워
  // 기본 메타데이터를 사용
  
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      title,
      description,
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
      title,
      description,
      images: ['/images/gender_reveal_og.png'],
    },
  };
}

export default function RevealLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import ko from '@/lib/i18n/locales/ko.json';
import en from '@/lib/i18n/locales/en.json';

const translations = { ko, en };

async function getLanguageFromHeaders(): Promise<'ko' | 'en'> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Check if English is preferred
  if (acceptLanguage.includes('en') && !acceptLanguage.startsWith('ko')) {
    return 'en';
  }
  
  return 'ko'; // Default to Korean
}

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguageFromHeaders();
  const t = translations[language];

  const title = t.reveal.metaTitle;
  const description = t.reveal.metaDescription;
  const locale = language === 'ko' ? 'ko_KR' : 'en_US';

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale,
      title,
      description,
      siteName: 'Gender Reveal',
      images: [
        {
          url: '/images/gender_reveal_og.png',
          width: 1200,
          height: 630,
          alt: title,
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
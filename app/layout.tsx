import './globals.css';
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Gender Reveal - 특별한 순간을 공유하세요',
  description: '친구와 가족들과 공유할 수 있는 아름다운 온라인 젠더 리빌 파티를 만들어보세요',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://gender-reveal.vercel.app',
    title: 'Gender Reveal - 특별한 순간을 공유하세요',
    description: '친구와 가족들과 공유할 수 있는 아름다운 온라인 젠더 리빌 파티를 만들어보세요',
    siteName: 'Gender Reveal',
    images: [
      {
        url: '/images/gender_reveal_og.png',
        width: 1200,
        height: 630,
        alt: 'Gender Reveal 웹사이트',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gender Reveal - 특별한 순간을 공유하세요',
    description: '친구와 가족들과 공유할 수 있는 아름다운 온라인 젠더 리빌 파티를 만들어보세요',
    images: ['/images/gender_reveal_og.png'],
  },
  icons: {
    icon: [
      { url: '/images/favicon/favicon.ico' },
      { url: '/images/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: {
      url: '/images/favicon/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    other: [
      {
        rel: 'manifest',
        url: '/images/favicon/site.webmanifest',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
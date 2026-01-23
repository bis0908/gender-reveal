import { getChangeLogEntries } from '@/lib/markdown';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import { ChangeLogMarkdown } from './changelog-markdown';

export const metadata: Metadata = {
  title: 'ChangeLog - Gender Reveal',
  description: 'Gender Reveal 서비스의 업데이트 소식 및 변경사항을 확인하세요',
};

export default async function ChangeLogPage() {
  const entries = await getChangeLogEntries();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            홈으로 돌아가기
          </Link>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent mb-2">
            업데이트 소식
          </h1>
          <p className="text-muted-foreground">
            Gender Reveal 서비스의 최신 업데이트 및 개선사항을 확인하세요
          </p>
        </div>

        {/* ChangeLog Markdown */}
        <ChangeLogMarkdown entries={entries} />
      </div>
    </div>
  );
}

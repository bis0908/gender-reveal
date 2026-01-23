'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface ChangeLogEntry {
  slug: string;
  date: string;
  version: string;
  category: 'feature' | 'bugfix' | 'improvement';
  content: string;
}

interface ChangeLogClientProps {
  entries: ChangeLogEntry[];
}

// 카테고리별 스타일 정의
const getCategoryStyles = (t: (key: string) => string) => ({
  feature: {
    icon: '🎉',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    label: t('changelog.categories.feature'),
  },
  bugfix: {
    icon: '🐛',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    label: t('changelog.categories.bugfix'),
  },
  improvement: {
    icon: '✨',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    label: t('changelog.categories.improvement'),
  },
});

export function ChangeLogClient({ entries }: ChangeLogClientProps) {
  const { t } = useTranslation();
  const categoryStyles = getCategoryStyles(t);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            {t('changelog.backToHome')}
          </Link>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent mb-2">
            {t('changelog.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('changelog.description')}
          </p>
        </div>

        {/* ChangeLog 항목 리스트 */}
        {entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('changelog.noUpdates')}
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <article
                key={entry.slug}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* 메타 정보 */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        categoryStyles[entry.category].color
                      }`}
                    >
                      {categoryStyles[entry.category].icon}{' '}
                      {categoryStyles[entry.category].label}
                    </span>
                    <span className="text-sm font-semibold bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
                      v{entry.version}
                    </span>
                  </div>
                  <time className="text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>

                {/* 본문 내용 */}
                <div
                  className="prose prose-pink prose-sm max-w-none dark:prose-invert
                    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                    prose-p:text-gray-700 dark:prose-p:text-gray-300
                    prose-a:text-primary hover:prose-a:text-primary/80
                    prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                    prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                    prose-li:text-gray-700 dark:prose-li:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

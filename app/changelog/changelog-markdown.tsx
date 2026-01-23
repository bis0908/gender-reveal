'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ChangeLogEntry } from '@/lib/markdown';

interface CategoryBadgeProps {
  category: ChangeLogEntry['category'];
}

/**
 * 카테고리별 배지 컴포넌트
 */
function CategoryBadge({ category }: CategoryBadgeProps) {
  const categoryConfig = {
    feature: {
      icon: '🎉',
      label: '새로운 기능',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    improvement: {
      icon: '🔧',
      label: '개선사항',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    },
    bugfix: {
      icon: '🐛',
      label: '버그 수정',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    },
  };

  const config = categoryConfig[category];

  return (
    <Badge variant="secondary" className={config.className}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}

interface ChangeLogMarkdownProps {
  entries: ChangeLogEntry[];
}

/**
 * Markdown 기반 ChangeLog UI 컴포넌트
 */
export function ChangeLogMarkdown({ entries }: ChangeLogMarkdownProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        아직 업데이트 소식이 없습니다.
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={entries.length > 0 ? [entries[0].slug] : []}
      className="w-full space-y-4"
    >
      {entries.map((entry) => (
        <AccordionItem
          key={entry.slug}
          value={entry.slug}
          className="border rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full text-left">
              <time className="text-lg font-bold bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent">
                {new Date(entry.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <div className="flex items-center gap-2">
                <CategoryBadge category={entry.category} />
                <span className="text-sm text-muted-foreground">
                  v{entry.version}
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div
              className="prose prose-sm dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-foreground
                prose-h1:text-2xl prose-h1:mb-4
                prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-ul:my-2 prose-li:my-1
                prose-strong:text-foreground prose-strong:font-semibold"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

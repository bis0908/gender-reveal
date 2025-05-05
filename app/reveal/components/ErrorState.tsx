import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto" aria-hidden="true">
              <title>에러 아이콘</title>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">오류</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button asChild>
            <a href="/">홈페이지로 이동</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 
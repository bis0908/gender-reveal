"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon, ExternalLinkIcon, AlertTriangleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n/context';

interface GeneratedLinkCardProps {
  generatedLink: string;
}

// JWT 토큰에서 만료 날짜를 추출하는 함수
function getExpirationDate(link: string): string | null {
  try {
    // URL에서 토큰 추출
    const url = new URL(link);
    const token = url.searchParams.get('token');
    
    if (!token) return null;
    
    // JWT 토큰을 디코딩 (서명 검증 없이 페이로드만 추출)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // exp 클레임에서 만료 시간 추출 (Unix timestamp)
    if (payload.exp) {
      const expirationDate = new Date(payload.exp * 1000);
      const dateStr = expirationDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\. /g, '-').replace(/\.$/, '');
      
      const dayOfWeek = expirationDate.toLocaleDateString('ko-KR', {
        weekday: 'short'
      });
      
      return `${dateStr} (${dayOfWeek})`;
    }
    
    return null;
  } catch (error) {
    console.error('토큰 만료 날짜 추출 오류:', error);
    return null;
  }
}

// JWT_EXPIRATION 값에서 일수 추출하는 함수
function getDaysFromExpiration(expiration: string = '7d'): number {
  const match = expiration.match(/(\d+)d/);
  return match ? parseInt(match[1]) : 7;
}

export function GeneratedLinkCard({ generatedLink }: GeneratedLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const expDate = getExpirationDate(generatedLink);
    setExpirationDate(expDate);
  }, [generatedLink]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({
        title: t('success.linkCopied'),
        description: t('success.linkCopiedDescription'),
        variant: "default",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast({
        title: t('success.copyFailed'),
        description: t('success.copyFailedDescription'),
        variant: "destructive",
      });
    }
  };

  // 기본 만료 기간 (환경 변수에서 가져오거나 기본값 7일)
  const defaultDays = getDaysFromExpiration(process.env.NEXT_PUBLIC_JWT_EXPIRATION || '7d');

  return (
    <div className="mt-6 p-4 border rounded-lg bg-muted">
      <h3 className="font-medium mb-2">{t('link.title')}</h3>
      <div className="flex gap-2">
        <Input 
          value={generatedLink} 
          readOnly 
          className="flex-1"
          onClick={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="outline"
          onClick={copyToClipboard}
          className="flex-shrink-0"
        >
          {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          <span className="ml-2">{copied ? t('success.linkCopied') : t('common.copy')}</span>
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={() => window.open(generatedLink, '_blank')}
          className="flex-shrink-0"
        >
          <ExternalLinkIcon className="h-4 w-4" />
          <span className="ml-2">{t('link.test')}</span>
        </Button>
      </div>
      
      {/* 만료 날짜 경고 메시지 */}
      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertTriangleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">{t('link.expirationTitle')}</p>
            <p className="mt-1">
              {t('link.expirationDescription', { 
                days: defaultDays.toString(),
                date: expirationDate ? ` ${expirationDate}까지` : ''
              })}<br/>
              {t('link.expirationWarning')}
            </p>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-2">
        {t('link.shareDescription')}
      </p>
    </div>
  );
} 
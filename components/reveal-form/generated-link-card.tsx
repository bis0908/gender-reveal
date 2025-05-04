"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedLinkCardProps {
  generatedLink: string;
}

export function GeneratedLinkCard({ generatedLink }: GeneratedLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({
        title: "복사 완료!",
        description: "링크가 클립보드에 복사되었습니다.",
        variant: "default",
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast({
        title: "복사 실패",
        description: "링크를 직접 선택하여 복사해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-muted">
      <h3 className="font-medium mb-2">Gender Reveal 링크</h3>
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
          <span className="ml-2">{copied ? "복사됨" : "복사"}</span>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        이 링크를 공유하여 Gender Reveal을 가족 및 이웃들에게 전하세요.
      </p>
    </div>
  );
} 
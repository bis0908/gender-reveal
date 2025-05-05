"use client";

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyIcon, CheckIcon, Share2Icon } from 'lucide-react';
import { 
  TwitterShareButton, 
  TwitterIcon, 
  FacebookShareButton, 
  FacebookIcon,
  WhatsappShareButton,
  WhatsappIcon,
  TelegramShareButton,
  TelegramIcon,
  LineShareButton,
  LineIcon,
  EmailShareButton,
  EmailIcon
} from 'react-share';
import type { Gender, BabyInfo } from '@/lib/types';

interface SocialShareProps {
  url: string;
  title: string;
  motherName: string;
  fatherName: string;
  gender?: Gender;
  multipleBabies?: BabyInfo[];
}

export function SocialShare({ 
  url, 
  title, 
  motherName, 
  fatherName}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  
  // 공유 텍스트 생성
  const shareText = useCallback(() => {
    return `${motherName}와(과) ${fatherName}의 Gender Reveal에 초대합니다! 함께 축하해주세요! 🎉`;
  }, [motherName, fatherName])();
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    }
  };
  
  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-3">Gender Reveal 공유하기</h3>
        <p className="text-gray-600 mb-4">
          소중한 소식을 가족과 친구들에게 공유해보세요
        </p>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted">
        <Label htmlFor="share-link" className="block mb-2">링크 복사</Label>
        <div className="flex gap-2">
          <Input 
            id="share-link"
            value={url} 
            readOnly 
            onClick={(e) => e.currentTarget.select()}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={copyToClipboard}
            className="flex-shrink-0 gap-1"
          >
            {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
            <span>{copied ? "복사됨" : "복사"}</span>
          </Button>
        </div>
      </div>
      
      <div>
        <Label className="block mb-3">소셜 미디어에 공유하기</Label>
        <div className="flex flex-wrap gap-3">
          {hasNativeShare && (
            <Button
              type="button"
              variant="outline"
              onClick={handleNativeShare}
              className="gap-2"
            >
              <Share2Icon className="h-4 w-4" />
              공유하기
            </Button>
          )}
          
          <TwitterShareButton url={url} title={shareText}>
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted">
              <TwitterIcon size={24} round />
              <span>트위터</span>
            </div>
          </TwitterShareButton>
          
          <FacebookShareButton url={url} hashtag="#GenderReveal">
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted">
              <FacebookIcon size={24} round />
              <span>페이스북</span>
            </div>
          </FacebookShareButton>
          
          <WhatsappShareButton url={url} title={shareText}>
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted">
              <WhatsappIcon size={24} round />
              <span>왓츠앱</span>
            </div>
          </WhatsappShareButton>
          
          <TelegramShareButton url={url} title={shareText}>
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted">
              <TelegramIcon size={24} round />
              <span>텔레그램</span>
            </div>
          </TelegramShareButton>
          
          <LineShareButton url={url} title={shareText}>
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted">
              <LineIcon size={24} round />
              <span>라인</span>
            </div>
          </LineShareButton>
          
          <EmailShareButton url={url} subject={title} body={`${shareText}\n\n${url}`}>
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted">
              <EmailIcon size={24} round />
              <span>이메일</span>
            </div>
          </EmailShareButton>
        </div>
      </div>
    </div>
  );
}
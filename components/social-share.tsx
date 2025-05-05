"use client";

import { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyIcon, CheckIcon, Share2Icon } from 'lucide-react';
import Image from 'next/image';
import { 
  TwitterShareButton, 
  TwitterIcon, 
  FacebookShareButton, 
  FacebookIcon,
  WhatsappShareButton,
  WhatsappIcon,
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

// Kakao SDK 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        createDefaultButton: (options: {
          container: string;
          objectType: string;
          text: string;
          link: {
            mobileWebUrl: string;
            webUrl: string;
          };
        }) => void;
      };
    };
  }
}

export function SocialShare({ 
  url, 
  title, 
  motherName, 
  fatherName,
  gender,
  multipleBabies
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  
  // 공유 텍스트 생성
  const shareText = useCallback(() => {
    if (multipleBabies && multipleBabies.length > 0) {
      const babiesCount = multipleBabies.length;
      const babiesText = babiesCount > 1 ? `${babiesCount}명의 아기들` : "아기";
      
      return `${motherName}와(과) ${fatherName}의 Gender Reveal 파티에 초대합니다! ${babiesText}의 성별을 함께 확인해보세요! 🎉`;
    }
    
    return `${motherName}와(과) ${fatherName}의 Gender Reveal 파티에 초대합니다! 아기의 성별을 함께 확인해보세요! 🎉`;
  }, [motherName, fatherName, multipleBabies])();
  
  // 카카오톡 SDK 초기화
  useEffect(() => {
    // 카카오 SDK 스크립트가 없으면 추가
    if (!document.getElementById('kakao-sdk')) {
      const script = document.createElement('script');
      script.id = 'kakao-sdk';
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js";
      script.integrity = "sha384-dok87au0gKqJdxs7msEdBPNnKSRT+/mhTVzq+qOhcL464zXwvcrpjeWvyj1kCdq6";
      script.crossOrigin = "anonymous";
      script.async = true;
      script.onload = () => {
        // 스크립트 로드 후 초기화
        if (window.Kakao && !window.Kakao.isInitialized()) {
          // 개발 환경에서는 임시 키 사용, 실제 환경에서는 환경 변수에서 가져와야 함
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY || '');
          setKakaoLoaded(true);
        }
      };
      document.head.appendChild(script);
    } else if (window.Kakao && !window.Kakao.isInitialized()) {
      // 이미 스크립트가 있지만 초기화되지 않은 경우
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '');
      setKakaoLoaded(true);
    } else if (window.Kakao) {
      // 이미 초기화된 경우
      setKakaoLoaded(true);
    }
  }, []);

  // 카카오톡 공유 버튼 설정
  useEffect(() => {
    if (kakaoLoaded && window.Kakao) {
      window.Kakao.Share.createDefaultButton({
        container: '#kakaotalk-share-btn',
        objectType: 'text',
        text: shareText,
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      });
    }
  }, [kakaoLoaded, shareText, url]);
  
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
          
          <div id="kakaotalk-share-btn" className="flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-muted cursor-pointer">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FEE500]">
              <svg width="24" height="24" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="kakaoIconTitle">
                <title id="kakaoIconTitle">카카오톡 공유 보내기 버튼</title>
                <path fillRule="evenodd" clipRule="evenodd" d="M128 36C74.98 36 32 68.05 32 107.85C32 134.58 51.14 158.37 79.86 170.96L70.51 204.23C69.16 209.15 74.77 213.03 79.06 210.11L119.95 182.19C122.6 182.46 125.28 182.6 128 182.6C181.02 182.6 224 150.55 224 110.75C224 71.05 181.02 36 128 36Z" fill="#191919" fillOpacity="0.9"/>
              </svg>
            </div>
            <span>카카오톡</span>
          </div>
          
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
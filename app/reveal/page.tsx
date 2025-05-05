"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import type { RevealData, Gender } from '@/lib/types';
import { demoExamples } from './constants';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { RevealIntro } from './components/RevealIntro';
import { RevealAnimation } from './components/RevealAnimation';
import { RevealResults } from './components/RevealResults';

export default function RevealPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const demoId = searchParams.get('demo');
  
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [startCountdown, setStartCountdown] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentBabyIndex, setCurrentBabyIndex] = useState(0);
  
  // 결과 영역에 대한 ref 생성
  const resultSectionRef = useRef<HTMLDivElement>(null);
  
  // 다태아인지 확인하는 헬퍼 함수
  const isMultipleBabies = revealData?.isMultiple && revealData?.babiesInfo && revealData.babiesInfo.length > 1;
  
  // 현재 표시할 아기 정보 가져오기
  const getCurrentBaby = (): { name: string, gender: Gender } => {
    if (isMultipleBabies && revealData?.babiesInfo) {
      return {
        name: revealData.babiesInfo[currentBabyIndex].name,
        gender: revealData.babiesInfo[currentBabyIndex].gender
      };
    }
    return {
      name: revealData?.babyName || '',
      gender: revealData?.gender || 'boy'
    };
  };
  
  // 다음 아기로 넘어가는 함수
  const goToNextBaby = () => {
    if (isMultipleBabies && revealData?.babiesInfo) {
      if (currentBabyIndex < revealData.babiesInfo.length - 1) {
        setIsRevealed(false);
        setCurrentBabyIndex(prev => prev + 1);
        setStartCountdown(true);
      } else {
        setIsFinished(true);
      }
    } else {
      setIsFinished(true);
    }
  };
  
  useEffect(() => {
    // 데모 모드인 경우
    if (demoId && demoId in demoExamples) {
      setRevealData(demoExamples[demoId as keyof typeof demoExamples]);
      setIsLoading(false);
      return;
    }
    
    // 일반 모드인 경우
    if (!token) {
      setError('토큰이 유효하지 않거나 누락되었습니다. URL을 확인하고 다시 시도해주세요.');
      setIsLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        // 서버 API를 통해 토큰 검증
        const response = await fetch('/api/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || '공개 데이터를 검증할 수 없습니다.');
          setIsLoading(false);
          return;
        }
        
        const { data } = await response.json();
        if (!data) {
          setError('공개 데이터를 해독할 수 없습니다. 링크가 만료되었거나 수정되었을 수 있습니다.');
          setIsLoading(false);
          return;
        }
        
        setRevealData(data as RevealData);
        setIsLoading(false);
      } catch (err) {
        setError('공개 데이터를 로드하는 동안 오류가 발생했습니다.');
        console.error(err);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [token, demoId]);
  
  const handleStartReveal = () => {
    setStartCountdown(true);
  };
  
  const handleCountdownComplete = () => {
    setIsRevealed(true);
  };
  
  const handleAnimationComplete = () => {
    if (isMultipleBabies && revealData?.babiesInfo) {
      // 다태아인 경우 다음 아기로 넘어가거나 종료
      if (currentBabyIndex < revealData.babiesInfo.length - 1) {
        goToNextBaby();
      } else {
        // 딜레이 후 종료 및 결과 영역으로 스크롤
        setTimeout(() => {
          setIsFinished(true);
          // 딜레이 후 결과 영역으로 스크롤
          setTimeout(() => {
            // 화면 상단으로 결과 영역이 오도록 scrollIntoView 대신 scrollTo 사용
            if (resultSectionRef.current) {
              const offsetTop = resultSectionRef.current.offsetTop - 80; // 상단 여백 증가
              window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
              });
            }
            // 결과 영역에 시각적 강조 효과 추가
            highlightResultSection();
          }, 500);
        }, 2000);
      }
    } else {
      // 단일 아기인 경우 딜레이 후 종료 및 결과 영역으로 스크롤
      setTimeout(() => {
        setIsFinished(true);
        // 딜레이 후 결과 영역으로 스크롤
        setTimeout(() => {
          // 화면 상단으로 결과 영역이 오도록 scrollIntoView 대신 scrollTo 사용
          if (resultSectionRef.current) {
            const offsetTop = resultSectionRef.current.offsetTop - 80; // 상단 여백 증가
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
          // 결과 영역에 시각적 강조 효과 추가
          highlightResultSection();
        }, 500);
      }, 2000);
    }
  };
  
  // 결과 영역 강조 효과 함수
  const highlightResultSection = () => {
    if (!resultSectionRef.current) return;
    
    // 스크롤 후 약간의 딜레이를 두고 강조 효과 추가
    setTimeout(() => {
      if (!resultSectionRef.current) return;
      
      // 결과 영역에 일시적인 강조 효과 클래스 추가
      resultSectionRef.current.classList.add('result-highlight');
      
      // 일정 시간 후 강조 효과 제거
      setTimeout(() => {
        if (!resultSectionRef.current) return;
        resultSectionRef.current.classList.remove('result-highlight');
      }, 1000);
    }, 600);
  };
  
  const handleRestart = () => {
    setStartCountdown(true);
    setIsRevealed(false);
    setIsFinished(false);
    setCurrentBabyIndex(0);
    // 애니메이션 컨테이너로 스크롤 이동
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorState error={error} />;
  }
  
  if (!revealData) {
    return null;
  }
  
  const { motherName, fatherName, dueDate, message, animationType, countdownTime } = revealData;
  const { name: currentBabyName, gender: currentGender } = getCurrentBaby();
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isDemo = demoId !== null;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* 결과 영역 강조 효과 스타일 */}
      <style jsx global>{`
        @keyframes result-pulse {
          0% { box-shadow: 0 0 0 0 rgba(148, 101, 200, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(148, 101, 200, 0); }
          100% { box-shadow: 0 0 0 0 rgba(148, 101, 200, 0); }
        }
        
        .result-highlight {
          animation: result-pulse 1s ease-in-out;
          border-radius: 0.5rem;
        }

        .animation-container {
          position: relative;
          z-index: 1;
        }
        
        .result-section {
          position: relative;
          z-index: 2;
        }
      `}</style>
      
      <main className="flex-1">
        {!startCountdown && (
          <RevealIntro 
            revealData={revealData}
            isDemo={isDemo}
            onStartReveal={handleStartReveal}
          />
        )}
        
        {startCountdown && !isFinished && (
          <RevealAnimation
            isRevealed={isRevealed}
            gender={currentGender}
            babyName={currentBabyName}
            animationType={animationType}
            countdownTime={countdownTime || 5}
            currentBabyIndex={isMultipleBabies ? currentBabyIndex : undefined}
            totalBabies={isMultipleBabies && revealData.babiesInfo ? revealData.babiesInfo.length : undefined}
            onCountdownComplete={handleCountdownComplete}
            onAnimationComplete={handleAnimationComplete}
          />
        )}
        
        {isFinished && (
          <RevealResults
            motherName={motherName}
            fatherName={fatherName}
            gender={isMultipleBabies ? undefined : currentGender}
            babiesInfo={isMultipleBabies ? revealData.babiesInfo : undefined}
            isMultipleBabies={!!isMultipleBabies}
            isDemo={isDemo}
            shareUrl={shareUrl}
            onRestart={handleRestart}
            resultSectionRef={resultSectionRef}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
}
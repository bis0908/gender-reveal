"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimationRenderer } from '@/components/animation-renderer';
import { CountdownTimer } from '@/components/countdown-timer';
import { SocialShare } from '@/components/social-share';
import { formatDate } from '@/lib/utils';
import type { RevealData, Gender } from '@/lib/types';
import { CalendarHeart, Baby } from 'lucide-react';
import { motion } from 'framer-motion';

// 기존 데모 예제와 다태아 데모 예제 합치기
const demoExamples = {
  "example1": {
    motherName: "지현",
    fatherName: "민준",
    babyName: "콩이",
    gender: "boy",
    dueDate: "2023-12-25",
    message: "우리 콩이가 드디어 성별을 알려드립니다! 함께 축하해주세요!",
    animationType: "confetti",
    countdownTime: 5
  },
  "example2": {
    motherName: "소연",
    fatherName: "준서",
    babyName: "콩콩이",
    gender: "girl",
    dueDate: "2023-11-15",
    message: "우리 콩콩이의 성별을 알려드려요. 많이 축하해주세요!",
    animationType: "balloons",
    countdownTime: 5
  },
  "example3": {
    motherName: "지은",
    fatherName: "도현", 
    babyName: "꼬맹이",
    gender: "boy",
    dueDate: "2023-10-10",
    message: "드디어 우리 꼬맹이의 성별을 알려드립니다!",
    animationType: "fireworks",
    countdownTime: 5
  },
  "example4": {
    motherName: "서연",
    fatherName: "재원",
    babyName: "애기",
    gender: "girl",
    dueDate: "2024-01-20",
    message: "우리 애기의 성별이 궁금하셨죠? 지금 확인하세요!",
    animationType: "falling",
    countdownTime: 5
  },
  "twins1": {
    motherName: "지현",
    fatherName: "민준",
    isMultiple: true,
    babiesInfo: [
      { name: "콩이", gender: "boy" },
      { name: "팥이", gender: "girl" }
    ],
    dueDate: "2023-12-25",
    message: "우리 콩이와 팥이가 드디어 성별을 알려드립니다! 함께 축하해주세요!",
    animationType: "confetti",
    countdownTime: 5
  },
  "triplets1": {
    motherName: "서연",
    fatherName: "준호",
    isMultiple: true,
    babiesInfo: [
      { name: "첫째", gender: "boy" },
      { name: "둘째", gender: "boy" },
      { name: "셋째", gender: "girl" }
    ],
    dueDate: "2024-02-15",
    message: "우리 세쌍둥이 성별을 공개합니다! 많은 축하 부탁드려요!",
    animationType: "fireworks",
    countdownTime: 5
  }
};

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
  const [currentBabyIndex, setCurrentBabyIndex] = useState(0); // 현재 표시 중인 아기 인덱스
  
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
      setRevealData(demoExamples[demoId as keyof typeof demoExamples] as unknown as RevealData);
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
          }, 300);
        }, 1000);
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
        }, 300);
      }, 1000);
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Gender Reveal 로딩 중...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
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
  
  if (!revealData) {
    return null;
  }
  
  const { motherName, fatherName, dueDate, message, animationType, countdownTime } = revealData;
  const { name: currentBabyName, gender: currentGender } = getCurrentBaby();
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isDemo = demoId !== null;
  
  // 모든 아기 성별 정보 (다태아 요약용)
  const getBabiesGenderSummary = () => {
    if (!isMultipleBabies || !revealData.babiesInfo) return "";
    
    const boysCount = revealData.babiesInfo.filter(baby => baby.gender === 'boy').length;
    const girlsCount = revealData.babiesInfo.filter(baby => baby.gender === 'girl').length;
    
    const parts = [];
    if (boysCount > 0) parts.push(`남자아이 ${boysCount}명`);
    if (girlsCount > 0) parts.push(`여자아이 ${girlsCount}명`);
    
    return parts.join(', ');
  };
  
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
      `}</style>
      
      <main className="flex-1">
        {!startCountdown && (
          <div className="container mx-auto py-10 px-4 max-w-4xl">
            {isDemo && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-yellow-700 font-medium">데모 모드 - 이것은 예시 Gender Reveal입니다</p>
              </div>
            )}
            
            <Card className="overflow-hidden mb-8">
              <div className="relative h-48 sm:h-64 bg-gradient-to-r from-baby-blue-light to-baby-pink-light flex items-center justify-center">
                <div className="absolute inset-0 opacity-30 bg-confetti-pattern" />
                <div className="relative z-10 text-center p-6">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                    {motherName} & {fatherName}의
                  </h1>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-2 bg-gradient-to-r from-baby-blue-dark to-baby-pink-dark bg-clip-text text-transparent">
                    Gender Reveal
                  </h2>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Baby className="text-gray-600" size={20} />
                      {isMultipleBabies && revealData.babiesInfo ? (
                        <div>
                          <span className="text-lg font-medium">
                            {revealData.babiesInfo.length}명의 아기
                          </span>
                          <div className="mt-1 text-sm text-gray-600">
                            {revealData.babiesInfo.map(baby => baby.name).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-lg font-medium">아기 {currentBabyName}</span>
                      )}
                    </div>
                    
                    {dueDate && (
                      <div className="flex items-center gap-2">
                        <CalendarHeart className="text-gray-600" size={20} />
                        <span>출산 예정일: {formatDate(dueDate)}</span>
                      </div>
                    )}
                    
                    {message && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg italic">
                        &quot;{message}&quot;
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center md:justify-end">
                    <Button 
                      size="lg"
                      onClick={handleStartReveal}
                      className="relative overflow-hidden group w-full md:w-auto"
                    >
                      <span className="relative z-10 whitespace-normal break-words text-center px-2">
                        🎉 {isMultipleBabies ? "우리 아이들" : `우리 ${currentBabyName}`}의 성별 공개 🎊
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-baby-blue to-baby-pink opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center space-y-4">
              <h3 className="text-xl font-medium">어떤 순서로 진행되나요?</h3>
              <p className="text-gray-600">
                {isMultipleBabies && revealData.babiesInfo ? (
                  `공개 버튼을 클릭하면 카운트다운이 시작되고, 그 후 ${revealData.babiesInfo.length}명의 아기들 성별을 알려주는 특별한 애니메이션이 차례로 나타납니다.`
                ) : (
                  `공개 버튼을 클릭하면 카운트다운이 시작되고, 그 후 아기 ${currentBabyName}의 성별을 알려주는 특별한 애니메이션이 나타납니다.`
                )}
              </p>
              <div className="pt-2">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center">
                    👦
                    <span className="text-baby-blue-dark font-medium">남자아이</span>
                  </div>
                  <span>또는</span>
                  <div className="flex items-center">
                    👧
                    <span className="text-baby-pink-dark font-medium">여자아이</span>
                  </div>
                  <span>?</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {startCountdown && (
          <div className="h-[calc(100vh-64px)] relative">
            {!isRevealed ? (
              <CountdownTimer 
                seconds={countdownTime || 5} 
                onComplete={handleCountdownComplete} 
                gender={currentGender}
                babyName={currentBabyName}
              />
            ) : (
              <div className="relative h-full">
                <AnimationRenderer 
                  gender={currentGender} 
                  animationType={animationType}
                  isRevealed={isRevealed}
                  onComplete={handleAnimationComplete}
                />
                
                {isMultipleBabies && (
                  <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
                    <p className="text-lg font-medium">
                      아기 {currentBabyIndex + 1}/{revealData.babiesInfo?.length}: {currentBabyName}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {isFinished && (
          <div ref={resultSectionRef} className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="relative mb-6">
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-baby-blue via-baby-neutral to-baby-pink rounded-full opacity-70" />
              
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8 text-center"
            >
              {isMultipleBabies && revealData.babiesInfo ? (
                <>
                  <h2 className="text-3xl font-bold mb-4">
                    {getBabiesGenderSummary()}입니다!
                  </h2>
                  <p className="text-gray-600">
                    {motherName}와(과) {fatherName}의 아기들: {getBabiesGenderSummary()}
                  </p>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
                  >
                    {revealData.babiesInfo.map((baby, index) => (
                      <motion.div 
                        key={`baby-${baby.name}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 * index }}
                        className={`p-4 rounded-lg shadow-sm border-2 ${
                          baby.gender === 'boy' ? 'border-baby-blue-light bg-baby-blue-light/10' : 'border-baby-pink-light bg-baby-pink-light/10'
                        }`}
                      >
                        <h3 className={`text-lg font-medium ${
                          baby.gender === 'boy' ? 'text-baby-blue-dark' : 'text-baby-pink-dark'
                        }`}>
                          {baby.name}
                        </h3>
                        <p className="text-gray-700">
                          {baby.gender === 'boy' ? '남자아이' : '여자아이'}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold mb-4">
                    {currentGender === 'boy' ? '남자아이' : '여자아이'}입니다!
                  </h2>
                  <p className="text-gray-600">
                    {motherName}와(과) {fatherName}의 {currentGender === 'boy' ? '남자아이' : '여자아이'}입니다!
                  </p>
                </>
              )}
            </motion.div>
            
            {!isDemo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <SocialShare 
                  url={shareUrl}
                  title={`${motherName}와(과) ${fatherName}의 Gender Reveal`}
                  motherName={motherName}
                  fatherName={fatherName}
                  gender={isMultipleBabies ? undefined : currentGender}
                  multipleBabies={isMultipleBabies ? revealData.babiesInfo : undefined}
                />
              </motion.div>
            )}
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-8 text-center space-y-6"
            >
              <Button 
                variant={currentGender === 'boy' ? 'boy' : 'girl'} 
                size="lg"
                onClick={() => {
                  setStartCountdown(true);
                  setIsRevealed(false);
                  setIsFinished(false);
                  setCurrentBabyIndex(0);
                  // 애니메이션 컨테이너로 스크롤 이동
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }}
              >
                다시 보기
              </Button>
              
              {isDemo && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-gray-600">
                    나만의 Gender Reveal을 만들고 싶으신가요?
                  </p>
                  <Button asChild>
                    <Link href="/create">내 Gender Reveal 만들기</Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
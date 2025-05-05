import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { SocialShare } from '@/components/social-share';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Gender, BabyInfo } from '@/lib/types';

interface RevealResultsProps {
  motherName: string;
  fatherName: string;
  gender?: Gender;
  babiesInfo?: BabyInfo[];
  isMultipleBabies: boolean;
  isDemo: boolean;
  shareUrl: string;
  onRestart: () => void;
  resultSectionRef: RefObject<HTMLDivElement>;
}

export function RevealResults({
  motherName,
  fatherName,
  gender,
  babiesInfo,
  isMultipleBabies,
  isDemo,
  shareUrl,
  onRestart,
  resultSectionRef
}: RevealResultsProps) {
  // 다태아 성별 요약 정보
  const getBabiesGenderSummary = () => {
    if (!isMultipleBabies || !babiesInfo) return "";
    
    const boysCount = babiesInfo.filter(baby => baby.gender === 'boy').length;
    const girlsCount = babiesInfo.filter(baby => baby.gender === 'girl').length;
    
    const parts = [];
    if (boysCount > 0) parts.push(`남자아이 ${boysCount}명`);
    if (girlsCount > 0) parts.push(`여자아이 ${girlsCount}명`);
    
    return parts.join(', ');
  };

  return (
    <div ref={resultSectionRef} className="container mx-auto py-10 px-4 max-w-4xl result-section">
      <div className="relative mb-6">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-baby-blue via-baby-neutral to-baby-pink rounded-full opacity-70" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8 text-center"
      >
        {isMultipleBabies && babiesInfo ? (
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
              {babiesInfo.map((baby, index) => (
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
              {gender === 'boy' ? '남자아이' : '여자아이'}입니다!
            </h2>
            <p className="text-gray-600">
              {motherName}와(과) {fatherName}의 {gender === 'boy' ? '남자아이' : '여자아이'}입니다!
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
            gender={isMultipleBabies ? undefined : gender}
            multipleBabies={isMultipleBabies ? babiesInfo : undefined}
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
          variant={gender === 'boy' ? 'boy' : 'girl'} 
          size="lg"
          onClick={onRestart}
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
  );
} 
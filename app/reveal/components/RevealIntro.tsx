import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Baby, CalendarHeart } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { RevealData } from '@/lib/types';

interface RevealIntroProps {
  revealData: RevealData;
  isDemo: boolean;
  onStartReveal: () => void;
}

export function RevealIntro({ revealData, isDemo, onStartReveal }: RevealIntroProps) {
  const { motherName, fatherName, babyName, dueDate, message, babiesInfo, isMultiple } = revealData;
  const isMultipleBabies = isMultiple && babiesInfo && babiesInfo.length > 1;

  return (
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
                {isMultipleBabies ? (
                  <div>
                    <span className="text-lg font-medium">
                      {babiesInfo.length}명의 아기
                    </span>
                    <div className="mt-1 text-sm text-gray-600">
                      {babiesInfo.map(baby => baby.name).join(', ')}
                    </div>
                  </div>
                ) : (
                  <span className="text-lg font-medium">아기 {babyName}</span>
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
                onClick={onStartReveal}
                className="relative overflow-hidden group w-full md:w-auto"
              >
                <span className="relative z-10 whitespace-normal break-words text-center px-2">
                  🎉 {isMultipleBabies ? "우리 아이들" : `우리 ${babyName}`}의 성별 공개 🎊
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
          {isMultipleBabies ? (
            `공개 버튼을 클릭하면 카운트다운이 시작되고, 그 후 ${babiesInfo.length}명의 아기들 성별을 알려주는 특별한 애니메이션이 차례로 나타납니다.`
          ) : (
            `공개 버튼을 클릭하면 카운트다운이 시작되고, 그 후 아기 ${babyName}의 성별을 알려주는 특별한 애니메이션이 나타납니다.`
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
  );
} 
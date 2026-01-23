"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { RevealForm } from '@/components/reveal-form';
import { FeedbackModal } from '@/components/feedback/feedback-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n/context';

export default function CreatePage() {
  const { t, isInitialized, isLoading } = useTranslation();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // 링크 생성 완료 시 3초 후 피드백 모달 표시
  const handleLinkGenerated = () => {
    setTimeout(() => {
      setShowFeedbackModal(true);
    }, 3000);
  };
  
  // 번역이 초기화되지 않았거나 로딩 중일 때 로딩 UI 표시
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-baby-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto max-w-4xl py-10 px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-baby-blue-dark to-baby-pink-dark bg-clip-text text-transparent">
            {t('create.title')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('create.subtitle', { 
              boyText: t('gender.boy'),
              girlText: t('gender.girl')
            })}
          </p>
        </div>
        
        <Card className="border-2 border-baby-blue-light/50 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-baby-blue-light/10 to-baby-pink-light/10">
            <CardTitle className="text-xl font-semibold">{t('create.cardTitle')}</CardTitle>
            <CardDescription>
              {t('create.cardDescription')}
            </CardDescription>
              <p className="text-xs text-red-500">{t('create.privacyNotice')}</p>
          </CardHeader>
          <CardContent>
            <RevealForm onLinkGenerated={handleLinkGenerated} />
          </CardContent>
        </Card>
      </div>

      <Footer />

      {/* 피드백 모달 */}
      <FeedbackModal
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
      />
    </main>
  );
}
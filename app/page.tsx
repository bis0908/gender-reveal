"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Baby, Sparkles, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useTranslation } from '@/lib/i18n/context';

export default function Home() {
  const { t, isInitialized, isLoading } = useTranslation();
  
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
      
      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-10 bg-confetti-pattern" />
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  {t('home.heroTitle')}{' '}
                  <span className="block bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent">
                    {t('home.heroSubtitle')}
                  </span> 
                  {t('home.heroSubtitleLine2')}
                </h1>
                
                <p className="text-lg text-gray-600 max-w-md">
                  {t('home.heroDescription')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="xl" asChild>
                    <Link href="/create">{t('home.createButton')}</Link>
                  </Button>
                  
                  <Button variant="outline" size="xl" asChild>
                    <Link href="/examples">{t('home.examplesButton')}</Link>
                  </Button>
                </div>
              </div>
              
              <div className="relative h-72 sm:h-96 md:h-[450px] rounded-xl overflow-hidden">
                <Image
                  src="images/gender_reveal_main.png"
                  alt="Gender Reveal 축하 장면"
                  fill
                  className="object-cover rounded-xl"
                  priority
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t('home.howToUseTitle')}</h2>
              {/* <p className="text-gray-600 max-w-2xl mx-auto">
                저희 플랫폼을 통해 몇 가지 간단한 단계로 특별한 순간을 쉽게 만들고 공유할 수 있습니다.
              </p> */}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="card-hover">
                <CardContent className="pt-6">
                  <div className="mb-5 h-12 w-12 rounded-full bg-baby-blue/20 flex items-center justify-center">
                    <Baby size={24} className="text-baby-blue-dark" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t('home.featureCreateTitle')}</h3>
                  <p className="text-gray-600">
                    {t('home.featureCreateDescription')}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardContent className="pt-6">
                  <div className="mb-5 h-12 w-12 rounded-full bg-baby-pink/20 flex items-center justify-center">
                    <Sparkles size={24} className="text-baby-pink-dark" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t('home.featureAnimationTitle')}</h3>
                  <p className="text-gray-600">
                    {t('home.featureAnimationDescription')}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardContent className="pt-6">
                  <div className="mb-5 h-12 w-12 rounded-full bg-baby-mint/20 flex items-center justify-center">
                    <Share2 size={24} className="text-baby-mint-dark" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t('home.featureShareTitle')}</h3>
                  <p className="text-gray-600">
                    {t('home.featureShareDescription')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Animation Showcase */}
        {/* <section className="py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Beautiful Reveal Animations</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose from a variety of delightful animations to make your gender reveal moment special.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="rounded-xl overflow-hidden aspect-w-16 aspect-h-9 relative group">
                <Image
                  src="https://images.pexels.com/photos/6608182/pexels-photo-6608182.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Confetti Animation"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <span className="text-white font-medium p-4">Confetti Explosion</span>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden aspect-w-16 aspect-h-9 relative group">
                <Image
                  src="https://images.pexels.com/photos/4823233/pexels-photo-4823233.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Balloons Animation"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <span className="text-white font-medium p-4">Balloon Release</span>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden aspect-w-16 aspect-h-9 relative group">
                <Image
                  src="https://images.pexels.com/photos/1387577/pexels-photo-1387577.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Fireworks Animation"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <span className="text-white font-medium p-4">Fireworks Display</span>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-10">
              <Button variant="outline" size="lg" asChild>
                <Link href="/create">See All Animation Options</Link>
              </Button>
            </div>
          </div>
        </section> */}
        
       
        
        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 relative">
          <div className="absolute inset-0 z-0 opacity-10 bg-confetti-pattern" />
          
          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold">{t('home.ctaTitle')}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('home.ctaDescription')}
              </p>
              
              <div className="pt-4">
                <Button size="xl" asChild>
                  <Link href="/create">{t('home.createButton')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  );
}
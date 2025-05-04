import Image from 'next/image';
import Link from 'next/link';
import { Baby, Sparkles, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function Home() {
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
                  설레는 
                  <span className="block bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent">
                    Gender Reveal
                  </span> 
                  소중한 사람들과 함께
                </h1>
                
                <p className="text-lg text-gray-600 max-w-md">
                  세상 어디에서나 친구와 가족들에게 공유할 수 있는 아름다운 온라인 Gender reveal 순간을 만들어보세요.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="xl" asChild>
                    <Link href="/create">Gender Reveal 만들기</Link>
                  </Button>
                  
                  <Button variant="outline" size="xl" asChild>
                    <Link href="/examples">예시 보기</Link>
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
              <h2 className="text-3xl font-bold mb-4">이용 방법</h2>
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
                  <h3 className="text-xl font-semibold mb-2">Gender Reveal 만들기</h3>
                  <p className="text-gray-600">
                    엄마 이름, 아빠 이름, 태명, 성별 등의 정보를 입력하세요.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardContent className="pt-6">
                  <div className="mb-5 h-12 w-12 rounded-full bg-baby-pink/20 flex items-center justify-center">
                    <Sparkles size={24} className="text-baby-pink-dark" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">애니메이션 선택</h3>
                  <p className="text-gray-600">
                    다양하고 아름다운 Gender Reveal 애니메이션 중 선택하고 카운트다운을 추가해보세요.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-hover">
                <CardContent className="pt-6">
                  <div className="mb-5 h-12 w-12 rounded-full bg-baby-mint/20 flex items-center justify-center">
                    <Share2 size={24} className="text-baby-mint-dark" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">가족과 공유하기</h3>
                  <p className="text-gray-600">
                    친구와 가족들에게 SNS로 공유할 수 있는 안전한 링크를 받으세요.
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
              <h2 className="text-3xl sm:text-4xl font-bold">특별한 순간을 공유할 준비가 되셨나요?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                몇 분 안에 Gender Reveal을 만들고 전 세계 친구와 가족들과 함께 설레는 순간을 공유해보세요.
              </p>
              
              <div className="pt-4">
                <Button size="xl" asChild>
                  <Link href="/create">Gender Reveal 만들기</Link>
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
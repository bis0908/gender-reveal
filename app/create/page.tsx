import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { RevealForm } from '@/components/reveal-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreatePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto max-w-4xl py-10 px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-baby-blue-dark to-baby-pink-dark bg-clip-text text-transparent">
            Gender Reveal 만들기
          </h1>
          <p className="text-gray-600 mt-2">
            아래 정보를 입력하여 <span className="font-medium text-baby-blue">아들</span> 또는 <span className="font-medium text-baby-pink">딸</span> 소식을 특별하게 알려보세요
          </p>
        </div>
        
        <Card className="border-2 border-baby-blue-light/50 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-baby-blue-light/10 to-baby-pink-light/10">
            <CardTitle className="text-xl font-semibold">Gender Reveal 정보</CardTitle>
            <CardDescription>
              가족 정보를 입력하고 공개 애니메이션을 선택하세요. 쌍둥이, 세쌍둥이 등 다태아 정보도 입력할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevealForm />
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </main>
  );
}
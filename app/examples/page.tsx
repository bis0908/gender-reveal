import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Baby, ChevronRight } from 'lucide-react';

// 예시 데이터
const examples = [
  {
    id: "example1",
    motherName: "지현",
    fatherName: "민준",
    babyName: "콩이",
    gender: "boy",
    image: "https://images.pexels.com/photos/3662449/pexels-photo-3662449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    animationType: "confetti",
    description: "파란색 색종이가 폭발하는 효과와 함께 귀여운 남자아이 Gender reveal",
  },
  {
    id: "example2",
    motherName: "소연",
    fatherName: "준서",
    babyName: "콩콩이",
    gender: "girl",
    image: "https://images.pexels.com/photos/3662667/pexels-photo-3662667.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    animationType: "balloons",
    description: "분홍색 풍선이 하늘로 날아오르는 효과와 함께하는 여자아이 Gender reveal",
  },
  {
    id: "example3",
    motherName: "지은",
    fatherName: "도현",
    babyName: "꼬맹이",
    gender: "boy",
    image: "https://images.pexels.com/photos/8474954/pexels-photo-8474954.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    animationType: "fireworks",
    description: "화려한 파란색 불꽃놀이가 터지는 멋진 남자아이 Gender reveal",
  },
  {
    id: "example4",
    motherName: "서연",
    fatherName: "재원",
    babyName: "애기",
    gender: "girl",
    image: "https://images.pexels.com/photos/3662835/pexels-photo-3662835.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    animationType: "falling",
    description: "분홍색 작은 아기 용품들이 내려오는 사랑스러운 여자아이 Gender reveal",
  },
];

export default function ExamplesPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1">
        {/* Hero Section */}
        <section className="py-12 px-4 sm:px-6 bg-gradient-to-r from-baby-blue-light/30 to-baby-pink-light/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold">Gender Reveal 예시</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                다른 부모님들이 만든 Gender Reveal 예시를 확인하고 영감을 얻어보세요.
                아래 예시들은 다양한 애니메이션과 스타일을 보여줍니다.
              </p>
            </div>
          </div>
        </section>
        
        {/* Examples Grid */}
        <section className="py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {examples.map((example) => (
                <Card key={example.id} className="overflow-hidden card-hover">
                  <div className="relative h-48 sm:h-60">
                    <Image
                      src={example.image}
                      alt={`${example.motherName}와 ${example.fatherName}의 Gender Reveal`}
                      fill
                      className="object-cover"
                    />
                    <div className={`absolute top-4 right-4 p-2 rounded-full ${
                        example.gender === 'boy' 
                        ? 'bg-baby-blue text-white' 
                        : 'bg-baby-pink text-white'
                      }`}
                    >
                      <Baby size={20} />
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-2">
                      {example.motherName} & {example.fatherName}의 Gender Reveal
                    </h2>
                    <p className="text-gray-500 mb-4 text-sm">
                      아기 {example.babyName} • {example.gender === 'boy' ? '남자아이' : '여자아이'} • {
                        example.animationType === 'confetti' ? '색종이' : 
                        example.animationType === 'balloons' ? '풍선' :
                        example.animationType === 'fireworks' ? '불꽃놀이' : '떨어지는 아이템'
                      }
                    </p>
                    <p className="text-gray-600 mb-4">
                      {example.description}
                    </p>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/reveal?demo=${example.id}`}>
                          예시 보기 <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">나만의 Gender Reveal 만들기</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              몇 분 안에 나만의 특별한 Gender Reveal을 만들고 전 세계 어디에서나 사랑하는 가족, 친구들과 함께 이 특별한 순간을 공유해보세요.
            </p>
            <Button size="lg" asChild>
              <Link href="/create">Gender Reveal 만들기</Link>
            </Button>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  );
} 
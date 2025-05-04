import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full bg-white bg-opacity-90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100 px-4 sm:px-6">
      <div className="container mx-auto flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/images/logo.svg" 
            alt="Gender Reveal 로고" 
            width={40} 
            height={40} 
            className="animate-float"
          />
          <span className="font-bold text-xl hidden sm:inline-block bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent">
            Gender Reveal
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
            홈
          </Link>
          <Link href="/create" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
            Gender Reveal 만들기
          </Link>
          <Link href="/examples" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
            예시
          </Link>
          <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
            소개
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
            <Heart size={16} className="text-baby-pink" />
            <span>공유하기</span>
          </Button>
          <Button variant="default" size="sm">
            <Link href="/create">Gender Reveal 만들기</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
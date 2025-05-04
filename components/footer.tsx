import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 px-4 sm:px-6 mt-16">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image 
                src="/images/logo.svg" 
                alt="Gender reveal 로고" 
                width={40} 
                height={40} 
              />
              <span className="font-bold text-xl bg-gradient-to-r from-baby-blue to-baby-pink bg-clip-text text-transparent">
                Gender Reveal
              </span>
            </div>
            <p className="text-sm text-gray-600 max-w-xs">
              소중한 사람들과 공유할 수 있는 우리 아기 Gender reveal 순간을 만드세요.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Heart size={16} className="text-baby-pink" /> 예비 부모님들을 위해 정성을 담아 만들었습니다
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-600 hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/create" className="text-gray-600 hover:text-primary transition-colors">Create Gender Reveal</Link></li>
              <li><Link href="/examples" className="text-gray-600 hover:text-primary transition-colors">Examples</Link></li>
              <li><Link href="/about" className="text-gray-600 hover:text-primary transition-colors">About</Link></li>
            </ul>
          </div>
          
          {/* <div>
            <h4 className="font-medium text-sm mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="text-gray-600 hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/privacy" className="text-gray-600 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-600 hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="text-gray-600 hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div> */}
          
          
        </div>
        
        <div className="border-t border-gray-100 mt-8 pt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} HarborcatSoft. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
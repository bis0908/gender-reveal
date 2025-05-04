import { NextResponse } from 'next/server';
import * as jose from 'jose';
import type { RevealData } from '@/lib/types';
import { getEncodedSecret } from '@/lib/env';

// 환경 변수에서 인코딩된 비밀 키 가져오기
const JWT_SECRET = getEncodedSecret();

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: '토큰이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    try {
      // JWT 토큰 검증
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      
      // 페이로드를 RevealData 타입으로 변환
      return NextResponse.json({ data: payload });
    } catch (verifyError) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 토큰입니다.' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: '토큰 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 
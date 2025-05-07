import { NextResponse } from 'next/server';
import * as jose from 'jose';
import type { Gender, AnimationType, BabyInfo } from '@/lib/types';
import { getEncodedSecret, JWT_EXPIRATION } from '@/lib/env';

// 환경 변수에서 인코딩된 비밀 키 가져오기
const JWT_SECRET = getEncodedSecret();

// 클라이언트에서 받을 데이터 타입 정의 (단일 아기)
interface SingleBabyRequest {
  motherName: string;
  fatherName: string;
  babyName: string;
  gender: Gender;
  dueDate?: string;
  message?: string;
  animationType: AnimationType;
  countdownTime: number;
  isMultiple: false;
}

// 클라이언트에서 받을 데이터 타입 정의 (다태아)
interface MultipleBabiesRequest {
  motherName: string;
  fatherName: string;
  dueDate?: string;
  message?: string;
  animationType: AnimationType;
  countdownTime: number;
  isMultiple: true;
  babiesInfo: BabyInfo[];
}

// 통합 요청 타입
type RevealRequest = SingleBabyRequest | MultipleBabiesRequest;

export async function POST(request: Request) {
  
  try {
    // 요청 본문 텍스트 확인
    const requestText = await request.text();
    
    // 빈 요청 처리
    if (!requestText || requestText.trim() === '') {
      return NextResponse.json({ error: '요청 본문이 비어있습니다.' }, { status: 400 });
    }
    
    // 요청 데이터 파싱
    let data: RevealRequest;
    try {
      data = JSON.parse(requestText) as RevealRequest;
    } catch (parseError) {
      console.error('[ERROR:API] 요청 본문 파싱 오류:', parseError);
      return NextResponse.json({ error: '잘못된 JSON 형식입니다.' }, { status: 400 });
    }
    
    
    // 필수 필드 검증
    if (!data.motherName || !data.fatherName || !data.animationType) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }
    
    // 다태아 여부에 따라 추가 검증
    if (data.isMultiple) {
      if (!data.babiesInfo || data.babiesInfo.length < 2) {
        return NextResponse.json(
          { error: '다태아 정보가 올바르지 않습니다. 최소 2명 이상의 아기 정보가 필요합니다.' },
          { status: 400 }
        );
      }
    } else {
      if (!data.babyName || !data.gender) {
        return NextResponse.json(
          { error: '아기 이름과 성별 정보가 필요합니다.' },
          { status: 400 }
        );
      }
    }
    
    // 토큰에 포함할 최소 데이터 구성 (유형에 따라 다름)
    const tokenData = {
      motherName: data.motherName,
      fatherName: data.fatherName,
      animationType: data.animationType,
      countdownTime: data.countdownTime || 5,
      isMultiple: data.isMultiple,
      ...(data.dueDate && { dueDate: data.dueDate }),
      ...(data.message && { message: data.message }),
      ...(data.isMultiple 
        ? { babiesInfo: data.babiesInfo } 
        : { babyName: data.babyName, gender: data.gender }
      )
    };
    
    
    try {
      // JWT 토큰 생성 (환경 변수에서 만료 시간 설정)
      const token = await new jose.SignJWT(tokenData as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRATION)
        .sign(JWT_SECRET);
      
      
      // 토큰 반환 (NextResponse.json 사용)
      return NextResponse.json({ token, success: true });
    } catch (jwtError) {
      console.error('[ERROR:API] JWT 생성 오류:', jwtError);
      return NextResponse.json({ error: 'JWT 토큰 생성 오류가 발생했습니다.', success: false }, { status: 500 });
    }
  } catch (error) {
    console.error('[ERROR:API] 토큰 생성 오류:', error);
    return NextResponse.json({ error: '토큰 생성 중 오류가 발생했습니다.', success: false }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import * as jose from 'jose';
import type { Gender, AnimationType, BabyInfo } from '@/lib/types';
import { getEncodedSecret, JWT_EXPIRATION } from '@/lib/env.server';
import { logger } from '@/lib/logger';
import { createBadRequestError, createJWTError, createValidationError } from '@/lib/errors';
import { parseRequestBody, validateRequiredFields } from '@/lib/api-utils';

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
    // 요청 본문 파싱
    const data = await parseRequestBody<RevealRequest>(request);

    // 공통 필수 필드 검증
    validateRequiredFields(data, ['motherName', 'fatherName', 'animationType']);

    // 다태아 여부에 따라 추가 검증
    if (data.isMultiple) {
      if (!data.babiesInfo || data.babiesInfo.length < 2) {
        logger.warn('다태아 정보 부족', {
          endpoint: '/api/generate-token',
          babiesCount: data.babiesInfo?.length || 0
        });
        throw createValidationError(
          '다태아 정보가 올바르지 않습니다. 최소 2명 이상의 아기 정보가 필요합니다.'
        );
      }
    } else {
      if (!data.babyName || !data.gender) {
        logger.warn('단태아 정보 누락', {
          endpoint: '/api/generate-token'
        });
        throw createValidationError('아기 이름과 성별 정보가 필요합니다.');
      }
    }

    // 토큰에 포함할 데이터 구성
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
      // JWT 토큰 생성 (비밀키는 함수 실행 시점에 가져옴)
      const JWT_SECRET = getEncodedSecret();
      const token = await new jose.SignJWT(tokenData as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRATION)
        .sign(JWT_SECRET);

      logger.info('토큰 생성 성공', {
        endpoint: '/api/generate-token',
        isMultiple: data.isMultiple
      });

      return NextResponse.json({ token, success: true });
    } catch (jwtError) {
      logger.error(
        'JWT 토큰 생성 실패',
        { endpoint: '/api/generate-token' },
        jwtError instanceof Error ? jwtError : new Error('Unknown JWT error')
      );
      throw createJWTError('토큰 생성에 실패했습니다.');
    }
  } catch (error) {
    // 에러가 AppError인 경우 그대로 던지기
    if (error instanceof Error && error.name === 'AppError') {
      throw error;
    }

    logger.error(
      '토큰 생성 중 예상치 못한 오류',
      { endpoint: '/api/generate-token' },
      error instanceof Error ? error : new Error('Unknown error')
    );

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', success: false },
      { status: 500 }
    );
  }
}

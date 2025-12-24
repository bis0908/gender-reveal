import { NextResponse } from 'next/server';
import * as jose from 'jose';
import type { RevealData } from '@/lib/types';
import { getEncodedSecret } from '@/lib/env.server';
import { logger } from '@/lib/logger';
import { createBadRequestError, createUnauthorizedError, createJWTError } from '@/lib/errors';
import { parseRequestBody } from '@/lib/api-utils';

interface VerifyTokenRequest {
  token: string;
}

export async function POST(request: Request) {
  try {
    // 요청 본문 파싱
    const { token } = await parseRequestBody<VerifyTokenRequest>(request);

    if (!token) {
      logger.warn('토큰 누락', { endpoint: '/api/verify-token' });
      throw createBadRequestError('토큰이 제공되지 않았습니다.');
    }

    try {
      // JWT 토큰 검증 (비밀키는 함수 실행 시점에 가져옴)
      const JWT_SECRET = getEncodedSecret();
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);

      logger.info('토큰 검증 성공', {
        endpoint: '/api/verify-token',
        isMultiple: payload.isMultiple
      });

      // 페이로드를 RevealData 타입으로 변환
      return NextResponse.json({ data: payload });
    } catch (verifyError) {
      logger.warn('토큰 검증 실패', {
        endpoint: '/api/verify-token',
        error: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      });
      throw createUnauthorizedError('유효하지 않거나 만료된 토큰입니다.');
    }
  } catch (error) {
    // 에러가 AppError인 경우 그대로 던지기
    if (error instanceof Error && error.name === 'AppError') {
      throw error;
    }

    logger.error(
      '토큰 검증 중 예상치 못한 오류',
      { endpoint: '/api/verify-token' },
      error instanceof Error ? error : new Error('Unknown error')
    );

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

import type { RevealData } from '@/lib/types';
import jwt from 'jsonwebtoken';

// 샘플 데이터 객체 정의
const sampleData: RevealData = {
  motherName: '김민지',
  fatherName: '이준호',
  babyName: '이하늘',
  gender: 'boy',
  animationType: 'confetti',
  dueDate: '2024-12-25',
  message: '우리 가족의 새로운 시작을 축하해주세요!'
};

// 테스트용 비밀키
const TEST_SECRET = 'gender-reveal-secret-key-2025';

describe('토큰 관련 기능 테스트', () => {
  // 토큰 생성 테스트
  test('JWT로 데이터를 암호화하여 토큰 생성', async () => {
    // when: 샘플 데이터로 토큰 생성
    const token = jwt.sign(sampleData, TEST_SECRET, { expiresIn: '7d' });
    
    // then: 토큰이 문자열이며 비어있지 않아야 함
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    
    // then: JWT 형식 검증 (header.payload.signature)
    expect(token.split('.').length).toBe(3);
  });

  // 토큰 복호화 테스트
  test('JWT로 토큰에서 원본 데이터 복원', async () => {
    // given: 샘플 데이터를 암호화한 토큰
    const token = jwt.sign(sampleData, TEST_SECRET);
    
    // when: 토큰 복호화
    const decryptedData = jwt.verify(token, TEST_SECRET) as RevealData;
    
    // then: 복호화된 데이터가 원본과 일치하는지 확인
    expect(decryptedData).toBeDefined();
    expect(decryptedData.motherName).toBe(sampleData.motherName);
    expect(decryptedData.fatherName).toBe(sampleData.fatherName);
    expect(decryptedData.babyName).toBe(sampleData.babyName);
    expect(decryptedData.gender).toBe(sampleData.gender);
  });

  // 만료된 토큰 테스트 (토큰이 만료되면 예외 발생)
  test('만료된 토큰은 예외를 발생시켜야 함', async () => {
    // given: 직접 만료된 토큰 생성
    const expiredToken = jwt.sign(sampleData, TEST_SECRET, { expiresIn: '1ms' });
    
    // 잠시 대기하여 토큰이 확실히 만료되도록 함
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // when & then: 만료된 토큰 검증 시도 시 예외 발생
    expect(() => {
      jwt.verify(expiredToken, TEST_SECRET);
    }).toThrow('jwt expired');
  });

  // 잘못된 형식의 토큰 테스트
  test('잘못된 형식의 토큰은 예외를 발생시켜야 함', async () => {
    // given: 유효하지 않은 토큰
    const invalidToken = 'invalid.token.format';
    
    // when & then: 유효하지 않은 토큰 검증 시도 시 예외 발생
    expect(() => {
      jwt.verify(invalidToken, TEST_SECRET);
    }).toThrow();
  });
}); 
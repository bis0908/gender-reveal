#!/usr/bin/env node

/**
 * 안전한 JWT 비밀 키 생성 스크립트
 * 
 * 사용법:
 * node scripts/generate-secret.js
 * 
 * 출력:
 * 새로 생성된 보안 비밀 키
 */

const crypto = require('node:crypto');

// 64바이트(512비트) 길이의 랜덤 바이트 생성
const randomBytes = crypto.randomBytes(64);

// Base64 형식으로 인코딩
const base64Secret = randomBytes.toString('base64');

console.warn('\n===== JWT_SECRET for .env.local =====\n');
console.warn(`JWT_SECRET=${base64Secret}`);
console.warn('\n=====================================\n');
console.warn('이 값을 .env.local 파일에 복사하여 사용하세요.');
console.warn('주의: 이 비밀 키는 매우 중요합니다. 절대 공개하지 마세요!');
console.warn('      프로덕션 환경에서는 환경 변수로 안전하게 관리하세요.'); 
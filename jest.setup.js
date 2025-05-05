// jest-dom을 추가하여 DOM 노드에 대한 사용자 정의 matcher를 사용할 수 있습니다.
require('@testing-library/jest-dom');

// Node.js 환경에서 TextEncoder/TextDecoder 사용 가능하도록 설정
// (jose 라이브러리에서 필요함)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('node:util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Next.js 관련 모킹 설정
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}));

// Request 전역 정의 (Next.js API 테스트용)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.input = input;
      this.init = init;
    }
    async json() {
      return this.init?.body || {};
    }
    async text() {
      const body = this.init?.body;
      return typeof body === 'string' ? body : JSON.stringify(body || {});
    }
    get headers() {
      return this.init?.headers || {};
    }
    get method() {
      return this.init?.method || 'GET';
    }
    get url() {
      return typeof this.input === 'string' ? this.input : this.input.url;
    }
  };
}

// 환경 변수 설정
process.env.JWT_SECRET = 'test-secret-key-for-jest-tests';
process.env.JWT_EXPIRATION = '7d';

// lib/env.ts 모킹 설정
jest.mock('@/lib/env', () => ({
  getEncodedSecret: () => {
    const JWT_SECRET_KEY = process.env.JWT_SECRET || 'test-secret-key-for-jest-tests';
    return new TextEncoder().encode(JWT_SECRET_KEY);
  },
  JWT_EXPIRATION: '7d',
}));

// API 응답 모킹 설정
global.Response = jest.fn().mockImplementation((body, init) => {
  return {
    status: init?.status || 200,
    json: async () => {
      if (typeof body === 'string') {
        return JSON.parse(body);
      }
      return body;
    },
  };
});

// 각 테스트 이후 모킹 초기화
afterEach(() => {
  jest.clearAllMocks();
}); 
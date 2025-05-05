const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Next.js 애플리케이션의 경로를 지정합니다.
  dir: './',
});

// Jest에 전달할 사용자 정의 설정
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // 경로 별칭 처리
    '^@/(.*)$': '<rootDir>/$1',
    '^jose$': '<rootDir>/node_modules/jose/dist/node/cjs/index.js',
    '^jose/(.*)$': '<rootDir>/node_modules/jose/dist/node/cjs/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  // 테스트 디렉토리 및 파일 패턴 지정
  testMatch: [
    '**/tests/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  // ES 모듈을 사용하는 node_modules를 처리하기 위한 설정
  transformIgnorePatterns: [
    'node_modules/(?!(jose|next|@jose)/)'
  ],
  // 커버리지 설정 추가
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    'app/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};

// createJestConfig는 Next.js 구성을 사용하여 설정을 내보냅니다.
module.exports = createJestConfig(customJestConfig); 
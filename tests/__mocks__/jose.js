// jose 라이브러리를 Jest에서 사용하기 위한 CommonJS 호환 mock

// jose SignJWT 클래스 모킹
class SignJWT {
  constructor(payload) {
    this.payload = payload;
    this.header = {};
    this.expirationTime = null;
    this.issuedAt = null;
  }

  setProtectedHeader(header) {
    this.header = header;
    return this;
  }

  setIssuedAt() {
    this.issuedAt = Math.floor(Date.now() / 1000);
    return this;
  }

  setExpirationTime(exp) {
    this.expirationTime = exp;
    return this;
  }

  async sign(secret) {
    // 간단한 JWT 형태로 시뮬레이션 (실제로는 jose 내부 로직 사용)
    const header = Buffer.from(JSON.stringify(this.header)).toString('base64url');
    
    const payload = { 
      ...this.payload,
      ...(this.issuedAt && { iat: this.issuedAt }),
      ...(this.expirationTime && { exp: this.calculateExp(this.expirationTime) })
    };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    // 간단한 서명 시뮬레이션
    const signature = Buffer.from(`signature-${Date.now()}`).toString('base64url');
    
    return `${header}.${payloadStr}.${signature}`;
  }

  calculateExp(expTime) {
    if (typeof expTime === 'string') {
      const now = Math.floor(Date.now() / 1000);
      if (expTime.endsWith('d')) {
        return now + parseInt(expTime) * 24 * 60 * 60;
      } else if (expTime.endsWith('ms')) {
        const ms = parseInt(expTime);
        // 1ms와 같은 매우 짧은 시간의 경우 바로 과거 시간으로 설정
        return now + (ms / 1000) - 1; // 1초 빼서 확실히 만료되도록
      }
      return now + parseInt(expTime);
    }
    return expTime;
  }
}

// jose jwtVerify 함수 모킹
async function jwtVerify(jwt, secret) {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('JWTInvalid');
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // 만료 시간 체크
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      const error = new Error('JWTExpired');
      error.code = 'ERR_JWT_EXPIRED';
      throw error;
    }
    
    return { payload };
  } catch (error) {
    if (error.message === 'JWTExpired' || error.code === 'ERR_JWT_EXPIRED') {
      throw error;
    }
    const jwtError = new Error('JWTInvalid');
    jwtError.code = 'ERR_JWT_INVALID';
    throw jwtError;
  }
}

// jose decodeJwt 함수 모킹
function decodeJwt(jwt) {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
}

module.exports = {
  SignJWT,
  jwtVerify,
  decodeJwt
};
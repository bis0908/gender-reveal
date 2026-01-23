const { createClient } = require("redis");
const fs = require("fs");
const path = require("path");

// .env 파일 파싱 함수
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  });
  return env;
}

// 환경 변수 로드 우선순위: .env.local > .env
const envLocal = loadEnv(path.join(__dirname, "../.env.local"));
const env = loadEnv(path.join(__dirname, "../.env"));
const processEnv = { ...env, ...envLocal };

const REDIS_URL = process.env.REDIS_URL || processEnv.REDIS_URL;

if (!REDIS_URL) {
  console.error("❌ 오류: REDIS_URL 환경변수가 설정되지 않았습니다.");
  console.log("   .env.local 또는 .env 파일에 REDIS_URL을 설정해주세요.");
  process.exit(1);
}

console.log(
  `📡 Redis 연결 시도 중... (${REDIS_URL.replace(/:[^:@]+@/, ":****@")})`,
);

async function checkConnection() {
  const client = createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: 5000,
    },
  });

  client.on("error", (err) => {
    console.error("❌ Redis Client Error:", err);
  });

  try {
    await client.connect();
    console.log("✅ Redis 연결 성공!");

    const pong = await client.ping();
    console.log(`🏓 PING 응답: ${pong}`);

    const info = await client.info("memory");
    const usedMemory =
      info.match(/used_memory_human:(\w+\.\w+)/)?.[1] || "unknown";
    console.log(`📊 메모리 사용량: ${usedMemory}`);

    await client.quit();
    console.log("🔌 연결 종료");
  } catch (error) {
    console.error("🚫 연결 실패:", error.message);
    process.exit(1);
  }
}

checkConnection();

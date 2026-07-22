import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let metricsSupabaseClient: SupabaseClient | null = null;

function readMetricsSupabaseConfig(): {
  url: string;
  secretKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error("Supabase 메트릭 환경 변수가 설정되지 않았습니다.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Supabase 메트릭 URL 형식이 올바르지 않습니다.");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Supabase 메트릭 URL은 HTTPS를 사용해야 합니다.");
  }

  return { url, secretKey };
}

export function getMetricsSupabaseClient(): SupabaseClient {
  if (metricsSupabaseClient) {
    return metricsSupabaseClient;
  }

  const { url, secretKey } = readMetricsSupabaseConfig();
  metricsSupabaseClient = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return metricsSupabaseClient;
}

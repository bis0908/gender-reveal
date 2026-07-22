export interface SupabaseAuthConfig {
  url: string;
  publishableKey: string;
}

export function getSupabaseAuthConfig(): SupabaseAuthConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error("Supabase 인증 환경 변수가 설정되지 않았습니다.");
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new Error("지원하지 않는 프로토콜입니다.");
    }
  } catch {
    throw new Error("Supabase 인증 URL 형식이 올바르지 않습니다.");
  }

  return { url, publishableKey };
}

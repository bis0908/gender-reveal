/** @jest-environment node */

jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

describe("서버 전용 Supabase 메트릭 클라이언트", () => {
  test("Given 환경 변수가 없는 모듈 로드일 때 When 최초 사용 전후를 비교하면 Then 로드는 성공하고 사용 시점에만 검증한다", async () => {
    // Given
    jest.resetModules();
    const replacedEnv = jest.replaceProperty(process, "env", {
      NODE_ENV: "test",
    });

    try {
      // When
      const clientModule = await import("@/lib/metrics-supabase-client.server");

      // Then
      expect(() => clientModule.getMetricsSupabaseClient()).toThrow(
        "Supabase 메트릭 환경 변수가 설정되지 않았습니다.",
      );

      // Given
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.SUPABASE_SECRET_KEY = "server-secret-value";
      const supabaseModule = await import("@supabase/supabase-js");
      const fakeClient = { from: jest.fn() };
      jest
        .mocked(supabaseModule.createClient)
        .mockReturnValue(fakeClient as never);

      // When
      const firstClient = clientModule.getMetricsSupabaseClient();
      const secondClient = clientModule.getMetricsSupabaseClient();

      // Then
      expect(firstClient).toBe(fakeClient);
      expect(secondClient).toBe(fakeClient);
      expect(supabaseModule.createClient).toHaveBeenCalledTimes(1);
      expect(supabaseModule.createClient).toHaveBeenCalledWith(
        "https://example.supabase.co",
        "server-secret-value",
        {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
        },
      );
    } finally {
      replacedEnv.restore();
    }
  });

  test("Given HTTP Supabase URL일 때 When secret 메트릭 클라이언트를 만들면 Then 전송 구간 보호를 위해 거부한다", async () => {
    // Given
    jest.resetModules();
    const replacedEnv = jest.replaceProperty(process, "env", {
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: "http://example.supabase.co",
      SUPABASE_SECRET_KEY: "server-secret-value",
    });

    try {
      const clientModule = await import("@/lib/metrics-supabase-client.server");

      // When / Then
      expect(() => clientModule.getMetricsSupabaseClient()).toThrow(
        "Supabase 메트릭 URL은 HTTPS를 사용해야 합니다.",
      );
      const supabaseModule = await import("@supabase/supabase-js");
      expect(supabaseModule.createClient).not.toHaveBeenCalled();
    } finally {
      replacedEnv.restore();
    }
  });
});

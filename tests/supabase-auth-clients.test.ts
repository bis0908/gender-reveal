/** @jest-environment node */

jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(),
  createServerClient: jest.fn(),
}));
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

describe("Supabase SSR 인증 클라이언트", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test("Given publishable key와 서버 secret이 함께 있을 때 When 브라우저 클라이언트를 만들면 Then publishable key만 사용하고 싱글톤을 재사용한다", async () => {
    // Given
    const replacedEnv = jest.replaceProperty(process, "env", {
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      SUPABASE_SECRET_KEY: "server-secret-must-not-be-used",
    });

    try {
      const ssrModule = await import("@supabase/ssr");
      const fakeClient = { auth: {} };
      jest
        .mocked(ssrModule.createBrowserClient)
        .mockReturnValue(fakeClient as never);
      const clientModule = await import("@/lib/supabase/client");

      // When
      const first = clientModule.createBrowserAuthClient();
      const second = clientModule.createBrowserAuthClient();

      // Then
      expect(first).toBe(fakeClient);
      expect(second).toBe(fakeClient);
      expect(ssrModule.createBrowserClient).toHaveBeenCalledTimes(1);
      expect(ssrModule.createBrowserClient).toHaveBeenCalledWith(
        "https://example.supabase.co",
        "publishable-key",
      );
      expect(
        JSON.stringify(jest.mocked(ssrModule.createBrowserClient).mock.calls),
      ).not.toContain("server-secret-must-not-be-used");
    } finally {
      replacedEnv.restore();
    }
  });

  test("Given 요청별 쿠키 저장소가 있을 때 When 서버 인증 클라이언트를 만들면 Then 매 요청 새 클라이언트와 getAll/setAll을 연결한다", async () => {
    // Given
    const replacedEnv = jest.replaceProperty(process, "env", {
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      SUPABASE_SECRET_KEY: "server-secret-must-not-be-used",
    });

    try {
      const cookieStore = {
        getAll: jest.fn(() => [{ name: "sb-session", value: "old" }]),
        set: jest.fn(),
      };
      const headersModule = await import("next/headers");
      jest
        .mocked(headersModule.cookies)
        .mockResolvedValue(cookieStore as never);
      const ssrModule = await import("@supabase/ssr");
      const createServerClientMock =
        ssrModule.createServerClient as unknown as jest.Mock;
      const firstClient = { auth: { getUser: jest.fn() } };
      const secondClient = { auth: { getUser: jest.fn() } };
      jest
        .mocked(ssrModule.createServerClient)
        .mockReturnValueOnce(firstClient as never)
        .mockReturnValueOnce(secondClient as never);
      const serverModule = await import("@/lib/supabase/server");

      // When
      const first = await serverModule.createServerAuthClient();
      const second = await serverModule.createServerAuthClient();

      // Then
      expect(first).toBe(firstClient);
      expect(second).toBe(secondClient);
      expect(ssrModule.createServerClient).toHaveBeenCalledTimes(2);
      expect(createServerClientMock.mock.calls[0][0]).toBe(
        "https://example.supabase.co",
      );
      expect(createServerClientMock.mock.calls[0][1]).toBe("publishable-key");
      expect(headersModule.cookies).toHaveBeenCalledTimes(2);

      const options = createServerClientMock.mock.calls[0][2] as {
        cookies: {
          getAll: () => unknown;
          setAll: (
            values: Array<{
              name: string;
              value: string;
              options: { httpOnly: boolean };
            }>,
            headers: Record<string, string>,
          ) => Promise<void> | void;
        };
      };
      expect(options.cookies.getAll()).toEqual([
        { name: "sb-session", value: "old" },
      ]);
      await options.cookies.setAll(
        [
          {
            name: "sb-session",
            value: "new",
            options: { httpOnly: true },
          },
        ],
        { "Cache-Control": "private, no-store" },
      );
      expect(cookieStore.set).toHaveBeenCalledWith("sb-session", "new", {
        httpOnly: true,
      });
      expect(JSON.stringify(createServerClientMock.mock.calls)).not.toContain(
        "server-secret-must-not-be-used",
      );
    } finally {
      replacedEnv.restore();
    }
  });

  test("Given 인증 환경 변수가 없을 때 When 모듈만 불러오면 Then 성공하고 최초 클라이언트 생성 시 정제된 설정 오류를 낸다", async () => {
    // Given
    const replacedEnv = jest.replaceProperty(process, "env", {
      NODE_ENV: "test",
    });

    try {
      // When
      const clientModule = await import("@/lib/supabase/client");
      const serverModule = await import("@/lib/supabase/server");

      // Then
      expect(() => clientModule.createBrowserAuthClient()).toThrow(
        "Supabase 인증 환경 변수가 설정되지 않았습니다.",
      );
      await expect(serverModule.createServerAuthClient()).rejects.toThrow(
        "Supabase 인증 환경 변수가 설정되지 않았습니다.",
      );
    } finally {
      replacedEnv.restore();
    }
  });
});

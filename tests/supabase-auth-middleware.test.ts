/** @jest-environment node */

import { createServerClient } from "@supabase/ssr";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { config } from "@/middleware";

const nextResponseNext = jest.fn();
const mockedCreateServerClient = createServerClient as unknown as jest.Mock;

interface MockServerClientOptions {
  cookies: {
    getAll: () => unknown;
    setAll: (
      values: Array<{
        name: string;
        value: string;
        options: Record<string, unknown>;
      }>,
      headers: Record<string, string>,
    ) => Promise<void> | void;
  };
}

jest.mock("next/server", () => ({
  NextResponse: {
    next: (...args: unknown[]) => nextResponseNext(...args),
  },
}));
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

function createResponse() {
  return {
    cookies: { set: jest.fn() },
    headers: new Headers(),
  };
}

describe("Supabase 관리자 세션 미들웨어", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextResponseNext.mockImplementation(() => createResponse());
  });

  test("Given 관리자 경로 요청에서 세션이 갱신될 때 When 미들웨어를 실행하면 Then getUser·양방향 쿠키·SSR cache headers를 모두 적용한다", async () => {
    // Given
    const replacedEnv = jest.replaceProperty(process, "env", {
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      SUPABASE_SECRET_KEY: "server-secret-must-not-be-used",
    });
    const request = {
      cookies: {
        getAll: jest.fn(() => [{ name: "sb-session", value: "old" }]),
        set: jest.fn(),
      },
    };
    const getUser = jest.fn();

    try {
      mockedCreateServerClient.mockImplementation(
        (_url: string, _key: string, options: MockServerClientOptions) => {
          getUser.mockImplementation(async () => {
            options.cookies.getAll();
            await options.cookies.setAll(
              [
                {
                  name: "sb-session",
                  value: "new",
                  options: { httpOnly: true, sameSite: "lax" },
                },
              ],
              {
                "Cache-Control":
                  "private, no-cache, no-store, must-revalidate, max-age=0",
                Expires: "0",
                Pragma: "no-cache",
                "X-Auth-Refresh": "applied",
              },
            );
            return { data: { user: null }, error: null };
          });

          return { auth: { getUser } } as never;
        },
      );

      // When
      const response = await updateSupabaseSession(request as never);

      // Then
      expect(createServerClient).toHaveBeenCalledWith(
        "https://example.supabase.co",
        "publishable-key",
        expect.any(Object),
      );
      expect(getUser).toHaveBeenCalledTimes(1);
      expect(request.cookies.getAll).toHaveBeenCalledTimes(1);
      expect(request.cookies.set).toHaveBeenCalledWith("sb-session", "new");
      expect(response.cookies.set).toHaveBeenCalledWith("sb-session", "new", {
        httpOnly: true,
        sameSite: "lax",
      });
      expect(response.headers.get("cache-control")).toContain("private");
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("expires")).toBe("0");
      expect(response.headers.get("pragma")).toBe("no-cache");
      expect(response.headers.get("x-auth-refresh")).toBe("applied");
      expect(JSON.stringify(mockedCreateServerClient.mock.calls)).not.toContain(
        "server-secret-must-not-be-used",
      );
    } finally {
      replacedEnv.restore();
    }
  });

  test("Given 공개 페이지 캐시를 보존해야 할 때 When matcher를 검사하면 Then 관리자 UI와 관리자 API에만 적용한다", () => {
    // Given / When / Then
    expect(config.matcher).toEqual(["/admin/:path*", "/api/admin/:path*"]);
  });
});

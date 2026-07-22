/** @jest-environment node */

import { requireAdmin } from "@/lib/auth/require-admin";
import { createServerAuthClient } from "@/lib/supabase/server";

jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@/lib/supabase/server", () => ({
  createServerAuthClient: jest.fn(),
}));

const mockedCreateServerAuthClient = jest.mocked(createServerAuthClient);

function createAuthClient(result: unknown) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue(result),
    },
  };
}

describe("관리자 공통 권한 가드", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Given 미인증 요청일 때 When requireAdmin을 호출하면 Then 401을 반환한다", async () => {
    // Given
    mockedCreateServerAuthClient.mockResolvedValue(
      createAuthClient({ data: { user: null }, error: null }) as never,
    );

    // When / Then
    await expect(requireAdmin()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  test("Given 일반 인증 사용자일 때 When requireAdmin을 호출하면 Then 403을 반환한다", async () => {
    // Given
    mockedCreateServerAuthClient.mockResolvedValue(
      createAuthClient({
        data: { user: { id: "user-1", app_metadata: {} } },
        error: null,
      }) as never,
    );

    // When / Then
    await expect(requireAdmin()).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
    });
  });

  test("Given user_metadata만 admin인 사용자일 때 When requireAdmin을 호출하면 Then 변조 가능한 metadata를 무시하고 403을 반환한다", async () => {
    // Given
    mockedCreateServerAuthClient.mockResolvedValue(
      createAuthClient({
        data: {
          user: {
            id: "user-2",
            app_metadata: {},
            user_metadata: { role: "admin" },
          },
        },
        error: null,
      }) as never,
    );

    // When / Then
    await expect(requireAdmin()).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
    });
  });

  test("Given app_metadata.role이 admin인 사용자일 때 When requireAdmin을 호출하면 Then 최신 사용자 id를 반환한다", async () => {
    // Given
    const authClient = createAuthClient({
      data: {
        user: { id: "admin-1", app_metadata: { role: "admin" } },
      },
      error: null,
    });
    mockedCreateServerAuthClient.mockResolvedValue(authClient as never);

    // When
    const userId = await requireAdmin();

    // Then
    expect(userId).toBe("admin-1");
    expect(authClient.auth.getUser).toHaveBeenCalledTimes(1);
  });

  test("Given 같은 사용자로 연속 요청할 때 When requireAdmin을 두 번 호출하면 Then 요청마다 getUser로 최신 역할을 다시 조회한다", async () => {
    // Given
    const firstClient = createAuthClient({
      data: {
        user: { id: "admin-1", app_metadata: { role: "admin" } },
      },
      error: null,
    });
    const secondClient = createAuthClient({
      data: {
        user: { id: "admin-1", app_metadata: { role: "member" } },
      },
      error: null,
    });
    mockedCreateServerAuthClient
      .mockResolvedValueOnce(firstClient as never)
      .mockResolvedValueOnce(secondClient as never);

    // When
    await expect(requireAdmin()).resolves.toBe("admin-1");

    // Then
    await expect(requireAdmin()).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedCreateServerAuthClient).toHaveBeenCalledTimes(2);
    expect(firstClient.auth.getUser).toHaveBeenCalledTimes(1);
    expect(secondClient.auth.getUser).toHaveBeenCalledTimes(1);
  });
});

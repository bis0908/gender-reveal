/** @jest-environment node */

import fs from "node:fs";
import path from "node:path";
import { unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";
import { loginAdminAction } from "@/app/admin/login/actions";
import { initialAdminLoginState } from "@/app/admin/login/login-state";
import { createServerAuthClient } from "@/lib/supabase/server";

jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("next/cache", () => ({
  unstable_noStore: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
jest.mock("@/lib/supabase/server", () => ({
  createServerAuthClient: jest.fn(),
}));

const mockedCreateServerAuthClient = jest.mocked(createServerAuthClient);

function createFormData(email: string, password: string): FormData {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("관리자 로그인 서버 액션", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Given 유효한 관리자 자격 증명일 때 When 로그인하면 Then signInWithPassword만 호출하고 관리자 메트릭으로 이동한다", async () => {
    // Given
    const signInWithPassword = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: "admin-1",
          app_metadata: { role: "admin" },
        },
      },
      error: null,
    });
    mockedCreateServerAuthClient.mockResolvedValue({
      auth: { signInWithPassword },
    } as never);
    const formData = createFormData("admin@example.com", "safe-password");

    // When / Then
    await expect(
      loginAdminAction(initialAdminLoginState, formData),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(unstable_noStore).toHaveBeenCalledTimes(1);
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "safe-password",
    });
    expect(redirect).toHaveBeenCalledWith("/admin/metrics");
  });

  test("Given 잘못된 이메일 형식 또는 빈 비밀번호일 때 When 로그인하면 Then Auth 호출 없이 안전한 입력 오류를 반환한다", async () => {
    // Given
    const formData = createFormData("not-an-email", "");

    // When
    const result = await loginAdminAction(initialAdminLoginState, formData);

    // Then
    expect(result.error).toBe("invalid_credentials");
    expect(mockedCreateServerAuthClient).not.toHaveBeenCalled();
  });

  test("Given Supabase 로그인 실패에 원시 메시지가 있을 때 When 로그인하면 Then 자격 증명과 원시 오류를 노출하지 않는다", async () => {
    // Given
    const signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "password=raw-secret database detail" },
    });
    mockedCreateServerAuthClient.mockResolvedValue({
      auth: { signInWithPassword },
    } as never);

    // When
    const result = await loginAdminAction(
      initialAdminLoginState,
      createFormData("admin@example.com", "safe-password"),
    );

    // Then
    expect(result.error).toBe("invalid_credentials");
    expect(JSON.stringify(result)).not.toContain("raw-secret");
    expect(redirect).not.toHaveBeenCalled();
  });

  test("Given 로그인은 성공했지만 app_metadata.role이 관리자가 아닐 때 When 로그인하면 Then 즉시 signOut하고 forbidden만 반환한다", async () => {
    // Given
    const signInWithPassword = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: "member-1",
          email: "member@example.com",
          app_metadata: { role: "member" },
          user_metadata: { role: "admin" },
        },
      },
      error: null,
    });
    const signOut = jest.fn().mockResolvedValue({ error: null });
    mockedCreateServerAuthClient.mockResolvedValue({
      auth: { signInWithPassword, signOut },
    } as never);

    // When
    const result = await loginAdminAction(
      initialAdminLoginState,
      createFormData("member@example.com", "safe-password"),
    );

    // Then
    expect(result).toEqual({ error: "forbidden" });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("member@example.com");
  });

  test("Given 인증 클라이언트가 예기치 않게 실패할 때 When 로그인하면 Then 원문 없이 generic을 반환한다", async () => {
    // Given
    mockedCreateServerAuthClient.mockRejectedValue(
      new Error("SUPABASE_SECRET_KEY=예상치-못한-원문"),
    );

    // When
    const result = await loginAdminAction(
      initialAdminLoginState,
      createFormData("admin@example.com", "safe-password"),
    );

    // Then
    expect(result).toEqual({ error: "generic" });
    expect(JSON.stringify(result)).not.toContain("예상치-못한-원문");
  });

  test("Given 공개 회원가입이 금지된 계약일 때 When 로그인 액션 소스를 검사하면 Then signUp·getSession·ADMIN_EMAIL을 사용하지 않는다", () => {
    // Given
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/admin/login/actions.ts"),
      "utf8",
    );

    // When / Then
    expect(source).not.toContain(".signUp(");
    expect(source).not.toContain("getSession(");
    expect(source).not.toContain("ADMIN_EMAIL");
    expect(source).not.toContain("export const initialAdminLoginState");
  });
});

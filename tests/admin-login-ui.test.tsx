import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { loginAdminAction } from "@/app/admin/login/actions";
import { AdminLoginForm } from "@/app/admin/login/login-form";

jest.mock("@/app/admin/login/actions", () => ({
  loginAdminAction: jest.fn(),
}));

jest.mock("@/components/language-selector", () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
}));

jest.mock("@/lib/i18n/context", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "admin.login.title": "관리자 로그인",
        "admin.login.description": "관리자 계정으로 로그인하세요.",
        "admin.login.email": "이메일",
        "admin.login.password": "비밀번호",
        "admin.login.submit": "로그인",
        "admin.login.submitting": "로그인 중...",
        "admin.login.invalidCredentials":
          "이메일 또는 비밀번호가 올바르지 않습니다.",
        "admin.login.forbidden": "관리자 권한이 없습니다.",
        "admin.login.genericError": "로그인 중 오류가 발생했습니다.",
      })[key] ?? key,
  }),
}));

describe("Admin login form", () => {
  const actionMock = loginAdminAction as jest.MockedFunction<
    typeof loginAdminAction
  >;

  function fillAndSubmit() {
    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "secret-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));
  }

  it("Given credentials When submitting Then it calls the production action with FormData and disables controls while pending", async () => {
    let resolveAction: (value: { error: null }) => void = () => undefined;
    actionMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    render(<AdminLoginForm />);

    fillAndSubmit();

    expect(
      (
        screen.getByRole("button", {
          name: "로그인 중...",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect((screen.getByLabelText("이메일") as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByLabelText("비밀번호") as HTMLInputElement).disabled,
    ).toBe(true);
    const submittedData = actionMock.mock.calls[0][1];
    expect(submittedData.get("email")).toBe("admin@example.com");
    expect(submittedData.get("password")).toBe("secret-password");

    await act(async () => {
      resolveAction({ error: null });
    });

    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "로그인" }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    );
  });

  it.each([
    [
      "invalid_credentials" as const,
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    ],
    ["forbidden" as const, "관리자 권한이 없습니다."],
  ])("Given action error %s When submitting Then it translates and focuses the error", async (error, message) => {
    actionMock.mockResolvedValueOnce({ error });
    render(<AdminLoginForm />);

    fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(message);
    await waitFor(() => expect(document.activeElement).toBe(alert));
  });

  it("Given an unexpected action failure When submitting Then it shows the generic translated error", async () => {
    actionMock.mockRejectedValueOnce(new Error("sensitive upstream error"));
    render(<AdminLoginForm />);

    fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("로그인 중 오류가 발생했습니다.");
    expect(alert.textContent).not.toContain("sensitive upstream error");
  });
});

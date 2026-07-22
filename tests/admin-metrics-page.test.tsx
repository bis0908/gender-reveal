import { render, screen, waitFor } from "@testing-library/react";
import { redirect } from "next/navigation";
import { isValidElement } from "react";
import AdminMetricsPage from "@/app/admin/metrics/page";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  type AppError,
  createForbiddenError,
  createInternalError,
  createUnauthorizedError,
} from "@/lib/errors";
import type { MetricsSummary } from "@/lib/schemas/metrics-summary-schema";
import {
  getAdminMetrics,
  getDefaultAdminMetricsRange,
} from "@/lib/services/admin-metrics";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/services/admin-metrics", () => ({
  getDefaultAdminMetricsRange: jest.fn(),
  getAdminMetrics: jest.fn(),
}));

jest.mock("@/components/language-selector", () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
}));

jest.mock("@/lib/i18n/context", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "admin.metrics.state.forbidden": "관리자 권한이 필요합니다.",
        "admin.login.submit": "로그인",
      })[key] ?? key,
  }),
}));

const summary: MetricsSummary = {
  period: {
    from: "2026-06-21T00:00:00+09:00",
    to: "2026-07-21T00:00:00+09:00",
  },
  total: 0,
  daily: [],
  byCreationMode: [],
  byCountry: [],
  byBabyCount: [],
  byAnimation: [],
  byDevice: [],
  byDueMonth: [],
};

describe("Admin metrics page access states", () => {
  const requireAdminMock = jest.mocked(requireAdmin);
  const redirectMock = jest.mocked(redirect);
  const getDefaultRangeMock = jest.mocked(getDefaultAdminMetricsRange);
  const getMetricsMock = jest.mocked(getAdminMetrics);

  it("Given an unauthenticated request When loading the page Then it redirects to login without querying metrics", async () => {
    requireAdminMock.mockRejectedValueOnce(createUnauthorizedError());
    redirectMock.mockReturnValueOnce(undefined as never);

    await AdminMetricsPage();

    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
    expect(getMetricsMock).not.toHaveBeenCalled();
  });

  it("Given a non-admin request When loading the page Then it renders and focuses the translated forbidden state", async () => {
    requireAdminMock.mockRejectedValueOnce(createForbiddenError());

    const page = await AdminMetricsPage();
    if (!isValidElement(page)) {
      throw new Error("접근 금지 화면이 렌더링되지 않았습니다.");
    }
    render(page);

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("관리자 권한이 필요합니다.");
    expect(
      screen.getByRole("link", { name: "로그인" }).getAttribute("href"),
    ).toBe("/admin/login");
    await waitFor(() => expect(document.activeElement).toBe(alert));
    expect(getMetricsMock).not.toHaveBeenCalled();
  });

  it("Given an admin request When loading the page Then it uses the shared default range and query service", async () => {
    const range = {
      from: "2026-06-21T00:00:00+09:00",
      to: "2026-07-21T00:00:00+09:00",
    };
    requireAdminMock.mockResolvedValueOnce("admin-1");
    getDefaultRangeMock.mockReturnValueOnce(range);
    getMetricsMock.mockResolvedValueOnce(summary);

    const page = await AdminMetricsPage();

    expect(getMetricsMock).toHaveBeenCalledWith(range);
    expect(isValidElement(page)).toBe(true);
    if (isValidElement<{ initialSummary?: MetricsSummary }>(page)) {
      expect(page.props.initialSummary).toBe(summary);
    }
  });

  it("Given an unexpected guard failure When loading the page Then it preserves the error", async () => {
    const error: AppError = createInternalError("guard failed");
    requireAdminMock.mockRejectedValueOnce(error);

    await expect(AdminMetricsPage()).rejects.toBe(error);
  });
});

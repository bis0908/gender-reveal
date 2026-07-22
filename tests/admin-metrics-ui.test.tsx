import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MetricsDashboard } from "@/app/admin/metrics/metrics-dashboard";
import type { MetricsSummary } from "@/lib/schemas/metrics-summary-schema";

jest.mock("@/components/language-selector", () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
}));

jest.mock("@/lib/i18n/context", () => ({
  useTranslation: () => ({
    language: "ko",
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        "admin.login.submit": "로그인",
        "admin.metrics.title": "생성 메트릭",
        "admin.metrics.description": "생성 현황",
        "admin.metrics.filter.from": "시작일",
        "admin.metrics.filter.to": "종료일",
        "admin.metrics.filter.apply": "적용",
        "admin.metrics.filter.applying": "적용 중...",
        "admin.metrics.filter.invalid": "올바른 기간을 선택해 주세요.",
        "admin.metrics.filter.rangeTooLong": "조회 기간은 최대 24개월입니다.",
        "admin.metrics.filter.recent30Days": "최근 30일",
        "admin.metrics.filter.kst": "KST",
        "admin.metrics.filter.period": "조회 기간",
        "admin.metrics.total.title": "전체 생성 건수",
        "admin.metrics.total.description": "선택한 기간에 생성된 링크 수",
        "admin.metrics.charts.daily.title": "일별 생성량",
        "admin.metrics.charts.daily.description": "날짜별 링크 생성 건수",
        "admin.metrics.charts.creationMode.title": "생성 방식",
        "admin.metrics.charts.creationMode.description": "생성 방식 분포",
        "admin.metrics.charts.country.title": "국가",
        "admin.metrics.charts.country.description": "국가 분포",
        "admin.metrics.charts.babyCount.title": "태아 수",
        "admin.metrics.charts.babyCount.description": "태아 수 분포",
        "admin.metrics.charts.animation.title": "애니메이션",
        "admin.metrics.charts.animation.description": "애니메이션 분포",
        "admin.metrics.charts.device.title": "기기",
        "admin.metrics.charts.device.description": "기기 분포",
        "admin.metrics.charts.dueMonth.title": "출산 예정 월",
        "admin.metrics.charts.dueMonth.description": "출산 예정 월 분포",
        "admin.metrics.state.loading": "메트릭을 불러오는 중입니다...",
        "admin.metrics.state.empty": "선택한 기간에 메트릭 데이터가 없습니다.",
        "admin.metrics.state.error": "메트릭을 불러오지 못했습니다.",
        "admin.metrics.state.retry": "다시 시도",
        "admin.metrics.state.unauthorized": "로그인이 필요합니다.",
        "admin.metrics.state.forbidden": "관리자 권한이 필요합니다.",
        "admin.metrics.common.count": "건수",
        "admin.metrics.common.percent": "비율",
        "admin.metrics.common.noData": "데이터 없음",
        "admin.metrics.labels.creationMode.instant": "즉시 공개",
        "admin.metrics.labels.creationMode.dday": "D-Day 예약",
        "admin.metrics.labels.device.ios": "iOS",
        "admin.metrics.labels.device.android": "Android",
        "admin.metrics.labels.animation.confetti": "색종이 폭죽",
        "admin.metrics.labels.babyCount": "태아 수: {{count}}",
      };
      let value = translations[key] ?? key;
      for (const [name, replacement] of Object.entries(params ?? {})) {
        value = value.replaceAll(`{{${name}}}`, replacement);
      }
      return value;
    },
  }),
}));

jest.mock("recharts", () => {
  const MockContainer = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );

  return {
    ResponsiveContainer: MockContainer,
    BarChart: MockContainer,
    LineChart: MockContainer,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Bar: MockContainer,
    Line: MockContainer,
    LabelList: () => null,
  };
});

const initialSummary: MetricsSummary = {
  period: {
    from: "2026-06-21T00:00:00+09:00",
    to: "2026-07-21T00:00:00+09:00",
  },
  total: 10,
  daily: [
    { date: "2026-07-19", count: 3 },
    { date: "2026-07-20", count: 7 },
  ],
  byCreationMode: [
    { key: "instant", count: 7 },
    { key: "dday", count: 3 },
  ],
  byCountry: [{ key: "KR", count: 10 }],
  byBabyCount: [{ key: 1, count: 10 }],
  byAnimation: [{ key: "confetti", count: 10 }],
  byDevice: [
    { key: "ios", count: 6 },
    { key: "android", count: 4 },
  ],
  byDueMonth: [{ month: "2026-09", count: 10 }],
};

const updatedSummary: MetricsSummary = {
  ...initialSummary,
  period: {
    from: "2026-06-01T00:00:00+09:00",
    to: "2026-07-01T00:00:00+09:00",
  },
  total: 42,
};

function mockResponse(status: number, body: unknown = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

describe("Admin metrics dashboard", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock;
  });

  it("Given metrics When rendering Then it shows the total and all seven charts with text data", () => {
    render(<MetricsDashboard initialSummary={initialSummary} />);

    expect(
      screen.getByRole("heading", { name: "전체 생성 건수" }),
    ).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    for (const title of [
      "일별 생성량",
      "생성 방식",
      "국가",
      "태아 수",
      "애니메이션",
      "기기",
      "출산 예정 월",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    }
    expect(screen.getByText("즉시 공개")).toBeTruthy();
    expect(screen.getByText("7 건수 · 70.0% 비율")).toBeTruthy();
  });

  it("Given a valid date range When applying Then it disables the filter and renders the API result", async () => {
    let resolveResponse: (value: Response) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      }),
    );
    render(<MetricsDashboard initialSummary={initialSummary} />);

    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByLabelText("종료일"), {
      target: { value: "2026-06-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    expect(
      (
        screen.getByRole("button", {
          name: "적용 중...",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect((screen.getByLabelText("시작일") as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(screen.getByTestId("metrics-dashboard-loading")).toBeTruthy();

    await act(async () => {
      resolveResponse(mockResponse(200, updatedSummary));
    });

    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "from=2026-06-01T00%3A00%3A00%2B09%3A00&to=2026-07-01T00%3A00%3A00%2B09%3A00",
      ),
      expect.objectContaining({
        cache: "no-store",
        credentials: "same-origin",
      }),
    );
  });

  it("Given invalid and over-24-month ranges When applying Then it focuses validation and does not call the API", async () => {
    render(<MetricsDashboard initialSummary={initialSummary} />);

    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: "2026-07-20" },
    });
    fireEvent.change(screen.getByLabelText("종료일"), {
      target: { value: "2026-07-19" },
    });
    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    const invalidAlert = screen.getByRole("alert");
    expect(invalidAlert.textContent).toContain("올바른 기간을 선택해 주세요.");
    await waitFor(() => expect(document.activeElement).toBe(invalidAlert));

    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: "2023-01-01" },
    });
    fireEvent.change(screen.getByLabelText("종료일"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "조회 기간은 최대 24개월입니다.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, "로그인이 필요합니다."],
    [403, "관리자 권한이 필요합니다."],
  ])("Given API %s When applying Then it shows and focuses the access state", async (status, message) => {
    fetchMock.mockResolvedValueOnce(mockResponse(status));
    render(<MetricsDashboard initialSummary={initialSummary} />);

    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(message);
    await waitFor(() => expect(document.activeElement).toBe(alert));
    expect(
      screen.getByRole("link", { name: "로그인" }).getAttribute("href"),
    ).toBe("/admin/login");
  });

  it("Given an API error When retrying Then it repeats the last request and recovers", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(200, updatedSummary));
    render(<MetricsDashboard initialSummary={initialSummary} />);

    fireEvent.click(screen.getByRole("button", { name: "적용" }));
    expect(
      await screen.findByText("메트릭을 불러오지 못했습니다."),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("Given an empty summary When rendering Then it shows the page and per-chart empty states", () => {
    const emptySummary: MetricsSummary = {
      ...initialSummary,
      total: 0,
      daily: [],
      byCreationMode: [],
      byCountry: [],
      byBabyCount: [],
      byAnimation: [],
      byDevice: [],
      byDueMonth: [],
    };

    render(<MetricsDashboard initialSummary={emptySummary} />);

    expect(
      screen.getByText("선택한 기간에 메트릭 데이터가 없습니다."),
    ).toBeTruthy();
    expect(screen.getAllByText("데이터 없음")).toHaveLength(8);
  });
});

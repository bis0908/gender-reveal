/** @jest-environment node */

import { logger } from "@/lib/logger";
import { getMetricsSupabaseClient } from "@/lib/metrics-supabase-client.server";
import {
  type MetricsSummary,
  metricsSummarySchema,
} from "@/lib/schemas/metrics-summary-schema";
import {
  getAdminMetrics,
  getDefaultAdminMetricsRange,
  parseAdminMetricsRange,
} from "@/lib/services/admin-metrics";

jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@/lib/metrics-supabase-client.server", () => ({
  getMetricsSupabaseClient: jest.fn(),
}));
jest.mock("@/lib/logger", () => ({
  logger: {
    serverMetric: jest.fn(),
  },
}));

const mockedGetMetricsSupabaseClient = jest.mocked(getMetricsSupabaseClient);
const mockedServerMetric = jest.mocked(logger.serverMetric);
const range = {
  from: "2026-06-23T00:00:00.000+09:00",
  to: "2026-07-23T00:00:00.000+09:00",
};
const summary: MetricsSummary = {
  period: range,
  total: 12,
  daily: [{ date: "2026-07-22", count: 12 }],
  byCreationMode: [{ key: "instant", count: 8 }],
  byCountry: [{ key: "KR", count: 12 }],
  byBabyCount: [{ key: 1, count: 12 }],
  byAnimation: [{ key: "confetti", count: 12 }],
  byDevice: [{ key: "android", count: 12 }],
  byDueMonth: [{ month: "2026-11", count: 12 }],
};

describe("관리자 메트릭 조회 서비스", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Given KST 정오 시각일 때 When 기본 범위를 만들면 Then 오늘을 포함한 최근 30개 달력일 반개방 구간을 반환한다", () => {
    // Given
    const now = new Date("2026-07-22T03:30:00.000Z");

    // When
    const result = getDefaultAdminMetricsRange(now);

    // Then
    expect(result).toEqual(range);
  });

  test.each([
    ["오프셋 없는 시작 시각", { from: "2026-06-23T00:00:00", to: range.to }],
    ["시작과 종료가 같은 범위", { from: range.from, to: range.from }],
    [
      "KST 기준 24개월을 1ms 초과한 범위",
      {
        from: "2024-02-29T00:00:00.000+09:00",
        to: "2026-02-28T00:00:00.001+09:00",
      },
    ],
  ])("Given %s일 때 When 범위를 검증하면 Then 400 AppError를 던진다", (_caseName, invalidRange) => {
    // Given / When / Then
    expect(() => parseAdminMetricsRange(invalidRange)).toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  test("Given 윤일에서 KST 기준 정확히 24개월 범위일 때 When 검증하면 Then 허용한다", () => {
    // Given
    const exactRange = {
      from: "2024-02-29T00:00:00.000+09:00",
      to: "2026-02-28T00:00:00.000+09:00",
    };

    // When / Then
    expect(parseAdminMetricsRange(exactRange)).toEqual(exactRange);
  });

  test("Given 유효한 RPC 집계일 때 When 조회하면 Then service-role RPC 결과를 schema로 검증하고 성공 로그를 남긴다", async () => {
    // Given
    const rpc = jest.fn().mockResolvedValue({ data: summary, error: null });
    mockedGetMetricsSupabaseClient.mockReturnValue({ rpc } as never);

    // When
    const result = await getAdminMetrics(range);

    // Then
    expect(result).toEqual(summary);
    expect(rpc).toHaveBeenCalledWith("get_reveal_generation_metrics", {
      p_from: range.from,
      p_to: range.to,
    });
    expect(mockedServerMetric).toHaveBeenCalledWith(
      "metrics_admin_query_success",
      { endpoint: "/api/admin/metrics", ...range },
    );
  });

  test("Given Supabase가 원시 오류를 반환할 때 When 조회하면 Then 원문을 숨긴 정제 오류와 실패 코드만 로그에 남긴다", async () => {
    // Given
    const rpc = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "SUPABASE_SECRET_KEY=절대-노출-금지" },
    });
    mockedGetMetricsSupabaseClient.mockReturnValue({ rpc } as never);

    // When / Then
    await expect(getAdminMetrics(range)).rejects.toThrow(
      "관리자 메트릭 조회에 실패했습니다.",
    );
    expect(mockedServerMetric).toHaveBeenCalledWith(
      "metrics_admin_query_failure",
      {
        endpoint: "/api/admin/metrics",
        ...range,
        errorCode: "METRICS_RPC_ERROR",
      },
    );
    expect(JSON.stringify(mockedServerMetric.mock.calls)).not.toContain(
      "절대-노출-금지",
    );
  });
});

describe("MetricsSummary 공유 schema", () => {
  test("Given 정상 집계와 빈 배열일 때 When schema로 검증하면 Then 모두 허용한다", () => {
    // Given
    const emptySummary = {
      ...summary,
      total: 0,
      daily: [],
      byCreationMode: [],
      byCountry: [],
      byBabyCount: [],
      byAnimation: [],
      byDevice: [],
      byDueMonth: [],
    };

    // When / Then
    expect(metricsSummarySchema.parse(summary)).toEqual(summary);
    expect(metricsSummarySchema.parse(emptySummary)).toEqual(emptySummary);
  });

  test.each([
    ["음수 count", { ...summary, total: -1 }],
    ["소수 count", { ...summary, total: 1.5 }],
    ["원시 event_id", { ...summary, event_id: "raw-event-id" }],
    [
      "잘못된 due month",
      { ...summary, byDueMonth: [{ month: "2026-11-01", count: 1 }] },
    ],
  ])("Given %s가 포함된 응답일 때 When schema로 검증하면 Then 거부한다", (_caseName, invalidSummary) => {
    // Given / When / Then
    expect(() => metricsSummarySchema.parse(invalidSummary)).toThrow();
  });

  test.each([
    [
      "10건 미만 국가 집단",
      { ...summary, byCountry: [{ key: "KR", count: 9 }] },
    ],
    [
      "허용되지 않은 국가 키",
      { ...summary, byCountry: [{ key: "kr", count: 10 }] },
    ],
    [
      "상위 10개와 other를 넘는 국가 항목",
      {
        ...summary,
        byCountry: Array.from({ length: 12 }, (_, index) => ({
          key: index === 11 ? "other" : `${String.fromCharCode(65 + index)}A`,
          count: 10,
        })),
      },
    ],
  ])("Given %s가 포함된 응답일 때 When 국가 집계 schema로 검증하면 Then 노출을 거부한다", (_caseName, invalidSummary) => {
    // Given / When / Then
    expect(() => metricsSummarySchema.parse(invalidSummary)).toThrow();
  });
});

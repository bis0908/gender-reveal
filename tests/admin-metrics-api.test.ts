/** @jest-environment node */

import { dynamic, GET, revalidate } from "@/app/api/admin/metrics/route";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createBadRequestError,
  createForbiddenError,
  createUnauthorizedError,
} from "@/lib/errors";
import type { MetricsSummary } from "@/lib/schemas/metrics-summary-schema";
import { getAdminMetrics } from "@/lib/services/admin-metrics";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (
      body: unknown,
      init?: { status?: number; headers?: HeadersInit },
    ) => ({
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
      json: async () => body,
    }),
  },
}));
jest.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: jest.fn(),
}));
jest.mock("@/lib/services/admin-metrics", () => ({
  getAdminMetrics: jest.fn(),
}));

const mockedRequireAdmin = jest.mocked(requireAdmin);
const mockedGetAdminMetrics = jest.mocked(getAdminMetrics);
const range = {
  from: "2026-06-23T00:00:00.000+09:00",
  to: "2026-07-23T00:00:00.000+09:00",
};
const summary: MetricsSummary = {
  period: range,
  total: 0,
  daily: [],
  byCreationMode: [],
  byCountry: [],
  byBabyCount: [],
  byAnimation: [],
  byDevice: [],
  byDueMonth: [],
};

function createRequest(
  query = `from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
) {
  return new Request(`https://example.com/api/admin/metrics?${query}`);
}

async function expectPrivateNoStore(response: { headers: Headers }) {
  expect(response.headers.get("cache-control")).toContain("private");
  expect(response.headers.get("cache-control")).toContain("no-store");
}

describe("GET /api/admin/metrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAdmin.mockResolvedValue("admin-1");
    mockedGetAdminMetrics.mockResolvedValue(summary);
  });

  test("Given 미인증 요청일 때 When 조회하면 Then 401과 private no-store를 반환한다", async () => {
    // Given
    mockedRequireAdmin.mockRejectedValue(createUnauthorizedError());

    // When
    const response = await GET(createRequest() as never);
    const body = await response.json();

    // Then
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(mockedGetAdminMetrics).not.toHaveBeenCalled();
    await expectPrivateNoStore(response);
  });

  test("Given 일반 인증 사용자일 때 When 조회하면 Then 403을 반환한다", async () => {
    // Given
    mockedRequireAdmin.mockRejectedValue(createForbiddenError());

    // When
    const response = await GET(createRequest() as never);

    // Then
    expect(response.status).toBe(403);
    expect(mockedGetAdminMetrics).not.toHaveBeenCalled();
    await expectPrivateNoStore(response);
  });

  test("Given 잘못된 기간일 때 When 관리자가 조회하면 Then 400을 반환한다", async () => {
    // Given
    mockedGetAdminMetrics.mockRejectedValue(
      createBadRequestError("조회 기간이 올바르지 않습니다."),
    );

    // When
    const response = await GET(
      createRequest("from=invalid&to=invalid") as never,
    );

    // Then
    expect(response.status).toBe(400);
    expect(mockedRequireAdmin).toHaveBeenCalledTimes(1);
    await expectPrivateNoStore(response);
  });

  test("Given 관리자와 유효 기간일 때 When 조회하면 Then data 래퍼 없이 MetricsSummary를 직접 반환한다", async () => {
    // Given / When
    const response = await GET(createRequest() as never);
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body).toEqual(summary);
    expect(body.data).toBeUndefined();
    expect(mockedRequireAdmin).toHaveBeenCalledTimes(1);
    expect(mockedGetAdminMetrics).toHaveBeenCalledWith(range);
    await expectPrivateNoStore(response);
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);
  });

  test("Given 내부 RPC 오류에 원시 메시지가 있을 때 When 조회하면 Then 정제된 500만 반환한다", async () => {
    // Given
    mockedGetAdminMetrics.mockRejectedValue(
      new Error("SUPABASE_SECRET_KEY=절대-응답-금지"),
    );

    // When
    const response = await GET(createRequest() as never);
    const body = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("절대-응답-금지");
    await expectPrivateNoStore(response);
  });
});

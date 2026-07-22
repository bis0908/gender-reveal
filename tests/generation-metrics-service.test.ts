/** @jest-environment node */

import { logger } from "@/lib/logger";
import { getMetricsSupabaseClient } from "@/lib/metrics-supabase-client.server";
import {
  deriveGenerationMetric,
  recordGenerationMetric,
} from "@/lib/services/generation-metrics";

jest.mock("@/lib/metrics-supabase-client.server", () => ({
  getMetricsSupabaseClient: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    serverMetric: jest.fn(),
  },
}));

const EVENT_ID = "550e8400-e29b-41d4-a716-446655440000";
const mockedGetMetricsClient = jest.mocked(getMetricsSupabaseClient);
const mockedServerMetric = jest.mocked(logger.serverMetric);
const mockUpsert = jest.fn();
const mockFrom = jest.fn(() => ({ upsert: mockUpsert }));
const originalVercel = process.env.VERCEL;

function createMetricRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/generate-token", { headers });
}

function createSingleSource(overrides: Record<string, unknown> = {}) {
  return {
    motherName: "엄마",
    fatherName: "아빠",
    babyName: "복덩이",
    gender: "boy",
    message: "비공개 메시지",
    token: "비공개 토큰",
    isMultiple: false,
    animationType: "confetti",
    dueDate: "2026-07-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("생성 메트릭 파생", () => {
  beforeEach(() => {
    process.env.VERCEL = "1";
  });

  afterAll(() => {
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
      return;
    }

    process.env.VERCEL = originalVercel;
  });

  test("Given 단태아 입력과 신뢰 가능한 국가 헤더가 있을 때 When 메트릭을 파생하면 Then 허용된 집계 필드만 반환한다", () => {
    // Given
    const request = createMetricRequest({
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      "x-vercel-ip-country": "KR",
    });

    // When
    const metric = deriveGenerationMetric(
      request,
      createSingleSource({ countryCode: "US", ip: "203.0.113.1" }),
      "instant",
      EVENT_ID,
    );

    // Then
    expect(metric).toEqual({
      event_id: EVENT_ID,
      creation_mode: "instant",
      country_code: "KR",
      baby_count: 1,
      animation_type: "confetti",
      device_platform: "ios",
      due_month: "2026-07-01",
    });
    expect(Object.keys(metric).sort()).toEqual(
      [
        "event_id",
        "creation_mode",
        "country_code",
        "baby_count",
        "animation_type",
        "device_platform",
        "due_month",
      ].sort(),
    );
    expect(JSON.stringify(metric)).not.toContain("엄마");
    expect(JSON.stringify(metric)).not.toContain("203.0.113.1");
    expect(JSON.stringify(metric)).not.toContain("비공개");
  });

  test("Given 다태아 정보가 있을 때 When 메트릭을 파생하면 Then 배열 길이를 태아 수로 사용한다", () => {
    // Given
    const data = createSingleSource({
      isMultiple: true,
      babiesInfo: [
        { name: "첫째", gender: "boy" },
        { name: "둘째", gender: "girl" },
        { name: "셋째", gender: "girl" },
      ],
      animationType: "scratch",
    });

    // When
    const metric = deriveGenerationMetric(
      createMetricRequest(),
      data,
      "dday",
      EVENT_ID,
    );

    // Then
    expect(metric.baby_count).toBe(3);
    expect(metric.creation_mode).toBe("dday");
    expect(metric.animation_type).toBe("scratch");
  });

  test.each([
    ["Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)", "ios"],
    ["Mozilla/5.0 (Linux; Android 14; Pixel 8)", "android"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "other"],
    ["", "unknown"],
  ])("Given User-Agent %p일 때 When 기기를 분류하면 Then %p를 반환한다", (userAgent, expectedDevice) => {
    // Given
    const request = createMetricRequest({ "user-agent": userAgent });

    // When
    const metric = deriveGenerationMetric(
      request,
      createSingleSource(),
      "instant",
      EVENT_ID,
    );

    // Then
    expect(metric.device_platform).toBe(expectedDevice);
  });

  test.each([
    "kr",
    "KOR",
    "K1",
    "K R",
  ])("Given 형식이 아닌 국가 헤더 %p일 때 When 메트릭을 파생하면 Then 국가는 null이다", (countryCode) => {
    // Given
    const request = createMetricRequest({
      "x-vercel-ip-country": countryCode,
    });

    // When
    const metric = deriveGenerationMetric(
      request,
      createSingleSource(),
      "instant",
      EVENT_ID,
    );

    // Then
    expect(metric.country_code).toBeNull();
  });

  test("Given 비Vercel 환경에서 유효해 보이는 국가 헤더를 spoof할 때 When 메트릭을 파생하면 Then 국가는 null이다", () => {
    // Given
    process.env.VERCEL = "0";
    const request = createMetricRequest({
      "x-vercel-ip-country": "KR",
    });

    // When
    const metric = deriveGenerationMetric(
      request,
      createSingleSource(),
      "instant",
      EVENT_ID,
    );

    // Then
    expect(metric.country_code).toBeNull();
  });

  test("Given 오프셋을 포함한 예정일 시각이 있을 때 When 월을 파생하면 Then 입력 시각의 UTC 연월 첫날을 반환한다", () => {
    // Given
    const data = createSingleSource({
      dueDate: "2026-03-31T23:30:00-02:00",
    });

    // When
    const metric = deriveGenerationMetric(
      createMetricRequest(),
      data,
      "instant",
      EVENT_ID,
    );

    // Then
    expect(metric.due_month).toBe("2026-04-01");
  });

  test("Given 잘못된 UUID·생성 모드·애니메이션·태아 수일 때 When 메트릭을 파생하면 Then 기록 가능한 값으로 허용하지 않는다", () => {
    // Given
    const request = createMetricRequest();

    // When / Then
    expect(() =>
      deriveGenerationMetric(
        request,
        createSingleSource(),
        "instant",
        "bad-id",
      ),
    ).toThrow();
    expect(() =>
      deriveGenerationMetric(
        request,
        createSingleSource(),
        "invalid" as "instant",
        EVENT_ID,
      ),
    ).toThrow();
    expect(() =>
      deriveGenerationMetric(
        request,
        createSingleSource({ animationType: "unsupported" }),
        "instant",
        EVENT_ID,
      ),
    ).toThrow();
    expect(() =>
      deriveGenerationMetric(
        request,
        createSingleSource({ isMultiple: true, babiesInfo: [] }),
        "instant",
        EVENT_ID,
      ),
    ).toThrow();
  });
});

describe("생성 메트릭 기록", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMetricsClient.mockReturnValue({ from: mockFrom } as never);
  });

  test("Given 유효한 메트릭일 때 When 기록하면 Then event_id 충돌을 무시하는 upsert를 한 번 실행한다", async () => {
    // Given
    mockUpsert.mockResolvedValue({ error: null });

    // When
    const recorded = await recordGenerationMetric({
      eventId: EVENT_ID,
      creationMode: "instant",
      endpoint: "/api/generate-token",
      request: createMetricRequest(),
      data: createSingleSource(),
    });

    // Then
    expect(recorded).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("reveal_generation_events");
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: EVENT_ID }),
      { onConflict: "event_id", ignoreDuplicates: true },
    );
    expect(mockedServerMetric).toHaveBeenCalledWith("metrics_record_success", {
      endpoint: "/api/generate-token",
      creationMode: "instant",
      eventId: EVENT_ID,
    });
  });

  test("Given 첫 DB 기록이 실패할 때 When 기록하면 Then 같은 이벤트로 한 번만 재시도한다", async () => {
    // Given
    mockUpsert
      .mockResolvedValueOnce({
        error: { code: "PGRST001", message: "원문 오류와 secret-value" },
      })
      .mockResolvedValueOnce({ error: null });

    // When
    const recorded = await recordGenerationMetric({
      eventId: EVENT_ID,
      creationMode: "dday",
      endpoint: "/api/dday/create",
      request: createMetricRequest(),
      data: createSingleSource(),
    });

    // Then
    expect(recorded).toBe(true);
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert.mock.calls[1]).toEqual(mockUpsert.mock.calls[0]);
  });

  test("Given 두 번의 DB 기록이 모두 실패할 때 When 기록하면 Then 예외를 전파하지 않고 정제된 실패 로그만 남긴다", async () => {
    // Given
    mockUpsert.mockResolvedValue({
      error: {
        code: "42501",
        message: "SUPABASE_SECRET_KEY=절대-로그-금지",
        details: "요청 본문 원문",
      },
    });

    // When
    const recorded = await recordGenerationMetric({
      eventId: EVENT_ID,
      creationMode: "instant",
      endpoint: "/api/generate-token",
      request: createMetricRequest(),
      data: createSingleSource(),
    });

    // Then
    expect(recorded).toBe(false);
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockedServerMetric).toHaveBeenCalledTimes(1);
    expect(mockedServerMetric).toHaveBeenCalledWith("metrics_record_failure", {
      endpoint: "/api/generate-token",
      creationMode: "instant",
      eventId: EVENT_ID,
      errorCode: "42501",
    });
    expect(JSON.stringify(mockedServerMetric.mock.calls)).not.toContain(
      "절대-로그-금지",
    );
    expect(JSON.stringify(mockedServerMetric.mock.calls)).not.toContain(
      "요청 본문 원문",
    );
  });
});

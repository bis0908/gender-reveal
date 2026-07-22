/** @jest-environment node */

describe("운영 서버 메트릭 로그", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const mutableEnv = process.env as Record<string, string | undefined>;

  afterEach(() => {
    mutableEnv.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test("Given 프로덕션 환경일 때 When 서버 메트릭을 기록하면 Then 일반 info 정책과 별개로 구조화 로그가 출력된다", () => {
    // Given
    mutableEnv.NODE_ENV = "production";
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    const { logger } = require("@/lib/logger") as typeof import("@/lib/logger");

    // When
    logger.serverMetric("metrics_record_success", {
      endpoint: "/api/generate-token",
      creationMode: "instant",
      eventId: "550e8400-e29b-41d4-a716-446655440000",
    });

    // Then
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0][0]).toContain("metrics_record_success");
  });
});

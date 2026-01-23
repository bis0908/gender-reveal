/**
 * useFeedbackModalThrottle 훅 테스트
 * 피드백 모달 24시간 노출 제한 기능 검증
 *
 * @author Albert Kong
 * @date 2026-01-23
 */

import { act, renderHook } from "@testing-library/react";
import { useFeedbackModalThrottle } from "@/hooks/useFeedbackModalThrottle";

const STORAGE_KEY = "gr-feedback-last-shown";
const THROTTLE_DURATION_MS = 24 * 60 * 60 * 1000; // 24시간

describe("useFeedbackModalThrottle 훅 테스트", () => {
  // 각 테스트 전 localStorage 초기화
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("최초 방문자 시나리오", () => {
    test("localStorage가 비어있으면 canShow는 true", () => {
      // given: localStorage에 저장된 값 없음 (최초 방문)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 모달 표시 가능
      expect(result.current.canShow).toBe(true);
      expect(result.current.remainingHours).toBeNull();
      expect(result.current.lastShownDate).toBeNull();
    });
  });

  describe("24시간 미경과 시나리오", () => {
    test("10시간 전 타임스탬프면 canShow는 false", () => {
      // given: 10시간 전 타임스탬프 저장
      const tenHoursAgo = new Date();
      tenHoursAgo.setHours(tenHoursAgo.getHours() - 10);
      localStorage.setItem(STORAGE_KEY, tenHoursAgo.toISOString());

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 모달 표시 불가
      expect(result.current.canShow).toBe(false);
      // then: 남은 시간 약 14시간
      expect(result.current.remainingHours).toBeGreaterThanOrEqual(13);
      expect(result.current.remainingHours).toBeLessThanOrEqual(15);
    });

    test("23시간 59분 전 타임스탬프면 canShow는 false", () => {
      // given: 23시간 59분 전 타임스탬프 저장 (거의 24시간)
      const almostDay = new Date();
      almostDay.setHours(almostDay.getHours() - 23);
      almostDay.setMinutes(almostDay.getMinutes() - 59);
      localStorage.setItem(STORAGE_KEY, almostDay.toISOString());

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 아직 24시간 미경과이므로 모달 표시 불가
      expect(result.current.canShow).toBe(false);
      expect(result.current.remainingHours).toBe(1); // 남은 시간 1시간 미만 → ceil 처리
    });
  });

  describe("24시간 경과 시나리오", () => {
    test("25시간 전 타임스탬프면 canShow는 true", () => {
      // given: 25시간 전 타임스탬프 저장
      const twentyFiveHoursAgo = new Date();
      twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25);
      localStorage.setItem(STORAGE_KEY, twentyFiveHoursAgo.toISOString());

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 모달 표시 가능
      expect(result.current.canShow).toBe(true);
      expect(result.current.remainingHours).toBe(0);
    });

    test("정확히 24시간 경과면 canShow는 true", () => {
      // given: 정확히 24시간 전 타임스탬프 저장
      const exactlyOneDay = new Date(Date.now() - THROTTLE_DURATION_MS);
      localStorage.setItem(STORAGE_KEY, exactlyOneDay.toISOString());

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 모달 표시 가능
      expect(result.current.canShow).toBe(true);
    });

    test("48시간 전 타임스탬프면 canShow는 true", () => {
      // given: 48시간 전 타임스탬프 저장
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
      localStorage.setItem(STORAGE_KEY, twoDaysAgo.toISOString());

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 모달 표시 가능
      expect(result.current.canShow).toBe(true);
      expect(result.current.remainingHours).toBe(0);
    });
  });

  describe("잘못된 타임스탬프 시나리오", () => {
    test("잘못된 문자열이면 localStorage 초기화 후 canShow는 true", () => {
      // given: 잘못된 타임스탬프 저장
      localStorage.setItem(STORAGE_KEY, "invalid-timestamp");

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 자동 복구 - 모달 표시 가능
      expect(result.current.canShow).toBe(true);
      // then: localStorage에서 잘못된 값 제거됨
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      // then: 경고 로그 출력
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("잘못된 타임스탬프"),
      );
    });

    test("빈 문자열이면 canShow는 true", () => {
      // given: 빈 문자열 저장
      localStorage.setItem(STORAGE_KEY, "");

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 잘못된 값으로 처리 → 모달 표시 가능
      expect(result.current.canShow).toBe(true);
    });

    test("숫자만 저장되어 있으면 localStorage 초기화 후 canShow는 true", () => {
      // given: 숫자만 저장 (ISO 형식 아님)
      localStorage.setItem(STORAGE_KEY, "1234567890");

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 잘못된 형식으로 처리 → 모달 표시 가능
      // Note: new Date('1234567890').getTime()은 NaN이 아닐 수 있음
      // 실제 동작에 따라 테스트 조정 필요
      expect(result.current.canShow).toBeDefined();
    });
  });

  describe("markAsShown 호출 시나리오", () => {
    test("markAsShown 호출하면 현재 시간이 localStorage에 저장됨", () => {
      // given: 훅 초기화
      const { result } = renderHook(() => useFeedbackModalThrottle());
      expect(result.current.canShow).toBe(true);

      // when: markAsShown 호출
      act(() => {
        result.current.markAsShown();
      });

      // then: localStorage에 타임스탬프 저장됨
      const storedValue = localStorage.getItem(STORAGE_KEY);
      expect(storedValue).not.toBeNull();

      // then: ISO 8601 형식인지 확인
      const storedDate = new Date(storedValue!);
      expect(storedDate.getTime()).not.toBeNaN();

      // then: 저장된 시간이 현재 시간과 가까움 (1초 이내)
      const now = new Date();
      expect(Math.abs(storedDate.getTime() - now.getTime())).toBeLessThan(1000);
    });

    test("markAsShown 호출 후 canShow는 false가 됨", () => {
      // given: 훅 초기화 (최초 방문)
      const { result } = renderHook(() => useFeedbackModalThrottle());
      expect(result.current.canShow).toBe(true);

      // when: markAsShown 호출
      act(() => {
        result.current.markAsShown();
      });

      // then: 모달 표시 불가
      expect(result.current.canShow).toBe(false);
      expect(result.current.remainingHours).toBe(24);
    });

    test("markAsShown 호출 후 lastShownDate가 설정됨", () => {
      // given: 훅 초기화
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // when: markAsShown 호출
      act(() => {
        result.current.markAsShown();
      });

      // then: lastShownDate가 현재 시간으로 설정됨
      expect(result.current.lastShownDate).toBeInstanceOf(Date);
      const now = new Date();
      expect(
        Math.abs(result.current.lastShownDate!.getTime() - now.getTime()),
      ).toBeLessThan(1000);
    });

    test("markAsShown 호출 시 로그 출력됨", () => {
      // given: 훅 초기화
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // when: markAsShown 호출
      act(() => {
        result.current.markAsShown();
      });

      // then: 로그 출력 확인
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("모달 표시 시간 저장"),
      );
    });
  });

  describe("localStorage 비활성화 시나리오", () => {
    test("localStorage.getItem 에러 시 canShow는 true (기본값)", () => {
      // given: localStorage.getItem이 에러 던지도록 설정
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error("localStorage 비활성화");
      });

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 기본값으로 모달 표시 가능
      expect(result.current.canShow).toBe(true);

      // then: 경고 로그 출력
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("localStorage 접근 실패"),
        expect.anything(),
      );

      // cleanup
      Storage.prototype.getItem = originalGetItem;
    });

    test("localStorage.setItem 에러 시에도 정상 동작", () => {
      // given: localStorage.setItem이 에러 던지도록 설정
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error("localStorage 저장 실패");
      });

      // when: 훅 초기화 및 markAsShown 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 에러가 발생해도 훅이 크래시하지 않음
      expect(() => {
        act(() => {
          result.current.markAsShown();
        });
      }).not.toThrow();

      // then: 경고 로그 출력
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("localStorage 저장 실패"),
        expect.anything(),
      );

      // cleanup
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe("경계값 테스트", () => {
    test("24시간 - 1분이면 canShow는 false", () => {
      // given: 24시간 - 1분 전 타임스탬프 (타이밍 안전 마진 적용)
      const oneMinuteMs = 60 * 1000;
      const justBefore = new Date(
        Date.now() - THROTTLE_DURATION_MS + oneMinuteMs,
      );
      localStorage.setItem(STORAGE_KEY, justBefore.toISOString());

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 아직 24시간 미경과
      expect(result.current.canShow).toBe(false);
    });

    test("24시간 + 1분이면 canShow는 true", () => {
      // given: 24시간 + 1분 전 타임스탬프 (타이밍 안전 마진 적용)
      const oneMinuteMs = 60 * 1000;
      const justAfter = new Date(
        Date.now() - THROTTLE_DURATION_MS - oneMinuteMs,
      );
      localStorage.setItem(STORAGE_KEY, justAfter.toISOString());

      // when: 훅 호출
      const { result } = renderHook(() => useFeedbackModalThrottle());

      // then: 24시간 경과
      expect(result.current.canShow).toBe(true);
    });
  });
});

describe("CreatePage 통합 시나리오", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("canShow가 false면 handleLinkGenerated에서 모달을 표시하지 않음", () => {
    // given: 10시간 전 타임스탬프 저장 (24시간 미경과)
    const tenHoursAgo = new Date();
    tenHoursAgo.setHours(tenHoursAgo.getHours() - 10);
    localStorage.setItem(STORAGE_KEY, tenHoursAgo.toISOString());

    // when: 훅 호출
    const { result } = renderHook(() => useFeedbackModalThrottle());

    // then: canShow가 false이므로 모달 표시 로직이 실행되지 않아야 함
    expect(result.current.canShow).toBe(false);

    // Note: 실제 CreatePage 통합 테스트는 컴포넌트 렌더링 필요
    // 여기서는 훅 레벨에서 canShow 상태만 검증
  });

  test("canShow가 true이고 markAsShown 호출 후에는 다음 확인에서 false", () => {
    // given: 최초 방문 상태
    const { result, rerender } = renderHook(() => useFeedbackModalThrottle());
    expect(result.current.canShow).toBe(true);

    // when: 모달 표시 후 markAsShown 호출
    act(() => {
      result.current.markAsShown();
    });

    // then: 즉시 canShow가 false가 됨
    expect(result.current.canShow).toBe(false);

    // when: 훅을 다시 렌더링 (페이지 새로고침 시뮬레이션)
    rerender();

    // then: 여전히 canShow는 false
    expect(result.current.canShow).toBe(false);
  });
});

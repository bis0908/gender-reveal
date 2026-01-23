/**
 * CountdownTimer 통합 테스트
 * Critical Gap 해결: Mock 제거하고 실제 컴포넌트 테스트
 *
 * Test IDs: COUNTDOWN-T01 ~ COUNTDOWN-T08 (P0)
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import { CountdownTimer } from "@/app/countdown/[token]/components/CountdownTimer";

// Mock i18n context
jest.mock("@/lib/i18n/context", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "dday.ddayReached": "D-Day 도달!",
        "dday.genderRevealSoon": "곧 성별이 공개됩니다",
        "dday.daysLabel": "일",
        "dday.hoursLabel": "시간",
      };
      return translations[key] || key;
    },
  }),
}));

describe("CountdownTimer Integration Tests (P0 - Critical)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  /**
   * [COUNTDOWN-T01] CountdownTimer 시간 계산 로직 검증
   * Risk: R-001 (Score: 9)
   * Priority: P0
   */
  describe("[COUNTDOWN-T01] 시간 계산 로직 검증", () => {
    test("Given scheduledAt이 2일 14시간 30분 후일 때 When CountdownTimer 렌더링 Then 2일 15시간으로 올림 표시", () => {
      // given
      const now = Date.now();
      const scheduledAt = new Date(now + 2.6 * 24 * 60 * 60 * 1000).toISOString(); // 2.6일 = 2일 14시간 24분
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 올림 처리로 2일 15시간 표시
      expect(screen.getByText("02")).toBeInTheDocument(); // days
      expect(screen.getByText("15")).toBeInTheDocument(); // hours (올림)
      expect(screen.getByText("일")).toBeInTheDocument();
      expect(screen.getByText("시간")).toBeInTheDocument();
    });

    test("Given scheduledAt이 정확히 48시간 후일 때 When CountdownTimer 렌더링 Then 2일 0시간 표시", () => {
      // given
      const now = Date.now();
      const scheduledAt = new Date(now + 48 * 60 * 60 * 1000).toISOString(); // 정확히 48시간
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then
      expect(screen.getByText("02")).toBeInTheDocument(); // days
      expect(screen.getByText("00")).toBeInTheDocument(); // hours
    });
  });

  /**
   * [COUNTDOWN-T02] 1분 주기 업데이트 메커니즘 검증
   * Risk: R-002 (Score: 6)
   * Priority: P0
   */
  describe("[COUNTDOWN-T02] 1분 주기 업데이트 메커니즘", () => {
    test("Given CountdownTimer 렌더링 When 1분 경과 Then 시간이 재계산되어 업데이트", () => {
      // given: 5분 후 만료
      const now = Date.now();
      const scheduledAt = new Date(now + 5 * 60 * 1000).toISOString(); // 5분 후
      const onExpired = jest.fn();

      // when: 렌더링
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 초기 상태 - 0일 1시간 (5분 → 1시간 올림)
      expect(screen.getByText("00")).toBeInTheDocument(); // days
      expect(screen.getByText("01")).toBeInTheDocument(); // hours (5분 올림)

      // when: 1분 경과
      act(() => {
        jest.advanceTimersByTime(60 * 1000); // 1분
      });

      // then: 여전히 0일 (5분 - 1분 = 4분 남음, 올림되어 1시간)
      // 실제로는 4분 남았으므로 여전히 1시간으로 표시됨
      expect(screen.getByText("00")).toBeInTheDocument(); // days
      expect(screen.getByText("01")).toBeInTheDocument(); // hours
    });

    test("Given 2시간 1분 남았을 때 When 1분 경과 Then 2시간으로 업데이트", () => {
      // given
      const now = Date.now();
      jest.setSystemTime(now);
      const scheduledAt = new Date(now + 121 * 60 * 1000).toISOString(); // 121분 = 2시간 1분
      const onExpired = jest.fn();

      // when: serverTime 없이 렌더링 (클라이언트 시간 사용)
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={null}
          onExpired={onExpired}
        />
      );

      // then: 초기 - 0일 3시간 (121분 올림)
      expect(screen.getByText("00")).toBeInTheDocument();
      expect(screen.getByText("03")).toBeInTheDocument(); // 올림

      // when: 1분 시스템 시간 진행 + interval 트리거
      act(() => {
        jest.setSystemTime(now + 60 * 1000);
        jest.advanceTimersByTime(60 * 1000);
      });

      // then: 120분 = 2시간 (올림 없음)
      expect(screen.getByText("00")).toBeInTheDocument();
      expect(screen.getByText("02")).toBeInTheDocument();
    });
  });

  /**
   * [COUNTDOWN-T03] serverTime vs 클라이언트 시간 fallback
   * Risk: R-003 (Score: 6)
   * Priority: P0
   */
  describe("[COUNTDOWN-T03] serverTime vs 클라이언트 시간 fallback", () => {
    test("Given serverTime 제공됨 When CountdownTimer 렌더링 Then serverTime 기준으로 계산", () => {
      // given
      const serverTime = Date.now();
      const scheduledAt = new Date(serverTime + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2일 후
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={serverTime}
          onExpired={onExpired}
        />
      );

      // then: serverTime 기준으로 2일 0시간 표시
      expect(screen.getByText("02")).toBeInTheDocument(); // days
      expect(screen.getByText("00")).toBeInTheDocument(); // hours
    });

    test("Given serverTime이 null When CountdownTimer 렌더링 Then 클라이언트 시간으로 fallback", () => {
      // given
      const now = Date.now();
      const scheduledAt = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2일 후
      const onExpired = jest.fn();

      // when: serverTime=null
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={null}
          onExpired={onExpired}
        />
      );

      // then: 클라이언트 시간 기준으로 계산 (2일)
      expect(screen.getByText("02")).toBeInTheDocument(); // days
      expect(screen.getByText("00")).toBeInTheDocument(); // hours
    });

    test("Given serverTime과 클라이언트 시간이 다를 때 When serverTime 제공 Then serverTime 우선", () => {
      // given: 서버 시간은 현재, 클라이언트 시간은 1시간 앞
      const serverTime = Date.now();
      const scheduledAt = new Date(serverTime + 3 * 60 * 60 * 1000).toISOString(); // 서버 기준 3시간 후

      // Mock Date.now to return different time (1 hour ahead)
      const realDateNow = Date.now;
      Date.now = jest.fn(() => serverTime + 60 * 60 * 1000); // 1시간 앞

      const onExpired = jest.fn();

      try {
        // when
        render(
          <CountdownTimer
            scheduledAt={scheduledAt}
            serverTime={serverTime}
            onExpired={onExpired}
          />
        );

        // then: serverTime 기준 (3시간)이어야 함
        expect(screen.getByText("00")).toBeInTheDocument(); // days
        expect(screen.getByText("03")).toBeInTheDocument(); // hours (서버 기준)
      } finally {
        // cleanup: 테스트 실패해도 항상 복원
        Date.now = realDateNow;
      }
    });
  });

  /**
   * [COUNTDOWN-T04] D-Day 도달 시 onExpired 호출
   * Risk: R-002 (Score: 6)
   * Priority: P0
   */
  describe("[COUNTDOWN-T04] D-Day 도달 시 onExpired 호출", () => {
    test("Given scheduledAt이 59초 후 When 1분 경과 Then onExpired 호출됨", async () => {
      // given: 59초 후 만료
      const now = Date.now();
      jest.setSystemTime(now);
      const scheduledAt = new Date(now + 59 * 1000).toISOString();
      const onExpired = jest.fn();

      // when: 렌더링 (serverTime 없이, 클라이언트 시간 사용)
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={null}
          onExpired={onExpired}
        />
      );

      // then: 초기에는 호출 안 됨
      expect(onExpired).not.toHaveBeenCalled();

      // when: 1분 시스템 시간 진행 + interval 트리거
      act(() => {
        jest.setSystemTime(now + 60 * 1000);
        jest.advanceTimersByTime(60 * 1000);
      });

      // then: onExpired 호출됨
      await waitFor(() => {
        expect(onExpired).toHaveBeenCalledTimes(1);
      });

      // then: 만료 메시지 표시
      expect(screen.getByText("D-Day 도달!")).toBeInTheDocument();
      expect(screen.getByText("✨")).toBeInTheDocument();
    });

    test("Given D-Day가 30초 전 도달 When 60초 경과 Then onExpired 호출 (최대 59초 지연)", async () => {
      // given: 30초 후 만료 (다음 업데이트 주기 전에 만료)
      const now = Date.now();
      jest.setSystemTime(now);
      const scheduledAt = new Date(now + 30 * 1000).toISOString();
      const onExpired = jest.fn();

      // when: 렌더링 (serverTime 없이, 클라이언트 시간 사용)
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={null}
          onExpired={onExpired}
        />
      );

      // when: 30초 시스템 시간 진행 (아직 interval 주기 안 옴)
      act(() => {
        jest.setSystemTime(now + 30 * 1000);
        jest.advanceTimersByTime(30 * 1000);
      });

      // then: 아직 onExpired 호출 안 됨 (지연)
      expect(onExpired).not.toHaveBeenCalled();

      // when: 추가 30초 시스템 시간 진행 (총 60초, interval 트리거)
      act(() => {
        jest.setSystemTime(now + 60 * 1000);
        jest.advanceTimersByTime(30 * 1000);
      });

      // then: onExpired 호출됨 (최대 59초 지연 발생)
      await waitFor(() => {
        expect(onExpired).toHaveBeenCalledTimes(1);
      });
    });
  });

  /**
   * [COUNTDOWN-T05] scheduledAt 과거/미래 경계 테스트
   * Risk: R-001 (Score: 9)
   * Priority: P0
   */
  describe("[COUNTDOWN-T05] scheduledAt 과거/미래 경계 테스트", () => {
    test("Given scheduledAt이 과거 When CountdownTimer 렌더링 Then 즉시 만료 표시", () => {
      // given: 1초 전
      const now = Date.now();
      const scheduledAt = new Date(now - 1000).toISOString();
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 즉시 만료 메시지 표시
      expect(screen.getByText("D-Day 도달!")).toBeInTheDocument();
      expect(screen.getByText("✨")).toBeInTheDocument();
      expect(onExpired).toHaveBeenCalledTimes(1);
    });

    test("Given scheduledAt이 정확히 현재 시간 When 렌더링 Then 만료 처리", () => {
      // given: 정확히 현재
      const now = Date.now();
      const scheduledAt = new Date(now).toISOString();
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 만료 처리 (isPast는 같거나 작으면 true)
      expect(screen.getByText("D-Day 도달!")).toBeInTheDocument();
      expect(onExpired).toHaveBeenCalledTimes(1);
    });

    test("Given scheduledAt이 1초 후 When 렌더링 Then 카운트다운 표시", () => {
      // given: 1초 후
      const now = Date.now();
      const scheduledAt = new Date(now + 1000).toISOString();
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 만료 메시지 없음, 카운트다운 표시
      expect(screen.queryByText("D-Day 도달!")).not.toBeInTheDocument();
      expect(screen.getByText("00")).toBeInTheDocument(); // days
      expect(screen.getByText("01")).toBeInTheDocument(); // hours (올림)
      expect(onExpired).not.toHaveBeenCalled();
    });
  });

  /**
   * [COUNTDOWN-T06] 시간 올림 처리 (59분 → 1시간)
   * Risk: R-001 (Score: 9)
   * Priority: P0
   */
  describe("[COUNTDOWN-T06] 시간 올림 처리", () => {
    test("Given 59분 남음 When CountdownTimer 렌더링 Then 1시간으로 올림 표시", () => {
      // given
      const now = Date.now();
      const scheduledAt = new Date(now + 59 * 60 * 1000).toISOString(); // 59분
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 59분 → 1시간으로 올림
      expect(screen.getByText("00")).toBeInTheDocument(); // days
      expect(screen.getByText("01")).toBeInTheDocument(); // hours (올림)
    });

    test("Given 1분 남음 When 렌더링 Then 1시간으로 올림", () => {
      // given
      const now = Date.now();
      const scheduledAt = new Date(now + 1 * 60 * 1000).toISOString(); // 1분
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 1분 → 1시간으로 올림
      expect(screen.getByText("00")).toBeInTheDocument();
      expect(screen.getByText("01")).toBeInTheDocument();
    });

    test("Given 정확히 1시간 남음 When 렌더링 Then 1시간 표시 (올림 불필요)", () => {
      // given
      const now = Date.now();
      const scheduledAt = new Date(now + 60 * 60 * 1000).toISOString(); // 정확히 1시간
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 1시간 그대로
      expect(screen.getByText("00")).toBeInTheDocument();
      expect(screen.getByText("01")).toBeInTheDocument();
    });
  });

  /**
   * [COUNTDOWN-T07] 24시간 롤오버 처리
   * Risk: R-001 (Score: 9)
   * Priority: P0
   */
  describe("[COUNTDOWN-T07] 24시간 롤오버 처리", () => {
    test("Given remainingHours가 24일 때 When 렌더링 Then 다음 날로 롤오버 (1일 0시간)", () => {
      // given: 정확히 24시간 후
      const now = Date.now();
      const scheduledAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 1일 0시간
      expect(screen.getByText("01")).toBeInTheDocument(); // days
      expect(screen.getByText("00")).toBeInTheDocument(); // hours
    });

    test("Given 23시간 59분 남음 When 렌더링 Then 1일 0시간으로 롤오버", () => {
      // given: 23시간 59분 = 1439분
      const now = Date.now();
      const scheduledAt = new Date(now + 1439 * 60 * 1000).toISOString();
      const onExpired = jest.fn();

      // when
      render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // then: 올림되어 24시간 → 1일 0시간
      expect(screen.getByText("01")).toBeInTheDocument(); // days
      expect(screen.getByText("00")).toBeInTheDocument(); // hours
    });
  });

  /**
   * [COUNTDOWN-T08] useEffect cleanup (clearInterval)
   * Risk: - (메모리 누수 방지)
   * Priority: P1 (하지만 critical한 cleanup)
   */
  describe("[COUNTDOWN-T08] useEffect cleanup", () => {
    test("Given CountdownTimer 렌더링 When unmount Then clearInterval 호출", () => {
      // given
      const now = Date.now();
      const scheduledAt = new Date(now + 5 * 60 * 1000).toISOString();
      const onExpired = jest.fn();

      const setIntervalSpy = jest.spyOn(global, "setInterval");
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      // when: 렌더링
      const { unmount } = render(
        <CountdownTimer
          scheduledAt={scheduledAt}
          serverTime={now}
          onExpired={onExpired}
        />
      );

      // setInterval이 호출되었고 intervalId 캡처
      expect(setIntervalSpy).toHaveBeenCalled();
      const intervalId = setIntervalSpy.mock.results[0]?.value;

      // when: unmount
      unmount();

      // then: 정확히 해당 intervalId로 clearInterval 호출됨
      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });
});

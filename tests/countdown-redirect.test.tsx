import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";
import CountdownPage from "@/app/countdown/[token]/page";
import { useVoteStatus } from "@/hooks/useVoteStatus";

// Mock Next.js hooks
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock custom hooks
jest.mock("@/hooks/useVoteStatus");
jest.mock("@/hooks/useDeviceId", () => ({
  useDeviceId: () => "mock-device-id",
}));
jest.mock("@/lib/i18n/context", () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({
      t,
      language: "ko",
      changeLanguage: jest.fn(),
      isLoading: false,
      isInitialized: true,
    }),
  };
});

// Mock internal components to simplify testing
jest.mock("@/app/countdown/[token]/components/CountdownTimer", () => ({
  CountdownTimer: ({ onExpired }: { onExpired: () => void }) => (
    <div data-testid="countdown-timer">
      <button onClick={onExpired} data-testid="expire-button">
        Expire
      </button>
    </div>
  ),
}));

// Setup default mocks
const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

const mockUseVoteStatus = useVoteStatus as jest.Mock;

describe("카운트다운 페이지 리다이렉션 로직", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default router mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // Default params mock
    (useParams as jest.Mock).mockReturnValue({ token: "test-token" });

    // Default vote status mock
    mockUseVoteStatus.mockReturnValue({
      votes: null,
      hasVoted: false,
      myVote: null,
      isRevealed: false,
      isLoading: false,
      serverTime: null,
      markAsVoted: jest.fn(),
      refetch: jest.fn(),
    });

    // Mock global fetch
    global.fetch = jest.fn();
  });

  it("Given 검증 결과 D-Day가 지났을 때 When 초기 로딩하면 Then /reveal로 리다이렉트해야 한다", async () => {
    // Given: scheduledAt이 과거
    const pastDate = new Date(Date.now() - 10000).toISOString();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          babyName: "Test Baby",
          scheduledAt: pastDate,
          revealId: "test-reveal-id",
          type: "countdown",
        },
      }),
    });

    // When: 컴포넌트 렌더링
    render(<CountdownPage />);

    // Then: 토큰 검증 직후 리다이렉트
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/reveal?token=test-token",
      );
    });
  });

  it("Given 검증 결과 D-Day가 미래일 때 When 초기 로딩하면 Then 카운트다운이 렌더링되어야 한다", async () => {
    // Given: scheduledAt이 미래
    const futureDate = new Date(Date.now() + 100000).toISOString();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          babyName: "Test Baby",
          scheduledAt: futureDate,
          revealId: "test-reveal-id",
          type: "countdown",
        },
      }),
    });

    // When: 컴포넌트 렌더링
    render(<CountdownPage />);

    // Then: 카운트다운 표시, 리다이렉트 없음
    await waitFor(() => {
      expect(screen.getByTestId("countdown-timer")).toBeInTheDocument();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("Given 미래 시각으로 페이지가 열린 상태에서 When CountdownTimer가 onExpired를 호출하면 Then /reveal로 리다이렉트해야 한다", async () => {
    // Given: 미래 시각으로 페이지 로드
    const futureDate = new Date(Date.now() + 100000).toISOString();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          babyName: "Test Baby",
          scheduledAt: futureDate,
          revealId: "test-reveal-id",
          type: "countdown",
        },
      }),
    });

    render(<CountdownPage />);

    // Given: 카운트다운 렌더링 확인
    await waitFor(() => {
      expect(screen.getByTestId("countdown-timer")).toBeInTheDocument();
    });

    // When: 타이머 만료(onExpired) 시뮬레이션
    const expireButton = screen.getByTestId("expire-button");
    fireEvent.click(expireButton);

    // Then: 리다이렉트
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/reveal?token=test-token",
      );
    });
  });
});

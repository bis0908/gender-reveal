import { act, render, screen, waitFor } from "@testing-library/react";
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

describe("CountdownPage Redirection Logic", () => {
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

  it("REDIRECTS to /reveal if verification shows D-Day is past (Initial Load)", async () => {
    // GIVEN: scheduledAt is in the past
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

    // WHEN: Component renders
    await act(async () => {
      render(<CountdownPage />);
    });

    // THEN: Redirect should happen immediately after token verification
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/reveal?token=test-token",
      );
    });
  });

  it("RENDERS countdown if verification shows D-Day is future", async () => {
    // GIVEN: scheduledAt is in the future
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

    // WHEN: Component renders
    await act(async () => {
      render(<CountdownPage />);
    });

    // THEN: Should show countdown timer and NOT redirect
    await waitFor(() => {
      expect(screen.getByTestId("countdown-timer")).toBeInTheDocument();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("REDIRECTS to /reveal when CountdownTimer calls onExpired", async () => {
    // GIVEN: Page is loaded with future date
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

    await act(async () => {
      render(<CountdownPage />);
    });

    // Ensure it loaded
    expect(screen.getByTestId("countdown-timer")).toBeInTheDocument();

    // WHEN: Timer expires (simulate onExpired callback)
    const expireButton = screen.getByTestId("expire-button");
    act(() => {
      expireButton.click();
    });

    // THEN: Should redirect
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/reveal?token=test-token",
      );
    });
  });
});

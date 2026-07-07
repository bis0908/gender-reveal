import { render, screen, within } from "@testing-library/react";
import { Header } from "@/components/header";

jest.mock("@/components/language-selector", () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
}));

jest.mock("@/lib/i18n/context", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "common.genderReveal": "Gender Reveal",
        "nav.home": "홈",
        "nav.createGenderReveal": "Gender Reveal 만들기",
        "nav.examples": "예시",
        "nav.menu": "메뉴 열기",
      })[key] ?? key,
  }),
}));

describe("Header related service link", () => {
  const originalBabySaUrl = process.env.NEXT_PUBLIC_BABY_SA_URL;

  afterEach(() => {
    if (originalBabySaUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BABY_SA_URL;
      return;
    }

    process.env.NEXT_PUBLIC_BABY_SA_URL = originalBabySaUrl;
  });

  it("Given no Baby SA URL is configured When rendering the header Then it does not show the related service link", () => {
    delete process.env.NEXT_PUBLIC_BABY_SA_URL;

    render(<Header />);

    expect(screen.queryByLabelText("관련 서비스")).toBeNull();
    expect(screen.queryByRole("link", { name: "아이쉼" })).toBeNull();
  });

  it("Given the Baby SA URL is configured When rendering the header Then it shows Aishim as a related service header link", () => {
    process.env.NEXT_PUBLIC_BABY_SA_URL = "https://baby-sa.example.com/";

    render(<Header />);

    const relatedServiceNav = screen.getByLabelText("관련 서비스");
    const relatedServiceLabel = within(relatedServiceNav).getByText(
      "관련 서비스",
    );
    const babySaLink = within(relatedServiceNav).getByRole("link", {
      name: "아이쉼",
    });

    expect(relatedServiceNav.closest("header")).toBeTruthy();
    expect(relatedServiceLabel.parentElement).toBe(relatedServiceNav);
    expect(babySaLink.parentElement).toBe(relatedServiceNav);
    expect(
      Array.from(relatedServiceNav.children).indexOf(relatedServiceLabel),
    ).toBeLessThan(Array.from(relatedServiceNav.children).indexOf(babySaLink));
    expect(babySaLink.getAttribute("href")).toBe("https://baby-sa.example.com/");
    expect(babySaLink.getAttribute("target")).toBe("_blank");
    expect(babySaLink.getAttribute("rel")).toBe("noreferrer");
    expect(babySaLink.querySelector("svg.lucide-baby")).toBeTruthy();
  });
});

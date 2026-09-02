import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MobileAppShell } from "@/components/site/MobileAppShell";
import { trackSiteTabSelected } from "@/lib/analytics/siteEvents";

vi.mock("@phosphor-icons/react", () => ({
  SquaresFour: () => <span data-testid="icon-squares" />,
  PencilSimple: () => <span data-testid="icon-pencil" />,
  UsersThree: () => <span data-testid="icon-users" />,
  Buildings: () => <span data-testid="icon-buildings" />,
  UserCircle: () => <span data-testid="icon-user" />,
  MagnifyingGlass: () => <span data-testid="icon-search" />,
}));

vi.mock("@/components/ui/Logo", () => ({
  OneAndOnlyLogo: () => <div data-testid="app-bar-logo" />,
}));

vi.mock("@/components/site/MobileNavDrawer", () => ({
  MobileNavDrawer: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) => (
    <div data-testid="mobile-drawer" data-open={open}>
      <button type="button" onClick={onClose} data-testid="close-drawer">
        Close
      </button>
    </div>
  ),
}));

vi.mock("@/components/site/Footer", () => ({
  SiteFooter: () => <footer data-testid="site-footer">Footer</footer>,
}));

vi.mock("@/components/site/FooterLogoMarquee", () => ({
  FooterLogoMarquee: () => <div data-testid="logo-marquee">Marquee</div>,
}));

vi.mock("@/lib/analytics/siteEvents", () => ({
  trackSiteTabSelected: vi.fn(),
  trackSiteCtaClick: vi.fn(),
  handlePlannerEntryNavigation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

describe("MobileAppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders five tabs and marks Catalog active on /products", () => {
    render(
      <MobileAppShell>
        <div data-testid="shell-child">child</div>
      </MobileAppShell>,
    );

    expect(screen.getByTestId("shell-child")).toBeInTheDocument();
    const tabBar = screen.getByRole("navigation", { name: /Mobile primary/i });
    expect(tabBar).toBeInTheDocument();
    expect(within(tabBar).queryByRole("link", { name: /^home$/i })).toBeNull();
    expect(
      within(tabBar).getByRole("link", { name: /All Products|Catalog/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(tabBar).getByRole("link", { name: "Planner" }),
    ).toHaveAttribute("href", "/planner");
    expect(
      within(tabBar).getByRole("link", { name: "Clients" }),
    ).toHaveAttribute("href", "/clients");
    expect(within(tabBar).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(
      within(tabBar).getByRole("link", { name: /Sign in|Account/i }),
    ).toHaveAttribute("href", "/access");
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
    expect(screen.getByTestId("logo-marquee")).toBeInTheDocument();
  });

  it("opens the nav drawer from the hamburger", () => {
    render(
      <MobileAppShell>
        <span>child</span>
      </MobileAppShell>,
    );

    const menuBtn = screen.getByRole("button", { name: "Open menu" });
    expect(screen.getByTestId("mobile-drawer")).toHaveAttribute(
      "data-open",
      "false",
    );
    fireEvent.click(menuBtn);
    expect(screen.getByTestId("mobile-drawer")).toHaveAttribute(
      "data-open",
      "true",
    );
    fireEvent.click(screen.getByTestId("close-drawer"));
    expect(screen.getByTestId("mobile-drawer")).toHaveAttribute(
      "data-open",
      "false",
    );
  });

  it("opens the search drawer from the app bar", () => {
    render(
      <MobileAppShell>
        <span>child</span>
      </MobileAppShell>,
    );

    const searchBtn = screen.getByRole("button", { name: "Open search" });
    expect(screen.getByTestId("mobile-drawer")).toHaveAttribute(
      "data-open",
      "false",
    );
    fireEvent.click(searchBtn);
    expect(screen.getByTestId("mobile-drawer")).toHaveAttribute(
      "data-open",
      "true",
    );
    fireEvent.click(screen.getByTestId("close-drawer"));
    expect(screen.getByTestId("mobile-drawer")).toHaveAttribute(
      "data-open",
      "false",
    );
  });

  it("emits site_tab_selected when a tab is clicked", () => {
    render(
      <MobileAppShell>
        <span>child</span>
      </MobileAppShell>,
    );

    const tabBar = screen.getByRole("navigation", { name: /Mobile primary/i });
    fireEvent.click(within(tabBar).getByRole("link", { name: "Clients" }));
    expect(trackSiteTabSelected).toHaveBeenCalledWith({
      pathname: "/products",
      tab: "clients",
      destination: "/clients",
    });
  });
});

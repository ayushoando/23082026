import type { ComponentProps, ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA";
import { hasConsentChoice } from "@/lib/consent";
import { routeSuppressesFloatingQuickContact } from "@/features/crm/contactSurfaces";
import { trackSiteCtaClick } from "@/lib/analytics/siteEvents";

vi.mock("@/lib/consent", () => ({
  hasConsentChoice: vi.fn(() => false),
}));

vi.mock("@/lib/analytics/siteEvents", () => ({
  trackSiteCtaClick: vi.fn(),
}));

vi.mock("@/features/site/data/contact", () => ({
  buildWhatsAppHref: vi.fn((text: string) => `https://wa.me/mock?text=${encodeURIComponent(text)}`),
  buildMailtoHref: vi.fn((subject: string) => `mailto:mock@example.com?subject=${encodeURIComponent(subject)}`),
  toTelHref: vi.fn((phone: string) => `tel:${phone}`),
  SITE_CONTACT: {
    supportPhone: "+9111111111",
  },
}));

vi.mock("@/features/crm/contactSurfaces", () => ({
  routeSuppressesFloatingQuickContact: vi.fn(() => false),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/test-path"),
}));

type MotionButtonProps = ComponentProps<"button"> & {
  children?: ReactNode;
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
};

type MotionDivProps = ComponentProps<"div"> & {
  children?: ReactNode;
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};

vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...rest
    }: MotionButtonProps) => <button {...rest}>{children}</button>,
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...rest
    }: MotionDivProps) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

describe("WhatsAppCTA Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null when the route suppresses the CTA", () => {
    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(true);
    const { container } = render(<WhatsAppCTA />);
    expect(container.querySelector("button")).toBeNull();
    expect(screen.queryByRole("button", { name: /WhatsApp quick contact/i })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "Quick contact" })).toBeNull();
  });

  it("renders FAB with raised anchor when consent is not settled", () => {
    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(false);
    vi.mocked(hasConsentChoice).mockReturnValue(false);

    render(<WhatsAppCTA />);

    const fab = screen.getByRole("button", { name: "Open WhatsApp quick contact" });
    expect(fab).toHaveAttribute("aria-expanded", "false");
    expect(fab).toHaveAttribute("aria-controls", "quick-contact-panel");
    expect(fab).toHaveClass("site-fab-launcher--whatsapp");
    expect(fab).toHaveClass("site-fab-anchor--bottom-raised");
    expect(fab).not.toHaveClass("site-fab-anchor--bottom");
    expect(screen.queryByRole("dialog", { name: "Quick contact" })).toBeNull();
  });

  it("renders FAB with standard anchor when consent is settled", () => {
    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(false);
    vi.mocked(hasConsentChoice).mockReturnValue(true);

    render(<WhatsAppCTA />);

    const fab = screen.getByRole("button", { name: "Open WhatsApp quick contact" });
    expect(fab).toHaveClass("site-fab-anchor--bottom");
    expect(fab).not.toHaveClass("site-fab-anchor--bottom-raised");
  });

  it("toggles panel open/close via FAB click with computed hrefs and vi.fn count+args", () => {
    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(false);
    vi.mocked(hasConsentChoice).mockReturnValue(true);

    render(<WhatsAppCTA />);

    const fab = screen.getByRole("button", { name: "Open WhatsApp quick contact" });
    expect(screen.queryByText("Quick contact")).toBeNull();

    fireEvent.click(fab);
    expect(fab).toHaveAttribute("aria-expanded", "true");
    expect(fab).toHaveAttribute("aria-label", "Close WhatsApp quick contact");
    const dialog = screen.getByRole("dialog", { name: "Quick contact" });
    expect(dialog).toHaveAttribute("id", "quick-contact-panel");
    expect(dialog).toHaveClass("quick-contact-panel");
    expect(screen.getByRole("button", { name: "Close quick contact panel" })).toBeInTheDocument();

    const whatsappLink = screen.getByRole("link", { name: /WhatsApp now/i });
    expect(whatsappLink).toHaveAttribute(
      "href",
      "https://wa.me/mock?text=Hi%2C%20I%20need%20help%20with%20my%20workspace%20requirement.",
    );
    expect(whatsappLink).toHaveAttribute("target", "_blank");
    expect(whatsappLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: /Call team/i })).toHaveAttribute("href", "tel:+9111111111");
    expect(screen.getByRole("link", { name: /Email us/i })).toHaveAttribute(
      "href",
      "mailto:mock@example.com?subject=Workspace%20enquiry",
    );

    fireEvent.click(whatsappLink);
    expect(trackSiteCtaClick).toHaveBeenCalledTimes(1);
    expect(trackSiteCtaClick).toHaveBeenCalledWith({
      href: "https://wa.me/mock?text=Hi%2C%20I%20need%20help%20with%20my%20workspace%20requirement.",
      label: "WhatsApp now",
      pathname: "/test-path",
      surface: "quick-contact-panel",
    });

    fireEvent.click(screen.getByRole("link", { name: /Call team/i }));
    expect(trackSiteCtaClick).toHaveBeenCalledTimes(2);
    expect(trackSiteCtaClick).toHaveBeenNthCalledWith(2, {
      href: "tel:+9111111111",
      label: "Call team",
      pathname: "/test-path",
      surface: "quick-contact-panel",
    });

    const footerLink = screen.getByTestId("next-link");
    expect(footerLink).toHaveAttribute("href", "/contact");
    fireEvent.click(footerLink);
    expect(trackSiteCtaClick).toHaveBeenCalledTimes(3);
    expect(trackSiteCtaClick).toHaveBeenNthCalledWith(3, {
      href: "/contact",
      label: "Open full contact page",
      pathname: "/test-path",
      surface: "quick-contact-panel",
    });
    expect(screen.queryByRole("dialog", { name: "Quick contact" })).toBeNull();
  });

  it("closes panel via dedicated close control with fireEvent count", () => {
    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(false);
    vi.mocked(hasConsentChoice).mockReturnValue(true);

    render(<WhatsAppCTA />);
    fireEvent.click(screen.getByRole("button", { name: "Open WhatsApp quick contact" }));
    expect(screen.getByRole("dialog", { name: "Quick contact" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close quick contact panel" }));
    expect(screen.queryByRole("dialog", { name: "Quick contact" })).toBeNull();
    expect(screen.getByRole("button", { name: "Open WhatsApp quick contact" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("reacts to oando-cookie-consent dispatchEvent and swaps FAB anchor", () => {
    let storedCallback: (() => void) | null = null;

    const addSpy = vi.spyOn(window, "addEventListener").mockImplementation(((
      event: string,
      cb: EventListener,
    ) => {
      if (event === "oando-cookie-consent") {
        storedCallback = cb as unknown as () => void;
      }
    }) as typeof window.addEventListener);

    vi.mocked(routeSuppressesFloatingQuickContact).mockReturnValue(false);
    vi.mocked(hasConsentChoice).mockReturnValue(false);

    const { rerender } = render(<WhatsAppCTA />);

    const fabBefore = screen.getByRole("button", { name: "Open WhatsApp quick contact" });
    expect(fabBefore).toHaveClass("site-fab-anchor--bottom-raised");

    vi.mocked(hasConsentChoice).mockReturnValue(true);
    act(() => {
      if (storedCallback) storedCallback();
      window.dispatchEvent(new CustomEvent("oando-cookie-consent", { detail: { value: "accepted" } }));
    });

    rerender(<WhatsAppCTA />);
    expect(screen.getByRole("button", { name: "Open WhatsApp quick contact" })).toHaveClass(
      "site-fab-anchor--bottom",
    );

    addSpy.mockRestore();
  });
});

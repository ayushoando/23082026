import "../../../../helpers/nextIntlServerEnMock";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import RefundAndReturnPolicyPage, { metadata } from "@/app/(site)/refund-and-return-policy/page";
import { REFUND_POLICY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import enMessages from "@/i18n/messages/en.json";
import { expectHomeMarketingShell } from "@/tests/unit/app/(site)/_template.homepage.test";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} data-testid="next-image" />,
}));

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined,
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: () => {},
    context: (fn: () => void) => {
      fn();
      return { revert: () => {} };
    },
    from: () => {},
    to: () => {},
  },
}));

vi.mock("@/lib/helpers/gsapMotion", () => ({
  registerGsapPlugins: () => {},
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: "power3.out",
  GSAP_REVEAL: { y: 24, opacity: 0, duration: 0.85, stagger: 0.11 },
  GSAP_SCROLL_REVEAL: { y: 20, opacity: 0, duration: 0.75, stagger: 0.09 },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/refund-and-return-policy",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="home-contact-teaser" />,
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({ href, children, label }: { href: string; children: string; label: string }) => (
    <a href={href} aria-label={label} data-testid="marketing-cta" data-label={label}>
      {children}
    </a>
  ),
}));

type RefundMessages = (typeof enMessages)["legal"]["refund"];

const refundMessages = enMessages.legal.refund as RefundMessages;

describe("app/(site)/refund-and-return-policy/page.tsx — behavior", () => {
  it("exports canonical SEO metadata with absolute single-brand title", () => {
    expect(metadata).toEqual(REFUND_POLICY_PAGE_METADATA);
    const titleValue =
      typeof REFUND_POLICY_PAGE_METADATA.title === "string"
        ? REFUND_POLICY_PAGE_METADATA.title
        : ((REFUND_POLICY_PAGE_METADATA.title as { absolute?: string })?.absolute ??
          String(REFUND_POLICY_PAGE_METADATA.title));
    expect(titleValue).toMatch(/Refund/);
    expect(REFUND_POLICY_PAGE_METADATA.openGraph?.url).toMatch(/\/refund-and-return-policy\/?$/);
    expect(REFUND_POLICY_PAGE_METADATA.description).toBe(refundMessages.metadataDescription);
    expect(
      (REFUND_POLICY_PAGE_METADATA.alternates as { canonical?: string })?.canonical ??
        REFUND_POLICY_PAGE_METADATA.openGraph?.url,
    ).toBeDefined();
  });

  it("renders marketing shell, legal hero with computed labelling and bronze rule", async () => {
    const jsx = await RefundAndReturnPolicyPage();
    const { container } = render(jsx);

    expectHomeMarketingShell(container);
    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
    expect(screen.getByTestId("home-marketing-layout")).toHaveClass("home-marketing-layout");

    const hero = screen.getByTestId("refund-hero");
    expect(hero).toHaveAttribute("aria-labelledby", "legal-hero-heading");
    expect(hero).toHaveClass("legal-hero");
    expect(hero).toHaveClass("legal-hero--compact");

    const h1 = screen.getByRole("heading", { level: 1, name: refundMessages.heroTitle });
    expect(h1).toHaveAttribute("id", "legal-hero-heading");
    expect(h1).toHaveTextContent(refundMessages.heroTitle);
    expect(screen.queryByText(refundMessages.heroSubtitle)).not.toBeInTheDocument();

    const bronzeRule = container.querySelector(".legal-bronze-rule");
    expect(bronzeRule).not.toBeNull();
    expect(bronzeRule).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".legal-bronze-rule__inner")).not.toBeNull();
    expect(container.querySelector(".legal-bronze-rule__inner")).toHaveClass("home-shell-xl");

    expect(screen.queryByTestId("refund-hero-unknown")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /nonexistent-refund/i })).not.toBeInTheDocument();

    const ldScripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(ldScripts.length).toBeGreaterThanOrEqual(0);
  });

  it("renders aside with source-of-truth kicker and CTA hrefs plus tone variants", async () => {
    const jsx = await RefundAndReturnPolicyPage();
    const { container } = render(jsx);

    const aside = container.querySelector(".legal-aside") as HTMLElement | null;
    expect(aside).not.toBeNull();
    expect(aside).toHaveClass("scheme-panel-dark");
    expect(aside).toHaveClass("legal-aside");
    expect(aside?.querySelector(".typ-label")).not.toBeNull();
    expect(screen.getByText(refundMessages.overviewKicker)).toBeInTheDocument();
    expect(screen.getByText(refundMessages.overviewKicker)).toHaveClass("typ-label");
    expect(screen.getByRole("heading", { level: 2, name: refundMessages.overviewTitle })).toBeInTheDocument();
    expect(screen.getByText(refundMessages.overviewDescription)).toBeInTheDocument();

    const contactLinks = screen.getAllByRole("link", { name: refundMessages.contactSalesDesk });
    expect(contactLinks.some((a) => a.getAttribute("href") === "/contact")).toBe(true);
    expect(contactLinks[0]).toHaveAttribute("aria-label", refundMessages.contactSalesDesk);
    expect(screen.getByRole("link", { name: enMessages.legal.shared.serviceSupport })).toHaveAttribute(
      "href",
      "/service",
    );

    const sections = refundMessages.sections;
    const revealEls = container.querySelectorAll("[data-legal-reveal]");
    expect(revealEls.length).toBeGreaterThanOrEqual(sections.length + 1);

    for (const section of sections) {
      const heading = screen.getByRole("heading", { level: 2, name: section.title });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass("typ-card");
      const article = heading.closest("article") as HTMLElement | null;
      expect(article).not.toBeNull();
      expect(article).toHaveAttribute("data-legal-reveal");
      if (section.tone === "soft") {
        expect(article).toHaveClass("scheme-panel-soft");
      } else {
        expect(article).toHaveClass("scheme-panel");
        expect(article).not.toHaveClass("scheme-panel-soft");
      }
      for (const item of section.items) {
        expect(screen.getByText(item)).toBeInTheDocument();
        const li = screen.getByText(item).closest("li") as HTMLElement | null;
        expect(li).not.toBeNull();
      }
      if ("contactLines" in section && section.contactLines) {
        for (const line of section.contactLines as string[]) {
          expect(within(article as HTMLElement).getByText(line)).toBeInTheDocument();
        }
      }
    }

    const softTitles = sections.filter((s) => s.tone === "soft").map((s) => s.title);
    for (const title of softTitles) {
      const art = screen.getByText(title).closest("article") as HTMLElement | null;
      expect(art).toHaveClass("scheme-panel-soft");
    }

    expect(screen.queryByRole("heading", { name: /nonexistent-section/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("refund-aside-unknown")).not.toBeInTheDocument();
  });

  it("renders route CTA band with computed hrefs, accents, and contact teaser with absence checks", async () => {
    const jsx = await RefundAndReturnPolicyPage();
    const { container } = render(jsx);

    const ctaBandEl = container.querySelector('[data-section="route-cta"]') as HTMLElement;
    expect(ctaBandEl).not.toBeNull();
    expect(ctaBandEl).toHaveClass("marketing-cta-band");
    expect(within(ctaBandEl).getByText(refundMessages.ctaKicker)).toBeInTheDocument();
    expect(within(ctaBandEl).getByText(refundMessages.ctaDescription)).toBeInTheDocument();
    const ctaHeading = within(ctaBandEl).getByRole("heading", { level: 2, name: new RegExp(refundMessages.ctaTitleLead) });
    expect(ctaHeading).toBeInTheDocument();
    expect(ctaHeading).toHaveTextContent(refundMessages.ctaTitleAccent);

    expect(within(ctaBandEl).getByRole("link", { name: refundMessages.ctaPrimary })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(within(ctaBandEl).getByRole("link", { name: refundMessages.ctaSecondary })).toHaveAttribute(
      "href",
      "/terms",
    );

    expect(screen.getByTestId("home-contact-teaser")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nonexistent-cta/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("refund-unknown")).not.toBeInTheDocument();

    const articles = container.querySelectorAll("article");
    expect(articles.length).toBe(refundMessages.sections.length);
  });
});

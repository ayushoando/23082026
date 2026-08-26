import "../../../../helpers/nextIntlServerEnMock";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import TermsPage, { metadata } from "@/app/(site)/terms/page";
import { TERMS_PAGE_METADATA } from "@/features/site/data/routeMetadata";
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
  usePathname: () => "/terms",
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

type TermsMessages = (typeof enMessages)["legal"]["terms"];
type ImprintMessages = (typeof enMessages)["legal"]["imprint"];

const termsMessages = enMessages.legal.terms as TermsMessages;
const imprintMessages = enMessages.legal.imprint as ImprintMessages;

describe("app/(site)/terms/page.tsx — behavior", () => {
  it("exports canonical SEO metadata with absolute single-brand title", () => {
    expect(metadata).toEqual(TERMS_PAGE_METADATA);
    expect(TERMS_PAGE_METADATA.alternates).toHaveProperty("canonical");
    const titleValue =
      typeof TERMS_PAGE_METADATA.title === "string"
        ? TERMS_PAGE_METADATA.title
        : ((TERMS_PAGE_METADATA.title as { absolute?: string })?.absolute ?? String(TERMS_PAGE_METADATA.title));
    expect(titleValue).toMatch(/Terms/);
    expect(TERMS_PAGE_METADATA.openGraph?.url).toMatch(/\/terms\/?$/);
  });

  it("renders marketing shell, legal hero with computed labelling and bronze rule", async () => {
    const jsx = await TermsPage();
    const { container } = render(jsx);

    expectHomeMarketingShell(container);
    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
    expect(screen.getByTestId("home-marketing-layout")).toHaveClass("home-marketing-layout");

    const hero = screen.getByTestId("terms-hero");
    expect(hero).toHaveAttribute("aria-labelledby", "legal-hero-heading");
    expect(hero).toHaveClass("legal-hero");
    expect(hero).toHaveClass("legal-hero--compact");

    const h1 = screen.getByRole("heading", { level: 1, name: termsMessages.title });
    expect(h1).toHaveAttribute("id", "legal-hero-heading");
    expect(h1).toHaveTextContent(termsMessages.title);
    expect(screen.queryByText(termsMessages.heroSubtitle)).not.toBeInTheDocument();

    const bronzeRule = container.querySelector(".legal-bronze-rule");
    expect(bronzeRule).not.toBeNull();
    expect(bronzeRule).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".legal-bronze-rule__inner")).not.toBeNull();
    expect(container.querySelector(".legal-bronze-rule__inner")).toHaveClass("home-shell-xl");

    expect(screen.queryByTestId("terms-hero-unknown")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /nonexistent-terms/i })).not.toBeInTheDocument();

    const ldScripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(ldScripts.length).toBeGreaterThanOrEqual(0);
  });

  it("renders aside with source-of-truth kicker and CTA hrefs plus legal sections iterated", async () => {
    const jsx = await TermsPage();
    const { container } = render(jsx);

    // aside
    const aside = container.querySelector(".legal-aside") as HTMLElement | null;
    expect(aside).not.toBeNull();
    expect(aside).toHaveClass("scheme-panel-soft");
    expect(aside).toHaveClass("legal-aside");
    expect(aside?.querySelector(".typ-label")).not.toBeNull();
    expect(screen.getByText(termsMessages.overviewKicker)).toBeInTheDocument();
    expect(screen.getByText(termsMessages.overviewKicker)).toHaveClass("typ-label");
    expect(screen.getByRole("heading", { level: 2, name: termsMessages.overviewTitle })).toBeInTheDocument();
    expect(screen.getByText(termsMessages.overviewDescription)).toBeInTheDocument();
    expect(screen.getByText(termsMessages.asideGuidance)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: termsMessages.viewRefundPolicy })).toHaveAttribute("href", "/refund-and-return-policy");
    expect(screen.getByRole("link", { name: termsMessages.viewRefundPolicy })).toHaveAttribute("aria-label", termsMessages.viewRefundPolicy);
    expect(screen.getByRole("link", { name: "Service and support" })).toHaveAttribute("href", "/service");

    // sections source-of-truth iteration
    const sections = termsMessages.sections;
    const revealArticles = container.querySelectorAll("[data-legal-reveal]");
    // aside + each section + imprint headings etc share reveal, so count >= sections.length
    expect(revealArticles.length).toBeGreaterThanOrEqual(sections.length);

    for (const section of sections) {
      expect(screen.getByText(section.heading)).toBeInTheDocument();
      expect(screen.getByText(section.body)).toBeInTheDocument();
      const heading = screen.getByRole("heading", { level: 2, name: section.heading });
      expect(heading).toHaveClass("typ-card");
    }

    // tone variant: first article uses dark, rest use soft/regular
    const firstArticle = screen.getByText(sections[0].heading).closest("article") as HTMLElement | null;
    expect(firstArticle).not.toBeNull();
    expect(firstArticle).toHaveClass("scheme-panel-dark");
    const secondArticle = screen.getByText(sections[1].heading).closest("article") as HTMLElement | null;
    expect(secondArticle).not.toBeNull();
    expect(secondArticle).toHaveClass("scheme-panel");

    // lead section extra CTAs — also appears in CTA band, so scope to lead article
    const leadArticle = screen.getByText(sections[0].heading).closest("article") as HTMLElement;
    expect(within(leadArticle).getByRole("link", { name: termsMessages.privacyPolicy })).toHaveAttribute("href", "/privacy");
    expect(within(leadArticle).getByRole("link", { name: termsMessages.askCommercialDesk })).toHaveAttribute("href", "/contact");

    // non-existent heading absent
    expect(screen.queryByRole("heading", { name: /nonexistent-section/i })).not.toBeInTheDocument();
  });

  it("renders imprint with source-of-truth lines, route CTA band, and contact teaser", async () => {
    const jsx = await TermsPage();
    const { container } = render(jsx);

    const imprint = document.getElementById("imprint");
    expect(imprint).not.toBeNull();
    expect(imprint).toHaveAttribute("aria-labelledby", "terms-imprint-heading");
    expect(imprint).toHaveClass("scheme-panel");
    expect(imprint).toHaveClass("scroll-mt-24");

    expect(screen.getByRole("heading", { level: 2, name: imprintMessages.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: imprintMessages.title })).toHaveAttribute("id", "terms-imprint-heading");
    expect(screen.getByText(imprintMessages.overviewKicker)).toBeInTheDocument();
    expect(screen.getByText(imprintMessages.overviewDescription)).toBeInTheDocument();

    const imprintSections = imprintMessages.sections;
    for (const section of imprintSections) {
      const h3 = screen.getByRole("heading", { level: 3, name: section.heading });
      expect(h3).toBeInTheDocument();
      expect(h3).toHaveClass("typ-card");
      const card = h3.closest("article") as HTMLElement | null;
      expect(card).not.toBeNull();
      expect(card).toHaveClass("scheme-panel-soft");
      for (const line of section.lines) {
        expect(within(card as HTMLElement).getByText(line)).toBeInTheDocument();
      }
    }
    expect(screen.getByText("One and Only Furniture")).toBeInTheDocument();
    expect(screen.getByText("Email: sales@oando.co.in")).toBeInTheDocument();

    // RouteCtaBand — kicker, title lead/accent, description, hrefs (scoped — also in lead article)
    const ctaBandEl = container.querySelector('[data-section="route-cta"]') as HTMLElement;
    expect(ctaBandEl).not.toBeNull();
    expect(within(ctaBandEl).getByText(termsMessages.ctaKicker)).toBeInTheDocument();
    expect(within(ctaBandEl).getByText(termsMessages.ctaDescription)).toBeInTheDocument();
    const ctaHeading = within(ctaBandEl).getByRole("heading", { level: 2, name: new RegExp(termsMessages.ctaTitleLead) });
    expect(ctaHeading).toBeInTheDocument();
    expect(ctaHeading).toHaveTextContent(termsMessages.ctaTitleAccent);

    expect(within(ctaBandEl).getByRole("link", { name: termsMessages.ctaPrimary })).toHaveAttribute("href", "/contact");
    expect(within(ctaBandEl).getByRole("link", { name: termsMessages.ctaSecondary })).toHaveAttribute("href", "/privacy");
    expect(ctaBandEl).toHaveClass("marketing-cta-band");

    expect(screen.getByTestId("home-contact-teaser")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nonexistent-cta/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("imprint-unknown")).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TRUSTED_BY_PAGE_COPY } from "@/features/site/data/routeCopy";
import { TRUSTED_BY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { TRUSTED_BY_STATS, TRUSTED_BY_CLIENTS } from "@/features/site/data/proof";

vi.mock("@/lib/helpers/gsapMotion", () => ({
  registerGsapPlugins: () => {},
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: "power3.out",
  GSAP_REVEAL: { y: 24, opacity: 0, duration: 0.85, stagger: 0.11 },
  GSAP_SCROLL_REVEAL: { y: 20, opacity: 0, duration: 0.75, stagger: 0.09 },
}));

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined,
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    context: (fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    },
    from: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock("next/image", () => ({
  default: (props: { src: string; className?: string; alt?: string }) => (
    <img src={props.src} className={props.className} alt={props.alt ?? ""} />
  ),
}));

vi.mock("@/components/site/EditorialHeroMedia", () => ({
  EditorialHeroMedia: ({ image }: { image: { alt: string; src: string } }) => (
    <div data-testid="mock-editorial-hero-media" data-alt={image.alt} data-src={image.src} />
  ),
}));

vi.mock("@/components/home/layout", () => ({
  HomeMarketingLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="home-marketing-layout">{children}</div>
  ),
  HomeSection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  HomeSectionInner: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="mock-contact-teaser" />,
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({ children, href, label }: { children: React.ReactNode; href: string; label: string }) => (
    <a href={href} aria-label={label} data-testid="mock-marketing-cta">
      {children}
    </a>
  ),
}));

vi.mock("@/components/shared/RouteCtaBand", () => ({
  RouteCtaBand: ({
    kicker,
    title,
    description,
    actions,
  }: {
    kicker?: string;
    title: React.ReactNode;
    description: React.ReactNode;
    actions: { href: string; label: string }[];
  }) => (
    <div data-testid="mock-route-cta-band">
      {kicker ? <p>{kicker}</p> : null}
      <h2>{title}</h2>
      <p>{description}</p>
      <div>
        {actions.map((a) => (
          <a key={`${a.href}-${a.label}`} href={a.href}>
            {a.label}
          </a>
        ))}
      </div>
    </div>
  ),
}));

import TrustedByPage from "@/app/(site)/trusted-by/page";

describe("app/(site)/trusted-by/page.tsx", () => {
  it("exports canonical SEO metadata with absolute single-brand title", () => {
    expect(TRUSTED_BY_PAGE_METADATA.alternates?.canonical).toMatch(/\/trusted-by\/?$/);
    const titleValue =
      typeof TRUSTED_BY_PAGE_METADATA.title === "string"
        ? TRUSTED_BY_PAGE_METADATA.title
        : ((TRUSTED_BY_PAGE_METADATA.title as { absolute?: string })?.absolute ?? String(TRUSTED_BY_PAGE_METADATA.title));
    expect(titleValue).toMatch(/Trusted by/);
    expect(titleValue).toMatch(/One&Only/);
    expect(TRUSTED_BY_PAGE_METADATA.openGraph?.url).toMatch(/\/trusted-by\/?$/);
    expect(TRUSTED_BY_PAGE_METADATA.description).toBe(TRUSTED_BY_PAGE_COPY.heroSubtitle);
  });

  it("renders marketing layout with hero labelled region and editorial copy", () => {
    const { container } = render(<TrustedByPage />);

    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();

    const hero = screen.getByTestId("trusted-by-hero");
    expect(hero).toHaveAttribute("aria-labelledby", "trusted-by-hero-heading");
    expect(hero).toHaveClass("trusted-by-hero");

    const h1 = screen.getByRole("heading", { level: 1, name: /Trusted/i });
    expect(h1).toHaveAttribute("id", "trusted-by-hero-heading");
    expect(h1).toHaveTextContent(TRUSTED_BY_PAGE_COPY.heroTitleLead);
    expect(h1).toHaveTextContent(TRUSTED_BY_PAGE_COPY.heroTitleAccent);
    expect(screen.queryByText(TRUSTED_BY_PAGE_COPY.heroKicker)).not.toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.heroSubtitle)).toBeInTheDocument();

    expect(screen.getByTestId("mock-editorial-hero-media")).toBeInTheDocument();
    expect(screen.getByTestId("mock-editorial-hero-media")).toHaveAttribute("data-alt", "Institutional workspace delivery by One and Only");

    // Hero CTA uses ctaSecondary -> /clients (also appears in footer CTA band; scope to hero)
    const heroEl = screen.getByTestId("trusted-by-hero");
    expect(within(heroEl).getByRole("link", { name: TRUSTED_BY_PAGE_COPY.ctaSecondary })).toHaveAttribute("href", "/clients");

    // Story section
    expect(screen.getByTestId("trusted-by-story")).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.overviewKicker)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: TRUSTED_BY_PAGE_COPY.overviewTitle })).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.overviewDescription)).toBeInTheDocument();

    expect(screen.getByTestId("trusted-by-roster")).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_CLIENTS[0].name)).toBeInTheDocument();

    const ldScripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(ldScripts.length).toBeGreaterThanOrEqual(2);
  });

  it("iterates stats, palette, quotes, and sectors from source-of-truth", () => {
    const { container } = render(<TrustedByPage />);

    // Stats band - group label from statsKicker
    const statsGroup = screen.getByRole("group", { name: TRUSTED_BY_PAGE_COPY.statsKicker });
    expect(statsGroup).toBeInTheDocument();
    const statItems = container.querySelectorAll(".proof-kpi-band__item");
    expect(statItems).toHaveLength(TRUSTED_BY_STATS.length);
    // 120+ appears twice (Projects + Selected orgs) — verify unique labels and scoped values
    expect(screen.getByText("Years of experience")).toBeInTheDocument();
    expect(screen.getByText("Projects completed")).toBeInTheDocument();
    expect(screen.getByText("Selected organisations")).toBeInTheDocument();
    expect(screen.getByText("Locations serviced")).toBeInTheDocument();
    expect(screen.getAllByText("120+")).toHaveLength(2);
    expect(screen.getByText("14+")).toBeInTheDocument();
    expect(screen.getByText("20+")).toBeInTheDocument();

    // Client roster
    expect(screen.getByTestId("trusted-by-roster")).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.rosterKicker)).toBeInTheDocument();
    expect(screen.queryByText(TRUSTED_BY_PAGE_COPY.rosterTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(TRUSTED_BY_PAGE_COPY.rosterDescription)).not.toBeInTheDocument();
    const badges = container.querySelectorAll(".client-badge");
    expect(badges).toHaveLength(TRUSTED_BY_CLIENTS.length);
    expect(screen.getByText("Titan")).toBeInTheDocument();
    expect(screen.getByText("HDFC")).toBeInTheDocument();

    // Quotes section
    expect(screen.getByTestId("trusted-by-quotes")).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.quotesKicker)).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.quotesTitle)).toBeInTheDocument();
    const quoteBlocks = container.querySelectorAll(".clients-pull-quote");
    expect(quoteBlocks).toHaveLength(TRUSTED_BY_PAGE_COPY.quotes.length);
    TRUSTED_BY_PAGE_COPY.quotes.forEach((q) => {
      expect(screen.getByText(q.quote)).toBeInTheDocument();
      expect(screen.getByText(q.attribution)).toBeInTheDocument();
    });

    // Sectors derived from TRUSTED_BY_CLIENTS unique sectors
    const expectedSectors = Array.from(new Set(TRUSTED_BY_CLIENTS.map((c) => c.sector)));
    expect(screen.getByTestId("trusted-by-sectors")).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.sectorsKicker)).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.sectorsTitle)).toBeInTheDocument();
    expect(screen.getByText(TRUSTED_BY_PAGE_COPY.sectorsDescription)).toBeInTheDocument();
    const sectorRows = container.querySelectorAll(".trusted-by-sector-row");
    expect(sectorRows).toHaveLength(expectedSectors.length);
    expectedSectors.forEach((sector) => {
      expect(within(screen.getByTestId("trusted-by-sectors")).getByText(sector)).toBeInTheDocument();
    });
    // Ensure no duplicate sector rendering
    expect(new Set(Array.from(sectorRows).map((el) => el.textContent?.trim())).size).toBe(expectedSectors.length);
  });

  it("renders CTA band with computed hrefs, and contact teaser", () => {
    render(<TrustedByPage />);

    expect(screen.queryByText(TRUSTED_BY_PAGE_COPY.craftQuote)).not.toBeInTheDocument();
    expect(screen.queryByText(TRUSTED_BY_PAGE_COPY.craftAttribution)).not.toBeInTheDocument();

    const ctaBand = screen.getByTestId("mock-route-cta-band");
    expect(ctaBand).toBeInTheDocument();
    expect(within(ctaBand).getByText(TRUSTED_BY_PAGE_COPY.ctaKicker)).toBeInTheDocument();
    expect(within(ctaBand).getByText(TRUSTED_BY_PAGE_COPY.ctaDescription)).toBeInTheDocument();
    // Title lead+accent rendered inside h2
    expect(within(ctaBand).getByRole("heading", { level: 2 })).toHaveTextContent(TRUSTED_BY_PAGE_COPY.ctaTitleLead);
    expect(within(ctaBand).getByRole("heading", { level: 2 })).toHaveTextContent(TRUSTED_BY_PAGE_COPY.ctaTitleAccent);

    expect(within(ctaBand).getByRole("link", { name: TRUSTED_BY_PAGE_COPY.ctaPrimary })).toHaveAttribute("href", "/contact");
    expect(within(ctaBand).getByRole("link", { name: TRUSTED_BY_PAGE_COPY.ctaSecondary })).toHaveAttribute("href", "/clients");

    expect(screen.getByTestId("mock-contact-teaser")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nonexistent-cta/i })).not.toBeInTheDocument();
  });
});

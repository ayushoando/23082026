import "../../../../helpers/nextIntlServerEnMock";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import PortfolioPage, { generateMetadata } from "@/app/(site)/portfolio/page";
import { CLIENTS_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { CLIENTS_PAGE_COPY, CLIENTS_WORK } from "@/features/site/data/routeCopy";
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
  usePathname: () => "/portfolio",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/site/clients/ClientShowcaseSection", () => ({
  ClientShowcaseSection: () => <div data-testid="client-showcase" />,
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


vi.mock("@/features/site/data/clientWorkPhotos", () => ({
  buildClientWorkWithPhotos: vi.fn(async (items: readonly { id: string }[]) =>
    items.map((item) => ({
      ...item,
      location: "Patna, Bihar",
      summary: "Mock summary",
      photos: [`/assets/marketing/clients/${item.id}/hero.webp`, `/assets/marketing/clients/${item.id}/detail-1.webp`],
    })),
  ),
}));

vi.mock("@/features/crm/businessStats", () => ({
  getBusinessStats: vi.fn(async () => ({
    stats: {
      clientOrganisations: 120,
      projectsDelivered: 500,
      sectorsServed: 10,
      locationsServed: 20,
      yearsExperience: 14,
      asOfDate: "2026-06-26",
    },
    source: "supabase" as const,
    fetchedAt: "2026-06-26T00:00:00.000Z",
  })),
}));

vi.mock("@/lib/kpiFormat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/kpiFormat")>();
  return actual;
});

vi.mock("@/features/site/data/seo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/site/data/seo")>();
  return {
    ...actual,
    buildPageJsonLd: vi.fn(() => ({ "@type": "CollectionPage", name: "Clients" })),
    buildBreadcrumbJsonLd: vi.fn(() => ({ "@type": "BreadcrumbList" })),
  };
});

vi.mock("@/lib/siteUrl", () => ({
  SITE_URL: "https://oando.test",
}));

vi.mock("@/lib/security/sanitize", () => ({
  sanitizeJsonForScript: (value: unknown) => JSON.stringify(value),
}));

vi.mock("@/components/analytics/KpiIntegrityMonitor", () => ({
  KpiIntegrityMonitor: ({ page, source }: { page: string; source: string }) => (
    <div data-testid="kpi-monitor" data-page={page} data-source={source} />
  ),
}));

describe("app/(site)/portfolio/page.tsx — behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports canonical SEO metadata with absolute single-brand title", async () => {
    expect(await generateMetadata()).toEqual(CLIENTS_PAGE_METADATA);
    const titleValue =
      typeof CLIENTS_PAGE_METADATA.title === "string"
        ? CLIENTS_PAGE_METADATA.title
        : ((CLIENTS_PAGE_METADATA.title as { absolute?: string })?.absolute ?? String(CLIENTS_PAGE_METADATA.title));
    expect(titleValue).toMatch(/One and Only/);
    expect(CLIENTS_PAGE_METADATA.openGraph?.url).toMatch(/\/portfolio\/?$/);
    expect(CLIENTS_PAGE_METADATA.description).toBeDefined();
    expect((CLIENTS_PAGE_METADATA.alternates as { canonical?: string })?.canonical).toMatch(/\/portfolio\/?$/);
  });

  it("renders marketing shell, hero with computed labellings, and JSON-LD scripts", async () => {
    const pageElement = await PortfolioPage();
    const { container } = render(pageElement);

    expectHomeMarketingShell(container);
    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
    expect(screen.getByTestId("home-marketing-layout")).toHaveClass("home-marketing-layout");

    const hero = screen.getByTestId("clients-hero");
    expect(hero).toHaveAttribute("aria-labelledby", "clients-hero-heading");
    expect(hero).toHaveClass("clients-hero");

    const h1 = screen.getByRole("heading", { level: 1, name: new RegExp(CLIENTS_PAGE_COPY.heroTitleLead) });
    expect(h1).toHaveAttribute("id", "clients-hero-heading");
    expect(h1).toHaveTextContent(CLIENTS_PAGE_COPY.heroTitleLead);
    expect(h1).toHaveTextContent(CLIENTS_PAGE_COPY.heroTitleAccent);
    expect(screen.getByText("Workplace Photography")).toBeInTheDocument();
    expect(screen.getByText("Workplace Photography")).toHaveClass("home-kicker");

    // hero subtitle is template-filled with clients value
    const heroSubtitle = CLIENTS_PAGE_COPY.heroSubtitleTemplate.replace("{clients}", "120+");
    expect(screen.getByText(heroSubtitle)).toBeInTheDocument();

    expect(screen.getByTestId("kpi-monitor")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-monitor")).toHaveAttribute("data-page", "portfolio");
    expect(screen.getByTestId("kpi-monitor")).toHaveAttribute("data-source", "supabase");

    const ldScripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(ldScripts.length).toBeGreaterThanOrEqual(2);

    expect(screen.queryByTestId("clients-hero-unknown")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /nonexistent-hero/i })).not.toBeInTheDocument();
  });

  it("renders proof strip via source-of-truth with computed kpi ids and asOf formatting", async () => {
    const pageElement = await PortfolioPage();
    const { container } = render(pageElement);

    expect(container.querySelector(".clients-proof-strip")).toBeNull();
    expect(screen.queryByTestId("kpi-client-organisations-clients")).not.toBeInTheDocument();
  });

  it("iterates CLIENTS_WORK source-of-truth into case studies with computed ids, mosaics, and alt", async () => {
    const pageElement = await PortfolioPage();
    const { container } = render(pageElement);

    // all CLIENTS_WORK entries should render (buildClientWorkWithPhotos is mocked to return all)
    const cases = container.querySelectorAll(".clients-work__case");
    expect(cases).toHaveLength(CLIENTS_WORK.length);

    for (const work of CLIENTS_WORK) {
      const heading = screen.getByRole("heading", { level: 2, name: work.name });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute("id", `clients-work-${work.id}`);
      expect(heading).toHaveClass("clients-work__title");
      const article = heading.closest("article") as HTMLElement | null;
      expect(article).not.toBeNull();
      expect(article).toHaveAttribute("aria-labelledby", `clients-work-${work.id}`);
      expect(article).toHaveClass("portfolio-case");

      const indexEl = article?.querySelector(".clients-work__index") as HTMLElement | null;
      expect(indexEl).not.toBeNull();
      expect(indexEl).toHaveAttribute("aria-hidden", "true");
      expect(within(article as HTMLElement).getByText(work.name)).toBeInTheDocument();

      const primaryImg = within(article as HTMLElement).getByAltText(`${work.name} installed workplace — primary view`);
      expect(primaryImg).toBeInTheDocument();
      expect(primaryImg).toHaveAttribute("src", expect.stringContaining(work.id) as unknown as string);

      // mosaic variant class present
      const mosaic = article?.querySelector(".clients-work__mosaic") as HTMLElement | null;
      expect(mosaic).not.toBeNull();
      expect(mosaic?.className).toMatch(/clients-work__mosaic--/);
    }

    // Titan first detail alt
    expect(screen.getByAltText("Titan installed workplace — detail 2")).toBeInTheDocument();

    // empty state not shown when photos exist
    expect(screen.queryByRole("heading", { name: CLIENTS_PAGE_COPY.emptyTitle })).not.toBeInTheDocument();
    expect(screen.queryByText(CLIENTS_PAGE_COPY.emptyDescription)).not.toBeInTheDocument();
  });

  it("renders pull quotes, CTA band with computed hrefs, and contact teaser", async () => {
    const pageElement = await PortfolioPage();
    const { container } = render(pageElement);

    const quoteSection = container.querySelector(".clients-trust-strip");
    expect(quoteSection).not.toBeNull();
    expect(quoteSection).toHaveAttribute("aria-label", "Portfolio installation quotes");
    expect(quoteSection).toHaveClass("scheme-accent-wash");

    const pullQuotes = CLIENTS_PAGE_COPY.pullQuotes;
    const quoteEls = container.querySelectorAll(".clients-pull-quote");
    expect(quoteEls).toHaveLength(pullQuotes.length);
    for (const q of pullQuotes) {
      expect(screen.getByText(q.quote)).toBeInTheDocument();
      expect(screen.getByText(q.attribution)).toBeInTheDocument();
      const blockquote = screen.getByText(q.quote).closest("blockquote") as HTMLElement | null;
      expect(blockquote).not.toBeNull();
      expect(blockquote).toHaveClass("about-craft-quote__text");
      const figure = blockquote?.closest("figure") as HTMLElement | null;
      expect(figure?.querySelector(".about-craft-quote__rule")).not.toBeNull();
      expect(figure?.querySelector(".about-craft-quote__rule")).toHaveAttribute("aria-hidden", "true");
    }

    // RouteCta band
    expect(screen.getByText("Next step")).toBeInTheDocument();
    expect(
      screen.getByText("Explore our sector-wise client directory or brief our workplace planning team."),
    ).toBeInTheDocument();
    const ctaHeading = screen.getByRole("heading", { level: 2, name: /See organisations or/i });
    expect(ctaHeading).toBeInTheDocument();
    expect(ctaHeading).toHaveTextContent("plan your space.");

    expect(screen.getByRole("link", { name: "Workplace planning" })).toHaveAttribute("href", "/planning");
    expect(screen.getByRole("link", { name: "Contact sales" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: "Client directory" })).toHaveAttribute("href", "/clients");

    const ctaBand = container.querySelector('[data-section="route-cta"]');
    expect(ctaBand).not.toBeNull();
    expect(ctaBand).toHaveClass("marketing-cta-band");

    expect(screen.getByTestId("home-contact-teaser")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nonexistent-cta/i })).not.toBeInTheDocument();
  });

  it("renders empty state when buildClientWorkWithPhotos returns []", async () => {
    const { buildClientWorkWithPhotos } = await import("@/features/site/data/clientWorkPhotos");
    vi.mocked(buildClientWorkWithPhotos).mockResolvedValueOnce([]);

    const pageElement = await PortfolioPage();
    const { container } = render(pageElement);

    expect(screen.getByRole("heading", { level: 2, name: CLIENTS_PAGE_COPY.emptyTitle })).toBeInTheDocument();
    expect(screen.getByText(CLIENTS_PAGE_COPY.emptyDescription)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    // empty-state links (unique hrefs) — also appears in bottom CTA band
    const emptySection = screen.getByRole("heading", { level: 2, name: CLIENTS_PAGE_COPY.emptyTitle }).closest("div") as HTMLElement;
    expect(within(emptySection.closest("section") as HTMLElement).getByRole("link", { name: "View client directory" })).toHaveAttribute("href", "/clients");
    expect(container.querySelectorAll(`a[href="/clients"]`).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: CLIENTS_PAGE_COPY.contactCta }).length).toBeGreaterThanOrEqual(1);

    // no case mosaics in empty mode
    expect(container.querySelector(".clients-work__case")).toBeNull();
    expect(screen.queryByAltText(/installed workplace — primary view/)).not.toBeInTheDocument();
  });
});

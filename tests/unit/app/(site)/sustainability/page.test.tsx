import "@/tests/helpers/nextIntlServerEnMock";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SUSTAINABILITY_PAGE_COPY } from "@/features/site/data/routeCopy";
import { SUSTAINABILITY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { SUSTAINABILITY_HERO_IMAGE, SUSTAINABILITY_STORY_IMAGE } from "@/features/site/data/sustainabilityPage";
import { expectHomeMarketingShell } from "@/tests/unit/app/(site)/_template.homepage.test";

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
  default: (props: { alt?: string; src?: string }) => (
    <img alt={props.alt ?? ""} src={props.src ?? ""} data-testid="mock-next-image" />
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
  ContactTeaser: () => <div data-testid="ContactTeaser" />,
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

import SustainabilityPage, { generateMetadata } from "@/app/(site)/sustainability/page";

describe("app/(site)/sustainability/page.tsx — behavior", () => {
  it("exports canonical SEO metadata with absolute single-brand title", async () => {
    expect(await generateMetadata()).toEqual(SUSTAINABILITY_PAGE_METADATA);
    const titleValue =
      typeof SUSTAINABILITY_PAGE_METADATA.title === "string"
        ? SUSTAINABILITY_PAGE_METADATA.title
        : ((SUSTAINABILITY_PAGE_METADATA.title as { absolute?: string })?.absolute ?? String(SUSTAINABILITY_PAGE_METADATA.title));
    expect(titleValue).toMatch(/Sustainable|Sustainability/);
    expect(titleValue).toMatch(/One&Only/);
    expect(SUSTAINABILITY_PAGE_METADATA.openGraph?.url).toMatch(/\/sustainability\/?$/);
    expect(SUSTAINABILITY_PAGE_METADATA.description).toBe(SUSTAINABILITY_PAGE_COPY.heroSubtitle);
  });

  it("renders marketing shell, hero labelled region, editorial hero media, and craft quote", async () => {
    const { container } = render(await SustainabilityPage());

    expectHomeMarketingShell(container);
    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();

    const hero = screen.getByTestId("sustainability-hero");
    expect(hero).toHaveAttribute("aria-labelledby", "sustainability-hero-heading");
    expect(hero).toHaveClass("sustainability-hero");

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveAttribute("id", "sustainability-hero-heading");
    expect(h1).toHaveTextContent(SUSTAINABILITY_PAGE_COPY.heroTitleLead);
    expect(h1).toHaveTextContent(SUSTAINABILITY_PAGE_COPY.heroTitleAccent);
    expect(screen.getByText(SUSTAINABILITY_PAGE_COPY.heroKicker)).toBeInTheDocument();
    expect(screen.getByText(SUSTAINABILITY_PAGE_COPY.heroKicker)).toHaveClass("home-kicker");
    expect(screen.queryByText(SUSTAINABILITY_PAGE_COPY.heroSubtitle)).not.toBeInTheDocument();

    expect(screen.getByTestId("mock-editorial-hero-media")).toBeInTheDocument();
    expect(screen.getByTestId("mock-editorial-hero-media")).toHaveAttribute("data-alt", SUSTAINABILITY_HERO_IMAGE.alt);
    expect(screen.getByTestId("mock-editorial-hero-media")).toHaveAttribute("data-src", SUSTAINABILITY_HERO_IMAGE.src);

    const heroEl = screen.getByTestId("sustainability-hero");
    expect(within(heroEl).getByRole("link", { name: SUSTAINABILITY_PAGE_COPY.heroCta })).toHaveAttribute("href", "/products");
    expect(within(heroEl).getByRole("link", { name: SUSTAINABILITY_PAGE_COPY.heroCta })).toHaveAttribute("aria-label", SUSTAINABILITY_PAGE_COPY.heroCta);

    expect(screen.getByText(SUSTAINABILITY_PAGE_COPY.craftQuote)).toBeInTheDocument();
    expect(screen.getByText(SUSTAINABILITY_PAGE_COPY.craftAttribution)).toBeInTheDocument();
    expect(screen.getByLabelText("Sustainability perspective")).toBeInTheDocument();

    expect(screen.queryByTestId("sustainability-hero-unknown")).not.toBeInTheDocument();
    const ldScripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(ldScripts.length).toBeGreaterThanOrEqual(2);
  });

  it("iterates commitments, story introPoints, and Eco-Score items from source-of-truth with computed classes", async () => {
    const { container } = render(await SustainabilityPage());

    // commitments
    expect(screen.getByTestId("sustainability-commitments")).toBeInTheDocument();
    expect(screen.getByText(SUSTAINABILITY_PAGE_COPY.commitmentsKicker)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SUSTAINABILITY_PAGE_COPY.commitmentsTitle })).toBeInTheDocument();
    const pillars = container.querySelectorAll(".sustainability-pillar");
    expect(pillars).toHaveLength(SUSTAINABILITY_PAGE_COPY.commitments.length);
    for (const pillar of SUSTAINABILITY_PAGE_COPY.commitments) {
      const h3 = screen.getByRole("heading", { level: 3, name: pillar.title });
      expect(h3).toBeInTheDocument();
      expect(h3).toHaveClass("sustainability-pillar__title");
      expect(screen.getByText(pillar.detail)).toBeInTheDocument();
      const article = h3.closest("article") as HTMLElement | null;
      expect(article).not.toBeNull();
      expect(article).toHaveClass("sustainability-pillar");
      expect(article).toHaveAttribute("data-sustainability-reveal");
    }

    // story
    expect(screen.getByTestId("sustainability-story")).toBeInTheDocument();
    expect(screen.getByText(SUSTAINABILITY_PAGE_COPY.introKicker)).toBeInTheDocument();
    expect(screen.getByText(SUSTAINABILITY_PAGE_COPY.introDescription)).toBeInTheDocument();
    const storyHeading = screen.getByRole("heading", { level: 2, name: new RegExp(SUSTAINABILITY_PAGE_COPY.introTitleAccent) });
    expect(storyHeading).toBeInTheDocument();
    expect(storyHeading).toHaveTextContent(SUSTAINABILITY_PAGE_COPY.introTitleLeadShort);
    expect(storyHeading).toHaveTextContent(SUSTAINABILITY_PAGE_COPY.introTitleAccent);

    const storyImg = screen.getByAltText(SUSTAINABILITY_STORY_IMAGE.alt);
    expect(storyImg).toBeInTheDocument();
    expect(storyImg).toHaveAttribute("src", SUSTAINABILITY_STORY_IMAGE.src);
    expect(storyImg).toHaveAttribute("data-testid", "mock-next-image");

    const points = container.querySelectorAll(".sustainability-story__point");
    expect(points).toHaveLength(SUSTAINABILITY_PAGE_COPY.introPoints.length);
    for (const point of SUSTAINABILITY_PAGE_COPY.introPoints) {
      expect(screen.getByText(point)).toBeInTheDocument();
      const li = screen.getByText(point).closest("li") as HTMLElement | null;
      expect(li).not.toBeNull();
      expect(li).toHaveClass("sustainability-story__point");
    }

    // eco score
    expect(screen.getByTestId("sustainability-eco")).toBeInTheDocument();
    expect(screen.getByText("Eco-Score")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SUSTAINABILITY_PAGE_COPY.ecoScoreTitle })).toBeInTheDocument();
    expect(screen.getByText(SUSTAINABILITY_PAGE_COPY.ecoScoreDescription)).toBeInTheDocument();
    const ecoSteps = container.querySelectorAll(".sustainability-eco__step");
    expect(ecoSteps).toHaveLength(SUSTAINABILITY_PAGE_COPY.ecoScoreItems.length);
    for (const item of SUSTAINABILITY_PAGE_COPY.ecoScoreItems) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
      expect(screen.getByText(item.detail)).toBeInTheDocument();
      const h3 = screen.getByRole("heading", { level: 3, name: item.title });
      expect(h3).toHaveClass("sustainability-eco__step-title");
      const li = h3.closest("li") as HTMLElement | null;
      expect(li).not.toBeNull();
      expect(li).toHaveClass("sustainability-eco__step");
      const indexEl = li?.querySelector(".sustainability-eco__index") as HTMLElement | null;
      expect(indexEl).not.toBeNull();
      expect(indexEl).toHaveAttribute("aria-hidden", "true");
      expect(indexEl).toHaveTextContent(item.index);
    }

    expect(screen.queryByText("Commitments unknown")).not.toBeInTheDocument();
  });

  it("renders CTA band with computed hrefs and contact teaser with absence checks", async () => {
    render(await SustainabilityPage());

    const ctaBand = screen.getByTestId("mock-route-cta-band");
    expect(ctaBand).toBeInTheDocument();
    expect(within(ctaBand).getByText(SUSTAINABILITY_PAGE_COPY.ctaKicker)).toBeInTheDocument();
    expect(within(ctaBand).getByText(SUSTAINABILITY_PAGE_COPY.ctaDescription)).toBeInTheDocument();
    const ctaHeading = within(ctaBand).getByRole("heading", { level: 2 });
    expect(ctaHeading).toHaveTextContent(SUSTAINABILITY_PAGE_COPY.ctaTitleLead);
    expect(ctaHeading).toHaveTextContent(SUSTAINABILITY_PAGE_COPY.ctaTitleAccent);
    expect(within(ctaBand).getByRole("link", { name: SUSTAINABILITY_PAGE_COPY.ctaPrimary })).toHaveAttribute("href", "/products");
    expect(within(ctaBand).getByRole("link", { name: SUSTAINABILITY_PAGE_COPY.ctaSecondary })).toHaveAttribute("href", "/contact");

    expect(screen.getByTestId("ContactTeaser")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nonexistent-cta/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("sustainability-eco-unknown")).not.toBeInTheDocument();
  });
});

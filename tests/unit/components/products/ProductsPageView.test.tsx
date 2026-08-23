import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { ProductsPageView } from "@/components/products/ProductsPageView";
import enMessages from "@/i18n/messages/en.json";
import { CATEGORY_ROUTE_COPY } from "@/features/site/data/routeCopy";

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined,
}));

vi.mock("gsap", () => ({
  default: {
    context: (fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    },
    from: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock("@/lib/helpers/gsapMotion", () => ({
  registerGsapPlugins: vi.fn(),
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: "power2.out",
  GSAP_REVEAL: { y: 24, opacity: 0, duration: 0.85, stagger: 0.11 },
  GSAP_SCROLL_REVEAL: { y: 20, opacity: 0, duration: 0.75, stagger: 0.09 },
}));

vi.mock("@phosphor-icons/react", () => ({
  ArrowRight: (props: { className?: string }) => (
    <span data-testid="arrow-right" className={props.className} />
  ),
  CheckCircle: (props: { className?: string }) => (
    <span data-testid="check-circle" className={props.className} />
  ),
  Clock: (props: { className?: string }) => (
    <span data-testid="clock" className={props.className} />
  ),
  ShieldCheck: (props: { className?: string }) => (
    <span data-testid="shield-check" className={props.className} />
  ),
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({
    href,
    children,
    variant,
    surface,
  }: {
    href: string;
    children: ReactNode;
    variant?: string;
    surface?: string;
  }) => (
    <a href={href} data-variant={variant} data-surface={surface}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/shared/RouteCtaBand", () => ({
  RouteCtaBand: () => <div data-testid="route-cta-band" />,
}));

const products = enMessages.products;

const baseProps = {
  heroKicker: products.heroKicker,
  heroTitleLead: products.headlineLead,
  heroTitleAccent: products.headlineAccent,
  heroSubtitle: products.heroSubtitle,
  heroPrimaryCta: products.heroPrimaryCta,
  heroSecondaryCta: products.heroSecondaryCta,
  craftQuote: products.craftQuote,
  craftAttribution: products.craftAttribution,
  introKicker: products.introKicker,
  introTitleLead: products.introTitleLead,
  introTitleAccent: products.introTitleAccent,
  introDescription: products.introDescription,
  featureBullets: products.featureBullets,
  categoryRoutesKicker: products.categoryRoutesKicker,
  categoryRoutesDescription: products.categoryRoutesDescription,
  categoryRoutesCta: products.categoryRoutesCta,
  rangeKicker: products.rangeKicker,
  rangeTitleLead: products.rangeTitleLead,
  rangeTitleAccent: products.rangeTitleAccent,
  pillarsKicker: products.pillarsKicker,
  pillarsTitleLead: products.pillarsTitleLead,
  pillarsTitleAccent: products.pillarsTitleAccent,
  pillarsIntro: products.pillarsIntro,
  pillars: products.pillars.map(({ title, detail, icon }) => ({
    title,
    detail,
    icon: icon as "check-circle" | "clock" | "shield",
  })),
  categories: [
    {
      id: "cat-seating",
      name: "Label for Seating",
      href: "/catalog/cat-seating",
      image: "/seating.jpg",
      productCount: 12,
    },
  ],
  deskKicker: products.deskKicker,
  deskTitle: products.deskTitle,
  deskDescription: products.deskDescription,
  deskPrimaryCta: products.deskPrimaryCta,
  deskSecondaryCta: products.deskSecondaryCta,
  deskTertiaryCta: products.deskTertiaryCta,
};

const ICON_TEST_ID: Record<string, string> = {
  "check-circle": "check-circle",
  clock: "clock",
  shield: "shield-check",
};

describe("ProductsPageView — behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hero with kicker, title, subtitle and CTA href/variant behavior", () => {
    render(<ProductsPageView {...baseProps} />);

    const hero = screen.getByTestId("products-hero");
    expect(hero).toHaveAttribute("aria-labelledby", "products-hero-heading");
    expect(hero).toHaveClass("products-hero");

    const kicker = screen.getByText(products.heroKicker);
    expect(kicker).toHaveClass("home-kicker");

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAttribute("id", "products-hero-heading");
    expect(heading.textContent).toContain(products.headlineLead);
    expect(heading.textContent).toContain(products.headlineAccent);

    expect(screen.getByText(products.heroSubtitle)).toHaveClass("products-hero__subtitle");

    const primaryCta = screen.getByRole("link", { name: products.heroPrimaryCta });
    expect(primaryCta).toHaveAttribute("href", "#products-categories");
    expect(primaryCta).toHaveAttribute("data-variant", "primary");
    expect(primaryCta).toHaveAttribute("data-surface", "products-hero");

    const secondaryCta = screen.getByRole("link", { name: products.heroSecondaryCta });
    expect(secondaryCta).toHaveAttribute("href", "/contact");
    expect(secondaryCta).toHaveAttribute("data-variant", "outline-light");

    expect(screen.queryByText("non-existent-cta-xyz")).not.toBeInTheDocument();
  });

  it("renders strategy panel iterating featureBullets source-of-truth with bullet markup", () => {
    render(<ProductsPageView {...baseProps} />);

    const fold = screen.getByTestId("products-intro");
    expect(fold).toHaveClass("products-strategy");

    expect(screen.getByText(products.introKicker)).toHaveClass("home-kicker");

    const strategyHeading = screen.getByRole("heading", { level: 2, name: new RegExp(products.introTitleLead.slice(0, 12), "i") });
    expect(strategyHeading.textContent).toContain(products.introTitleLead);
    expect(strategyHeading.textContent).toContain(products.introTitleAccent);

    expect(screen.getByText(products.introDescription)).toHaveClass("page-copy");
    expect(screen.getByText(products.craftQuote)).toHaveClass("products-strategy__quote-text");
    expect(screen.getByText(products.craftAttribution)).toHaveClass("products-strategy__quote-source");

    // Source-of-truth iteration: every bullet renders with correct class and mark
    expect(products.featureBullets.length).toBeGreaterThan(0);
    products.featureBullets.forEach((bullet) => {
      const el = screen.getByText(bullet);
      expect(el.closest("li")).toHaveClass("products-strategy__bullet");
    });
    const bulletMarks = document.querySelectorAll(".products-strategy__bullet-mark");
    expect(bulletMarks.length).toBe(products.featureBullets.length);
    bulletMarks.forEach((mark) => {
      expect(mark).toHaveAttribute("aria-hidden", "true");
      expect(mark.textContent).toBe("+");
    });

    expect(screen.queryByText("Specs and photography")).not.toBeNull();
  });

  it("renders category tiles iterating categories source-of-truth with computed href, tile count, and meta", () => {
    render(<ProductsPageView {...baseProps} />);

    const categoriesSection = screen.getByTestId("products-categories");
    expect(categoriesSection).toHaveAttribute("id", "products-categories");

    // Tiles live inside #products-categories; chips (same href) live outside — scope tile count.
    const tiles = document.querySelectorAll("#products-categories .products-category-tile");
    expect(tiles.length).toBe(baseProps.categories.length);

    baseProps.categories.forEach((category) => {
      const tile = document.querySelector(`#products-categories a[href="${category.href}"]`) as HTMLAnchorElement | null;
      expect(tile).not.toBeNull();
      expect(tile).toHaveAttribute("href", category.href);
      expect(tile).toHaveClass("products-category-tile");

      const title = within(tile as HTMLElement).getByRole("heading", { level: 3, name: category.name });
      expect(title).toHaveClass("products-category-tile__title");

      const meta = within(tile as HTMLElement).getByText(`${category.productCount} products`);
      expect(meta).toHaveClass("products-category-tile__meta");
    });

    // Verify range header uses source-of-truth kicker/title
    expect(screen.getByText(products.rangeKicker)).toHaveClass("home-kicker");
    const rangeHeading = screen.getByRole("heading", { level: 2, name: new RegExp(products.rangeTitleLead.slice(0, 8), "i") });
    expect(rangeHeading.textContent).toContain(products.rangeTitleLead);
  });

  it("renders multiple category tiles with correct href distribution when expanded source-of-truth", () => {
    const expandedCategories = [
      ...baseProps.categories,
      {
        id: "cat-desking",
        name: "Label for Desking",
        href: "/catalog/cat-desking",
        image: "/desking.jpg",
        productCount: 7,
      },
    ];
    render(<ProductsPageView {...baseProps} categories={expandedCategories} />);

    const tiles = document.querySelectorAll(".products-category-tile");
    expect(tiles.length).toBe(expandedCategories.length);

    expandedCategories.forEach((category) => {
      const tile = document.querySelector(`a[href="${category.href}"]`) as HTMLAnchorElement | null;
      expect(tile).not.toBeNull();
      expect(tile).toHaveAttribute("href", category.href);
    });

    // Route chips also iterate categories
    const chips = document.querySelectorAll(".products-strategy__chips a.btn-outline");
    expect(chips.length).toBe(expandedCategories.length);
  });

  it("renders pillars iterating pillars source-of-truth with icon mapping, heading ids, and card classes", () => {
    render(<ProductsPageView {...baseProps} />);

    const pillarsSection = screen.getByTestId("products-pillars");
    expect(pillarsSection).toHaveClass("products-pillars");

    expect(screen.getByText(products.pillarsKicker)).toHaveClass("home-kicker");
    expect(screen.getByText(products.pillarsIntro)).toHaveClass("products-pillars-header__intro");

    const pillarHeading = screen.getByRole("heading", { level: 2, name: new RegExp(products.pillarsTitleLead.slice(0, 8), "i") });
    expect(pillarHeading.textContent).toContain(products.pillarsTitleLead);

    expect(products.pillars.length).toBeGreaterThan(0);
    products.pillars.forEach((pillar) => {
      const headingId = `products-pillar-${pillar.title.replace(/\s+/g, "-").toLowerCase()}`;
      const heading = screen.getByRole("heading", { level: 3, name: pillar.title });
      expect(heading).toHaveAttribute("id", headingId);
      expect(heading).toHaveClass("products-pillar-card__title");

      const detail = screen.getByText(pillar.detail);
      expect(detail).toHaveClass("products-pillar-card__detail");

      const card = heading.closest("li");
      expect(card).not.toBeNull();
      expect(card).toHaveClass("products-pillar-card");
      expect(card).toHaveAttribute("aria-labelledby", headingId);

      const expectedTestId = ICON_TEST_ID[pillar.icon] ?? "check-circle";
      const icon = within(card as HTMLElement).getByTestId(expectedTestId);
      expect(icon).toHaveClass("h-5");
    });

    const cards = document.querySelectorAll(".products-pillar-card");
    expect(cards.length).toBe(products.pillars.length);

    expect(document.querySelectorAll(".home-why-card").length).toBe(0);
  });

  it("shows honest empty state when no categories are published and hides tile grid", () => {
    render(<ProductsPageView {...baseProps} categories={[]} />);

    const status = screen.getByRole("status");
    expect(status).toHaveClass("scheme-panel");

    const emptyHeading = screen.getByRole("heading", { name: CATEGORY_ROUTE_COPY.offlineTitle });
    expect(emptyHeading).toHaveClass("typ-h2");

    expect(screen.getByText(CATEGORY_ROUTE_COPY.offlineDescription)).toHaveClass("page-copy");
    expect(document.querySelectorAll(".products-category-tile").length).toBe(0);
    expect(screen.queryByText("Label for Seating")).not.toBeInTheDocument();
    expect(screen.queryByText("12 products")).not.toBeInTheDocument();
  });

  it("omits hero when showHero false and keeps categories and pillars chrome", () => {
    render(<ProductsPageView {...baseProps} showHero={false} />);

    expect(screen.queryByTestId("products-hero")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();

    const categories = screen.getByTestId("products-categories");
    expect(categories).toHaveAttribute("id", "products-categories");

    const pillars = screen.getByTestId("products-pillars");
    expect(pillars).toHaveClass("products-pillars");

    const ctaBand = screen.getByTestId("route-cta-band");
    expect(ctaBand).toHaveAttribute("data-testid", "route-cta-band");
  });
});

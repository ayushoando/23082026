import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ProductsPageView } from "@/components/products/ProductsPageView";
import enMessages from "@/i18n/messages/en.json";

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
  ArrowRight: () => <span data-testid="arrow-right" />,
  CheckCircle: () => <span data-testid="check-circle" />,
  Clock: () => <span data-testid="clock" />,
  ShieldCheck: () => <span data-testid="shield-check" />,
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/shared/RouteCtaBand", () => ({
  RouteCtaBand: () => <div data-testid="route-cta-band" />,
}));

const products = enMessages.products;

const catalogMobileCss = readFileSync(
  resolve(__dirname, "../../../../site/focss/site/components/products/catalog-mobile.css"),
  "utf8",
);

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
      name: "Seating",
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

describe("CatalogMobile MOB-04", () => {
  it("MOB-04: products fold heading region clears --site-fab-side-* via catalog-mobile inset", () => {
    expect(catalogMobileCss).toMatch(/MOB-04/);
    expect(catalogMobileCss).toMatch(
      /\.products-strategy\s*\{[^}]*padding-inline:\s*max\(\s*var\(--space-4\)\s*,\s*var\(--site-fab-side-left\)\s*\)/s,
    );

    render(<ProductsPageView {...baseProps} />);

    const fold = screen.getByTestId("products-intro");
    expect(fold).toHaveClass("products-strategy");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Open a/i,
      }),
    ).toBeInTheDocument();
  });
});

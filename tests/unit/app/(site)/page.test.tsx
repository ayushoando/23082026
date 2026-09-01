/**
 * Name-mirror: app/(site)/page.tsx — homepage smoke render.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Home, { metadata } from "@/app/(site)/page";
import { HomeMarketingLayout } from "@/components/home/layout";
import { SITE_BRAND } from "@/features/site/data/brand";

vi.mock("@/components/home/HomepageHero", () => ({
  HomepageHero: () => <div data-testid="HomepageHero" />,
}));

vi.mock("@/components/home/Collections", () => ({
  Collections: () => <div data-testid="Collections" />,
}));

vi.mock("@/components/home/HomeDeferredSections", () => ({
  HomeDeferredSections: () => (
    <div data-testid="HomeDeferredSections">
      <div data-testid="InteractiveTools" />
      <div data-testid="WhyChooseUs" />
      <div data-testid="ShowcaseCarousel" />
      <div data-testid="ContactTeaser" />
    </div>
  ),
}));

vi.mock("@/components/home/InteractiveTools", () => ({
  InteractiveTools: () => <div data-testid="InteractiveTools" />,
}));

vi.mock("@/components/home/WhyChooseUs", () => ({
  WhyChooseUs: () => <div data-testid="WhyChooseUs" />,
}));

vi.mock("@/components/home/ShowcaseCarousel", () => ({
  ShowcaseCarousel: () => <div data-testid="ShowcaseCarousel" />,
}));

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="ContactTeaser" />,
}));

vi.mock("@/features/site/data/seo", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/features/site/data/seo")
  >();
  return {
    ...actual,
    buildLocalBusinessJsonLd: () => ({ "@type": "LocalBusiness" }),
  };
});

vi.mock("@/lib/security/sanitize", () => ({
  sanitizeJsonForScript: (data: unknown) => JSON.stringify(data),
}));

describe("app/(site)/page.tsx", () => {
  it("exports homepage metadata built from the real brand + canonical SEO factory", () => {
    const title = metadata.title as { absolute?: string };
    expect(title.absolute).toBe(SITE_BRAND.defaultTitle);
    expect(metadata.description).toBe(SITE_BRAND.description);
  });

  it("renders marketing shell with homepage sections and stats", async () => {
    const jsx = await Home();
    expect(jsx.type).toBe(HomeMarketingLayout);

    render(jsx);

    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
    expect(screen.getByTestId("HomepageHero")).toBeInTheDocument();
    expect(screen.getByTestId("Collections")).toBeInTheDocument();
    expect(screen.queryByTestId("TrustStrip")).not.toBeInTheDocument();
    expect(screen.getByTestId("InteractiveTools")).toBeInTheDocument();
    expect(screen.getByTestId("WhyChooseUs")).toBeInTheDocument();
    expect(screen.getByTestId("ShowcaseCarousel")).toBeInTheDocument();
    expect(screen.getByTestId("ContactTeaser")).toBeInTheDocument();
    expect(screen.queryByTestId("site-mobile-sticky-cta")).not.toBeInTheDocument();
  });

  it("embeds JSON-LD script for WebPage", async () => {
    const jsx = await Home();
    const { container } = render(jsx);
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    // Home only adds the WebPage graph; Organization/LocalBusiness live in the
    // sitewide (site)/layout graph (see page.tsx line 25 comment).
    expect(scripts.length).toBeGreaterThanOrEqual(1);
    const payloads = Array.from(scripts).map((el) => el.innerHTML);
    expect(payloads.some((p) => p.includes("WebPage"))).toBe(true);
  });
});

import "@/tests/helpers/nextIntlServerEnMock";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "@/app/(site)/about/page";
import enMessages from "@/i18n/messages/en.json";
import { ABOUT_PAGE_METADATA } from "@/features/site/data/routeMetadata";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
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

vi.mock("@/components/about/AboutHeroMedia", () => ({
  AboutHeroMedia: () => <div data-testid="mock-about-hero-media" />,
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({ href, children, label }: { href: string; children: string; label: string }) => (
    <a href={href} aria-label={label}>
      {children}
    </a>
  ),
}));

const aboutMessages = enMessages.about as {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroCta: string;
  storyKicker: string;
  storyTitleLead: string;
  storyTitleAccent: string;
  storyLead: string;
  craftQuote: string;
  craftAttribution: string;
  pillarsKicker: string;
  modelPillars: { title: string; detail: string }[];
  processKicker: string;
  processTitleLead: string;
  processTitleAccent: string;
  processSteps: { title: string; detail: string }[];
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

describe("app/(site)/about/page.tsx", () => {
  it("exports canonical SEO metadata with absolute single-brand title", () => {
    expect(ABOUT_PAGE_METADATA.alternates?.canonical).toMatch(/\/about\/?$/);
    const titleValue =
      typeof ABOUT_PAGE_METADATA.title === "string"
        ? ABOUT_PAGE_METADATA.title
        : ((ABOUT_PAGE_METADATA.title as { absolute?: string })?.absolute ?? String(ABOUT_PAGE_METADATA.title));
    expect(titleValue).toMatch(/About/);
    expect(ABOUT_PAGE_METADATA.openGraph?.url).toMatch(/\/about\/?$/);
  });

  it("renders marketing layout with hero labelled region and story section", async () => {
    const jsx = await Page();
    const { container } = render(jsx);

    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();

    const hero = screen.getByTestId("about-hero");
    expect(hero).toHaveAttribute("aria-labelledby", "about-hero-heading");
    expect(hero).toHaveClass("about-hero");

    const h1 = screen.getByRole("heading", { level: 1, name: /interiors executed with craft/i });
    expect(h1).toHaveAttribute("id", "about-hero-heading");
    expect(h1).toHaveTextContent(aboutMessages.heroTitleLead);
    expect(h1).toHaveTextContent(aboutMessages.heroTitleAccent);
    expect(screen.getByText(aboutMessages.heroKicker)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.heroSubtitle)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: aboutMessages.heroCta })).toHaveAttribute("href", "/clients");
    expect(screen.getByTestId("mock-about-hero-media")).toBeInTheDocument();

    expect(screen.getByTestId("about-story")).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.storyKicker)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.storyLead)).toBeInTheDocument();

    expect(screen.queryByTestId("about-hero-unknown")).not.toBeInTheDocument();

    const ldScripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(ldScripts.length).toBeGreaterThanOrEqual(2);
  });

  it("iterates modelPillars and processSteps source-of-truth with correct headings", async () => {
    const jsx = await Page();
    const { container } = render(jsx);

    expect(screen.getByText(aboutMessages.pillarsKicker)).toBeInTheDocument();
    const pillars = container.querySelectorAll(".about-pillar");
    expect(pillars).toHaveLength(aboutMessages.modelPillars.length);
    aboutMessages.modelPillars.forEach((pillar) => {
      expect(screen.getByText(pillar.title)).toBeInTheDocument();
      expect(screen.getByText(pillar.detail)).toBeInTheDocument();
    });

    expect(screen.getByText(aboutMessages.processKicker)).toBeInTheDocument();
    const steps = container.querySelectorAll(".about-process__step");
    expect(steps).toHaveLength(aboutMessages.processSteps.length);
    aboutMessages.processSteps.forEach((step) => {
      expect(screen.getAllByText(step.title).length).toBeGreaterThan(0);
      expect(screen.getByText(step.detail)).toBeInTheDocument();
    });

    expect(screen.getByText(aboutMessages.craftQuote)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.craftAttribution)).toBeInTheDocument();
    expect(screen.getByTestId("about-craft")).toBeInTheDocument();
  });

  it("renders CTA band with computed hrefs and contact teaser", async () => {
    const jsx = await Page();
    render(jsx);

    expect(screen.getByTestId("about-cta")).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.ctaKicker)).toBeInTheDocument();
    expect(screen.getByText(aboutMessages.ctaDescription)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: new RegExp(aboutMessages.ctaTitleLead) })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: aboutMessages.ctaPrimary })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: aboutMessages.ctaSecondary })).toHaveAttribute("href", "/clients");

    expect(screen.getByTestId("home-contact-teaser")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nonexistent-cta/i })).not.toBeInTheDocument();
  });
});

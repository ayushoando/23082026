import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Page from "@/app/(site)/downloads/page";
import {
  DOWNLOADS_PAGE_COPY,
  DOWNLOADS_RESOURCE_CATEGORIES,
} from "@/features/site/data/routeCopy";
import { DOWNLOADS_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { DOWNLOADS_CRAFT } from "@/features/site/data/downloadsPage";
import { SITE_CONTACT } from "@/features/site/data/contact";

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
    timeline: () => ({ to: vi.fn().mockReturnThis(), from: vi.fn().mockReturnThis() }),
    set: vi.fn(),
  },
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

vi.mock("@/components/shared/RouteActionCard", () => ({
  RouteActionCard: ({
    kicker,
    title,
    description,
    actions,
  }: {
    kicker: string;
    title: string;
    description: string;
    actions: { href: string; label: string }[];
  }) => (
    <div data-testid="mock-route-action-card">
      <p>{kicker}</p>
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

// Capture DownloadsPageView props to verify source-of-truth forwarding via real view rendering
// We test the full Page -> DownloadsPageView integration by rendering the actual view through Page.
describe("app/(site)/downloads/page.tsx", () => {
  it("exports canonical SEO metadata with absolute single-brand title", () => {
    expect(DOWNLOADS_PAGE_METADATA.alternates?.canonical).toMatch(/\/downloads\/?$/);
    const titleValue =
      typeof DOWNLOADS_PAGE_METADATA.title === "string"
        ? DOWNLOADS_PAGE_METADATA.title
        : ((DOWNLOADS_PAGE_METADATA.title as { absolute?: string })?.absolute ?? String(DOWNLOADS_PAGE_METADATA.title));
    expect(titleValue).toMatch(/Resource Desk/);
    expect(titleValue).toMatch(/One&Only/);
    expect(DOWNLOADS_PAGE_METADATA.openGraph?.url).toMatch(/\/downloads\/?$/);
    expect(DOWNLOADS_PAGE_METADATA.description).toBe(DOWNLOADS_PAGE_COPY.metadataDescription);
  });

  it("renders marketing layout with hero labelled region and editorial copy", () => {
    const { container } = render(<Page />);

    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();

    const hero = screen.getByTestId("downloads-hero");
    expect(hero).toHaveAttribute("aria-labelledby", "downloads-hero-heading");
    expect(hero).toHaveClass("downloads-hero");

    const h1 = screen.getByRole("heading", { level: 1, name: /Documentation routed to/i });
    expect(h1).toHaveAttribute("id", "downloads-hero-heading");
    expect(h1).toHaveTextContent(DOWNLOADS_PAGE_COPY.heroTitleLead);
    expect(h1).toHaveTextContent(DOWNLOADS_PAGE_COPY.heroTitleAccent);
    expect(screen.getByText(DOWNLOADS_PAGE_COPY.heroKicker)).toBeInTheDocument();
    expect(screen.getByText(DOWNLOADS_PAGE_COPY.heroSubtitle)).toBeInTheDocument();

    expect(screen.getByTestId("mock-editorial-hero-media")).toBeInTheDocument();
    expect(screen.getByTestId("mock-editorial-hero-media")).toHaveAttribute(
      "data-alt",
      "One and Only workspace documentation and specification review in Patna",
    );

    // Hero CTAs: primary -> /contact, secondary -> /planning (also appears in urgent/action cards; scope to hero)
    const heroCtas = within(hero).getAllByRole("link");
    expect(heroCtas.some((a) => a.getAttribute("href") === "/contact" && a.textContent === DOWNLOADS_PAGE_COPY.heroPrimaryCta)).toBe(true);
    expect(heroCtas.some((a) => a.getAttribute("href") === "/planning")).toBe(true);
    expect(within(hero).getByRole("link", { name: DOWNLOADS_PAGE_COPY.heroPrimaryCta })).toHaveAttribute("href", "/contact");

    // Craft strip
    expect(screen.getByText(DOWNLOADS_CRAFT.quote)).toBeInTheDocument();
    expect(screen.getByText(DOWNLOADS_CRAFT.attribution)).toBeInTheDocument();

    expect(screen.queryByTestId("downloads-hero-unknown")).not.toBeInTheDocument();

    const ldScripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(ldScripts.length).toBeGreaterThanOrEqual(2);
  });

  it("iterates resource categories and process steps from source-of-truth", () => {
    const { container } = render(<Page />);

    // Resources section (resourceTitle also appears in urgent card; scope to resources section)
    const resourcesSection = screen.getByTestId("downloads-resources");
    expect(resourcesSection).toBeInTheDocument();
    expect(screen.getByText(DOWNLOADS_PAGE_COPY.resourceKicker)).toBeInTheDocument();
    expect(within(resourcesSection).getByText(DOWNLOADS_PAGE_COPY.resourceTitle)).toBeInTheDocument();
    expect(within(resourcesSection).getByText(DOWNLOADS_PAGE_COPY.resourceDescription)).toBeInTheDocument();

    const resources = container.querySelectorAll(".downloads-resource");
    expect(resources).toHaveLength(DOWNLOADS_RESOURCE_CATEGORIES.length);
    DOWNLOADS_RESOURCE_CATEGORIES.forEach((cat) => {
      expect(screen.getByText(cat.title)).toBeInTheDocument();
      expect(screen.getByText(cat.detail)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: cat.cta })).toHaveAttribute("href", cat.href);
    });

    // Process steps
    expect(screen.getByTestId("downloads-process")).toBeInTheDocument();
    expect(screen.getByText(DOWNLOADS_PAGE_COPY.processKicker)).toBeInTheDocument();
    expect(screen.getByText(DOWNLOADS_PAGE_COPY.processTitle)).toBeInTheDocument();
    const steps = container.querySelectorAll(".downloads-process__step");
    expect(steps).toHaveLength(DOWNLOADS_PAGE_COPY.processSteps.length);
    DOWNLOADS_PAGE_COPY.processSteps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.detail)).toBeInTheDocument();
    });
    // Index badges zero-padded
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("renders note, urgent action card with computed hrefs, CTA band, and contact teaser", () => {
    render(<Page />);

    // Note block
    expect(screen.getByTestId("downloads-note")).toBeInTheDocument();
    expect(screen.getByText(DOWNLOADS_PAGE_COPY.noteTitle)).toBeInTheDocument();
    expect(screen.getByText(DOWNLOADS_PAGE_COPY.noteBody)).toBeInTheDocument();
    const notePoints = document.querySelectorAll(".downloads-note__point");
    expect(notePoints).toHaveLength(DOWNLOADS_PAGE_COPY.notePoints.length);
    DOWNLOADS_PAGE_COPY.notePoints.forEach((point) => {
      expect(screen.getByText(point)).toBeInTheDocument();
    });

    // Urgent RouteActionCard — kicker + actions with computed hrefs
    const actionCard = screen.getByTestId("mock-route-action-card");
    expect(actionCard).toBeInTheDocument();
    expect(within(actionCard).getByText(DOWNLOADS_PAGE_COPY.urgentKicker)).toBeInTheDocument();
    expect(within(actionCard).getByText(DOWNLOADS_PAGE_COPY.urgentDescription)).toBeInTheDocument();
    expect(within(actionCard).getByRole("link", { name: DOWNLOADS_PAGE_COPY.primaryCta })).toHaveAttribute("href", "/contact");
    expect(within(actionCard).getByRole("link", { name: DOWNLOADS_PAGE_COPY.secondaryCta })).toHaveAttribute(
      "href",
      `mailto:${SITE_CONTACT.salesEmail}`,
    );
    expect(within(actionCard).getByRole("link", { name: DOWNLOADS_PAGE_COPY.tertiaryCta })).toHaveAttribute("href", expect.stringContaining("wa.me"));

    // CTA band
    const ctaBand = screen.getByTestId("mock-route-cta-band");
    expect(ctaBand).toBeInTheDocument();
    expect(within(ctaBand).getByText(DOWNLOADS_PAGE_COPY.ctaKicker)).toBeInTheDocument();
    expect(within(ctaBand).getByText(DOWNLOADS_PAGE_COPY.ctaDescription)).toBeInTheDocument();
    expect(within(ctaBand).getByRole("heading", { level: 2 })).toHaveTextContent(DOWNLOADS_PAGE_COPY.ctaTitleLead);
    expect(within(ctaBand).getByRole("heading", { level: 2 })).toHaveTextContent(DOWNLOADS_PAGE_COPY.ctaTitleAccent);
    expect(within(ctaBand).getByRole("link", { name: DOWNLOADS_PAGE_COPY.primaryCta })).toHaveAttribute("href", "/contact");
    // Planning link in CTA band
    expect(within(ctaBand).getByRole("link", { name: /Open planning/i })).toHaveAttribute("href", "/planning");

    expect(screen.getByTestId("mock-contact-teaser")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nonexistent-cta/i })).not.toBeInTheDocument();
  });
});

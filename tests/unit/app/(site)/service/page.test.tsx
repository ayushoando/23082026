import "@/tests/helpers/nextIntlServerEnMock";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SERVICE_PAGE_COPY, SERVICE_PAGE_CHANNELS, SERVICE_PAGE_PILLARS } from "@/features/site/data/routeCopy";
import { SERVICE_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { SITE_CONTACT } from "@/features/site/data/contact";
import { SERVICE_HERO_IMAGE } from "@/features/site/data/servicePage";
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
  // Must match the sibling _template.homepage.test mock shape (ContactTeaser passthrough)
  // or vitest cache merges whichever file runs first and the id diverges.
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

import ServicePage, { generateMetadata } from "@/app/(site)/service/page";

describe("app/(site)/service/page.tsx — behavior", () => {
  it("exports canonical SEO metadata with absolute single-brand title", async () => {
    expect(await generateMetadata()).toEqual(SERVICE_PAGE_METADATA);
    const titleValue =
      typeof SERVICE_PAGE_METADATA.title === "string"
        ? SERVICE_PAGE_METADATA.title
        : ((SERVICE_PAGE_METADATA.title as { absolute?: string })?.absolute ?? String(SERVICE_PAGE_METADATA.title));
    expect(titleValue).toMatch(/Service/);
    expect(titleValue).toMatch(/One&Only/);
    expect(SERVICE_PAGE_METADATA.openGraph?.url).toMatch(/\/service\/?$/);
    expect(SERVICE_PAGE_METADATA.description).toBe(SERVICE_PAGE_COPY.heroSubtitle);
    expect((SERVICE_PAGE_METADATA.alternates as { canonical?: string })?.canonical ?? SERVICE_PAGE_METADATA.openGraph?.url).toBeDefined();
  });

  it("renders marketing shell, hero labelled region, editorial hero media, and craft quote", async () => {
    const { container } = render(await ServicePage());

    expectHomeMarketingShell(container);
    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();

    const hero = screen.getByTestId("service-hero");
    expect(hero).toHaveAttribute("aria-labelledby", "service-hero-heading");
    expect(hero).toHaveClass("service-hero");

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveAttribute("id", "service-hero-heading");
    expect(h1).toHaveTextContent(SERVICE_PAGE_COPY.heroTitleLead);
    expect(h1).toHaveTextContent(SERVICE_PAGE_COPY.heroTitleAccent);
    expect(screen.getByText(SERVICE_PAGE_COPY.heroKicker)).toBeInTheDocument();
    expect(screen.getByText(SERVICE_PAGE_COPY.heroKicker)).toHaveClass("home-kicker");
    expect(screen.queryByText(SERVICE_PAGE_COPY.heroSubtitle)).not.toBeInTheDocument();

    expect(screen.getByTestId("mock-editorial-hero-media")).toBeInTheDocument();
    expect(screen.getByTestId("mock-editorial-hero-media")).toHaveAttribute("data-alt", SERVICE_HERO_IMAGE.alt);
    expect(screen.getByTestId("mock-editorial-hero-media")).toHaveAttribute("data-src", SERVICE_HERO_IMAGE.src);

    // hero primary CTA
    const heroEl = screen.getByTestId("service-hero");
    expect(within(heroEl).getByRole("link", { name: SERVICE_PAGE_COPY.primaryCta })).toHaveAttribute("href", "/contact");
    expect(within(heroEl).getByRole("link", { name: SERVICE_PAGE_COPY.primaryCta })).toHaveAttribute("aria-label", SERVICE_PAGE_COPY.primaryCta);

    expect(screen.getByText(SERVICE_PAGE_COPY.craftQuote)).toBeInTheDocument();
    expect(screen.getByText(SERVICE_PAGE_COPY.craftAttribution)).toBeInTheDocument();
    expect(screen.getByLabelText("Service perspective")).toBeInTheDocument();

    expect(screen.queryByTestId("service-hero-unknown")).not.toBeInTheDocument();
    const ldScripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(ldScripts.length).toBeGreaterThanOrEqual(2);
  });

  it("iterates SERVICE_PAGE_PILLARS and SERVICE_PAGE_CHANNELS source-of-truth with computed attributes", async () => {
    const { container } = render(await ServicePage());

    // pillars
    expect(screen.getByTestId("service-pillars")).toBeInTheDocument();
    expect(screen.getByText(SERVICE_PAGE_COPY.frameworkKicker)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SERVICE_PAGE_COPY.frameworkTitle })).toBeInTheDocument();
    const pillars = container.querySelectorAll(".service-pillar");
    expect(pillars).toHaveLength(SERVICE_PAGE_PILLARS.length);
    for (const pillar of SERVICE_PAGE_PILLARS) {
      const h3 = screen.getByRole("heading", { level: 3, name: pillar.title });
      expect(h3).toBeInTheDocument();
      expect(h3).toHaveClass("service-pillar__title");
      expect(screen.getByText(pillar.detail)).toBeInTheDocument();
      const article = h3.closest("article") as HTMLElement | null;
      expect(article).not.toBeNull();
      expect(article).toHaveClass("service-pillar");
    }

    // channels
    expect(screen.getByTestId("service-channels")).toBeInTheDocument();
    expect(screen.getByText(SERVICE_PAGE_COPY.channelsKicker)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SERVICE_PAGE_COPY.channelsTitle })).toBeInTheDocument();

    const channelsSection = screen.getByTestId("service-channels");
    for (const channel of SERVICE_PAGE_CHANNELS) {
      const labelEl = within(channelsSection).getByText(channel.label);
      expect(labelEl).toBeInTheDocument();
      expect(labelEl).toHaveClass("service-channel-row__label");
    }

    // computed hrefs — phone + email + whatsapp
    const expectedPhoneHref = `tel:${SITE_CONTACT.supportPhone.replace(/\s+/g, "")}`;
    expect(within(channelsSection).getByText(SITE_CONTACT.supportPhone).closest("a")).toHaveAttribute("href", expectedPhoneHref);
    expect(within(channelsSection).getByText(SITE_CONTACT.salesEmail).closest("a")).toHaveAttribute("href", `mailto:${SITE_CONTACT.salesEmail}`);
    const whatsappChannel = SERVICE_PAGE_CHANNELS.find((c) => c.kind === "whatsapp");
    if (whatsappChannel && "value" in whatsappChannel) {
      const waValueEl = within(channelsSection).getByText(whatsappChannel.value);
      expect(waValueEl).toBeInTheDocument();
      const waLink = waValueEl.closest("a") as HTMLAnchorElement | null;
      expect(waLink).not.toBeNull();
      expect(waLink).toHaveAttribute("href", whatsappChannel.href);
      expect(waLink).toHaveAttribute("target", "_blank");
      expect(waLink).toHaveAttribute("rel", expect.stringContaining("noopener") as unknown as string);
    }

    const channelRows = container.querySelectorAll(".service-channel-row");
    expect(channelRows).toHaveLength(SERVICE_PAGE_CHANNELS.length);
    for (const row of channelRows) {
      expect(row).toHaveClass("service-channel-row");
    }

    expect(screen.queryByText("Phone support unknown")).not.toBeInTheDocument();
  });

  it("renders support panel, CTA band with computed hrefs, and contact teaser with absence checks", async () => {
    const { container } = render(await ServicePage());

    expect(screen.getByText(SERVICE_PAGE_COPY.supportKicker)).toBeInTheDocument();
    expect(screen.getByText(SERVICE_PAGE_COPY.supportDescription)).toBeInTheDocument();

    const supportPanel = container.querySelector(".service-support-panel") as HTMLElement | null;
    expect(supportPanel).not.toBeNull();
    expect(within(supportPanel as HTMLElement).getByRole("link", { name: SERVICE_PAGE_COPY.primaryCta })).toHaveAttribute("href", "/contact");
    expect(within(supportPanel as HTMLElement).getByRole("link", { name: SERVICE_PAGE_COPY.secondaryCta })).toHaveAttribute("href", "/contact");
    expect(within(supportPanel as HTMLElement).getByRole("link", { name: SERVICE_PAGE_COPY.tertiaryCta })).toHaveAttribute("href", "/downloads");

    const ctaBand = screen.getByTestId("mock-route-cta-band");
    expect(ctaBand).toBeInTheDocument();
    expect(within(ctaBand).getByText(SERVICE_PAGE_COPY.ctaKicker)).toBeInTheDocument();
    expect(within(ctaBand).getByText(SERVICE_PAGE_COPY.ctaDescription)).toBeInTheDocument();
    const ctaHeading = within(ctaBand).getByRole("heading", { level: 2 });
    expect(ctaHeading).toHaveTextContent(SERVICE_PAGE_COPY.ctaTitleLead);
    expect(ctaHeading).toHaveTextContent(SERVICE_PAGE_COPY.ctaTitleAccent);
    expect(within(ctaBand).getByRole("link", { name: SERVICE_PAGE_COPY.primaryCta })).toHaveAttribute("href", "/contact");
    expect(within(ctaBand).getByRole("link", { name: SERVICE_PAGE_COPY.tertiaryCta })).toHaveAttribute("href", "/downloads");

    expect(screen.getByTestId("ContactTeaser")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nonexistent-cta/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("service-support-unknown")).not.toBeInTheDocument();
  });
});

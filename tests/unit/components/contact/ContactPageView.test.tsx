import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ContactPageView } from "@/components/contact/ContactPageView";
import enMessages from "@/i18n/messages/en.json";
import { SITE_CONTACT } from "@/features/site/data/contact";

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

vi.mock("@/components/site/EditorialHeroMedia", () => ({
  EditorialHeroMedia: () => <div data-testid="mock-hero-media" />,
}));

vi.mock("@/components/contact/CustomerQueryForm", () => ({
  CustomerQueryForm: ({ intent, source }: { intent: string | null; source: string | null }) => (
    <div data-testid="mock-query-form">
      <span>Intent: {intent || "none"}</span>
      <span>Source: {source || "none"}</span>
    </div>
  ),
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({ href, children, label }: { href: string; children: ReactNode; label: string }) => (
    <a href={href} aria-label={label}>
      {children}
    </a>
  ),
}));

vi.mock("@phosphor-icons/react", () => ({
  MapPin: () => <span data-testid="mappin-icon" />,
  Phone: () => <span data-testid="phone-icon" />,
  Envelope: () => <span data-testid="envelope-icon" />,
}));

const contact = enMessages.contact as {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  sectionTitle: string;
  introTitle: string;
  resourceDeskLead: string;
  resourceDeskCta: string;
  resourceDeskTail: string;
  quickDeskKicker: string;
  quickDeskTitle: string;
  quickDeskDescription: string;
  quickDeskPrimaryCta: string;
  quickDeskSecondaryCta: string;
  channelRegionLabel: string;
  channelQuotesLabel: string;
  channelSupportLabel: string;
  channelEmailLabel: string;
  channelsAriaLabel: string;
  offices: { title: string; lines: string[] }[];
};

const defaultProps = {
  intent: "quote",
  source: "google",
  heroKicker: contact.heroKicker,
  heroTitleLead: contact.heroTitleLead,
  heroTitleAccent: contact.heroTitleAccent,
  heroSubtitle: contact.heroSubtitle,
  sectionTitle: contact.sectionTitle,
  introTitle: contact.introTitle,
  resourceDeskLead: contact.resourceDeskLead,
  resourceDeskCta: contact.resourceDeskCta,
  resourceDeskTail: contact.resourceDeskTail,
  quickDeskKicker: contact.quickDeskKicker,
  quickDeskTitle: contact.quickDeskTitle,
  quickDeskDescription: contact.quickDeskDescription,
  quickDeskPrimaryCta: contact.quickDeskPrimaryCta,
  quickDeskSecondaryCta: contact.quickDeskSecondaryCta,
  channelRegionLabel: contact.channelRegionLabel,
  channelQuotesLabel: contact.channelQuotesLabel,
  channelSupportLabel: contact.channelSupportLabel,
  channelEmailLabel: contact.channelEmailLabel,
  channelsAriaLabel: contact.channelsAriaLabel,
  offices: contact.offices,
};

describe("ContactPageView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes hero as labelled region with h1 composed from lead + accent", () => {
    const { container } = render(<ContactPageView {...defaultProps} />);

    const hero = container.querySelector('[data-testid="contact-hero"]');
    expect(hero).toHaveAttribute("aria-labelledby", "contact-hero-heading");
    expect(hero).toHaveClass("contact-hero");

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAttribute("id", "contact-hero-heading");
    expect(heading).toHaveTextContent(`${contact.heroTitleLead} ${contact.heroTitleAccent}`);
    expect(screen.getByText(contact.heroKicker)).toBeInTheDocument();
    expect(screen.queryByText(contact.heroSubtitle)).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-hero-media")).toBeInTheDocument();
  });

  it("iterates offices source-of-truth - every title and line rendered", () => {
    const { container } = render(<ContactPageView {...defaultProps} />);

    const cards = container.querySelectorAll(".contact-office-card");
    expect(cards).toHaveLength(contact.offices.length);

    contact.offices.forEach((office) => {
      expect(screen.getByText(office.title)).toBeInTheDocument();
      office.lines.forEach((line) => {
        expect(screen.getAllByText(line).length).toBeGreaterThan(0);
      });
    });

    expect(screen.getByText(contact.sectionTitle)).toBeInTheDocument();
    expect(screen.getByText(contact.introTitle)).toBeInTheDocument();
  });

  it("exposes contact channels region with computed tel: and mailto: hrefs and preserves icon testids", () => {
    render(<ContactPageView {...defaultProps} />);

    const region = screen.getByRole("region", { name: contact.channelsAriaLabel });
    expect(region).toHaveClass("contact-channels-panel");
    expect(region).toHaveAttribute("aria-label", contact.channelsAriaLabel);

    expect(screen.getByText(SITE_CONTACT.regionLine)).toBeInTheDocument();
    expect(screen.getByText(contact.channelRegionLabel)).toBeInTheDocument();
    expect(screen.getByText(contact.channelQuotesLabel)).toBeInTheDocument();
    expect(screen.getByText(contact.channelSupportLabel)).toBeInTheDocument();
    expect(screen.getByText(contact.channelEmailLabel)).toBeInTheDocument();

    const salesHref = `tel:${SITE_CONTACT.salesPhone.replace(/\s+/g, "")}`;
    const supportHref = `tel:${SITE_CONTACT.supportPhone.replace(/\s+/g, "")}`;
    const emailHref = `mailto:${SITE_CONTACT.salesEmail}`;

    expect(screen.getByRole("link", { name: SITE_CONTACT.salesPhone })).toHaveAttribute("href", salesHref);
    expect(screen.getByRole("link", { name: SITE_CONTACT.supportPhone })).toHaveAttribute("href", supportHref);
    expect(screen.getByRole("link", { name: SITE_CONTACT.salesEmail })).toHaveAttribute("href", emailHref);

    expect(screen.getByTestId("mappin-icon")).toBeInTheDocument();
    expect(screen.getAllByTestId("phone-icon")).toHaveLength(2);
    expect(screen.getByTestId("envelope-icon")).toBeInTheDocument();
  });

  it("renders Resource Desk and Quick Desk lanes with correct CTA hrefs", () => {
    const { container } = render(<ContactPageView {...defaultProps} />);

    // Lead + tail share the same <p> with an inline link — use container text for split nodes
    expect(container.textContent).toContain(contact.resourceDeskLead);
    expect(screen.getAllByRole("link", { name: contact.resourceDeskCta })[0]).toHaveAttribute("href", "/downloads");
    expect(container.textContent).toContain(contact.resourceDeskTail);

    const quickDesk = screen.getByTestId("contact-quick-desk");
    expect(quickDesk).toBeInTheDocument();
    expect(within(quickDesk).getByText(contact.quickDeskKicker)).toBeInTheDocument();
    expect(within(quickDesk).getByText(contact.quickDeskTitle)).toBeInTheDocument();
    expect(within(quickDesk).getByText(contact.quickDeskDescription)).toBeInTheDocument();

    expect(within(quickDesk).getByRole("link", { name: contact.quickDeskPrimaryCta })).toHaveAttribute("href", "/downloads");
    expect(within(quickDesk).getByRole("link", { name: contact.quickDeskSecondaryCta })).toHaveAttribute(
      "href",
      "/planning",
    );

    expect(screen.getByTestId("contact-form-band")).toBeInTheDocument();
    expect(screen.getByTestId("contact-main")).toBeInTheDocument();
  });

  it("forwards intent and source to CustomerQueryForm and handles null fallback", () => {
    const { rerender } = render(<ContactPageView {...defaultProps} />);

    expect(screen.getByTestId("mock-query-form")).toBeInTheDocument();
    expect(screen.getByText("Intent: quote")).toBeInTheDocument();
    expect(screen.getByText("Source: google")).toBeInTheDocument();
    expect(screen.queryByText("Intent: none")).not.toBeInTheDocument();

    rerender(<ContactPageView {...defaultProps} intent={null} source={null} />);
    expect(screen.getByText("Intent: none")).toBeInTheDocument();
    expect(screen.getByText("Source: none")).toBeInTheDocument();
    expect(screen.queryByText("Intent: quote")).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CareerPageView } from "@/components/career/CareerPageView";
import { CAREER_PAGE_COPY, CAREER_PAGE_JOBS } from "@/features/site/data/routeCopy";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined,
}));

vi.mock("@/components/career/JobCard", () => ({
  JobCard: ({ title, department, location }: { title: string; department: string; location?: string }) => (
    <div data-testid="mock-job-card">
      <h4>{title}</h4>
      <span>
        {department} - {location}
      </span>
    </div>
  ),
}));

vi.mock("@/components/shared/RouteCtaBand", () => ({
  RouteCtaBand: () => <div data-testid="mock-route-cta-band" />,
}));

vi.mock("@/components/ui/MarketingCtaLink", () => ({
  MarketingCtaLink: ({ href, children, label }: { href: string; children: string; label: string }) => (
    <a href={href} aria-label={label}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/site/EditorialHeroMedia", () => ({
  EditorialHeroMedia: () => <div data-testid="mock-career-hero-media" />,
}));

const defaultProps = {
  heroKicker: CAREER_PAGE_COPY.heroKicker,
  heroTitleLead: CAREER_PAGE_COPY.heroTitleLead,
  heroTitleAccent: CAREER_PAGE_COPY.heroTitleAccent,
  heroSubtitle: CAREER_PAGE_COPY.heroSubtitle,
  craftQuote: CAREER_PAGE_COPY.craftQuote,
  craftAttribution: CAREER_PAGE_COPY.craftAttribution,
  introKicker: CAREER_PAGE_COPY.introKicker,
  introTitle: CAREER_PAGE_COPY.introTitle,
  introDescription: CAREER_PAGE_COPY.introDescription,
  pillars: CAREER_PAGE_COPY.pillars,
  processKicker: CAREER_PAGE_COPY.processKicker,
  processTitle: CAREER_PAGE_COPY.processTitle,
  processDescription: CAREER_PAGE_COPY.processDescription,
  processSteps: CAREER_PAGE_COPY.processSteps,
  openingsTitle: CAREER_PAGE_COPY.openingsTitle,
  openingsAvailableTemplate: CAREER_PAGE_COPY.openingsAvailableTemplate,
  jobs: CAREER_PAGE_JOBS,
  fallbackTitle: CAREER_PAGE_COPY.fallbackTitle,
  fallbackDescription: CAREER_PAGE_COPY.fallbackDescription,
  careersEmail: CAREER_PAGE_COPY.careersEmail,
  ctaKicker: CAREER_PAGE_COPY.ctaKicker,
  ctaTitleLead: CAREER_PAGE_COPY.ctaTitleLead,
  ctaTitleAccent: CAREER_PAGE_COPY.ctaTitleAccent,
  ctaDescription: CAREER_PAGE_COPY.ctaDescription,
  ctaPrimary: CAREER_PAGE_COPY.ctaPrimary,
  ctaSecondary: CAREER_PAGE_COPY.ctaSecondary,
};

describe("CareerPageView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes hero as labelled region with computed h1 and mailto href", () => {
    const { container } = render(<CareerPageView {...defaultProps} />);

    const hero = container.querySelector('[data-testid="career-hero"]');
    expect(hero).toHaveAttribute("aria-labelledby", "career-hero-heading");
    expect(hero).toHaveClass("career-hero");

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAttribute("id", "career-hero-heading");
    expect(heading).toHaveTextContent(CAREER_PAGE_COPY.heroTitleLead);
    expect(heading).toHaveTextContent(CAREER_PAGE_COPY.heroTitleAccent);
    expect(screen.getByText(CAREER_PAGE_COPY.heroKicker)).toBeInTheDocument();
    expect(screen.getByText(CAREER_PAGE_COPY.heroSubtitle)).toBeInTheDocument();
    expect(screen.getByTestId("mock-career-hero-media")).toBeInTheDocument();

    const mailLink = screen.getByRole("link", { name: "Email careers" });
    expect(mailLink).toHaveAttribute("href", `mailto:${CAREER_PAGE_COPY.careersEmail}`);

    expect(screen.getByRole("link", { name: CAREER_PAGE_COPY.ctaPrimary })).toHaveAttribute("href", "/contact");
  });

  it("iterates pillars and processSteps source-of-truth - correct count, class, and detail", () => {
    const { container } = render(<CareerPageView {...defaultProps} />);

    const pillars = container.querySelectorAll(".career-pillar");
    expect(pillars).toHaveLength(CAREER_PAGE_COPY.pillars.length);
    CAREER_PAGE_COPY.pillars.forEach((pillar) => {
      expect(screen.getByText(pillar.title)).toBeInTheDocument();
      expect(screen.getByText(pillar.detail)).toBeInTheDocument();
      const titleEl = screen.getByText(pillar.title);
      expect(titleEl).toHaveClass("career-pillar__title");
    });

    expect(screen.getByText(CAREER_PAGE_COPY.craftQuote)).toBeInTheDocument();
    expect(screen.getByText(CAREER_PAGE_COPY.craftAttribution)).toBeInTheDocument();

    const steps = container.querySelectorAll(".career-process__step");
    expect(steps).toHaveLength(CAREER_PAGE_COPY.processSteps.length);
    CAREER_PAGE_COPY.processSteps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.detail)).toBeInTheDocument();
    });

    expect(screen.getByTestId("career-intro")).toBeInTheDocument();
    expect(screen.getByTestId("career-process")).toBeInTheDocument();
    expect(screen.getByText(CAREER_PAGE_COPY.introTitle)).toBeInTheDocument();
    expect(screen.getByText(CAREER_PAGE_COPY.processTitle)).toBeInTheDocument();
  });

  it("renders openings header with template substitution and iterates jobs source-of-truth", () => {
    const { container } = render(<CareerPageView {...defaultProps} />);

    const expectedCountText = CAREER_PAGE_COPY.openingsAvailableTemplate.replace(
      "{count}",
      String(CAREER_PAGE_JOBS.length),
    );
    expect(screen.getByText(expectedCountText)).toBeInTheDocument();
    expect(container.querySelector(".career-job-list")).toBeInTheDocument();

    const jobCards = screen.getAllByTestId("mock-job-card");
    expect(jobCards).toHaveLength(CAREER_PAGE_JOBS.length);
    const revealWrappers = container.querySelectorAll("[data-career-job-reveal]");
    expect(revealWrappers).toHaveLength(CAREER_PAGE_JOBS.length);

    CAREER_PAGE_JOBS.forEach((job) => {
      expect(screen.getByText(job.title)).toBeInTheDocument();
      // department appears multiple times (pillar/process copy) — scope via card
      expect(screen.getAllByText(new RegExp(job.department)).length).toBeGreaterThan(0);
    });

    expect(screen.getByTestId("career-openings")).toBeInTheDocument();
    expect(screen.queryByText("No openings empty placeholder")).not.toBeInTheDocument();
  });

  it("renders openings empty state - zero cards and absent placeholder when jobs empty", () => {
    const { container } = render(<CareerPageView {...defaultProps} jobs={[]} />);

    const expectedEmpty = CAREER_PAGE_COPY.openingsAvailableTemplate.replace("{count}", "0");
    expect(screen.getByText(expectedEmpty)).toBeInTheDocument();
    expect(screen.queryAllByTestId("mock-job-card")).toHaveLength(0);
    expect(container.querySelectorAll("[data-career-job-reveal]")).toHaveLength(0);
    expect(screen.getByTestId("career-openings")).toBeInTheDocument();
  });

  it("exposes fallback and RouteCtaBand with computed mailto and preserves testids", () => {
    render(<CareerPageView {...defaultProps} />);

    expect(screen.getByText(CAREER_PAGE_COPY.fallbackTitle)).toBeInTheDocument();
    expect(screen.getByText(CAREER_PAGE_COPY.fallbackDescription)).toBeInTheDocument();

    const fallbackLink = screen.getByRole("link", { name: CAREER_PAGE_COPY.careersEmail });
    expect(fallbackLink).toHaveAttribute("href", `mailto:${CAREER_PAGE_COPY.careersEmail}`);
    expect(fallbackLink).toHaveClass("link-arrow");

    expect(screen.getByTestId("mock-route-cta-band")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-job-card-unknown")).not.toBeInTheDocument();
  });
});

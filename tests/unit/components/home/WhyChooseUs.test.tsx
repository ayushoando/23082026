import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { HOMEPAGE_WHY_CHOOSE_US_CONTENT } from "@/features/site/data/homepage";

// Mock phosphor icons with data-testid for icon variant asserts
vi.mock("@phosphor-icons/react", () => ({
  Gauge: () => <span data-testid="gauge-icon" />,
  ShieldCheck: () => <span data-testid="shield-icon" />,
  Plant: () => <span data-testid="plant-icon" />,
  Stack: () => <span data-testid="stack-icon" />,
}));

// Mock framer-motion — strip animation props; keep DOM props and data-testid
vi.mock("framer-motion", () => ({
  useReducedMotion: () => true,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      variants: _variants,
      transition: _transition,
      whileInView: _whileInView,
      whileHover: _whileHover,
      viewport: _viewport,
      ...props
    }: {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      variants?: unknown;
      transition?: unknown;
      whileInView?: unknown;
      whileHover?: unknown;
      viewport?: unknown;
      className?: string;
    }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/lib/helpers/motion", () => ({
  fadeUp: () => ({}),
  hoverLift: {},
  staggerContainer: {},
  staggerItem: {},
  useFadeUp: () => ({}),
  useStaggerMotion: () => ({
    container: {},
    item: {},
    initial: "hidden",
    whileInView: "show",
  }),
  useMotionSafeHover: () => ({}),
}));

describe("WhyChooseUs Component", () => {
  it("renders title with computed i18n content and correct heading semantics", () => {
    render(<WhyChooseUs />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent(HOMEPAGE_WHY_CHOOSE_US_CONTENT.titleLead);
    expect(heading).toHaveTextContent(HOMEPAGE_WHY_CHOOSE_US_CONTENT.titleAccent);
    expect(heading).toHaveClass("home-heading");
    expect(heading.querySelector(".text-accent-italic")).not.toBeNull();
    expect(heading.querySelector(".text-accent-italic")).toHaveTextContent(
      HOMEPAGE_WHY_CHOOSE_US_CONTENT.titleAccent,
    );
  });

  it("renders all four feature cards with computed title/tagline/icon variant", () => {
    render(<WhyChooseUs />);

    // Card 1 — ocean Gauge
    const perfHeading = screen.getByRole("heading", { level: 3, name: "Performance-graded" });
    expect(perfHeading).toHaveTextContent("Performance-graded");
    expect(perfHeading).toHaveClass("home-why-card__title");
    expect(screen.getByText("Load · cycle · ergonomics")).toHaveClass("home-why-card__tagline");
    expect(screen.getByTestId("gauge-icon")).toBeInTheDocument();

    // Card 2 — bronze ShieldCheck
    expect(screen.getByRole("heading", { level: 3, name: "Built to last" })).toBeInTheDocument();
    expect(screen.getByText("Warranty by model")).toHaveClass("home-why-card__tagline");
    expect(screen.getByTestId("shield-icon")).toBeInTheDocument();

    // Card 3 — sustain Plant
    expect(screen.getByRole("heading", { level: 3, name: "Lower rework" })).toBeInTheDocument();
    expect(screen.getByText("Durable materials")).toBeInTheDocument();
    expect(screen.getByTestId("plant-icon")).toBeInTheDocument();

    // Card 4 — taupe Stack
    expect(screen.getByRole("heading", { level: 3, name: "Scales cleanly" })).toBeInTheDocument();
    expect(screen.getByText("Pilot to rollout")).toBeInTheDocument();
    expect(screen.getByTestId("stack-icon")).toBeInTheDocument();
  });

  it("applies icon variant classes via toHaveClass per card slot", () => {
    const { container } = render(<WhyChooseUs />);

    const iconWraps = container.querySelectorAll(".home-why-icon");
    expect(iconWraps).toHaveLength(4);
    expect(iconWraps[0]).toHaveClass("home-feature-icon--ocean");
    expect(iconWraps[1]).toHaveClass("home-feature-icon--bronze");
    expect(iconWraps[2]).toHaveClass("home-feature-icon--sustain");
    expect(iconWraps[3]).toHaveClass("home-feature-icon--taupe");
  });

  it("excludes BIFMA/universal warranty claims (honesty guard) and uses correct section semantics", () => {
    const { container } = render(<WhyChooseUs />);

    expect(screen.queryByText(/BIFMA/i)).toBeNull();
    expect(screen.queryByText(/5-year warranty/i)).toBeNull();
    expect(container.querySelector('[data-testid="home-why"]')).toHaveClass("home-section--white");
    expect(container.querySelector('[data-testid="home-why"]')?.tagName).toBe("SECTION");
    expect(container.querySelector(".home-shell-xl")).not.toBeNull();
  });

  it("renders card surface classes and grid layout", () => {
    const { container } = render(<WhyChooseUs />);

    const cards = container.querySelectorAll(".home-why-card");
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card).toHaveClass("home-tool-card");
      expect(card).toHaveClass("home-why-card");
    }
    expect(container.querySelector(".grid")).toHaveClass("lg:grid-cols-4");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Hero } from "@/components/home/Hero";

vi.mock("next/navigation", () => ({
  usePathname: () => "/solutions",
}));

vi.mock("@/lib/analytics/siteEvents", () => ({
  trackSiteCtaClick: vi.fn(),
  handlePlannerEntryNavigation: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, style, ...props }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
      <div style={style} {...props}>
        {children}
      </div>
    ),
    p: ({ children, ...props }: { children?: React.ReactNode }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: { children?: React.ReactNode }) => <span {...props}>{children}</span>,
  },
  useScroll: () => ({ scrollYProgress: 0 }),
  useTransform: () => 0,
}));

vi.mock("@phosphor-icons/react", () => ({
  ArrowRight: () => <span data-testid="arrow-right" />,
}));

describe("Hero Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders default title and CTA link with computed href and tracking surface", () => {
    render(<Hero />);

    const link = screen.getByRole("link", { name: /Discover office furniture/i });
    expect(link).toHaveAttribute("href", "/products");
    expect(link.className).toContain("btn-primary");
    expect(link.className).toContain("min-h-11");
    expect(screen.getByText(/Create your/)).toBeInTheDocument();
    expect(screen.getByText(/best work/)).toBeInTheDocument();
    expect(screen.getByTestId("arrow-right")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders custom title/subtitle and hides CTA when showButton is false", () => {
    render(<Hero title="Custom Title" subtitle="Custom Subtitle" showButton={false} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Custom Title");
    expect(screen.getByText("Custom Subtitle")).toHaveTextContent("Custom Subtitle");
    expect(screen.queryByRole("link", { name: /Discover office furniture/i })).toBeNull();
    expect(screen.queryByTestId("arrow-right")).toBeNull();
  });

  it("applies variant classes via toHaveClass and tracks CTA click with computed label", () => {
    const { rerender, container } = render(<Hero variant="small" />);
    expect(container.firstChild).toHaveClass("page-hero");
    expect(container.firstChild).not.toHaveClass("h-[85vh]");

    rerender(<Hero variant="cinema" />);
    expect(container.firstChild).toHaveClass("h-[85vh]");
    expect(container.firstChild).toHaveClass("hero-section");

    const link = screen.getByRole("link", { name: /Discover office furniture/i });
    fireEvent.click(link);
    expect(link).toHaveAttribute("href", "/products");
  });

  it("applies custom section, image, and content classes plus custom button href", () => {
    const { container } = render(
      <Hero
        variant="small"
        backgroundImage="/hero.jpg"
        buttonLink="/custom-products"
        buttonText="Shop now"
        className="custom-hero-height"
        imageClassName="custom-hero-image"
        contentClassName="custom-hero-content"
      />,
    );

    expect(container.firstChild).toHaveClass("custom-hero-height");
    const bgImg = container.querySelector("img.custom-hero-image") as HTMLImageElement;
    expect(bgImg).not.toBeNull();
    expect(bgImg).toHaveAttribute("src", "/hero.jpg");
    expect(bgImg).toHaveClass("custom-hero-image");
    expect(bgImg.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".section-y-hero")).toHaveClass("custom-hero-content");
    expect(screen.getByRole("link", { name: "Shop now" })).toHaveAttribute("href", "/custom-products");
  });

  it("uses route hero semantic heading hierarchy", () => {
    const { rerender } = render(<Hero variant="small" title="Route Hero" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Route Hero");
    expect(screen.getByRole("heading", { level: 1 }).className).toContain("page-hero-title");

    rerender(<Hero variant="default" title="Default Hero" />);
    expect(screen.getByRole("heading", { level: 1 }).className).toContain("home-hero-title-default");
  });
});

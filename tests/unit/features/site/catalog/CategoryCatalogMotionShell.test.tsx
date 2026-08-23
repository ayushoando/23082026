import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { CategoryCatalogMotionShell } from "@/features/site/catalog/CategoryCatalogMotionShell";

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined,
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn(() => ({ revert: vi.fn() })),
    from: vi.fn(),
    to: vi.fn(),
  },
}));

vi.mock("@/lib/helpers/gsapMotion", () => ({
  registerGsapPlugins: vi.fn(),
  gsapReducedMotion: () => true,
  GSAP_EASE_OUT: "power3.out",
  GSAP_REVEAL: { y: 28, opacity: 0, duration: 0.85, stagger: 0.11 },
  GSAP_SCROLL_REVEAL: { y: 32, opacity: 0, duration: 0.75, stagger: 0.09 },
}));

describe("CategoryCatalogMotionShell — behavior", () => {
  it("renders root section with default testId, className, and children with reveal/card attrs", () => {
    render(
      <CategoryCatalogMotionShell className="catalog-lane">
        <p data-catalog-reveal>Header</p>
        <article data-catalog-card>Card</article>
      </CategoryCatalogMotionShell>,
    );

    const root = screen.getByTestId("category-catalog");
    expect(root.tagName).toBe("SECTION");
    expect(root).toHaveClass("catalog-lane");
    expect(root).toHaveAttribute("data-testid", "category-catalog");

    const header = screen.getByText("Header");
    expect(header).toHaveAttribute("data-catalog-reveal");
    expect(header.tagName).toBe("P");

    const card = screen.getByText("Card");
    expect(card).toHaveAttribute("data-catalog-card");
    expect(card.tagName).toBe("ARTICLE");

    expect(screen.queryByText("non-existent-catalog-node")).not.toBeInTheDocument();
  });

  it("honors custom testId and merges className while preserving section semantics", () => {
    render(
      <CategoryCatalogMotionShell className="catalog-lane custom-modifier" testId="custom-catalog-root">
        <span data-catalog-reveal>Reveal A</span>
        <span data-catalog-reveal>Reveal B</span>
        <div data-catalog-card>Card 1</div>
        <div data-catalog-card>Card 2</div>
      </CategoryCatalogMotionShell>,
    );

    const root = screen.getByTestId("custom-catalog-root");
    expect(root.tagName).toBe("SECTION");
    expect(root).toHaveClass("catalog-lane");
    expect(root).toHaveClass("custom-modifier");
    expect(root).toHaveAttribute("data-testid", "custom-catalog-root");
    expect(screen.queryByTestId("category-catalog")).not.toBeInTheDocument();

    const reveals = document.querySelectorAll("[data-catalog-reveal]");
    expect(reveals.length).toBe(2);
    reveals.forEach((el) => {
      expect(el.closest("section")).toBe(root);
    });

    const cards = document.querySelectorAll("[data-catalog-card]");
    expect(cards.length).toBe(2);
    cards.forEach((el) => {
      expect(el.closest("section")).toBe(root);
    });

    expect(screen.getByText("Reveal A").textContent).toBe("Reveal A");
    expect(screen.getByText("Card 2").textContent).toBe("Card 2");
  });

  it("renders without className and without children as empty catalog section", () => {
    const { container } = render(<CategoryCatalogMotionShell>{null}</CategoryCatalogMotionShell>);

    const root = screen.getByTestId("category-catalog");
    expect(root.tagName).toBe("SECTION");
    expect(root).not.toHaveClass("catalog-lane");
    expect(root.children.length).toBe(0);
    expect(container.querySelectorAll("[data-catalog-reveal]").length).toBe(0);
    expect(container.querySelectorAll("[data-catalog-card]").length).toBe(0);
  });
});

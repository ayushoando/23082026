import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoryListingHero } from "@/features/site/catalog/CategoryListingHero";

describe("CategoryListingHero", () => {
  it("renders a visible Home > Products > Category trail", () => {
    render(
      <CategoryListingHero
        categoryName="Tables"
        description="Cabin and meeting tables."
        heroImage={{ src: "/hero.webp", alt: "Tables" }}
        subcategoryLinks={[]}
        activeSubcategories={[]}
        onSubcategoryToggle={() => undefined}
      />,
    );

    const trail = screen.getByTestId("category-listing-breadcrumb");
    expect(trail).toHaveAttribute("aria-label", "Breadcrumb");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(trail.querySelector('[aria-current="page"]')).toHaveTextContent("Tables");
  });
});

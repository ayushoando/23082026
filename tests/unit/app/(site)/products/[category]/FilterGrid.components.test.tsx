import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  AccordionSection,
  ActiveChips,
  CheckList,
  ProductCard,
  SustainabilityButtons,
  Toggle,
} from "@/features/site/catalog/FilterGrid.components";
import type { ActiveFilters } from "@/lib/catalog/site/filters";
import type { FlatProduct } from "@/features/site/catalog/FilterGrid.helpers";
import type { ProductCompareItem } from "@/lib/store/productCompare";
import type { trackCompareToggled } from "@/lib/analytics/siteEvents";

type TrackCompareToggled = typeof trackCompareToggled;

const { mockTrackCompareToggled } = vi.hoisted(() => ({
  mockTrackCompareToggled: vi.fn<TrackCompareToggled>(),
}));

vi.mock("@phosphor-icons/react", () => ({
  CaretDown: () => <span data-testid="icon-caret-down" />,
  CaretUp: () => <span data-testid="icon-caret-up" />,
  GitDiff: () => <span data-testid="icon-git-diff" />,
  X: () => <span data-testid="icon-x" />,
}));

vi.mock("@/features/site/data/routeCopy", () => ({
  CATEGORY_ROUTE_COPY: {
    activeSearchLabel: "Search",
    activeFiltersLabel: "Active Filters",
    activeCountLabel: "{count} filters active",
    clearFiltersCta: "Clear all",
  },
}));

const EXPECTED_THRESHOLDS = [4, 6, 8] as const;

vi.mock("@/lib/catalog/site/filters", () => ({
  SUSTAINABILITY_THRESHOLDS: [4, 6, 8],
}));

vi.mock("@/lib/analytics/siteEvents", () => ({
  trackCompareToggled: mockTrackCompareToggled,
}));

const mockToggleItem = vi.fn<(item: ProductCompareItem) => void>();
let mockCompareItems: ProductCompareItem[] = [];

interface CompareState {
  items: ProductCompareItem[];
  toggleItem: (item: ProductCompareItem) => void;
}

vi.mock("@/lib/store/productCompare", () => ({
  useProductCompare: <T,>(selector: (state: CompareState) => T): T =>
    selector({
      items: mockCompareItems,
      toggleItem: mockToggleItem,
    }),
}));

describe("FilterGrid.components — behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompareItems = [];
  });

  describe("AccordionSection", () => {
    it("renders closed by default with heading, count, chevron-down, and aria-expanded false", () => {
      const { container } = render(
        <AccordionSection title="Materials" count={3}>
          <div>Accordion Content</div>
        </AccordionSection>,
      );

      expect(screen.getByText("Materials")).toBeInTheDocument();
      expect(screen.getByText("Materials")).toHaveClass("filter-ui-heading");
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("3")).toHaveClass("filter-ui-count");
      expect(screen.queryByText("Accordion Content")).not.toBeInTheDocument();

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveClass("group");
      expect(container.querySelector('[data-testid="icon-caret-down"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="icon-caret-up"]')).toBeNull();
      expect(button.closest("div")).toHaveClass("border-b");
    });

    it("toggles content, aria-expanded, and chevrons on click", () => {
      const { container } = render(
        <AccordionSection title="Test Accordion" count={5}>
          <div>Accordion Content</div>
        </AccordionSection>,
      );

      const button = screen.getByRole("button");
      expect(screen.queryByText("Accordion Content")).not.toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.getByText("Accordion Content")).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(container.querySelector('[data-testid="icon-caret-up"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="icon-caret-down"]')).toBeNull();
      expect(container.querySelector(".px-4.pb-4")).not.toBeNull();

      fireEvent.click(button);
      expect(screen.queryByText("Accordion Content")).not.toBeInTheDocument();
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(container.querySelector('[data-testid="icon-caret-down"]')).not.toBeNull();
    });

    it("hides count badge when zero or undefined and renders open when defaultOpen", () => {
      const { container } = render(
        <AccordionSection title="No Count">
          <div>Body</div>
        </AccordionSection>,
      );
      expect(container.querySelector(".filter-ui-count")).toBeNull();
      expect(screen.queryByText("Body")).not.toBeInTheDocument();

      const { container: c2 } = render(
        <AccordionSection title="Zero Count" count={0}>
          <div>Zero Body</div>
        </AccordionSection>,
      );
      expect(c2.querySelector(".filter-ui-count")).toBeNull();

      render(
        <AccordionSection title="Open" count={2} defaultOpen>
          <div>Open Body</div>
        </AccordionSection>,
      );
      expect(screen.getByText("Open Body")).toBeInTheDocument();
      // Multiple buttons now rendered; find the one for "Open"
      const openBtn = screen.getByRole("button", { name: /Open/ });
      expect(openBtn).toHaveAttribute("aria-expanded", "true");
      expect(openBtn.querySelector(".filter-ui-count")).not.toBeNull();
    });
  });

  describe("CheckList", () => {
    it("renders checkboxes with checked state, labels, and list semantics", () => {
      const onToggle = vi.fn();
      render(<CheckList options={["Mesh", "Leather"]} selected={["Mesh"]} onToggle={onToggle} />);

      const mesh = screen.getByLabelText("Mesh") as HTMLInputElement;
      const leather = screen.getByLabelText("Leather") as HTMLInputElement;
      expect(mesh).toBeChecked();
      expect(mesh).toHaveAttribute("type", "checkbox");
      expect(mesh).toHaveClass("accent-heading");
      expect(leather).not.toBeChecked();
      expect(screen.getByText("Mesh")).toHaveClass("capitalize");
      expect(screen.getByText("Leather")).toHaveClass("capitalize");
      expect(document.querySelectorAll("ul.space-y-1\\.5 li")).toHaveLength(2);
      expect(document.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    });

    it("calls onToggle with the clicked option", () => {
      const onToggle = vi.fn();
      render(<CheckList options={["option1", "option2"]} selected={["option1"]} onToggle={onToggle} />);

      fireEvent.click(screen.getByLabelText("option2"));
      expect(onToggle).toHaveBeenCalledWith("option2");
      expect(onToggle).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByLabelText("option1"));
      expect(onToggle).toHaveBeenCalledWith("option1");
      expect(screen.queryByText("No options available")).not.toBeInTheDocument();
    });

    it("renders fallback placeholder when options empty and hides checkboxes", () => {
      const { container } = render(<CheckList options={[]} selected={[]} onToggle={vi.fn()} />);

      expect(screen.getByText("No options available")).toBeInTheDocument();
      expect(screen.getByText("No options available")).toHaveClass("italic");
      expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
      expect(container.querySelector("ul")).toBeNull();
    });
  });

  describe("SustainabilityButtons", () => {
    it("renders Any plus thresholds from source-of-truth with variant classes", () => {
      const onSelect = vi.fn();
      const { container } = render(<SustainabilityButtons selected={6} onSelect={onSelect} />);

      expect(screen.getByRole("button", { name: "Any" })).toBeInTheDocument();
      for (const t of EXPECTED_THRESHOLDS) {
        expect(screen.getByRole("button", { name: `>= ${t}` })).toBeInTheDocument();
      }
      expect(container.querySelectorAll("button")).toHaveLength(EXPECTED_THRESHOLDS.length + 1);
      expect(container.querySelector(".flex.flex-wrap.gap-2")).not.toBeNull();

      const active = screen.getByRole("button", { name: ">= 6" });
      expect(active).toHaveClass("bg-accent1");
      expect(active).toHaveClass("border-accent1");
      const idle = screen.getByRole("button", { name: ">= 4" });
      expect(idle).toHaveClass("bg-panel");
      expect(idle).toHaveClass("border-muted");
      expect(screen.getByRole("button", { name: "Any" })).toHaveClass("bg-panel");
    });

    it("selects and deselects thresholds with correct null-toggle semantics", () => {
      const onSelect = vi.fn();
      const { rerender } = render(<SustainabilityButtons selected={null} onSelect={onSelect} />);

      const anyBtn = screen.getByRole("button", { name: "Any" });
      expect(anyBtn).toHaveClass("bg-accent1");
      fireEvent.click(anyBtn);
      expect(onSelect).toHaveBeenCalledWith(null);

      fireEvent.click(screen.getByRole("button", { name: ">= 4" }));
      expect(onSelect).toHaveBeenCalledWith(4);

      onSelect.mockClear();
      rerender(<SustainabilityButtons selected={4} onSelect={onSelect} />);
      fireEvent.click(screen.getByRole("button", { name: ">= 4" }));
      expect(onSelect).toHaveBeenCalledWith(null);

      onSelect.mockClear();
      rerender(<SustainabilityButtons selected={8} onSelect={onSelect} />);
      fireEvent.click(screen.getByRole("button", { name: ">= 8" }));
      expect(onSelect).toHaveBeenCalledWith(null);
      fireEvent.click(screen.getByRole("button", { name: ">= 6" }));
      expect(onSelect).toHaveBeenCalledWith(6);
    });

    it("applies accent class only to the selected button", () => {
      const onSelect = vi.fn();
      const { container } = render(<SustainabilityButtons selected={null} onSelect={onSelect} />);
      expect(container.querySelectorAll(".bg-accent1")).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Any" })).toHaveClass("bg-accent1");

      const { container: c2 } = render(<SustainabilityButtons selected={8} onSelect={vi.fn()} />);
      expect(c2.querySelectorAll(".bg-accent1")).toHaveLength(1);
      expect(c2.querySelectorAll("button.bg-accent1")[0]).toHaveTextContent(">= 8");
    });
  });

  describe("Toggle", () => {
    it("renders switch with label, aria-checked false, hover idle classes", () => {
      const onChange = vi.fn();
      const { container } = render(<Toggle label="Height adjustable" checked={false} onChange={onChange} />);

      expect(screen.getByText("Height adjustable")).toBeInTheDocument();
      expect(screen.getByText("Height adjustable")).toHaveClass("text-body");
      const btn = screen.getByRole("switch", { name: "Height adjustable" });
      expect(btn).toHaveAttribute("aria-checked", "false");
      expect(btn).toHaveAttribute("aria-label", "Height adjustable");
      expect(btn).toHaveClass("bg-hover");
      expect(btn).toHaveClass("rounded-full");
      const thumb = container.querySelector("span.absolute");
      expect(thumb).not.toBeNull();
      expect(thumb).toHaveClass("left-[0.1875rem]");
      expect(thumb).toHaveClass("bg-panel");
      expect(screen.queryByText("Missing")).not.toBeInTheDocument();
    });

    it("toggles checked state via click and applies accent classes", () => {
      const onChange = vi.fn();
      const { rerender, container } = render(<Toggle label="Feature A" checked={false} onChange={onChange} />);

      const btn = screen.getByRole("switch");
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(true);
      expect(onChange).toHaveBeenCalledTimes(1);

      rerender(<Toggle label="Feature A" checked={true} onChange={onChange} />);
      const btnOn = screen.getByRole("switch");
      expect(btnOn).toHaveAttribute("aria-checked", "true");
      expect(btnOn).toHaveClass("bg-accent1");
      const thumbOn = container.querySelector("span.absolute");
      expect(thumbOn).toHaveClass("left-[1.125rem]");

      fireEvent.click(btnOn);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it("maintains label association and cursor pointer styling", () => {
      render(<Toggle label="BIFMA" checked={true} onChange={vi.fn()} />);
      const label = screen.getByText("BIFMA").closest("label");
      expect(label).not.toBeNull();
      expect(label).toHaveClass("cursor-pointer");
      expect(label).toHaveClass("flex");
      expect(screen.getByRole("switch", { name: "BIFMA" })).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("ProductCard", () => {
    const baseProduct: FlatProduct = {
      id: "prod-123",
      slug: "awesome-chair",
      name: "Awesome Chair",
      description: "An ergonomic office chair.",
      flagshipImage: "/img1.jpg",
      sceneImages: [],
      images: ["/img1.jpg"],
      variants: [],
      detailedInfo: {
        overview: "An ergonomic office chair.",
        features: [],
        dimensions: "W60 x D60 x H90 cm",
        materials: ["Powder-coated Aluminium"],
      },
      seriesId: "series-1",
      seriesName: "Series One",
      metadata: {
        sustainabilityScore: 8,
        bifmaCertified: true,
      },
      specs: {
        dimensions: "W60 x D60 x H90 cm",
        materials: ["Powder-coated Aluminium"],
      },
    } satisfies FlatProduct;

    it("renders product details, eyebrow, BIFMA, dims, materials, and catalog-card chrome", () => {
      const { container } = render(
        <ProductCard product={baseProduct} categoryId="office-chairs" categoryName="Office Chairs" contextQueryString="q=chair&eco=8" />,
      );

      expect(screen.getByRole("heading", { level: 2, name: "Awesome Chair" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2 })).toHaveClass("text-strong");
      expect(screen.getByText("Series One")).toBeInTheDocument();
      expect(screen.getByText("Series One")).toHaveClass("catalog-card__eyebrow");
      expect(screen.getByText("BIFMA")).toBeInTheDocument();
      expect(screen.getByText("BIFMA")).toHaveClass("catalog-card__badge");
      expect(container.querySelector(".catalog-card__badge-row")).not.toBeNull();

      expect(screen.getByText("W 60 x D 60 x H 90 cm")).toBeInTheDocument();
      expect(screen.getByText("Powder-coated Aluminium")).toBeInTheDocument();
      expect(screen.getByText("Powder-coated Aluminium")).toHaveClass("catalog-card__signal");
      expect(container.querySelector(".catalog-card__dims")).not.toBeNull();
      expect(container.querySelector(".catalog-card__dims")).not.toHaveAttribute("aria-hidden");

      const card = container.querySelector("article.catalog-card");
      expect(card).not.toBeNull();
      expect(card).toHaveAttribute("data-catalog-card");
      expect(card).toHaveClass("group");
      expect(container.querySelector(".catalog-card__media")).not.toBeNull();
      expect(container.querySelector(".catalog-card__media-layer")).not.toBeNull();

      const link = container.querySelector('a[href*="/products/office-chairs/awesome-chair"]') as HTMLAnchorElement | null;
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute("href", "/products/office-chairs/awesome-chair?from=q%3Dchair%26eco%3D8");

      const img = screen.getByAltText(/Product image of Awesome Chair in Office Chairs category|Awesome Chair/i) as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toMatch(/\/img1\.jpg$/);
      expect(img).toHaveClass("catalog-card__media-img");
      expect(img).toHaveClass("object-contain");

      const compareBtn = screen.getByRole("button", { name: "Add to compare" });
      expect(compareBtn).toHaveClass("catalog-card__compare--idle");
      expect(compareBtn).toHaveTextContent("Compare");
      expect(container.querySelector('[data-testid="icon-git-diff"]')).not.toBeNull();
      expect(screen.queryByRole("button", { name: "Remove from compare" })).not.toBeInTheDocument();
    });

    it("computes href without query, prefers subcategory eyebrow, and derives compare id", () => {
      const withSubcategory: FlatProduct = {
        ...baseProduct,
        seriesName: "Series One",
        metadata: { ...baseProduct.metadata, subcategory: "Task Chairs" },
      } satisfies FlatProduct;

      const { container } = render(
        <ProductCard product={withSubcategory} categoryId="seating" categoryName="Seating" contextQueryString="" />,
      );

      expect(screen.getByText("Task Chairs")).toBeInTheDocument();
      expect(screen.queryByText("Series One")).not.toBeInTheDocument();
      const link = container.querySelector('a[href="/products/seating/awesome-chair"]') as HTMLAnchorElement | null;
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute("href", "/products/seating/awesome-chair");

      const compareBtn = screen.getByRole("button", { name: "Add to compare" });
      fireEvent.click(compareBtn);
      expect(mockToggleItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "compare-seating-awesome-chair",
          productUrlKey: "awesome-chair",
          categoryId: "seating",
        }),
      );
    });

    it("hides BIFMA, hides eyebrow when no subcategory/series, and handles empty dims/materials", () => {
      const sparse: FlatProduct = {
        ...baseProduct,
        seriesName: "",
        metadata: { bifmaCertified: false },
        specs: { dimensions: "", materials: [] },
        detailedInfo: { overview: "", features: [], dimensions: "", materials: [] },
      } satisfies FlatProduct;

      const { container } = render(
        <ProductCard product={sparse} categoryId="office-chairs" categoryName="Office Chairs" contextQueryString="" />,
      );

      expect(container.querySelector(".catalog-card__badge")).toBeNull();
      expect(container.querySelector(".catalog-card__eyebrow")).toBeNull();
      const dims = container.querySelector(".catalog-card__dims") as HTMLElement | null;
      expect(dims).not.toBeNull();
      expect(dims).toHaveAttribute("aria-hidden", "true");
      expect(container.querySelector(".catalog-card__signal")).toBeNull();
    });

    it("triggers compare action with tracking and computed href", () => {
      render(<ProductCard product={baseProduct} categoryId="office-chairs" categoryName="Office Chairs" contextQueryString="" />);

      const compareBtn = screen.getByRole("button", { name: /Add to compare/i });
      fireEvent.click(compareBtn);

      expect(mockToggleItem).toHaveBeenCalledWith({
        id: "compare-office-chairs-awesome-chair",
        productUrlKey: "awesome-chair",
        categoryId: "office-chairs",
        name: "Awesome Chair",
        image: expect.stringMatching(/\/img1\.jpg$/),
        href: "/products/office-chairs/awesome-chair",
      });
      expect(mockTrackCompareToggled).toHaveBeenCalledWith(
        expect.objectContaining({
          surface: "category-grid-card",
          categoryId: "office-chairs",
          productId: "awesome-chair",
          nextState: "added",
        }),
      );
      expect(mockTrackCompareToggled).toHaveBeenCalledTimes(1);
    });

    it("shows Compared state with active class and Remove label when already in compare", () => {
      mockCompareItems = [
        {
          id: "compare-office-chairs-awesome-chair",
          productUrlKey: "awesome-chair",
          categoryId: "office-chairs",
          name: "Awesome Chair",
          image: "/img1.jpg",
          href: "/products/office-chairs/awesome-chair",
        },
      ];

      const { container } = render(
        <ProductCard product={baseProduct} categoryId="office-chairs" categoryName="Office Chairs" contextQueryString="" />,
      );

      expect(screen.getByText("Compared")).toBeInTheDocument();
      const compareBtn = screen.getByRole("button", { name: "Remove from compare" });
      expect(compareBtn).toBeInTheDocument();
      expect(compareBtn).toHaveClass("catalog-card__compare--active");
      expect(compareBtn).toHaveAttribute("aria-label", "Remove from compare");
      expect(container.querySelector(".catalog-card__compare--idle")).toBeNull();

      fireEvent.click(compareBtn);
      expect(mockToggleItem).toHaveBeenCalledWith(
        expect.objectContaining({ id: "compare-office-chairs-awesome-chair" }),
      );
      expect(mockTrackCompareToggled).toHaveBeenCalledWith(
        expect.objectContaining({ nextState: "removed" }),
      );
    });
  });

  describe("ActiveChips", () => {
    const dummyFilters = {
      query: "ergonomic",
      series: "Aero",
      subcategory: ["Task", "Executive"],
      priceRange: ["mid"],
      material: ["Mesh"],
      hasHeadrest: true,
      isHeightAdjustable: true,
      bifmaCertified: true,
      isStackable: true,
      sort: "az",
      ecoMin: 8,
    } satisfies ActiveFilters;

    it("renders all chips from source-of-truth filters with labels and count", () => {
      const onRemove = vi.fn();
      const onClearAll = vi.fn();
      const { container } = render(<ActiveChips filters={dummyFilters} onRemove={onRemove} onClearAll={onClearAll} total={10} />);

      expect(screen.getByText("Active Filters")).toBeInTheDocument();
      expect(screen.getByText("Active Filters")).toHaveClass("filter-ui-label");
      expect(screen.getByText("10 filters active")).toBeInTheDocument();
      expect(container.querySelector(".border-b.border-soft.py-3")).not.toBeNull();
      expect(container.querySelector(".typ-micro.text-muted")).not.toBeNull();

      expect(screen.getByText("Search: ergonomic")).toBeInTheDocument();
      expect(screen.getByText("Series: Aero")).toBeInTheDocument();
      expect(screen.getByText("Subcategory: Task")).toBeInTheDocument();
      expect(screen.getByText("Subcategory: Executive")).toBeInTheDocument();
      expect(screen.getByText("Price: mid")).toBeInTheDocument();
      expect(screen.getByText("Mesh")).toBeInTheDocument();
      expect(screen.getByText("Mesh")).toHaveClass("capitalize");
      expect(screen.getByText("With headrest")).toBeInTheDocument();
      expect(screen.getByText("Height adjustable")).toBeInTheDocument();
      expect(screen.getByText("BIFMA certified")).toBeInTheDocument();
      expect(screen.getByText("Stackable")).toBeInTheDocument();
      expect(screen.getByText("Eco >= 8")).toBeInTheDocument();

      expect(container.querySelectorAll('[data-testid="icon-x"]').length).toBeGreaterThanOrEqual(11);
      expect(container.querySelectorAll("button.rounded-full")).toHaveLength(11);
      expect(container.querySelectorAll("button.rounded-full")[0]).toHaveClass("border-soft");
      expect(screen.getByText("Clear all")).toBeInTheDocument();
      expect(screen.getByText("Clear all")).toHaveClass("underline");
      expect(screen.queryByText("No filters")).not.toBeInTheDocument();
    });

    it("calls onRemove with correct key/value per chip and onClearAll", () => {
      const onRemove = vi.fn();
      const onClearAll = vi.fn();
      render(<ActiveChips filters={dummyFilters} onRemove={onRemove} onClearAll={onClearAll} total={10} />);

      fireEvent.click(screen.getByText("With headrest"));
      expect(onRemove).toHaveBeenCalledWith("hasHeadrest", undefined);

      fireEvent.click(screen.getByText("Height adjustable"));
      expect(onRemove).toHaveBeenCalledWith("isHeightAdjustable", undefined);

      fireEvent.click(screen.getByText("BIFMA certified"));
      expect(onRemove).toHaveBeenCalledWith("bifmaCertified", undefined);

      fireEvent.click(screen.getByText("Stackable"));
      expect(onRemove).toHaveBeenCalledWith("isStackable", undefined);

      fireEvent.click(screen.getByText("Search: ergonomic"));
      expect(onRemove).toHaveBeenCalledWith("query", "ergonomic");

      fireEvent.click(screen.getByText("Series: Aero"));
      expect(onRemove).toHaveBeenCalledWith("series", undefined);

      fireEvent.click(screen.getByText("Subcategory: Task"));
      expect(onRemove).toHaveBeenCalledWith("subcategory", "Task");

      fireEvent.click(screen.getByText("Price: mid"));
      expect(onRemove).toHaveBeenCalledWith("priceRange", "mid");

      fireEvent.click(screen.getByText("Mesh"));
      expect(onRemove).toHaveBeenCalledWith("material", "Mesh");

      fireEvent.click(screen.getByText("Eco >= 8"));
      expect(onRemove).toHaveBeenCalledWith("ecoMin", 8);

      fireEvent.click(screen.getByText("Clear all"));
      expect(onClearAll).toHaveBeenCalledTimes(1);
      expect(onClearAll).toHaveBeenCalled();
    });

    it("returns null when total is 0 and hides all chips", () => {
      const { container } = render(
        <ActiveChips filters={dummyFilters} onRemove={vi.fn()} onClearAll={vi.fn()} total={0} />,
      );
      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("Active Filters")).not.toBeInTheDocument();
      expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
      expect(screen.queryByText("Search: ergonomic")).not.toBeInTheDocument();
    });
  });
});
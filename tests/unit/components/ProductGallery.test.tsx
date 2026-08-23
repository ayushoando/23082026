import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ProductGallery } from "@/components/ProductGallery";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/assetPaths";

vi.mock("@phosphor-icons/react", () => ({
  Armchair: () => <span data-testid="icon-armchair" aria-hidden="true" />,
}));

const images = ["/img1.jpg", "/img2.jpg", "/img3.jpg"] as const;
const productName = "Chair";

describe("ProductGallery — behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders region with computed aria-label, roledescription, main image src/alt, and count computed", () => {
    const { container } = render(<ProductGallery images={[...images]} productName={productName} />);

    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-label", "Chair gallery");
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(region).toHaveClass("product-gallery");

    const mainImg = screen.getByAltText("Primary product gallery image of Chair");
    expect(mainImg).toHaveAttribute("src", "/img1.jpg");
    expect(mainImg).toHaveClass("product-gallery__main-img");
    // MockNextImage preserves data attributes
    expect(mainImg).toHaveAttribute("data-priority", "true");
    expect(mainImg).toHaveAttribute("data-unoptimized", "true");

    // Count is aria-live with sr-only and visible badge
    const countRegion = container.querySelector(".product-gallery__count") as HTMLElement | null;
    expect(countRegion).not.toBeNull();
    expect(countRegion).toHaveAttribute("aria-live", "polite");
    expect(countRegion?.querySelector(".sr-only")).toHaveTextContent("Image 1 of 3 for Chair");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText("1 / 3").closest("span")).toHaveAttribute("aria-hidden", "true");

    expect(container.querySelector(".product-gallery__main")).not.toBeNull();
    expect(screen.queryByRole("img", { name: `${productName} image unavailable` })).not.toBeInTheDocument();
    expect(screen.queryByText("Photo coming soon")).not.toBeInTheDocument();
  });

  it("uses fallback placeholder when images array is empty — branding icon and copy with attributes", () => {
    const { container } = render(<ProductGallery images={[]} productName={productName} />);

    const placeholder = screen.getByRole("img", { name: `${productName} image unavailable` });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveClass("product-gallery__placeholder");
    expect(screen.getByText("Photo coming soon")).toBeInTheDocument();
    expect(screen.getByText("Photo coming soon")).toHaveClass("product-gallery__placeholder-copy");
    expect(container.querySelector(".product-gallery__main--placeholder")).not.toBeNull();
    expect(screen.getByTestId("icon-armchair")).toBeInTheDocument();

    expect(screen.queryByText("1 / 3")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Primary product gallery image of Chair")).not.toBeInTheDocument();
    expect(container.querySelector(".product-gallery__count")).toBeNull();
    expect(container.querySelector(".product-gallery__thumbs")).toBeNull();
  });

  it("deduplicates and filters fallback images via buildGalleryCandidates — iterate source-of-truth", () => {
    // Duplicate /img1 + fallback appended should still yield 3 unique thumbs
    const withDupes = [...images, "/img1.jpg", PRODUCT_IMAGE_FALLBACK] as string[];
    render(<ProductGallery images={withDupes} productName={productName} />);

    // Thumbs count deduped to 3 (fallback filtered when ordered non-empty)
    const thumbs = screen.getAllByRole("button", { name: /Show gallery image \d of \d for Chair/ });
    expect(thumbs).toHaveLength(3);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    // Fallback-only path still renders placeholder
    const { container: c2 } = render(<ProductGallery images={[PRODUCT_IMAGE_FALLBACK]} productName={productName} />);
    expect(screen.queryByText("1 / 1")).not.toBeInTheDocument();
    expect(c2.querySelector(".product-gallery__placeholder")).not.toBeNull();
  });

  it("changes selected image on thumbnail click — iterates source-of-truth with toHaveAttribute and aria-pressed", () => {
    render(<ProductGallery images={[...images]} productName={productName} />);

    for (let idx = 0; idx < images.length; idx += 1) {
      const thumb = screen.getByRole("button", { name: `Show gallery image ${idx + 1} of ${images.length} for Chair` });
      expect(thumb).toHaveAttribute("aria-label", `Show gallery image ${idx + 1} of ${images.length} for Chair`);
      expect(thumb).toHaveAttribute("title", `View ${productName} image ${idx + 1}`);
      fireEvent.click(thumb);

      const mainImg = screen.getByAltText("Primary product gallery image of Chair");
      expect(mainImg).toHaveAttribute("src", images[idx]);
      expect(screen.getByText(`${idx + 1} / ${images.length}`)).toBeInTheDocument();

      // Active state variant
      expect(thumb).toHaveAttribute("aria-pressed", "true");
      expect(thumb).toHaveClass("product-gallery__thumb--active");
      expect(thumb).toHaveClass("border-strong");

      // Inactive siblings
      for (let j = 0; j < images.length; j += 1) {
        if (j === idx) continue;
        const sibling = screen.getByRole("button", { name: `Show gallery image ${j + 1} of ${images.length} for Chair` });
        expect(sibling).toHaveAttribute("aria-pressed", "false");
        expect(sibling).toHaveClass("border-transparent");
        expect(sibling).toHaveClass("opacity-60");
      }
    }
  });

  it("handles next/image thumb fallbacks and fires error handlers without throwing", () => {
    const { container } = render(<ProductGallery images={[...images]} productName={productName} />);

    // Trigger thumb error path (markFailed) then main error — should not crash
    const thumbImg = container.querySelector(".product-gallery__thumb-img") as HTMLImageElement | null;
    expect(thumbImg).not.toBeNull();
    expect(() => fireEvent.error(thumbImg as Element)).not.toThrow();

    const mainImg = screen.getByAltText("Primary product gallery image of Chair");
    expect(() => fireEvent.error(mainImg)).not.toThrow();
  });

  it("handles ArrowRight/ArrowLeft keyboard navigation with fireEvent on the region", () => {
    render(<ProductGallery images={[...images]} productName={productName} />);
    const gallery = screen.getByRole("region");

    // Container-contains check requires activeElement inside gallery — focus gallery first
    (gallery as HTMLElement).focus();
    expect(document.activeElement).toBe(gallery);

    // ArrowRight -> index 1
    fireEvent.keyDown(gallery, { key: "ArrowRight" });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByAltText("Primary product gallery image of Chair")).toHaveAttribute("src", "/img2.jpg");

    // ArrowRight -> index 2
    fireEvent.keyDown(gallery, { key: "ArrowRight" });
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByAltText("Primary product gallery image of Chair")).toHaveAttribute("src", "/img3.jpg");

    // ArrowRight wraps to 0
    fireEvent.keyDown(gallery, { key: "ArrowRight" });
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByAltText("Primary product gallery image of Chair")).toHaveAttribute("src", "/img1.jpg");

    // ArrowLeft wraps to 2
    fireEvent.keyDown(gallery, { key: "ArrowLeft" });
    expect(screen.getByText("3 / 3")).toBeInTheDocument();

    // ArrowLeft -> index 1
    fireEvent.keyDown(gallery, { key: "ArrowLeft" });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    // Non-arrow key does not mutate index
    fireEvent.keyDown(gallery, { key: "Enter" });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /unavailable/i })).not.toBeInTheDocument();
  });

  it("ensures safeIndex is within bounds when images length shrinks and thumbs rerender", async () => {
    const { rerender, container } = render(<ProductGallery images={[...images]} productName={productName} />);

    // Select last image index 2
    const thirdThumb = screen.getByRole("button", { name: "Show gallery image 3 of 3 for Chair" });
    fireEvent.click(thirdThumb);
    expect(screen.getByText("3 / 3")).toBeInTheDocument();

    // Rerender with single image — safeIndex clamps to 0, count hidden for single photo
    await act(async () => {
      rerender(<ProductGallery images={["/only-one.jpg"]} productName={productName} />);
    });

    expect(screen.queryByText("1 / 1")).not.toBeInTheDocument();
    expect(container.querySelector(".product-gallery__count")).toBeNull();
    expect(container.querySelector(".product-gallery__thumbs")).toBeNull();

    const mainImg = screen.getByAltText("Primary product gallery image of Chair");
    expect(mainImg).toHaveAttribute("src", "/only-one.jpg");
    expect(screen.queryByRole("img", { name: /unavailable/i })).not.toBeInTheDocument();
  });

  it("renders placeholder copy absence when candidates non-empty and checks thumbs hidden for single", () => {
    const { container } = render(<ProductGallery images={["/solo.jpg"]} productName="Desk" />);
    expect(screen.getByAltText("Primary product gallery image of Desk")).toHaveAttribute("src", "/solo.jpg");
    expect(screen.queryByText("1 / 1")).not.toBeInTheDocument();
    expect(container.querySelector(".product-gallery__thumbs")).toBeNull();
    expect(screen.queryByText("Photo coming soon")).not.toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OneAndOnlyLogo } from "@/components/ui/Logo";

describe("OneAndOnlyLogo Component", () => {
  it("renders default orange wordmark with computed src/dimensions/priority", () => {
    render(<OneAndOnlyLogo />);

    const img = screen.getByRole("img", { name: "One and Only Furniture" });
    expect(img).toHaveAttribute("src", "/assets/marketing/brand/logos/logo-sharp.png");
    expect(img).toHaveAttribute("alt", "One and Only Furniture");
    expect(img).toHaveAttribute("width", "1024");
    expect(img).toHaveAttribute("height", "263");
    expect(img.getAttribute("data-priority")).toBe("true");
    expect(img.getAttribute("data-unoptimized")).toBe("true");
    expect(img).toHaveClass("h-full");
    expect(img.className).toContain("object-contain");
  });

  it("renders white variant wordmark with computed src", () => {
    render(<OneAndOnlyLogo variant="white" />);

    const img = screen.getByRole("img", { name: "One and Only Furniture" });
    expect(img).toHaveAttribute("src", "/assets/marketing/brand/logos/logo-sharp-white.png");
    expect(img).toHaveAttribute("width", "1024");
    expect(img).toHaveAttribute("height", "263");
  });

  it("renders mark monogram with computed square dimensions", () => {
    render(<OneAndOnlyLogo variant="mark" />);

    const img = screen.getByRole("img", { name: "One and Only" });
    expect(img).toHaveAttribute("src", "/assets/marketing/brand/logos/OneandOnlySmall-LogoHS.png");
    expect(img).toHaveAttribute("width", "192");
    expect(img).toHaveAttribute("height", "192");
    expect(screen.queryByRole("img", { name: "One and Only Furniture" })).toBeNull();
  });

  it("merges custom className onto wrapper and keeps relative flex", () => {
    const { container } = render(<OneAndOnlyLogo className="custom-wrapper-class" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("custom-wrapper-class");
    expect(wrapper).toHaveClass("relative");
    expect(wrapper.className).toContain("flex");
  });

  it("reserves wordmark aspect-ratio on orange wrapper and not on mark", () => {
    const { container: orangeContainer } = render(<OneAndOnlyLogo variant="orange" />);
    const orangeWrapper = orangeContainer.firstChild as HTMLElement;
    expect(orangeWrapper.style.aspectRatio).toMatch(/1024\s*\/\s*263/);

    const { container: markContainer } = render(<OneAndOnlyLogo variant="mark" />);
    const markWrapper = markContainer.firstChild as HTMLElement;
    expect(markWrapper.style.aspectRatio).toBe("");
    expect(markWrapper).not.toHaveAttribute("style", expect.stringContaining("aspect-ratio"));
  });

  it("fires onClick via wrapper click bubbling (variant forwarded correctly)", () => {
    const { container } = render(<OneAndOnlyLogo variant="white" className="clickable" />);
    expect(container.firstChild).toHaveClass("clickable");
    expect(screen.getByRole("img", { name: "One and Only Furniture" })).toHaveAttribute(
      "src",
      "/assets/marketing/brand/logos/logo-sharp-white.png",
    );
  });
});

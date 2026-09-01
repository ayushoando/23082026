//
// Feature: client-showcase-tabs, Property 6: logo vs initials fallback.
// Component tests for ClientLogoArea (plans/client-showcase-tabs task 8.4).

// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import {
  ClientLogoArea,
  getInitials,
} from "@/components/site/clients/ClientLogoArea";

describe("getInitials", () => {
  it("uses the first two characters of a single word", () => {
    expect(getInitials("Tata")).toBe("TA");
    expect(getInitials("A")).toBe("A");
  });

  it("uses the first characters of the first two words", () => {
    expect(getInitials("State Bank")).toBe("SB");
    expect(getInitials("Bharat  Electronics Limited")).toBe("BE");
  });

  it("returns an empty string for whitespace-only names", () => {
    expect(getInitials("   ")).toBe("");
  });

  it("uppercases everything", () => {
    expect(getInitials("tvs motors")).toBe("TM");
  });
});

describe("ClientLogoArea", () => {
  it("renders the img and no fallback when logoPath is present", () => {
    const { container } = render(
      <ClientLogoArea displayName="Tata Motors" logoPath="/assets/marketing/client-logos/tata-motors.svg" />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/assets/marketing/client-logos/tata-motors.svg");
    expect(img?.getAttribute("alt")).toBe("Tata Motors logo");
    expect(container.querySelector("[aria-hidden='true']")).toBeNull();
  });

  it("renders the initials fallback without an img when logoPath is absent", () => {
    const { container } = render(<ClientLogoArea displayName="Tata Motors" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("TM");
  });

  it("swaps to the fallback when the image fails to load, keeping the wrapper", () => {
    const { container } = render(
      <ClientLogoArea displayName="State Bank" logoPath="/assets/marketing/client-logos/sbi.svg" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).not.toBeNull();

    fireEvent.error(container.querySelector("img") as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("SB");
    // The card-level wrapper stays mounted.
    expect(container.firstElementChild).toBe(wrapper);
  });
});

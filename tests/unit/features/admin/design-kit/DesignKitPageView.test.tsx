import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import DesignKitPageView from "@/features/admin/design-kit/DesignKitPageView";

vi.mock("@phosphor-icons/react", () => ({
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Cursor: () => <span data-testid="icon-cursor" />,
  Info: () => <span data-testid="icon-info" />,
  Sparkle: () => <span data-testid="icon-sparkle" />,
  WarningCircle: () => <span data-testid="icon-warning" />,
}));

const SITE_MATERIALS = [
  { id: "scheme-page", label: "Scheme page paper", hex: "#FAFAF8 \u2192 #F3F2EF", token: "scheme-page", detail: "+ ocean #EDF4FA at 18\u201322%", use: "Light homepage sections" },
  { id: "accent-dark", label: "Accent dark band", hex: "#070D12", token: "--surface-inverse", detail: "top rule #9D876C", use: "Workspace planning block" },
  { id: "bronze-accent", label: "Bronze accent", hex: "#9D876C", token: "--color-bronze-400", detail: "hover #7F6A52", use: '"workspace" word' },
  { id: "bronze-stat", label: "Bronze KPI glow", hex: "#BEAF9A", token: "--color-bronze-300", detail: "glow #9D876C @ 35%", use: "Proof KPI band" },
  { id: "dark-glass", label: "Dark glass card", hex: "#FFFFFF @ 6%", token: ".home-tool-card--dark", detail: "border #FFFFFF @ 14%", use: "Planner CTA card" },
  { id: "inverse-text", label: "Inverse headline", hex: "#F8FAFC", token: "--text-inverse", detail: "muted #E2E8F0", use: "White copy" },
] as const;

const PRODUCT_MATERIALS = [
  { id: "ecru-page", label: "Ecru page", hex: "#F3F2EF", token: "--color-ecru-100", use: "Admin & planner shell" },
  { id: "ecru-card", label: "Ecru card", hex: "#FAFAF8", token: "--color-ecru-50", use: "Panels and inspector" },
  { id: "studio", label: "Studio thumb well", hex: "#FFFFFF \u2192 #EEF2F7 \u2192 #E6ECF3", token: "--surface-studio-field", use: "Catalog thumbs only" },
  { id: "cad", label: "CAD canvas", hex: "#EEF2F6", token: "--color-white-200", detail: "grid #D2DCE7 / #B9C8D8", use: "Drawing surface" },
  { id: "primary", label: "Midnight primary", hex: "#1F3653", token: "--color-dark-midnight-blue-500", use: "Primary CTAs" },
  { id: "bronze", label: "Bronze accent", hex: "#9D876C", token: "--color-bronze-400", use: "Status chips" },
] as const;

const BUTTON_VARIANTS = ["default", "primary", "outline", "secondary", "ghost", "destructive", "link"] as const;
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;

describe("DesignKitPageView — behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hero landmark with labelled nav and section anchors", () => {
    const { container } = render(<DesignKitPageView />);

    expect(screen.getByTestId("design-kit-page")).toBeInTheDocument();
    expect(screen.getByTestId("design-kit-page")).toHaveClass("design-kit");

    const h1 = screen.getByRole("heading", { level: 1, name: "Oando design kit" });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveClass("design-kit-title");
    expect(screen.getByText("Two design systems")).toBeInTheDocument();
    expect(screen.getByText("Two design systems")).toHaveClass("design-kit-eyebrow");

    const lede = container.querySelector(".design-kit-lede");
    expect(lede).not.toBeNull();
    expect(lede).toHaveTextContent("Site");
    expect(lede).toHaveTextContent("Product");

    const nav = screen.getByRole("navigation", { name: "Design kit sections" });
    expect(nav).toHaveClass("design-kit-nav");
    const hashes = ["#site", "#site-surfaces", "#product", "#product-forms", "#product-surfaces", "#product-density", "#product-states"] as const;
    for (const hash of hashes) {
      const link = nav.querySelector(`a[href="${hash}"]`) as HTMLAnchorElement | null;
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute("href", hash);
    }

    for (const tid of ["design-kit-site", "design-kit-site-surfaces", "design-kit-product", "design-kit-forms", "design-kit-surfaces", "design-kit-buttons", "design-kit-density", "design-kit-states"]) {
      expect(screen.getByTestId(tid)).toBeInTheDocument();
    }

    expect(screen.queryByTestId("design-kit-unknown")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /nonexistent-section/i })).not.toBeInTheDocument();
    expect(container.querySelector("header.design-kit-hero")).not.toBeNull();
  });

  it("iterates site and product swatches from source-of-truth with tokens, hex, and aria-hidden", () => {
    const { container } = render(<DesignKitPageView />);

    const allSwatches = container.querySelectorAll(".design-kit-swatch");
    expect(allSwatches).toHaveLength(SITE_MATERIALS.length + PRODUCT_MATERIALS.length);

    for (const item of SITE_MATERIALS) {
      const figure = container.querySelector(`.design-kit-swatch--site-${item.id}`) as HTMLElement | null;
      expect(figure).not.toBeNull();
      expect(figure).toHaveClass("design-kit-swatch");
      const plate = figure?.querySelector(".design-kit-swatch-plate") as HTMLElement | null;
      expect(plate).not.toBeNull();
      expect(plate).toHaveAttribute("aria-hidden", "true");
      expect(within(figure as HTMLElement).getByText(item.label)).toBeInTheDocument();
      expect(within(figure as HTMLElement).getByText(item.hex)).toBeInTheDocument();
      expect(within(figure as HTMLElement).getByText(item.token)).toBeInTheDocument();
      expect(item.hex).toMatch(/^#/);
      if ("detail" in item && item.detail) {
        expect(within(figure as HTMLElement).getByText(item.detail as string)).toBeInTheDocument();
      }
      expect(within(figure as HTMLElement).getByText(item.use, { exact: false })).toBeInTheDocument();
    }

    for (const item of PRODUCT_MATERIALS) {
      const figure = container.querySelector(`.design-kit-swatch--product-${item.id}`) as HTMLElement | null;
      expect(figure).not.toBeNull();
      expect(within(figure as HTMLElement).getByText(item.label)).toBeInTheDocument();
      expect(within(figure as HTMLElement).getByText(item.hex)).toBeInTheDocument();
      expect(within(figure as HTMLElement).getByText(item.token)).toBeInTheDocument();
      expect(item.token).toMatch(/^--|^\./);
    }

    expect(screen.getAllByText("Bronze accent", { selector: ".design-kit-swatch-label" })).toHaveLength(2);
    expect(screen.getByTestId("icon-sparkle")).toBeInTheDocument();
    expect(screen.getByTestId("icon-arrow-right")).toBeInTheDocument();
  });

  it("renders product buttons by variant/size with FOCSS data attributes and density tiers", () => {
    const { container } = render(<DesignKitPageView />);

    for (const variant of BUTTON_VARIANTS) {
      const btns = Array.from(container.querySelectorAll(`[data-variant="${variant}"]`));
      expect(btns.length, `variant "${variant}" must render`).toBeGreaterThan(0);
      for (const btn of btns) {
        expect(btn).toHaveAttribute("data-slot", "button");
        expect(btn).toHaveAttribute("data-variant", variant);
      }
      expect(screen.getAllByRole("button", { name: variant }).length).toBeGreaterThan(0);
    }

    for (const size of BUTTON_SIZES) {
      expect(container.querySelectorAll(`[data-size="${size}"]`).length).toBeGreaterThan(0);
    }

    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    expect(settingsBtn).toBeInTheDocument();
    expect(settingsBtn).toHaveAttribute("data-size", "icon-sm");
    expect(screen.getAllByTestId("icon-info").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Default \u00B7 panel padding 0.75rem")).toBeInTheDocument();
    expect(screen.getByText("Dense \u00B7 tools / inspector rails")).toBeInTheDocument();
    expect(screen.getByText("Touch \u00B7 planner mobile floor")).toBeInTheDocument();
    expect(container.querySelectorAll(".design-kit-density-card")).toHaveLength(3);
    expect(container.querySelectorAll(".design-kit-density-panel")).toHaveLength(3);
    expect(screen.getByText("Standard panel")).toBeInTheDocument();
    expect(screen.getByText("Dense panel")).toBeInTheDocument();
    expect(screen.getByText("Touch targets")).toBeInTheDocument();
    expect(screen.getByText(/Min 44px tap targets/)).toBeInTheDocument();

    const lgButtons = container.querySelectorAll('[data-size="lg"]');
    expect(lgButtons.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: "Place" })).toHaveAttribute("data-size", "lg");
    expect(screen.getByRole("button", { name: "Library" })).toHaveAttribute("data-size", "lg");
    expect(container.querySelectorAll('[data-size="xs"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-size="sm"]').length).toBeGreaterThan(0);

    const uniqueVariants = new Set(Array.from(container.querySelectorAll("[data-variant]")).map((el) => el.getAttribute("data-variant")));
    for (const v of BUTTON_VARIANTS) expect(uniqueVariants.has(v)).toBe(true);
  });

  it("validates forms, surfaces, workspace states, and link hrefs with fireEvent", () => {
    const { container } = render(<DesignKitPageView />);

    expect(screen.getByLabelText("Product name")).toHaveValue("Workstation L-Shape");
    expect(screen.getByLabelText("Product name")).toHaveAttribute("id", "dk-name");
    expect(screen.getByLabelText("Product name")).toHaveClass("admin-field__control");
    expect(screen.getByText("Catalog + planner label.")).toBeInTheDocument();

    const skuInput = screen.getByLabelText("SKU") as HTMLInputElement;
    expect(skuInput).toHaveValue("WS-001");
    expect(skuInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("SKU must be unique in this family.")).toBeInTheDocument();
    expect(skuInput).toHaveClass("admin-field__control");

    expect(screen.getByLabelText("Revision")).toHaveValue("12");
    expect(screen.getByLabelText("Revision")).toBeDisabled();
    expect(screen.getByLabelText("Revision")).toHaveAttribute("id", "dk-rev");

    expect(screen.getByLabelText("Include in publish")).toBeChecked();
    const checkbox = screen.getByLabelText("Include in publish") as HTMLInputElement;
    expect(checkbox).toHaveClass("admin-checkbox__input");
    const liveSwitch = screen.getByRole("switch", { name: "Live preview" }) as HTMLButtonElement;
    expect(liveSwitch).toHaveAttribute("aria-checked", "true");
    expect(liveSwitch).toHaveAttribute("data-slot", "switch");
    fireEvent.click(liveSwitch);
    expect(liveSwitch).toHaveAttribute("aria-checked", "false");
    fireEvent.click(liveSwitch);
    expect(liveSwitch).toHaveAttribute("aria-checked", "true");

    expect(screen.getByText("Inspector panel")).toBeInTheDocument();
    expect(container.querySelector(".admin-panel")).not.toBeNull();
    // Dense/product tiles share labels with swatches — scope to tile text presence, not uniqueness
    for (const title of ["Ecru page", "Ecru card", "Studio well", "CAD canvas"]) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("cool gradient")).toBeInTheDocument();
    // hex #F3F2EF appears in both swatches and tiles; verify via tile
    expect(container.querySelector(".design-kit-product-tile--ecru-page")).not.toBeNull();
    expect(screen.getAllByText("#F3F2EF").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByTestId("design-kit-state-empty")).toHaveClass("design-kit-state-card");
    expect(screen.getByTestId("design-kit-state-empty")).toHaveTextContent("No selection");
    expect(screen.getByText("Click a shape on the canvas to edit geometry here.")).toBeInTheDocument();
    expect(screen.getByTestId("icon-cursor")).toBeInTheDocument();

    expect(screen.getByTestId("design-kit-state-loading")).toHaveTextContent("Loading catalog\u2026");
    expect(container.querySelector(".admin-spinner")).not.toBeNull();
    expect(container.querySelector(".admin-spinner")).toHaveAttribute("aria-hidden", "true");

    expect(screen.getByTestId("design-kit-state-error")).toHaveTextContent("Could not load inventory");
    expect(screen.getByText("Retry the catalog sync or check network access.")).toBeInTheDocument();

    expect(screen.getByText("Publish ready")).toBeInTheDocument();
    expect(screen.getByText("All validation checks passed.")).toBeInTheDocument();
    expect(screen.getByText("Publish blocked")).toBeInTheDocument();
    expect(screen.getByText("Fix validation errors before release.")).toBeInTheDocument();
    expect(screen.getByText("Demo data is browser-local only.")).toBeInTheDocument();
    expect(screen.getByTestId("icon-warning")).toBeInTheDocument();
    const badge = container.querySelector('[data-slot="badge"]') as HTMLElement | null;
    expect(badge).not.toBeNull();
    expect(badge).toHaveTextContent("Default");
    expect(badge).toHaveClass("admin-badge--active");

    expect(screen.getByText("Light scheme panel")).toBeInTheDocument();
    // Use regex to handle potential text whitespace normalization
    expect(screen.getByText(/Ecru paper with ocean mist gradient/)).toBeInTheDocument();
    expect(container.querySelector(".scheme-panel")).not.toBeNull();
    expect(container.querySelector(".home-tool-card--dark")).not.toBeNull();
    expect(screen.getByText("Oando Planner")).toBeInTheDocument();
    expect(screen.getByText("FLAGSHIP")).toBeInTheDocument();
    expect(screen.getByText(/Open the planner and start from a blank shell/)).toBeInTheDocument();

    const plannerLink = screen.getByRole("link", { name: "Explore planner" });
    expect(plannerLink).toHaveAttribute("href", "/ooplanner/");
    expect(screen.queryByRole("link", { name: /nonexistent-link/i })).not.toBeInTheDocument();
  });
});

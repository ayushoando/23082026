// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(monorepoRoot, "scripts/responsive-audit.mjs");

describe("responsive-audit config", () => {
  it("keeps phone viewport 390x844 in the matrix", () => {
    expect(existsSync(scriptPath)).toBe(true);
    const src = readFileSync(scriptPath, "utf8");
    expect(src).toMatch(/390/);
    expect(src).toMatch(/844/);
  });

  it("targets mobile and desktop widths", () => {
    const src = readFileSync(scriptPath, "utf8");
    expect(src.match(/isMobile/g)?.length ?? 0).toBeGreaterThan(0);
    // Desktop width already in script (plan 12 may extend further).
    expect(src).toMatch(/1920/);
  });

  it("includes R25 desktop widths 1440x900 and 1920x1080 with desktop label", () => {
    const src = readFileSync(scriptPath, "utf8");
    // VIEWPORTS must contain both R25 critical widths per charter R25 / plan 12.
    expect(src).toMatch(/1440/);
    expect(src).toMatch(/900/);
    expect(src).toMatch(/1920/);
    expect(src).toMatch(/1080/);
    // At least one desktop entry labelled "desktop" (R25); 1440 entry must also be desktop-labelled.
    expect(src).toMatch(/label:\s*["']desktop["']/);
    // Explicit VIEWPORTS keys: ensure 1440x900 entry exists alongside 1920x1080 (and 390 guard remains).
    expect(src).toMatch(/VIEWPORTS/);
    // Verify 1440 entry is present as a viewport definition (width: 1440).
    expect(src).toMatch(/width:\s*1440/);
    expect(src).toMatch(/width:\s*1920/);
    expect(src).toMatch(/width:\s*390/);
    expect(src).toMatch(/height:\s*900/);
    expect(src).toMatch(/height:\s*1080/);
  });
});

/**
 * Name-mirror coverage for lib/siteViewport.
 */
import { describe, expect, it } from "vitest";
import { SITE_VIEWPORT } from "@/lib/siteViewport";

describe("SITE_VIEWPORT", () => {
  it("sets device-width initial scale for mobile browsers", () => {
    expect(SITE_VIEWPORT.width).toBe("device-width");
    expect(SITE_VIEWPORT.initialScale).toBe(1);
    expect(SITE_VIEWPORT.viewportFit).toBe("cover");
  });

  it("uses a single light themeColor for browser chrome", () => {
    expect(SITE_VIEWPORT.themeColor).toBe("var(--color-white-50)");
  });
});

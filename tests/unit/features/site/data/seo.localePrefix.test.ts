import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/routing", () => ({
  routing: { localePrefix: "as-needed" },
}));

import {
  buildLocaleAlternates,
  buildPageMetadata,
  buildSiteMetadata,
} from "@/features/site/data/seo";

const TEST_SITE_URL = "https://example.com";

describe("seo localePrefix as-needed", () => {
  it("emits a distinct hreflang URL per locale", () => {
    const langs = buildLocaleAlternates(TEST_SITE_URL, "/about");
    expect(langs["en-IN"]).toBe("https://example.com/about/");
    expect(langs["hi-IN"]).toBe("https://example.com/hi/about/");
    expect(langs["fr-FR"]).toBeUndefined();
    expect(langs["x-default"]).toBe("https://example.com/about/");
  });

  it("prefixes non-default locales on the homepage without a double slash", () => {
    const langs = buildLocaleAlternates(TEST_SITE_URL, "/");
    expect(langs["en-IN"]).toBe("https://example.com/");
    expect(langs["hi-IN"]).toBe("https://example.com/hi/");
    expect(langs["x-default"]).toBe("https://example.com/");
  });

  it("lists og:locale:alternate on site and page metadata", () => {
    const site = buildSiteMetadata(TEST_SITE_URL);
    expect(site.openGraph?.alternateLocale).toEqual(["hi_IN"]);

    const page = buildPageMetadata(TEST_SITE_URL, {
      title: "About",
      description: "About page description text here.",
      path: "/about",
    });
    expect(page.openGraph?.alternateLocale).toEqual(["hi_IN"]);
  });
});

/**
 * Re-export path kept for older inventory paths.
 * Authoritative env-host coverage: tests/unit/app/robots.test.ts
 */
import { describe, it, expect } from "vitest";
import robots from "@/app/robots";
import { SITE_URL } from "@/lib/siteUrl";

describe("robots.ts (stable import)", () => {
  it("returns valid robots config aligned with route classification", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const first = rules[0];
    expect(first?.userAgent).toBe("*");
    // Explicit major crawlers share the same allow/disallow map.
    const agents = rules.map((rule) => rule?.userAgent);
    expect(agents).toEqual(
      expect.arrayContaining(["*", "Googlebot", "Bingbot", "Googlebot-Image"]),
    );
    const sitemaps = Array.isArray(config.sitemap)
      ? config.sitemap
      : config.sitemap
        ? [config.sitemap]
        : [];
    expect(sitemaps[0]).toContain("/sitemap.xml");
    expect(first?.disallow).toBeUndefined();
  });

  it("does not emit disallow blocks to allow crawler discovery of page-level noindex", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    for (const rule of rules) {
      expect(rule?.disallow).toBeUndefined();
    }
  });

  it("uses SITE_URL host for sitemap and emits no non-standard host field", () => {
    const config = robots();
    const sitemaps = Array.isArray(config.sitemap)
      ? config.sitemap
      : config.sitemap
        ? [config.sitemap]
        : [];
    const sitemap = String(sitemaps[0] ?? "");
    expect(config.host).toBeUndefined();
    expect(sitemap).toBe(`${SITE_URL.replace(/\/+$/, "")}/sitemap.xml`);
    expect(sitemap).not.toMatch(/localhost|127\.0\.0\.1/i);
  });
});

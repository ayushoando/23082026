/**
 * Regression guard for plan 14's "English-only runtime" claim.
 *
 * `site/i18n/request.ts` must stay a *static* English-only config:
 *   - it loads `./messages/en.json` only (no other locale), and
 *   - it must NOT read a runtime locale from cookies / `next/headers`.
 *
 * Declares `defaultLocale` (en) so marketing HTML stays cache-friendly
 * (COST-S02). If anyone flips it to cookie-aware multi-locale, the cached-HTML
 * premise and the SEO/htmlLang honesty claim (02/14) both break — this test
 * catches that before it ships.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { defaultLocale } from "@/i18n/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "../../../../site");
const requestPath = path.join(siteRoot, "i18n", "request.ts");
const rootShimPath = path.resolve(__dirname, "../../../../i18n", "request.ts");
const source = readFileSync(requestPath, "utf8");

describe("i18n runtime honesty (plan 14)", () => {
  it("loads the English message file as the only locale", () => {
    expect(source).toMatch(/"\.\/messages\/en\.json"/);
    // No other locale file may be imported into the request config.
    const otherLocale = /messages\/(?!en\.json)[a-z]+\.json"/.exec(source);
    expect(otherLocale).toBeNull();
  });

  it("does not read a runtime locale from cookies / next/headers", () => {
    expect(source).not.toMatch(/NEXT_LOCALE/);
    // The word may appear in a comment; forbid an actual import/call.
    expect(source).not.toMatch(/from\s*["']next\/headers["']/);
    expect(source).not.toMatch(/\bcookies\s*\(/);
    expect(source).not.toMatch(/next-intl\/navigation/);
  });

  it("resolves to the configured English default locale", () => {
    expect(defaultLocale).toBe("en");
    expect(source).toMatch(/defaultLocale/);
  });

  it("keeps the root shim re-exporting the site request config", () => {
    expect(existsSync(rootShimPath)).toBe(true);
    const shim = readFileSync(rootShimPath, "utf8");
    expect(shim).toMatch(/..\/site\/i18n\/request/);
  });
});

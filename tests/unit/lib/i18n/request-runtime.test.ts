/**
 * Locale is prefixless (`localePrefix: never`). HTML language comes from the
 * NEXT_LOCALE cookie via `site/i18n/request.ts`.
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

describe("i18n runtime (cookie locale)", () => {
  it("reads NEXT_LOCALE and can load Hindi messages", () => {
    expect(source).toMatch(/NEXT_LOCALE/);
    expect(source).toMatch(/from ["']next\/headers["']/);
    expect(source).toMatch(/messages\/hi\.json/);
    expect(source).toMatch(/messages\/en\.json/);
  });

  it("keeps English as the default locale", () => {
    expect(defaultLocale).toBe("en");
    expect(source).toMatch(/defaultLocale/);
  });

  it("keeps the root shim re-exporting the site request config", () => {
    expect(existsSync(rootShimPath)).toBe(true);
    const shim = readFileSync(rootShimPath, "utf8");
    expect(shim).toMatch(/..\/site\/i18n\/request/);
  });
});

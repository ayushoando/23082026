// @vitest-environment node
/**
 * COST-S02 — static English-only request config so marketing HTML can be cached.
 * Do not import next/headers or read NEXT_LOCALE.
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

describe("i18n runtime (COST-S02 English-only)", () => {
  it("loads static en.json and does not use next/headers or NEXT_LOCALE", () => {
    expect(source).toMatch(/messages\/en\.json/);
    expect(source).not.toMatch(/NEXT_LOCALE/);
    expect(source).not.toMatch(/from ["']next\/headers["']/);
    expect(source).not.toMatch(/messages\/hi\.json/);
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

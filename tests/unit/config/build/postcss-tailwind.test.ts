// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("Tailwind v4 PostCSS contract", () => {
  it("uses the Tailwind PostCSS plugin from the canonical root config", async () => {
    const config = await import("../../../../config/build/postcss.config.mjs");
    expect(config.default).toEqual({ plugins: { "@tailwindcss/postcss": {} } });
  });

  it("keeps the site config as a pure re-export of canonical build configuration", () => {
    const siteConfig = fs.readFileSync(path.join(repositoryRoot, "site/postcss.config.mjs"), "utf8");
    expect(siteConfig.trim()).toBe('export { default } from "../config/build/postcss.config.mjs";');
  });
});

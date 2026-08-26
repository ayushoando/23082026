// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  HI_OVERRIDES,
  buildHiWave1Messages,
  deepMerge,
  readJson,
  syncHiWave1Messages,
} from "../../../scripts/sync-hi-wave1-messages.mjs";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(siteRoot, "scripts/sync-hi-wave1-messages.mjs");

describe("sync-hi-wave1-messages (name-mirror)", () => {
  it("direct run is a dry run and does not change hi.json mtime", () => {
    const hiPath = path.join(siteRoot, "site/i18n/messages/hi.json");
    const before = fs.statSync(hiPath).mtimeMs;
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toMatch(/dry run/i);
    expect(output).not.toMatch(/wrote hi\.json/i);
    expect(fs.statSync(hiPath).mtimeMs).toBe(before);
  });

  it("HI_OVERRIDES only targets keys that exist in en.json", () => {
    const en = readJson(path.join(siteRoot, "site/i18n/messages/en.json"));

    function assertOverridePathsExist(
      overrides: unknown,
      base: unknown,
      prefix: string,
    ) {
      if (
        overrides === null ||
        typeof overrides !== "object" ||
        Array.isArray(overrides)
      ) {
        expect(base, `missing en.json key ${prefix}`).toBeDefined();
        return;
      }
      expect(
        base !== null && typeof base === "object" && !Array.isArray(base),
        `en.json ${prefix || "(root)"} must be an object`,
      ).toBe(true);
      for (const [key, value] of Object.entries(
        overrides as Record<string, unknown>,
      )) {
        const next = prefix ? `${prefix}.${key}` : key;
        assertOverridePathsExist(
          value,
          (base as Record<string, unknown>)[key],
          next,
        );
      }
    }

    assertOverridePathsExist(HI_OVERRIDES, en, "");
  });

  it("deepMerge recursively merges override objects into base objects", () => {
    const base = {
      hero: { title: "English Title", kicker: "2011" },
      footer: "Footer text",
    };
    const overrides = {
      hero: { title: "Hindi Title" },
    };

    const merged = deepMerge(base, overrides);
    expect(merged).toEqual({
      hero: { title: "Hindi Title", kicker: "2011" },
      footer: "Footer text",
    });
  });

  it("buildHiWave1Messages preserves existing Hindi translations and backfills from en", () => {
    const en = {
      about: { title: "About Us", newKey: "New Feature" },
    };
    const hi = {
      about: { title: "हमारे बारे में" },
    };
    const overrides = {
      about: { heroTitle: "वन एंड ओनली" },
    };

    const result = buildHiWave1Messages(en, hi, ["about"], overrides);
    expect(result).toEqual({
      about: {
        title: "हमारे बारे में",
        newKey: "New Feature",
        heroTitle: "वन एंड ओनली",
      },
    });
  });

  it("syncHiWave1Messages with write=false performs dry run merge without modifying files", () => {
    const messagesDir = path.join(siteRoot, "site/i18n/messages");
    const { namespaces, next } = syncHiWave1Messages({
      messagesDir,
      write: false,
    });

    expect(Array.isArray(namespaces)).toBe(true);
    expect(namespaces.length).toBeGreaterThan(0);
    expect(typeof next).toBe("object");
    expect(next.home).toBeDefined();
  });

  it("readJson throws descriptive error for non-existent files", () => {
    expect(() => readJson(path.join(siteRoot, "missing.json"))).toThrow(
      /Failed to parse JSON/,
    );
  });
});

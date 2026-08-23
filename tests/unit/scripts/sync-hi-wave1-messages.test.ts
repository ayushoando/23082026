// @vitest-environment node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
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
  it("exits 0 when executed directly", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toContain("Updated hi.json wave1 namespaces");
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

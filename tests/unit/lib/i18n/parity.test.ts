import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
  "site",
);
const messagesDir = path.join(siteRoot, "i18n", "messages");
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(siteRoot, "i18n/marketing-parity-manifest.json"),
    "utf8",
  ),
);

describe("i18n marketing parity", () => {
  it("check-i18n-key-parity exits 0 for Hindi vs English", () => {
    const output = execFileSync(
      process.execPath,
      [path.join(siteRoot, "..", "scripts/check-i18n-key-parity.mjs")],
      {
        cwd: siteRoot,
        encoding: "utf8",
      },
    );
    expect(output).toContain("check-i18n-key-parity: ok");
    expect(output).toMatch(/locales hi\)/);
  }, 30_000);

  it("deferred locales translate wave1 hero copy away from English", () => {
    const en = JSON.parse(
      fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"),
    );
    for (const locale of manifest.deferredLocales) {
      const messages = JSON.parse(
        fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf8"),
      );
      for (const namespace of manifest.wave1Namespaces) {
        const enSample =
          en[namespace]?.heroTitle ??
          en[namespace]?.heroTitleLead ??
          en[namespace]?.headlineLead ??
          en[namespace]?.subtitle ??
          en[namespace]?.hero?.title?.[0];
        const localeSample =
          messages[namespace]?.heroTitle ??
          messages[namespace]?.heroTitleLead ??
          messages[namespace]?.headlineLead ??
          messages[namespace]?.subtitle ??
          messages[namespace]?.hero?.title?.[0];
        if (typeof enSample === "string") {
          expect(localeSample, `${locale}/${namespace}`).not.toBe(enSample);
        }
      }
    }
  });

  it("achieves 100% leaf-key parity between en.json and hi.json across all namespaces", () => {
    function collectKeys(obj: unknown, prefix = ""): string[] {
      const keys: string[] = [];
      if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        if (prefix) keys.push(prefix);
        return keys;
      }
      for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        keys.push(...collectKeys(val, nextPrefix));
      }
      return keys;
    }

    const en = JSON.parse(
      fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"),
    );
    const hi = JSON.parse(
      fs.readFileSync(path.join(messagesDir, "hi.json"), "utf8"),
    );

    const enKeys = collectKeys(en);
    const hiKeys = collectKeys(hi);
    const hiKeySet = new Set(hiKeys);
    const enKeySet = new Set(enKeys);

    const missingInHi = enKeys.filter((k) => !hiKeySet.has(k));
    const extraInHi = hiKeys.filter((k) => !enKeySet.has(k));

    expect(missingInHi, "hi.json is missing keys present in en.json").toEqual(
      [],
    );
    expect(extraInHi, "hi.json has extra keys not in en.json").toEqual([]);
  });

  it("preserves identical interpolation placeholders between en.json and hi.json", () => {
    function extractPlaceholders(str: string): string[] {
      const matches = str.match(/\{[a-zA-Z0-9_]+\}/g) ?? [];
      return [...matches].sort();
    }

    const en = JSON.parse(
      fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"),
    );
    const hi = JSON.parse(
      fs.readFileSync(path.join(messagesDir, "hi.json"), "utf8"),
    );

    const mismatches: Array<{ key: string; en: string[]; hi: string[] }> = [];

    function comparePlaceholders(enObj: unknown, hiObj: unknown, prefix = "") {
      if (typeof enObj === "string" && typeof hiObj === "string") {
        const enP = extractPlaceholders(enObj);
        const hiP = extractPlaceholders(hiObj);
        if (JSON.stringify(enP) !== JSON.stringify(hiP)) {
          mismatches.push({ key: prefix, en: enP, hi: hiP });
        }
        return;
      }

      if (
        typeof enObj === "object" &&
        enObj !== null &&
        typeof hiObj === "object" &&
        hiObj !== null
      ) {
        if (Array.isArray(enObj) && Array.isArray(hiObj)) {
          for (let i = 0; i < enObj.length; i++) {
            comparePlaceholders(enObj[i], hiObj[i], `${prefix}[${i}]`);
          }
        } else {
          for (const key of Object.keys(enObj as Record<string, unknown>)) {
            const nextPrefix = prefix ? `${prefix}.${key}` : key;
            comparePlaceholders(
              (enObj as Record<string, unknown>)[key],
              (hiObj as Record<string, unknown>)[key],
              nextPrefix,
            );
          }
        }
      }
    }

    comparePlaceholders(en, hi);
    expect(
      mismatches,
      "interpolation placeholder mismatches between en and hi",
    ).toEqual([]);
  });
});

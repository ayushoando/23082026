#!/usr/bin/env node
/**
 * Synchronize Wave 1 marketing namespaces from en.json into hi.json.
 *
 * When to run: new keys were added in `en.json` and `hi.json` needs those
 * keys scaffolded (English fallback) so parity stays green.
 *
 * When NOT to run with `--write`: after hand-edited Hindi campaign copy.
 * `HI_OVERRIDES` re-applies on write and can clobber that copy.
 *
 * Direct CLI default is dry-run (`write: false`). Pass `--write` to persist
 * `site/i18n/messages/hi.json`. Logs "dry run" vs "wrote hi.json".
 *
 * Merge order (do not change): en scaffold → preserve existing hi → apply
 * `HI_OVERRIDES`. `manifest.wave1Namespaces` is this script's write scope,
 * not the Hindi key-parity bar (parity is every top-level key in en.json).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptsDir, "..", "site");
const messagesDir = path.join(siteRoot, "i18n", "messages");

export function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const manifest = readJson(
  path.join(siteRoot, "i18n", "marketing-parity-manifest.json"),
);

/** Hindi campaign overrides. Every path must exist in current `en.json`. */
export const HI_OVERRIDES = {
  home: {
    title: "ओआंडो प्लेटफॉर्म",
    subtitle: "पेशेवर स्पेस प्लानिंग और डिज़ाइन टूल",
    getStarted: "शुरू करें",
    hero: {
      kicker: "पैन-इंडिया · 2011 से",
      primaryCta: { label: "उत्पाद देखें", href: "/products" },
      secondaryCta: { label: "कोटेशन अनुरोध", href: "/#contact" },
    },
  },
  about: {
    heroTitle: "वन एंड ओनली के बारे में",
    heroSubtitle:
      "हम व्यावहारिक, टिकाऊ और स्केलेबल वर्कस्पेस सिस्टम डिज़ाइन और डिलीवर करते हैं।",
  },
  contact: {
    heroTitle: "संपर्क करें",
    heroSubtitle: "अपनी वर्कस्पेस आवश्यकता साझा करें और हमारी टीम अगले कदम बताएगी।",
  },
  products: {
    headlineLead: "वर्कस्पेस",
    headlineAccent: "उत्पाद",
    heroSubtitle: "लाइव कैटलॉग से श्रेणियां ब्राउज़ करें और अपनी टीम के लिए सही मिक्स चुनें।",
  },
  solutions: {
    heroTitleLead: "वर्कस्पेस",
    heroTitleAccent: "समाधान",
    heroSubtitle: "योजना से डिलीवरी तक — एक टीम, स्पष्ट समयरेखा, मापनीय परिणाम।",
  },
};

const UNSAFE_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function deepMerge(base, overrides) {
  if (!overrides) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (UNSAFE_OBJECT_KEYS.has(key)) continue;
    out[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? deepMerge(base?.[key] ?? {}, value)
        : value;
  }
  return out;
}

/**
 * @param {Record<string, any>} en
 * @param {Record<string, any>} hi
 * @param {string[]} [namespaces]
 * @param {Record<string, any>} [overrides]
 * @returns {Record<string, any>}
 */
export function buildHiWave1Messages(
  en,
  hi,
  namespaces = manifest.wave1Namespaces,
  overrides = HI_OVERRIDES,
) {
  const next = { ...hi };
  for (const namespace of namespaces) {
    const base = deepMerge(
      structuredClone(en[namespace] ?? {}),
      hi[namespace] ?? {},
    );
    next[namespace] = deepMerge(base, overrides[namespace] ?? {});
  }
  return next;
}

/**
 * @param {{
 *   messagesDir?: string;
 *   write?: boolean;
 * }} [options]
 */
export function syncHiWave1Messages({
  messagesDir: dir = messagesDir,
  write = true,
} = {}) {
  const en = readJson(path.join(dir, "en.json"));
  const hi = readJson(path.join(dir, "hi.json"));
  const next = buildHiWave1Messages(en, hi);
  if (write) {
    fs.writeFileSync(
      path.join(dir, "hi.json"),
      `${JSON.stringify(next, null, 2)}\n`,
      "utf8",
    );
  }
  return { namespaces: manifest.wave1Namespaces, next };
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  const write = process.argv.includes("--write");
  const { namespaces } = syncHiWave1Messages({ write });
  const scope = `wave1 namespaces: ${namespaces.join(", ")}`;
  process.stdout.write(
    write ? `Wrote hi.json ${scope}\n` : `Dry run (pass --write to update hi.json) ${scope}\n`,
  );
}

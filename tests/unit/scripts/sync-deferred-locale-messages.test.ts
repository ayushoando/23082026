// @vitest-environment node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  marketingSubtree,
  mergePreserveTranslations,
  readJson,
  syncDeferredLocaleMessages,
} from "../../../scripts/sync-deferred-locale-messages.mjs";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(
  siteRoot,
  "scripts/sync-deferred-locale-messages.mjs",
);

describe("sync-deferred-locale-messages (name-mirror)", () => {
  it("exits 0 when executed directly", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(typeof output).toBe("string");
  });

  it("mergePreserveTranslations keeps translated strings while filling new English keys", () => {
    const existing = {
      title: "Hallo Welt",
      description: "Eine Beschreibung",
    };
    const enSource = {
      title: "Hello World",
      description: "A description",
      newKey: "New Feature",
      nested: { tag: "Tag" },
    };

    const result = mergePreserveTranslations(existing, enSource);
    expect(result).toEqual({
      title: "Hallo Welt",
      description: "Eine Beschreibung",
      newKey: "New Feature",
      nested: { tag: "Tag" },
    });
  });

  it("marketingSubtree extracts selected namespaces only", () => {
    const messages = {
      about: { title: "About" },
      contact: { phone: "123" },
      adminOnly: { secret: "123" },
    };

    const subtree = marketingSubtree(messages, ["about", "contact"]);
    expect(subtree).toEqual({
      about: { title: "About" },
      contact: { phone: "123" },
    });
  });

  it("syncDeferredLocaleMessages with write=false performs dry run merge", () => {
    const sampleEn = {
      about: { title: "About Us" },
    };

    const results = syncDeferredLocaleMessages({
      locales: ["de"],
      enSource: sampleEn,
      namespaces: ["about"],
      write: false,
    });

    expect(results.length).toBe(1);
    expect(results[0].locale).toBe("de");
    expect(results[0].namespaces).toBe(1);
  });

  it("readJson parses valid JSON and throws descriptive error on invalid path", () => {
    const manifest = readJson(
      path.join(siteRoot, "site/i18n/marketing-parity-manifest.json"),
    );
    expect(typeof manifest).toBe("object");
    expect(() => readJson(path.join(siteRoot, "non-existent.json"))).toThrow(
      /Failed to parse JSON/,
    );
  });
});

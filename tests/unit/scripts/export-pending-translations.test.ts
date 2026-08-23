// @vitest-environment node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  collectLeaves,
  exportPendingTranslations,
  readJson,
  setByPath,
} from "../../../scripts/export-pending-translations.mjs";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(
  siteRoot,
  "scripts/export-pending-translations.mjs",
);

describe("export-pending-translations (name-mirror)", () => {
  it("exits 0 when executed directly", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(typeof output).toBe("string");
  });

  it("exportPendingTranslations executes with write=false and returns structured results", () => {
    const results = exportPendingTranslations({
      siteRoot: path.join(siteRoot, "site"),
      write: false,
    });
    expect(Array.isArray(results)).toBe(true);
    expect(results).toEqual([]);
  });

  it("collectLeaves extracts string leaves while skipping non-translatable tokens", () => {
    const input = {
      title: "Hello World",
      url: "https://example.com/api",
      email: "staff@oando.in",
      number: "12345",
      nested: {
        subtitle: "A description",
        items: ["Item 1", "Item 2"],
      },
    };

    const leaves = collectLeaves(input, "test");
    expect(leaves).toEqual([
      { path: "test.title", value: "Hello World" },
      { path: "test.nested.subtitle", value: "A description" },
      { path: "test.nested.items[0]", value: "Item 1" },
      { path: "test.nested.items[1]", value: "Item 2" },
    ]);
  });

  it("setByPath sets nested object and array values based on path expression", () => {
    const root: Record<string, unknown> = {};
    setByPath(root, "hero.title", "Main Title");
    setByPath(root, "hero.badges[0]", "Badge 1");
    setByPath(root, "hero.badges[1]", "Badge 2");

    expect(root).toEqual({
      hero: {
        title: "Main Title",
        badges: ["Badge 1", "Badge 2"],
      },
    });
  });

  it("readJson throws descriptive error on invalid path", () => {
    expect(() =>
      readJson(path.join(siteRoot, "non-existent-file.json")),
    ).toThrow(/Failed to parse JSON/);
  });
});

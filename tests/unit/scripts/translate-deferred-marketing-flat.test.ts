// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  chunk,
  collectLeaves,
  deepMergeStructure,
  setByPath,
  shouldSkipTranslation,
} from "../../../scripts/translate-deferred-marketing-flat.mjs";

describe("translate-deferred-marketing-flat (name-mirror)", () => {
  it("shouldSkipTranslation identifies non-translatable strings", () => {
    expect(shouldSkipTranslation("https://example.com/item")).toBe(true);
    expect(shouldSkipTranslation("/tools/calculator")).toBe(true);
    expect(shouldSkipTranslation("mailto:support@oando.in")).toBe(true);
    expect(shouldSkipTranslation("staff@oando.in")).toBe(true);
    expect(shouldSkipTranslation("+91 99999 88888")).toBe(true);
    expect(shouldSkipTranslation("100%")).toBe(true);
    expect(shouldSkipTranslation("99.9")).toBe(true);
    expect(shouldSkipTranslation("Hello world")).toBe(false);
    expect(shouldSkipTranslation("Office Furniture")).toBe(false);
  });

  it("collectLeaves extracts string leaves using filter", () => {
    const input = {
      hero: {
        title: "Workspaces",
        link: "https://oando.co.in",
        phone: "+91 800 001",
      },
      badges: ["Fast", "100%"],
    };

    const leaves = collectLeaves(input, "home");
    expect(leaves).toEqual([
      { path: "home.hero.title", value: "Workspaces" },
      { path: "home.badges[0]", value: "Fast" },
    ]);
  });

  it("setByPath securely updates nested structure without prototype pollution", () => {
    const root: Record<string, unknown> = {};
    setByPath(root, "a.b.c", "target");
    setByPath(root, "__proto__.polluted", "bad");
    setByPath(root, "constructor.prototype.polluted", "bad");

    expect(root).toEqual({ a: { b: { c: "target" } } });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("chunk partitions array into expected slice sizes", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    expect(chunk(items, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it("deepMergeStructure merges nested objects without clobbering existing structures", () => {
    const base = {
      section: {
        title: "Base Title",
        subtitle: "Base Subtitle",
      },
      items: [1, 2],
    };
    const overrides = {
      section: {
        title: "Overridden Title",
      },
    };

    const result = deepMergeStructure(base, overrides);
    expect(result).toEqual({
      section: {
        title: "Overridden Title",
        subtitle: "Base Subtitle",
      },
      items: [1, 2],
    });
  });
});

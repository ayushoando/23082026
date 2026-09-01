/**
 * AI-FIX-08 — prompt-injection guard for user text interpolated into prompts.
 */

import { describe, expect, it } from "vitest";

import { sanitizeUserInput } from "@/lib/ai/sanitizeUserInput";

describe("sanitizeUserInput", () => {
  it("collapses newlines into spaces", () => {
    expect(sanitizeUserInput("line one\nline two\r\nline three\rfour")).toBe(
      "line one line two line three four",
    );
  });

  it("strips angle brackets and braces", () => {
    expect(
      sanitizeUserInput("ignore <system> rules {and} {{templates}}"),
    ).toBe("ignore system rules and templates");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeUserInput("   ergonomic chair   ")).toBe("ergonomic chair");
  });

  it("caps at the default maxLen of 500 characters", () => {
    expect(sanitizeUserInput("x".repeat(1200))).toHaveLength(500);
  });

  it("honors a custom maxLen", () => {
    expect(sanitizeUserInput("abcdefgh", 3)).toBe("abc");
  });

  it("is idempotent", () => {
    const once = sanitizeUserInput("  a<b>\n{c}  ");
    expect(sanitizeUserInput(once)).toBe(once);
  });

  it("returns an empty string for input with only stripped characters", () => {
    expect(sanitizeUserInput("\n<>{}\r\n")).toBe("");
  });
});

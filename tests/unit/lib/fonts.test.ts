/**
 * Name-mirror coverage for lib/fonts.
 * next/font/local is globally mocked in tests/setup.ts.
 * Face list is read from source (mock does not keep `src`).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ciscoSans,
  helveticaNeue,
  resolveLoadedSansFamily,
  resolveLoadedSansFamilyShort,
} from "@/lib/fonts";

const fontsPath = [
  path.resolve(process.cwd(), "site/lib/fonts.ts"),
  path.resolve(process.cwd(), "lib/fonts.ts"),
].find((candidate) => existsSync(candidate));
if (!fontsPath) {
  throw new Error("site/lib/fonts.ts not found from vitest cwd");
}
const fontsSrc = readFileSync(fontsPath, "utf8");

describe("fonts", () => {
  it("exports ciscoSans and helveticaNeue font objects", () => {
    expect(ciscoSans).toBeDefined();
    expect(helveticaNeue).toBeDefined();
    expect(typeof ciscoSans.className).toBe("string");
    expect(typeof helveticaNeue.className).toBe("string");
  });

  it("provides style.fontFamily for layout consumers", () => {
    expect(ciscoSans.style?.fontFamily).toBeDefined();
    expect(helveticaNeue.style?.fontFamily).toBeDefined();
  });

  it("resolves Helvetica Neue for canvas without Inter", () => {
    const family = resolveLoadedSansFamily();
    const short = resolveLoadedSansFamilyShort();
    expect(family.toLowerCase()).not.toContain("inter");
    expect(short.toLowerCase()).not.toContain("inter");
    expect(family.length).toBeGreaterThan(0);
    expect(short.length).toBeGreaterThan(0);
  });

  it("loads weight 300 for Cisco ExtraLight and Neue Light", () => {
    expect(fontsSrc).toMatch(/CiscoSans-ExtraLight\.ttf[\s\S]{0,80}weight:\s*"300"/);
    expect(fontsSrc).toMatch(/HelveticaNeue-Light\.otf[\s\S]{0,80}weight:\s*"300"/);
    expect(fontsSrc).not.toMatch(/from "next\/font\/google"/);
    expect(fontsSrc).toMatch(/display:\s*"swap"/);
  });
});

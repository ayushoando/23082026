// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  countActiveItBlocks,
  countExpectCalls,
  findHollowPatternViolations,
  HOLLOW_PATTERNS,
} from "../../../scripts/general/hollow-test-patterns.mjs";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/general/audit-hollow-tests.mjs");
const fakeTestScriptPath = path.join(
  siteRoot,
  "tech-docs-generator/scripts/fake-test-audit.mjs",
);

describe("audit-hollow-tests", () => {
  it("flags hollow Vitest cases under tests/", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
    expect(fs.existsSync(fakeTestScriptPath)).toBe(true);
    const source = fs.readFileSync(scriptPath, "utf8");
    expect(source).toContain("hollow-test-patterns.mjs");
    expect(source).toContain("--exclude-marketing");
  });

  it("matches hollow expect-true and sole-truthy pattern ids", () => {
    const byId = Object.fromEntries(HOLLOW_PATTERNS.map((p) => [p.id, p.re]));
    const hollowTrue = "expect(true)." + "toBe(true)";
    const hollowTruthy = "expect(x)." + "toBeTruthy()";
    const hollowCatch = "catch (err) " + "{}";
    expect(byId["expect-true"].test(hollowTrue)).toBe(true);
    expect(byId["expect-true"].test("expect(value).toBe(true)")).toBe(false);
    expect(byId["sole-truthy"].test(hollowTruthy)).toBe(true);
    expect(byId["empty-catch"].test(hollowCatch)).toBe(true);
    expect(byId["sole-defined"].test("expect(mod)." + "toBeDefined()")).toBe(true);
    expect(byId["empty-catch"].test("catch (err) { log(err); }")).toBe(false);
  });

  it("counts expect( calls and active it blocks", () => {
    expect(countExpectCalls("it('x', () => { expect(1).toBe(1); expect(2).toBe(2); })")).toBe(2);
    expect(countExpectCalls("it('empty', () => { const x = 1; })")).toBe(0);
    expect(countActiveItBlocks("it('a', () => {}); it.each([1])('b', () => {})")).toBe(2);
    expect(countActiveItBlocks("it.skip('s', () => {}); it('a', () => {})")).toBe(1);
  });

  it("findHollowPatternViolations flags zero-expect files", () => {
    const hits = findHollowPatternViolations("it('empty', () => { const x = 1; })", {
      file: "tests/example.test.ts",
    });
    expect(hits.some((h) => h.reason === "zero-expect")).toBe(true);
  });

  it.each([
    ".kiro/kiro-repo-guidance-setup/tests/sample.test.ts",
    ".kiro/specs/example/tests/sample.test.ts",
  ])("flags hollow tests in contained Kiro root %s", (relativeTestPath) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "audit-hollow-kiro-"));
    try {
      const absolute = path.join(tmp, relativeTestPath);
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, "it('empty', () => { const value = 1; });\n");

      let stderr = "";
      try {
        execFileSync(process.execPath, [scriptPath], {
          cwd: siteRoot,
          encoding: "utf8",
          env: { ...process.env, MONOREPO_ROOT: tmp },
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (error) {
        stderr = String((error as { stderr?: string }).stderr ?? "");
      }
      expect(stderr).toContain("zero-expect");
      expect(stderr.replaceAll("\\", "/")).toContain(relativeTestPath);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("runs hollow audit against the live tests tree without crashing", () => {
    try {
      const output = execFileSync(process.execPath, [scriptPath], {
        cwd: siteRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 10 * 1024 * 1024,
      });
      expect(output).toContain("audit-hollow-tests: ok");
    } catch (error) {
      const err = error as { status?: number; stderr?: string };
      expect(err.status).toBe(1);
      expect(String(err.stderr ?? "")).toMatch(/audit-hollow-tests: \d+ issue\(s\)/);
    }
  });

  it("runs fake-test audit against the tech-docs lane without crashing", () => {
    try {
      const output = execFileSync(process.execPath, [fakeTestScriptPath], {
        cwd: siteRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 10 * 1024 * 1024,
      });
      expect(output).toContain("Fake-test audit passed");
    } catch (error) {
      const err = error as { status?: number; stderr?: string };
      expect(err.status).toBe(1);
      expect(String(err.stderr ?? "")).toMatch(/Fake-test audit failed/);
    }
  });
});

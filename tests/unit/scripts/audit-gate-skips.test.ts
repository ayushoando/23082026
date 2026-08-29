// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(monorepoRoot, "scripts/general/audit-gate-skips.mjs");
const configPath = path.join(monorepoRoot, "config/build/playwright-gate-specs.json");

describe("audit-gate-skips", () => {
  it("audits all test sources and the Playwright gate manifest", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
    const source = fs.readFileSync(scriptPath, "utf8");
    expect(source).toContain("playwright-gate-specs.json");
    expect(source).toContain("contains-skip");
    expect(source).toContain("contains-test-info-skip");
    expect(source).toContain("contains-focused-test");
    expect(source).toContain("contains-coverage-ignore");
    expect(source).toContain("missing-file");
  });

  it("reads a real gate-spec config with a specs array", () => {
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as { specs?: string[] };
    expect(Array.isArray(config.specs)).toBe(true);
    expect((config.specs ?? []).length).toBeGreaterThan(0);
  });

  it("reports either a clean repository or explicit audited issues", () => {
    try {
      const output = execFileSync(process.execPath, [scriptPath], {
        cwd: monorepoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      expect(output).toContain("audit-gate-skips: ok");
    } catch (error) {
      const failure = error as { status?: number; stderr?: string };
      expect(failure.status).toBe(1);
      expect(String(failure.stderr ?? "")).toMatch(/audit-gate-skips: \d+ issue\(s\)/);
    }
  });

  it("detects skip calls with the same regex the script uses", () => {
    const source = fs.readFileSync(scriptPath, "utf8");
    const reMatch = source.match(/const skipRe = (\/.*?\/);/);
    expect(reMatch).not.toBeNull();
    const skipRe = new Function(`return ${reMatch![1]}`)() as RegExp;
    expect(skipRe.test("test.skip('x', () => {})")).toBe(true);
    expect(skipRe.test("describe.skip('x', () => {})")).toBe(true);
    expect(skipRe.test("test.skipIf(true)('x', () => {})")).toBe(true);
    expect(skipRe.test("test.fixme('x', () => {})")).toBe(true);
    expect(skipRe.test("test('ok', () => {})")).toBe(false);
  });

  it.each([
    ["test.skipIf(true)('conditional', () => {})", "contains-skip"],
    ["testInfo.skip(true, 'browser condition')", "contains-test-info-skip"],
    ["test.only('focused', () => {})", "contains-focused-test"],
    ["/* istanbul" + " ignore next */ export const value = 1;", "contains-coverage-ignore"],
  ])("rejects repository-wide source containing %s", (testSource, reason) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "audit-gate-skips-"));
    try {
      fs.mkdirSync(path.join(tmp, "config/build"), { recursive: true });
      fs.mkdirSync(path.join(tmp, "tests/manifests"), { recursive: true });
      fs.mkdirSync(path.join(tmp, "tests/unit/site/lib"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "config/build/playwright-gate-specs.json"), '{"specs":[]}\n');
      fs.writeFileSync(path.join(tmp, "tests/manifests/skip-exceptions.json"), '{"version":1,"exceptions":[]}\n');
      fs.writeFileSync(path.join(tmp, "tests/unit/site/lib/sample.test.ts"), `${testSource}\n`);

      let stderr = "";
      try {
        execFileSync(process.execPath, [scriptPath], {
          cwd: monorepoRoot,
          encoding: "utf8",
          env: { ...process.env, MONOREPO_ROOT: tmp },
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (error) {
        stderr = String((error as { stderr?: string }).stderr ?? "");
      }
      expect(stderr).toContain(reason);
      expect(stderr).toContain("tests/unit/site/lib/sample.test.ts");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

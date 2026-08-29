// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  COVERAGE_GATE_ADMIN,
  COVERAGE_GATE_PLANNER,
  COVERAGE_GATE_SITE,
  COVERAGE_INVENTORY_ASPIRATION,
  coverageReadmeForAgents,
  fileStatusVsGate,
  isHighMassFile,
  isLargeBucket,
} from "../../../scripts/coverage-policy.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("coverage-policy (name-mirror)", () => {
  it("uses the approved metric-specific floor for every release profile", () => {
    for (const gate of [COVERAGE_GATE_PLANNER, COVERAGE_GATE_ADMIN, COVERAGE_GATE_SITE]) {
      expect(gate.lines).toBe(100);
      expect(gate.functions).toBe(100);
      expect(gate.statements).toBe(95);
      expect(gate.branches).toBe(95);
    }
  });

  it("keeps inventory diagnostic while exposing the same aspiration", () => {
    expect(COVERAGE_INVENTORY_ASPIRATION.lines).toBe(100);
    expect(COVERAGE_INVENTORY_ASPIRATION.statements).toBe(95);
    expect(COVERAGE_INVENTORY_ASPIRATION.profile).toBe("planner-inventory");
  });

  it("classifies percentages against the selected profile and metric", () => {
    expect(fileStatusVsGate(100, "lines", "site")).toContain("PASS");
    expect(fileStatusVsGate(99, "lines", "site")).toContain("PARTIAL");
    expect(fileStatusVsGate(95, "statements", "planner")).toContain("PASS");
    expect(fileStatusVsGate(94, "branches", "admin")).toContain("PARTIAL");
    expect(fileStatusVsGate(10, "lines", "site")).toContain("LOW");
    expect(fileStatusVsGate(0, "lines", "site")).toContain("FAIL");
  });

  it("detects high-mass and large-bucket shares", () => {
    expect(isHighMassFile(100, 10000, 0.01)).toBe(true);
    expect(isHighMassFile(50, 10000, 0.01)).toBe(false);
    expect(isHighMassFile(1, 0)).toBe(false);
    expect(isLargeBucket(500, 10000, 0.05)).toBe(true);
    expect(isLargeBucket(100, 10000, 0.05)).toBe(false);
  });

  it("describes strict gates, reviewed exclusions, and diagnostic inventory", () => {
    const text = coverageReadmeForAgents();
    expect(text).toContain("100% lines");
    expect(text).toContain("95% statements");
    expect(text).toContain("owner-reviewed");
    expect(text).toContain("diagnostic-only");
  });

  it("wires every release profile to the shared manifest thresholds", () => {
    const shared = fs.readFileSync(path.join(repositoryRoot, "tests/vitest.shared.ts"), "utf8");
    const site = fs.readFileSync(path.join(repositoryRoot, "tests/vitest.site.config.ts"), "utf8");
    const admin = fs.readFileSync(path.join(repositoryRoot, "tests/vitest.admin.coverage.config.ts"), "utf8");
    const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(shared).toContain('manifests", "coverage-exceptions.json"');
    expect(shared).toContain("VITEST_COVERAGE_THRESHOLDS");
    expect(site).toContain("thresholds: { ...VITEST_COVERAGE_THRESHOLDS }");
    expect(admin).toContain("thresholds: { ...VITEST_COVERAGE_THRESHOLDS }");
    expect(packageJson.scripts["release:gate:core"]).toContain("test:coverage:admin");
    expect(packageJson.scripts["test:coverage:admin"]).toContain("generate-coverage-report.mjs admin");
  });
});

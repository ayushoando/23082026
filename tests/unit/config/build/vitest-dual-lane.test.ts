// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

describe("vitest dual-lane (Phase 4 parallel contention)", () => {
  it("pnpm run test delegates to run-full-vitest dual-lane runner", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(workspaceRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(pkg.scripts.test).toBe("node scripts/run-full-vitest.mjs");

    const runner = fs.readFileSync(
      path.join(workspaceRoot, "scripts/run-full-vitest.mjs"),
      "utf8",
    );
    expect(runner).toContain("tests/vitest.config.ts");
    expect(runner).toContain("tests/vitest.tech-docs.config.ts");
  });

  it("caps default fork fan-out and serialises the tech-docs lane", () => {
    const main = fs.readFileSync(
      path.join(workspaceRoot, "tests/vitest.config.ts"),
      "utf8",
    );
    const techDocs = fs.readFileSync(
      path.join(workspaceRoot, "tests/vitest.tech-docs.config.ts"),
      "utf8",
    );
    const shared = fs.readFileSync(
      path.join(workspaceRoot, "tests/vitest.shared.ts"),
      "utf8",
    );

    // Hard cap (not "%") — Windows fork fan-out races node_modules (lucide-react).
    expect(main).toMatch(/maxWorkers:\s*4\b/);
    expect(main).toContain("VITEST_DEFAULT_EXCLUDE");
    expect(shared).toContain("VITEST_TECH_DOCS_EXCLUDE");
    expect(techDocs).toMatch(/maxWorkers:\s*1/);
    expect(techDocs).toMatch(/fileParallelism:\s*false/);
    expect(techDocs).toContain("../tests/tech-docs-generator/**/*.test.{ts,tsx}");
  });

  it("does not include external spec trees in the site test lane (site tests are product-only)", () => {
    const shared = fs.readFileSync(
      path.join(workspaceRoot, "tests/vitest.shared.ts"),
      "utf8",
    );

    // VITEST_TEST_INCLUDE may only reference the product tests/ tree — no
    // hidden external spec directories may ever enter the lane.
    const includeMatch = shared.match(/VITEST_TEST_INCLUDE = \[([\s\S]*?)\]/);
    expect(includeMatch).not.toBeNull();
    const includeGlobs = [...includeMatch![1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    expect(includeGlobs.length).toBeGreaterThan(0);
    for (const glob of includeGlobs) {
      expect(glob.startsWith("../tests/")).toBe(true);
      expect(glob).not.toMatch(/(^|\/)\.[^./]/);
    }

    // Only the product tests/ directory should be included
    expect(shared).toContain("../tests/**/*.test.ts");
    expect(shared).toContain("../tests/**/*.test.tsx");
  });
});

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

  it("includes contained Kiro tests in the default lane and test typecheck", () => {
    const shared = fs.readFileSync(
      path.join(workspaceRoot, "tests/vitest.shared.ts"),
      "utf8",
    );
    const testTsconfig = JSON.parse(
      fs.readFileSync(path.join(workspaceRoot, "tests/tsconfig.json"), "utf8"),
    ) as { include: string[]; exclude: string[] };

    expect(shared).toContain(
      "../.kiro/kiro-repo-guidance-setup/tests/**/*.{test,spec}.{ts,tsx}",
    );
    expect(shared).toContain(
      "../.kiro/specs/**/tests/**/*.{test,spec}.{ts,tsx}",
    );
    expect(shared).not.toContain(
      '"../.kiro/kiro-repo-guidance-setup/tests/**",',
    );
    expect(testTsconfig.include).toEqual(
      expect.arrayContaining([
        "../.kiro/kiro-repo-guidance-setup/**/*.ts",
        "../.kiro/kiro-repo-guidance-setup/**/*.tsx",
        "../.kiro/specs/**/tests/**/*.ts",
        "../.kiro/specs/**/tests/**/*.tsx",
      ]),
    );
    expect(testTsconfig.exclude).not.toContain(
      "../.kiro/kiro-repo-guidance-setup/tests/**",
    );
  });
});

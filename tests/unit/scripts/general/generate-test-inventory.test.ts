// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  classifyTestInventoryPath,
  collectTestInventoryFiles,
} from "../../../../scripts/general/generate-test-inventory.mjs";

describe("generate-test-inventory classification", () => {
  it.each([
    ["tests/unit/site/lib/example.test.ts", "vitest", "vitest"],
    ["tests/e2e/site/app/ooplanner/dockview.spec.ts", "playwright", "playwright"],
    ["tests/support/fixtures/project.json", "fixture", "support"],
    ["tests/e2e/example.spec.ts-snapshots/example-chromium.png", "snapshot", "support"],
    ["tests/support/page-objects/planner.helper.ts", "helper", "support"],
    ["tests/support/README.md", "asset", "support"],
  ])("classifies %s as one %s category", (file, kind, runner) => {
    expect(classifyTestInventoryPath(file)).toEqual({ kind, runner });
  });

  it("discovers ordinary tests while ignoring Kiro-owned roots", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "test-inventory-"));
    try {
      const ordinaryPath = "tests/unit/site/lib/ordinary.test.ts";
      const nestedKiroPath = "tests/.kiro/specs/example/tests/spec-owned.test.ts";
      const externalKiroPath = ".kiro/specs/example/tests/spec-owned.test.ts";

      for (const relative of [ordinaryPath, nestedKiroPath, externalKiroPath]) {
        const absolute = path.join(tmp, relative);
        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        fs.writeFileSync(absolute, "export {};\n");
      }

      const paths = collectTestInventoryFiles(tmp).map((file) => file.path);
      expect(paths).toEqual([ordinaryPath]);
      expect(paths.some((file) => file.startsWith(".kiro/"))).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("does not classify executable specs as generic helpers", () => {
    const classification = classifyTestInventoryPath("tests/e2e/site/app/admin/catalog.spec.ts");
    expect(classification.kind).toBe("playwright");
    expect(classification.runner).not.toBe("support");
  });
});

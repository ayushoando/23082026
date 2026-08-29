// @vitest-environment node
import { describe, expect, it } from "vitest";

import { classifyTestInventoryPath } from "../../../../scripts/general/generate-test-inventory.mjs";

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

  it("does not classify executable specs as generic helpers", () => {
    const classification = classifyTestInventoryPath("tests/e2e/site/app/admin/catalog.spec.ts");
    expect(classification.kind).toBe("playwright");
    expect(classification.runner).not.toBe("support");
  });
});

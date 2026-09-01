// @vitest-environment node
//
// Touch-action scope — CSS architecture tests (Req 7.4).
// Split out of plannerFocusAndTouch.test.tsx: these read site CSS from disk,
// which requires the node environment (happy-dom externalizes node builtins).

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cssPath = resolve(
  import.meta.dirname,
  "../../../site/focss/planner/workspace-shell.css",
);

describe("planner: touch-action CSS architecture", () => {
  it("canvas-specific touch-action rule exists in workspace-shell CSS", () => {
    const css = readFileSync(cssPath, "utf-8");

    // The canvas inner canvas element should have touch-action: none.
    expect(css).toContain(".canvas-stage__inner canvas { touch-action: none; }");

    // The workspace or page-level elements should NOT have touch-action: none.
    // Split into lines and check no line applies touch-action: none to .workspace or body.
    const lines = css.split("\n");
    const problematicLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed.includes("touch-action: none")) return false;
      // Allow only the canvas-scoped rule and the resize handles.
      if (trimmed.includes("canvas")) return false;
      if (trimmed.includes("grip")) return false;
      if (trimmed.includes("resize")) return false;
      return true;
    });

    expect(
      problematicLines,
      "No page-level touch-action: none should exist in workspace-shell.css (only canvas-scoped)",
    ).toHaveLength(0);
  });

  it("phone panels use touch-action: pan-y for vertical scrolling", () => {
    const css = readFileSync(cssPath, "utf-8");

    // Verify pan-y exists for panels on narrow viewports.
    expect(css).toContain("touch-action: pan-y");
    // Verify pan-x exists for toolbars on narrow viewports.
    expect(css).toContain("touch-action: pan-x");
  });
});

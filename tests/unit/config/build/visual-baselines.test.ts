// @vitest-environment node
import { describe, expect, it } from "vitest";

import { VIEWPORT_TIERS } from "../../../support/fixtures/viewportTiers";
import { REQUIRED_UI_STATES } from "../../../support/ui-states/uiStateMatrix";
import {
  loadVisualBaselineManifest,
  visualBaselineName,
} from "../../../support/visual/visualBaseline";

describe("visual baseline manifest", () => {
  it("requires every UI state across all surfaces, browsers, and viewport tiers", () => {
    const manifest = loadVisualBaselineManifest();
    expect(manifest.requiredStates).toEqual(REQUIRED_UI_STATES);
    expect(Object.keys(manifest.viewportTiers)).toEqual(VIEWPORT_TIERS.map((tier) => tier.name));
    expect(manifest.surfaces.map((surface) => surface.id)).toEqual([
      "marketing",
      "admin",
      "planner",
      "studio",
    ]);

    const names = new Set<string>();
    for (const surface of manifest.surfaces) {
      for (const state of REQUIRED_UI_STATES) {
        for (const browser of manifest.browsers) {
          for (const viewport of VIEWPORT_TIERS) {
            names.add(visualBaselineName({ surface: surface.id, state, browser, viewport: viewport.name }));
          }
        }
      }
    }
    expect(names.size).toBe(4 * 6 * 3 * 3);
  });

  it("rejects unregistered visual identities instead of creating ad hoc goldens", () => {
    expect(() =>
      visualBaselineName({
        surface: "unknown",
        state: "default",
        browser: "chromium",
        viewport: "desktop",
      }),
    ).toThrow(/Unknown visual surface/);
  });
});

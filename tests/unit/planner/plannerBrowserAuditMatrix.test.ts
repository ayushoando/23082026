// @vitest-environment node
// Feature: planner-comprehensive-audit, Task 5.8 extended browser/device profiles
// Validates: Requirements 6.1, 7.1, 8.1, 16.1-16.7

import { describe, expect, it } from "vitest";

import { PLANNER_BROWSER_AUDIT_PROFILES } from "../../fixtures/planner/browserAuditMatrix";

describe("Planner Task 5.8 extended browser/device profiles", () => {
  it("keeps required Chromium coverage separate from non-duplicative optional profiles", () => {
    const required = PLANNER_BROWSER_AUDIT_PROFILES.filter(
      (profile) => profile.coverage === "required",
    );
    const extended = PLANNER_BROWSER_AUDIT_PROFILES.filter(
      (profile) => profile.coverage === "extended",
    );

    expect(required).toHaveLength(3);
    expect(required.map((profile) => profile.project)).toEqual([
      "chromium-desktop",
      "chromium-tablet",
      "chromium-mobile",
    ]);
    expect(extended.map((profile) => profile.project)).toEqual([
      "firefox-tablet",
      "webkit-mobile",
    ]);
    expect(extended.map((profile) => profile.input)).toEqual(["keyboard", "touch"]);
    expect(extended.map((profile) => profile.viewport)).toEqual([
      { width: 768, height: 1_024 },
      { width: 390, height: 844 },
    ]);
    expect(
      new Set(PLANNER_BROWSER_AUDIT_PROFILES.map((profile) => profile.id)).size,
    ).toBe(PLANNER_BROWSER_AUDIT_PROFILES.length);
    expect(
      new Set(PLANNER_BROWSER_AUDIT_PROFILES.map((profile) => profile.project)).size,
    ).toBe(PLANNER_BROWSER_AUDIT_PROFILES.length);
  });
});

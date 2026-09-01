// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  descForTestCommand,
  scopeForTestCommand,
  testingCommandCards,
  testCommands,
  testingPolicy,
} from "../../tech-docs-generator/src/data/testingData";

describe("testingData command cards", () => {
  it("maps scope and description helpers for every known script", () => {
    const scripts = [
      "test",
      "test:watch",
      "test:ui",
      "test:coverage",
      "test:planner",
      "test:unit",
      "test:planner-catalog",
      "test:e2e:nav",
      "test:a11y",
      "release:gate",
      "test:custom-script",
    ] as const;

    expect(scopeForTestCommand("release:gate")).toBe("All");
    expect(scopeForTestCommand("test:a11y")).toBe("Playwright");
    expect(scopeForTestCommand("test")).toBe("Vitest");
    expect(descForTestCommand("test")).toContain("Vitest");
    expect(descForTestCommand("release:gate")).toContain("pre-release");
    expect(descForTestCommand("test:custom-script")).toBe("test:custom-script");

    for (const script of scripts) {
      expect(descForTestCommand(script).length).toBeGreaterThan(0);
      expect(scopeForTestCommand(script).length).toBeGreaterThan(0);
    }
  });

  it("exports testing policy and package.json test commands", () => {
    expect(testingPolicy.length).toBeGreaterThan(0);
    expect(testCommands.every((record) => record.sourcePath === "package.json")).toBe(
      true,
    );
    expect(testingCommandCards.length).toBeGreaterThan(0);
  });
});

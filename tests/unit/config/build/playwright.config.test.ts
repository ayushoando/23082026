// @vitest-environment node
/** Static Playwright matrix and CI contracts; does not launch browsers. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import playwrightConfig from "../../../../config/build/playwright.config";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function reporterEntry(reporters: unknown, name: string): unknown {
  if (!Array.isArray(reporters)) return undefined;
  return reporters.find((entry) => (Array.isArray(entry) ? entry[0] === name : entry === name));
}

describe("config/build/playwright.config.ts", () => {
  it("points executable discovery at spec files under tests", () => {
    expect(String(playwrightConfig.testDir)).toContain("tests");
    expect(playwrightConfig.testMatch).toEqual(["**/*.spec.ts", "**/*.spec.tsx"]);
    expect(playwrightConfig.testIgnore).toEqual(["**/*.test.ts", "**/*.test.tsx"]);
    expect(path.normalize(String(playwrightConfig.outputDir))).toContain(path.normalize("results/test-results"));
  });

  it("defines Chromium, Firefox, and WebKit across desktop, tablet, and mobile", () => {
    const expectedNames = [
      "chromium-desktop",
      "chromium-tablet",
      "chromium-mobile",
      "firefox-desktop",
      "firefox-tablet",
      "firefox-mobile",
      "webkit-desktop",
      "webkit-tablet",
      "webkit-mobile",
    ];
    const projects = playwrightConfig.projects ?? [];
    expect(projects.map((project) => project.name)).toEqual(expectedNames);
    expect(projects).toHaveLength(9);

    const expectedViewports = {
      desktop: { width: 1440, height: 900 },
      tablet: { width: 1024, height: 768 },
      mobile: { width: 390, height: 844 },
    };
    for (const project of projects) {
      const tier = project.name?.split("-").at(-1) as keyof typeof expectedViewports;
      expect(project.use?.viewport).toEqual(expectedViewports[tier]);
      expect(project.use?.locale).toBe("en-IN");
      expect(project.use?.timezoneId).toBe("Asia/Kolkata");
      expect(project.use?.deviceScaleFactor).toBe(1);
    }
  });

  it("uses deterministic screenshots and durable local reporters", () => {
    expect(reporterEntry(playwrightConfig.reporter, "list")).toBeDefined();
    expect(reporterEntry(playwrightConfig.reporter, "html")).toBeDefined();
    expect(reporterEntry(playwrightConfig.reporter, "json")).toBeDefined();
    const screenshot = playwrightConfig.expect?.toHaveScreenshot;
    expect(screenshot).toMatchObject({
      maxDiffPixelRatio: 0.001,
      animations: "disabled",
      caret: "hide",
    });
    expect(playwrightConfig.snapshotPathTemplate).toContain("-snapshots");
  });

  it("uses localhost and a bounded reusable web server", () => {
    const baseURL = String(playwrightConfig.use?.baseURL ?? "");
    expect(baseURL).toMatch(/^http:\/\/localhost:/);
    expect(baseURL).not.toContain("127.0.0.1");

    const webServer = playwrightConfig.webServer;
    if (webServer === undefined) return;
    const servers = Array.isArray(webServer) ? webServer : [webServer];
    for (const server of servers) {
      expect(server.url).toMatch(/^http:\/\/localhost:/);
      expect(server.command).toContain("pnpm run");
      expect(server.timeout).toBeGreaterThan(0);
    }
  });

  it("keeps the release browser gate manifest-driven", () => {
    const runner = fs.readFileSync(
      path.join(repositoryRoot, "scripts/general/run-playwright-gate.mjs"),
      "utf8",
    );
    const manifest = JSON.parse(
      fs.readFileSync(path.join(repositoryRoot, "config/build/playwright-gate-specs.json"), "utf8"),
    ) as { specs: string[]; excluded: string[] };
    const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(runner).toContain("playwright-gate-specs.json");
    expect(manifest.specs).toHaveLength(8);
    expect(manifest.excluded).toEqual([]);
    expect(packageJson.scripts["release:gate"]).toContain("test:browser:gate");
    expect(packageJson.scripts["test:browser:gate"]).toContain("run-playwright-gate.mjs");
  });

  it("shards blob reports in CI and merges one HTML evidence artifact", () => {
    const workflow = fs.readFileSync(
      path.join(repositoryRoot, ".github/workflows/release-gate.yml"),
      "utf8",
    );
    expect(workflow).toContain('shard: ["1/4", "2/4", "3/4", "4/4"]');
    expect(workflow).toContain("playwright install --with-deps");
    expect(workflow).toContain("--reporter=blob");
    expect(workflow).toContain("playwright merge-reports --reporter=html");
    expect(workflow).toContain("playwright-html-report");
    expect(workflow).not.toContain("install --with-deps chromium");
  });
});

import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadEnvLocal } = require("../../scripts/general/loadEnvLocal.cjs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { forcePlaywrightBaseURLEnv } = require("./playwrightBaseURL.cjs");

interface VisualBaselineManifest {
  readonly determinism: {
    readonly locale: string;
    readonly timezoneId: string;
    readonly colorScheme: "light" | "dark";
    readonly reducedMotion: "reduce" | "no-preference";
    readonly deviceScaleFactor: number;
    readonly maxDiffPixelRatio: number;
  };
  readonly viewportTiers: Record<string, { readonly width: number; readonly height: number }>;
}

const configDirectory = __dirname;
const visualManifest = JSON.parse(
  fs.readFileSync(path.resolve(configDirectory, "../../tests/manifests/visual-baselines.json"), "utf8"),
) as VisualBaselineManifest;

loadEnvLocal();

// Capture before force — force always writes PLAYWRIGHT_BASE_URL=http://localhost:PORT
const userProvidedBaseURL = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());

// MUST run after loadEnvLocal so .env / shell 127.0.0.1 becomes localhost.
const baseURL = forcePlaywrightBaseURLEnv();
const isCI = !!process.env.CI;
const browserDevices = [
  ["chromium", devices["Desktop Chrome"]],
  ["firefox", devices["Desktop Firefox"]],
  ["webkit", devices["Desktop Safari"]],
] as const;
const projects = browserDevices.flatMap(([browser, device]) =>
  Object.entries(visualManifest.viewportTiers).map(([viewportTier, viewport]) => ({
    name: `${browser}-${viewportTier}`,
    use: {
      ...device,
      viewport,
      locale: visualManifest.determinism.locale,
      timezoneId: visualManifest.determinism.timezoneId,
      colorScheme: visualManifest.determinism.colorScheme,
      deviceScaleFactor: visualManifest.determinism.deviceScaleFactor,
    },
  })),
);

export default defineConfig({
  testDir: "../../tests",
  testMatch: ["**/*.spec.ts", "**/*.spec.tsx"],
  testIgnore: ["**/*.test.ts", "**/*.test.tsx"],
  outputDir: "../../results/test-results",
  globalSetup: "../../tests/e2e/globalSetup.mjs",
  globalTeardown: "../../tests/e2e/globalTeardown.mjs",
  fullyParallel: true,
  workers: 2,
  timeout: process.env.OPEN3D_WORLD_GATE === "1" ? 180_000 : 60_000,
  retries: isCI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "../../results/playwright-report", open: "never" }],
    ["json", { outputFile: "../../results/audits/raw-playwright.json" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
    locale: visualManifest.determinism.locale,
    timezoneId: visualManifest.determinism.timezoneId,
    colorScheme: visualManifest.determinism.colorScheme,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: visualManifest.determinism.maxDiffPixelRatio,
      animations: "disabled",
      caret: "hide",
    },
  },
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  projects,
  webServer: userProvidedBaseURL
    ? undefined
    : {
        command:
          process.env.DEV_AUTH_BYPASS === "1"
            ? "pnpm run dev"
            : "pnpm run build && pnpm run start",
        url: baseURL,
        timeout: process.env.OPEN3D_WORLD_GATE === "1" ? 180_000 : 120_000,
        reuseExistingServer: !isCI && process.env.OPEN3D_WORLD_GATE !== "1",
        env: {
          PLAYWRIGHT_BASE_URL: baseURL,
          NEXT_PUBLIC_PLANNER_DEV_TOOLS: "true",
          ...(process.env.DEV_AUTH_BYPASS
            ? { DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS }
            : {}),
        },
      },
});

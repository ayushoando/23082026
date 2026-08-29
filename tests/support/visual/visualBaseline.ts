import fs from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

import type { RequiredUiState } from "../ui-states/uiStateMatrix";

export interface VisualBaselineIdentity {
  readonly surface: string;
  readonly state: RequiredUiState;
  readonly browser: "chromium" | "firefox" | "webkit";
  readonly viewport: "desktop" | "tablet" | "mobile";
}

interface VisualManifest {
  readonly baselineRoot: string;
  readonly browsers: readonly VisualBaselineIdentity["browser"][];
  readonly viewportTiers: Record<VisualBaselineIdentity["viewport"], { width: number; height: number }>;
  readonly requiredStates: readonly RequiredUiState[];
  readonly surfaces: readonly { id: string; route: string; root: string }[];
  readonly determinism: { maxDiffPixelRatio: number; waitForFonts: boolean };
}

function repositoryRoot(cwd = process.cwd()): string {
  return path.basename(cwd) === "site" ? path.resolve(cwd, "..") : cwd;
}

export function loadVisualBaselineManifest(cwd = process.cwd()): VisualManifest {
  const file = path.join(repositoryRoot(cwd), "tests", "manifests", "visual-baselines.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as VisualManifest;
}

export function visualBaselineName(identity: VisualBaselineIdentity): string {
  const manifest = loadVisualBaselineManifest();
  if (!manifest.surfaces.some((surface) => surface.id === identity.surface)) {
    throw new Error(`Unknown visual surface: ${identity.surface}`);
  }
  if (!manifest.requiredStates.includes(identity.state)) throw new Error(`Unknown visual state: ${identity.state}`);
  if (!manifest.browsers.includes(identity.browser)) throw new Error(`Unknown visual browser: ${identity.browser}`);
  if (!(identity.viewport in manifest.viewportTiers)) throw new Error(`Unknown visual viewport: ${identity.viewport}`);
  return `${identity.surface}--${identity.state}--${identity.browser}--${identity.viewport}.png`;
}

export async function stabilizeVisualPage(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addStyleTag({
    content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}",
  });
  await page.evaluate(async () => document.fonts.ready);
}

export async function expectReviewedVisualBaseline(
  page: Page,
  identity: VisualBaselineIdentity,
): Promise<void> {
  const manifest = loadVisualBaselineManifest();
  await stabilizeVisualPage(page);
  await expect(page).toHaveScreenshot(visualBaselineName(identity), {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: manifest.determinism.maxDiffPixelRatio,
  });
}

/**
 * Full-site visual audit — captures every page at mobile (390w) and desktop
 * (1920w) viewports, records overflow and console errors, and writes a
 * findings JSON for the report generator.
 *
 * Run (user-invoked only):
 *   pnpm run audit:visual
 *
 * Or directly:
 *   cross-env DEV_AUTH_BYPASS=1 pnpm exec playwright test \
 *     -c config/build/playwright.config.ts \
 *     tests/e2e/visual-audit-full-site.spec.ts
 */

import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { PAGE_MANIFEST, LINK_FOLLOW_PAGES } from "./visual-audit-pages";
import { prepareSiteUiCapture } from "./site-ui-helpers";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OUTPUT_ROOT = path.resolve(process.cwd(), "results", "screenshots", "visual-audit");

const VIEWPORTS = [
  { width: 390, height: 844, label: "mobile" },
  { width: 1920, height: 1080, label: "desktop" },
] as const;

type ViewportDef = (typeof VIEWPORTS)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditFinding {
  path: string;
  label: string;
  group: string;
  viewport: string;
  hasOverflow: boolean;
  consoleErrors: string[];
  consoleWarnings: string[];
  screenshotFile: string;
  timedOut: boolean;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Shared findings accumulator (written after all tests)
// ---------------------------------------------------------------------------

const allFindings: AuditFinding[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function shotDir(viewport: string, group: string): string {
  const dir = path.join(OUTPUT_ROOT, viewport, group);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function shotPath(viewport: string, group: string, index: number, label: string): string {
  const dir = shotDir(viewport, group);
  const nn = String(index).padStart(2, "0");
  return path.join(dir, `${nn}-${slugify(label)}.png`);
}

// ---------------------------------------------------------------------------
// Test generation
// ---------------------------------------------------------------------------

// Increase timeout per test — some pages may be slow under DEV_AUTH_BYPASS
test.setTimeout(45_000);

for (const vp of VIEWPORTS) {
  test.describe(`visual-audit — ${vp.label} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    // ── Static / known-slug pages ──────────────────────────────────────────
    PAGE_MANIFEST.forEach((entry, index) => {
      test(`[${entry.group}] ${entry.label}`, async ({ page }) => {
        await captureAndRecord(page, vp, entry.path, entry.label, entry.group, index, entry.waitFor);
      });
    });

    // ── Link-follow pages ──────────────────────────────────────────────────
    LINK_FOLLOW_PAGES.forEach((entry, idx) => {
      const index = PAGE_MANIFEST.length + idx;

      test(`[${entry.group}] ${entry.label} (link-follow)`, async ({ page }) => {
        // Step 1: navigate to the list page
        await page.goto(entry.listPath, { waitUntil: "domcontentloaded" });

        // Step 2: find the first matching link
        const link = page.locator(entry.linkSelector).first();
        let href: string | null = null;
        try {
          await link.waitFor({ state: "visible", timeout: 15_000 });
          href = await link.getAttribute("href");
        } catch {
          // No link found — record as timed out
          const outFile = shotPath(vp.label, entry.group, index, entry.label);
          allFindings.push({
            path: entry.listPath,
            label: entry.label,
            group: entry.group,
            viewport: vp.label,
            hasOverflow: false,
            consoleErrors: ["Link-follow failed: no matching link found"],
            consoleWarnings: [],
            screenshotFile: "",
            timedOut: true,
            timestamp: new Date().toISOString(),
          });
          // Still capture the list page as fallback
          fs.mkdirSync(path.dirname(outFile), { recursive: true });
          await page.screenshot({ fullPage: true, path: outFile });
          return;
        }

        if (!href) {
          allFindings.push({
            path: entry.listPath,
            label: entry.label,
            group: entry.group,
            viewport: vp.label,
            hasOverflow: false,
            consoleErrors: ["Link-follow failed: href attribute was null"],
            consoleWarnings: [],
            screenshotFile: "",
            timedOut: true,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Step 3: navigate and capture the detail page
        await captureAndRecord(page, vp, href, entry.label, entry.group, index, entry.waitFor);
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Write findings JSON after all tests complete
// ---------------------------------------------------------------------------

test.afterAll(async () => {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  const findingsPath = path.join(OUTPUT_ROOT, "findings.json");

  // Merge with any existing findings (from a previous viewport's worker)
  let existing: AuditFinding[] = [];
  if (fs.existsSync(findingsPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(findingsPath, "utf-8"));
    } catch {
      // Corrupted file; overwrite
    }
  }

  // Deduplicate by path+viewport+label
  const key = (f: AuditFinding) => `${f.path}|${f.viewport}|${f.label}`;
  const map = new Map<string, AuditFinding>();
  for (const f of existing) map.set(key(f), f);
  for (const f of allFindings) map.set(key(f), f);

  const merged = [...map.values()].sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    if (a.label !== b.label) return a.label.localeCompare(b.label);
    return a.viewport.localeCompare(b.viewport);
  });

  fs.writeFileSync(findingsPath, JSON.stringify(merged, null, 2));
});

// ---------------------------------------------------------------------------
// Core capture function
// ---------------------------------------------------------------------------

async function captureAndRecord(
  page: import("@playwright/test").Page,
  vp: ViewportDef,
  urlPath: string,
  label: string,
  group: string,
  index: number,
  waitForSelector?: string,
) {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  // Collect console messages
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
    if (msg.type() === "warning") consoleWarnings.push(msg.text());
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  // Navigate
  await page.goto(urlPath, { waitUntil: "domcontentloaded" });

  // Wait for content
  let timedOut = false;
  try {
    if (waitForSelector) {
      await page.locator(waitForSelector).first().waitFor({ state: "visible", timeout: 15_000 });
    } else {
      await page.getByRole("heading", { level: 1 }).first().waitFor({ state: "visible", timeout: 15_000 });
    }
  } catch {
    timedOut = true;
  }

  // Stabilize UI
  try {
    await prepareSiteUiCapture(page);
  } catch {
    // Non-fatal — some app pages may not have marketing layout
  }

  // Check horizontal overflow
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  // Capture screenshot
  const outFile = shotPath(vp.label, group, index, label);
  await page.screenshot({ fullPage: true, path: outFile });

  // Record finding
  const relativePath = path.relative(OUTPUT_ROOT, outFile).replace(/\\/g, "/");
  allFindings.push({
    path: urlPath,
    label,
    group,
    viewport: vp.label,
    hasOverflow,
    consoleErrors: consoleErrors.slice(0, 20), // cap at 20 per page
    consoleWarnings: consoleWarnings.slice(0, 20),
    screenshotFile: relativePath,
    timedOut,
    timestamp: new Date().toISOString(),
  });
}

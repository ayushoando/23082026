/**
 * DB1: canvas box / shell box at 390×844.
 * Planner + Studio, docks closed then one open.
 * Requires http://localhost:3000. Writes results/mobile-fixes/canvas-share.txt
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";
const PHONE = { width: 390, height: 844 };
const OUT = path.resolve("results/mobile-fixes/canvas-share.txt");

function ratio(canvas, shell) {
  if (!canvas || !shell || shell.height < 1) return null;
  return Math.round((canvas.height / shell.height) * 1000) / 1000;
}

async function box(page, testId) {
  const loc = page.getByTestId(testId);
  if (!(await loc.isVisible().catch(() => false))) return null;
  return loc.boundingBox();
}

async function measureStudio(page) {
  await page.setViewportSize(PHONE);
  await page.goto(`${BASE}/oostudio/`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("studio-workspace").waitFor({ timeout: 30_000 });
  const closed = ratio(
    await box(page, "canvas-stage"),
    await box(page, "studio-workspace"),
  );
  await page.getByTestId("dock-tab-color").click();
  await page.waitForTimeout(300);
  const open = ratio(
    await box(page, "canvas-stage"),
    await box(page, "studio-workspace"),
  );
  return { closed, open };
}

async function measurePlanner(page) {
  await page.setViewportSize(PHONE);
  await page.goto(`${BASE}/ooplanner/`, { waitUntil: "domcontentloaded" });
  const setup = page.getByRole("form", { name: /Project setup/i });
  if (await setup.isVisible().catch(() => false)) {
    const name = page.getByLabel(/name/i).first();
    if (await name.isVisible().catch(() => false)) {
      await name.fill("Canvas share measure");
    }
    const start = page.getByRole("button", { name: /start|create|continue/i }).first();
    if (await start.isVisible().catch(() => false)) await start.click();
  }
  const shellId = (await page.getByTestId("planner-mobile-shell").isVisible().catch(() => false))
    ? "planner-mobile-shell"
    : "planner-workspace";
  await page.getByTestId(shellId).waitFor({ timeout: 45_000 }).catch(() => null);
  const canvasId = (await page.getByTestId("planner-mobile-canvas").isVisible().catch(() => false))
    ? "planner-mobile-canvas"
    : "planner-canvas";
  const closed = ratio(await box(page, canvasId), await box(page, shellId));
  const inv = page.getByTestId("planner-toggle-inventory");
  if (await inv.isVisible().catch(() => false)) {
    await inv.click();
    await page.waitForTimeout(300);
  }
  const open = ratio(await box(page, canvasId), await box(page, shellId));
  return { closed, open, shellId, canvasId };
}

const browser = await chromium.launch();
const page = await browser.newPage();
const lines = [];
try {
  const studio = await measureStudio(page);
  const planner = await measurePlanner(page);
  const rows = [
    ["planner_closed", planner.closed],
    ["planner_one_open", planner.open],
    ["studio_closed", studio.closed],
    ["studio_one_open", studio.open],
  ];
  lines.push("DB1 canvas/shell height at 390x844");
  lines.push(`planner shell=${planner.shellId} canvas=${planner.canvasId}`);
  for (const [k, v] of rows) {
    const n = v === null || v === undefined ? "UNMEASURED" : String(v);
    const bar = v === null || v === undefined ? "FAIL" : v >= 0.6 ? "PASS" : "FAIL";
    lines.push(`${k}=${n} ${bar} (bar 0.60)`);
  }
} catch (err) {
  lines.push(`ERROR ${err instanceof Error ? err.message : String(err)}`);
} finally {
  await browser.close();
}
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${lines.join("\n")}\n`, "utf8");
console.log(lines.join("\n"));

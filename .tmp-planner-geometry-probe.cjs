const { chromium } = require("@playwright/test");

const inspectPlanner = () => {
  const stage = document.querySelector('[data-testid="canvas-stage"]');
  const canvasElement = document.querySelector('[data-testid="planner-canvas"]');
  const fabricCanvas = window.__plannerFabricView;
  if (!(stage instanceof HTMLElement) || !(canvasElement instanceof HTMLCanvasElement) || !fabricCanvas) {
    throw new Error("Planner canvas is unavailable.");
  }
  const sheet = fabricCanvas.getObjects().find((object) => object.data?.isSheet);
  if (!sheet) throw new Error("Planner sheet is unavailable.");
  const stageRect = stage.getBoundingClientRect();
  const canvasRect = canvasElement.getBoundingClientRect();
  const transform = fabricCanvas.viewportTransform;
  const sceneCenterX = (sheet.left ?? 0) + (sheet.width ?? 0) / 2;
  const sheetCenterX = canvasRect.left + sceneCenterX * transform[0] + transform[4];
  const overlayRect = document.querySelector(".canvas-overlay--planner")?.getBoundingClientRect();
  const root = document.documentElement;
  const body = document.body;
  return {
    viewport: { width: innerWidth, height: innerHeight },
    stage: { x: Math.round(stageRect.x), width: Math.round(stageRect.width), height: Math.round(stageRect.height) },
    sheetCenterX: Math.round(sheetCenterX),
    viewportCenterX: Math.round(innerWidth / 2),
    sheetCenterDelta: Math.round(sheetCenterX - innerWidth / 2),
    overlayCenterX: overlayRect ? Math.round(overlayRect.x + overlayRect.width / 2) : null,
    overlayCenterDelta: overlayRect ? Math.round(overlayRect.x + overlayRect.width / 2 - innerWidth / 2) : null,
    canvas: {
      cssWidth: Math.round(canvasRect.width),
      cssHeight: Math.round(canvasRect.height),
      bitmapWidth: canvasElement.width,
      bitmapHeight: canvasElement.height,
    },
    horizontalOverflow: root.scrollWidth > root.clientWidth || body.scrollWidth > body.clientWidth,
    viewportClass: document.querySelector('[data-testid="planner-workspace"]')?.getAttribute("data-viewport-class"),
    transform: transform.map((value) => Math.round(value * 1000) / 1000),
  };
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.goto("http://localhost:3000/ooplanner", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator('[data-testid="planner-canvas"]').waitFor({ state: "visible", timeout: 90_000 });
  await page.waitForTimeout(1_250);
  const initial = await page.evaluate(inspectPlanner);

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(900);
  const resized = await page.evaluate(inspectPlanner);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(900);
  const restored = await page.evaluate(inspectPlanner);

  const hydrationErrors = browserErrors.filter((message) => /hydration failed|didn't match/i.test(message));
  console.log(JSON.stringify({ hydrationErrors, snapshots: [initial, resized, restored] }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

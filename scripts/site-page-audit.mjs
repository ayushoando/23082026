import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractRouteRecords } from "../tech-docs-generator/scripts/extract-routes.mjs";

const BASE = process.env.AUDIT_BASE_URL?.trim() || "http://localhost:3000";
const OUT = path.resolve(readArg("--out", "results/site/page-audit"));
const ROUTE_RECORDS = extractRouteRecords({ repoRoot: process.cwd() });
const VIEWPORTS = [
  { key: "w1920", width: 1920, height: 1080, isMobile: false },
  { key: "w1440", width: 1440, height: 900, isMobile: false },
  { key: "w1078", width: 1078, height: 800, isMobile: false },
  { key: "w768", width: 768, height: 1024, isMobile: false },
  { key: "w390", width: 390, height: 844, isMobile: true },
];
const SCREENSHOT_TIMEOUT_MS = 20000;

function readArg(name, fallback = null) {
  const hit = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
}

function routeSlug(routePattern) {
  return (
    routePattern
      .replace(/\[([^\]]+)\]/g, "__$1__")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "root"
  );
}

async function discoverProductPath() {
  try {
    const response = await fetch(`${BASE}/api/products/filter?category=seating&limit=1`);
    if (!response.ok) return "/products/seating/sample-product/";
    const payload = await response.json();
    const item = payload?.products?.[0] ?? payload?.items?.[0];
    if (!item) return "/products/seating/sample-product/";
    const category = item.category ?? "seating";
    const slug = item.slug ?? item.id;
    return `/products/${category}/${slug}/`;
  } catch {
    return "/products/seating/sample-product/";
  }
}

async function discoverPlanId() {
  try {
    const response = await fetch(`${BASE}/api/admin/plans?limit=1`);
    if (!response.ok) return "demo-plan";
    const payload = await response.json();
    return payload?.plans?.[0]?.id ?? payload?.plans?.[0]?.planId ?? "demo-plan";
  } catch {
    return "demo-plan";
  }
}

async function buildRouteSamples() {
  const planId = await discoverPlanId();
  const productPath = await discoverProductPath();
  const samples = {
    "/admin/crm/projects/[id]": `/admin/crm/projects/${planId}/`,
    "/admin/plans/[id]": `/admin/plans/${planId}/`,
    "/ooplanner/projects/[id]": `/ooplanner/projects/${planId}/`,
    "/planner/features/[slug]": "/planner/features/measure/",
    "/portal/[id]": `/portal/${planId}/`,
    "/portal/guest/view/[id]": `/portal/guest/view/${planId}/`,
    "/products/[category]": "/products/seating/",
    "/products/[category]/[product]": productPath,
    "/products/category/[slug]": "/products/category/seating/",
    "/solutions/[category]": "/solutions/seating/",
  };
  return { planId, productPath, samples };
}

function concretePath(routePattern, samples) {
  return samples[routePattern] ?? routePattern;
}

function auditPage() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const documentWidth = document.documentElement.scrollWidth;
  const bodyWidth = document.body?.scrollWidth ?? documentWidth;
  const overflowPx = Math.max(documentWidth, bodyWidth) - viewportWidth;
  const pathName = window.location.pathname;
  const header =
    document.querySelector("header") ??
    document.querySelector('[role="banner"]') ??
    document.querySelector('[class*="site-header"]');
  const footer =
    document.querySelector("footer") ??
    document.querySelector('[role="contentinfo"]');
  const main = document.querySelector("main") ?? document.querySelector('[role="main"]');
  const h1s = [...document.querySelectorAll("h1")].filter(isVisible);
  const visibleText = (document.body?.innerText ?? "").replace(/\s+/g, " ").trim();
  const issues = [];

  if (overflowPx > 2) {
    let visibleOverflowElements = 0;
    for (const element of document.querySelectorAll("body *")) {
      if (!isVisible(element) || isDecorative(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.right > viewportWidth + 6 && rect.left < viewportWidth - 20) {
        visibleOverflowElements += 1;
      }
    }
    if (visibleOverflowElements > 0) {
      issues.push(`horizontal overflow +${overflowPx}px (${visibleOverflowElements} visible elements)`);
    }
  }

  const smallText = [];
  for (const element of document.querySelectorAll("main p, main span, main a, main button, main label, header a")) {
    if (!isVisible(element)) continue;
    const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
    if (fontSize > 0 && fontSize < 11) {
      smallText.push(`${fontSize}px:${(element.textContent ?? "").trim().slice(0, 48)}`);
    }
    if (smallText.length >= 3) break;
  }
  if (smallText.length > 0) issues.push(`text below 11px (${smallText.join(" | ")})`);

  const isAppShell = /^\/(ooplanner|oostudio|admin)(\/|$)/.test(pathName);
  const isSuiteShell = /^\/(dashboard|portal|choose-product)(\/|$)/.test(pathName);
  const isOfflineShell = pathName.startsWith("/offline");
  if (!isAppShell && !isSuiteShell && !isOfflineShell) {
    if (!header) issues.push("missing header/banner landmark");
    if (!footer) issues.push("missing footer/contentinfo landmark");
  }

  if (!main && !isAppShell && !isOfflineShell) issues.push("missing main landmark");
  if (!isAppShell && !isOfflineShell && visibleText.length < 40) {
    issues.push(`sparse visible content (${visibleText.length} characters)`);
  }
  if (isAppShell && visibleText.length < 20) {
    issues.push(`sparse app-shell content (${visibleText.length} characters)`);
  }

  const missingImageAlt = [...document.images].filter(
    (image) => isVisible(image) && !image.hasAttribute("alt"),
  ).length;
  if (missingImageAlt > 0) issues.push(`visible images missing alt (${missingImageAlt})`);

  const unnamedControls = [...document.querySelectorAll("a, button, input, select, textarea")].filter(
    (element) => isVisible(element) && !accessibleName(element),
  ).length;
  if (unnamedControls > 0) issues.push(`visible controls without accessible names (${unnamedControls})`);

  const smallInteractiveTargets = [...document.querySelectorAll("a, button, input, select, textarea")].filter(
    (element) => {
      if (!isVisible(element)) return false;
      const rect = element.getBoundingClientRect();
      return rect.width < 40 || rect.height < 40;
    },
  ).length;
  if (viewportWidth <= 768 && smallInteractiveTargets > 0) {
    issues.push(`small interactive targets under 40px (${smallInteractiveTargets})`);
  }

  const errorText = visibleText.slice(0, 1200);
  if (/application error|something went wrong|internal server error|unhandled runtime error/i.test(errorText)) {
    issues.push("error text visible");
  }

  return {
    path: pathName,
    title: document.title,
    visibleTextLength: visibleText.length,
    documentWidth,
    bodyWidth,
    overflowPx,
    hasHeader: Boolean(header),
    hasFooter: Boolean(footer),
    hasMain: Boolean(main),
    h1Count: h1s.length,
    h1Text: h1s[0]?.textContent?.trim()?.slice(0, 120) ?? null,
    imageCount: document.images.length,
    missingImageAlt,
    unnamedControls,
    smallInteractiveTargets,
    issues,
  };

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    return (
      rect.width >= 2 &&
      rect.height >= 2 &&
      styles.display !== "none" &&
      styles.visibility !== "hidden" &&
      styles.opacity !== "0"
    );
  }

  function isDecorative(element) {
    const className = typeof element.className === "string" ? element.className : "";
    return /marquee|carousel|track|sr-only|visually-hidden|hidden|scroll|overflow|gradient|glow|shadow|accent|decoration|orb|blob|noise|grain|pattern/i.test(
      className,
    );
  }

  function accessibleName(element) {
    const ariaLabel = element.getAttribute("aria-label")?.trim();
    const labelledBy = element.getAttribute("aria-labelledby");
    const labelledText = labelledBy
      ? labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ")
          .trim()
      : "";
    const text = (element.textContent ?? "").trim();
    const inputLabel = element.id
      ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent?.trim() ?? ""
      : "";
    return Boolean(ariaLabel || labelledText || text || inputLabel || element.getAttribute("title"));
  }
}

async function auditRoute(page, record, routeSamples, viewport, index, total) {
  const routePattern = record.path;
  const auditPath = concretePath(routePattern, routeSamples.samples);
  const slug = routeSlug(routePattern);
  const screenshotDirectory = path.join(OUT, viewport.key);
  const entry = {
    routePattern,
    auditPath,
    sourcePath: record.sourcePath,
    viewport: { key: viewport.key, width: viewport.width, height: viewport.height },
    status: null,
    finalPath: null,
    durationMs: null,
    issues: [],
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    screenshots: {
      fold: path.relative(process.cwd(), path.join(screenshotDirectory, `${slug}-fold.png`)),
      full: null,
    },
  };
  const startedAt = Date.now();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const httpErrors = [];
  const onConsole = (message) => {
    if (message.type() === "error" && consoleErrors.length < 20) {
      consoleErrors.push(message.text().slice(0, 300));
    }
  };
  const onPageError = (error) => {
    if (pageErrors.length < 20) pageErrors.push(String(error).slice(0, 300));
  };
  const onRequestFailed = (request) => {
    if (failedRequests.length < 20) {
      failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? "unknown" });
    }
  };
  const onResponse = (response) => {
    if (response.status() >= 400 && httpErrors.length < 20) {
      httpErrors.push({ status: response.status(), url: response.url(), resourceType: response.request().resourceType() });
    }
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);

  try {
    const response = await page.goto(`${BASE}${auditPath}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(700);
    entry.status = response?.status() ?? null;
    entry.finalPath = new URL(page.url()).pathname;
    entry.audit = await page.evaluate(auditPage);
    entry.issues = [...entry.audit.issues];
    if (entry.status !== null && entry.status >= 400) entry.issues.push(`document HTTP ${entry.status}`);
    if (consoleErrors.length > 0) entry.issues.push(`console errors (${consoleErrors.length})`);
    if (pageErrors.length > 0) entry.issues.push(`page errors (${pageErrors.length})`);
    if (httpErrors.some((error) => error.resourceType === "document")) entry.issues.push("document subrequest HTTP error");

    await mkdir(screenshotDirectory, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDirectory, `${slug}-fold.png`),
      fullPage: false,
      timeout: SCREENSHOT_TIMEOUT_MS,
    });
    if (entry.issues.length > 0) {
      entry.screenshots.full = path.relative(
        process.cwd(),
        path.join(screenshotDirectory, `${slug}-full.png`),
      );
      await page.screenshot({
        path: path.join(screenshotDirectory, `${slug}-full.png`),
        fullPage: true,
        timeout: SCREENSHOT_TIMEOUT_MS,
      });
    }
  } catch (error) {
    entry.error = String(error).slice(0, 500);
    entry.issues.push(error?.name === "TimeoutError" ? "audit step timed out" : "navigation failed");
  } finally {
    entry.consoleErrors = consoleErrors;
    entry.pageErrors = pageErrors;
    entry.failedRequests = failedRequests;
    entry.httpErrors = httpErrors;
    entry.durationMs = Date.now() - startedAt;
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
    page.off("response", onResponse);
  }

  process.stderr.write(
    `[${index}/${total}] ${viewport.key} ${routePattern} ${entry.issues.length ? "ISSUES" : "OK"}\n`,
  );
  return entry;
}

function summarize(results) {
  const issueCounts = {};
  const statusCounts = {};
  for (const result of results) {
    const status = result.status === null ? "no-response" : String(result.status);
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    for (const issue of result.issues) {
      const key = issue.replace(/\s*\(.*\)$/, "").replace(/\s+\+\d+px.*$/, "");
      issueCounts[key] = (issueCounts[key] ?? 0) + 1;
    }
  }
  const routeSummaries = ROUTE_RECORDS.map((record) => {
    const routeResults = results.filter((result) => result.routePattern === record.path);
    return {
      routePattern: record.path,
      sourcePath: record.sourcePath,
      viewportCount: routeResults.length,
      issueCount: routeResults.reduce((count, result) => count + result.issues.length, 0),
      failedViewportCount: routeResults.filter((result) => result.error || result.status === null).length,
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    routeCount: ROUTE_RECORDS.length,
    viewportCount: VIEWPORTS.length,
    checkCount: results.length,
    statusCounts,
    issueCounts,
    routesWithIssues: routeSummaries.filter((route) => route.issueCount > 0),
    fullyCleanRoutes: routeSummaries.filter((route) => route.issueCount === 0).length,
  };
}

await mkdir(OUT, { recursive: true });
const routeSamples = await buildRouteSamples();
await writeFile(
  path.join(OUT, "route-inventory.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      routeCount: ROUTE_RECORDS.length,
      dynamicSamples: routeSamples,
      routes: ROUTE_RECORDS.map((record) => ({
        routePattern: record.path,
        auditPath: concretePath(record.path, routeSamples.samples),
        sourcePath: record.sourcePath,
      })),
    },
    null,
    2,
  ),
);

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.isMobile ? 2 : 1,
      isMobile: viewport.isMobile,
      hasTouch: viewport.isMobile,
    });
    const concurrency = 4;
    for (let offset = 0; offset < ROUTE_RECORDS.length; offset += concurrency) {
      const batch = ROUTE_RECORDS.slice(offset, offset + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (record, batchIndex) => {
          const routePage = await context.newPage();
          try {
            return await auditRoute(
              routePage,
              record,
              routeSamples,
              viewport,
              offset + batchIndex + 1,
              ROUTE_RECORDS.length,
            );
          } finally {
            await routePage.close().catch(() => undefined);
          }
        }),
      );
      results.push(...batchResults);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const summary = summarize(results);
await writeFile(path.join(OUT, "audit-results.json"), JSON.stringify({ ...summary, results }, null, 2));
await writeFile(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
const summaryLines = [
  `generatedAt=${summary.generatedAt}`,
  `baseUrl=${summary.baseUrl}`,
  `routes=${summary.routeCount}`,
  `viewports=${summary.viewportCount}`,
  `checks=${summary.checkCount}`,
  `fullyCleanRoutes=${summary.fullyCleanRoutes}`,
  `routesWithIssues=${summary.routesWithIssues.length}`,
  "",
  "ISSUE COUNTS",
  ...Object.entries(summary.issueCounts).sort((left, right) => right[1] - left[1]).map(([issue, count]) => `${count} | ${issue}`),
  "",
  "ROUTES WITH ISSUES",
  ...summary.routesWithIssues.map((route) => `${route.routePattern} | ${route.issueCount} issues | ${route.failedViewportCount} failed viewports`),
];
await writeFile(path.join(OUT, "summary.txt"), `${summaryLines.join("\n")}\n`);
console.log(JSON.stringify(summary, null, 2));

import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createJiti } from "jiti";
import { extractRouteRecords } from "../tech-docs-generator/scripts/extract-routes.mjs";

const BASE = process.env.AUDIT_BASE_URL?.trim() || "http://localhost:3000";
// E1.8 — default output directory includes the base URL label so a localhost run
// can never again be stored as `production` (the 2026-08-26 run's actual baseUrl
// was localhost but its directory was named `page-audit-production-complete`).
const DEFAULT_OUT_DIR = `results/site/page-audit-${new URL(BASE).hostname.replace(/[.:]/g, "-")}`;
const OUT = path.resolve(readArg("--out", DEFAULT_OUT_DIR));
const ROUTE_RECORDS = extractRouteRecords({ repoRoot: process.cwd() });
const VIEWPORTS = [
  { key: "w1920", width: 1920, height: 1080, isMobile: false },
  { key: "w1440", width: 1440, height: 900, isMobile: false },
  { key: "w1078", width: 1078, height: 800, isMobile: false },
  { key: "w768", width: 768, height: 1024, isMobile: false },
  { key: "w390", width: 390, height: 844, isMobile: true },
];
const SCREENSHOT_TIMEOUT_MS = 20000;

// --- Session (E1.1) ---------------------------------------------------
// Two independent ways to run this audit against guarded routes (/admin,
// /access, /dashboard, /portal, /ooplanner, /oostudio):
//   1. AUDIT_STORAGE_STATE=<path to a Playwright storageState.json> — a real
//      signed-in session (admin or member), captured once via a login flow
//      and reused across every context this script opens.
//   2. AUDIT_ASSUME_BYPASS=1 — the target server was itself started with
//      DEV_AUTH_BYPASS=1 (a *server* env var — see site/lib/auth/devAuthBypass.ts).
//      No browser-side session is needed in that case; this flag only labels
//      the resulting artifact so a bypass-derived run is never mistaken for a
//      real-auth run.
// Neither flag set → the audit runs unauthenticated, exactly as before, and
// the artifact is labelled `authMode: "none"`. That was the 2026-08-26 run's
// actual mode, though its output directory implied otherwise.
const STORAGE_STATE_PATH = process.env.AUDIT_STORAGE_STATE?.trim() || null;
const ASSUME_BYPASS = process.env.AUDIT_ASSUME_BYPASS?.trim() === "1";
const AUTH_MODE = STORAGE_STATE_PATH ? "storageState" : ASSUME_BYPASS ? "dev-bypass" : "none";

// routeChromeRules.ts has no imports of its own, so it is safe to load
// standalone with jiti rather than duplicating its prefix logic here (that
// duplication is exactly how the previous footer heuristic drifted — see
// E1.4 in plans/ref/remediation-unified/tasks.md).
const jiti = createJiti(import.meta.url, { interopDefault: true });
const { resolveRouteChromeMode } = jiti("../site/features/site/data/routeChromeRules.ts");

// Routes whose own page is inherently a redirect, independent of auth. These
// never contribute chrome/content findings under their own route pattern —
// the destination route (audited separately, under its own pattern) owns
// those findings.
const KNOWN_REDIRECT_ONLY_ROUTES = new Set([
  "/login",
  "/products/category/[slug]",
  "/portal/guest/view/[id]",
]);

// Any final path matching one of these is an auth boundary, not the
// requested page. A redirect here means the row is unmeasured, not that the
// requested route failed its own checks (E1.2).
const AUTH_BOUNDARY_FINAL_PATHS = [/^\/access\/?$/, /^\/login\/?$/];

function readArg(name, fallback = null) {
  const hit = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
}

function normalizePath(pathname) {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

/**
 * Classify what was actually measured (E1.2). Compares the requested audit
 * path against where the browser ended up after navigation + redirects.
 */
function classifyOutcome(routePattern, auditPath, finalPath) {
  const requested = normalizePath(auditPath);
  const landed = normalizePath(finalPath);
  if (requested === landed) return "measured";
  if (KNOWN_REDIRECT_ONLY_ROUTES.has(routePattern)) return "redirect-only";
  if (AUTH_BOUNDARY_FINAL_PATHS.some((re) => re.test(landed))) return "unmeasured";
  return "redirect-only";
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

/**
 * Runs in the browser. `chromeMode` is `resolveRouteChromeMode(auditPath)`,
 * computed in Node from the *requested* route (E1.4) and passed in via
 * `page.evaluate(auditPage, chromeMode)` — this file must stay serializable,
 * so it cannot import routeChromeRules.ts directly; the caller does that.
 */
function auditPage(chromeMode) {
  const viewportWidth = window.innerWidth;
  const _viewportHeight = window.innerHeight;
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
  const loginToolsFooter = document.querySelector('[data-login-tools-footer], [class*="login-tools"]');
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

  // E1.7 — uncapped. The prior 3-sample cap made "16" a floor, not a total.
  const smallText = [];
  for (const element of document.querySelectorAll("main p, main span, main a, main button, main label, header a")) {
    if (!isVisible(element)) continue;
    const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
    if (fontSize > 0 && fontSize < 11) {
      smallText.push({
        selector: describeElement(element),
        fontSizePx: fontSize,
        text: (element.textContent ?? "").trim().slice(0, 48),
      });
    }
  }
  if (smallText.length > 0) {
    issues.push(
      `text below 11px (${smallText.length}) (${smallText
        .slice(0, 3)
        .map((t) => `${t.fontSizePx}px:${t.text}`)
        .join(" | ")}${smallText.length > 3 ? " | …" : ""})`,
    );
  }

  // E1.4 — footer/header expectation comes from the requested route's own
  // chrome contract (site/features/site/data/routeChromeRules.ts), not from
  // a duplicated prefix list evaluated against wherever the browser landed.
  if (chromeMode?.header === "full" && !header) {
    issues.push("missing header/banner landmark");
  }
  if (chromeMode?.footer === "full" && !footer) {
    issues.push("missing footer/contentinfo landmark");
  }
  if (chromeMode?.footer === "login-tools" && !footer && !loginToolsFooter) {
    issues.push("missing login-tools footer variant");
  }
  // footer: "hidden" (app/workspace shells) → no assertion at all.

  const isAppShell = /^\/(ooplanner|oostudio|admin)(\/|$)/.test(pathName);
  const isOfflineShell = pathName.startsWith("/offline");
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

  // E1.5/E1.6 — split into a WCAG 2.2 SC 2.5.8 floor (24x24, both axes,
  // inline-text-link exempt) and a separate 40px touch advisory. Neither
  // bucket is "the repository's 40px contract" — see
  // docs/architecture/css.md#interactive-target-contract.
  const targetFloorFailures = [];
  const targetAdvisory = [];
  for (const element of document.querySelectorAll("a, button, input, select, textarea")) {
    if (!isVisible(element)) continue;
    if (isExemptInlineLink(element)) continue;
    const rect = element.getBoundingClientRect();
    const failsFloor = rect.width < 24 && rect.height < 24;
    const failsAdvisory = !failsFloor && (rect.width < 40 || rect.height < 40);
    const record = {
      selector: describeElement(element),
      widthPx: Math.round(rect.width * 10) / 10,
      heightPx: Math.round(rect.height * 10) / 10,
      failingAxis: rect.width < rect.height ? "width" : "height",
    };
    if (failsFloor) targetFloorFailures.push(record);
    else if (failsAdvisory) targetAdvisory.push(record);
  }
  if (targetFloorFailures.length > 0) {
    issues.push(`interactive targets below 24px floor (${targetFloorFailures.length})`);
  }
  if (viewportWidth <= 768 && targetAdvisory.length > 0) {
    issues.push(`interactive targets below 40px advisory (${targetAdvisory.length})`);
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
    smallText,
    targetFloorFailures,
    targetAdvisory,
    smallInteractiveTargets: targetFloorFailures.length + targetAdvisory.length,
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

  /**
   * WCAG 2.2 SC 2.5.8 exemption: an inline text link within a sentence or
   * block of text. Genuine inline anchors default to `display: inline`
   * unless CSS deliberately turns them into a button-like control — that is
   * the same signal the exemption relies on.
   */
  function isExemptInlineLink(element) {
    if (element.tagName !== "A") return false;
    return getComputedStyle(element).display === "inline";
  }

  function describeElement(element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const firstClass =
      typeof element.className === "string" && element.className.trim()
        ? `.${element.className.trim().split(/\s+/)[0]}`
        : "";
    return `${tag}${id}${firstClass}`;
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
  const chromeMode = resolveRouteChromeMode(auditPath);
  const entry = {
    routePattern,
    auditPath,
    sourcePath: record.sourcePath,
    viewport: { key: viewport.key, width: viewport.width, height: viewport.height },
    chromeMode,
    status: null,
    finalPath: null,
    outcome: null,
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
    entry.outcome = classifyOutcome(routePattern, auditPath, entry.finalPath);
    entry.audit = await page.evaluate(auditPage, chromeMode);
    // E1.2 — a row that landed across an auth boundary measures the sign-in
    // page, not the requested route. Its DOM findings are not attributable
    // to the requested route pattern; keep them for inspection but do not
    // let them silently count as findings for that route (E1.3 aggregates
    // by `outcome`, not just by `routePattern`).
    entry.issues = entry.outcome === "unmeasured" ? [] : [...entry.audit.issues];
    entry.rawIssues = [...entry.audit.issues];
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
  const outcomeCounts = { measured: 0, "redirect-only": 0, unmeasured: 0 };
  for (const result of results) {
    const status = result.status === null ? "no-response" : String(result.status);
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    outcomeCounts[result.outcome ?? "measured"] = (outcomeCounts[result.outcome ?? "measured"] ?? 0) + 1;
    for (const issue of result.issues) {
      const key = issue.replace(/\s*\(.*\)$/, "").replace(/\s+\+\d+px.*$/, "");
      issueCounts[key] = (issueCounts[key] ?? 0) + 1;
    }
  }
  // E1.3 — a route pattern is "measured" only if at least one of its five
  // viewport checks actually rendered the requested page rather than
  // crossing an auth boundary. routeCount alone (previously the only number
  // reported) does not distinguish "we checked this route" from "we checked
  // whatever it redirected to."
  const routeSummaries = ROUTE_RECORDS.map((record) => {
    const routeResults = results.filter((result) => result.routePattern === record.path);
    const measuredResults = routeResults.filter((result) => result.outcome === "measured");
    const unmeasuredResults = routeResults.filter((result) => result.outcome === "unmeasured");
    return {
      routePattern: record.path,
      sourcePath: record.sourcePath,
      viewportCount: routeResults.length,
      measuredViewportCount: measuredResults.length,
      unmeasuredViewportCount: unmeasuredResults.length,
      issueCount: routeResults.reduce((count, result) => count + result.issues.length, 0),
      failedViewportCount: routeResults.filter((result) => result.error || result.status === null).length,
      coverage:
        measuredResults.length === routeResults.length
          ? "measured"
          : measuredResults.length === 0
            ? "unmeasured"
            : "partially-measured",
    };
  });
  const measuredRoutePatterns = routeSummaries.filter((route) => route.coverage === "measured");
  const unmeasuredRoutePatterns = routeSummaries.filter((route) => route.coverage !== "measured");
  return {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    authMode: AUTH_MODE,
    routeCount: ROUTE_RECORDS.length,
    viewportCount: VIEWPORTS.length,
    checkCount: results.length,
    // E1.3 — the headline coverage numbers. requestedRoutes is what the
    // route inventory contains; measuredRoutes is what this run actually
    // rendered under its own path at every viewport.
    requestedRoutes: ROUTE_RECORDS.length,
    measuredRoutes: measuredRoutePatterns.length,
    unmeasuredRoutes: unmeasuredRoutePatterns.length,
    unmeasuredRoutePatterns: unmeasuredRoutePatterns.map((route) => route.routePattern),
    outcomeCounts,
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

// E1.1 — load the session once. storageState() accepts either an object or a
// path; reading it here lets us fail fast with a clear message rather than
// having Playwright silently start unauthenticated per context.
let storageState;
if (STORAGE_STATE_PATH) {
  try {
    storageState = JSON.parse(await readFile(STORAGE_STATE_PATH, "utf8"));
  } catch (error) {
    throw new Error(
      `AUDIT_STORAGE_STATE=${STORAGE_STATE_PATH} could not be read: ${error?.message ?? error}. ` +
        "Capture one via a real sign-in (see tests/e2e/audit-3b-supabase-member.spec.ts's " +
        "signInAsMember for the flow) and pass its storageState.json path.",
    );
  }
}
if (AUTH_MODE === "none") {
  process.stderr.write(
    "[site-page-audit] running WITHOUT a session (AUTH_MODE=none). Guarded routes " +
      "(/admin, /access, /dashboard, /portal, /ooplanner, /oostudio) will redirect to " +
      "sign-in and those checks will be marked outcome=unmeasured, not counted as findings.\n",
  );
}

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.isMobile ? 2 : 1,
      isMobile: viewport.isMobile,
      hasTouch: viewport.isMobile,
      storageState,
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
  `authMode=${summary.authMode}`,
  `routes=${summary.routeCount}`,
  `viewports=${summary.viewportCount}`,
  `checks=${summary.checkCount}`,
  `fullyCleanRoutes=${summary.fullyCleanRoutes}`,
  `routesWithIssues=${summary.routesWithIssues.length}`,
  "",
  "COVERAGE (E1.3 — measured vs requested)",
  `requestedRoutes=${summary.requestedRoutes}`,
  `measuredRoutes=${summary.measuredRoutes}`,
  `unmeasuredRoutes=${summary.unmeasuredRoutes}`,
  `outcomeCounts=${JSON.stringify(summary.outcomeCounts)}`,
  ...(summary.unmeasuredRoutePatterns.length > 0
    ? ["unmeasuredRoutePatterns:", ...summary.unmeasuredRoutePatterns.map((p) => `  ${p}`)]
    : []),
  "",
  "ISSUE COUNTS",
  ...Object.entries(summary.issueCounts).sort((left, right) => right[1] - left[1]).map(([issue, count]) => `${count} | ${issue}`),
  "",
  "ROUTES WITH ISSUES",
  ...summary.routesWithIssues.map((route) => `${route.routePattern} | ${route.issueCount} issues | ${route.coverage} | ${route.failedViewportCount} failed viewports`),
];
await writeFile(path.join(OUT, "summary.txt"), `${summaryLines.join("\n")}\n`);
console.log(JSON.stringify(summary, null, 2));

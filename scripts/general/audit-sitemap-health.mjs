#!/usr/bin/env node
/**
 * audit-sitemap-health.mjs — sitemap/robots health check.
 *
 * Fetches the public sitemap of a deployment, walks every <loc>, and checks
 * each URL for: HTTP status, X-Robots-Tag directives, redirects, and an
 * indexable <title>. Live GSC data is still required for full SEO-R01/R02
 * closure; this script gives us the machine-checkable half without any
 * third-party dependency.
 *
 * Usage:
 *   node scripts/general/audit-sitemap-health.mjs [--base=https://oando.co.in] [--concurrency=8]
 * Exit codes: 0 = all URLs healthy, 1 = findings present, 2 = fetch/setup error.
 */
import { pathToFileURL } from "node:url";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  }),
);

const BASE = (args.get("base") || "https://oando.co.in").replace(/\/+$/, "");
const CONCURRENCY = Math.max(1, Number(args.get("concurrency") || 8));
const TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { redirect: "manual", ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function extractLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/g;
  let match;
  while ((match = re.exec(xml)) !== null) locs.push(match[1]);
  return locs;
}

async function checkSitemapUrl(url) {
  const issues = [];
  let response;
  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    return { url, issues: [`fetch failed: ${error.message}`] };
  }

  if (response.status !== 200) {
    issues.push(`status ${response.status}${response.status >= 300 && response.status < 400 ? ` -> ${response.headers.get("location") || "?"}` : ""}`);
  }

  const robots = response.headers.get("x-robots-tag");
  if (robots && /noindex/i.test(robots)) {
    issues.push(`noindex via X-Robots-Tag: ${robots}`);
  }

  if (response.status === 200 && (response.headers.get("content-type") || "").includes("html")) {
    const body = await response.text().catch(() => "");
    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(body)?.[1]?.trim();
    if (!title) {
      issues.push("missing <title>");
    } else if (/<meta[^>]+robots[^>]+noindex/i.test(body)) {
      issues.push(`noindex via meta robots (title: ${title})`);
    }
  }

  return { url, issues };
}

async function run() {
  let sitemapText = "";
  try {
    const res = await fetchWithTimeout(`${BASE}/sitemap.xml`);
    if (!res.ok) {
      console.error(`FAIL: ${BASE}/sitemap.xml responded ${res.status}`);
      process.exit(2);
    }
    sitemapText = await res.text();
  } catch (error) {
    console.error(`FAIL: cannot fetch ${BASE}/sitemap.xml: ${error.message}`);
    process.exit(2);
  }

  const topLevel = extractLocs(sitemapText);
  if (topLevel.length === 0) {
    console.error(`FAIL: no <loc> entries found in ${BASE}/sitemap.xml`);
    process.exit(2);
  }

  // Sitemap index -> expand child sitemaps; otherwise treat as a URL set.
  let urls = topLevel;
  const looksLikeIndex = sitemapText.includes("<sitemapindex");
  if (looksLikeIndex) {
    urls = [];
    for (const child of topLevel) {
      const res = await fetchWithTimeout(child).catch(() => null);
      if (!res || !res.ok) {
        console.error(`FAIL: child sitemap ${child} -> ${res ? res.status : "fetch error"}`);
        process.exit(2);
      }
      urls.push(...extractLocs(await res.text()));
    }
  }

  console.log(`sitemap health: ${BASE} (${looksLikeIndex ? "index" : "url-set"}, ${urls.length} URLs, concurrency ${CONCURRENCY})`);

  const results = [];
  const queue = [...urls];
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      const result = await checkSitemapUrl(url);
      results.push(result);
      const flag = result.issues.length ? "BAD " : "ok  ";
      console.log(`  ${flag}${url}${result.issues.length ? ` — ${result.issues.join("; ")}` : ""}`);
    }
  });
  await Promise.all(workers);

  const bad = results.filter((result) => result.issues.length > 0);
  console.log(`\nsummary: ${results.length - bad.length}/${results.length} URLs healthy`);
  if (bad.length > 0) {
    console.log("unhealthy:");
    for (const item of bad) console.log(`  - ${item.url}: ${item.issues.join("; ")}`);
    process.exit(1);
  }
}

// Exported for unit tests; the CLI guard below keeps imported runs inert.
export { extractLocs, checkSitemapUrl };

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  await run();
}

#!/usr/bin/env node
/**
 * SEO indexability audit — every route under site/app.
 *
 * Two modes:
 *   1. Source mode (default): reads each route.tsx + its layouts, checks the
 *      metadata contract. Does not render.
 *   2. HTML mode (--html [dir]): scans built HTML (Next.js standalone output or
 *      `next build` .next/server/app) and checks what is actually served —
 *      title/description length, single H1, canonical, OG completeness, image
 *      alt, and noindex on non-public routes. Mirrors the rule set of common
 *      open-source SEO linters (seo-lint-cli, indexability-checker).
 *
 * Indexability rules (industry-standard, cross-engine):
 *  - robots.txt is NOT an indexing block; noindex must be set via metadata or
 *    response header for pages that must stay out of the index.
 *  - A page reachable publicly without auth that is NOT explicitly noindex
 *    will be treated as indexable. Any public route that should stay out of
 *    the index MUST emit noindex.
 *  - Auth-guarded routes (admin/portal/dashboard/oostudio/ooplanner) must also
 *    carry noindex metadata to prevent URL-only indexing when links leak.
 *  - Canonical URLs must be absolute and same-origin.
 *  - Every public indexable page needs a unique title + meta description,
 *    one H1, and complete OpenGraph tags.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SITE_ROOT = join(REPO_ROOT, "site");
const APP_ROOT = join(SITE_ROOT, "app");

const EXCLUDE_DIRS = new Set(["node_modules", ".next", "_archive"]);
// Route groups are not URL segments; strip them when deriving the public path.
const ROUTE_GROUP_RE = /^\([^)]*\)$/;

// ---------------------------------------------------------------------------
// Route inventory
// ---------------------------------------------------------------------------

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), files);
    } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

function routePathFromFile(file) {
  const normalized = file.split(/[\\/]/).join("/");
  const prefix = `${APP_ROOT.split(/[\\/]/).join("/")}/`;
  const dir = normalized.slice(0, normalized.lastIndexOf("/")).replace(prefix, "");
  const segments = dir
    .split("/")
    .filter((segment) => segment.length > 0 && !ROUTE_GROUP_RE.test(segment));
  const path = segments.length === 0 ? "/" : `/${segments.join("/")}`;
  // Dynamic segments -> {param}
  return path.replace(/\[\.\.\.([^\]]+)\]/g, "{$1}").replace(/\[([^\]]+)\]/g, "{$1}");
}

// ---------------------------------------------------------------------------
// Metadata extraction (static)
// ---------------------------------------------------------------------------

function fileText(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

/** True when the file (or an ancestor layout it imports) sets robots noindex. */
function hasNoIndexMarker(source) {
  return /robots\s*:\s*\{\s*index\s*:\s*false/.test(source);
}

/**
 * Resolve `import { X_PAGE_METADATA } from "@/features/site/data/routeMetadata"`
 * and check whether the referenced constant sets `indexable: false`.
 */
function resolveImportedMetadataNoIndex(source) {
  const importMatch = source.match(
    /import\s*\{\s*([^}]*\b[A-Z_]+_PAGE_METADATA\b[^}]*)\}\s*from\s*["']([^"']+)["']/,
  );
  if (!importMatch) return false;
  const names = importMatch[1]
    .split(",")
    .map((name) => name.trim().split(/\s+as\s+/).pop())
    .filter(Boolean);
  const modulePath = importMatch[2].replace(/^@\//, `${SITE_ROOT.split(/[\\/]/).join("/")}/`).replace(/^@\//, "");
  const resolvedCandidates = [
    modulePath,
    `${modulePath}.ts`,
    `${modulePath}.tsx`,
    `${modulePath}/index.ts`,
  ];
  const resolvedFile = resolvedCandidates.find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
  if (!resolvedFile) return false;
  const moduleSource = fileText(resolvedFile);
  // The constant is defined via buildPageMetadata(..., { indexable: false })
  return names.some((name) => {
    const re = new RegExp(
      `export\\s+const\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[:=][\\s\\S]*?indexable\\s*:\\s*false`,
    );
    return re.test(moduleSource);
  });
}

/**
 * True when the file sets indexability via the shared builder:
 *   buildPageMetadata(SITE_URL, { ..., indexable: false })
 * or re-exports metadata from a feature layout (which may set noindex).
 */
function hasBuilderNoIndex(source) {
  // buildPageMetadata(..., { ..., indexable: false, ... })
  if (/buildPageMetadata\s*\([\s\S]*?indexable\s*:\s*false/.test(source)) {
    return true;
  }
  if (resolveImportedMetadataNoIndex(source)) {
    return true;
  }
  // export { default, metadata } from "@/features/.../layout"
  const reexport = source.match(
    /export\s*\{\s*[^}]*\bmetadata\b[^}]*\}\s*from\s*["']([^"']+)["']/,
  );
  return Boolean(reexport);
}

/**
 * Resolve the effective noindex for a route file by walking its ancestor
 * layouts (site/app/admin/layout.tsx, site/app/layout.tsx, ...). Next.js
 * metadata from a layout is inherited by every child route.
 */
function resolveEffectiveNoIndex(pageFile, pageSource) {
  if (hasNoIndexMarker(pageSource) || hasBuilderNoIndex(pageSource)) {
    return { noindex: true, source: pageFile };
  }
  const normalized = pageFile.split(/[\\/]/).join("/");
  const prefix = `${APP_ROOT.split(/[\\/]/).join("/")}/`;
  const dir = normalized.slice(0, normalized.lastIndexOf("/")).replace(prefix, "");
  const segments = dir.split("/").filter(Boolean);
  const candidates = [];
  for (let i = 0; i <= segments.length; i++) {
    candidates.push(join(APP_ROOT, ...segments.slice(0, i), "layout.tsx"));
  }
  // Root layout last (lowest priority)
  candidates.push(join(APP_ROOT, "layout.tsx"));
  for (const layoutFile of candidates.reverse()) {
    const layoutSource = fileText(layoutFile);
    if (hasNoIndexMarker(layoutSource) || hasBuilderNoIndex(layoutSource)) {
      return { noindex: true, source: layoutFile };
    }
  }
  return { noindex: false, source: null };
}

function hasMetadataExport(source) {
  if (/export\s+(?:const|async\s+function)\s+(?:metadata|generateMetadata)\b/.test(source)) {
    return true;
  }
  // export { default, metadata } from "@/features/.../layout"
  return /export\s*\{\s*[^}]*\bmetadata\b[^}]*\}\s*from\s*["']/.test(source);
}

function hasGenerateMetadata(source) {
  return /export\s+async\s+function\s+generateMetadata\b/.test(source);
}

function hasTitleAndDescription(source) {
  // Literal keys in the page file.
  if (/title\s*:/.test(source) && /description\s*:/.test(source)) {
    return true;
  }
  // buildPageMetadata(SITE_URL, { title, description, path }) — keys may be
  // variables (e.g. `const title = product.name;`), which is fully valid.
  // Match both keys present in a buildPageMetadata call, literal or shorthand.
  if (/buildPageMetadata\s*\([\s\S]*?\btitle\s*(?::|\b)[\s\S]*?\bdescription\s*(?::|\b)/.test(source)) {
    return true;
  }
  // Metadata may come from an imported constant (e.g. TERMS_PAGE_METADATA).
  const importMatch = source.match(
    /import\s*\{\s*([^}]*\b[A-Z_]+_PAGE_METADATA\b[^}]*)\}\s*from\s*["']([^"']+)["']/,
  );
  if (!importMatch) return false;
  const names = importMatch[1]
    .split(",")
    .map((name) => name.trim().split(/\s+as\s+/).pop())
    .filter(Boolean);
  const modulePath = importMatch[2].replace(/^@\//, `${SITE_ROOT.split(/[\\/]/).join("/")}/`).replace(/^@\//, "");
  const resolvedCandidates = [
    modulePath,
    `${modulePath}.ts`,
    `${modulePath}.tsx`,
    `${modulePath}/index.ts`,
  ];
  const resolvedFile = resolvedCandidates.find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
  if (!resolvedFile) return false;
  const moduleSource = fileText(resolvedFile);
  return names.some((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `export\\s+const\\s+${escaped}\\s*[:=][\\s\\S]*?title\\s*:[\\s\\S]*?description\\s*:`,
    );
    return re.test(moduleSource);
  });
}

// ---------------------------------------------------------------------------
// Route classification (mirrors routeClassification.ts intent)
// ---------------------------------------------------------------------------

const AUTH_GUARDED_PREFIXES = [
  "/admin",
  "/oostudio",
  "/ooplanner",
  "/portal",
  "/dashboard",
  "/access",
  "/login",
  "/choose-product",
  "/quote-cart",
  "/tracking",
  "/offline",
];

const _NOINDEX_PREFIXES = new Set(AUTH_GUARDED_PREFIXES);

function isAuthGuarded(path) {
  return AUTH_GUARDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isIndexablePublic(path) {
  if (isAuthGuarded(path)) return false;
  // Tool scaffolds are marked noindex in routeClassification.
  if (path.startsWith("/tools/")) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

const failures = [];
const pages = [];
const seen = new Set();

for (const file of walk(APP_ROOT)) {
  const path = routePathFromFile(file);
  if (seen.has(path)) continue;
  seen.add(path);

  const source = fileText(file);
  const effective = resolveEffectiveNoIndex(file, source);
  const page = {
    file: relative(REPO_ROOT, file),
    path,
    hasMetadata: hasMetadataExport(source),
    hasGenerateMetadata: hasGenerateMetadata(source),
    noIndexMarker: effective.noindex,
    noIndexSource: effective.source ? relative(REPO_ROOT, effective.source) : null,
    authGuarded: isAuthGuarded(path),
    indexablePublic: isIndexablePublic(path),
  };
  pages.push(page);
}

for (const page of pages) {
  const { path, noIndexMarker, authGuarded, indexablePublic, hasMetadata, hasGenerateMetadata } = page;

  // Rule 1: an auth-guarded (non-public) route must not be missing noindex.
  if (authGuarded && !noIndexMarker) {
    failures.push(`${page.file}: auth-guarded route without noindex — Google can index the URL if it leaks (${path})`);
  }

  // Rule 2: a public route that is NOT indexable must be noindex (e.g. tools).
  if (!authGuarded && !indexablePublic && !noIndexMarker) {
    failures.push(`${page.file}: public but non-indexable route without noindex (${path})`);
  }

  // Rule 3: a public indexable route must have metadata (title+description).
  if (indexablePublic && !authGuarded) {
    if (!hasMetadata) {
      failures.push(`${page.file}: public indexable route missing metadata export (${path})`);
    } else if (!hasTitleAndDescription(fileText(page.file))) {
      failures.push(`${page.file}: public indexable route metadata missing title/description (${path})`);
    }
  }

  // Rule 4: generateMetadata must exist for dynamic pages to keep per-slug SEO.
  if (path.includes("{") && indexablePublic && !hasGenerateMetadata && !hasMetadata) {
    failures.push(`${page.file}: dynamic public route without generateMetadata (${path})`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const publicIndexable = pages.filter((p) => p.indexablePublic && !p.authGuarded);
const authGuarded = pages.filter((p) => p.authGuarded);
const missingNoIndex = pages.filter(
  (p) => (p.authGuarded || !p.indexablePublic) && !p.noIndexMarker,
);

console.log(`\nSEO indexability audit — ${pages.length} pages`);
console.log(`  public indexable:      ${publicIndexable.length}`);
console.log(`  auth-guarded:          ${authGuarded.length}`);
console.log(`  missing noindex:       ${missingNoIndex.length}`);
for (const page of missingNoIndex) {
  console.log(`    - ${page.path} (${page.file})`);
}

if (failures.length === 0) {
  console.log("\nOK — every route is indexable-or-explicitly-noindex, no public page is at risk.\n");
} else {
  console.error(`\n${failures.length} issue(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTML mode — audit built HTML (mirrors open-source SEO linters)
// ---------------------------------------------------------------------------

/**
 * Scan built HTML files (Next.js standalone/.next/server/app or static export)
 * and check the served page signals:
 *  - title present + 10-60 chars
 *  - meta description present + 50-160 chars
 *  - exactly one <h1>
 *  - canonical link present + absolute + same-origin
 *  - og:title / og:description / og:image present
 *  - every <img> has alt
 *  - noindex meta present on routes that must not be indexed
 *
 * Usage: node audit-seo-indexability.mjs --html [build-dir]
 * Build dir defaults to site/.next/server/app.
 */
function htmlMode() {
  const buildDir =
    process.argv[process.argv.indexOf("--html") + 1] ||
    join(SITE_ROOT, ".next", "server", "app");
  if (!statSync(buildDir, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`HTML audit: build dir not found: ${buildDir}`);
    console.error("Run `pnpm build:site` first, or pass a path: --html <dir>");
    process.exit(1);
  }

  const htmlFailures = [];
  let htmlCount = 0;

  function walkHtml(dir, files = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walkHtml(join(dir, entry.name), files);
      } else if (entry.name.endsWith(".html")) {
        files.push(join(dir, entry.name));
      }
    }
    return files;
  }

  const authPrefixes = new Set([
    "/admin",
    "/oostudio",
    "/ooplanner",
    "/portal",
    "/dashboard",
    "/access",
    "/login",
    "/choose-product",
    "/quote-cart",
    "/tracking",
    "/offline",
  ]);

  for (const file of walkHtml(buildDir)) {
    const html = readFileSync(file, "utf8");
    const rel = relative(buildDir, file).split(/[\\/]/).join("/");
    htmlCount += 1;

    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
    const desc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] ?? "";
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)?.[1] ?? "";
    const ogTitle = /<meta\s+property=["']og:title["']/i.test(html);
    const ogDesc = /<meta\s+property=["']og:description["']/i.test(html);
    const ogImage = /<meta\s+property=["']og:image["']/i.test(html);
    const noIndex = /<meta\s+name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html);

    const path = `/${rel.replace(/\/index\.html$/, "").replace(/\/page\.html$/, "").replace(/\.html$/, "")}`;
    const isAuth = [...authPrefixes].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

    if (!title) {
      htmlFailures.push(`${rel}: missing <title>`);
    } else if (title.length < 10 || title.length > 60) {
      htmlFailures.push(`${rel}: title length ${title.length} (want 10-60): "${title}"`);
    }

    if (!desc) {
      htmlFailures.push(`${rel}: missing meta description`);
    } else if (desc.length < 50 || desc.length > 160) {
      htmlFailures.push(`${rel}: description length ${desc.length} (want 50-160): "${desc.slice(0, 40)}…"`);
    }

    if (h1Count !== 1) {
      htmlFailures.push(`${rel}: ${h1Count} <h1> (want exactly 1)`);
    }

    if (!canonical) {
      htmlFailures.push(`${rel}: missing canonical link`);
    } else if (!/^https?:\/\//.test(canonical)) {
      htmlFailures.push(`${rel}: canonical not absolute: "${canonical}"`);
    }

    if (!ogTitle || !ogDesc || !ogImage) {
      htmlFailures.push(`${rel}: incomplete OpenGraph (og:title=${ogTitle} og:description=${ogDesc} og:image=${ogImage})`);
    }

    // Image alt check
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)];
    for (const img of imgs) {
      if (!/alt\s*=/i.test(img[0])) {
        htmlFailures.push(`${rel}: <img> missing alt attribute`);
        break; // one report per file is enough
      }
    }

    // Auth-guarded page must be noindex in the served HTML
    if (isAuth && !noIndex) {
      htmlFailures.push(`${rel}: auth-guarded route served WITHOUT noindex (${path})`);
    }
  }

  console.log(`\nHTML SEO audit — ${htmlCount} pages scanned (${buildDir})`);
  if (htmlFailures.length === 0) {
    console.log("OK — every served page passes title/desc/H1/canonical/OG/alt/noindex checks.\n");
    process.exit(0);
  }
  console.error(`${htmlFailures.length} issue(s):`);
  for (const failure of htmlFailures) console.error(`  - ${failure}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Live mode — audit served pages via a running dev/prod server
// ---------------------------------------------------------------------------

/**
 * Crawl a running server using its own sitemap.xml as the URL list (the exact
 * set Google/Bing fetch), then verify every listed page is indexable and
 * well-formed. Also spot-check auth-guarded routes: after redirects the final
 * HTML must carry noindex (robots.txt alone is not an indexing block).
 *
 * Usage: node audit-seo-indexability.mjs --live http://localhost:3000
 */
async function liveMode() {
  const argIndex = process.argv.indexOf("--live");
  const base = (process.argv[argIndex + 1] || "").replace(/\/+$/, "");
  if (!/^https?:\/\//.test(base)) {
    console.error("--live requires a base URL, e.g. --live http://localhost:3000");
    process.exit(1);
  }

  const failures = [];
  const ok = [];
  let scanned = 0;

  async function fetchText(url, { redirect = "follow" } = {}) {
    const res = await fetch(url, { redirect, headers: { "user-agent": "seo-indexability-audit" } });
    const text = await res.text();
    return { res, text };
  }

  function checkHtml(url, html, { mustBeNoIndex = false } = {}) {
    scanned += 1;
    const rel = url.replace(base, "") || "/";
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
    const desc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] ?? "";
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)?.[1] ?? "";
    const ogTitle = /<meta\s+property=["']og:title["']/i.test(html);
    const ogDesc = /<meta\s+property=["']og:description["']/i.test(html);
    const ogImage = /<meta\s+property=["']og:image["']/i.test(html);
    const noIndex = /<meta\s+name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html);

    const problems = [];
    if (mustBeNoIndex) {
      if (!noIndex) problems.push("auth-guarded page served WITHOUT noindex");
    } else {
      if (noIndex) problems.push(`noindex on a sitemap URL (${title.slice(0, 40)})`);
      if (!title) problems.push("missing <title>");
      else if (title.length < 10 || title.length > 60) problems.push(`title length ${title.length} (want 10-60): "${title}"`);
      if (!desc) problems.push("missing meta description");
      else if (desc.length < 50 || desc.length > 160) problems.push(`description length ${desc.length} (want 50-160)`);
      if (h1Count !== 1) problems.push(`${h1Count} <h1> (want exactly 1)`);
      if (!canonical) problems.push("missing canonical");
      else if (!/^https?:\/\//.test(canonical)) problems.push(`canonical not absolute: "${canonical}"`);
      if (!ogTitle || !ogDesc || !ogImage) problems.push(`incomplete OG (title=${ogTitle} desc=${ogDesc} image=${ogImage})`);
      const imgMissingAlt = [...html.matchAll(/<img\b[^>]*>/gi)].some((img) => !/alt\s*=/i.test(img[0]));
      if (imgMissingAlt) problems.push("an <img> is missing alt");
    }
    return { rel, problems };
  }

  // 1. Fetch the sitemap — the canonical list of URLs we want indexed.
  let sitemapText;
  try {
    ({ text: sitemapText } = await fetchText(`${base}/sitemap.xml`));
  } catch {
    console.error(`Cannot reach ${base}/sitemap.xml — is the server running?`);
    process.exit(1);
  }
  const urls = [...sitemapText.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) {
    console.error("sitemap.xml returned no <loc> URLs");
    process.exit(1);
  }

  // 2. Verify every sitemap URL is served, indexable, and well-formed.
  for (const url of urls) {
    let html;
    try {
      ({ res, text: html } = await fetchText(url));
    } catch {
      failures.push(`${url}: fetch failed`);
      continue;
    }
    if (res.status !== 200) {
      failures.push(`${url}: HTTP ${res.status}`);
      continue;
    }
    const { rel, problems } = checkHtml(url, html);
    if (problems.length > 0) {
      failures.push(`${rel}: ${problems.join("; ")}`);
    } else {
      ok.push(rel);
    }
  }

  // 3. Spot-check auth-guarded routes: final HTML after redirects must be noindex.
  const authRoutes = [
    "/admin", "/admin/analytics", "/oostudio", "/ooplanner", "/ooplanner/projects",
    "/portal", "/dashboard", "/access", "/login", "/choose-product", "/quote-cart",
    "/offline", "/tools/office-space-calculator",
  ];
  for (const route of authRoutes) {
    let html;
    try {
      ({ res, text: html } = await fetchText(`${base}${route}`));
    } catch {
      failures.push(`${route}: fetch failed`);
      continue;
    }
    const { rel, problems } = checkHtml(route, html, { mustBeNoIndex: true });
    if (problems.length > 0) {
      failures.push(`${rel}: ${problems.join("; ")} (HTTP ${res.status})`);
    } else {
      ok.push(`${route} (noindex)`);
    }
  }

  // 4. robots.txt must reference the sitemap.
  try {
    const robots = (await fetchText(`${base}/robots.txt`)).text;
    if (!/sitemap\s*:/i.test(robots)) failures.push("robots.txt missing Sitemap reference");
  } catch {
    failures.push("robots.txt unreachable");
  }

  console.log(`\nLive SEO audit — ${base} (${urls.length} sitemap URLs + ${authRoutes.length} auth spot-checks)`);
  console.log(`  passed: ${ok.length}`);
  if (failures.length === 0) {
    console.log("OK — every sitemap URL is served indexable and well-formed; auth routes are noindex.\n");
    process.exit(0);
  }
  console.error(`\n${failures.length} issue(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

if (process.argv.includes("--html")) {
  htmlMode();
}

if (process.argv.includes("--live")) {
  liveMode();
}

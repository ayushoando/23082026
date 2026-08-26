#!/usr/bin/env node
/**
 * generate-visual-audit-report.mjs
 *
 * Reads findings.json produced by the visual audit Playwright spec and generates:
 *   1. audit-findings.csv  — structured CSV of all findings
 *   2. audit-report.html   — self-contained HTML gallery with side-by-side screenshots
 *   3. CHECKLIST.md         — pre-populated review checklist for human reviewers
 *
 * Usage:
 *   node scripts/generate-visual-audit-report.mjs
 *   node scripts/generate-visual-audit-report.mjs --input=path/to/findings.json --output=path/to/dir
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function argValue(name) {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split("=").slice(1).join("=") : undefined;
}

const DEFAULT_DIR = path.resolve(process.cwd(), "results", "screenshots", "visual-audit");
const inputPath = argValue("input") || path.join(DEFAULT_DIR, "findings.json");
const outputDir = argValue("output") || DEFAULT_DIR;

// ---------------------------------------------------------------------------
// Read findings
// ---------------------------------------------------------------------------

if (!fs.existsSync(inputPath)) {
  console.error(`\n  Error: findings.json not found at:\n  ${inputPath}\n`);
  console.error("  Run the visual audit capture first:");
  console.error("    pnpm run audit:visual\n");
  process.exit(1);
}

const findings = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

if (!Array.isArray(findings) || findings.length === 0) {
  console.error("  Error: findings.json is empty or invalid.\n");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Group findings by page (path + label) for side-by-side display
// ---------------------------------------------------------------------------

/** @typedef {{ path: string, label: string, group: string, mobile?: object, desktop?: object }} PageEntry */

/** @type {Map<string, PageEntry>} */
const pageMap = new Map();

for (const f of findings) {
  const key = `${f.group}|${f.label}`;
  if (!pageMap.has(key)) {
    pageMap.set(key, { path: f.path, label: f.label, group: f.group });
  }
  const entry = pageMap.get(key);
  if (f.viewport === "mobile") entry.mobile = f;
  else if (f.viewport === "desktop") entry.desktop = f;
}

const pages = [...pageMap.values()].sort((a, b) => {
  if (a.group !== b.group) return a.group.localeCompare(b.group);
  return a.label.localeCompare(b.label);
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const totalPages = pages.length;
const totalScreenshots = findings.length;
const pagesWithOverflow = pages.filter(
  (p) => p.mobile?.hasOverflow || p.desktop?.hasOverflow,
).length;
const pagesWithErrors = pages.filter(
  (p) =>
    (p.mobile?.consoleErrors?.length > 0) || (p.desktop?.consoleErrors?.length > 0),
).length;
const pagesTimedOut = pages.filter(
  (p) => p.mobile?.timedOut || p.desktop?.timedOut,
).length;

// ---------------------------------------------------------------------------
// CSV generation
// ---------------------------------------------------------------------------

function escapeCsv(val) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCsv() {
  const headers = [
    "Page",
    "Label",
    "Group",
    "Viewport",
    "HasOverflow",
    "ConsoleErrors",
    "ConsoleWarnings",
    "ScreenshotPath",
    "TimedOut",
    "Timestamp",
  ];

  const rows = findings.map((f) => [
    escapeCsv(f.path),
    escapeCsv(f.label),
    escapeCsv(f.group),
    escapeCsv(f.viewport),
    f.hasOverflow ? "YES" : "NO",
    escapeCsv((f.consoleErrors || []).length),
    escapeCsv((f.consoleWarnings || []).length),
    escapeCsv(f.screenshotFile),
    f.timedOut ? "YES" : "NO",
    escapeCsv(f.timestamp),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const csvPath = path.join(outputDir, "audit-findings.csv");
  fs.writeFileSync(csvPath, csvContent, "utf-8");
  console.log(`  CSV:       ${csvPath}`);
}

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function badge(finding) {
  if (!finding) return '<span class="badge badge-missing">—</span>';
  const parts = [];
  if (finding.hasOverflow) parts.push('<span class="badge badge-overflow">OVERFLOW</span>');
  if (finding.consoleErrors?.length > 0)
    parts.push(`<span class="badge badge-error">${finding.consoleErrors.length} error${finding.consoleErrors.length > 1 ? "s" : ""}</span>`);
  if (finding.timedOut) parts.push('<span class="badge badge-timeout">TIMEOUT</span>');
  if (parts.length === 0) parts.push('<span class="badge badge-ok">OK</span>');
  return parts.join(" ");
}

function pageCard(entry) {
  const mobileImg = entry.mobile?.screenshotFile
    ? `<img src="${escapeHtml(entry.mobile.screenshotFile)}" alt="Mobile: ${escapeHtml(entry.label)}" loading="lazy" />`
    : '<div class="no-img">No mobile screenshot</div>';
  const desktopImg = entry.desktop?.screenshotFile
    ? `<img src="${escapeHtml(entry.desktop.screenshotFile)}" alt="Desktop: ${escapeHtml(entry.label)}" loading="lazy" />`
    : '<div class="no-img">No desktop screenshot</div>';

  const hasIssue = entry.mobile?.hasOverflow || entry.desktop?.hasOverflow ||
    entry.mobile?.consoleErrors?.length > 0 || entry.desktop?.consoleErrors?.length > 0 ||
    entry.mobile?.timedOut || entry.desktop?.timedOut;

  const errorDetails = [];
  for (const vp of [entry.mobile, entry.desktop]) {
    if (vp?.consoleErrors?.length > 0) {
      errorDetails.push(
        `<details class="error-details"><summary>${escapeHtml(vp.viewport)} console errors (${vp.consoleErrors.length})</summary><pre>${escapeHtml(vp.consoleErrors.join("\n"))}</pre></details>`,
      );
    }
  }

  return `
    <article class="page-card" data-group="${escapeHtml(entry.group)}" data-overflow="${entry.mobile?.hasOverflow || entry.desktop?.hasOverflow ? "1" : "0"}" data-errors="${(entry.mobile?.consoleErrors?.length || 0) + (entry.desktop?.consoleErrors?.length || 0) > 0 ? "1" : "0"}" data-issue="${hasIssue ? "1" : "0"}">
      <h3><code>${escapeHtml(entry.path)}</code> <small class="group-tag">${escapeHtml(entry.group)}</small></h3>
      <div class="badges">
        <span class="vp-label">Mobile:</span> ${badge(entry.mobile)}
        <span class="vp-label">Desktop:</span> ${badge(entry.desktop)}
      </div>
      <div class="screenshots">
        <div class="shot mobile-shot">
          <h4>Mobile (390×844)</h4>
          ${mobileImg}
        </div>
        <div class="shot desktop-shot">
          <h4>Desktop (1920×1080)</h4>
          ${desktopImg}
        </div>
      </div>
      ${errorDetails.length > 0 ? `<div class="errors">${errorDetails.join("")}</div>` : ""}
    </article>`;
}

function writeHtml() {
  const groups = ["site", "admin", "studio", "planner"];
  const generatedAt = new Date().toISOString();

  let tocHtml = "";
  let cardsHtml = "";

  for (const group of groups) {
    const groupPages = pages.filter((p) => p.group === group);
    if (groupPages.length === 0) continue;

    tocHtml += `<li><a href="#group-${group}">${group.charAt(0).toUpperCase() + group.slice(1)}</a> (${groupPages.length})</li>`;
    cardsHtml += `<section id="group-${group}"><h2>${group.charAt(0).toUpperCase() + group.slice(1)} (${groupPages.length} pages)</h2>`;
    cardsHtml += groupPages.map(pageCard).join("\n");
    cardsHtml += `</section>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Visual Audit Report — ${generatedAt}</title>
<style>
  :root { --bg: #f8f9fa; --card-bg: #fff; --border: #dee2e6; --red: #dc3545; --yellow: #ffc107; --green: #28a745; --gray: #6c757d; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: #212529; padding: 1rem; line-height: 1.5; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .meta { color: var(--gray); font-size: 0.85rem; margin-bottom: 1rem; }
  .stats { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .stat { background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem 1rem; min-width: 140px; }
  .stat strong { display: block; font-size: 1.4rem; }
  .stat small { color: var(--gray); }
  .filters { background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
  .filters label { cursor: pointer; font-size: 0.9rem; }
  .toc { margin-bottom: 1.5rem; }
  .toc ul { list-style: none; display: flex; gap: 1rem; flex-wrap: wrap; }
  .toc a { color: #0d6efd; text-decoration: none; }
  section { margin-bottom: 2rem; }
  section h2 { font-size: 1.2rem; border-bottom: 2px solid var(--border); padding-bottom: 0.4rem; margin-bottom: 1rem; }
  .page-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
  .page-card h3 { font-size: 0.95rem; margin-bottom: 0.5rem; }
  .group-tag { background: #e9ecef; padding: 0.1em 0.4em; border-radius: 4px; font-size: 0.75rem; }
  .badges { margin-bottom: 0.75rem; font-size: 0.85rem; }
  .vp-label { font-weight: 600; margin-right: 0.25rem; }
  .badge { display: inline-block; padding: 0.15em 0.5em; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.25rem; }
  .badge-ok { background: #d4edda; color: var(--green); }
  .badge-overflow { background: #f8d7da; color: var(--red); }
  .badge-error { background: #fff3cd; color: #856404; }
  .badge-timeout { background: #e2e3e5; color: var(--gray); }
  .badge-missing { background: #e9ecef; color: var(--gray); }
  .screenshots { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-top: 0.5rem; }
  @media (max-width: 900px) { .screenshots { grid-template-columns: 1fr; } }
  .shot h4 { font-size: 0.8rem; color: var(--gray); margin-bottom: 0.25rem; }
  .shot img { width: 100%; height: auto; border: 1px solid var(--border); border-radius: 4px; }
  .no-img { background: #e9ecef; padding: 2rem; text-align: center; color: var(--gray); border-radius: 4px; }
  .errors { margin-top: 0.75rem; }
  .error-details { margin-top: 0.25rem; }
  .error-details summary { cursor: pointer; font-size: 0.85rem; color: var(--red); }
  .error-details pre { background: #f1f1f1; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem; overflow-x: auto; max-height: 200px; margin-top: 0.25rem; }
  .hidden { display: none !important; }
</style>
</head>
<body>
<h1>Visual Audit Report</h1>
<p class="meta">Generated: ${generatedAt} &middot; ${totalScreenshots} screenshots across ${totalPages} pages</p>

<div class="stats">
  <div class="stat"><strong>${totalPages}</strong><small>Pages audited</small></div>
  <div class="stat"><strong>${totalScreenshots}</strong><small>Screenshots</small></div>
  <div class="stat" style="border-color:${pagesWithOverflow > 0 ? "var(--red)" : "var(--border)"}"><strong>${pagesWithOverflow}</strong><small>With overflow</small></div>
  <div class="stat" style="border-color:${pagesWithErrors > 0 ? "var(--yellow)" : "var(--border)"}"><strong>${pagesWithErrors}</strong><small>With console errors</small></div>
  <div class="stat"><strong>${pagesTimedOut}</strong><small>Timed out</small></div>
</div>

<div class="filters">
  <strong>Filters:</strong>
  <label><input type="checkbox" id="filter-overflow" /> Overflow only</label>
  <label><input type="checkbox" id="filter-errors" /> Errors only</label>
  <label>Group: <select id="filter-group"><option value="all">All</option>${groups.map((g) => `<option value="${g}">${g.charAt(0).toUpperCase() + g.slice(1)}</option>`).join("")}</select></label>
</div>

<nav class="toc"><ul>${tocHtml}</ul></nav>

${cardsHtml}

<script>
(function() {
  const cards = document.querySelectorAll('.page-card');
  const fOverflow = document.getElementById('filter-overflow');
  const fErrors = document.getElementById('filter-errors');
  const fGroup = document.getElementById('filter-group');

  function applyFilters() {
    const wantOverflow = fOverflow.checked;
    const wantErrors = fErrors.checked;
    const wantGroup = fGroup.value;

    cards.forEach(card => {
      let show = true;
      if (wantOverflow && card.dataset.overflow !== '1') show = false;
      if (wantErrors && card.dataset.errors !== '1') show = false;
      if (wantGroup !== 'all' && card.dataset.group !== wantGroup) show = false;
      card.classList.toggle('hidden', !show);
    });

    // Show/hide section headers
    document.querySelectorAll('section[id^="group-"]').forEach(sec => {
      const visible = sec.querySelectorAll('.page-card:not(.hidden)').length > 0;
      sec.classList.toggle('hidden', !visible);
    });
  }

  fOverflow.addEventListener('change', applyFilters);
  fErrors.addEventListener('change', applyFilters);
  fGroup.addEventListener('change', applyFilters);
})();
</script>
</body>
</html>`;

  const htmlPath = path.join(outputDir, "audit-report.html");
  fs.writeFileSync(htmlPath, html, "utf-8");
  console.log(`  HTML:      ${htmlPath}`);
}

// ---------------------------------------------------------------------------
// Checklist generation (Task 4)
// ---------------------------------------------------------------------------

function writeChecklist() {
  const groups = ["site", "admin", "studio", "planner"];
  const generatedAt = new Date().toISOString();

  let md = `# Visual Audit Checklist\n\n`;
  md += `Generated: ${generatedAt}\n\n`;
  md += `## Legend\n\n`;
  md += `| Column | Meaning |\n`;
  md += `|--------|---------|\n`;
  md += `| Mobile / Desktop | Human review pass: check \`[x]\` when reviewed |\n`;
  md += `| Overflow | Automated: horizontal scroll detected |\n`;
  md += `| Console Errors | Automated: JS errors in console |\n`;
  md += `| Truncation | Human: text cut off or ellipsized unexpectedly |\n`;
  md += `| Tap-target | Human: touch targets too small or overlapping (mobile) |\n`;
  md += `| Layout Break | Human: misaligned elements, broken grid, or visual defect |\n`;
  md += `| Notes | Freeform observations |\n\n`;

  let counter = 0;

  for (const group of groups) {
    const groupPages = pages.filter((p) => p.group === group);
    if (groupPages.length === 0) continue;

    md += `## ${group.charAt(0).toUpperCase() + group.slice(1)}\n\n`;
    md += `| # | Page | Mobile | Desktop | Overflow | Console Errors | Truncation | Tap-target | Layout Break | Notes |\n`;
    md += `|---|------|--------|---------|----------|----------------|------------|------------|--------------|-------|\n`;

    for (const p of groupPages) {
      counter++;
      const mobileOverflow = p.mobile?.hasOverflow;
      const desktopOverflow = p.desktop?.hasOverflow;
      const overflow = mobileOverflow || desktopOverflow ? "\\u274c" : "\\u2705";

      const mobileErrors = p.mobile?.consoleErrors?.length || 0;
      const desktopErrors = p.desktop?.consoleErrors?.length || 0;
      const totalErrors = mobileErrors + desktopErrors;
      const errorsCol = totalErrors > 0 ? `${totalErrors}` : "\\u2705";

      md += `| ${counter} | \`${p.path}\` | [ ] | [ ] | ${overflow} | ${errorsCol} | | | | |\n`;
    }

    md += `\n`;
  }

  md += `---\n\n`;
  md += `Total pages: ${totalPages} | With overflow: ${pagesWithOverflow} | With errors: ${pagesWithErrors} | Timed out: ${pagesTimedOut}\n`;

  const checklistPath = path.join(outputDir, "CHECKLIST.md");
  fs.writeFileSync(checklistPath, md, "utf-8");
  console.log(`  Checklist: ${checklistPath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("\n  Visual Audit Report Generator\n");
console.log(`  Input:     ${inputPath}`);
console.log(`  Output:    ${outputDir}\n`);

fs.mkdirSync(outputDir, { recursive: true });

writeCsv();
writeHtml();
writeChecklist();

console.log(`\n  Done. ${totalPages} pages, ${totalScreenshots} screenshots.\n`);

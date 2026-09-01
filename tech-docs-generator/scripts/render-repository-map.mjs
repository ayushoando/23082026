import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

const MAP_REL = 'agents-work/repository-map'
const GRAPH_REL = 'agents-work/repository-graph'

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatCount(value) {
  return Number(value).toLocaleString('en-US')
}

function parseSummary(summaryText) {
  const facts = {}
  for (const line of summaryText.split('\n')) {
    const eq = line.indexOf('=')
    if (eq < 0) continue
    facts[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  }
  return facts
}

/**
 * Live facts come only from previously generated graph artifacts under
 * agents-work/repository-graph/. Missing artifacts render as explicit
 * "not yet generated" placeholders so the map can be produced before the
 * graph steps have ever run.
 */
function collectGraphFacts(repoRoot) {
  const graphRoot = path.join(repoRoot, GRAPH_REL)
  const readJson = (relative) => {
    const file = path.join(graphRoot, relative)
    if (!existsSync(file)) return null
    try {
      return JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      return null
    }
  }
  const stats = readJson(path.join('stats', 'latest.json'))
  const cycles = readJson(path.join('cycles', 'latest.json'))
  const summaryFile = path.join(graphRoot, 'page-components', 'summary.txt')
  const summary = existsSync(summaryFile) ? parseSummary(readFileSync(summaryFile, 'utf8')) : {}
  const pageGraphGeneratedAt = summary.generatedAt ?? null

  const value = (number, fallback = 'not generated') =>
    typeof number === 'number' ? formatCount(number) : fallback
  const routes = summary.routes !== undefined ? formatCount(Number(summary.routes)) : 'not generated'
  const pageNodes = summary.nodes !== undefined ? formatCount(Number(summary.nodes)) : 'not generated'
  const pageEdges = summary.edges !== undefined ? formatCount(Number(summary.edges)) : 'not generated'

  return {
    pageGraphGeneratedAt,
    routes,
    pageNodes,
    pageEdges,
    files: value(stats?.files),
    edges: value(stats?.edges),
    unresolved: value(stats?.unresolvedLocalSpecifiers),
    cycleCount: value(cycles?.cycleCount),
  }
}

const MISSING = '<span class="warning-text">not yet generated</span>'

function factValue(facts, key) {
  return facts[key] === 'not generated' ? MISSING : escapeHtml(facts[key])
}

function pageStyles() {
  return `
    :root {
      color-scheme: dark;
      --bg: #08111f;
      --panel: #101d2d;
      --panel-2: #14263a;
      --line: #29415b;
      --text: #e7eef8;
      --muted: #9db0c5;
      --accent: #70d6ff;
      --accent-2: #8cf0c0;
      --warning: #ffd27a;
      --danger: #ff9c9c;
      --shadow: 0 18px 45px rgba(0, 0, 0, .22);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: linear-gradient(160deg, #0b1728 0%, var(--bg) 48%, #07101c 100%); color: var(--text); line-height: 1.55; }
    a { color: var(--accent); }
    a:hover { color: #b6f1ff; }
    code, pre, .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    code { color: #b9e9ff; background: rgba(112, 214, 255, .08); padding: .12rem .35rem; border-radius: .3rem; }
    header { padding: 3.5rem max(1.25rem, calc((100vw - 1220px) / 2)) 2.6rem; border-bottom: 1px solid var(--line); background: radial-gradient(circle at 80% 0%, rgba(112, 214, 255, .17), transparent 38%), linear-gradient(135deg, #0e2035, #0a1423 72%); }
    .eyebrow { margin: 0 0 .7rem; color: var(--accent); font-size: .77rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
    h1 { margin: 0; max-width: 950px; font-size: clamp(2.1rem, 5vw, 4.7rem); line-height: 1.03; letter-spacing: -.045em; }
    .subtitle { max-width: 820px; margin: 1.15rem 0 0; color: var(--muted); font-size: 1.05rem; }
    .badges { display: flex; flex-wrap: wrap; gap: .55rem; margin-top: 1.35rem; }
    .badge { display: inline-flex; align-items: center; gap: .4rem; border: 1px solid var(--line); border-radius: 999px; padding: .36rem .72rem; color: var(--muted); background: rgba(16, 29, 45, .8); font-size: .82rem; }
    .badge strong { color: var(--text); }
    .layout { display: grid; grid-template-columns: 245px minmax(0, 1fr); gap: 2rem; width: min(1220px, calc(100% - 2.5rem)); margin: 1.75rem auto 4rem; }
    nav { position: sticky; top: 1rem; align-self: start; max-height: calc(100vh - 2rem); overflow: auto; padding: 1rem; border: 1px solid var(--line); border-radius: .9rem; background: rgba(16, 29, 45, .86); box-shadow: var(--shadow); }
    nav h2 { margin: 0 0 .7rem; font-size: .82rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
    nav a { display: block; padding: .38rem .45rem; border-radius: .42rem; color: var(--muted); text-decoration: none; font-size: .88rem; }
    nav a:hover { background: rgba(112, 214, 255, .1); color: var(--text); }
    main { min-width: 0; }
    section { scroll-margin-top: 1rem; margin-bottom: 1.3rem; padding: 1.35rem 1.5rem 1.55rem; border: 1px solid var(--line); border-radius: 1rem; background: rgba(16, 29, 45, .78); box-shadow: var(--shadow); }
    section h2 { margin: 0 0 .9rem; color: var(--text); font-size: 1.45rem; letter-spacing: -.025em; }
    section h3 { margin: 1.25rem 0 .55rem; color: #cfe5f8; font-size: 1rem; }
    section p { margin: .55rem 0; color: var(--muted); }
    .lead { color: #cbd9e8; font-size: 1.03rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: .8rem; }
    .card { padding: .95rem 1rem; border: 1px solid var(--line); border-radius: .75rem; background: rgba(20, 38, 58, .68); }
    .card .label { color: var(--muted); font-size: .76rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .card .value { margin-top: .25rem; color: var(--text); font-size: 1.42rem; font-weight: 800; }
    .card .detail { color: var(--muted); font-size: .82rem; }
    table { width: 100%; border-collapse: collapse; margin-top: .65rem; font-size: .9rem; }
    th, td { padding: .62rem .6rem; border-bottom: 1px solid rgba(41, 65, 91, .8); vertical-align: top; text-align: left; }
    th { color: #c7d9ea; font-size: .76rem; letter-spacing: .07em; text-transform: uppercase; }
    td { color: var(--muted); }
    td:first-child { color: var(--text); font-weight: 650; }
    tr:last-child td { border-bottom: 0; }
    pre { overflow: auto; margin: .75rem 0 0; padding: 1rem; border: 1px solid var(--line); border-radius: .7rem; background: #091522; color: #c7e7f4; font-size: .82rem; line-height: 1.55; }
    .flow { color: var(--accent-2); }
    .callout { margin: .85rem 0; padding: .85rem 1rem; border-left: 3px solid var(--accent); border-radius: .35rem; background: rgba(112, 214, 255, .08); color: #cfe4f1; }
    .callout.warning { border-left-color: var(--warning); background: rgba(255, 210, 122, .08); }
    .callout.danger { border-left-color: var(--danger); background: rgba(255, 156, 156, .08); }
    ul, ol { margin: .55rem 0 .2rem; padding-left: 1.35rem; color: var(--muted); }
    li { margin: .3rem 0; }
    .two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .path-list { display: grid; gap: .35rem; margin-top: .55rem; }
    .path-list code { display: block; overflow-wrap: anywhere; }
    .small { color: var(--muted); font-size: .82rem; }
    .status { color: var(--accent-2); font-weight: 700; }
    .warning-text { color: var(--warning); font-weight: 700; }
    footer { width: min(1220px, calc(100% - 2.5rem)); margin: 0 auto 3rem; color: var(--muted); font-size: .82rem; }
    .toolbar { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; margin-bottom: 1rem; }
    input, button { border: 1px solid var(--line); border-radius: .45rem; background: #0a1726; color: var(--text); padding: .55rem .7rem; font: inherit; }
    input { min-width: min(340px, 100%); }
    button { cursor: pointer; }
    button:hover { border-color: var(--accent); }
    .hidden-by-search { display: none; }
    @media (max-width: 850px) {
      .layout { display: block; width: min(100% - 1.2rem, 720px); }
      nav { position: static; max-height: none; margin-bottom: 1rem; }
      nav a { display: inline-block; margin-right: .25rem; }
      section { padding: 1rem; }
      .two-col { grid-template-columns: 1fr; }
      footer { width: min(100% - 1.2rem, 720px); }
    }
    @media print {
      :root { color-scheme: light; }
      body { background: white; color: #17202b; }
      header, section, nav { background: white; box-shadow: none; border-color: #c7d0da; }
      header { padding: 1rem 0; }
      .layout, footer { width: 100%; display: block; }
      nav, .toolbar { display: none; }
      section { break-inside: avoid; color: #17202b; }
      section p, td, li, footer { color: #435466; }
      h1, section h2, section h3, td:first-child { color: #17202b; }
      pre { color: #17202b; background: #f2f5f8; }
      a { color: #075b8a; }
    }
  `
}

export function renderRepositoryMap({ repoRoot = defaultRepoRoot } = {}) {
  const facts = collectGraphFacts(repoRoot)
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Generated whole-repository map for the Oando furniture platform repository.">
  <title>Oando Repository Map</title>
  <style>${pageStyles()}</style>
</head>
<body>
  <header>
    <p class="eyebrow">Oando · generated repository map</p>
    <h1>Whole repository architecture map</h1>
    <p class="subtitle">A beginner-readable map of the Next.js product, Planner and Studio forks, data ownership, tooling, Kiro workspace, and fresh static graph evidence. Generated by <code>tech-docs-generator/scripts/render-repository-map.mjs</code> — edit the generator, not this page.</p>
    <div class="badges" aria-label="Report facts">
      <span class="badge"><strong>Graph</strong> ${factValue(facts, 'files')} files · ${factValue(facts, 'edges')} edges</span>
      <span class="badge"><strong>Routes</strong> ${factValue(facts, 'routes')}</span>
      <span class="badge"><strong>Cycles</strong> ${factValue(facts, 'cycleCount')}</span>
      <span class="badge"><strong>Source</strong> tech-docs-generator</span>
    </div>
  </header>

  <div class="layout">
    <nav aria-label="Report sections">
      <h2>Contents</h2>
      <a href="#overview">Overview</a>
      <a href="#tree">Compact tree</a>
      <a href="#classification">Area classification</a>
      <a href="#surfaces">Product surfaces</a>
      <a href="#layers">Application layers</a>
      <a href="#api-flow">API and data flow</a>
      <a href="#databases">Databases</a>
      <a href="#tooling">Tooling and operations</a>
      <a href="#kiro">Kiro workspace</a>
      <a href="#boundaries">Fork boundaries</a>
      <a href="#graph">Graph evidence</a>
      <a href="#limitations">Limitations</a>
      <a href="#next">Next study area</a>
    </nav>

    <main>
      <div class="toolbar" aria-label="Report tools">
        <label for="report-search" class="small">Find in report:</label>
        <input id="report-search" type="search" placeholder="surface, database, path, tool...">
        <button type="button" id="print-report">Print report</button>
      </div>

      <section id="overview">
        <h2>Overview</h2>
        <p class="lead">The repository is a root-managed pnpm workspace containing one main Next.js application, a separate tech-docs Vite SPA, a Cloudflare Worker, test and operations tooling, and a repository-local Kiro control plane.</p>
        <div class="grid">
          <div class="card"><div class="label">Main product</div><div class="value">Next.js 16</div><div class="detail"><code>site/</code> · App Router · webpack</div></div>
          <div class="card"><div class="label">Product surfaces</div><div class="value">4</div><div class="detail">Marketing · Admin · Planner · Studio</div></div>
          <div class="card"><div class="label">Databases</div><div class="value">2</div><div class="detail">Products and Admin Supabase projects</div></div>
          <div class="card"><div class="label">Static graph</div><div class="value">${factValue(facts, 'edges')}</div><div class="detail">Local import edges across five source roots</div></div>
        </div>
        <div class="callout">Authority order: current user instruction → live code and fresh command output → <code>AGENTS.md</code> → <code>Agents/</code> → <code>docs/</code> → planning coordination.</div>
      </section>

      <section id="tree">
        <h2>Compact repository tree</h2>
        <pre>D:\\23082026
├─ site/                         Next.js product
│  ├─ app/                       routes, pages, layouts, API handlers
│  ├─ features/                  domain behavior
│  ├─ components/                product UI
│  ├─ hooks/ · store/            client hooks and Zustand state
│  ├─ lib/ · server/             shared and server-only logic
│  ├─ platform/                  Supabase, Drizzle, shared contracts
│  ├─ focss/                     Tailwind v4 + semantic CSS zones
│  ├─ inventory/ · i18n/         descriptors and locale files
│  ├─ public/                    deployable public assets
│  ├─ proxy.ts                   edge/security entry
│  └─ instrumentation.ts        OpenTelemetry registration
├─ tests/                        Vitest, Playwright, fixtures, helpers
├─ scripts/                      checks, audits, generators, operations
├─ tech-docs-generator/          Vite inventory/documentation SPA
├─ workers/                      Cloudflare Worker and R2 proxy
├─ config/                       build, quality, Playwright, observability
├─ .github/                      CI workflows and scoped instructions
├─ .kiro/                        skills, hooks, specs, steering, MCP schemas
├─ Agents/ · docs/               process handbooks and durable references
├─ plans/                        active planning coordination
├─ agents-work/                  guide work and graph reports
├─ generated-documents/          generated tech-doc output
├─ results/                      generic generated evidence
└─ package.json                  root scripts and all product dependencies</pre>
      </section>

      <section id="classification">
        <h2>Area classification</h2>
        <table>
          <thead><tr><th>Class</th><th>Locations</th><th>Handling rule</th></tr></thead>
          <tbody>
            <tr><td>Source / editable</td><td><code>site/</code>, <code>tests/</code>, <code>scripts/</code>, <code>workers/</code>, <code>tech-docs-generator/</code>, <code>config/</code></td><td>Change only for an approved, bounded task.</td></tr>
            <tr><td>Canonical documentation</td><td><code>docs/</code>, <code>AGENTS.md</code>, <code>START.md</code>, <code>Agents/</code>, handbooks</td><td>Use as durable reference; live code wins on mismatch.</td></tr>
            <tr><td>Kiro workspace</td><td><code>.kiro/</code></td><td>Repository-local guidance and enforcement, not product runtime.</td></tr>
            <tr><td>Planning</td><td><code>plans/</code></td><td>Requirements, design, tasks, and active coordination.</td></tr>
            <tr><td>Generated</td><td><code>generated-documents/</code>, <code>site/.next/</code>, build-info files, graph JSON/HTML reports</td><td>Regenerate; do not hand-edit.</td></tr>
            <tr><td>Local / private</td><td><code>.env.local</code>, <code>site/.env.local</code>, <code>node_modules/</code>, <code>.git/</code>, <code>.vscode/</code>, <code>ltm/</code></td><td>Keep secrets private and do not edit generated tool state.</td></tr>
            <tr><td>Legacy</td><td><code>site/data/storage/</code>, legacy public catalog mirrors, absent historical routes</td><td>Do not add new runtime behavior.</td></tr>
            <tr><td>Operational</td><td><code>workers/</code>, R2/Supabase/Vercel scripts, observability</td><td>High-impact actions require explicit authorization.</td></tr>
          </tbody>
        </table>
      </section>

      <section id="surfaces">
        <h2>Product surfaces and routes</h2>
        <table>
          <thead><tr><th>Surface</th><th>Routes</th><th>Primary source roots</th><th>Owns</th></tr></thead>
          <tbody>
            <tr><td>Marketing</td><td><code>/</code>, <code>/(site)/*</code></td><td><code>site/app/(site)/</code>, <code>site/features/site/</code></td><td>Catalog discovery, product pages, SEO, contact, quotes, planning marketing, legal content.</td></tr>
            <tr><td>Admin</td><td><code>/admin/*</code></td><td><code>site/app/admin/</code>, <code>site/features/admin/</code></td><td>Catalog, inventory, plans, price books, themes, analytics, internal operations.</td></tr>
            <tr><td>Planner</td><td><code>/ooplanner</code>, projects</td><td>Planner app, feature, component, hook, store, server trees</td><td>Floor layouts, furniture placement, projects, exports, handoff.</td></tr>
            <tr><td>Studio</td><td><code>/oostudio</code></td><td>Studio app, feature, component, hook, store, server trees</td><td>Furniture authoring, assets, descriptors, publishing, Studio AI helpers.</td></tr>
            <tr><td>CRM / Operations</td><td><code>/admin/crm/*</code>, customer queries, analytics</td><td><code>site/features/crm/</code>, <code>site/features/ops/</code></td><td>Local CRM workspace, customer-query operations, operational views.</td></tr>
          </tbody>
        </table>
        <div class="callout warning"><strong>Important distinction:</strong> the marketing <code>/planner*</code> pages are separate from the interactive Planner at <code>/ooplanner</code>. The documented <code>/admin/product-studio</code>, <code>/admin/svg-editor</code>, and historical interactive <code>/planner/*</code> app tree are absent or unverified.</div>
        <h3>Interactive route roots</h3>
        <div class="path-list">
          <code>/</code><code>/oostudio</code><code>/ooplanner</code><code>/ooplanner/projects</code><code>/ooplanner/projects/[id]</code><code>/offline</code>
        </div>
      </section>

      <section id="layers">
        <h2>Next.js application layers</h2>
        <div class="two-col">
          <div>
            <h3>Runtime and route layer</h3>
            <div class="path-list"><code>site/app/</code><code>site/app/(site)/</code><code>site/app/admin/</code><code>site/app/oostudio/</code><code>site/app/ooplanner/</code><code>site/app/api/</code><code>site/proxy.ts</code><code>site/instrumentation.ts</code></div>
          </div>
          <div>
            <h3>Product implementation</h3>
            <div class="path-list"><code>site/features/</code><code>site/components/</code><code>site/hooks/</code><code>site/store/</code><code>site/lib/</code><code>site/server/</code><code>site/types/</code></div>
          </div>
          <div>
            <h3>Platform and data</h3>
            <div class="path-list"><code>site/platform/supabase/</code><code>site/platform/drizzle/</code><code>site/platform/shared/</code><code>site/platform/Planner/</code><code>site/platform/Studio/</code></div>
          </div>
          <div>
            <h3>UI, assets, language</h3>
            <div class="path-list"><code>site/focss/</code><code>site/public/</code><code>site/inventory/descriptors/</code><code>site/i18n/</code><code>site/data/</code> <span class="small">legacy storage under this path</span></div>
          </div>
        </div>
        <pre class="flow">route/page
  → feature/domain logic
  → component UI
  → hook/store/lib/server
  → API route handler or server boundary
  → mode-aware persistence wrapper
  → Admin DB, Products DB, or approved dev disk</pre>
      </section>

      <section id="api-flow">
        <h2>API and persistence flow</h2>
        <p>HTTP handlers live under <code>site/app/api/**/route.ts</code>. Static route presence does not prove that a handler builds, authorizes, or works in a browser.</p>
        <table>
          <thead><tr><th>API family</th><th>Examples</th><th>Primary concern</th></tr></thead>
          <tbody>
            <tr><td>Admin</td><td><code>/api/admin/catalogs/*</code>, <code>/api/admin/plans/*</code>, price books, themes, analytics</td><td>Admin authorization, Admin database ownership, CSRF where wired.</td></tr>
            <tr><td>Planner</td><td><code>/api/Planner/projects/*</code>, catalog, upload, handoff, sketch-to-plan</td><td>Member project mutations, guest catalog/lead flows, Planner persistence mode.</td></tr>
            <tr><td>Studio</td><td><code>/api/Studio/furniture/*</code>, upload, publish, AI helpers</td><td>Furniture/descriptors in Admin database, publish authorization, Studio isolation.</td></tr>
            <tr><td>Marketing/catalog</td><td><code>/api/products</code>, categories, filter, configurator, nav search</td><td>Products database, catalog adapters, SEO-facing contracts.</td></tr>
            <tr><td>Shared/security</td><td><code>/api/csrf</code>, health, files, exports, tracking, customer queries</td><td>Security, rate limiting, storage boundaries, operational data.</td></tr>
          </tbody>
        </table>
      </section>

      <section id="databases">
        <h2>Database ownership and persistence</h2>
        <div class="two-col">
          <div class="card"><div class="label">Products database</div><div class="value">erpweaiypimorcunaimz</div><div class="detail">Marketing catalog · configurator · flags · themes<br><code>site/platform/supabase/migrations/</code></div></div>
          <div class="card"><div class="label">Admin database</div><div class="value">rxzpznmxbaoxpikowmfc</div><div class="detail">Staff · customers · plans · furniture · descriptors · price books · audit · queries<br><code>site/platform/supabase/migrations.admin/</code></div></div>
        </div>
        <table>
          <thead><tr><th>Data</th><th>Supabase / production</th><th>Disk / local development</th><th>Selector</th></tr></thead>
          <tbody>
            <tr><td>Planner projects</td><td>Admin <code>oando_plans</code></td><td><code>site/platform/Planner/data/projects/</code></td><td><code>plannerPersistenceMode.ts</code></td></tr>
            <tr><td>Furniture</td><td>Admin <code>furniture_catalog</code> and <code>catalog-assets</code></td><td><code>site/platform/shared/data/furniture/</code></td><td><code>furnitureCatalogMode.ts</code></td></tr>
            <tr><td>Descriptors</td><td>Admin <code>block_descriptors</code></td><td><code>site/inventory/descriptors/</code></td><td>Same furniture mode boundary</td></tr>
          </tbody>
        </table>
        <div class="callout danger"><strong>Production filesystem:</strong> read-only. Runtime writes must use mode-aware wrappers. Never dual-write disk and Supabase, never use raw disk helpers in production, and never add writes to <code>site/data/storage/</code>.</div>
        <p>Deployable schema changes go through Supabase migrations with RLS, grants, and rollback sections. Drizzle under <code>site/platform/drizzle/schema/</code> supports schema representation but is not the deployment migration location.</p>
      </section>

      <section id="tooling">
        <h2>Tooling, CI, and operations</h2>
        <table>
          <thead><tr><th>Area</th><th>Location</th><th>Responsibility</th></tr></thead>
          <tbody>
            <tr><td>Root command authority</td><td><code>package.json</code></td><td>pnpm scripts, gates, tests, audits, docs, database, R2, deployment.</td></tr>
            <tr><td>Testing</td><td><code>tests/</code>, <code>config/build/</code></td><td>Vitest two-lane suite, Playwright browser workflows, coverage and harness.</td></tr>
            <tr><td>Repository checks</td><td><code>scripts/general/</code>, <code>scripts/AsNeeded/</code></td><td>Layout, docs, governance, FOCSS, secrets, UI, audit, cleanup.</td></tr>
            <tr><td>Graph tooling</td><td><code>tech-docs-generator/scripts/graph-impact.mjs</code>, <code>tech-docs-generator/scripts/generate-page-component-graph.mjs</code></td><td>Static dependency, blast-radius, cycle, route, page, and component evidence.</td></tr>
            <tr><td>CI</td><td><code>.github/workflows/</code></td><td>Release gate, Site UI, Supabase/R2 backup, tech-docs automation.</td></tr>
            <tr><td>Tech docs</td><td><code>tech-docs-generator/</code>, <code>generated-documents/</code></td><td>Source-driven inventory SPA and generated documentation output.</td></tr>
            <tr><td>Vercel</td><td><code>site/</code>, <code>vercel.json</code></td><td>Next application deployment.</td></tr>
            <tr><td>Cloudflare / R2</td><td><code>workers/oando-worker-proxy/</code>, root ops scripts</td><td>Asset edge delivery, origin proxy, snapshots and backups.</td></tr>
            <tr><td>Observability</td><td><code>site/instrumentation.ts</code>, <code>site/lib/observability/</code>, <code>config/observability/</code></td><td>OpenTelemetry, Prometheus metrics, local Grafana/Prometheus.</td></tr>
          </tbody>
        </table>
        <div class="callout warning">This page is a generated artifact. Validation gates are separate commands requiring exact authorization.</div>
      </section>

      <section id="kiro">
        <h2>Kiro workspace</h2>
        <pre>.kiro/
├─ skills/
│  ├─ oando-master/       routing and completion contract
│  ├─ repo-map/           repository orientation
│  ├─ graph-impact/       dependency and blast-radius analysis
│  ├─ planner-studio/     Planner and Studio product guidance
│  ├─ fork-boundaries/    Planner/Studio isolation
│  ├─ focss-css/          FOCSS and Tailwind guidance
│  ├─ db-migrations/      database/RLS/migration guidance
│  ├─ verify-and-gate/    explicitly authorized validation
│  └─ powers-skills-model capability selection
├─ hooks/                 enforcement and command blocking
├─ specs/                 requirements, design, tasks
├─ steering/              persistent project context
├─ agents/                custom agent definitions
├─ mcp/                   MCP schemas only
└─ settings/              workspace settings and MCP configuration</pre>
        <table>
          <thead><tr><th>State</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td>MCP schema</td><td>A repository description under <code>.kiro/mcp/</code>; does not prove connection or installation.</td></tr>
            <tr><td>MCP configuration</td><td>Workspace settings under <code>.kiro/settings/</code>; does not prove authentication or runtime availability.</td></tr>
            <tr><td>Connected MCP</td><td>Separate runtime state requiring explicit configuration and least-privilege approval.</td></tr>
            <tr><td>Protected command</td><td>Tests, gates, builds, database actions, deployments, backups, and local services require exact user authorization and hook permission.</td></tr>
          </tbody>
        </table>
      </section>

      <section id="boundaries">
        <h2>Planner and Studio fork boundaries</h2>
        <div class="two-col">
          <div>
            <h3>Planner tree</h3>
            <div class="path-list"><code>site/app/ooplanner/</code><code>site/features/Planner/</code><code>site/components/Planner/</code><code>site/lib/Planner/</code><code>site/hooks/Planner/</code><code>site/store/Planner/</code><code>site/server/Planner/</code></div>
          </div>
          <div>
            <h3>Studio tree</h3>
            <div class="path-list"><code>site/app/oostudio/</code><code>site/features/Studio/</code><code>site/components/Studio/</code><code>site/lib/Studio/</code><code>site/hooks/Studio/</code><code>site/store/Studio/</code><code>site/server/Studio/</code></div>
          </div>
        </div>
        <ul>
          <li>Planner must not import Studio code.</li>
          <li>Studio must not import Planner code.</li>
          <li>Shared backing data and API contracts are allowed; shared modules belong only in approved shared platform locations.</li>
          <li>Each fork owns its own Dockview shell, state, persistence assumptions, and canvas behavior.</li>
          <li>Studio scale is approximately <code>0.2 px/mm</code>; Planner scale is approximately <code>0.05 px/mm</code>.</li>
        </ul>
        <div class="callout">The graph identifies <code>site/components/Planner/Planner.tsx</code> and <code>site/components/Studio/Studio.tsx</code> as high fan-out files. Changes there need especially careful boundary and impact review.</div>
      </section>

      <section id="graph">
        <h2>Fresh graph evidence</h2>
        <div class="grid">
          <div class="card"><div class="label">Graph files</div><div class="value">${factValue(facts, 'files')}</div><div class="detail">Across eight configured source roots</div></div>
          <div class="card"><div class="label">Local edges</div><div class="value">${factValue(facts, 'edges')}</div><div class="detail">Importer-to-local-dependency edges</div></div>
          <div class="card"><div class="label">Unresolved local</div><div class="value">${factValue(facts, 'unresolved')}</div><div class="detail">Mostly JSON, generated, config, or template paths</div></div>
          <div class="card"><div class="label">Detected cycles</div><div class="value">${factValue(facts, 'cycleCount')}</div><div class="detail">Static graph scope only</div></div>
        </div>
        <table>
          <thead><tr><th>Graph artifact</th><th>Location</th><th>Observed result</th></tr></thead>
          <tbody>
            <tr><td>Whole import graph</td><td><code>repository-graph/stats/latest.json</code></td><td>${factValue(facts, 'files')} files, ${factValue(facts, 'edges')} edges, ${factValue(facts, 'unresolved')} unresolved local references.</td></tr>
            <tr><td>Cycle report</td><td><code>repository-graph/cycles/latest.json</code></td><td>${factValue(facts, 'cycleCount')} strongly connected local-import groups.</td></tr>
            <tr><td>Page/component graph</td><td><code>repository-graph/page-components/</code></td><td>${factValue(facts, 'routes')} routes, ${factValue(facts, 'pageNodes')} nodes, ${factValue(facts, 'pageEdges')} edges.</td></tr>
            <tr><td>Interactive graph</td><td><a href="../repository-graph/page-components/page-component-graph.html">Open page-component-graph.html</a></td><td>Searchable route/page/component/module/style view.</td></tr>
          </tbody>
        </table>
        <p class="small">Page graph content hash: <code>${escapeHtml(facts.pageGraphGeneratedAt ?? 'not yet generated')}</code>. Graph reports are intentionally stored under <code>agents-work/</code> and not under <code>site/</code> or <code>results/</code>.</p>
      </section>

      <section id="limitations">
        <h2>Limitations and mismatches</h2>
        <ul>
          <li>Static source presence does not prove build, browser, authorization, RLS, hosted persistence, or deployment behavior.</li>
          <li>The graph excludes external package internals in <code>node_modules/</code>.</li>
          <li>Unresolved references include JSON imports, generated-document imports, configuration imports outside selected roots, and template-based dynamic paths.</li>
          <li>Zero detected cycles is not proof that runtime or dynamically loaded code has no cycles.</li>
          <li>Some older documentation mentions a root <code>supabase/</code>; the live location is <code>site/platform/supabase/</code>.</li>
          <li>Some older documentation mentions a root <code>mcp/</code>; the live schema location is <code>.kiro/mcp/</code>.</li>
          <li>The static route inventory is generator-derived and must not be treated as browser or production proof.</li>
          <li><code>package.json</code> declares <code>typecheck:scripts</code>, but <code>scripts/tsconfig.json</code> is absent; do not use that command.</li>
          <li>The generic repository convention describes <code>results/</code> as generated evidence, but graph reports belong under <code>agents-work/</code>.</li>
        </ul>
      </section>

      <section id="next">
        <h2>Important entry points and next study area</h2>
        <div class="two-col">
          <div>
            <h3>Read first</h3>
            <div class="path-list"><code>START.md</code><code>AGENTS.md</code><code>README.md</code><code>package.json</code><code>.kiro/skills/oando-master/SKILL.md</code><code>.kiro/skills/repo-map/SKILL.md</code><code>agents-work/oando-repository-guide/README.md</code></div>
          </div>
          <div>
            <h3>Architecture entry points</h3>
            <div class="path-list"><code>site/app/</code><code>site/proxy.ts</code><code>site/features/</code><code>site/lib/</code><code>site/server/</code><code>site/platform/</code><code>site/app/api/</code></div>
          </div>
        </div>
        <h3>Recommended next area: Planner project save flow</h3>
        <p>The Planner flow is the best next architectural study because it crosses route composition, Fabric/Dockview UI, fork-local state, API authorization, mode-aware persistence, Admin database ownership, and the Planner/Studio boundary.</p>
        <pre>site/app/ooplanner/page.tsx
site/features/Planner/
site/components/Planner/Planner.tsx
site/store/Planner/
site/server/Planner/
site/app/api/Planner/projects/route.ts
site/app/api/Planner/projects/[id]/route.ts
site/lib/Planner/plannerPersistenceMode.ts
site/platform/Planner/data/projects/
site/platform/supabase/migrations.admin/
tests/unit/planner/</pre>
        <p class="small">For a lower-risk UI-first path, study <code>site/app/(site)/page.tsx</code>, <code>site/components/home/</code>, <code>site/features/site/</code>, <code>site/lib/analytics/seo.ts</code>, and <code>site/focss/site/</code>.</p>
      </section>
    </main>
  </div>

  <footer>
    <p><strong>Report status:</strong> generated by tech-docs-generator/scripts/render-repository-map.mjs from repository facts and graph evidence under <code>agents-work/repository-graph/</code>. Edit the generator, not this page.</p>
    <p>Canonical references: <code>START.md</code>, <code>AGENTS.md</code>, <code>docs/architecture/</code>, and <code>agents-work/oando-repository-guide/</code>.</p>
  </footer>

  <script>
    const search = document.getElementById("report-search");
    const sections = [...document.querySelectorAll("main section")];
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      sections.forEach((section) => {
        section.classList.toggle("hidden-by-search", Boolean(query) && !section.textContent.toLowerCase().includes(query));
      });
    });
    document.getElementById("print-report").addEventListener("click", () => window.print());
  </script>
</body>
</html>
`
  return { mapRoot: path.join(repoRoot, MAP_REL), pages: [{ href: 'index.html', html }] }
}

export function writeRepositoryMap({ repoRoot = defaultRepoRoot } = {}) {
  const { mapRoot, pages } = renderRepositoryMap({ repoRoot })
  mkdirSync(mapRoot, { recursive: true })
  for (const page of pages) writeFileSync(path.join(mapRoot, page.href), page.html, 'utf8')
  return { written: pages.length, mapRoot }
}

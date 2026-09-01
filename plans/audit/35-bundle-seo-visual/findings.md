# 35 — Bundle Size, SEO Rendered-HTML & Visual Baselines

Scope: repo root `D:\23082026`, run 2026-09-01 (owner-authorized). Extends plan 13 (SEO, source-level), plan 29 §4 (visual baselines) and plan 19 (dependencies/build); does not duplicate their findings. All numbers below were measured directly on the build output.

## Commands observed

| Command | Exit code | Real evidence |
|---|---|---|
| `pnpm run build:site` | 0 | Exited after ~2m54s (background task s0kj7ccd). `site/.next` freshly stamped `01-Sep-26 11:17 PM` (standalone/server/static dirs). **Caveat:** the build's stdout log was captured as 0 bytes, so the route table / per-route "First Load JS" figures from the Next build summary were NOT observed and are not quoted here. Bundle verdicts below rest on direct `Get-ChildItem`/grep inspection of `site/.next`. |
| `node scripts/AsNeeded/audit-seo-indexability.mjs --html` | 0 | Full output quoted in "SEO html audit result" below. The script (`scripts/AsNeeded/audit-seo-indexability.mjs`, documented in-file at lines 1-24 and 344-366) runs its source audit then HTML mode when `--html` is passed. Not wired into package.json — invoked directly. |
| PowerShell `Get-ChildItem site\.next -Recurse -Filter *.js` (top-10 by size) | 0 | Sizes listed below. |

## Bundle findings

**Top 10 JS files under `site/.next` (recursive, incl. standalone copies):**

| Size | File (under `site/.next/`) | Nature |
|---|---|---|
| 6663.6 KB | `server/chunks/3459.js` (+ identical standalone copy) | server-only chunk, never shipped to browser |
| 1514.0 KB | `server/chunks/1579.js` (+ standalone copy) | server-only |
| 1504.0 KB | `standalone/.../next/dist/compiled/babel-packages/packages-bundle.js` | Next compiled runtime (server) |
| 1390.5 KB | `standalone/.../@mastra/core/dist/agent-B8m3ps7U.js` | server AI runtime |
| 1372.1 KB | `server/chunks/8748.js` (+ standalone copy) | server-only |
| 1332.8 KB | `standalone/.../next/dist/compiled/babel/bundle.js` | Next compiled runtime (server) |
| 851.0 KB | `standalone/.../next/dist/compiled/@vercel/og/index.node.js` | server OG-image runtime |
| 719.4 / 714.7 / 661.0 KB | further standalone/server files | server-only |

**Top 10 client chunks (`site/.next/static/chunks` — what browsers actually download):** `34189955-*` 357.9 KB, `f7d19238-*` 322.5 KB, `e3d32e8a-*` 285.9 KB, `8330-*` 235.8 KB, `9824-*` 209.0 KB, `6821-*` 196.8 KB, `bf45d881-*` 196.3 KB, `b3ad760f.*` 193.4 KB, `framework-*` 185.2 KB, `main-*` 140.4 KB. Total: 237 files / 5446 KB.

**The 3 heavy deps — located by grepping chunk contents for distinctive strings:**

| Dep | Distinctive marker found in | Client size | Also in server chunks | Source import sites |
|---|---|---|---|---|
| jsPDF | `jsPDF` in `static/chunks/f7d19238-a026abbfba7ccc09.js` | 322.5 KB (#2 client chunk) | `server/chunks/1579.js` | `site/lib/Studio/studioExporters.ts:2`, `site/lib/Planner/plannerExporters.ts:2` (static imports) |
| fabric | `console[t]("fabric",…)` + error class `` `fabric: ${t}` `` in `static/chunks/e3d32e8a-d496b1cf8939415d.js` | 285.9 KB (#3) | `server/chunks/1579.js` | `site/hooks/Studio/*`, `site/components/Planner/Planner.tsx:25` |
| gsap | `gsap` in `static/chunks/8045-*` (62.0 KB) + `static/chunks/bce21370-*` (50.6 KB) | 112.6 KB combined | `server/chunks/8748.js` | `ShowroomsPageView.tsx:5-6`, `PlanningPageView.tsx:4-5`, `ContactTeaser.tsx:10-11`, etc. |

(Excluded as false positives: `3780-*`/`6547-*` "fabric chair" catalog strings; `6821-*` is app code referencing `fabricCanvas`, not the library.)

**Verdict on the 3 heavy deps:** None of the three markers appear in the shared entry chunks `framework-*.js` (185.2 KB) or `main-*.js` (140.4 KB) — all three are code-split into separate client chunks, and the biggest raw files (6.6 MB `3459.js`, 1.5 MB `1579.js`) are server-only and never downloaded by a browser. **However, route-level loading could not be confirmed from build output:** this build prerenders **zero pages** — `prerender-manifest.json` lists only `/icon.png`, `/icon-12o0cb.png`, `/robots.txt`, `/sitemap.xml` (metadata routes), there are **0 `.html` files anywhere under `site/.next`**, and no `app-build-manifest.json` / `react-loadable-manifest.json` entry references any of the heavy chunks. Source layout (jspdf imported only by Studio/Planner exporters, fabric only by Studio/Planner canvas code) strongly suggests they load only inside auth-guarded workspaces, but that is source inference, not build-output proof.

## SEO html audit result

Real output of `node scripts/AsNeeded/audit-seo-indexability.mjs --html` (exit 0):

```
SEO indexability audit — 61 pages
  public indexable:      26
  auth-guarded:          33
  missing noindex:       0

OK — every route is indexable-or-explicitly-noindex, no public page is at risk.


HTML SEO audit — 0 pages scanned (D:\23082026\site\.next\server\app)
OK — every served page passes title/desc/H1/canonical/OG/alt/noindex checks.
```

The source-mode half is meaningful (61/61 routes pass the metadata contract, matching plan 13). **The HTML-mode half is a vacuous pass: 0 pages scanned.** The build emits no static HTML to scan (see above — all 61 pages are SSR; the script's default build dir `site/.next/server/app` contains only `.js`/`.json`/`.meta` route files, e.g. `server/app/(site)` holds 79 `.js` + 40 `.json`). Real pass/fail counts for rendered HTML are therefore **0 scanned / 0 failures** — the "SEO rendered-HTML" backlog item cannot be closed from this build output; closing it requires the script's `--live` mode against a running server (owner-gated).

## Visual baselines state

- **Count on disk: 0** — `tests/visual-baselines/` does not exist (verified 2026-09-01 via `Test-Path`), while `tests/manifests/visual-baselines.json` exists and defines the 216 expected baselines. Current state matches plan 29 §4 exactly; unchanged since that audit.
- Per task constraints and plan 29 policy (`updatesRequireReview: true`): **no baselines were generated and no dev servers or browser runs were started.** Playwright visual/a11y evidence remains owner-gated.

## Not run + why

- **Per-route First Load JS from the Next build summary** — the build exited 0 but its captured log was empty (0 bytes); those figures were not observed, so they are not claimed. The chunk-level measurements above are the substitute evidence.
- **SEO `--live` mode** — requires a running dev/prod server; servers are out of scope (owner-gated).
- **Playwright visual / a11y suite** — owner-gated per plan 29 §4 and task instructions; would also need the missing baselines.
- **Chunk→route mapping for jsPDF/fabric/gsap** — impossible from this build output (no prerendered HTML, no app-build-manifest); would require running the site and inspecting loaded scripts in a browser.

## Verdict

**No plan needed.** Build is healthy (exit 0, fresh output); the three heavy deps are demonstrably code-split out of the shared `framework`/`main` entry chunks, and the largest raw bundles are server-only. The two open backlog items — rendered-HTML SEO evidence and visual baselines on disk (0 of 216) — remain blocked on owner-gated server/browser runs and stay tracked in plan 29 §4; nothing observed here adds a remediation item.

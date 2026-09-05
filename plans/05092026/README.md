# Oando Master Platform Remediation & Architecture Suite (2026-09-05)

**Directory:** `plans/05092026/`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md` > `Agents/` > `docs/`)  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Methodology:** Decomposed Multi-File Subsystem Master Architecture, Deep Technical Specifications, and Actionable Verification Runbooks.

---

## 1. Suite Overview & Index

This multi-file planning suite provides horizontal and vertical technical blueprints for the Oando repository (`D:\23082026`). It is a planning coverage map, not proof that a code path is deployed, indexable, or gate-green. In accordance with user directives, visual changes are strictly limited to **alignment and polish** (FOCSS tokens, Phosphor icons, mobile chrome offsets, localization parity) without visual redesign.

| File | Subsystem & Scope |
|------|-------------------|
| [`phased-remedy-plan.md`](./phased-remedy-plan.md) | Unified 559-line master remedy blueprint across all 11 technical areas. |
| [`01-ui-focss-and-mobile-chrome.md`](./01-ui-focss-and-mobile-chrome.md) | FOCSS 4-zone CSS engine, token ratchet (baseline 200), GSAP `.mobile-app-main` scroller, Phosphor icons, mobile chrome (<768px). |
| [`02-route-contracts-seo-and-i18n.md`](./02-route-contracts-seo-and-i18n.md) | Static SEO registry (`SEO01_STATIC_METADATA`), XML/HTML sitemaps, and `next-intl` bilingual key parity (861 keys across 26 namespaces). |
| [`03-interactive-workspaces-studio-planner.md`](./03-interactive-workspaces-studio-planner.md) | Fork boundary isolation (`scan:boundaries`), scale invariants (Studio 0.2 px/mm vs Planner 0.05 px/mm vs PNG 2 px/mm), Dockview shells, Fabric 7 canvas. |
| [`04-data-persistence-and-cloud-infra.md`](./04-data-persistence-and-cloud-infra.md) | Dual-database topology (Admin vs Products), read-only production filesystem (`EROFS`), mode wrappers, Mastra AI provider chain, Cloudflare Worker proxy & R2 backups. |
| [`05-tech-docs-generator-spa.md`](./05-tech-docs-generator-spa.md) | Tech-Docs Vite SPA architecture, `https://oando23.vercel.app`, port 3001, 12 core documentation pages, live ER diagram synchronization. |
| [`06-test-subsystem-and-integrity-audits.md`](./06-test-subsystem-and-integrity-audits.md) | Dual-lane Vitest architecture (780 default files vs 42 tech-docs files), Playwright browser gate matrix, 5 test integrity audits. |
| [`07-scripts-and-operational-catalog.md`](./07-scripts-and-operational-catalog.md) | Complete script inventory (111 root, 56 general, 8 allowlisted AsNeeded), central `run-ops.mjs` dispatcher, governance ratchet. |
| [`08-standalone-packaging-and-sizing.md`](./08-standalone-packaging-and-sizing.md) | Next.js standalone distribution footprint, asset copy automation (`prepare-standalone.cjs`), Webpack optimizations, bundle externalization. |
| [`09-blockers-clearance-and-ship-gate.md`](./09-blockers-clearance-and-ship-gate.md) | Sequential blocker clearance protocol for `Failures.md` (`GATE-RECHECK-01` and `BROWSER-ORIGIN-02`), followed by master 4-phase ship gating runbook. |
| [`10-client-hub-sequence-plan.md`](./10-client-hub-sequence-plan.md) | Client-hub sequence roadmap (relocated from `plans/PLAN.md`), public route maps, flat 8-link header, route-lifecycle contracts, and browser walk. |
| [`11-admin-access-and-authorization.md`](./11-admin-access-and-authorization.md) | Dedicated authority plan for the access entry, member shells, Admin console, API role/CSRF/rate-limit contracts, and dev-bypass containment. |
| [`12-security-observability-and-release.md`](./12-security-observability-and-release.md) | Dedicated production-integrity plan for CSP/header ownership, third-party inventory, metrics and error privacy, incident response, and release provenance. |
| [`13-accessibility-performance-and-inclusive-ux.md`](./13-accessibility-performance-and-inclusive-ux.md) | Dedicated quality plan for WCAG coverage, keyboard/focus contracts, reduced motion, mobile ergonomics, and measured performance budgets. |

---

## 1.1 Coverage, Evidence, and Completion Rules

All thirteen planned areas have an owning document. The last three plans fill previously cross-cutting-only domains: authority, production integrity, and inclusive quality.

| Area | Owning plan | Coverage status | Required evidence before completion |
|------|-------------|-----------------|-------------------------------------|
| UI, FOCSS, and mobile chrome | `01-ui-focss-and-mobile-chrome.md` | Covered; current cookie/FAB rule was reconciled | Desktop and `<768px` browser checks at the same revision |
| Routes, SEO, and i18n | `02-route-contracts-seo-and-i18n.md` | Covered; route lifecycle policy added | Canonical-host HTTP status, route classification, sitemap, and navigation agree |
| Studio and Planner | `03-interactive-workspaces-studio-planner.md` | Covered | Boundary scan and authorized workspace checks |
| Data, persistence, and cloud | `04-data-persistence-and-cloud-infra.md` | Covered | Mode-aware persistence and cloud verification evidence |
| Tech-docs SPA | `05-tech-docs-generator-spa.md` | Covered | Its separate build/test lane and deployed-origin check |
| Tests and integrity audits | `06-test-subsystem-and-integrity-audits.md` | Covered | Fresh, authorized lane output; historical summaries are not clearance evidence |
| Scripts and operations | `07-scripts-and-operational-catalog.md` | Covered | Inventory/governance checks against the current tree |
| Standalone packaging | `08-standalone-packaging-and-sizing.md` | Covered | Fresh authorized production build and artifact inspection |
| Blockers and ship gate | `09-blockers-clearance-and-ship-gate.md` | Covered; stale green claim explicitly superseded | Each `Failures.md` row is cleared only by fresh successful evidence |
| Client-hub product sequence | `10-client-hub-sequence-plan.md` | Covered; `/tools` state is now explicitly pending | Product decision plus live-host and SEO contract verification |
| Admin, member access, and authorization | `11-admin-access-and-authorization.md` | Newly covered | Route/API authorization matrix, CSRF and rate-limit evidence, and bypass containment checks |
| Security, observability, and release operations | `12-security-observability-and-release.md` | Newly covered | Effective headers, third-party ledger, metrics access, incident path, and deployed-revision verification |
| Accessibility, performance, and inclusive UX | `13-accessibility-performance-and-inclusive-ux.md` | Newly covered | WCAG/keyboard/reduced-motion evidence plus measured, approved performance budgets |

Cross-cutting rule: distinguish **source presence**, **current `HEAD`**, and **canonical-host behaviour**. A route component, metadata entry, or historical result is not evidence that the canonical host returns a public `200`. Record the command or URL, revision, timestamp, and result before advancing any phase.

---

## 2. Global Architectural Topology

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            OANDO PLATFORM ARCHITECTURE                           │
├─────────────────────────┬────────────────────────────┬───────────────────────────┤
│    Public & Marketing   │    Interactive Workspaces  │     Admin & Operations    │
│    site/app/(site)      │    /ooplanner  │  /oostudio│     site/app/admin        │
├─────────────────────────┴────────────────────────────┴───────────────────────────┤
│                    FOCSS Semantic Tokens Layer (site/focss/)                     │
│       site/entry.css    │  planner/entry.css  │  studio/entry.css  │  admin/entry.css│
├──────────────────────────────────────────────────────────────────────────────────┤
│                       Next.js 16.3.3 Webpack Runtime Engine                      │
│             Node 24 Baseline  │  React 19.2.8  │  TypeScript ^7.0.2              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                  Dual-Database Platform & Persistence Wrappers                   │
│      Admin DB (rxzpznmxbaoxpikowmfc)   │    Products DB (erpweaiypimorcunaimz)   │
│      oando_plans, profiles, furniture  │    catalog_products, configurator, flags│
│      Mode: plannerPersistenceMode.ts   │    Mode: furnitureCatalogMode.ts        │
├──────────────────────────────────────────────────────────────────────────────────┤
│                          Edge & Cloud Infrastructure                             │
│     Cloudflare Worker Proxy (oando-worker-proxy)  │  R2 Asset Bucket & Backups   │
│     Mastra AI Fallback Chain (Gemini -> OpenRouter -> OpenAI -> Bedrock)         │
│     Vectorize REST Index (catalog-nav, 768 dims, cosine)                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                      Independent Documentation & Quality SPA                     │
│        Tech-Docs Generator (Vite 8, port 3001, https://oando23.vercel.app)       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Core Operating Invariants

1. **Zero Code Changes (`NO CODE CHANGE`):** Absolutely no modifications to application code, tests, or scripts during planning.
2. **Zero Auto-Implementation (`NO AUTO IMPLEMENT`):** Planning, audit, and technical specification only.
3. **User Wins (`AGENTS.md`):** User authority strictly supersedes documentation or prior agent output.
4. **Boundary Isolation:** Studio and Planner are strictly forked trees with zero cross-imports (`pnpm run scan:boundaries`).
5. **Persistence Safeguards:** Production filesystem is strictly read-only (`EROFS` protection). All writes must route through mode-aware persistence wrappers.
6. **Dual-Database Split:** Never write Admin entities to Products DB or vice versa. Zero dual-writing permitted.
7. **Strict Quarantine:** `docs/protected-folder/` is fully quarantined. Never read, search, list, or reference it.

# Original User Request

> **Plans layout (2026-08-22):** The repository now uses a single active execution plan — [`plans/PLAN.md`](./plans/PLAN.md), indexed by [`plans/README.md`](./plans/README.md). References below to `00-plan.md`, domain folders, numbered plans 01–21, and `SPECIFICATION.md` describe the **original 2026-08-19 request**, not the current `plans/` tree.

## Initial Request — 2026-08-19T09:46:23Z

Execute a rigorous 3-Pass Audit, Specification Overhaul, and Multi-Layer Quality Verification across all execution plans (01 through 21 across Foundation, Mobile, Desktop, Alignment, Growth, Typography) and all residual repository subsystems.

Working directory: E:\18082026
Integrity mode: development

## Requirements

### R1. Pass 1 — Deep Repository & Subsystem Truth Audit
Perform a comprehensive audit of all live repository subsystems:
- Site architecture, Next.js 16 conventions (site/proxy.ts, config/build/next.config.js), FOCSS layered styling graph (144 sheets).
- Dual Supabase databases (Admin DB rxzpznmxbaoxpikowmfc vs Products DB erpweaiypimorcunaimz) and persistence mode invariants (assertDevDiskWritable).
- Test suite truth (dual Vitest lanes, Site branch coverage 84.1%, Tech-Docs branch coverage 88.55%, 129 hollow presence tests).
- Active blockers in Failures.md (07-M1 / COV-01, SEO-01, HOLLOW-01, SEO-02, DEF-01).
- Explicit audit of all residual subsystems: Admin Pricing & Back-office (site/features/admin/pricing/), Cloudflare Worker Proxy (workers/oando-worker-proxy/), R2/LanceDB asset pipelines (site/lib/catalog/publish/), Catalog Lifecycle & Configurator (site/lib/catalog/lifecycle/), Tech-Docs Generator automation (tech-docs-generator/).

### R2. Pass 2 — Specification & Task Roadmap Overhaul (Plans 01–21)
Rewrite and align all plan documents and checklists into structured, forward-looking execution roadmaps:
- Foundation Plans (01–07): 01-foundation.md through 07-ops.md
- Mobile UI Plans (08–11): 08-mobile-audit.md through 11-mobile-chrome.md
- Desktop UI Plans (12–16): 12-desktop-audit.md through 16-desktop-detail.md
- Alignment Plan (17): 17-deployment.md
- Growth Plans (18–21): 18-free-tools-seo.md through 21-onboarding-activation.md
- Master Ledger & Checklists: plans/00-plan.md, plans/README.md, and all 6 folder checklists (foundation/, mobile/, desktop/, alignment/, growth/, typography/).
Ensure every plan contains discrete unchecked tasks (- [ ]), exact file paths, real terminal proof commands, and explicit ownership of the 5 residual subsystems.

### R3. Pass 3 — Multi-Layer Quality Gate & Adversarial Verification Pass
Execute an exhaustive 4-stage quality check on the overhauled plan tree:
1. Automated Link Resolution: Validate that 100% of relative markdown links across all 30+ markdown files under plans/ resolve cleanly to real existing files on disk.
2. Text & Encoding Integrity: Assert zero unicode corruption (no \uFFFD or broken control-character escapes like esults/, ode_modules, ext.config).
3. Checklist & Ledger Parity: Verify that every module across all 21 plans matches its corresponding folder checklist row and the master ledger in 00-plan.md.
4. Repository Fast Gate: Execute and assert green exit code 0 across check:docs-all, verify:focss, scan:boundaries, and gate:fast.

## Acceptance Criteria

### Pass 1: Audit Truth Verification
- [ ] Every assertion in plans 01–21 reflects live code, real test metrics, and active blockers in Failures.md.
- [ ] Explicit ownership and verification commands defined for Admin Pricing, Cloudflare Worker Proxy, R2/LanceDB pipelines, Catalog Lifecycle, and Tech-Docs Generator.

### Pass 2: Plan Structure & Checklist Parity
- [ ] All 21 plans structure forward work as unchecked - [ ] tasks with concrete terminal proof commands.
- [ ] All 6 folder checklists (foundation/, mobile/, desktop/, alignment/, growth/, typography/) and 00-plan.md are 100% synchronized.
- [ ] Zero phantom file references (e.g. non-existent notes in Agents/ or uncreated scripts).

### Pass 3: Multi-Layer Quality Verification
- [ ] Programmatic markdown link validator passes with 0 broken links across all plans/ files.
- [ ] pnpm run check:docs-all exits with code 0.
- [ ] pnpm run verify:focss exits with code 0 (144 stylesheets).
- [ ] pnpm run scan:boundaries exits with code 0 (0 cross-product edges).
- [ ] pnpm run gate:fast exits with code 0.

## Follow-up — 2026-08-19T11:22:02Z

# Teamwork Project Prompt — Draft

> Status: Step 8 — Ready for launch - awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Document review

Review and update all markdown files in the root, `Agents/`, and `docs/` directories to ensure they align with the repository's ground truth and are formatted to global standards.

Working directory: E:\18082026
Integrity mode: development

## Requirements

### R1. Ground Truth Alignment
Review the contents of all markdown files in the target directories against the source code and the core rules defined in `AGENTS.md`. Identify and correct any outdated, contradictory, or deprecated information.

### R2. Global Standards Formatting
Ensure all markdown files follow a consistent formatting standard (e.g., proper headings, list styles, link formatting).

## Acceptance Criteria

### Content Accuracy
- [ ] An independent agent reviewer confirms that the updated documentation does not contain any claims that contradict `AGENTS.md`.
- [ ] Deprecated architectural or process claims have been removed or updated.

### Formatting
- [ ] All updated files pass a basic markdown consistency check (or agent visual review if no linter exists).

## Follow-up — 2026-08-19T11:38:00Z

<USER_REQUEST>
Deeply audit and expand the canonical 21 execution plans (Plans 01–21 in `plans/`) to provide comprehensive, forward-looking architectural roadmaps covering AI agents & vector search, full modern tech stack, i18n & localization, and enterprise commerce workflows without any stub or redirecting files.

Working directory: E:\18082026
Integrity mode: development

## Requirements

### R1. AI Subsystem & Vector Search Deep Integration
Audit and explicitly detail the entire AI architecture across the relevant plans (Plan 02, 03, 18, 20):
- **Mastra AI Agent Framework** (`site/lib/ai/mastra/`): `advisorAgent.ts`, `catalogAdvisorAgent.ts`, `embedder.ts`, and `catalogRag.ts`.
- **LanceDB Vector Database**: Local and remote vector store (`.data/lancedb/catalog`, `LANCE_DB_URI`), 768-dim Gemini embeddings (`gemini-embedding-001`), and cosine similarity search.
- **Multi-Provider LLM Integration**: Gemini & OpenRouter model routing (`GEMINI_API_KEY`, `OPENROUTER_API_KEY_PRIMARY`, `OPENROUTER_MODEL`).
- **AI UI Features**: AI Assistant Drawer (`AiAssistantDrawer.tsx`), sketch-to-plan spatial calculation, and AI conversational search.

### R2. Tech Stack, Canvas Engines & Toolchain Architecture
Codify complete technical specifications and toolchain boundaries across Plans 01, 03, 04, 06, 07, 10, 14:
- **Next.js 16.3.1 + React 19.2.8**: Standalone output, Edge proxy entry (`site/proxy.ts`), React 19 compiler/DOM idioms, and Webpack/Turbopack toolchain.
- **Dual Supabase Databases & Wire Protocols**: Admin DB (`rxzpznmxbaoxpikowmfc`) vs Products DB (`erpweaiypimorcunaimz`), Drizzle ORM schemas, and strict mode-aware persistence (`assertDevDiskWritable`).
- **Dual Canvas Geometry Engines**: Fabric.js 7.4.0 (Studio 0.2 px/mm vs Planner 0.05 px/mm geometry isolation) and Dockview 7.0.4 layout panels.
- **Edge Infrastructure**: Cloudflare Worker proxy (`workers/oando-worker-proxy/`), apex 308 canonicalization, edge caching policies, and Cloudflare R2 bucket asset pipeline.
- **Tech-Docs Generator SPA**: Standalone Vite + React 19 SPA (`tech-docs-generator/`) with AST documentation parsing and branch coverage floor (≥ 85%).
- **FOCSS CSS System**: 144-stylesheet layered architecture on top of Tailwind CSS v4 with design token debt ratchet ceiling at ≤ 280.

### R3. Full i18n & Multilingual Localization Roadmap
Codify internationalization and localization specifications across Plans 01, 02, 09, 13, 19:
- **next-intl ^4.13.6 Pipeline**: `site/i18n/request.ts`, `site/i18n/routing.ts`, and middleware routing.
- **Message Dictionaries**: English (`en.json`), Hindi (`hi.json` 35.8 KB complete), French (`fr.json`), German (`de.json`), and Spanish (`es.json`).
- **Runtime Localization Activation**: Clear activation roadmap resolving cost decision `COST-S02`.
- **SEO & Hreflang Tags**: Multilingual alternate links, localized OpenGraph / Schema.org metadata, and localized pSEO URL routing.

### R4. Enterprise Commerce, AR & Telemetry Workflows
Detail enterprise workflows across Plans 03, 04, 16, 18, 19, 20, 21:
- **B2B Procurement & Pricing Engine**: Volume discount tiers, GST calculation (CGST/SGST 9% vs IGST 18%), HSN code breakdown, fail-closed price book pinning (`quotePriceBookPin.ts`), and multi-page PDF quote generation.
- **3D Configurator & AR QuickLook**: Parametric 3D configurator export, iOS USDZ conversion with PBR materials, and Android `@google/model-viewer` WebAR.
- **CRM & Customer Query Intake**: Public query pipeline (`POST /api/customer-queries`), CSRF/rate-limiting, Admin triage dashboard, and client management.
- **Telemetry & Activation**: 24-event taxonomy (`siteEvents.ts`), first-party `analytics_events` store, consent queues, and 6-item calibrated starter template onboarding.

### R5. Master Ledger Parity & Quality Gates
- Maintain strict synchronization across `plans/00-plan.md`, `plans/README.md`, and all 6 folder checklists (`foundation/`, `mobile/`, `desktop/`, `alignment/`, `growth/`, `typography/`).
- Zero redirecting stubs or duplicate plan files.
- 100% passing quality gates (`check:docs-all`, `verify:focss`, `scan:boundaries`, `gate:fast`, `tech-docs:gate`).

## Acceptance Criteria

### Comprehensive Architecture & Roadmap Coverage
- [ ] AI architecture (Mastra, LanceDB, Gemini/OpenRouter, AI Assistant Drawer) fully specified in Plans 02, 03, 18, and 20.
- [ ] Complete Tech Stack (Next 16, React 19, Dual DBs, Fabric 7.4, Dockview, R2, Cloudflare Worker, Tech-Docs SPA, FOCSS) detailed with exact package pins in Plans 01, 03, 04, 06, 07, 10, 14.
- [ ] Complete i18n roadmap (next-intl, 5 locale message dictionaries, Hindi runtime activation, hreflang tags) detailed in Plans 01, 02, 09, 13, 19.
- [ ] Enterprise Commerce, AR, CRM, and Telemetry workflows detailed in Plans 03, 04, 16, 18, 19, 20, 21.

### Structural & Link Integrity
- [ ] All 21 plans structure forward work with unchecked `- [ ]` tasks, exact file paths, and terminal proof commands.
- [ ] Zero broken relative markdown links across all 30 files in `plans/`.
- [ ] Zero redirecting, duplicate, or forwarding stubs.

### Quality Gate Pass
- [ ] `pnpm run check:docs-all` exits with code 0.
- [ ] `pnpm run verify:focss` exits with code 0 (144 stylesheets).
- [ ] `pnpm run scan:boundaries` exits with code 0 (0 cross-product edges).
- [ ] `pnpm run gate:fast` exits with code 0.
- [ ] `pnpm run tech-docs:gate` exits with code 0.
</USER_REQUEST>

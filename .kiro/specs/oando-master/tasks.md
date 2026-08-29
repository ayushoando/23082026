# Implementation Plan: Oando Master Repository Guide and Router

## Overview

Replace the stale completed downstream plan with an open, serial implementation plan for the current Repository Guide and Master Router deliverable. The work is documentation and repository-local Kiro guidance only. It augments the live guide at `./agents-work/oando-repository-guide/`, updates the master skill, optionally adds the proposed AI guidance skill, and reconciles the static HTML projection only when its Markdown/HTML source relationship is evidenced.

The live guide layout is authoritative for this plan:

- Start page: `./agents-work/oando-repository-guide/README.md`
- Markdown source chapters: `./agents-work/oando-repository-guide/markdown/01-repository-map.md` through `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`
- HTML projection: `./agents-work/oando-repository-guide/html/index.html`, the ten matching named pages, `./agents-work/oando-repository-guide/html/working-with-kiro.html`, and `./agents-work/oando-repository-guide/html/guide.css`
- Router: `./.kiro/skills/oando-master/SKILL.md`
- Optional AI Package Skill: `./.kiro/skills/ai-retrieval/SKILL.md` only if the optional guidance branch is selected

No task in this replacement plan is complete. A file change is not evidence of completion; each task remains open until its concrete static evidence is recorded and serially reconciled.

## Operating contract and boundaries

- **Serial owner:** one owner reconciles each handoff before the next write. Chapter tasks are strictly serial because README card IDs, path forms, response fields, skill triggers, placement rules, and Site Write Gate language are shared vocabulary.
- **Allowed current deliverable:** the guide README, Markdown chapters, evidenced matching HTML projection, `guide.css` only when the projection method requires it, `./.kiro/skills/oando-master/SKILL.md`, and the optional `./.kiro/skills/ai-retrieval/SKILL.md` guidance file.
- **Excluded paths and work:** `./site/` product/runtime source, `./workers/`, package manifests and lockfiles, database migrations/schema/RLS/grants/types/seed, deployment/backup/observability assets, external systems, runtime routers/checkers/generators, and all hook/policy/settings changes including `./.kiro/hooks/block-agent-tests.json`, `./.kiro/hooks/block-agent-tests.mjs`, and `./.kiro/settings/mcp.json`.
- **Protected Commands:** tests, gates, builds, coverage, browser runs, typechecks, database actions, backups, deployment, local services, and external actions remain user-authorized and hook-permitted. This workflow runs none of them. Inline markers do not authorize them. `pnpm run typecheck:scripts` remains unavailable while `./scripts/tsconfig.json` is absent and must not be proposed as validation.
- **Output placement:** agent reports and handoffs use `./agents-work/<workstream>/<report-type>/` (for this workstream, `./agents-work/oando-repository-guide/<report-type>/`); machine output uses `./results/<purpose>/`; tech-docs output uses `./generated-documents/`; active separate-approval plans use `./plans/<name>/`; a True Blocker is recorded only in root `./Failures.md`. No new report is authored at an `./agents-work/` or `./results/` root.
- **Exact workspace boundary:** `./tech-docs-generator/` remains a root-level sibling of `./site/`; `./generated-documents/` remains separate; `./results/site/` is a machine-evidence purpose folder distinct from `./site/`; no relocation is performed or claimed.
- **Site Write Gate:** any proposed write under `./site/` must first be classified as an explicitly approved Core Product Write with exact outcome, owned paths, matching skills, and expected evidence. Reports, results, audits, handoffs, prompts, plans, skills, generated files, and other Non-Core Artifacts are stopped and redirected; no task in this plan writes under `./site/`.
- **Static proof limit:** document structure, links, path references, inventories, and scope can be checked statically. Static evidence cannot prove rendered behavior, hosted persistence, connected MCP state, installed Power state, a successful command, or a Full Gate result.

## Tasks

- [ ] 1. Establish the source/provenance, routing, and output-boundary baseline
  - **Owned paths:** read-only inspection of the live guide source/projection set, repository documentation references, Kiro control paths, and output-boundary paths listed in 1.1–1.4; any authored handoff uses `./agents-work/oando-repository-guide/<report-type>/` and is not written to `./results/`.
  - **Excluded paths:** every write to the guide, HTML, skill, hook, settings, runtime, package, database, deployment, or generated-output path; no relocation and no command execution.
  - **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; Requirements 1.1–1.6, 6.1–6.10, 7.1–7.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 18.1–18.8, 19.1–19.7, 20.1–20.8, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, and 29.1–29.10.
  - **Static evidence:** one baseline handoff containing the complete path inventory, source/projection decision, current skill and hook boundary, output-placement ledger, exact workspace-boundary classification, unresolved gaps, and next owner action.
  - **Dependencies:** none; this is the first write-free wave.

  - [ ] 1.1 Inventory the current README, all Markdown chapters, and all HTML projection files
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/markdown/02-application-architecture.md`; `./agents-work/oando-repository-guide/markdown/03-product-domains.md`; `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`; `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`; `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`; `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`; `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`; `./agents-work/oando-repository-guide/09-local-generated-environment.md`; `./agents-work/oando-repository-guide/markdown/10-quality-validation.md`; `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`; `./agents-work/oando-repository-guide/html/index.html`; `./agents-work/oando-repository-guide/html/repository-map.html`; `./agents-work/oando-repository-guide/html/application-architecture.html`; `./agents-work/oando-repository-guide/html/product-domains.html`; `./agents-work/oando-repository-guide/html/data-api-persistence.html`; `./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`; `./agents-work/oando-repository-guide/html/operations-infrastructure.html`; `./agents-work/oando-repository-guide/html/docs-governance-planning.html`; `./agents-work/oando-repository-guide/html/kiro-workspace.html`; `./agents-work/oando-repository-guide/html/local-generated-environment.html`; `./agents-work/oando-repository-guide/html/quality-and-validation.html`; `./agents-work/oando-repository-guide/html/working-with-kiro.html`; and `./agents-work/oando-repository-guide/html/guide.css`.
    - **Excluded paths:** all modifications to the listed files, all other repository files, and all commands or generators.
    - **Requirements:** 1.2, 1.5, 2.1–2.14, 11.4, 20.1–20.8, 27.3.
    - **Static evidence:** a file-by-file inventory of headings, README/chapter links, chapter previous/next links, HTML navigation, duplicated facts, status labels, and observed differences; matching names alone must not be called synchronization proof.
    - **Dependencies:** none.

  - [ ] 1.2 Determine the Markdown-to-HTML provenance branch without running a generator
    - **Owned paths:** read-only inspection of `./package.json`, `./scripts/`, `./tech-docs-generator/`, `./docs/`, `./Agents/`, `./.github/`, `./config/`, `./generated-documents/`, and references to the guide under `./agents-work/oando-repository-guide/`.
    - **Excluded paths:** no `pnpm` command, no `docs:sync` or generator execution, no HTML/Markdown edit, no new generator or script, and no claim based only on filename similarity.
    - **Requirements:** 1.5, 6.3, 6.10, 11.4, 19.1–19.7, 20.4, 20.6–20.8, 27.3, 29.6–29.7.
    - **Static evidence:** a provenance record classifying the relationship as Markdown authoring source, HTML authoring source, deterministic transformation, or unresolved; it must identify the exact inspected references, distinguish guide projection from unrelated generated inventories, and name the fallback parity-gap action when unresolved.
    - **Dependencies:** 1.1.

  - [ ] 1.3 Establish the artifact-placement ledger and exact workspace boundary
    - **Owned paths:** read-only inspection of `./agents-work/`, `./agents-work/oando-repository-guide/`, `./results/`, `./results/tests/`, `./results/site/`, `./results/site-ui/`, `./results/ops/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./plans/`, `./plans/README.md`, `./Failures.md`, and existing root-level result artifacts if present.
    - **Excluded paths:** no artifact move, rename, regeneration, cleanup, or relocation claim; no write to `./site/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, or root control files.
    - **Requirements:** 7.1–7.7, 18.1–18.3, 19.1–19.7, 24.1–24.8, 27.6, 28.1–28.20, 29.1–29.10.
    - **Static evidence:** a placement table that assigns authored reports to `./agents-work/<workstream>/<report-type>/`, machine output to `./results/<purpose>/`, tech-docs output to `./generated-documents/`, active plans to `./plans/<name>/`, and True Blockers to `./Failures.md`; it must reject root-level report/result placement, distinguish `./results/site/` from `./site/`, state that `./tech-docs-generator/` is a root sibling of `./site/`, and label any unassigned root artifact `legacy/owner-review pending` without claiming reorganization.
    - **Dependencies:** 1.1.

  - [ ] 1.4 Establish the current skill, hook, MCP, settings, and protected-command boundary
    - **Owned paths:** read-only inspection of `./.kiro/skills/`, `./.kiro/skills/oando-master/SKILL.md`, `./.kiro/skills/repo-map/SKILL.md`, `./.kiro/skills/db-migrations/SKILL.md`, `./.kiro/skills/focss-css/SKILL.md`, `./.kiro/skills/fork-boundaries/SKILL.md`, `./.kiro/skills/planner-studio/SKILL.md`, `./.kiro/skills/graph-impact/SKILL.md`, `./.kiro/skills/powers-skills-model/SKILL.md`, `./.kiro/skills/verify-and-gate/SKILL.md`, `./.kiro/hooks/block-agent-tests.json`, `./.kiro/hooks/block-agent-tests.mjs`, `./.kiro/settings/mcp.json`, `./.kiro/mcp/`, `./.kiro/agents/`, `./skills-lock.json`, and `./.kiro/specs/oando-master/.config.kiro`.
    - **Excluded paths:** no hook, settings, skill, MCP, Power, package, runtime, or `.config.kiro` change; no Power activation, MCP connection, or Protected Command.
    - **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.2–11.6, 13.1–13.4, 18.4–18.8, 25.1–25.10, 27.2–27.7.
    - **Static evidence:** a boundary ledger listing present skills, the absent `./.kiro/skills/ai-retrieval/SKILL.md` state, matching/rejected routing candidates, hook matcher behavior, Protected Command families, MCP schema/configuration/connection distinctions, and the unchanged `.config.kiro` baseline.
    - **Dependencies:** 1.1 and 1.2.

- [ ] 2. Rebuild the README Begin Here entry point, 22-card Domain Index, Coverage Audit, gap cards, output-placement table, exact boundaries, and Site Write Gate
  - **Owned paths:** only `./agents-work/oando-repository-guide/README.md` for writes; Task 1 evidence and the live chapter files are read-only inputs.
  - **Excluded paths:** `./agents-work/oando-repository-guide/markdown/`, `./agents-work/oando-repository-guide/html/`, `./.kiro/skills/`, `./.kiro/hooks/`, `./.kiro/settings/`, `./site/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, runtime code, and all commands.
  - **Requirements:** Special Requirements 1.1–1.5 and 2.1–2.4; Requirements 1.1–1.6, 2.1–2.14, 3.1–3.7, 4.1–4.7, 7.1–7.7, 8.1–8.9, 9.1–9.7, 14.1–14.6, 18.1–18.8, 19.1–19.7, 20.1–20.8, 21.1–21.10, 24.1–24.8, 26.1–26.7, 27.1–27.7, 28.1–28.20, and 29.1–29.10.
  - **Static evidence:** the README has one ordinary-language entry flow, exactly 22 cards, one Coverage Audit row per card, a copyable gap-card template, the complete output-placement table, exact workspace paths, and the Site Write Gate; all links use the live `markdown/` and `html/` layout and no capability is called wired from path presence alone.
  - **Dependencies:** 1.1–1.4, serially.

  - [ ] 2.1 Add Begin Here, Route Record, and the common Coverage-Audited Task Card schema
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** every chapter, HTML page, `guide.css`, skill, hook, settings, runtime, package, database, output, and command path.
    - **Requirements:** 1.1–1.6, 8.1–8.9, 14.1–14.6, 15.1–15.5, 20.1–20.5, 21.1–21.10, 28.7–28.9.
    - **Static evidence:** the README states that `./.kiro/skills/oando-master/SKILL.md` is the first router and the README is the guide start page; it defines authority order, ordinary-language input, exact first evidence locations, Domain Index selection, additive skill routing, Workflow Mode, command classification, risk, output classification, Site Write Gate, unavoidable decisions, and a copyable Route Record plus the required Goal/Start Paths/Scope/Evidence Steps/Allowed Actions/Forbidden Actions/Risk/Expected Evidence/Next Decision fields.
    - **Dependencies:** 1.4.

  - [ ] 2.2 Add exactly the 22 Domain Index cards and classifier table
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** all chapter and HTML writes, all skill/hook/settings/runtime/package/database/output changes, and all commands.
    - **Requirements:** 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 8.9, 9.1–9.7, 20.1–20.8.
    - **Static evidence:** exactly one card and one classifier row for each of D01 Repository map and authority; D02 Initialization, local development, and debugging; D03 Auth, security, and secrets; D04 Environment; D05 APIs; D06 Site UI, SEO, i18n, accessibility, and performance; D07 UI polish, icons, alignment, FOCSS, motion, and assets; D08 Admin; D09 CRM demo versus customer-query operations; D10 Catalog, configurator, quotes, and inventory; D11 Planner; D12 Studio; D13 AI and retrieval; D14 Databases, RLS, grants, rollback, and mode-aware persistence; D15 Tests, fixtures, mocks, two Vitest lanes, and Playwright; D16 Scripts and command registry; D17 Packages, dependencies, and workspace boundaries; D18 Documentation, architecture, locked documentation, and legacy documentation; D19 Results, generated documents, agent work, and blocker placement; D20 MCP, skills, powers, and agents; D21 Vercel, Worker, R2, backups, observability, and incidents; and D22 Unknown-area discovery. Every card must include exact live Start Paths or an explicitly labelled discovery instruction, a chapter link, trigger/skill status, command status, and completion-evidence expectation.
    - **Dependencies:** 2.1.

  - [ ] 2.3 Add the Coverage Audit, Surface Status rules, and Coverage-Gap Admission Card
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** all chapters, HTML pages, skills, hooks, settings, runtime, package, database, generated-output, and command paths.
    - **Requirements:** 4.1–4.7, 7.1–7.7, 19.1–19.7, 20.6–20.8, 24.1–24.8, 26.1–26.7, 27.1–27.7.
    - **Static evidence:** 22 Coverage Audit rows containing card ID, outcome, chapter, verified paths, coverage status, evidence checked, evidence limitation, and next decision; the allowed statuses `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, and `legacy`; explicit CRM demo versus customer-query distinction; and a copyable gap card with Status, Evidence Source, Evidence Limitation, Next Evidence Source, Owner Action, Scope Boundary, and Next Decision. The README must state that a gap propagates into the response and Completion Record before a capability can be called wired or complete.
    - **Dependencies:** 2.2.

  - [ ] 2.4 Add the beginner output-placement reference, exact workspace boundaries, and Site Write Gate
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** no move or write under `./agents-work/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./plans/`, or `./Failures.md`; no hook, runtime, package, generator, or command change.
    - **Requirements:** 18.1–18.8, 24.1–24.8, 27.2–27.7, 28.1–28.20, 29.1–29.10.
    - **Static evidence:** the README contains the artifact-class table and the required wording: “If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.” It must use exact directory forms `./agents-work/<workstream>/<report-type>/`, `./results/<purpose>/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./results/site/`, and `./plans/<name>/`; reject root-level reports/results; preserve the sibling/no-relocation rule; and require Route Record artifact class, subfolder, filename pattern, owner, authored/generated state, rejected placements, and Site Write Gate fields.
    - **Dependencies:** 2.3.

  - [ ] 2.5 Reconcile README navigation, terminology, counts, and boundary wording before chapter writes
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** all other guide, skill, hook, settings, runtime, package, database, output, and command paths.
    - **Requirements:** 1.1–1.6, 8.9, 14.1–14.6, 19.1–19.7, 20.1–20.8, 21.1–21.10, 24.1–24.8, 26.1–26.7, 28.7–28.20, 29.7–29.10.
    - **Static evidence:** a read-back checklist confirms 22 unique card IDs, 22 audit rows, exact current `markdown/` links, exact directory path syntax, one definition for Route Record/Completion Record/Surface Status/Coverage Gap/Artifact Class/Site Write Gate, and no old flat chapter path. Contradictions stop serial integration rather than being silently resolved.
    - **Dependencies:** 2.4.

- [ ] Checkpoint A — Freeze README vocabulary before chapter augmentation
  - **Owned paths:** read-only comparison of `./agents-work/oando-repository-guide/README.md` and the Task 1 baseline.
  - **Excluded paths:** every write and every command; no chapter, HTML, skill, hook, settings, runtime, package, database, or output change.
  - **Requirements:** Special Requirement 2; Requirements 1.1–1.6, 8.9, 14.1–14.6, 20.1–20.8, 21.1–21.10, 23.10–23.14, 27.4–27.7.
  - **Static evidence:** the handoff records the frozen D01–D22 names, card fields, status enum, gap fields, output destinations, exact workspace boundary, Site Write Gate, and response-contract terms. Any conflict remains open with a next owner action.
  - **Dependencies:** 2.5.

- [ ] 3. Serially augment Markdown chapters 01–10 with current facts, card links, placement rules, and validation boundaries
  - **Owned paths:** one exact Markdown chapter per leaf 3.1–3.10 under `./agents-work/oando-repository-guide/markdown/`; only the current leaf may be written at a time.
  - **Excluded paths:** `./agents-work/oando-repository-guide/html/`, `./agents-work/oando-repository-guide/README.md` after Checkpoint A except for owner-approved conflict repair, `./.kiro/skills/`, hooks/settings, `./site/`, runtime/package/database/deployment files, generated output, and all commands.
  - **Requirements:** 1.1–1.6, 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 7.1–7.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 18.1–18.8, 19.1–19.7, 20.1–20.8, 24.1–24.8, 25.1–25.10, 26.1–26.7, 27.1–27.7, 28.1–28.20, and 29.1–29.10.
  - **Static evidence:** each leaf names its D-card links, exact live paths, evidence/status language, artifact destinations, protected-command boundary, Site Write Gate reference where relevant, and next decision; the read-back confirms no HTML projection was edited during this phase.
  - **Dependencies:** Checkpoint A and the preceding chapter leaf, strictly serial.

  - [ ] 3.1 Augment the repository-map chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/01-repository-map.md`.
    - **Excluded paths:** every other Markdown chapter, README, HTML page, `guide.css`, skill, hook, settings, runtime, package, database, output, and command path.
    - **Requirements:** 1.1–1.6, 7.1, 8.1–8.3, 9.1–9.2, 14.1–14.6, 20.1–20.2, 21.1–21.5, 26.1–26.4, 28.1–28.8.
    - **Static evidence:** the chapter maps D01 and D22 to exact authority paths `./START.md`, `./AGENTS.md`, `./docs/architecture/layout.md`, `./docs/architecture/stack.md`, `./docs/architecture/routes.md`, `./docs/architecture/product-map.md`, `./plans/README.md`, and the current README/chapter path; it labels source/generated/private/legacy/absent paths and preserves the no-guess fallback.
    - **Dependencies:** Checkpoint A.

  - [ ] 3.2 Augment the application-architecture chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/02-application-architecture.md`.
    - **Excluded paths:** all other guide/skill/hook/settings/runtime/package/database/output paths and commands.
    - **Requirements:** 2.2–2.4, 3.1–3.4, 5.1–5.3, 6.1–6.4, 8.1–8.5, 12.5, 20.2, 20.5–20.6, 28.3–28.5.
    - **Static evidence:** route → feature → component → shared/server → platform/persistence trace for D05, D06, D11, and D12; exact paths `./site/app/(site)/`, `./site/app/api/`, `./site/features/site/`, `./site/components/home/`, `./site/focss/site/`, `./site/i18n/`, `./site/app/ooplanner/`, and `./site/app/oostudio/`; explicit Planner/Studio no-cross-import and route-presence proof limitation.
    - **Dependencies:** 3.1.

  - [ ] 3.3 Augment the product-domains chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
    - **Excluded paths:** all other guide/skill/hook/settings/runtime/package/database/output paths and commands.
    - **Requirements:** 2.2–2.8, 2.13, 3.1–3.7, 4.1–4.7, 5.1–5.7, 8.2–8.5, 20.2–20.8, 26.1–26.7.
    - **Static evidence:** D06–D13 sections identify exact starts and matching skills, including marketing/Admin/CRM/catalog, Planner, Studio, AI, `./site/focss/`, `./site/public/`, `./scripts/generate-svg/`, and `./site/lib/ai/mastra/`; the Visual Detail Checklist covers icon abstraction, alignment, spacing, states, responsive/keyboard/reduced-motion behavior; CRM statuses remain distinct; AI is advisory.
    - **Dependencies:** 3.2.

  - [ ] 3.4 Augment the data-api-persistence chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
    - **Excluded paths:** all other guide/skill/hook/settings/runtime/package/output paths, migration/schema edits, database actions, and commands.
    - **Requirements:** 3.1, 4.1–4.4, 6.1–6.10, 7.6, 10.1–10.10, 11.3, 12.5, 18.4, 20.3–20.5, 24.7, 25.1–25.10, 28.3, 29.3.
    - **Static evidence:** D03/D05/D10/D14 guidance cites `./site/proxy.ts`, `./site/lib/security/`, `./site/app/api/`, `./site/lib/apiCatalog.ts`, `./site/platform/supabase/`, both migration directories, `./site/platform/drizzle/schema/`, persistence selectors, disk data roots, and descriptor roots; it distinguishes Products `erpweaiypimorcunaimz` from Admin `rxzpznmxbaoxpikowmfc`, RLS/grants/rollback, mode-aware persistence, production read-only filesystem, and secret boundaries.
    - **Dependencies:** 3.3.

  - [ ] 3.5 Augment the tooling-ci-tech-docs chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`.
    - **Excluded paths:** all other guide/skill/hook/settings/runtime/package/lockfile/output paths, test/build/gate execution, and command changes.
    - **Requirements:** 6.1–6.4, 6.9–6.10, 7.3–7.5, 8.8–8.9, 10.1–10.10, 11.1–11.3, 18.1–18.8, 20.15–20.17, 24.1–24.4, 25.1–25.10, 28.1–28.10, 29.1–29.10.
    - **Static evidence:** D15–D17 cites `./tests/`, its unit/integration/e2e/fixture/helper/tech-docs paths, `./config/build/`, `./Testing-handbook.md`, `./package.json`, `./scripts/`, `./scripts/run-ops.mjs`, `./scripts/ops-command-registry.mjs`, `./docs/architecture/scripts.md`, `./pnpm-workspace.yaml`, `./pnpm-lock.yaml`, `./site/tsconfig.json`, `./tech-docs-generator/`, and `./tech-docs-generator/package.json`; it preserves two Vitest lanes, classifies commands, labels `pnpm run typecheck:scripts` unavailable, and directs output to the correct home.
    - **Dependencies:** 3.4.

  - [ ] 3.6 Augment the operations-infrastructure chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`.
    - **Excluded paths:** all operational source changes, deployment/backup/observability/database/local-service commands, other guide/skill/hook/settings/runtime/package/output paths.
    - **Requirements:** Special Requirement 3.1–3.5; 7.1–7.7, 9.3–9.6, 10.1–10.10, 11.2–11.4, 18.4–18.8, 20.21, 24.1–24.8, 25.1–25.10, 27.2–27.7, 28.1–28.6.
    - **Static evidence:** D21 names `./vercel.json`, `./workers/oando-worker-proxy/`, `./config/observability/`, `./.github/workflows/supabase-backup-r2.yml`, `./OPERATIONS_RUNBOOK.md`, `./scripts/`, `./Failures.md`, and `./site/instrumentation.ts`; it separates read-only planning from deploy/Worker/R2/Supabase/backup/local-service actions and requires target, risk, recovery, command class, authorization, and proof limitation.
    - **Dependencies:** 3.5.

  - [ ] 3.7 Augment the docs-governance-planning chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`.
    - **Excluded paths:** all other guide/skill/hook/settings/runtime/package/database/output paths, plan creation, blocker creation, and commands.
    - **Requirements:** 7.1–7.7, 11.1–11.6, 18.1–18.3, 19.1–19.7, 24.1–24.8, 27.1–27.7, 28.1–28.11.
    - **Static evidence:** D18/D19 maps `./docs/architecture/`, `./docs/database/`, `./docs/governance/`, locked governance files, `./AGENTS.md`, `./DOC-MAP.md`, `./CONTENTS.md`, legacy `./site/data/storage/`, `./results/`, `./generated-documents/`, `./agents-work/`, `./plans/`, `./plans/README.md`, `./Failures.md`, and `./agent-reports/`; every placement names canonical home, rejected alternate, status, and owner decision.
    - **Dependencies:** 3.6.

  - [ ] 3.8 Augment the Kiro-workspace chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`.
    - **Excluded paths:** all `.kiro/` changes, skill activation, Power/MCP configuration, hooks/settings, other guide files, runtime/package/database/output paths, and commands.
    - **Requirements:** 5.1–5.7, 8.1–8.8, 9.1–9.7, 11.2–11.5, 13.1–13.4, 20.20, 27.2–27.7, 28.17.
    - **Static evidence:** D20 distinguishes existing skills, the absent optional `./.kiro/skills/ai-retrieval/SKILL.md`, candidate versus confirmed Powers, `.kiro/mcp/` schema versus `./.kiro/settings/mcp.json` configuration versus connected state, least privilege, no external access by default, and hooks as separate approval work.
    - **Dependencies:** 3.7.

  - [ ] 3.9 Augment the local-generated-environment chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/09-local-generated-environment.md`.
    - **Excluded paths:** local environment values, generated output edits, `./site/` writes, other guide/skill/hook/settings/runtime/package/database paths, and commands.
    - **Requirements:** 2.1, 6.1–6.4, 6.8, 7.3–7.5, 14.1–14.6, 18.1–18.3, 20.2, 20.4, 24.1–24.8, 26.1–26.7, 28.1–28.10, 29.1–29.10.
    - **Static evidence:** D02/D04/D19 classifies `./.env.example`, local environment files, `./package.json`, `./pnpm-workspace.yaml`, `./START.md`, `./site/`, `./config/build/`, `./Failures.md`, `./results/`, `./generated-documents/`, `./agents-work/`, and `./agent-reports/` as template/private/generated/source/legacy; no secret values are copied and no generated file is called editable source.
    - **Dependencies:** 3.8.

  - [ ] 3.10 Augment the quality-validation chapter
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/10-quality-validation.md`.
    - **Excluded paths:** all tests/gates/builds/browser/typecheck/database/deploy/backup/service execution, hook/policy changes, other guide/skill/settings/runtime/package/output paths.
    - **Requirements:** Special Requirement 3.1–3.5; 6.9, 8.8, 10.1–10.10, 12.1–12.5, 18.4–18.8, 24.7–24.8, 25.1–25.10, 27.2–27.7.
    - **Static evidence:** D15/D21 classifies read-only inspection, Normal-Agent Eligible Check, Protected Command, and no-run pending authorization; records Full Gate Failure Triage fields (exact command, root cwd, authorization, hook decision, status, first failed subcommand, output summary, cause classification); preserves gate composition, tests, coverage, baselines, hooks, inline-marker rejection, and unavailable `pnpm run typecheck:scripts` status.
    - **Dependencies:** 3.9.

- [ ] Checkpoint B — Reconcile chapters 01–10 before chapter 11 and skill writes
  - **Owned paths:** read-only comparison of `./agents-work/oando-repository-guide/README.md` and `./agents-work/oando-repository-guide/markdown/01-repository-map.md` through `./agents-work/oando-repository-guide/markdown/10-quality-validation.md`.
  - **Excluded paths:** HTML projection, skills, hooks/settings, runtime/package/database/output paths, and commands.
  - **Requirements:** Special Requirements 1–3; Requirements 1.1–1.6, 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 7.1–7.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 18.1–18.8, 20.1–20.8, 24.1–24.8, 25.1–25.10, 26.1–26.7, 28.1–28.20, and 29.1–29.10.
  - **Static evidence:** a terminology/path matrix confirms all chapter links point into `./agents-work/oando-repository-guide/markdown/`, D-card IDs are stable, output and Site Write Gate rules agree, and all unverified behavior remains labelled. Conflicts invoke the Conflict Stop Rule.
  - **Dependencies:** 3.10.

- [ ] 4. Add chapter 11 Plain-Language Response Contract, 25 copy-paste prompts, and exactly four-role multi-agent procedure
  - **Owned paths:** only `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md` for writes; README and chapters 01–10 are read-only vocabulary inputs.
  - **Excluded paths:** all other guide Markdown, every HTML file and `guide.css`, all skills/hooks/settings, `./site/`, runtime/package/database/deployment/output paths, and commands.
  - **Requirements:** Special Requirements 1–3; Requirements 3.5–3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 18.4–18.8, 21.1–21.10, 22.1–22.7, 23.1–23.14, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.7–28.20, and 29.7–29.10.
  - **Static evidence:** chapter 11 contains the ordered response contract, exactly 25 distinct category blocks, complete safety preamble and category-specific evidence starts, exactly four role names, handoff fields, delegation/review prompts, serial integration, and Conflict Stop Rule; all boundary references use exact `./` paths.
  - **Dependencies:** Checkpoint B.

  - [ ] 4.1 Add the Plain-Language Response Contract and Route/Completion Record rules
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
    - **Excluded paths:** all other guide/HTML/skill/hook/settings/runtime/package/database/output files and commands.
    - **Requirements:** Special Requirements 1.2–1.5 and 2.1–2.4; Requirements 15.1–15.5, 21.6–21.10, 24.8, 25.10, 26.5.
    - **Static evidence:** the 13 fields appear in exactly this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions. The chapter explains specialized terms first, includes artifact fields and Site Write Gate fields for output tasks, and labels omitted proof/fields incomplete with validation state and next owner action.
    - **Dependencies:** Checkpoint B.

  - [ ] 4.2 Add all 25 complete copy-paste Prompt Cookbook blocks
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
    - **Excluded paths:** all other guide/HTML/skill/hook/settings/runtime/package/database/output files and commands.
    - **Requirements:** Requirements 3.5–3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 16.1–16.5, 21.1–21.10, 22.1–22.7, 24.1–24.8, 25.1–25.10, 26.1–26.7, 28.7–28.20, and 29.7–29.10.
    - **Static evidence:** exactly one fenced block for `Understand Repository`, `Find Where to Work`, `Small UI/Icon/Alignment Fix`, `Feature`, `Site UI`, `Planner`, `Studio`, `Admin`, `CRM/Unwired Assessment`, `Catalog/Configurator/Quotes/Inventory`, `Database`, `AI/Retrieval`, `Image/Animation/Assets`, `API/Security`, `Environment`, `Bug/Failing Test`, `Gate-Failure Triage`, `Refactor`, `Documentation`, `Package/Dependency`, `Deployment/Ops`, `Backup/Import/Export`, `Unknown Task`, `Finish Current Task`, and `Emergency Prompt for an Overwhelmed Owner`. Every block includes desired outcome, ordinary-language context, scope boundary, exact category start paths, expected evidence, stop condition, all matching skills, command classification, Protected Command authorization, exact proof or pending state, artifact/output classification, exact workspace boundary, and Site Write Gate wording where applicable. The Emergency block remains one sentence while retaining all safety requirements.
    - **Dependencies:** 4.1.

  - [ ] 4.3 Add the beginner-readable exactly four-role multi-agent procedure and delegation/review prompts
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
    - **Excluded paths:** no fifth coordinator role, no agent-definition/configuration changes, no other guide/HTML/skill/hook/settings/runtime/package/database/output file, and no commands.
    - **Requirements:** Requirements 17.1–17.9, 23.1–23.14, 15.1–15.5, 21.6–21.10, 24.8, and 25.1–25.10.
    - **Static evidence:** exactly these four roles appear: Scout/Map (read-only orientation/evidence), Planner/Risk (read-only scope/risk/routing), Implementer (writes only within recorded exclusive paths), and Verifier/Reporter (read-only reconciliation/reporting). The procedure states maximum four agents, parallelism only for read-only or disjoint paths, ownership before writes, Serial Integration, Conflict Stop Rule, and every Handoff Record field: Objective; Role and Next Owner; Scope; Paths Read and Paths Changed; Route Record; Evidence; Decisions; Coverage Gaps; Validation Command; Repository Root; Authorization State; Hook Decision; Exit Status; Validation Limitation; Blockers; Next Action. Copy-paste delegation/review prompts repeat these boundaries.
    - **Dependencies:** 4.2.

  - [ ] 4.4 Reconcile chapter 11 counts, links, and shared boundary vocabulary
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
    - **Excluded paths:** every other guide/HTML/skill/hook/settings/runtime/package/database/output path and command.
    - **Requirements:** Requirements 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 21.1–21.10, 22.1–22.7, 23.1–23.14, 28.7–28.20, and 29.7–29.10.
    - **Static evidence:** read-back confirms 13 response fields in order, 25 cookbook headings exactly once, four roles and no fifth role, complete Handoff Record, current `markdown/` links, required safety preamble in every block, and consistent output/Site Write Gate terms with README and chapters 01–10.
    - **Dependencies:** 4.3.

- [ ] 5. Update the master router and optionally add the AI/retrieval Package Skill
  - **Owned paths:** `./.kiro/skills/oando-master/SKILL.md`, plus optional `./.kiro/skills/ai-retrieval/SKILL.md` only in the decision-gated branch 5.2.
  - **Excluded paths:** all other `.kiro/` skills, hooks, settings, MCP schemas/configuration, agent definitions, `.config.kiro`, `./site/`, runtime/package/database/deployment/output paths, and commands.
  - **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; Requirements 1.1–1.6, 3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 13.1–13.4, 18.1–18.8, 19.6–19.7, 21.1–21.10, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.7–28.20, and 29.7–29.10.
  - **Static evidence:** the router remains first and prose-only; it references the live README/Markdown paths, additive conditional routing, rejected/no-match reasons, Route/Completion fields, artifact placement, exact workspace boundaries, Site Write Gate, protected-command policy, honest validation, failure triage, gap admissions, and separate-approval work without changing hooks or runtime behavior.
  - **Dependencies:** Checkpoint B and 4.4.

  - [ ] 5.1 Update `oando-master` as the canonical first router and completion contract
    - **Owned paths:** `./.kiro/skills/oando-master/SKILL.md`.
    - **Excluded paths:** `./.kiro/hooks/`, `./.kiro/settings/`, `./.kiro/mcp/`, all other skills, runtime/package/database/deployment/output files, and commands.
    - **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; Requirements 1.1–1.6, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 13.1–13.4, 18.4–18.8, 21.1–21.10, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.7–28.20, and 29.7–29.10.
    - **Static evidence:** the skill states `oando-master` first, Local Evidence before Powers/MCP, all matching skills selected, rejected skills and no-match Local Evidence recorded, exact command classification and dual authorization, Route Record/Completion Record fields, artifact producer ownership, `./tech-docs-generator/` sibling/no-relocation rule, `./results/site/` distinction, Site Write Gate, Full Gate Triage, and no runtime loader/automatic activation claim.
    - **Dependencies:** 4.4.

  - [ ] 5.2 Add the optional AI/retrieval Package Skill only when the guidance branch is selected
    - **Owned paths:** `./.kiro/skills/ai-retrieval/SKILL.md` if selected; otherwise no new file is owned and the absence branch is retained in the README, chapter 08, and router.
    - **Excluded paths:** all AI runtime files under `./site/lib/ai/mastra/` and AI routes, package manifests/lockfiles, providers, external calls, Powers/MCPs, hooks/settings, and commands.
    - **Requirements:** Requirements 5.1–5.7, 8.7, 9.1–9.7, 11.1–11.6, 12.5, 13.1–13.4, 19.6–19.7, 27.1–27.7.
    - **Static evidence:** if created, the skill has a trigger for `./site/lib/ai/mastra/` and listed AI routes, Local Evidence/authority order, every matching-skill rule, advisory-only output, explicit-user application, no unsupported deployed/evaluated claim, artifact and validation contracts, and separate-approval boundary. If not created, the exact absence and fallback to Local Evidence, `repo-map`, and every other matching skill are recorded; the missing skill is never represented as installed.
    - **Dependencies:** 5.1; optional branch decision is recorded before writing.

  - [ ] 5.3 Reconcile router and optional-skill references against the frozen guide vocabulary
    - **Owned paths:** `./.kiro/skills/oando-master/SKILL.md` and, only if 5.2 selected it, `./.kiro/skills/ai-retrieval/SKILL.md`.
    - **Excluded paths:** all guide writes, other skills, hooks/settings/MCP, `.config.kiro`, runtime/package/database/deployment/output paths, and commands.
    - **Requirements:** Requirements 1.1–1.6, 5.1–5.7, 8.1–8.9, 9.1–9.7, 14.1–14.6, 15.1–15.5, 19.6–19.7, 20.1–20.8, 21.1–21.10, 27.4–27.7, 28.7–28.20, and 29.7–29.10.
    - **Static evidence:** a shared-term matrix confirms D01–D22, Route/Completion fields, statuses, gap fields, response order, command labels, role names, exact output destinations, AI fallback, and Separate Approval Work wording agree across the selected skill files and the guide; the absent-AI branch remains explicit when applicable.
    - **Dependencies:** 5.2.

- [ ] Checkpoint C — Freeze Markdown/skill terminology before projection work
  - **Owned paths:** read-only comparison of `./agents-work/oando-repository-guide/README.md`, `./agents-work/oando-repository-guide/markdown/01-repository-map.md` through `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`, `./.kiro/skills/oando-master/SKILL.md`, and optional `./.kiro/skills/ai-retrieval/SKILL.md`.
  - **Excluded paths:** all HTML/`guide.css` writes, hooks/settings/MCP, runtime/package/database/deployment/output paths, and commands.
  - **Requirements:** Special Requirements 1–3; Requirements 1.1–1.6, 8.1–8.9, 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 20.1–20.8, 21.1–21.10, 22.1–22.7, 23.1–23.14, 27.4–27.7, 28.7–28.20, and 29.7–29.10.
  - **Static evidence:** one matrix records every shared term and every changed path; no HTML edit begins until the provenance branch and terms are stable.
  - **Dependencies:** 5.3.

- [ ] 6. Reconcile the HTML projection only after Markdown/HTML source relationship is evidenced
  - **Owned paths:** read-only provenance comparison first; conditional writes only to the matching files under `./agents-work/oando-repository-guide/html/`, `./agents-work/oando-repository-guide/html/guide.css` only if the evidenced method requires it, and `./agents-work/oando-repository-guide/README.md` only to record an unresolved parity gap.
  - **Excluded paths:** all Markdown source edits, all scripts/generators/package changes, `./site/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `.kiro` controls, runtime/database/deployment files, and commands unless a separately authorized owner action is explicitly supplied.
  - **Requirements:** 1.5, 6.3, 6.10, 11.4, 19.1–19.7, 20.4, 20.6–20.8, 24.1–24.8, 26.1–26.7, 27.3–27.7, 28.1–28.20, and 29.1–29.10.
  - **Static evidence:** either a source/projection comparison tied to an evidenced deterministic method and a changed-file list, or an explicit parity-gap record with evidence checked, limitation, next evidence source, owner action, and scope boundary. No filename similarity, rendered appearance, generic docs command, or generated output is treated as proof.
  - **Dependencies:** Checkpoint C and Task 1.2.

  - [ ] 6.1 Confirm the projection decision and map each HTML page to its current Markdown source
    - **Owned paths:** read-only `./agents-work/oando-repository-guide/html/index.html`; `./agents-work/oando-repository-guide/html/repository-map.html`; `./agents-work/oando-repository-guide/html/application-architecture.html`; `./agents-work/oando-repository-guide/html/product-domains.html`; `./agents-work/oando-repository-guide/html/data-api-persistence.html`; `./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`; `./agents-work/oando-repository-guide/html/operations-infrastructure.html`; `./agents-work/oando-repository-guide/html/docs-governance-planning.html`; `./agents-work/oando-repository-guide/html/kiro-workspace.html`; `./agents-work/oando-repository-guide/html/local-generated-environment.html`; `./agents-work/oando-repository-guide/html/quality-and-validation.html`; `./agents-work/oando-repository-guide/html/working-with-kiro.html`; and `./agents-work/oando-repository-guide/html/guide.css`, compared with the Markdown source set.
    - **Excluded paths:** all writes, all generators/scripts, all other repository paths, and all commands.
    - **Requirements:** 1.5, 6.3, 6.10, 11.4, 20.4, 20.6–20.8, 27.3, 29.7.
    - **Static evidence:** a page-by-page map states whether a source relationship is evidenced; unresolved pages are not called stale/current and are assigned to the parity-gap branch.
    - **Dependencies:** 1.2 and Checkpoint C.

  - [ ] 6.2 Apply the evidenced projection branch or record the unresolved parity gap
    - **Owned paths:** if provenance is evidenced, the 12 exact HTML files under `./agents-work/oando-repository-guide/html/` and `./agents-work/oando-repository-guide/html/guide.css` only when required by the evidenced method; if provenance is unresolved, only `./agents-work/oando-repository-guide/README.md` for the Coverage-Gap Admission/parity note.
    - **Excluded paths:** no HTML write when provenance is unresolved; no invented generator, no Markdown rewrite, no runtime/script/package change, no relocation, and no `./site/` or `./results/` output.
    - **Requirements:** 1.5, 11.4, 19.1–19.7, 20.6–20.8, 24.1–24.8, 26.1–26.7, 27.3–27.7, 28.1–28.20, and 29.1–29.10.
    - **Static evidence:** the selected branch has a file list and comparison: confirmed source method → matching navigation/content anchors and projection update; unresolved relationship → no HTML change plus a gap card naming limitation, next evidence source, owner action, and no-relocation statement. Rendered behavior and generator success remain unclaimed.
    - **Dependencies:** 6.1.

- [ ] 7. Perform static documentation validation, requirement/property reconciliation, and open-state completion handoff
  - **Owned paths:** read-only reconciliation of `./agents-work/oando-repository-guide/README.md`, all 11 Markdown paths under `./agents-work/oando-repository-guide/markdown/`, conditional HTML paths under `./agents-work/oando-repository-guide/html/`, `./.kiro/skills/oando-master/SKILL.md`, optional `./.kiro/skills/ai-retrieval/SKILL.md`, `./.kiro/specs/oando-master/requirements.md`, `./.kiro/specs/oando-master/design.md`, and this `./.kiro/specs/oando-master/tasks.md`; any authored completion handoff uses `./agents-work/oando-repository-guide/`.
  - **Excluded paths:** all tests, gates, builds, browser checks, typechecks, database/deployment/backup/service commands, hooks/settings/runtime/package/database/output changes, Power/MCP activation, relocation, and any write under `./site/`.
  - **Requirements:** Special Requirements 1–3 and Requirements 1.1–1.6, 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 7.1–7.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 13.1–13.4, 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 18.1–18.8, 19.1–19.7, 20.1–20.8, 21.1–21.10, 22.1–22.7, 23.1–23.14, 24.1–24.8, 25.1–25.10, 26.1–26.7, 27.1–27.7, 28.1–28.20, and 29.1–29.10.
  - **Static evidence:** one final inventory and Completion Record distinguishes changed guidance scope, selected/rejected skills, observed static proof, unresolved gaps, exact pending owner-controlled checks, artifact placement, Site Write Gate result, Separate Approval Work, and any True Blocker; no unsupported pass, rendered, hosted, connected, installed, or relocation claim.
  - **Dependencies:** Task 6.2; optional property tasks below are future, decision-gated checks and do not authorize current execution.

  - [ ] 7.1 Audit exact static inventories and response/card/handoff contracts
    - **Owned paths:** read-only all changed README/Markdown/HTML/skill paths listed by Task 7.
    - **Excluded paths:** all code/test/checker creation and all commands; no documentation edits outside the owning prior task.
    - **Requirements:** 2.1–2.14, 8.9, 15.1–15.5, 16.1–16.5, 17.1–17.9, 20.1–20.8, 21.1–21.10, 22.1–22.7, 23.1–23.14, 26.1–26.7, 28.18–28.20.
    - **Static evidence:** counts and identifiers show exactly 22 cards and audit rows, exactly 25 cookbook categories, exactly four roles, all card/Handoff fields, 13 response fields in order, complete preamble, Surface Status enum, gap fields, and ordered Evidence Steps.
    - **Dependencies:** 6.2.

  - [ ] 7.2 Audit cross-links, exact paths, ownership, and serial scope
    - **Owned paths:** read-only all changed guide and skill paths, plus `./.kiro/specs/oando-master/tasks.md` for task ownership review.
    - **Excluded paths:** no fixes outside the owning task paths, no runtime/checker/generator/package/hook/settings changes, and no commands.
    - **Requirements:** 1.1–1.6, 8.9, 11.1–11.6, 17.4–17.9, 20.2–20.8, 23.7–23.14, 27.1–27.7, 28.7–28.20, and 29.7–29.10.
    - **Static evidence:** README ↔ Markdown links, chapter previous/next links, D-card links, response/cookbook/multi-agent links, and conditional HTML links are checked against the live subfolders; changed paths match ownership; no overlapping write lacks serial integration; no old flat chapter path remains.
    - **Dependencies:** 7.1.

  - [ ] 7.3 Audit artifact placement, workspace boundaries, Site Write Gate, and pending validation
    - **Owned paths:** read-only changed-path inventory plus `./agents-work/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./results/site/`, `./plans/README.md`, `./Failures.md`, hooks, settings, package manifests, migrations, deployment assets, and `.config.kiro` for unchanged-boundary comparison.
    - **Excluded paths:** no artifact movement, command execution, hook/policy change, runtime/package/database/deployment action, or `./site/` write.
    - **Requirements:** 6.9–6.10, 7.1–7.7, 9.3–9.6, 10.1–10.10, 11.2–11.6, 18.1–18.8, 24.1–24.8, 25.1–25.10, 27.2–27.7, 28.1–28.20, and 29.1–29.10.
    - **Static evidence:** the audit confirms guide work stays in the approved workstream, machine output would use purpose subfolders, generated tech-docs stays in `./generated-documents/`, active separate work belongs under `./plans/<name>/`, blockers only in `./Failures.md`, `./tech-docs-generator/` remains a root sibling of `./site/`, `./results/site/` is not source, Site Write Gate rejects Non-Core Artifacts, hooks/settings/manifests/runtime/migrations/deployment assets are unchanged, and every owner-controlled command remains pending because this workflow runs none.
    - **Dependencies:** 7.2.

  - [ ] 7.4 Reconcile every requirement, design property, gap, and open task state
    - **Owned paths:** read-only `./.kiro/specs/oando-master/requirements.md`, `./.kiro/specs/oando-master/design.md`, `./.kiro/specs/oando-master/tasks.md`, all changed guide paths, and selected skill paths.
    - **Excluded paths:** no task checkmark changes, no new checker, no test/gate command, no separate-approval implementation, and no file outside the current guidance scope.
    - **Requirements:** Special Requirements 1–3; Requirements 1–29; Design Properties 1–15.
    - **Static evidence:** a requirement-to-task matrix maps every acceptance criterion to an open implementation or static-audit leaf; Properties 1–15 map to the optional property leaves below; the stale completed plan has been replaced; tasks without exact proof remain open/pending; optional AI and HTML provenance branches, placement rules, no-relocation rule, Site Write Gate, and Separate Approval Work are represented.
    - **Dependencies:** 7.3.

  - [ ] 7.5 Produce the final Plain-Language Completion Record and owner handoff without unsupported claims
    - **Owned paths:** read-only changed artifacts; authored handoff, if persisted, uses `./agents-work/oando-repository-guide/<report-type>/` and never `./results/`.
    - **Excluded paths:** no implementation outside approved guidance files, no command/test/gate/build/browser/database/deploy/backup/service action, no task completion mark merely for file changes, and no relocation claim.
    - **Requirements:** Special Requirements 1–3; Requirements 2.1–2.4, 7.1–7.7, 10.1–10.10, 15.1–15.5, 18.1–18.8, 19.1–19.7, 24.1–24.8, 25.1–25.10, 26.1–26.7, 27.1–27.7, 28.1–28.20, and 29.1–29.10.
    - **Static evidence:** the handoff uses the 13-field Contract order, repeats changed scope, selected/rejected skills, static proof, pending owner-controlled checks, Coverage-Gap Admissions, artifact placement, Site Write Gate, Separate Approval Work, and True Blockers only when evidenced in root `./Failures.md`; it explicitly states that rendered behavior, hosted persistence, MCP connection, Power availability, successful commands, and Full Gate outcome were not established by static inspection.
    - **Dependencies:** 7.4.

  - [ ]* 7.6 Write the optional static/property check for Property 1: First-router authority and Begin Here ordering
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current guide/skill files are read-only fixtures.
    - **Excluded paths:** no current implementation, no runtime router, no hook/settings/runtime/package/database/output change, and no test execution in this guidance workflow.
    - **Requirements:** Special Requirement 1.1–1.5; Requirements 1.1–1.5, 8.1–8.2, 8.9, 14.1–14.6, and 21.1–21.5.
    - **Static evidence:** a future property fixture would assert first read of `oando-master`, authority ordering, exact first paths, Domain Index selection, Workflow Mode/risk/command classification, and owner decision only after routing; it remains unimplemented and unrun unless separately approved.
    - **Dependencies:** 7.4.

  - [ ]* 7.7 Write the optional static/property check for Property 2: Complete additive Route Records
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no current guide/skill edits, no runtime route discovery, no hooks/settings/runtime/package/database/output change, and no test execution.
    - **Requirements:** Special Requirement 1.2–1.5; Requirements 8.3–8.9, 9.1–9.2, and 9.7.
    - **Static evidence:** a future property fixture would assert outcome, domain, candidate paths, every matching selected skill, rejected reasons, risk, command classes, validation state, Local Evidence no-match route, and Completion Record preservation; it remains pending.
    - **Dependencies:** 7.6.

  - [ ]* 7.8 Write the optional static/property check for Property 3: Complete 22-card coverage and ordered evidence
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no current guide edits, no new runtime checker, no commands, and no file outside the future test path.
    - **Requirements:** Special Requirement 2.1; Requirements 2.1–2.14, 20.1–20.5, 20.7–20.8.
    - **Static evidence:** a future property fixture would assert the common card fields, exact Start Paths/discovery labels, chapter mapping, classifier fields, ordered Evidence Steps, one Coverage Audit row, and D22 routing outside the baseline; it remains pending.
    - **Dependencies:** 7.7.

  - [ ]* 7.9 Write the optional static/property check for Property 4: Ordered Plain-Language Response Contract
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no current guide edits, no runtime response validator, no commands, and no other file path.
    - **Requirements:** Special Requirement 2.2–2.4; Requirements 15.1–15.5, 21.6–21.10, and 22.7.
    - **Static evidence:** a future property fixture would assert the 13 fields in order, specialized-term explanation, and incomplete/missing-proof state with validation status and next owner action; it remains pending.
    - **Dependencies:** 7.8.

  - [ ]* 7.10 Write the optional static/property check for Property 5: Complete safe Prompt Cookbook
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no current prompt edits, no runtime prompt loader, no commands, and no other file path.
    - **Requirements:** Requirements 16.1–16.5 and 22.1–22.7.
    - **Static evidence:** a future property fixture would assert exactly 25 categories, complete preamble, placeholders, scope, exact evidence starts, expected evidence, stop condition, additive skill selection, command classification, dual authorization, and exact proof/pending request; it remains pending.
    - **Dependencies:** 7.9.

  - [ ]* 7.11 Write the optional static/property check for Property 6: Conditional skill routing and local-first capability selection
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no Power activation, MCP connection, skill-loader runtime, hook/settings change, command, or other file path.
    - **Requirements:** Requirements 3.7, 5.1–5.7, 8.1–8.8, 9.3–9.7, and 13.1–13.4.
    - **Static evidence:** a future property fixture would assert all matching skills selected, non-matches rejected, Local Evidence before Powers/MCPs, registry confirmation before optional capability, and distinct MCP schema/configuration/connection states; it remains pending.
    - **Dependencies:** 7.10.

  - [ ]* 7.12 Write the optional static/property check for Property 7: UI, fork, and AI evidence boundaries
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no product UI/runtime/fork/AI change, no browser/provider command, and no other file path.
    - **Requirements:** Requirements 3.1–3.6, 5.3, 5.7, and 12.5.
    - **Static evidence:** a future property fixture would assert route-to-feature/component/FOCSS guidance, Visual Detail Checklist and asset/motion safeguards, Planner/Studio no-cross-import, and advisory-only AI claims; it remains pending.
    - **Dependencies:** 7.11.

  - [ ]* 7.13 Write the optional static/property check for Property 8: Evidence-labelled technical and data ownership
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no schema/migration/type/seed/database action, no runtime change, no command, and no other file path.
    - **Requirements:** Requirements 6.1–6.10, 10.5, and 11.6.
    - **Static evidence:** a future property fixture would assert evidence status/source for package/framework/command/route/database/asset/persistence claims, Products/Admin selection, correct migration path, mode-aware persistence, and live-evidence precedence; it remains pending.
    - **Dependencies:** 7.12.

  - [ ]* 7.14 Write the optional static/property check for Property 9: Typed artifact placement and producer ownership
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no report under `./results/`, no artifact move, no generated-output edit, no `./site/` write, and no command.
    - **Requirements:** Special Requirement 3.5; Requirements 7.1–7.7, 18.1–18.3, and 24.1–24.8.
    - **Static evidence:** a future property fixture would assert Workstream/Purpose Subfolder, filename pattern, owning source/script, authored/generated state, rejected placements, and Completion Record repetition for all artifact classes; it remains pending.
    - **Dependencies:** 7.13.

  - [ ]* 7.15 Write the optional static/property check for Property 10: Protected Command permission and honest validation
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no Protected Command execution, hook change, policy change, typecheck/test/gate/build/browser/database/deploy/backup/service command, and no other file path.
    - **Requirements:** Requirements 10.1–10.10, 18.4–18.6, and 25.1–25.10.
    - **Static evidence:** a future property fixture would assert dual authorization, pending state without either permission, named-check eligibility only, inline-marker rejection, and exact validation observation fields; it remains pending.
    - **Dependencies:** 7.14.

  - [ ]* 7.16 Write the optional static/property check for Property 11: Failure Triage preserves controls
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no gate/hook/baseline/test-selection change, no Full Gate or diagnostic command, and no other file path.
    - **Requirements:** Special Requirement 3.1–3.5; Requirements 18.7–18.8, 24.7–24.8, and 25.7–25.9.
    - **Static evidence:** a future property fixture would assert read-only triage before control proposals, exact failure fields, unverified cause without current output, smallest authorized diagnostic, and preserved controls; it remains pending.
    - **Dependencies:** 7.15.

  - [ ]* 7.17 Write the optional static/property check for Property 12: Exactly four roles and conflict-safe integration
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no agent definitions, multi-agent runtime, overlapping writes, command, or other file path.
    - **Requirements:** Requirements 17.1–17.9 and 23.1–23.14.
    - **Static evidence:** a future property fixture would assert exactly four role names, maximum four active agents, read-only/disjoint parallelism, ownership before writes, complete handoff fields, and conflict stop before owner review/Serial Integration; it remains pending.
    - **Dependencies:** 7.16.

  - [ ]* 7.18 Write the optional static/property check for Property 13: Surface Status and Coverage-Gap no-overclaim
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no surface/runtime changes, no hosted check, no command, and no other file path.
    - **Requirements:** Requirements 4.1–4.7, 19.1–19.7, and 26.1–26.7.
    - **Static evidence:** a future property fixture would assert allowed status, source, limitation, next evidence source, owner action, scope, next decision, response/completion propagation, and no wired/complete claim without End-to-End Evidence; it remains pending.
    - **Dependencies:** 7.17.

  - [ ]* 7.19 Write the optional static/property check for Property 14: Minimal scope, approval separation, and task-state honesty
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no hook/policy/runtime/package/database/deployment/backup/MCP/Power work, no task-state mutation in this workflow, and no other file path.
    - **Requirements:** Requirements 11.1–11.6, 12.1–12.5, 13.1–13.4, 19.6–19.7, and 27.1–27.7.
    - **Static evidence:** a future property fixture would assert smallest sound change, narrowest proof, Separate Approval Work, open/pending downstream state, `./plans/<name>/` placement, and explicit unimplemented separate work; it remains pending.
    - **Dependencies:** 7.18.

  - [ ]* 7.20 Write the optional static/property check for Property 15: Exact workspace boundaries and Site Write Gate
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`.
    - **Excluded paths:** no `./site/` write, no workspace relocation, no generator/package/runtime change, no Site Write Gate bypass, and no command.
    - **Requirements:** Requirements 28.1–28.20 and 29.1–29.10.
    - **Static evidence:** a future property fixture would assert exact `./` directory forms, root-level sibling relationship, separate `./generated-documents/`, distinct `./results/site/`, Core Product Write versus Non-Core Artifact classification, redirect/stop behavior, required fields, and no relocation claim; it remains pending.
    - **Dependencies:** 7.19.

## Notes

- Tasks marked with `*` are optional future static/property checks because the design defines correctness properties. They are decision-gated, do not authorize a test runner, and must not be implemented in the current guidance-only workflow unless separately approved.
- The current requested operation changes only this `./.kiro/specs/oando-master/tasks.md` file. It does not execute any implementation task, static checker, test, gate, build, browser workflow, service, database action, deployment, backup, Power activation, MCP connection, or relocation.
- Every future implementation leaf names exclusive owned paths, excluded paths, requirement clauses, concrete static evidence, and a serial dependency. If evidence is unavailable, the task stays open or pending and names the next owner action; no task becomes complete merely because a file changed.
- Agent reports remain under `./agents-work/<workstream>/<report-type>/`; machine output remains under `./results/<purpose>/`; generated tech-docs remains under `./generated-documents/`; `./tech-docs-generator/` remains a root-level sibling of `./site/`; `./results/site/` remains distinct from `./site/`; and no relocation is claimed.
- `./site/` accepts only explicitly approved Core Product Writes. This guidance plan writes no product source and redirects every report/result/skill/prompt/non-core proposal away from `./site/`.
- Protected Commands remain user-authorized and hook-permitted. Hook source, policy, runtime code, package/dependency files, database files, deployment files, MCP settings, and `.config.kiro` are outside the plan’s write scope.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4"] },
    { "id": 4, "tasks": ["2.1"] },
    { "id": 5, "tasks": ["2.2"] },
    { "id": 6, "tasks": ["2.3"] },
    { "id": 7, "tasks": ["2.4"] },
    { "id": 8, "tasks": ["2.5"] },
    { "id": 9, "tasks": ["3.1"] },
    { "id": 10, "tasks": ["3.2"] },
    { "id": 11, "tasks": ["3.3"] },
    { "id": 12, "tasks": ["3.4"] },
    { "id": 13, "tasks": ["3.5"] },
    { "id": 14, "tasks": ["3.6"] },
    { "id": 15, "tasks": ["3.7"] },
    { "id": 16, "tasks": ["3.8"] },
    { "id": 17, "tasks": ["3.9"] },
    { "id": 18, "tasks": ["3.10"] },
    { "id": 19, "tasks": ["4.1"] },
    { "id": 20, "tasks": ["4.2"] },
    { "id": 21, "tasks": ["4.3"] },
    { "id": 22, "tasks": ["4.4"] },
    { "id": 23, "tasks": ["5.1"] },
    { "id": 24, "tasks": ["5.2"] },
    { "id": 25, "tasks": ["5.3"] },
    { "id": 26, "tasks": ["6.1"] },
    { "id": 27, "tasks": ["6.2"] },
    { "id": 28, "tasks": ["7.1"] },
    { "id": 29, "tasks": ["7.2"] },
    { "id": 30, "tasks": ["7.3"] },
    { "id": 31, "tasks": ["7.4"] },
    { "id": 32, "tasks": ["7.5"] },
    { "id": 33, "tasks": ["7.6"] },
    { "id": 34, "tasks": ["7.7"] },
    { "id": 35, "tasks": ["7.8"] },
    { "id": 36, "tasks": ["7.9"] },
    { "id": 37, "tasks": ["7.10"] },
    { "id": 38, "tasks": ["7.11"] },
    { "id": 39, "tasks": ["7.12"] },
    { "id": 40, "tasks": ["7.13"] },
    { "id": 41, "tasks": ["7.14"] },
    { "id": 42, "tasks": ["7.15"] },
    { "id": 43, "tasks": ["7.16"] },
    { "id": 44, "tasks": ["7.17"] },
    { "id": 45, "tasks": ["7.18"] },
    { "id": 46, "tasks": ["7.19"] },
    { "id": 47, "tasks": ["7.20"] }
  ]
}
```

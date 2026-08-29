# Implementation Plan: Oando Master Repository Guide and Router

## Overview

Replace the stale downstream plan with an open, serial, evidence-bound plan for the current guidance/documentation deliverable. The implementation scope is repository guidance only: the beginner guide, its current Markdown chapters, an evidenced static HTML projection, the canonical `oando-master` skill, and the explicitly selected optional AI guidance skill. No product runtime, hook policy, package, database, deployment, MCP connection, Power activation, workspace relocation, or automatic agent-spawning implementation is included.

The live guide layout is authoritative and must be used exactly:

- Start page: `./agents-work/oando-repository-guide/README.md`
- Markdown chapters:
  - `./agents-work/oando-repository-guide/markdown/01-repository-map.md`
  - `./agents-work/oando-repository-guide/markdown/02-application-architecture.md`
  - `./agents-work/oando-repository-guide/markdown/03-product-domains.md`
  - `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`
  - `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`
  - `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`
  - `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`
  - `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`
  - `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`
  - `./agents-work/oando-repository-guide/markdown/10-quality-validation.md`
  - `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`
- HTML projection:
  - `./agents-work/oando-repository-guide/html/index.html`
  - `./agents-work/oando-repository-guide/html/repository-map.html`
  - `./agents-work/oando-repository-guide/html/application-architecture.html`
  - `./agents-work/oando-repository-guide/html/product-domains.html`
  - `./agents-work/oando-repository-guide/html/data-api-persistence.html`
  - `./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`
  - `./agents-work/oando-repository-guide/html/operations-infrastructure.html`
  - `./agents-work/oando-repository-guide/html/docs-governance-planning.html`
  - `./agents-work/oando-repository-guide/html/kiro-workspace.html`
  - `./agents-work/oando-repository-guide/html/local-generated-environment.html`
  - `./agents-work/oando-repository-guide/html/quality-and-validation.html`
  - `./agents-work/oando-repository-guide/html/working-with-kiro.html`
  - `./agents-work/oando-repository-guide/html/guide.css`
- Canonical router: `./.kiro/skills/oando-master/SKILL.md`
- Optional AI guidance: `./.kiro/skills/ai-retrieval/SKILL.md`, only if the owner explicitly selects that branch; otherwise the absence/fallback branch is documented and no file is created.

This downstream plan describes changes only to the approved guidance artifacts listed in the Overview; it does not authorize application code, product UI, runtime, package, configuration, database, deployment, hook, or other implementation changes. A review of this existing spec may update `requirements.md`, `design.md`, and this `tasks.md`, but it does not create a new spec or change `./.kiro/specs/oando-master/.config.kiro`. All checkboxes below are intentionally open. A downstream task remains open until its stated static evidence is recorded; a file edit alone is not completion proof.

## Execution contract and boundaries

- **Required task-generation instruction:** Convert the feature design into a series of prompts for a code-generation LLM that will implement each approved guidance step with incremental progress. Make sure that each prompt builds on the previous prompts and ends with wiring the approved guidance together. There should be no hanging or orphaned guidance. Focus ONLY on writing or modifying approved guidance artifacts and on static review of those artifacts; this plan does not authorize tests, gates, builds, typechecks, scripts, package/configuration changes, UI changes, application implementation, or implementation commands.
- **Current deliverable boundary:** guide prose, guide navigation, task cards, coverage/status/gap records, Prompt Cookbook prose, Standing Multi-Agent Mode prose and prompts, skill-routing prose, the evidenced HTML projection, and the optional AI Package Skill guidance only when explicitly selected.
- **Write ownership:** README leaves own only `./agents-work/oando-repository-guide/README.md`; chapter leaves own exactly one current Markdown file; router leaves own only `./.kiro/skills/oando-master/SKILL.md`; optional AI owns only `./.kiro/skills/ai-retrieval/SKILL.md` when selected; HTML leaves own only the exact HTML projection files named above when provenance is evidenced. Shared vocabulary and shared files are serially integrated.
- **Locked Path Gate:** `./docs/`, `./Agents/`, and root-level `./*.md` are read-only evidence by default. Only an exact file explicitly named and authorized by the Repository Owner in the current request may be written. `./Failures.md` remains locked without exact-file authorization; supporting analysis belongs under `./agents-work/<workstream>/<report-type>/`. `./agents-work/` is distinct from `./Agents/`. No copy elsewhere may claim that a locked file was updated.
- **Artifact placement:** agent-authored reports and handoffs use `./agents-work/<workstream>/<report-type>/`; Machine Evidence uses `./results/<purpose>/`; tech-docs output uses `./generated-documents/`; active plan material uses `./plans/<name>/`; true blockers use only root `./Failures.md` when that exact file is explicitly authorized. No new root-level report/result is allowed.
- **Workspace boundary:** `./tech-docs-generator/` remains a root-level sibling of `./site/`; `./generated-documents/` remains separate; `./results/site/` is Machine Evidence and is distinct from `./site/`; no relocation is performed or claimed.
- **Site Write Gate:** before any proposed write under `./site/`, the Route Record must classify the target as an explicitly approved Core Product Write or a Non-Core Artifact. Only the former may proceed with exact outcome, exclusive paths, matching skills, and expected evidence. Reports, results, audits, handoffs, prompts, plans, skills, steering, MCP definitions, generated files, temporary/debug files, and all other Non-Core Artifacts are prohibited under `./site/` and must be redirected.
- **Protected Commands:** tests, gates, coverage, browser runs, builds, typechecks, deployments, database actions, backups, local services, external actions, and any other user-owned validation remain exact-current-session user-authorized and hook-permitted. No such command is implied or run by this plan. `pnpm run typecheck:scripts` is unavailable while `./scripts/tsconfig.json` is absent and must not be suggested as validation.
- **Evidence limit:** static document/path/link/count/scope inspection cannot prove rendered behavior, hosted persistence, a successful command, a Full Gate result, connected MCP state, installed Power state, or automatic runtime behavior. Missing proof remains pending or a Coverage-Gap Admission with the next owner action.
- **Serial integration:** every leaf depends on its preceding vocabulary or ownership decision. Parallel writes are not planned. Read-only research may be parallelized only if an owner later records disjoint ownership, but the task graph remains serial because README, chapter terminology, prompts, skill triggers, artifact fields, and HTML projection share concepts.
- **Standing Multi-Agent Mode:** the downstream implementation must document it as the default for every Repository Task: at least Scout/Map plus Planner/Risk before exploration or writes when available, maximum four Agents, read-only/disjoint parallelism only, explicit Agent Roster, Ownership Matrix, Route Record, Handoff Record register, Conflict Stop Rule, Serial Integration Owner, no silent single-Agent fallback, owner status before implementation, and Completion Record after verification. This is guidance only; runtime spawning is Separate Approval Work.
- **Agent Compliance Contract:** every Agent must first read the complete current user request and the applicable global repository standard (`AGENTS.md` plus the directly applicable standard it names), then state the requested outcome, assigned scope, exact owned paths and permissions, exclusions, delivery conditions, next owner, and validation state before work. User instructions outrank defaults; the global standard applies unless the user explicitly overrides a specific rule. Agents perform only requested/in-scope work, never infer permission for adjacent cleanup, tests, scripts, documentation, package/configuration changes, UI changes, or other helpful additions, preserve unrelated work, fix small in-scope quality defects without unrelated expansion, and stop on conflicts, missing authorization, ambiguous ownership, hidden constraints, contradictory evidence, or task expansion.
- **Scope-drift control:** scope drift can arise from ambiguous ownership, default helpful behavior, hidden repository constraints, or task expansion. Exact owned paths and exclusions, live-evidence and standard reading, Route/Ownership records, explicit delivery conditions, and coordinator review prevent it. The coordinator must reject or reconcile drift before integration, use no more than four Agents, keep parallel ownership disjoint, integrate serially, and invoke the Conflict Stop Rule before affected writes.
- **Plain-language handoff:** each handoff must list every changed file and why it changed, validation actually run with exact observed results or `none`, validation not run with the exact pending/unauthorized reason, remaining issues and next owner action, and the scope/exclusions respected. A missing field or unexplained file leaves the handoff incomplete.
- **Repository boundaries in the contract:** `./docs/`, `./Agents/`, and root-level `./*.md` remain Locked Paths; authored reports use `./agents-work/<workstream>/<report-type>/`; machine output uses `./results/<purpose>/`; `./tech-docs-generator/` remains beside `./site/`; and `./site/` accepts only explicitly approved Core Product Writes. Tests/scripts are not assumed from `package.json` or ordinary test configuration and require repository evidence plus exact authorization before any execution. No tests, gates, builds, typechecks, scripts, or implementation commands are authorized by this planning artifact.

## Tasks

- [ ] 1. Establish the evidence, provenance, artifact, locked-path, and routing baseline
  - **Owned paths:** read-only inspection of the exact guide files listed in the Overview; `./package.json`; `./pnpm-workspace.yaml`; `./scripts/`; `./tech-docs-generator/`; `./generated-documents/`; `./results/`; `./site/`; `./plans/README.md`; `./Failures.md`; `./docs/`; `./Agents/`; root-level `./*.md`; `./.kiro/skills/`; `./.kiro/hooks/`; `./.kiro/settings/mcp.json`; `./.kiro/mcp/`; `./.kiro/agents/`; `./skills-lock.json`; and `./.kiro/specs/oando-master/.config.kiro`.
  - **Excluded paths:** every write except the current `tasks.md` planning operation; no guide, HTML, skill, hook, settings, runtime, package, database, deployment, result, generated-output, relocation, Power, MCP, or command change.
  - **Dependency:** none.
  - **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; Requirements 1.1–1.6, 6.1–6.10, 7.1–7.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 18.1–18.8, 19.1–19.7, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, and 31.1–31.10.
  - **Static evidence:** one baseline Route/Handoff record inventories exact guide paths, provenance candidates, current skills and hooks, artifact homes, locked targets, workspace boundaries, Standing Multi-Agent constraints, unresolved gaps, and next owner decisions without claiming any observed command result or relocation.

  - [ ] 1.1 Inventory the exact README, Markdown, HTML, and CSS guide surfaces
    - **Owned paths:** read-only `./agents-work/oando-repository-guide/README.md`; all eleven exact Markdown paths under `./agents-work/oando-repository-guide/markdown/`; all twelve exact HTML paths under `./agents-work/oando-repository-guide/html/`; and `./agents-work/oando-repository-guide/html/guide.css`.
    - **Excluded paths:** every write to the guide or any other repository path; no generator, command, HTML/Markdown edit, or renamed/guessed chapter path.
    - **Dependency:** none.
    - **Requirements:** Requirements 1.2, 1.5, 2.1–2.14, 20.1–20.8, 29.7, and 31.1–31.3.
    - **Static evidence:** a file-by-file inventory records headings, README links, chapter previous/next links, HTML navigation, projection filenames, CSS references, and observed content differences; filename similarity is explicitly not synchronization proof. The inventory contains exactly the paths listed in the Overview.

  - [ ] 1.2 Determine Markdown-to-HTML provenance without running or inventing a generator
    - **Owned paths:** read-only `./package.json`; `./scripts/`; `./tech-docs-generator/`; `./docs/`; `./Agents/`; `./.github/`; `./config/`; `./generated-documents/`; and every reference to `./agents-work/oando-repository-guide/` found in the repository.
    - **Excluded paths:** no `pnpm` invocation; no `docs:sync`, generator, script, HTML, Markdown, package, or configuration edit; no claim based only on matching filenames; no new generator.
    - **Dependency:** 1.1.
    - **Requirements:** Requirements 1.5, 6.1, 6.3, 6.10, 11.4, 19.1–19.7, 20.4, 20.6–20.8, 27.3, and 29.6–29.7.
    - **Static evidence:** a provenance record classifies the relationship as Markdown source, HTML source, evidenced deterministic transformation, or unresolved; names every inspected source reference; distinguishes guide projection from unrelated generated inventories; and, if unresolved, specifies a parity-gap card, no HTML edit, next evidence source, owner action, and boundary.

  - [ ] 1.3 Establish artifact placement, root-artifact handling, and exact workspace boundaries
    - **Owned paths:** read-only `./agents-work/`; `./agents-work/oando-repository-guide/`; `./results/`; `./results/tests/`; `./results/site/`; `./results/site-ui/`; `./results/ops/`; `./generated-documents/`; `./tech-docs-generator/`; `./site/`; `./plans/`; `./plans/README.md`; `./Failures.md`; `./agent-reports/`; and any observed root-level result artifact.
    - **Excluded paths:** no move, rename, cleanup, regeneration, hand-edit of generated output, `./site/` write, root report/result creation, or relocation claim.
    - **Dependency:** 1.1.
    - **Requirements:** Requirements 7.1–7.7, 18.1–18.3, 19.1–19.7, 24.1–24.8, 27.6, 28.1–28.20, 29.1–29.10, and 30.24–30.26.
    - **Static evidence:** a placement ledger assigns authored work to `./agents-work/<workstream>/<report-type>/`, Machine Evidence to `./results/<purpose>/`, tech-docs output to `./generated-documents/`, active plans to `./plans/<name>/`, and true blockers to root `./Failures.md` only with exact authorization. It rejects the `./agents-work/` and `./results/` roots, distinguishes `./results/site/` from `./site/`, keeps `./tech-docs-generator/` beside `./site/`, and labels unassigned root artifacts `legacy/owner-review pending` without claiming reorganization.

  - [ ] 1.4 Establish current skills, hook permissions, MCP states, protected commands, and unchanged control files
    - **Owned paths:** read-only `./.kiro/skills/`; `./.kiro/skills/oando-master/SKILL.md`; `./.kiro/skills/repo-map/SKILL.md`; `./.kiro/skills/db-migrations/SKILL.md`; `./.kiro/skills/focss-css/SKILL.md`; `./.kiro/skills/fork-boundaries/SKILL.md`; `./.kiro/skills/planner-studio/SKILL.md`; `./.kiro/skills/graph-impact/SKILL.md`; `./.kiro/skills/powers-skills-model/SKILL.md`; `./.kiro/skills/verify-and-gate/SKILL.md`; absent/present `./.kiro/skills/ai-retrieval/SKILL.md`; `./.kiro/hooks/block-agent-tests.json`; `./.kiro/hooks/block-agent-tests.mjs`; `./.kiro/settings/mcp.json`; `./.kiro/mcp/`; `./.kiro/agents/`; `./skills-lock.json`; and `./.kiro/specs/oando-master/.config.kiro`.
    - **Excluded paths:** no skill, AI, hook, settings, MCP, Power, agent-definition, package, runtime, or `.config.kiro` change; no Power activation, external connection, Protected Command, or runtime spawning.
    - **Dependency:** 1.1 and 1.2.
    - **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; Requirements 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.2–11.6, 13.1–13.4, 18.4–18.8, 25.1–25.10, 27.1–27.7, 30.1–30.3, 30.6, 30.8–30.10, 30.19–30.20, 30.27, and 31.8.
    - **Static evidence:** a boundary ledger lists present skills, the optional AI absence state, matching/rejected routing candidates, hook matcher behavior, Protected Command families, the distinction between MCP schema/configuration/connection and Power registry/availability, the `pnpm run typecheck:scripts` unavailable state, the unchanged `.config.kiro`, and the prohibition on automatic spawning.

- [ ] 2. Build the README Begin Here entry point, exact 22-card Domain Index, classifier, Coverage Audit, statuses, gap cards, placement reference, Locked Path Gate, and Site Write Gate
  - **Owned paths:** only `./agents-work/oando-repository-guide/README.md` for writes; Task 1 evidence and all live chapter/HTML/skill paths are read-only inputs.
  - **Excluded paths:** all chapter and HTML writes; `./.kiro/skills/`; `./.kiro/hooks/`; `./.kiro/settings/`; `./site/`; `./results/`; `./generated-documents/`; `./tech-docs-generator/`; `./docs/`; `./Agents/`; root-level `./*.md`; runtime/package/database/deployment changes; and all commands.
  - **Dependency:** 1.1–1.4, serially.
  - **Requirements:** Special Requirements 1.1–1.5 and 2.1–2.4; Requirements 1.1–1.6, 2.1–2.14, 3.1–3.7, 4.1–4.7, 7.1–7.7, 8.1–8.9, 9.1–9.7, 14.1–14.6, 15.1–15.5, 18.1–18.8, 19.1–19.7, 20.1–20.8, 21.1–21.10, 24.1–24.8, 26.1–26.7, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, and 31.1–31.10.
  - **Static evidence:** the README becomes one beginner-facing entry point with Begin Here, Route Record, 22 cards, classifier, Coverage Audit, Surface Status and gap rules, artifact table, exact workspace boundaries, Locked Path Gate, Site Write Gate, and Standing Multi-Agent default; links use only the current `markdown/` and `html/` layout and never call path presence wired proof.

  - [ ] 2.1 Add the Begin Here flow, Route Record, and common Coverage-Audited Task Card schema
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** all other guide Markdown/HTML files, `guide.css`, `.kiro` files, hooks/settings/MCP, locked paths, `./site/`, outputs, runtime/package/database/deployment files, and commands.
    - **Dependency:** 1.4.
    - **Requirements:** Requirements 1.1–1.6, 8.1–8.9, 14.1–14.6, 15.1–15.5, 20.1–20.5, 21.1–21.10, 28.7–28.9, 30.10, 30.15, 30.20, and 31.2.
    - **Static evidence:** the README states that `./.kiro/skills/oando-master/SKILL.md` is read first and the README is the guide start page; it defines ordinary-language input, authority ordering, exact first evidence reasons, card selection, additive skill routing, Workflow Mode, command classification, risk, output classification, Site Write Gate, Locked Path Gate reference, unavoidable decisions, and a copyable Route Record plus Goal, Start Paths, Scope, Evidence Steps, Allowed Actions, Forbidden Actions, Risk, Expected Evidence, and Next Decision fields.

  - [ ] 2.2 Add exactly 22 D01–D22 cards and the task-classifier table
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** all other guide files, skills, hooks/settings/MCP, locked paths, runtime/package/database/output files, and commands.
    - **Dependency:** 2.1.
    - **Requirements:** Requirements 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 8.9, 9.1–9.7, 20.1–20.8, 30.22, and 30.23.
    - **Static evidence:** exactly one card and one classifier row exist for each of these unchanged IDs and names: D01 Repository map and authority; D02 Initialization, local development, and debugging; D03 Auth, security, and secrets; D04 Environment; D05 APIs; D06 Site UI, SEO, i18n, accessibility, and performance; D07 UI polish, icons, alignment, FOCSS, motion, and assets; D08 Admin; D09 CRM demo versus customer-query operations; D10 Catalog, configurator, quotes, and inventory; D11 Planner; D12 Studio; D13 AI and retrieval; D14 Databases, RLS, grants, rollback, and mode-aware persistence; D15 Tests, fixtures, mocks, two Vitest lanes, and Playwright; D16 Scripts and command registry; D17 Packages, dependencies, and workspace boundaries; D18 Documentation, architecture, locked documentation, and legacy documentation; D19 Results, generated documents, agent work, and blocker placement; D20 MCP, skills, powers, and agents; D21 Vercel, Worker, R2, backups, observability, and incidents; and D22 Unknown-area discovery. Each card uses the exact verified Start Paths in Requirements 20 and the chapter mapping in design §7, or labels a path-discovery instruction explicitly.

  - [ ] 2.3 Add the Coverage Audit, Surface Status enum, and Coverage-Gap Admission Card
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** all other guide files, skills, hooks/settings/MCP, locked paths, runtime/package/database/output files, and commands.
    - **Dependency:** 2.2.
    - **Requirements:** Requirements 4.1–4.7, 19.1–19.7, 20.1–20.8, 26.1–26.7, 30.16, and 31.3.
    - **Static evidence:** the README contains 22 Coverage Audit rows with card ID, outcome, numbered chapter, verified paths, coverage status, evidence sources checked, evidence limitation, and next decision. It defines only `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, and `legacy`; cites the CRM `oando-crm-storage` distinction and separate customer-query operation; and provides a copyable gap card with named area/status, evidence sources, limitation, next evidence source, owner action, scope boundary, and next decision that propagates into the response and Completion Record.

  - [ ] 2.4 Add the beginner artifact-placement reference, exact workspace boundaries, and Site Write Gate
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** no write or move under `./agents-work/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./plans/`, `./Failures.md`, `./docs/`, `./Agents/`, or root-level `./*.md`; no hook, runtime, package, generator, or command change.
    - **Dependency:** 2.3.
    - **Requirements:** Requirements 7.1–7.7, 18.1–18.8, 24.1–24.8, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.24–30.26, and 31.6–31.8.
    - **Static evidence:** the README publishes the required wording verbatim: “If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.” It uses exact `./agents-work/<workstream>/<report-type>/`, `./results/<purpose>/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./results/site/`, `./plans/<name>/`, and root `./Failures.md`; rejects root-level report/result homes; keeps `./tech-docs-generator/` outside `./site/`; and requires Artifact Class, selected subfolder, filename pattern, owner/source, authored/generated state, rejected placements, observed placement, and Site Write Gate fields before any output path is selected.

  - [ ] 2.5 Add the Locked Path Gate and exact owner-authorization rules
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** `./docs/`, `./Agents/`, every root-level `./*.md` file including `./Failures.md`, all other guide/HTML/skill files, `.kiro` controls outside the approved README write, `./site/`, outputs, runtime/package/database/deployment files, and commands.
    - **Dependency:** 2.4.
    - **Requirements:** Requirements 7.1, 7.4, 7.6, 18.2–18.3, 19.6–19.7, 24.2, 27.2–27.3, 31.1–31.10, and 30.7, 30.13–30.14.
    - **Static evidence:** the README publishes the Locked Path Gate table and required copy-paste rule: classify each exact target as `Locked`, explicitly owner-authorized, or `writable`; treat `./docs/`, `./Agents/`, and root-level `./*.md` as read-only evidence unless the owner names and authorizes that exact file in the current request; stop unapproved writes; record the decision as an unavoidable Owner Decision and Separate Approval Work; place supporting analysis only under `./agents-work/<workstream>/<report-type>/`; keep `./Failures.md` unchanged without exact authorization; distinguish `./agents-work/` from `./Agents/`; and reject any copy that claims a locked source was updated.

  - [ ] 2.6 Add the README Standing Multi-Agent default and reconcile links, counts, and shared terms
    - **Owned paths:** `./agents-work/oando-repository-guide/README.md`.
    - **Excluded paths:** every other guide/HTML/skill/hook/settings/MCP/runtime/package/database/output path, all locked paths, and commands.
    - **Dependency:** 2.5.
    - **Requirements:** Requirements 1.1–1.6, 14.1–14.6, 15.1–15.5, 17.1–17.9, 20.1–20.8, 21.1–21.10, 23.1–23.14, 27.1–27.7, 30.1–30.27, and 31.8–31.10.
    - **Static evidence:** README read-back confirms 22 unique D-card IDs, 22 audit rows, current `markdown/` links, one definition each for Route Record, Completion Record, Surface Status, Coverage-Gap Admission Card, Artifact Class, Site Write Gate, Locked Path Gate, Agent Roster, Ownership Matrix, Handoff Record register, Conflict Stop Rule, and Serial Integration Owner; it states Standing Multi-Agent Mode is default, requires Scout/Map plus Planner/Risk before exploration or writes when available, allows no silent single-agent fallback, preserves exactly three Special Requirements, and keeps the future six standing-mode prompts separate from the 25 Prompt Cookbook categories.

- [ ] Checkpoint A — Freeze README vocabulary and ownership before chapter augmentation
  - **Owned paths:** read-only comparison of `./agents-work/oando-repository-guide/README.md`, the Task 1 baseline record, and all exact Markdown/HTML paths listed in the Overview.
  - **Excluded paths:** every write, command, generator, test, gate, skill, hook, settings, runtime, package, database, output, locked-path, or relocation action.
  - **Dependency:** 2.6.
  - **Requirements:** Special Requirements 1.1–1.5 and 2.1–2.4; Requirements 1.1–1.6, 8.9, 14.1–14.6, 15.1–15.5, 20.1–20.8, 21.1–21.10, 23.1–23.14, 27.4–27.7, 30.1–30.25, and 31.1–31.10.
  - **Static evidence:** the handoff freezes D01–D22 names, card fields, status enum, gap fields, response terms, artifact destinations, Locked Path Gate, Site Write Gate, Standing Multi-Agent fields, and exact current chapter links. Any contradiction is recorded as a conflict for serial owner review, not silently resolved.

- [ ] 3. Serially augment Markdown chapters 01–10 from the current `./markdown/` paths
  - **Owned paths:** exactly one current Markdown path per leaf 3.1–3.10 under `./agents-work/oando-repository-guide/markdown/`.
  - **Excluded paths:** all other Markdown chapters during a leaf, `./agents-work/oando-repository-guide/README.md` after Checkpoint A except approved conflict repair, every HTML file and `guide.css`, all skills/hooks/settings/MCP, all locked paths, `./site/`, runtime/package/database/deployment/output files, and commands.
  - **Dependency:** Checkpoint A and the preceding chapter leaf, strictly serial.
  - **Requirements:** Requirements 1.1–1.6, 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 7.1–7.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 18.1–18.8, 19.1–19.7, 20.1–20.8, 24.1–24.8, 25.1–25.10, 26.1–26.7, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, and 31.1–31.10.
  - **Static evidence:** each leaf records its applicable D-card links, exact live paths, evidence/status wording, artifact destinations, Locked Path Gate and Site Write Gate references where relevant, Protected Command boundary, standing-mode ownership/handoff rules, and next decision. Read-back confirms no HTML projection was edited in this phase.

  - [ ] 3.1 Augment `01-repository-map.md` with authority, exact paths, and unknown-area discovery
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/01-repository-map.md`.
    - **Excluded paths:** every other guide/HTML/skill/hook/settings/runtime/package/database/output path; all locked-path writes; all commands.
    - **Dependency:** Checkpoint A.
    - **Requirements:** Requirements 1.1–1.6, 7.1, 8.1–8.3, 9.1–9.2, 14.1–14.6, 20.1, 20.8, 27.1–27.7, 30.10, and 31.1–31.6.
    - **Static evidence:** D01 and D22 map `./START.md`, `./AGENTS.md`, `./docs/architecture/layout.md`, `./docs/architecture/stack.md`, `./docs/architecture/routes.md`, `./docs/architecture/product-map.md`, `./plans/README.md`, and the current README/chapter paths; they label source/generated/private/legacy/absent locations, distinguish `./agents-work/` from `./Agents/`, require the Locked Path Gate, and preserve the no-guess fallback.

  - [ ] 3.2 Augment `02-application-architecture.md` with route-to-source traces and fork boundaries
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/02-application-architecture.md`.
    - **Excluded paths:** all other guide/HTML/skill/hook/settings/runtime/package/database/output paths; all product writes; all commands.
    - **Dependency:** 3.1.
    - **Requirements:** Requirements 2.2–2.4, 3.1–3.4, 5.1–5.3, 6.1–6.4, 8.1–8.5, 12.5, 20.2, 20.5–20.6, 29.1–29.5, and 30.7, 30.22, 30.25–30.26.
    - **Static evidence:** D05, D06, D11, and D12 trace route → feature → component → shared/server → platform/persistence using exact `./site/app/(site)/`, `./site/app/api/`, `./site/features/site/`, `./site/components/home/`, `./site/focss/site/`, `./site/i18n/`, `./site/app/ooplanner/`, and `./site/app/oostudio/`; the chapter states Planner/Studio no-cross-import and route-presence proof limitations plus Site Write Gate handling.

  - [ ] 3.3 Augment `03-product-domains.md` with surfaces, UI details, assets, motion, Planner/Studio, and AI
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/03-product-domains.md`.
    - **Excluded paths:** all other guide/HTML/skill/hook/settings/runtime/package/database/output paths; all product writes; all commands and external calls.
    - **Dependency:** 3.2.
    - **Requirements:** Requirements 2.2–2.8, 2.13, 3.1–3.7, 4.1–4.7, 5.1–5.7, 8.2–8.5, 20.2–20.8, 23.1–23.14, 26.1–26.7, and 30.4–30.7, 30.21–30.23.
    - **Static evidence:** D06–D13 identify exact starts and conditional skills for marketing/Admin/CRM/catalog, Planner, Studio, AI, `./site/focss/`, `./site/public/`, `./scripts/generate-svg/`, and `./site/lib/ai/mastra/`; the Visual Detail Checklist includes existing Phosphor abstraction, alignment, spacing, responsive/keyboard/reduced-motion and interaction states; CRM statuses remain distinct; AI remains advisory; and cross-fork evidence is bounded.

  - [ ] 3.4 Augment `04-data-api-persistence.md` with ownership, security, migrations, and mode-aware persistence
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md`.
    - **Excluded paths:** all other guide/HTML/skill/hook/settings/runtime/package/output paths; `./site/platform/supabase/migrations/`; `./site/platform/supabase/migrations.admin/`; database/schema/RLS/grant/type/seed edits; all database actions and commands.
    - **Dependency:** 3.3.
    - **Requirements:** Requirements 3.1, 4.1–4.4, 5.1–5.7, 6.1–6.10, 7.6, 8.6, 10.1–10.10, 11.3, 12.5, 18.4, 20.3–20.5, 20.8, 24.7, 25.1–25.10, 27.2–27.3, 29.3, and 30.7, 30.24–30.27.
    - **Static evidence:** D03/D05/D10/D14 cite `./site/proxy.ts`, `./site/lib/security/`, `./site/app/api/`, `./site/lib/apiCatalog.ts`, `./site/platform/supabase/`, both exact migration directories, `./site/platform/drizzle/schema/`, persistence selectors, disk roots, and descriptors; they distinguish Products `erpweaiypimorcunaimz` from Admin `rxzpznmxbaoxpikowmfc`, require RLS/grants/rollback, state production filesystem read-only, and keep secrets out of reports.

  - [ ] 3.5 Augment `05-tooling-ci-tech-docs.md` with scripts, packages, two test lanes, and tech-docs boundaries
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md`.
    - **Excluded paths:** all other guide/HTML/skill/hook/settings/runtime/package/lockfile/output paths; no test/build/gate/typecheck execution; no manifest or lockfile change.
    - **Dependency:** 3.4.
    - **Requirements:** Requirements 6.1–6.10, 7.1–7.5, 8.8–8.9, 10.1–10.10, 11.1–11.3, 18.1–18.8, 20.15–20.17, 24.1–24.8, 25.1–25.10, 28.1–28.20, 29.1–29.10, and 30.19, 30.24–30.25.
    - **Static evidence:** D15–D17 cite `./tests/`, its unit/integration/e2e/fixture/helper/tech-docs paths, `./config/build/`, `./Testing-handbook.md`, `./package.json`, `./scripts/`, `./scripts/run-ops.mjs`, `./scripts/ops-command-registry.mjs`, `./docs/architecture/scripts.md`, `./pnpm-workspace.yaml`, `./pnpm-lock.yaml`, `./site/tsconfig.json`, `./tech-docs-generator/`, and `./tech-docs-generator/package.json`; they preserve two Vitest lanes, exact command classification, correct output homes, and the unavailable `pnpm run typecheck:scripts` state.

  - [ ] 3.6 Augment `06-operations-infrastructure.md` with read-only operations planning and failure triage
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md`.
    - **Excluded paths:** `./vercel.json`; `./workers/oando-worker-proxy/`; `./config/observability/`; `./.github/workflows/supabase-backup-r2.yml`; `./OPERATIONS_RUNBOOK.md`; `./scripts/`; `./Failures.md`; `./site/instrumentation.ts`; all operational source changes; deploy/backup/observability/database/local-service commands.
    - **Dependency:** 3.5.
    - **Requirements:** Special Requirement 3.1–3.5; Requirements 7.1–7.7, 9.3–9.6, 10.1–10.10, 11.2–11.4, 18.4–18.8, 20.21, 24.1–24.8, 25.1–25.10, 27.2–27.7, 30.6, 30.14, 31.7.
    - **Static evidence:** D21 names the exact Vercel, Worker, observability, backup workflow, runbook, scripts, blocker, and instrumentation paths; it separates read-only planning from deploy/Worker/R2/Supabase/backup/local-service actions and records target, risk, recovery, command class, authorization, first failed subcommand, cause classification, and proof limitation without asserting the reported gate cause.

  - [ ] 3.7 Augment `07-docs-governance-planning.md` with authority, placement, and Locked Path Gate rules
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md`.
    - **Excluded paths:** all other guide/HTML/skill/hook/settings/runtime/package/database/output paths; `./docs/`; `./Agents/`; root-level `./*.md`; `./Failures.md`; plan creation; blocker creation; and commands.
    - **Dependency:** 3.6.
    - **Requirements:** Requirements 7.1–7.7, 11.1–11.6, 18.1–18.3, 19.1–19.7, 24.1–24.8, 27.1–27.7, 28.1–28.20, 30.7, 30.24, and 31.1–31.10.
    - **Static evidence:** D18/D19 map `./docs/architecture/`, `./docs/database/`, `./docs/governance/`, locked governance files, `./AGENTS.md`, `./DOC-MAP.md`, `./CONTENTS.md`, legacy `./site/data/storage/`, `./results/`, `./generated-documents/`, `./agents-work/`, `./plans/`, `./plans/README.md`, `./Failures.md`, and `./agent-reports/`; the chapter publishes the exact Locked Path Gate wording, distinguishes `./agents-work/` from `./Agents/`, rejects copies claiming locked updates, and routes supporting analysis correctly.

  - [ ] 3.8 Augment `08-kiro-workspace.md` with conditional skills, Powers, MCP state, and no runtime spawning
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md`.
    - **Excluded paths:** every `.kiro/` change, `./.kiro/hooks/`, `./.kiro/settings/mcp.json`, `./.kiro/mcp/`, `./.kiro/agents/`, Power activation, external access, other guide files, runtime/package/database/output paths, and commands.
    - **Dependency:** 3.7.
    - **Requirements:** Requirements 5.1–5.7, 8.1–8.8, 9.1–9.7, 11.2–11.5, 13.1–13.4, 27.2–27.7, 30.19, 30.27, and 31.8.
    - **Static evidence:** D20 distinguishes present skills, the absent optional AI file, candidate versus confirmed Powers, `.kiro/mcp/` schema versus `./.kiro/settings/mcp.json` configuration versus connected state, least privilege, no external access by default, hooks as Separate Approval Work, and automatic spawning as Separate Approval Work rather than runtime behavior.

  - [ ] 3.9 Augment `09-local-generated-environment.md` with environment, private/generated/legacy classification, and artifact homes
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
    - **Excluded paths:** `.env` values and local secret content; generated-output edits; `./site/` writes; all other guide/skill/hook/settings/runtime/package/database paths; `./Failures.md`; and commands.
    - **Dependency:** 3.8.
    - **Requirements:** Requirements 2.1, 6.1–6.4, 6.8, 7.3–7.5, 14.1–14.6, 18.1–18.3, 19.1–19.7, 20.1–20.4, 24.1–24.8, 26.1–26.7, 28.1–28.20, 29.1–29.10, and 31.1–31.7.
    - **Static evidence:** D02/D04/D19 classify `./.env.example`, local environment paths, `./package.json`, `./pnpm-workspace.yaml`, `./START.md`, `./site/`, `./config/build/`, `./Failures.md`, `./results/`, `./generated-documents/`, `./agents-work/`, `./plans/`, and `./agent-reports/` as template/private/generated/source/legacy; no secret values are copied, generated files are not called editable source, and root artifacts remain `legacy/owner-review pending` unless evidence assigns them.

  - [ ] 3.10 Augment `10-quality-validation.md` with command classes, authorization, and Full Gate Failure Triage
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/10-quality-validation.md`.
    - **Excluded paths:** all tests/gates/builds/browser/typecheck/database/deploy/backup/service execution; hook/policy changes; all other guide/skill/settings/runtime/package/output paths; `./Failures.md`; and all commands.
    - **Dependency:** 3.9.
    - **Requirements:** Special Requirement 3.1–3.5; Requirements 6.9, 8.8, 10.1–10.10, 12.1–12.5, 18.4–18.8, 24.7–24.8, 25.1–25.10, 27.2–27.7, 30.6, 30.14, and 31.2–31.4.
    - **Static evidence:** D15/D21 classify read-only inspection, Normal-Agent Eligible Check, Protected Command, and no-run pending authorization; record Full Gate Failure Triage fields (exact command, repository-root cwd, authorization, hook decision, exit status, first failed subcommand, output summary, cause classification); preserve gate composition, tests, coverage, baselines, hooks, inline-marker rejection, and unavailable `pnpm run typecheck:scripts` status.

- [ ] Checkpoint B — Reconcile chapters 01–10 before chapter 11 and router writes
  - **Owned paths:** read-only `./agents-work/oando-repository-guide/README.md`; the exact Markdown paths `01-repository-map.md` through `10-quality-validation.md`; the Task 1 baseline; and the current router path.
  - **Excluded paths:** all HTML writes, chapter/README repairs outside an explicitly assigned conflict, skills/hooks/settings/MCP, locked paths, runtime/package/database/output paths, and commands.
  - **Dependency:** 3.10.
  - **Requirements:** Special Requirements 1–3; Requirements 1.1–1.6, 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 7.1–7.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 18.1–18.8, 19.1–19.7, 20.1–20.8, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, and 31.1–31.10.
  - **Static evidence:** a terminology/path matrix confirms all D-card links use current `./markdown/` paths, the status/gap/card schema is consistent, exact workspace and output rules agree, locked paths remain read-only, Standing Multi-Agent vocabulary is frozen, and no HTML file changed during chapter work. Conflicts invoke the Conflict Stop Rule.

- [ ] 4. Add chapter 11 Plain-Language Response Contract, exactly 25 Prompt Cookbook categories, Standing Multi-Agent Mode, and exactly six standing-mode prompts
  - **Owned paths:** only `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md` for writes; README and chapters 01–10 are read-only vocabulary inputs.
  - **Excluded paths:** all other guide Markdown, every HTML file and `guide.css`, all skills/hooks/settings/MCP, all locked paths, `./site/`, runtime/package/database/deployment/output paths, automatic spawning, and commands.
  - **Dependency:** Checkpoint B.
  - **Requirements:** Requirements 3.5–3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 18.4–18.8, 21.1–21.10, 22.1–22.7, 23.1–23.14, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, and 31.1–31.10.
  - **Static evidence:** chapter 11 contains the ordered 13-field response contract, exactly 25 distinct category blocks, complete safety preamble and category-specific evidence starts, exactly four agent-role names, the Standing Multi-Agent operating procedure, six separate standing-mode prompts, complete handoff schema, serial integration, Conflict Stop Rule, Locked Path Gate and Site Write Gate references, and no runtime-spawning claim.

  - [ ] 4.1 Add the ordered Plain-Language Response Contract and Route/Completion Record rules
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
    - **Excluded paths:** all other guide/HTML/skill/hook/settings/MCP/runtime/package/database/output files, locked paths, and commands.
    - **Dependency:** Checkpoint B.
    - **Requirements:** Special Requirements 1.2–1.5 and 2.1–2.4; Requirements 15.1–15.5, 21.6–21.10, 24.8, 25.10, 27.5, 30.10, 30.15–30.16, and 31.2, 31.4.
    - **Static evidence:** the 13 headings appear in exactly this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions. The chapter explains specialized terms before decisions, includes artifact and Site Write Gate fields for output tasks, includes Locked Path classification fields, and labels omissions or missing proof incomplete with state and next owner action.

  - [ ] 4.2 Add exactly the 25 complete Prompt Cookbook blocks
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
    - **Excluded paths:** all other guide/HTML/skill/hook/settings/MCP/runtime/package/database/output files, locked paths, automatic spawning, and commands.
    - **Dependency:** 4.1.
    - **Requirements:** Requirements 3.5–3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 16.1–16.5, 21.1–21.10, 22.1–22.7, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.23–30.27, and 31.10.
    - **Static evidence:** exactly one complete fenced copy-paste block exists for each required category: `Understand Repository`; `Find Where to Work`; `Small UI/Icon/Alignment Fix`; `Feature`; `Site UI`; `Planner`; `Studio`; `Admin`; `CRM/Unwired Assessment`; `Catalog/Configurator/Quotes/Inventory`; `Database`; `AI/Retrieval`; `Image/Animation/Assets`; `API/Security`; `Environment`; `Bug/Failing Test`; `Gate-Failure Triage`; `Refactor`; `Documentation`; `Package/Dependency`; `Deployment/Ops`; `Backup/Import/Export`; `Unknown Task`; `Finish Current Task`; and `Emergency Prompt for an Overwhelmed Owner`. Every block contains desired outcome, ordinary-language context, exact category start paths, scope boundary, expected evidence, stop condition, `oando-master` then `repo-map`, Local Evidence first, all matching-skill selection, command classification, dual authorization, exact proof or pending state, Plain-Language Response Contract, artifact fields, exact workspace forms, Locked Path Gate, and Site Write Gate where applicable. The Emergency block remains one sentence while retaining its safety requirements.

  - [ ] 4.3 Add the beginner-readable Standing Multi-Agent Operating Procedure with exactly four roles
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
    - **Excluded paths:** no fifth Agent role, no `.kiro/agents/` or runtime coordinator, no automatic spawning, no other guide/HTML/skill/hook/settings/MCP/runtime/package/database/output file, locked paths, or commands.
    - **Dependency:** 4.2.
    - **Requirements:** Requirements 17.1–17.9, 23.1–23.14, 30.1–30.22, 30.24–30.27, 31.2, 31.6, and 31.8.
    - **Static evidence:** exactly these four role names appear as available roles and no fifth coordinator role is introduced: Scout/Map (read-only orientation and evidence), Planner/Risk (read-only scope, skill, risk, command, ownership and validation planning), Implementer (writes only within recorded exclusive paths), and Verifier/Reporter (read-only evidence reconciliation and reporting). The Orchestrator/Serial Integration Owner is documented as a coordination function, not a fifth Agent role. The procedure states default Standing Multi-Agent Mode for every task; at least Scout/Map plus Planner/Risk before exploration or writes when availability is `available`; maximum four agents; parallel only for read-only research or disjoint ownership; Agent Roster; Ownership Matrix; Route Record; Handoff Record register; Conflict Stop Rule; Serial Integration Owner; no silent single-agent fallback for `limited`/`unavailable`; owner status before implementation; Completion Record after verification; exact Handoff fields; and runtime spawning as Separate Approval Work.

  - [ ] 4.4 Add the six standing-mode copy-paste prompts, separate from the 25-category count
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
    - **Excluded paths:** no changes to the 25 Prompt Cookbook category blocks; no fifth role, runtime spawning, agent definitions, other guide/HTML/skill/hook/settings/MCP/runtime/package/database/output file, locked paths, or commands.
    - **Dependency:** 4.3.
    - **Requirements:** Requirements 15.1–15.5, 17.1–17.9, 22.1–22.7, 23.1–23.14, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, and 31.1–31.10.
    - **Static evidence:** six separate complete copy-paste prompts exist with these exact purposes and names: `Start Standing Multi-Agent Mode`; `Launch Scout/Map and Planner/Risk in parallel`; `Hand an approved scope to Implementer`; `Launch Verifier/Reporter`; `Resolve a multi-agent conflict`; and `Finish and close a multi-agent task`. Each repeats the default/minimum-pair/max-four/no-silent-fallback rule, roster/ownership/route/handoff/conflict/serial controls, artifact placement, exact workspace boundaries, Locked Path Gate, Site Write Gate, Protected Command authorization, and Plain-Language Response Contract. The six prompts are explicitly outside the exactly-25 cookbook count.

  - [ ] 4.5 Reconcile chapter 11 counts, links, role names, fields, and shared boundary vocabulary
    - **Owned paths:** `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md`.
    - **Excluded paths:** every other guide/HTML/skill/hook/settings/MCP/runtime/package/database/output path, locked paths, automatic spawning, and commands.
    - **Dependency:** 4.4.
    - **Requirements:** Requirements 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 21.1–21.10, 22.1–22.7, 23.1–23.14, 27.4–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, and 31.1–31.10.
    - **Static evidence:** read-back confirms 13 response fields in order, 25 cookbook headings exactly once, six standing-mode headings exactly once outside the cookbook, exactly four roles, complete Handoff Record fields, current `markdown/` links, required safety preamble in every category block, standing-mode preamble in every standing prompt, consistent artifact/Locked Path/Site Write terms, exactly three Special Requirements, and no renamed/removed D-card or cookbook category.

- [ ] 5. Update the master router and keep optional AI guidance decision-gated
  - **Owned paths:** `./.kiro/skills/oando-master/SKILL.md`; optional `./.kiro/skills/ai-retrieval/SKILL.md` only if explicitly selected by the Repository Owner in the downstream task execution.
  - **Excluded paths:** all other `.kiro/skills/`, `.kiro/hooks/`, `.kiro/settings/`, `.kiro/mcp/`, `.kiro/agents/`, `.config.kiro`, locked paths, `./site/`, runtime/package/database/deployment/output files, automatic spawning, Power/MCP activation, and commands.
  - **Dependency:** Checkpoint B and Task 4.5, serially.
  - **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; Requirements 1.1–1.6, 3.7, 5.1–5.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 13.1–13.4, 15.1–15.5, 18.1–18.8, 19.1–19.7, 21.1–21.10, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, and 31.1–31.10.
  - **Static evidence:** the router is still the first, prose-only entry point; it references the current README/Markdown paths, additive conditional routing, rejected/no-match reasons, Route/Completion fields, Standing Multi-Agent Mode, artifact placement, exact workspace boundaries, Locked Path Gate, Site Write Gate, Protected Command policy, Full Gate triage, honest validation, gap admissions, and Separate Approval Work without changing hooks or runtime behavior.

  - [ ] 5.1 Update `oando-master` as the canonical first router and completion contract
    - **Owned paths:** `./.kiro/skills/oando-master/SKILL.md`.
    - **Excluded paths:** `./.kiro/hooks/`; `./.kiro/settings/`; `./.kiro/mcp/`; `./.kiro/agents/`; all other skills; locked paths; runtime/package/database/deployment/output files; automatic spawning; Power/MCP activation; and commands.
    - **Dependency:** 4.5.
    - **Requirements:** Special Requirements 1.1–1.5 and 3.1–3.5; Requirements 1.1–1.6, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 13.1–13.4, 15.1–15.5, 18.4–18.8, 19.1–19.7, 21.1–21.10, 24.1–24.8, 25.1–25.10, 27.1–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, and 31.1–31.10.
    - **Static evidence:** the skill says `oando-master` is first; uses Local Evidence before Powers/MCP; selects every matching skill and records rejected/no-match reasons; requires Route/Completion fields, artifact producer ownership, Standing Multi-Agent roster/ownership/route/handoff/conflict/serial/status controls, Locked Path Gate, `./tech-docs-generator/` sibling/no-relocation rule, `./results/site/` distinction, Site Write Gate, Full Gate triage, exact command authorization, `pnpm run typecheck:scripts` unavailable state, and no runtime loader, automatic activation, or automatic spawning claim.

  - [ ]* 5.2 Add `ai-retrieval` guidance only when explicitly selected
    - **Owned paths:** `./.kiro/skills/ai-retrieval/SKILL.md` only if the Repository Owner explicitly selects the optional AI guidance branch; otherwise no new file is owned and the existing absence is the required state.
    - **Excluded paths:** all AI runtime files under `./site/lib/ai/mastra/`; AI routes; package manifests/lockfiles; providers; external calls; Powers/MCPs; hooks/settings; locked paths; automatic spawning; and commands.
    - **Dependency:** 5.1 and an explicit owner selection recorded in the Route Record.
    - **Requirements:** Requirements 5.1–5.7, 8.7, 9.1–9.7, 11.1–11.6, 13.1–13.4, 19.6–19.7, 27.1–27.7, 30.19, 30.27, and 31.8.
    - **Static evidence:** if selected, the skill contains the trigger for `./site/lib/ai/mastra/` and listed AI routes, Local Evidence/authority order, every matching-skill rule, advisory-only output, explicit-user application, no unsupported deployed/evaluated claim, artifact/validation contract, Locked Path/Site Write boundaries, and Separate Approval Work. If not selected, the README, chapter 08, and router all state the exact absent file and fallback through Local Evidence, `repo-map`, and every other matching skill; absence is never represented as installed.

  - [ ] 5.3 Reconcile router and optional-skill references against the frozen guide vocabulary
    - **Owned paths:** `./.kiro/skills/oando-master/SKILL.md`; and `./.kiro/skills/ai-retrieval/SKILL.md` only if 5.2 was explicitly selected.
    - **Excluded paths:** all guide writes, all other skills, hooks/settings/MCP, `.config.kiro`, locked paths, runtime/package/database/deployment/output files, automatic spawning, and commands.
    - **Dependency:** 5.2, including its explicit absence branch when skipped.
    - **Requirements:** Requirements 1.1–1.6, 5.1–5.7, 8.1–8.9, 9.1–9.7, 14.1–14.6, 15.1–15.5, 19.6–19.7, 20.1–20.8, 21.1–21.10, 27.4–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, and 31.1–31.10.
    - **Static evidence:** a shared-term matrix confirms D01–D22, Route/Completion fields, Surface Status and gap fields, response order, command labels, four role names, six standing prompts, exact output destinations, Locked Path wording, Site Write Gate, AI fallback, no silent single-agent fallback, and Separate Approval Work agree across the selected skill files and guide; no fourth Special Requirement, D-card replacement, or runtime behavior is introduced.

- [ ] Checkpoint C — Freeze Markdown/router terminology before projection work
  - **Owned paths:** read-only `./agents-work/oando-repository-guide/README.md`; all eleven exact Markdown paths; `./.kiro/skills/oando-master/SKILL.md`; and optional `./.kiro/skills/ai-retrieval/SKILL.md` only if selected.
  - **Excluded paths:** all HTML/`guide.css` writes, hooks/settings/MCP, locked paths, runtime/package/database/deployment/output files, automatic spawning, and commands.
  - **Dependency:** 5.3.
  - **Requirements:** Special Requirements 1–3; Requirements 1.1–1.6, 8.1–8.9, 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 20.1–20.8, 21.1–21.10, 22.1–22.7, 23.1–23.14, 27.4–27.7, 28.7–28.20, 29.7–29.10, 30.1–30.27, and 31.1–31.10.
  - **Static evidence:** one matrix records all shared terms, all changed-path owners, six standing prompts, 25 cookbook categories, four roles, exact path forms, locked-path decisions, and the optional AI branch. No HTML edit starts until provenance and vocabulary are stable.

- [ ] 6. Reconcile the HTML projection only after its source relationship is evidenced
  - **Owned paths:** read-only provenance comparison first; conditional writes only to the exact HTML paths under `./agents-work/oando-repository-guide/html/` and `./agents-work/oando-repository-guide/html/guide.css` when the evidenced projection method requires them; or only the README parity-gap record if provenance remains unresolved.
  - **Excluded paths:** all Markdown source edits; all scripts/generators/package changes; `./site/`; `./results/`; `./generated-documents/`; `./tech-docs-generator/`; `.kiro` controls; locked paths; runtime/database/deployment files; automatic spawning; and commands unless separately authorized by the owner for a confirmed non-generator maintenance action.
  - **Dependency:** Checkpoint C and 1.2.
  - **Requirements:** Requirements 1.5, 6.3, 6.10, 11.4, 19.1–19.7, 20.4, 20.6–20.8, 24.1–24.8, 27.3–27.7, 28.1–28.20, 29.1–29.10, and 31.1–31.3.
  - **Static evidence:** either a source/projection comparison tied to an evidenced deterministic method with exact changed-file list, or an explicit parity-gap admission with evidence checked, limitation, next source, owner action, and scope boundary. Filename similarity, rendered appearance, generic docs commands, or generated output are never treated as proof.

  - [ ] 6.1 Map every HTML projection file to a current Markdown source or unresolved relationship
    - **Owned paths:** read-only `./agents-work/oando-repository-guide/html/index.html`; `./agents-work/oando-repository-guide/html/repository-map.html`; `./agents-work/oando-repository-guide/html/application-architecture.html`; `./agents-work/oando-repository-guide/html/product-domains.html`; `./agents-work/oando-repository-guide/html/data-api-persistence.html`; `./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`; `./agents-work/oando-repository-guide/html/operations-infrastructure.html`; `./agents-work/oando-repository-guide/html/docs-governance-planning.html`; `./agents-work/oando-repository-guide/html/kiro-workspace.html`; `./agents-work/oando-repository-guide/html/local-generated-environment.html`; `./agents-work/oando-repository-guide/html/quality-and-validation.html`; `./agents-work/oando-repository-guide/html/working-with-kiro.html`; `./agents-work/oando-repository-guide/html/guide.css`; and all eleven Markdown source paths.
    - **Excluded paths:** all writes, generators/scripts, package changes, locked paths, runtime/output changes, and commands.
    - **Dependency:** 1.2 and Checkpoint C.
    - **Requirements:** Requirements 1.5, 6.3, 6.10, 11.4, 20.4, 20.6–20.8, 27.3, 29.7, and 31.3.
    - **Static evidence:** a page-by-page map states whether a source relationship is evidenced, identifies navigation/content anchors, and labels unresolved pages as a parity gap without calling them stale or current and without inventing a generator.

  - [ ] 6.2 Apply the evidenced projection branch or record the unresolved parity gap
    - **Owned paths:** if provenance is evidenced, only the exact 12 HTML files and `./agents-work/oando-repository-guide/html/guide.css` listed in 6.1 when the method requires them; if unresolved, only `./agents-work/oando-repository-guide/README.md` for the gap admission and no HTML file.
    - **Excluded paths:** no HTML write when provenance is unresolved; no invented generator; no Markdown rewrite; no runtime/script/package change; no relocation; no `./site/` or `./results/` output; no locked-path write; and no command.
    - **Dependency:** 6.1.
    - **Requirements:** Requirements 1.5, 11.4, 19.1–19.7, 24.1–24.8, 26.1–26.7, 27.3–27.7, 28.1–28.20, 29.1–29.10, and 31.1–31.3.
    - **Static evidence:** the selected branch has an exact file list and static comparison: confirmed method means matching anchors/navigation and projection update; unresolved means no HTML change plus a gap card naming limitation, next source, owner action, and no-relocation statement. Rendered behavior and generator success remain unclaimed.

- [ ] Checkpoint D — Freeze the confirmed projection or parity-gap decision before final audit
  - **Owned paths:** read-only exact README, Markdown, HTML, CSS, and router paths from the Overview, plus the Task 1 provenance record.
  - **Excluded paths:** all further writes, commands, generators, tests, gates, builds, typechecks, runtime/package/database/deployment/output changes, automatic spawning, and locked-path changes.
  - **Dependency:** 6.2.
  - **Requirements:** Requirements 1.5, 11.4, 19.1–19.7, 27.3–27.7, 28.1–28.20, 29.1–29.10, and 31.1–31.3.
  - **Static evidence:** the handoff records either the evidenced projection method and changed HTML set or the unresolved parity-gap state; it does not call a projection current/stale without evidence and does not claim a generator or relocation.

- [ ] 7. Perform final static documentation validation, requirement/property reconciliation, changed-path audit, locked-path audit, artifact audit, and plain-language completion handoff
  - **Owned paths:** read-only exact README, all eleven Markdown paths, all conditional HTML/CSS paths, `./.kiro/skills/oando-master/SKILL.md`, optional AI skill path when selected, `./.kiro/specs/oando-master/requirements.md`, `./.kiro/specs/oando-master/design.md`, `./.kiro/specs/oando-master/tasks.md`, and the control/boundary paths named in Tasks 1 and 7.3–7.5; any persisted authored handoff uses `./agents-work/oando-repository-guide/<report-type>/`.
  - **Excluded paths:** all tests, gates, builds, browser checks, typechecks, database/deployment/backup/service commands, hook/settings/runtime/package/database/output changes, Power/MCP activation, automatic spawning, relocation, locked-path writes, and any `./site/` write.
  - **Dependency:** Checkpoint D.
  - **Requirements:** Special Requirements 1–3; Requirements 1.1–1.6, 2.1–2.14, 3.1–3.7, 4.1–4.7, 5.1–5.7, 6.1–6.10, 7.1–7.7, 8.1–8.9, 9.1–9.7, 10.1–10.10, 11.1–11.6, 12.1–12.5, 13.1–13.4, 14.1–14.6, 15.1–15.5, 16.1–16.5, 17.1–17.9, 18.1–18.8, 19.1–19.7, 20.1–20.8, 21.1–21.10, 22.1–22.7, 23.1–23.14, 24.1–24.8, 25.1–25.10, 26.1–26.7, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.1–30.27, and 31.1–31.10.
  - **Static evidence:** one final Completion Record distinguishes changed guidance scope, selected/rejected skills, static proof, unresolved gaps, exact owner-controlled checks that remain pending, artifact placement, locked-path state, Site Write Gate result, Separate Approval Work, Multi-Agent Evidence, and True Blockers; no unsupported pass, rendered, hosted, connected, installed, successful-command, or relocation claim.

  - [ ] 7.1 Audit exact inventories, counts, links, and response/card/handoff contracts
    - **Owned paths:** read-only `./agents-work/oando-repository-guide/README.md`; all eleven Markdown paths; all conditional HTML/CSS paths; `./.kiro/skills/oando-master/SKILL.md`; and optional AI path when selected.
    - **Excluded paths:** no fixes outside prior owner tasks; no checker creation; no commands, tests, gates, builds, typechecks, or runtime/output changes.
    - **Dependency:** Checkpoint D.
    - **Requirements:** Requirements 2.1–2.14, 8.9, 15.1–15.5, 16.1–16.5, 17.1–17.9, 20.1–20.8, 21.1–21.10, 22.1–22.7, 23.1–23.14, 26.1–26.7, 30.21–30.23, and 31.10.
    - **Static evidence:** counts and identifiers show exactly 22 D01–D22 cards and audit rows, exactly 25 cookbook categories, exactly six standing-mode prompts outside the cookbook, exactly four role names, 13 response fields in order, complete card and Handoff fields, complete safety preambles, Surface Status enum, gap fields, and ordered Evidence Steps.

  - [ ] 7.2 Reconcile every acceptance criterion and design property to an open implementation/audit leaf
    - **Owned paths:** read-only `./.kiro/specs/oando-master/requirements.md`; `./.kiro/specs/oando-master/design.md`; `./.kiro/specs/oando-master/tasks.md`; all changed guide paths; and selected skill paths.
    - **Excluded paths:** no requirements/design edit; no task checkmark change; no new checker; no tests/gates/builds/typechecks; no Separate Approval Work.
    - **Dependency:** 7.1.
    - **Requirements:** Special Requirements 1–3; Requirements 1–32; Design Properties 1–15.
    - **Static evidence:** a requirement-to-task matrix maps every acceptance criterion, including current Requirements 30.1–30.27 and 31.1–31.10, to an open implementation or static-audit leaf. Properties 1–15 map to the optional decision-gated property leaves below; Requirements 30 and 31 are also directly checked as acceptance criteria because the current design’s summary matrix predates those requirement groups. No stale checked task remains and no unproven leaf is called complete.

  - [ ] 7.3 Audit changed paths, exclusive ownership, dependencies, and serial integration
    - **Owned paths:** read-only changed-path inventory for `./agents-work/oando-repository-guide/README.md`; the eleven Markdown paths; conditional HTML/CSS paths; `./.kiro/skills/oando-master/SKILL.md`; optional AI path; and this task file.
    - **Excluded paths:** no file repair outside the leaf that owns it; no overlapping write; no runtime/checker/generator/package/hook/settings/MCP change; no commands.
    - **Dependency:** 7.2.
    - **Requirements:** Requirements 11.1–11.6, 12.1–12.5, 27.1–27.7, 30.7–30.14, 30.18, 31.2, 31.4–31.8, and Design Properties 1, 2, 9, 12, 14, and 15.
    - **Static evidence:** a changed-path audit shows every write has one exclusive owner, every shared terminology write is serial, dependencies are satisfied, no overlapping writes are in one wave, all handoffs have a serial integration owner, and the only current operation mutation is `./.kiro/specs/oando-master/tasks.md`.

  - [ ] 7.4 Audit the Locked Path Gate and locked-source integrity
    - **Owned paths:** read-only `./docs/`; `./Agents/`; root-level `./*.md`; `./Failures.md`; `./agents-work/`; `./agents-work/oando-repository-guide/`; `./.kiro/`; and changed-path inventory.
    - **Excluded paths:** no write to `./docs/`, `./Agents/`, any root-level `./*.md`, or `./Failures.md`; no copy, relocation, shadow report, blocker ledger, or command.
    - **Dependency:** 7.3.
    - **Requirements:** Requirements 7.1, 7.4, 7.6, 18.2–18.3, 19.6–19.7, 24.2, 27.2–27.3, and 31.1–31.10.
    - **Static evidence:** the audit confirms exact target classification before writes, read-only evidence use, exact-file authorization requirement, unchanged `./Failures.md` without authorization, supporting analysis only under an approved `./agents-work/<workstream>/<report-type>/`, distinction between `./agents-work/` and `./Agents/`, `.kiro` scope separation, and rejection of any copy claiming a locked file changed.

  - [ ] 7.5 Audit artifact placement, workspace boundaries, Site Write Gate, Protected Commands, and Separate Approval Work
    - **Owned paths:** read-only `./agents-work/`; `./agents-work/oando-repository-guide/`; `./results/`; `./results/site/`; `./generated-documents/`; `./tech-docs-generator/`; `./site/`; `./plans/README.md`; `./Failures.md`; `./.kiro/hooks/block-agent-tests.json`; `./.kiro/hooks/block-agent-tests.mjs`; `./.kiro/settings/mcp.json`; package manifests; migrations; deployment assets; and `.config.kiro`.
    - **Excluded paths:** no artifact movement, command execution, hook/policy change, runtime/package/database/deployment action, Power/MCP activation, automatic spawning, or `./site/` write.
    - **Dependency:** 7.4.
    - **Requirements:** Requirements 6.9–6.10, 7.1–7.7, 9.3–9.6, 10.1–10.10, 11.2–11.6, 18.1–18.8, 24.1–24.8, 25.1–25.10, 27.2–27.7, 28.1–28.20, 29.1–29.10, 30.19, 30.24–30.27, and 31.8.
    - **Static evidence:** the audit confirms guide work stays in the approved workstream; Machine Evidence would use purpose subfolders; tech-docs output stays in `./generated-documents/`; active separate work uses `./plans/<name>/`; blockers remain only in `./Failures.md` with exact authorization; `./tech-docs-generator/` is a root sibling of `./site/`; `./results/site/` is not source; Site Write Gate rejects Non-Core Artifacts; all protected checks remain pending because this workflow runs none; hooks/settings/manifests/runtime/migrations/deployment assets and `.config.kiro` are unchanged; and no relocation is claimed.

  - [ ] 7.6 Produce the final Plain-Language Completion Record and owner handoff
    - **Owned paths:** read-only all changed guidance and skill files; if a handoff is persisted, only `./agents-work/oando-repository-guide/<report-type>/` is writable for that report; root `./Failures.md` is not writable without exact authorization.
    - **Excluded paths:** no implementation outside approved guidance files; no command/test/gate/build/browser/database/deploy/backup/service action; no task checkmark merely for file changes; no locked-path write; no relocation claim; no runtime spawning.
    - **Dependency:** 7.5.
    - **Requirements:** Special Requirements 1–3; Requirements 2.1–2.4, 7.1–7.7, 10.1–10.10, 15.1–15.5, 18.1–18.8, 19.1–19.7, 24.1–24.8, 25.1–25.10, 26.1–26.7, 27.1–27.7, 28.1–28.20, 29.1–29.10, 30.8–30.18, 30.24–30.27, and 31.1–31.10.
    - **Static evidence:** the handoff uses the 13-field Contract order and repeats Task Outcome, changed scope, Agent Roster, Ownership Matrix, Route Record, selected/rejected skills, Multi-Agent Evidence, static proof, pending owner-controlled checks, Coverage-Gap Admissions, artifact fields and observed placement, Locked Path and Site Write decisions, Separate Approval Work, True Blockers only when evidenced and authorized in root `./Failures.md`, and next owner action. It explicitly states that rendered behavior, hosted persistence, connected MCP, Power availability, successful commands, and Full Gate outcome were not established by static inspection.

- [ ] Checkpoint E — Reconcile the Agent Compliance Contract before declaring the guidance plan complete
  - **Owned paths:** read-only comparison of the current `./agents-work/oando-repository-guide/README.md`, all eleven Markdown chapters, `./.kiro/skills/oando-master/SKILL.md`, the final Route/Handoff records, and the changed-path inventory; no new owner is created for this checkpoint.
  - **Excluded paths:** every application/runtime write; `./site/`; `./docs/`; `./Agents/`; root-level `./*.md`; hooks/settings/MCP; packages/configuration; tests, gates, builds, typechecks, scripts, services, databases, deployment, backups, automatic spawning, and all implementation commands.
  - **Dependency:** the README, chapter 11, router, and final handoff owners have completed their existing leaves; the checkpoint is reconciled serially by the Serial Integration Owner before final closure.
  - **Requirements:** Requirement 32.1–32.16; Requirements 17.1–17.9, 23.1–23.14, 24.1–24.8, 25.1–25.10, 28.1–28.20, 29.1–29.10, 30.1–30.27, and 31.1–31.10.
  - **Static evidence:** the README, chapter 11, and router all require every Agent to read the current user request and applicable global repository standard first; declare assigned scope, exact owned paths and permissions, exclusions, delivery conditions, and validation state; perform only requested work; reject inferred permission for adjacent cleanup, tests, scripts, documentation, package/configuration changes, UI changes, and other helpful additions; fix small in-scope quality defects without unrelated expansion; preserve unrelated work; and stop on conflict or missing authorization. The records name ambiguous ownership, default helpful behavior, hidden repository constraints, and task expansion as drift causes and show the controls for each. The coordinator comparison rejects or reconciles drift before integration, limits work to four Agents, preserves disjoint ownership and serial integration, and invokes the Conflict Stop Rule. Each handoff lists changed files with reasons, validation actually run, validation not run, remaining issues, and next owner action. Locked Paths, `./agents-work/`, `./results/`, the `./tech-docs-generator/`/`./site/` sibling boundary, and the strict `./site/` write boundary remain intact. No command or application implementation is treated as authorized by this plan.

  - [ ]* 7.7 Write the optional static/property check for Property 1: First-router authority and Begin Here ordering
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current guide/skill files are read-only fixtures.
    - **Excluded paths:** no current implementation change, runtime router, automatic spawning, hook/settings/runtime/package/database/output change, locked-path write, or test execution in this workflow.
    - **Dependency:** 7.2.
    - **Requirements:** Special Requirement 1.1–1.5; Requirements 1.1–1.4, 8.1–8.2, 8.9, 14.1–14.6, 21.1–21.5, and 30.1–30.3, 30.10, 30.20.
    - **Static evidence:** a future property fixture would assert first read of `oando-master`, authority order, exact evidence paths, Domain Index selection, Workflow Mode/risk/command classification, Standing Multi-Agent minimum pair, and owner decision only after routing; it remains unimplemented and unrun.

  - [ ]* 7.8 Write the optional static/property check for Property 2: Complete additive Route Records
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current guide/skill files are read-only fixtures.
    - **Excluded paths:** no guide/skill edits, runtime route discovery, automatic spawning, hooks/settings/runtime/package/database/output change, locked-path write, or test execution.
    - **Dependency:** 7.7.
    - **Requirements:** Special Requirement 1.2–1.5; Requirements 8.3–8.9, 9.1–9.2, 9.7, 30.10–30.12, and 31.2.
    - **Static evidence:** a future fixture would assert outcome, domain, candidate paths, every matching selected skill, rejected reasons, risk, command classes, validation state, Local Evidence no-match route, roster/ownership/serial owner fields, and Completion Record preservation; it remains pending.

  - [ ]* 7.9 Write the optional static/property check for Property 3: Complete 22-card coverage and ordered evidence
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current README/chapters are read-only fixtures.
    - **Excluded paths:** no current guide edit, new runtime checker, automatic spawning, locked-path write, command, or test execution.
    - **Dependency:** 7.8.
    - **Requirements:** Special Requirement 2.1; Requirements 2.1–2.14, 20.1–20.8, 30.22, and 31.10.
    - **Static evidence:** a future fixture would assert required card fields, exact Start Paths/discovery labels, chapter mapping, classifier fields, ordered Evidence Steps, exactly one Coverage Audit row, and D22 routing outside the baseline; it remains pending.

  - [ ]* 7.10 Write the optional static/property check for Property 4: Ordered Plain-Language Response Contract
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current guide/skill files are read-only fixtures.
    - **Excluded paths:** no current prompt/guide edit, runtime response validator, automatic spawning, locked-path write, command, or test execution.
    - **Dependency:** 7.9.
    - **Requirements:** Special Requirement 2.2–2.4; Requirements 15.1–15.5, 21.6–21.10, 22.7, 30.15–30.16, and 31.4.
    - **Static evidence:** a future fixture would assert the 13 fields in order, specialized-term explanation, missing-proof state, validation state, next owner action, pre-implementation status, and post-verification Completion Record; it remains pending.

  - [ ]* 7.11 Write the optional static/property check for Property 5: Complete safe Prompt Cookbook
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current Prompt Cookbook text is a read-only fixture.
    - **Excluded paths:** no prompt edits, runtime prompt loader, automatic spawning, locked-path write, command, or test execution.
    - **Dependency:** 7.10.
    - **Requirements:** Requirements 16.1–16.5, 22.1–22.7, 30.23, and 31.10.
    - **Static evidence:** a future fixture would assert exactly 25 categories, complete preamble, placeholders, scope, exact evidence starts, expected evidence, stop condition, additive skill selection, command classification, dual authorization, exact proof/pending request, and Emergency one-sentence shape; it remains pending.

  - [ ]* 7.12 Write the optional static/property check for Property 6: Conditional skill routing and local-first capability selection
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current skill/router text is read-only.
    - **Excluded paths:** no Power activation, MCP connection, skill-loader runtime, automatic spawning, hook/settings change, locked-path write, command, or test execution.
    - **Dependency:** 7.11.
    - **Requirements:** Requirements 3.7, 5.1–5.7, 8.1–8.8, 9.3–9.7, 13.1–13.4, 30.19, 30.27, and 31.8.
    - **Static evidence:** a future fixture would assert every matching skill selected, non-matches rejected, Local Evidence before Powers/MCPs, registry confirmation before optional capability, no unconfirmed availability claim, distinct MCP schema/configuration/connection states, and no runtime activation; it remains pending.

  - [ ]* 7.13 Write the optional static/property check for Property 7: UI, fork, and AI evidence boundaries
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current domain guidance is a read-only fixture.
    - **Excluded paths:** no product UI/runtime/fork/AI change, browser/provider command, automatic spawning, locked-path write, or test execution.
    - **Dependency:** 7.12.
    - **Requirements:** Requirements 3.1–3.6, 5.3, 5.7, 12.5, 30.4–30.7, and 30.26.
    - **Static evidence:** a future fixture would assert route-to-feature/component/FOCSS guidance, Visual Detail Checklist, asset/motion safeguards, Planner/Studio no-cross-import, Site Write Gate preservation, and advisory-only AI claims; it remains pending.

  - [ ]* 7.14 Write the optional static/property check for Property 8: Evidence-labelled technical and data ownership
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current technical guidance is a read-only fixture.
    - **Excluded paths:** no schema/migration/type/seed/database action, runtime change, automatic spawning, locked-path write, command, or test execution.
    - **Dependency:** 7.13.
    - **Requirements:** Requirements 6.1–6.10, 10.5, 11.6, 29.1–29.7, and 30.24–30.25.
    - **Static evidence:** a future fixture would assert evidence status/source for package/framework/command/route/database/asset/persistence claims, Products/Admin selection, correct migrations, mode-aware persistence, live-evidence precedence, and exact workspace classification; it remains pending.

  - [ ]* 7.15 Write the optional static/property check for Property 9: Typed artifact placement and producer ownership
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; placement prose is a read-only fixture.
    - **Excluded paths:** no report under `./results/`, no artifact move, no generated-output edit, no `./site/` write, no locked-path write, automatic spawning, command, or test execution.
    - **Dependency:** 7.14.
    - **Requirements:** Special Requirement 3.5; Requirements 7.1–7.7, 18.1–18.3, 24.1–24.8, 28.1–28.20, 29.1–29.10, 30.24–30.26, and 31.6–31.7.
    - **Static evidence:** a future fixture would assert Workstream/Purpose Subfolder, filename pattern, owning source/script, authored/generated state, rejected placements, Completion Record repetition, root-artifact legacy handling, sibling/separation rules, and Site Write Gate fields; it remains pending.

  - [ ]* 7.16 Write the optional static/property check for Property 10: Protected Command permission and honest validation
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current command guidance and hook files are read-only fixtures.
    - **Excluded paths:** no Protected Command execution, hook change, policy change, typecheck/test/gate/build/browser/database/deploy/backup/service command, automatic spawning, locked-path write, or test execution.
    - **Dependency:** 7.15.
    - **Requirements:** Requirements 10.1–10.10, 18.4–18.6, 25.1–25.10, 30.6, 30.24, and 31.2–31.4.
    - **Static evidence:** a future fixture would assert dual authorization, pending state without either permission, named-check eligibility only, inline-marker rejection, exact observation fields, and no command implication from the plan; it remains pending.

  - [ ]* 7.17 Write the optional static/property check for Property 11: Failure Triage preserves controls
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current quality/operations guidance is a read-only fixture.
    - **Excluded paths:** no gate/hook/baseline/test-selection change, no Full Gate or diagnostic command, automatic spawning, locked-path write, or test execution.
    - **Dependency:** 7.16.
    - **Requirements:** Special Requirement 3.1–3.5; Requirements 18.7–18.8, 24.7–24.8, 25.7–25.9, 30.6, 30.14, and 31.7.
    - **Static evidence:** a future fixture would assert read-only triage before control proposals, exact failure fields, unverified cause without current output, smallest authorized diagnostic, preserved controls, and canonical blocker handling; it remains pending.

  - [ ]* 7.18 Write the optional static/property check for Property 12: Exactly four roles and conflict-safe Standing Multi-Agent integration
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current chapter/router text is a read-only fixture.
    - **Excluded paths:** no agent definitions, multi-agent runtime, automatic spawning, overlapping writes, command, locked-path write, or test execution.
    - **Dependency:** 7.17.
    - **Requirements:** Requirements 17.1–17.9, 23.1–23.14, 30.1–30.18, 30.20–30.27, and 31.2, 31.4, 31.6, 31.8.
    - **Static evidence:** a future fixture would assert exactly four role names, minimum pair before exploration/write, maximum four agents, availability state, read-only/disjoint parallelism, ownership before writes, complete roster/ownership/route/handoff/serial fields, owner status before implementation, Completion Record after verification, no silent fallback, and conflict stop before owner review/Serial Integration; it remains pending.

  - [ ]* 7.19 Write the optional static/property check for Property 13: Surface Status and Coverage-Gap no-overclaim
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current status/gap guidance is a read-only fixture.
    - **Excluded paths:** no surface/runtime changes, hosted check, automatic spawning, locked-path write, command, or test execution.
    - **Dependency:** 7.18.
    - **Requirements:** Requirements 4.1–4.7, 19.1–19.7, 26.1–26.7, 30.16, 30.24, and 31.3.
    - **Static evidence:** a future fixture would assert allowed status, source, limitation, next evidence source, owner action, scope, next decision, response/Completion propagation, and no wired/complete claim without End-to-End Evidence; it remains pending.

  - [ ]* 7.20 Write the optional static/property check for Property 14: Minimal scope, approval separation, and task-state honesty
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current plan and boundary prose are read-only fixtures.
    - **Excluded paths:** no hook/policy/runtime/package/database/deployment/backup/MCP/Power work, no task-state mutation, automatic spawning, locked-path write, command, or test execution.
    - **Dependency:** 7.19.
    - **Requirements:** Requirements 11.1–11.6, 12.1–12.5, 13.1–13.4, 19.6–19.7, 27.1–27.7, 30.19, 30.27, and 31.8–31.9.
    - **Static evidence:** a future fixture would assert smallest sound change, narrowest proof, Separate Approval Work, open/pending downstream state, `./plans/<name>/` placement, no runtime spawning, Locked Path Gate separation, and explicit unimplemented separate work; it remains pending.

  - [ ]* 7.21 Write the optional static/property check for Property 15: Exact workspace boundaries and Site Write Gate
    - **Owned paths:** future decision-gated `./tests/unit/docs/oando-master-properties.test.ts`; current artifact/workspace prose is a read-only fixture.
    - **Excluded paths:** no `./site/` write, workspace relocation, generator/package/runtime change, automatic spawning, Site Write Gate bypass, locked-path write, command, or test execution.
    - **Dependency:** 7.20.
    - **Requirements:** Requirements 28.1–28.20, 29.1–29.10, 30.24–30.26, and 31.1–31.10.
    - **Static evidence:** a future fixture would assert exact `./` directory forms, root-level sibling relationship, separate `./generated-documents/`, distinct `./results/site/`, Core Product Write versus Non-Core Artifact classification, redirect/stop behavior, required fields, Locked Path Gate, exact-file authorization, and no relocation claim; it remains pending.

## Notes

- Tasks marked with `*` are optional, future, decision-gated static/property checks because the design contains Correctness Properties. They are not part of the current guidance implementation, are not to be implemented or run in this workflow, and do not authorize any test runner.
- The current requested operation updates only `./.kiro/specs/oando-master/tasks.md`; it does not implement the guide, router, AI skill, HTML projection, or any other downstream task.
- The optional AI branch is not selected by this request. If no explicit owner selection is supplied during downstream execution, keep `./.kiro/skills/ai-retrieval/SKILL.md` absent and retain the documented fallback; do not create a placeholder.
- The HTML branch is conditional on evidence. If no Markdown-to-HTML relationship is established, do not edit HTML, do not invent a generator, and retain the parity-gap admission.
- No task authorizes tests, gates, builds, typechecks, browser runs, database actions, deployment, backup, local services, Power activation, MCP connection, automatic runtime spawning, or policy/hook changes. `pnpm run typecheck:scripts` is unavailable and is never validation evidence.
- Every task/leaf declares exact owned paths, excluded paths, dependency, concrete static evidence, and requirement references. Shared terminology and shared files are serial; no overlapping writes are placed in one wave.
- `./docs/`, `./Agents/`, and root-level `./*.md` remain Locked Paths and read-only evidence by default. `./Failures.md` remains locked without exact authorization. `./agents-work/` is not `./Agents/`, and no copy elsewhere may claim a locked file was changed.
- Agent-authored work remains under `./agents-work/<workstream>/<report-type>/`; Machine Evidence remains under `./results/<purpose>/`; generated tech-docs remains under `./generated-documents/`; active separate plans use `./plans/<name>/`; true blockers use only root `./Failures.md` when explicitly authorized; no new root-level reports/results are planned.
- `./tech-docs-generator/` remains a root-level sibling of `./site/`; `./results/site/` is distinct Machine Evidence; `./site/` accepts only explicitly approved Core Product Writes and rejects reports, results, skills, prompts, plans, generated/temp/debug files, and all other Non-Core Artifacts.
- The final handoff must tell the owner how to open this `tasks.md` and start an open task item. It must state that this workflow is complete as a planning artifact only and that no implementation or protected validation was run.

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
    { "id": 9, "tasks": ["2.6"] },
    { "id": 10, "tasks": ["3.1"] },
    { "id": 11, "tasks": ["3.2"] },
    { "id": 12, "tasks": ["3.3"] },
    { "id": 13, "tasks": ["3.4"] },
    { "id": 14, "tasks": ["3.5"] },
    { "id": 15, "tasks": ["3.6"] },
    { "id": 16, "tasks": ["3.7"] },
    { "id": 17, "tasks": ["3.8"] },
    { "id": 18, "tasks": ["3.9"] },
    { "id": 19, "tasks": ["3.10"] },
    { "id": 20, "tasks": ["4.1"] },
    { "id": 21, "tasks": ["4.2"] },
    { "id": 22, "tasks": ["4.3"] },
    { "id": 23, "tasks": ["4.4"] },
    { "id": 24, "tasks": ["4.5"] },
    { "id": 25, "tasks": ["5.1"] },
    { "id": 26, "tasks": ["5.2"] },
    { "id": 27, "tasks": ["5.3"] },
    { "id": 28, "tasks": ["6.1"] },
    { "id": 29, "tasks": ["6.2"] },
    { "id": 30, "tasks": ["7.1"] },
    { "id": 31, "tasks": ["7.2"] },
    { "id": 32, "tasks": ["7.3"] },
    { "id": 33, "tasks": ["7.4"] },
    { "id": 34, "tasks": ["7.5"] },
    { "id": 35, "tasks": ["7.6"] },
    { "id": 36, "tasks": ["7.7"] },
    { "id": 37, "tasks": ["7.8"] },
    { "id": 38, "tasks": ["7.9"] },
    { "id": 39, "tasks": ["7.10"] },
    { "id": 40, "tasks": ["7.11"] },
    { "id": 41, "tasks": ["7.12"] },
    { "id": 42, "tasks": ["7.13"] },
    { "id": 43, "tasks": ["7.14"] },
    { "id": 44, "tasks": ["7.15"] },
    { "id": 45, "tasks": ["7.16"] },
    { "id": 46, "tasks": ["7.17"] },
    { "id": 47, "tasks": ["7.18"] },
    { "id": 48, "tasks": ["7.19"] },
    { "id": 49, "tasks": ["7.20"] },
    { "id": 50, "tasks": ["7.21"] }
  ]
}
```

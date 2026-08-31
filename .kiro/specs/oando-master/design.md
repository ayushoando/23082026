# Design Document: Oando Master Repository Guide and Router

## 1. Design summary

This is a documentation-and-skill-routing deliverable for the Oando repository. It does not add a product route, runtime API, executable router, package command, database change, hook change, deployment action, external MCP connection, or Power activation.

The deliverable has two cooperating prose surfaces:

1. **The first router:** `.kiro/skills/oando-master/SKILL.md` is the canonical repository-local Kiro skill. It is read first for every Repository Task, creates an inspectable Route Record, selects every matching repository skill, classifies risk and commands, and defines evidence-based completion.
2. **The guide:** `agents-work/oando-repository-guide/README.md` is the beginner-facing start page. Its existing eleven numbered Markdown chapters remain the evidence-oriented guide. The guide is augmented with a Begin Here flow, a 22-card verified Domain Index, a Coverage Audit, Coverage-Gap Admission Cards, the Plain-Language Response Contract, a complete Prompt Cookbook, and a four-role multi-agent procedure.

The guide and skill are instructions for human and agent behavior. Their records are prose templates and static tables, not persisted runtime objects. Any future static checker would validate these documents; no such checker is created by this design.

### Current authoritative facts used by the design

- Authority remains: **current user instruction → live code and fresh command output → `AGENTS.md` → `Agents/` → `docs/`**. `plans/README.md` governs active planning coordination after those sources; it is not a substitute for live facts.
- The current guide is `agents-work/oando-repository-guide/README.md`, eleven numbered Markdown chapters, matching static HTML pages, and `guide.css`.
- Existing repository-local skills are `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`, `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate`.
- `.kiro/mcp/` contains schemas and `.kiro/settings/mcp.json` currently has an empty `mcpServers` object. Neither establishes a connected MCP server or an installed Power.
- The current `block-agent-tests` hook is enabled for shell-tool pre-use and blocks the protected command families identified in its source. This design does not change it. An inline marker that may affect hook behavior is not treated by the guide as proof of current-session Explicit User Authorization.
- The user-provided live fact that `scripts/tsconfig.json` is absent wins over the contradictory historical documentation claim. `pnpm run typecheck:scripts` is therefore labelled unavailable and is not recommended validation.
- Agent-authored reports and work products belong under `./agents-work/<workstream>/<report-type>/` or an existing approved workstream folder; new reports do not belong at the `./agents-work/` root.
- Machine-generated command and script evidence belongs under `./results/<purpose>/`; existing `./results/tests/`, `./results/site/`, `./results/site-ui/`, and `./results/ops/` are purpose folders, not permission to write at the `./results/` root.
- `./generated-documents/` is the separate output of the root-level `./tech-docs-generator/` package, which remains a sibling of `./site/`; no relocation is implied or claimed.
- `./site/` is the Next.js Site Source Tree and accepts only explicitly approved Core Product Writes. Reports, results, audits, handoffs, prompts, plans, skills, steering, MCP definitions, generated files, temporary/debug files, and other Non-Core Artifacts are prohibited there.
- Every Output-Producing Task declares its Artifact Class, selected subfolder, filename pattern, owning source or script, and authored-or-generated state in the Route Record and repeats those fields with observed placement evidence in the Completion Record.
- The current `.kiro/specs/oando-master/.config.kiro` remains valid and is retained unchanged.

## 2. Goals and non-goals

### Goals

- Give a beginner one outcome-focused Begin Here path that does not require repository vocabulary.
- Make the 22 required Domain Index cards concrete, path-oriented, chapter-mapped, and coverage-audited.
- Make the skill-routing decision visible and additive without pretending that prose is a runtime discovery engine.
- Require the Plain-Language Response Contract at every task lifecycle point.
- Provide all 25 copy-paste Prompt Cookbook categories with one shared safety preamble and category-specific evidence paths.
- Define exactly four multi-agent roles, safe parallelism, exclusive ownership, handoffs, serial integration, and the Conflict Stop Rule.
- Enforce a non-expert Agent Compliance Contract that requires pre-work reading and scope declarations, rejects inferred permission and scope drift, preserves unrelated work, stops conflicts, and produces a plain-language handoff with changed-file reasons and honest validation state.
- Preserve honest Surface Status and explicitly admit missing or unverified areas.
- Keep Protected Commands under exact owner authorization and hook permission, while separating current guidance from separately approved implementation or policy work.
- Make artifact class, approved subfolder, owning producer, and authored/generated state explicit for every output-producing task, and enforce the Site Write Gate for every proposed `./site/` write.
- Replace the stale completed downstream plan in the next Tasks phase with serial, evidence-bound implementation tasks and checkable documentation/static validation.

### Non-goals

- No change to `.kiro/hooks/block-agent-tests.json` or `.kiro/hooks/block-agent-tests.mjs`.
- No change to command allowlists, gate composition, quality baselines, test selection, package manifests, lockfiles, database migrations, RLS, runtime code, deployment configuration, backup state, or MCP configuration.
- No claim that a route, package, AI provider, Power, MCP server, build, test, browser workflow, hosted persistence path, or deployment is working merely because a path or declaration exists.
- No relocation of `./tech-docs-generator/`, `./generated-documents/`, `./site/`, or any root-level result artifact is performed or claimed by this design; a proposed package/output boundary change is a separate approved Workspace-Boundary Task.
- No write under `./site/` is allowed for a Non-Core Artifact; only an explicitly approved Core Product Write with a completed Site Write Gate may target the Site Source Tree.
- No cross-import between Planner and Studio, and no source change in either fork as part of this guidance revision.
- No new runtime implementation of Begin Here, routing, cards, response validation, or multi-agent coordination.

## 3. Architecture and content flow

The documentation flow is intentionally deterministic and inspectable, but it is not executable:

```text
ordinary-language desired outcome
  -> read oando-master first
  -> apply authority ordering and Local Evidence first
  -> create Route Record before any modification or output-path selection
  -> choose a Domain Index card and exact first evidence paths
  -> select every matching repository-local skill
  -> classify artifact class, approved subfolder, owning source/script, and authored/generated state for output-producing work
  -> apply the Site Write Gate before any proposed write under `./site/`
  -> record rejected skills and reasons, risk, Workflow Mode, and Command Classification
  -> ask only unavoidable Owner Decisions
  -> perform the smallest approved change within exclusive ownership
  -> record validation, Surface Status, or Coverage-Gap Admission
  -> serially integrate handoffs
  -> produce the Plain-Language Response Contract and Completion Record
```

### 3.1 Documentation surfaces and responsibilities

| Surface | Responsibility | Boundary |
|---|---|---|
| `.kiro/skills/oando-master/SKILL.md` | First router, authority order, conditional skill discovery, capability decision, Protected Command policy, completion contract | Prose only; no runtime loader or automatic activation. |
| `.kiro/skills/ai-retrieval/SKILL.md` | Proposed future guidance for `site/lib/ai/mastra/`, retrieval, providers, embeddings, and advisory output | Guidance-only Package Skill; it is selected only after the file exists. If absent, the Route Record admits the gap and uses Local Evidence plus matching existing skills. |
| `agents-work/oando-repository-guide/README.md` | Begin Here, 22-card Domain Index, Coverage Audit, card/gap templates, guide navigation | Human-authored guide work in the existing approved `./agents-work/oando-repository-guide/` workstream folder; no new report at the `./agents-work/` root. |
| `agents-work/oando-repository-guide/01–11-*.md` | Evidence chapters, domain detail, safety rules, cookbook, and multi-agent procedure | Preserve the current eleven-chapter structure; authored work stays in an approved `./agents-work/` workstream folder. |
| Matching `agents-work/oando-repository-guide/*.html` | Static presentation of the guide | Update only after the Markdown-to-HTML source relationship is established; HTML is human-authored guide work, not a `./results/` report. |
| `./tech-docs-generator/`, `./generated-documents/`, `./results/`, and `./site/` | Workspace package, generated tech-docs output, machine-evidence purposes, and Next.js product source | `./tech-docs-generator/` remains a root-level sibling of `./site/`; `./generated-documents/` remains separate; `./results/` uses purpose subfolders; `./site/` is reserved for approved Core Product Writes under the Site Write Gate. |
| `guide.css` | Existing guide presentation | No new product CSS system; only separately scoped guide presentation work if required. |
| `.kiro/specs/oando-master/` | Requirements/design/tasks specification artifacts | `.config.kiro` remains unchanged. The stale `tasks.md` is replaced in the next workflow phase, not in this design phase. |

## 4. Reorganizing the current eleven-chapter guide

The eleven Markdown chapters already provide the factual spine. The revision augments rather than discards them. README becomes the beginner front door; the numbered chapters remain the evidence sources referenced by cards. The HTML page names remain paired with the current Markdown pages, but their synchronization provenance is treated as unresolved until inspected.

| Existing source | Reorganized or augmented responsibility | Domain Index coverage |
|---|---|---|
| `README.md` | Begin Here Flow; outcome chooser; Route Record explanation; 22-card Domain Index; Coverage Audit; Coverage-Gap Admission template; links to cookbook and multi-agent procedure | D01, D02, D22 and the complete index |
| `01-repository-map.md` | Authority map, exact-path discipline, top-level source/status categories, discovery fallback | D01, D22 |
| `02-application-architecture.md` | Route → feature → component → lib/server/platform trace; Site/API/route and fork roots | D05, D06, D11, D12 |
| `03-product-domains.md` | Site/Admin/CRM/catalog/UI/Planner/Studio/AI outcomes; Visual Detail Checklist; surface distinctions | D06–D13 |
| `04-data-api-persistence.md` | Auth/security/API ownership; Products versus Admin; migrations, RLS, rollback, mode-aware persistence | D03, D05, D10, D13, D14 |
| `05-tooling-ci-tech-docs.md` | Tests, scripts, package/workspace boundaries, generated tech-docs, command authority | D02, D15–D17 |
| `06-operations-infrastructure.md` | Vercel, Worker, R2, Supabase, backups, observability, incidents, read-only release planning | D21 |
| `07-docs-governance-planning.md` | Authority, durable/procedure/plan/report placement, locked documentation, blockers | D18, D19 |
| `08-kiro-workspace.md` | Existing skills, future AI skill, Powers, MCP schema/configuration/connection distinction, least privilege | D20 |
| `09-local-generated-environment.md` | Environment/private/generated/legacy classification and output placement | D02, D04, D19 |
| `10-quality-validation.md` | Evidence matching, Protected Commands, Normal-Agent Eligible Checks, Failure Triage, honest limitations | D15, D21 and all validation-bearing cards |
| `11-working-with-kiro.md` | Plain-Language Response Contract; full Prompt Cookbook; exactly four roles; delegation/review prompts; Workflow Modes | All cards through common routing |

### 4.1 Markdown-to-HTML synchronization boundary

The live tree contains Markdown and matching HTML, but the inspected repository evidence does not identify a guide-specific Markdown-to-HTML generator. The implementation must therefore use this sequence:

1. Inspect the current guide files, repository scripts, documentation references, and any local provenance before changing an HTML page.
2. Determine whether Markdown is the authoring source, HTML is the authoring source, or a deterministic transformation exists. Do not assume that `pnpm run docs:sync` updates this guide; that command currently concerns generated inventories, not this guide.
3. If a source relationship is confirmed, update the source and regenerate or update the matching projection using the confirmed method, then record the exact relationship in the guide-maintenance handoff.
4. If no relationship can be established, treat Markdown as the human guide work surface, leave HTML unmodified unless an owner-approved static maintenance method is established, and create a Coverage-Gap Admission Card for HTML parity. Never call the HTML stale or current without evidence.

The static HTML pages are not a second authority. A Markdown/HTML difference is a synchronization question, not permission to invent a generator.

## 5. Begin Here Flow

The Begin Here Flow accepts exactly one required contributor input: an ordinary-language description of the desired outcome. The contributor does not need to supply a path, package, skill, workflow mode, or command.

### 5.1 Begin Here sequence

1. **Restate the outcome:** use an action verb and name the inferred Product Surface or repository domain; define any specialized term before relying on it.
2. **Apply authority ordering:** read `.kiro/skills/oando-master/SKILL.md` first, then use `START.md`, `AGENTS.md`, the relevant current guide chapter, and live paths as appropriate.
3. **Choose the first evidence locations:** output exact repository paths and a reason for reading each path before broader exploration.
4. **Select a Domain Index card:** choose one of the 22 cards below; if no card fits, choose D22 Unknown-area discovery.
5. **Discover candidate paths and skills:** use evidence to produce candidates, select every matching Package Skill, and reject non-matching skills with reasons. A skill name is an output, not an input assumption.
6. **Select Workflow Mode:** choose `Vibe`, `Plan`, `Spec`, `Autopilot`, or `Supervised` from scope and Operational-Risk Classification. This is guidance language, not a runtime mode switch.
7. **Classify commands:** mark each proposed command `read-only inspection`, `Normal-Agent Eligible Check`, `Protected Command`, or `no-run pending authorization` before proposing or running it.
8. **Classify output and workspace boundaries:** for every Output-Producing Task, declare the Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, and authored-or-generated state; if a target is under `./site/`, apply the Site Write Gate and classify it as a Core Product Write or Non-Core Artifact before any write.
9. **Classify risk:** record source, data, credentials, release, external-system, fork-boundary, or documentation risk and the owner boundary.
10. **Request only unavoidable Owner Decisions:** explain all specialized terms, candidates, risks, artifact destinations, and command requirements first. If safe modification is not possible, choose read-only discovery instead.
11. **Begin work only after the Route Record exists:** the route record is a reportable prose checkpoint, not a runtime object; it must capture the selected output home and any rejected placement.

### 5.2 Begin Here output

Every Begin Here response displays, in this order where applicable:

- Task Outcome;
- Workflow Mode;
- exact first evidence locations and the reason for each;
- candidate files or areas;
- selected Package Skills;
- rejected Package Skills and reasons;
- Command Classification;
- Artifact Class, exact selected Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, and authored-or-generated state when the task produces output;
- Site Write Gate decision when any target is under `./site/`;
- Operational-Risk Classification;
- numbered next action.

If the ordinary-language description is underspecified, the next action is read-only discovery and the response names only the unavoidable Owner Decision. No path, package, or command is guessed.

## 6. Plain-Language Response Contract

The contract is mandatory for every task-start, progress, handoff, pause, and completion response. It is written for an owner who may not know repository terminology. Every specialized term is explained before an Owner Decision is requested.

The fields must appear in exactly this order:

1. **Outcome** — the desired result in ordinary language and the selected Domain Index card.
2. **Known** — facts established by user instruction, live code, or fresh authorized output, with sources.
3. **Unverified** — claims not established, including absent command output, HTML parity, rendered behavior, hosted persistence, or Power/MCP availability.
4. **Exact First Evidence Locations** — exact paths and the reason each is the first read.
5. **Selected Skills** — every matching Package Skill and the trigger evidence.
6. **Rejected Skills and Reasons** — each considered but non-matching or unavailable skill, with a plain-language reason; if no skills match, state Local Evidence and why.
7. **Numbered Next Actions** — smallest sequential actions, including whether each is read-only, a write, or owner-controlled.
8. **Likely Files or Areas** — candidate scope, not a claim that each will change.
9. **Risk** — operational, data, security, fork, release, documentation, or external-system risk.
10. **Allowed Checks** — checks allowed now under the live policy and hook, or state that none are eligible.
11. **Protected or Pending Checks** — exact commands that require current-session Explicit User Authorization and Hook Permission, plus any hook block or missing authorization.
12. **Exact Completion Proof** — the exact artifact, static comparison, command result, or browser/hosted evidence needed; never substitute one proof type for another.
13. **Unavoidable Owner Decisions** — only decisions the router cannot establish from Local Evidence.

For an Output-Producing Task, the Contract also reports the Artifact Class, selected Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement evidence without changing the required 13-field order. A target under `./site/` additionally reports the Site Write Gate classification, exact Core Product outcome if approved, owned paths, matching skills, and expected evidence. A Non-Core Artifact is redirected before writing.

## 7. Repository Domain Index: 22 coverage-audited cards

The Domain Index is an outcome classifier, not a claim that a capability is wired. The required Start Paths below are the verified-path coverage baseline from the expanded requirements and current guide. Each path must be rechecked against the live filesystem during implementation. A path can be a source, generated, local-private, legacy, absent, or present-but-unverified location; path presence alone never establishes an end-to-end workflow. When a card names an output or workspace boundary, it uses Exact Directory Path form for `./agents-work/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, and `./results/site/` and records the artifact destination rather than implying relocation.

### 7.1 Common Coverage-Audited Task Card structure

Every card contains all of these fields:

```text
Card ID and outcome name
Goal: action verb + named Product Surface/repository domain + defined specialized terms
Start Paths: exact repository paths, or an explicitly labelled path-discovery instruction
Scope: what the card includes and excludes
Evidence Steps:
  1. read authority sources in authority order
  2. inspect the listed paths
  3. compare documentation with live evidence
  4. classify status and operational risk
  5. record evidence, gaps, route, and next decision
Allowed Actions: bounded reads, approved edits, and permitted static checks
Forbidden Actions: guessed paths, unrelated edits, Protected Commands without both permissions,
                  scope expansion, secret exposure, and implementation of Separate Approval Work
Risk: source/data/security/fork/release/external/documentation classification
Expected Evidence: exact files, static diffs, authorized outputs, or explicit pending state
Artifact Boundary (when output is produced): Artifact Class; exact Workstream Subfolder or Purpose Subfolder; filename pattern; owning source or script; authored-or-generated state; rejected placements
Site Write Gate (when a target is under `./site/`): Core Product Write or Non-Core Artifact, exact outcome, owned paths, matching skills, and expected evidence
Next Decision: the next bounded action or the single unavoidable Owner Decision
Selected skills and no-match/rejection reasons
Surface Status or Coverage-Gap Admission link when end-to-end evidence is absent
```

Every card also appears in the task-classifier table with trigger, first evidence, selected skills, command status, and completion-evidence expectation. The full card may use the chapter link shown below for detailed guidance, but the index record must retain all required fields or point unambiguously to the complete card section.

### 7.2 Verified source-path and classifier mapping

| ID / required outcome | Chapter | Verified Start Paths (exact baseline) | Trigger and conditional skills | Command status and expected completion evidence |
|---|---:|---|---|---|
| **D01 Repository map and authority** | 01 | `START.md`; `AGENTS.md`; `docs/architecture/layout.md`; `docs/architecture/stack.md`; `docs/architecture/routes.md`; `docs/architecture/product-map.md`; `agents-work/oando-repository-guide/README.md`; `agents-work/oando-repository-guide/01-repository-map.md`; `plans/README.md` | Orientation/path discovery → `repo-map`; shared impact only when evidenced → `graph-impact` | Read-only inspection first. Completion is a Route Record with authority order, exact first paths, and selected/rejected skills. |
| **D02 Initialization, local development, and debugging** | 09 | `START.md`; `AGENTS.md`; `package.json`; `site/`; `config/build/`; `Failures.md`; `agents-work/oando-repository-guide/09-local-generated-environment.md` | Onboarding/debug/path discovery → `repo-map`; no default runtime start | Install, dev, build, test, and local-service commands are Protected Commands. Completion is an environment/status inventory or explicit pending owner validation. |
| **D03 Auth, security, and secrets** | 04 | `site/proxy.ts`; `site/lib/security/`; `site/platform/supabase/`; `.env.example`; `.env.local`; `site/.env.local`; `docs/architecture/stack.md` | Orientation → `repo-map`; data/RLS/migration trigger → `db-migrations`; shared impact only if evidenced → `graph-impact` | Never expose local secrets. Checks are classified before use. Completion names auth source, secret boundary, and unverified hosted behavior. |
| **D04 Environment** | 09 | `.env.example`; `.env.local`; `site/.env.local`; `package.json`; `pnpm-workspace.yaml`; `START.md`; `agents-work/oando-repository-guide/09-local-generated-environment.md` | Environment/path discovery → `repo-map` | No environment sync or service command by default. Completion is a status-labeled environment map; local files remain private. |
| **D05 APIs** | 04 | `site/app/api/`; `site/lib/apiCatalog.ts`; `site/proxy.ts`; `docs/architecture/routes.md`; `agents-work/oando-repository-guide/04-data-api-persistence.md` | Path discovery → `repo-map`; shared/API dependency impact → `graph-impact`; DB trigger → `db-migrations` | API tests, builds, and hosted checks are Protected Commands. Completion includes route source, auth/CSRF/data boundary, and proof limitation. |
| **D06 Site UI, SEO, i18n, accessibility, and performance** | 02, 03 | `site/app/(site)/`; `site/features/site/`; `site/components/home/`; `site/focss/site/`; `site/i18n/`; `docs/architecture/routes.md`; `docs/architecture/product-map.md`; `docs/architecture/stack.md` | UI styling/token trigger → `focss-css`; shared impact → `graph-impact`; orientation → `repo-map` | UI/browser/performance checks are Protected unless an exact eligible check is named. Completion requires the Visual Detail Checklist and exact rendered-proof limitation. |
| **D07 UI polish, icons, alignment, FOCSS, motion, and assets** | 03 | `site/components/`; `site/focss/`; `site/public/`; `scripts/generate-svg/`; `docs/architecture/css.md`; `docs/architecture/stack.md`; `agents-work/oando-repository-guide/03-product-domains.md` | Styling/icons/FOCSS → `focss-css`; shared impact → `graph-impact`; asset generation is Local Evidence first | `verify:focss`, token, UI, browser, and generator checks are classified before use. Completion includes existing Phosphor abstraction, alignment, states, keyboard, responsive, motion, and asset evidence. |
| **D08 Admin** | 03 | `site/app/admin/`; `site/features/admin/`; `site/components/`; `site/lib/admin/`; `docs/architecture/routes.md`; `docs/architecture/product-map.md` | Styling → `focss-css`; data/schema → `db-migrations`; shared impact → `graph-impact`; otherwise `repo-map` | Admin mutations/database actions are Protected. Completion distinguishes route presence from authorization and database-backed behavior. |
| **D09 CRM demo versus customer-query operations** | 03, 06 | `site/app/admin/crm/`; `site/features/crm/`; `site/app/admin/customer-queries/`; `site/app/api/customer-queries/`; `site/features/ops/`; `docs/architecture/product-map.md`; `docs/architecture/routes.md` | Orientation → `repo-map`; Admin data work → `db-migrations`; operations risk → `powers-skills-model` only when capability packaging is actually implicated | The CRM browser workspace is `demo/local-only` while evidence is Zustand key `oando-crm-storage`; customer queries are separately Admin DB-backed. Completion records both statuses and any gap. |
| **D10 Catalog, configurator, quotes, and inventory** | 03, 04 | `site/lib/catalog/`; `site/features/shared/catalog/`; `site/app/(site)/products/`; `site/app/(site)/quote-cart/`; `site/app/admin/catalog/`; `site/app/admin/inventory/`; `site/app/api/configurator/`; `site/platform/supabase/migrations/` | Catalog UI → `focss-css` when styling; ownership/schema → `db-migrations`; shared impact → `graph-impact`; orientation → `repo-map` | Migration, seed, publish, browser, and external storage actions are Protected. Completion names Products/Admin ownership, asset/release path, and hosted-proof limitation. |
| **D11 Planner** | 03 | `site/app/ooplanner/`; `site/features/Planner/`; `site/components/Planner/`; `site/lib/Planner/`; `site/hooks/Planner/`; `site/store/Planner/`; `site/server/Planner/`; `site/platform/Planner/`; `site/app/api/Planner/`; `agents-work/oando-repository-guide/03-product-domains.md` | Planner trigger → `planner-studio`; fork tree/cross-import → `fork-boundaries`; shared impact → `graph-impact`; DB → `db-migrations`; styling → `focss-css` | `pnpm run scan:boundaries`, browser, tests, builds, and persistence checks are Protected/pending unless authorized. Completion must not claim Studio behavior or hosted persistence from Planner-only evidence. |
| **D12 Studio** | 03 | `site/app/oostudio/`; `site/features/Studio/`; `site/components/Studio/`; `site/lib/Studio/`; `site/hooks/Studio/`; `site/store/Studio/`; `site/server/Studio/`; `site/platform/Studio/`; `site/app/api/Studio/`; `agents-work/oando-repository-guide/03-product-domains.md` | Studio trigger → `planner-studio`; fork tree/cross-import → `fork-boundaries`; shared impact → `graph-impact`; DB → `db-migrations`; styling → `focss-css` | Same Protected Command boundary as Planner. Completion distinguishes Studio furniture/descriptor proof from Planner rail proof and preserves no-cross-import. |
| **D13 AI and retrieval** | 03 | `site/lib/ai/mastra/`; `site/app/api/ai-advisor/`; `site/app/api/Studio/ai/`; `site/features/Studio/`; `docs/architecture/stack.md`; `agents-work/oando-repository-guide/03-product-domains.md` | If `.kiro/skills/ai-retrieval/SKILL.md` exists, select it; otherwise use Local Evidence, `repo-map`, and every other matching skill and record the missing skill. Use `powers-skills-model` only for a demonstrated capability-packaging question. | Provider calls, builds, tests, and external access are Protected/separate. Completion frames output as advisory and records exact model/retrieval evidence or no evidence; never claims deployment/evaluation without proof. |
| **D14 Databases, RLS, grants, rollback, and mode-aware persistence** | 04 | `site/platform/supabase/migrations/`; `site/platform/supabase/migrations.admin/`; `site/platform/drizzle/schema/`; `site/lib/Planner/plannerPersistenceMode.ts`; `site/lib/catalog/furnitureCatalogMode.ts`; `site/platform/Planner/data/`; `site/platform/shared/data/furniture/`; `site/inventory/descriptors/`; `docs/database/schema.md`; `docs/database/ops.md`; `docs/database/drizzle.md` | Schema/SQL/RLS/ownership → `db-migrations`; impact → `graph-impact`; Planner/Studio fork trigger → `planner-studio` and `fork-boundaries` | Apply, dry-run, types, seed, and remote DB actions are Protected; migrations require rollback, grants, and policies. Completion states Products versus Admin owner, mode, read-only production constraint, and pending hosted proof. |
| **D15 Tests, fixtures, mocks, two Vitest lanes, and Playwright** | 05, 10 | `tests/`; `tests/unit/`; `tests/integration/`; `tests/e2e/`; `tests/fixtures/`; `tests/helpers/`; `tests/tech-docs-generator/`; `config/build/`; `Testing-handbook.md`; `package.json` | Validation planning only after exact authorization and hook permission → `verify-and-gate`; orientation → `repo-map`; shared impact → `graph-impact` | Tests, browser runners, coverage, and gates are Protected. Completion records both Vitest lanes where applicable, exact command, root cwd, authorization, hook decision, exit status, scope, and limitations. |
| **D16 Scripts and command registry** | 05 | `package.json`; `scripts/`; `scripts/run-ops.mjs`; `scripts/ops-command-registry.mjs`; `config/build/`; `docs/architecture/scripts.md`; `agents-work/oando-repository-guide/05-tooling-ci-tech-docs.md` | Script/path discovery → `repo-map`; shared script impact → `graph-impact`; validation planning → `verify-and-gate` only after permissions | Root scripts are configured claims, not observed passes. Operational scripts are Protected where they mutate data/infrastructure. `typecheck:scripts` is unavailable because `scripts/tsconfig.json` is absent. |
| **D17 Packages, dependencies, and workspace boundaries** | 05 | `package.json`; `pnpm-workspace.yaml`; `pnpm-lock.yaml`; `./site/`; `site/tsconfig.json`; `./tech-docs-generator/`; `tech-docs-generator/package.json`; `config/build/`; `docs/architecture/stack.md` | Package/capability packaging → `powers-skills-model`; shared impact → `graph-impact`; path discovery → `repo-map` | Install, build, lockfile, and package-manager operations are Protected/separate. Completion distinguishes declared, imported, configured, unverified, and absent; `./tech-docs-generator/` remains a root-level sibling of `./site/`, `./results/site/` is not a package/source relocation target, and no package addition or Workspace-Boundary Task is implied. |
| **D18 Documentation, architecture, locked documentation, and legacy documentation** | 07 | `docs/architecture/`; `docs/database/`; `docs/governance/`; `docs/governance/charter.md`; `docs/governance/focss-stop-drift.md`; `AGENTS.md`; `DOC-MAP.md`; `CONTENTS.md`; `site/data/storage/`; `agents-work/oando-repository-guide/07-docs-governance-planning.md` | Documentation/path discovery → `repo-map`; FOCSS locked guidance → `focss-css` when triggered; otherwise Local Evidence | Documentation checks are classified before execution. Completion states canonical owner, locked/legacy status, placement, and HTML/source limitation. |
| **D19 Results, generated documents, agent work, and blocker placement** | 07, 09 | `./results/`; `./results/tests/`; `./results/site/`; `./results/site-ui/`; `./results/ops/`; `./generated-documents/`; `./agents-work/`; `./plans/`; `plans/README.md`; `Failures.md`; `agent-reports/`; `agents-work/oando-repository-guide/09-local-generated-environment.md` | Placement/unknown path → `repo-map`; plan coordination → Local Evidence from `plans/README.md` | No command implied. Completion identifies Machine Evidence in a Purpose Subfolder, human reports in a Workstream Subfolder, tech-docs output in `./generated-documents/`, active plan material in `./plans/<name>/`, and blockers in root `Failures.md`; root-level artifacts remain `legacy/owner-review pending` unless observed evidence assigns them, with no relocation claim. |
| **D20 MCP, skills, powers, and agents** | 08 | `.kiro/`; `.kiro/skills/`; `.kiro/agents/`; `.kiro/mcp/`; `.kiro/settings/mcp.json`; `.kiro/hooks/`; `skills-lock.json`; `agents-work/oando-repository-guide/08-kiro-workspace.md` | Kiro capability packaging → `powers-skills-model`; orientation → `repo-map`; hooks/policy trigger is separate approval work | Configuration, external MCP access, hook changes, and Power activation are Protected/separate. Completion distinguishes schema, configuration, connected, installed, and selected states. |
| **D21 Vercel, Worker, R2, backups, observability, and incidents** | 06 | `vercel.json`; `workers/oando-worker-proxy/`; `config/observability/`; `.github/workflows/supabase-backup-r2.yml`; `OPERATIONS_RUNBOOK.md`; `scripts/`; `Failures.md`; `site/instrumentation.ts`; `agents-work/oando-repository-guide/06-operations-infrastructure.md` | Operations/capability packaging → `powers-skills-model` only when evidenced; DB trigger → `db-migrations`; validation planning → `verify-and-gate` only after permissions | Deploy, Worker, R2, backup, Docker/local-service, and remote operations are Protected. Completion is a read-only plan or authorized evidence with target, risk, rollback/recovery, and limitation. |
| **D22 Unknown-area discovery** | 01, 08, 07 | `START.md`; `AGENTS.md`; `docs/architecture/layout.md`; `agents-work/oando-repository-guide/01-repository-map.md`; `agents-work/oando-repository-guide/README.md`; `plans/README.md`; `.kiro/skills/repo-map/SKILL.md`; `Failures.md` | Always `repo-map` first; select `powers-skills-model` only for an evidenced Kiro/capability question; other skills only when triggers match | Read-only discovery. Completion is an evidence inventory, canonical owner, risk, proposed card/skill update, and Coverage-Gap Admission if unresolved. |

### 7.3 Card evidence and status rules

The Evidence Steps order is mandatory for every card: authority reading, listed-path inspection, live comparison, status/risk classification, and evidence/decision recording. Start Paths must be exact paths or explicitly labelled path-discovery instructions. If a listed path is absent, stale, generated, local-private, legacy, or unverified, the card links a Coverage-Gap Admission Card before it can describe a capability as wired or complete.

The Surface Status enum is `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy`. Each status record contains Status, Evidence Source, Current Owner, Next Action, and Evidence Limitation. The `demo/local-only` CRM status specifically cites the `oando-crm-storage` browser key and remains distinct from Admin database-backed customer-query operations. `/admin/product-studio` and the interactive legacy `/planner/*` app tree remain `unwired/absent` until current evidence changes that status; marketing `/planner*` pages remain distinct from `/ooplanner`.

A Coverage-Gap Admission Card contains:

```text
Named Area or Capability
Status: one allowed Surface Status
Evidence Source(s) Checked
Evidence Limitation
Next Evidence Source
Owner Action
Scope Boundary
Next Decision
```

The card is included in the Plain-Language Response Contract and Completion Record. It is not a blocker by itself. A True Blocker is an evidenced condition preventing completion within authorized scope and belongs only in root `Failures.md`.

## 8. Master Router and conditional skill discovery

### 8.1 Route Record

The Master Skill requires this record before repository modification:

```text
Task Outcome
Task Domain / selected Domain Index card
Candidate Paths and exact first evidence reasons
Selected Package Skills and trigger evidence
Rejected Package Skills and plain-language reasons
Workflow Mode
Operational-Risk Classification
Command Classification for every proposed command
Artifact Class, when the task produces output
Selected Workstream Subfolder or Purpose Subfolder, when the task produces output
Filename pattern, owning source or script, and authored-or-generated state, when the task produces output
Rejected placement(s), when a candidate output home is invalid
Site Write Gate classification and exact Core Product outcome, when any target is under `./site/`
Validation State
Owner Decision(s), if unavoidable
```

The Route Record is written in the response or plan-owned handoff; it is not stored in a runtime database. If no existing skill trigger matches, the record selects Local Evidence and states the no-match reason. If more than one matches, all matching skills are selected.

### 8.2 Conditional skill rules

`oando-master` is always first. It does not replace the referenced skills and does not assume that every skill in `.kiro/skills/` applies. The current conditional routes are:

- `repo-map` for orientation, path, feature, route, or code-location discovery.
- `graph-impact` for Shared Code, dependency, blast-radius, or circular-dependency analysis.
- `focss-css` for FOCSS, Tailwind configuration, semantic tokens, icons, alignment, styling, or visual contracts.
- `planner-studio` for Planner or Studio route, feature, component, library, hook, store, server, platform, canvas, catalog, persistence, or handoff work.
- `fork-boundaries` whenever a Planner or Studio Fork Tree changes or cross-fork imports are evaluated; no-cross-import is a hard constraint.
- `db-migrations` for schema selection, SQL, migrations, RLS, grants, rollback, or Supabase ownership selection.
- `powers-skills-model` for repository-local skills, steering, Powers, MCPs, agents, or capability packaging.
- `verify-and-gate` only when the task is explicitly planning authorized validation and both Explicit User Authorization and Hook Permission conditions are established.
- `ai-retrieval` at `.kiro/skills/ai-retrieval/SKILL.md` when that future skill exists and the trigger concerns `site/lib/ai/mastra/`, Mastra, Bedrock, LanceDB, Orama, Fuse.js, embeddings, retrieval, advisory output, or provider behavior. Until it exists, record the missing skill and route through Local Evidence, `repo-map`, and every other matching existing skill.

These are prose trigger rules, not a runtime scanner, loader, or automatic activation mechanism. The implementation must not invent a skill registry or claim that a directory means a skill is installed or applicable.

### 8.3 Local-first Power and MCP decision

1. Use repository documentation, source, configuration, and fresh output first.
2. If Local Evidence answers the need, do not select a Power or MCP.
3. If it does not, consult the Installed-Power Registry before presenting a candidate Power.
4. Present a confirmed, needed Power only as an optional capability; never activate it automatically.
5. If unconfirmed, continue with Local Evidence and matching skills and do not call it available.
6. For MCP, distinguish schema under `.kiro/mcp/`, workspace configuration under `.kiro/settings/mcp.json`, and connected/authenticated server as separate evidence states. Any external access proposal must be read-only, least-privilege, owner-approved, and have a fallback.

## 9. Prompt Cookbook

The guide's Prompt Cookbook is a set of complete fenced copy-paste blocks, not generic examples. Every block has a desired-outcome placeholder, ordinary-language context placeholder, explicit scope boundary, expected-evidence request, and stop condition. Every block requests the Plain-Language Response Contract and exact proof or an explicit unverified/pending state. Any block that names `./agents-work/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, or `./results/site/` uses the Exact Directory Path form and applies the artifact/workspace boundary and Site Write Gate before selecting a write path.

### 9.1 Prompt Safety Preamble

This text is copied into every block:

```text
You are working in the Oando repository. Start with `oando-master`, then `repo-map`. Use Local Evidence before assumptions. Do not guess paths, package names, Package Skills, or commands. Classify every command before suggesting or running it as read-only inspection, Normal-Agent Eligible Check, Protected Command, or no-run pending authorization. Do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission. Select every other matching Package Skill, not just one assumed skill. For any Output-Producing Task, declare the Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, and rejected placements; use `./agents-work/<workstream>/<report-type>/`, `./results/<purpose>/`, `./generated-documents/`, or the approved product source only as applicable. Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; never propose a move into `./site/` or `./results/site/` without a separately approved Workspace-Boundary Task. Before any write under `./site/`, apply the Site Write Gate: only an explicitly approved Core Product Write is allowed, and all Non-Core Artifacts must be redirected. Return the Plain-Language Response Contract in the required field order, and report exact completion proof or an explicit unverified/pending state.
```

Every block then appends:

```text
Desired outcome: [DESIRED_OUTCOME]
Ordinary-language context: [CONTEXT]
Scope boundary: [IN_SCOPE] ; do not change [OUT_OF_SCOPE]
Artifact Class and output home (when applicable): [AGENT_WORK_REPORT | MACHINE_EVIDENCE | GENERATED_TECH_DOCS | ACTIVE_PLAN | TRUE_BLOCKER | CORE_PRODUCT_WRITE] at [EXACT_WORKSTREAM_OR_PURPOSE_SUBFOLDER]; filename pattern [FILENAME_PATTERN]; owning source/script [OWNER]; authored or generated [STATE]
Site Write Gate (when any target is under `./site/`): [CORE_PRODUCT_WRITE_OR_NON_CORE_ARTIFACT], exact product outcome [OUTCOME], owned paths [PATHS], matching skills [SKILLS], expected evidence [EVIDENCE]
First Local Evidence: [CATEGORY_START_PATHS_OR_BEGIN_HERE_DISCOVERY]
Expected evidence: [EXPECTED_FILES_DIFFS_OR_AUTHORIZED_OUTPUT]
Stop condition: stop before [STOP_TRIGGER] and return the Contract with the blocker, gap, or Owner Decision.
```

### 9.2 Complete category inventory

The implementation renders one full block for each row; the row supplies the category-specific paragraph, exact verified starts, matching-skill rule, and special stop condition. No category is represented only by a generic “ask the agent” link.

| Category | Category-specific instruction and first evidence |
|---|---|
| **Understand Repository** | Map the desired outcome from `START.md`, `AGENTS.md`, `docs/architecture/layout.md`, `docs/architecture/stack.md`, and the guide README. Stop before editing and return the authority order and unresolved facts. |
| **Find Where to Work** | Identify the route/domain and exact candidate paths from `./site/app/`, `./site/features/`, `./site/components/`, `./site/lib/`, `./site/platform/`, tests, and the relevant Domain Index card. Stop on competing owners or absent paths. |
| **Small UI/Icon/Alignment Fix** | Start at the user-facing route, nearby component, `./site/focss/`, and the existing Phosphor `PhIcon`/`phIconMap` abstraction. Route to `focss-css` when triggered; require the Visual Detail Checklist. Stop before adding an icon library or custom CSS system. |
| **Feature** | Trace route → feature → component → shared/server logic → platform/persistence → proof. Select every matching skill and produce a bounded implementation plan before editing. Stop at an unverified data or external boundary. |
| **Site UI** | Start at `./site/app/(site)/`, `./site/features/site/`, `./site/components/home/`, `./site/focss/site/`, and `./site/i18n/`; inspect SEO, accessibility, loading/empty/error, and responsive states. Stop before claiming browser or performance proof. |
| **Planner** | Start at the D11 paths and select `planner-studio`; select `fork-boundaries` for any fork change. Preserve Planner scale/state/persistence assumptions and stop before cross-imports, persistence changes, or Protected Commands. |
| **Studio** | Start at the D12 paths and select `planner-studio`; select `fork-boundaries` for any fork change. Preserve Studio scale/state/persistence assumptions and stop before borrowing Planner modules or claiming Planner rail proof. |
| **Admin** | Start at `./site/app/admin/`, `./site/features/admin/`, `./site/lib/admin/`, and route docs. Determine auth role and Products/Admin ownership before edits; stop before any migration, remote mutation, or secret exposure. |
| **CRM/Unwired Assessment** | Compare `./site/app/admin/crm/` and `./site/features/crm/` with customer-query paths and `./site/features/ops/`. Record `demo/local-only`, `present-but-unverified`, or `unwired/absent` rather than combining the workflows. |
| **Catalog/Configurator/Quotes/Inventory** | Start at D10 paths and select database guidance when ownership/persistence is implicated. Identify Products versus Admin, catalog assets, release records, and quote/inventory proof. Stop before seed, publish, storage, or migration actions. |
| **Database** | Start at both migration directories, Drizzle schema, persistence selectors, and database docs. Select `db-migrations`; require ownership, RLS, grants, rollback, and mode before proposing SQL. Stop before apply or remote access. |
| **AI/Retrieval** | Start at `./site/lib/ai/mastra/` and listed AI routes. Use `ai-retrieval` only if present; otherwise record the missing skill and use Local Evidence. Treat output as advisory. Stop before provider calls, package changes, or unsupported deployment/evaluation claims. |
| **Image/Animation/Assets** | Start at `./site/public/`, `scripts/generate-svg/`, nearby component patterns, FOCSS, and existing motion imports. Review licensing, reduced motion, interaction states, and existing generation path before proposing external tooling. Stop before external capability or asset publication. |
| **API/Security** | Start at `./site/app/api/`, `./site/lib/apiCatalog.ts`, `./site/proxy.ts`, security helpers, and route docs. Trace auth, CSRF, rate limits, RLS, and mode-aware persistence. Stop before hosted calls or changing security controls. |
| **Environment** | Start at `.env.example`, local environment paths, `package.json`, `pnpm-workspace.yaml`, `START.md`, and D04. Classify values without exposing secrets. Stop before syncing or launching services. |
| **Bug/Failing Test** | Start with the reported symptom, relevant test source, `Failures.md`, and the narrowest source path. Do not infer a failure cause from an unobserved run. Stop before running a Protected Command and name the exact diagnostic needed. |
| **Gate-Failure Triage** | Capture exact Full Gate command, repository-root cwd, authorization, hook decision, exit status, first failed subcommand, output summary, and cause status. Preserve gate composition and route to read-only triage before any policy proposal. |
| **Refactor** | Start at the owning source and use `graph-impact` for Shared Code or blast radius. Preserve behavior, forks, data ownership, and proof; stop on mixed ownership or an unbounded file set. |
| **Documentation** | Start at `AGENTS.md`, `DOC-MAP.md`, `CONTENTS.md`, `Agents/05-documentation.md`, `plans/README.md`, and the owning document. Determine Markdown/HTML provenance before guide projection edits. Stop before writing a handwritten report under `./results/`; use `./agents-work/<workstream>/<report-type>/` for authored reports and `./generated-documents/` only for generator output. |
| **Package/Dependency** | Start at root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, live imports, and `./tech-docs-generator/package.json`. Distinguish declared from wired and request separate approval before install or lockfile change; keep `./tech-docs-generator/` outside `./site/` and `./results/site/` unless a Workspace-Boundary Task is separately approved. |
| **Deployment/Ops** | Start at `vercel.json`, Worker, R2, observability, runbook, workflow, and relevant scripts. Produce a read-only target/risk/rollback plan. Stop before deploy, remote mutation, Docker service, or backup. |
| **Backup/Import/Export** | Start at the runbook, R2 scripts/registry, workflow, data owner, and recovery path. Identify target, data sensitivity, restore path, and exact Protected Command. Stop before any backup, import, export, or external storage action. |
| **Unknown Task** | Start at D22 with `START.md`, `AGENTS.md`, layout docs, guide README, `repo-map`, `plans/README.md`, and `Failures.md`. Inventory Local Evidence, propose the canonical owner and risk, and stop before creating a new category or changing code. |
| **Finish Current Task** | Read the current Route Record, changed scope, handoffs, gaps, and evidence. Produce the Contract, Completion Record, pending checks, and separate-work statement. Stop if proof is missing or ownership is unresolved. |
| **Emergency Prompt for an Overwhelmed Owner** | Use this one sentence: `Start with oando-master, then repo-map; use Local Evidence before assumptions, classify every command, do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission, select every matching Package Skill, and return the Plain-Language Response Contract while helping me choose the safest next action for [DESIRED_OUTCOME].` |

The cookbook also contains copy-paste delegation and review blocks from the four-role procedure. Each names the role, objective, exclusive paths, read-only/write permission, evidence, stop conditions, Handoff Record fields, and authorization boundary.

## 10. Exactly four multi-agent roles

The Multi-Agent Operating Procedure defines exactly these four available roles and no fifth coordinator role:

| Role | Permission | Owns | Must not do |
|---|---|---|---|
| **Scout/Map** | Read-only | Authority mapping, repository orientation, candidate paths, and evidence discovery | Modify files, run Protected Commands, or select a path without evidence |
| **Planner/Risk** | Read-only | Scope decomposition, matching/rejected skills, Operational-Risk Classification, Command Classification, ownership proposals, and validation planning | Modify files, treat a plan as proof, or authorize commands |
| **Implementer** | Write only within recorded approved exclusive paths | The smallest approved change in owned files | Write a path without ownership, expand scope, alter protected controls, or resolve conflicts by overwriting |
| **Verifier/Reporter** | Read-only | Evidence reconciliation, coverage-gap review, completion-proof review, and Plain-Language Response Contract reporting | Modify files, convert pending evidence into pass, or claim rendered/hosted behavior from static proof |

The task owner may designate serial integration and owner decisions, but this is an ownership action, not a fifth Agent role. A multi-agent task has at most four active Agents.

### 10.1 Beginner-readable operating sequence

1. The owner states the ordinary-language outcome.
2. Scout/Map reads the authority sources and maps exact candidate paths.
3. Planner/Risk creates or completes the Route Record, selects all matching skills, classifies risk and commands, proposes exclusive ownership, and identifies validation.
4. The owner approves scope and any unavoidable decisions; no approval is inferred from an inline marker or an old plan.
5. Implementer writes only after its exclusive path set is recorded. If there are disjoint paths, separate Implementer work may proceed in parallel; otherwise write work is serial.
6. Scout/Map and Planner/Risk may continue read-only research in parallel with disjoint implementation only when it cannot change the Implementer's owned files or evidence.
7. Verifier/Reporter reads the result, reconciles evidence and gaps, and prepares the Contract and Completion Record.
8. One owner performs Serial Integration of all research or disjoint edits before any shared or subsequently overlapping write.
9. If ownership overlaps, edits conflict, or evidence contradicts, invoke the Conflict Stop Rule: stop all affected writes, preserve the competing evidence, and route the conflict to owner review.
10. Close only with exact proof, explicit pending validation, or a True Blocker in `Failures.md`.

Parallel work is allowed only for read-only research or genuinely disjoint exclusive file ownership. Overlapping writes are prohibited for shared code, configuration, manifests, lockfiles/workspace files, migrations, hooks, generated evidence, and result paths. Every Implementer path must have an ownership declaration before writing. Serial Integration is mandatory before a shared-path or subsequently overlapping write.

### 10.2 Handoff Record

Every handoff has these fields; a field that was not observed is written as `not observed`, not omitted:

```text
Objective
Role and Next Owner
Scope
Paths Read and Paths Changed
Route Record
Evidence
Decisions
Coverage Gaps
Validation Command
Repository Root
Authorization State
Hook Decision
Exit Status
Validation Limitation
Blockers
Next Action
```

The Handoff Record is included in the Plain-Language Response Contract or linked from it and is placed according to the artifact rules below. Handoffs do not authorize commands or expand ownership.

### 10.3 Agent Compliance Contract: the pre-work and handoff gate

The existing four-role procedure is strengthened by an explicit contract that every Agent can follow without repository expertise. The contract is a gate, not a suggestion: an Agent does not begin assigned work until the declaration is visible, and a coordinator does not integrate a handoff until the declaration and delivery conditions still match the current user request.

#### Before work begins

Every Agent must return this short declaration in plain language before any repository exploration, before any write, and before proposing a command:

```text
I read the current user request: [yes / missing source].
I read the applicable global repository standard: [AGENTS.md and applicable named standard / missing source].
User instructions outrank defaults. The global standard remains in force unless the user explicitly overrides a specific rule: [record any override / none].
Requested outcome: [what the user asked for].
My assigned scope: [what I will do].
My owned paths and permission: [exact paths, read-only or write].
My exclusions: [exact paths, actions, and outputs I will not touch].
My delivery conditions: [what must be true and what evidence I will hand back].
Validation allowed now: [exact permitted checks / none].
Validation pending authorization: [exact checks / none].
Next owner: [named Agent or Repository Owner].
```

The coordinator records the declaration in the Agent Roster and Ownership Matrix before that Agent begins any repository exploration or writes any file. “Owned paths” means exact repository paths, not a feature name or a broad directory. “Exclusions” include adjacent cleanup, tests, scripts, documentation, package or configuration changes, UI changes, generated output, and any other work not named in the request. A useful neighboring change is still out of scope unless the user authorizes it and the Route Record is updated.

#### While work is in progress

- The Agent performs only the requested outcome inside the assigned scope and owned paths.
- The Agent does not infer permission from proximity, convention, a package script, an ordinary test configuration, an inline marker, an old plan, or the fact that the requested functionality appears to work.
- Tests and scripts require repository evidence for the exact target and exact current-session authorization; execution also requires Hook Permission. They are never assumed to be available because a name appears in `package.json` or a normal test configuration.
- A small quality defect that is directly inside the requested outcome and an owned path should be fixed even when the main functionality works. If fixing it needs an adjacent path, new behavior, a new command, or unrelated cleanup, the Agent stops and surfaces the scope decision instead of expanding silently.
- The Agent preserves unrelated work and never overwrites, reverts, reformats, renames, or cleans up an unowned change.
- A conflict, missing authorization, ambiguous ownership, hidden repository constraint, contradictory evidence, or task expansion is a stop condition. The Agent reports the exact path, action, and decision needed; it does not choose silently.

#### Why scope drift happens and the controls that stop it

| Why drift happens | Control before work or integration |
|---|---|
| Ownership is described broadly or two Agents believe they own the same file. | Publish exact paths, read/write permission, one owner per path, and serial ownership for shared files in the Agent Roster and Ownership Matrix. |
| An Agent follows default “helpful” behavior and performs nearby cleanup or extra validation. | Publish explicit exclusions, require a user-request match for every change, and reject inferred permission for cleanup, tests, scripts, docs, packages, configuration, or UI. |
| A hidden repository rule changes what is safe or where output belongs. | Read the current user request, `AGENTS.md`, and the directly applicable repository standard first; then check live evidence and apply Locked Path, artifact-placement, Site Write, and Protected Command rules. |
| The task expands during implementation or a handoff bundles a new objective. | Re-route the new objective, obtain explicit owner approval, update scope/ownership/delivery conditions, and integrate only after the coordinator reconciles the change serially. |

#### Coordinator responsibility

The coordinator is responsible for rejecting or reconciling scope drift before integration. The coordinator checks every handoff against the current user request, Route Record, Agent Roster, Ownership Matrix, exclusions, and delivery conditions. The coordinator must not hide an out-of-scope file in a larger change or treat a useful addition as approved. The coordinator uses at most four Agents, permits parallel work only for read-only research or disjoint ownership, integrates changes serially, and invokes the Conflict Stop Rule before any affected write when ownership overlaps, edits conflict, evidence contradicts, or a handoff cannot be reconciled. The coordinator role is a coordination function, not a fifth Agent role.

#### Plain-language handoff and delivery check

Every Agent handoff must list, in language the Repository Owner can understand:

1. **Changed files:** each exact path and why that file changed; write `none` when no file changed.
2. **Validation actually run:** each exact command or inspection and its observed result; write `none` when no validation ran. An unobserved command is unrun.
3. **Validation not run:** each exact check that remains pending, was not authorized, was blocked, or was not applicable, with the reason.
4. **Remaining issues:** unresolved scope questions, conflicts, unverified behavior, blockers, and the next owner action.
5. **Scope confirmation:** the assigned scope, exclusions respected, next owner, and any proposed work that was deliberately not performed.

A missing field, unexplained changed file, or unresolved drift makes the handoff incomplete. The Completion Record must preserve the distinction between actual evidence and pending validation and must not claim that a command, rendered behavior, hosted behavior, or implementation occurred when it did not.

## 11. Explicit artifact, workspace, and evidence boundaries

This section is the normative artifact/workspace boundary for the guide, router, cards, prompts, handoffs, and records. It distinguishes authored work products, machine evidence, generated tech-docs output, active plans, blockers, workspace packages, and Core Product Writes. It does not claim that any existing root-level artifact has been moved or reorganized.

### 11.1 Beginner output-placement reference

| If the output is... | Put it here | Do not put it here |
|---|---|---|
| Written by an agent as a report or work product | `./agents-work/<workstream>/<report-type>/`, or an existing approved workstream folder such as `./agents-work/oando-repository-guide/` or `./agents-work/repository-graph/` | The `./agents-work/` root, `./results/`, or `./site/` |
| Produced by a script or command | `./results/<purpose>/`, including existing `./results/tests/`, `./results/site/`, `./results/site-ui/`, `./results/ops/`, or a documented purpose folder | The `./results/` root, `./agents-work/`, or `./site/`; generated output is not hand-edited |
| Produced by the tech-docs generator | `./generated-documents/` | `./results/`, `./agents-work/`, or `./site/` as a report destination |
| Active plan material | The applicable `./plans/<name>/` folder indexed by `plans/README.md` | `./results/`, `./site/`, or an unowned root-level location |
| A True Blocker | Root `Failures.md`; supporting authored analysis uses the appropriate `./agents-work/<workstream>/<report-type>/` location | A second blocker ledger in `./results/`, `./agents-work/`, or `./site/` |
| Product source | The approved product source tree; a write under `./site/` is allowed only as a Core Product Write | `./site/` for a report, skill, result, audit, handoff, prompt, plan, or other Non-Core Artifact |
| A repository skill | `.kiro/skills/` | `./site/`, `./results/`, or `./agents-work/` |

The required beginner wording is preserved verbatim:

> If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.

Agent-authored reports and work products must select a Workstream Subfolder before writing; no new report is authored at the `./agents-work/` root. Machine Evidence must select a Purpose Subfolder before publication; no new generated result is published at the `./results/` root. Existing root-level artifacts are inventoried as observed legacy material and are not silently relocated.

### 11.2 Exact workspace boundaries

- `./tech-docs-generator/` is the root-level Tech-Docs Generator Package and remains a sibling of `./site/`. It is not a child of `./site/` and is not a result-purpose folder.
- `./generated-documents/` is the separate generated output of `./tech-docs-generator/`; it remains distinct from `./site/` and `./results/`.
- `./results/site/` is a Machine Evidence Purpose Subfolder and is distinct from the `./site/` Site Source Tree. It is never a source-tree or workspace-package relocation target.
- `./site/` is the Next.js Site Source Tree only. It is reserved for explicitly approved Core Product Writes covering core product code, product UI or FOCSS, product assets, routes, APIs, servers, persistence, or another clearly scoped product implementation.
- A proposal to move `./tech-docs-generator/` into `./site/` or `./results/site/`, or to change the relationship of `./generated-documents/` to its owning package, is rejected unless a separately approved Workspace-Boundary Task authorizes that boundary change. This design performs and claims no such relocation.
- Whenever the guide, a Route Record, an Outcome-Focused Task Card, or a Prompt Cookbook block names these directories, it uses the Exact Directory Path form with a leading `./`, trailing `/`, and enough context to distinguish `./tech-docs-generator/`, `./site/`, `./results/site/`, and `./generated-documents/`.

### 11.3 Route and Completion Record artifact fields

An Output-Producing Task is any task that creates or updates an authored artifact, generated output, plan artifact, blocker record, or product source file. Before its first write, the Route Record declares all of the following:

```text
Artifact Class: Agent Work Report | Machine Evidence | Generated Tech-Docs Output | Active Plan | True Blocker | Core Product Write
Selected Workstream Subfolder or Purpose Subfolder: exact path
Filename Pattern: expected file naming pattern
Owning Source or Script: the human source, generator, command, or product owner
Authored or Generated: authored | generated
Rejected Placement(s): proposed homes that are invalid and why
Site Write Gate: Core Product Write | Non-Core Artifact | not applicable
```

For a Core Product Write under `./site/`, the record additionally states the exact core product outcome, owned paths, applicable Package Skills, and expected evidence before the first write. For a Non-Core Artifact, the Site Write Gate stops the write and redirects it to the approved non-site home.

The Completion Record repeats Artifact Class, selected Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, and observed placement evidence. It also records rejected placement(s), Site Write Gate outcome when applicable, pending validation, and any Coverage-Gap Admission. A missing placement or producer field is incomplete proof, not permission to infer a destination.

### 11.4 Site Write Gate and non-core prohibition

The Site Write Gate runs before every proposed write under `./site/`:

1. Classify the target as a Core Product Write or Non-Core Artifact in the Route Record.
2. Require explicit approval for the Core Product Write, an exact core product outcome, exclusive owned paths, matching Package Skills, and expected static or authorized evidence.
3. Permit only the approved core product implementation to proceed; preserve the applicable fork, database, CSS, security, and Protected Command boundaries.
4. Stop and redirect any Non-Core Artifact before writing. This includes reports, results, audits, handoffs, prompts, plans, Agent Work Reports, skills, steering files, MCP definitions, generated files, temporary files, debug files, and any other non-core work product.

`./site/` is not a general workspace for documentation, evidence, skills, generated output, or temporary work. A path that happens to exist under `./site/` does not authorize a write, and `./results/site/` does not become a product-source location by name.

### 11.5 Evidence integrity and root-artifact handling

- Generated inventories and regenerated tech-docs data/documents/static sites are written by their owning source or script into `./generated-documents/`; hand-editing generated output makes it untrusted and requires regeneration.
- Machine Evidence from commands, tests, gates, builds, browser runs, coverage, deployments, database actions, backups, or local services is written by its owning source or script into a selected `./results/<purpose>/` folder and is not a handwritten plan or PASS claim.
- Human-authored guide, research, handoff, coverage-gap, and Agent Work Reports use a selected `./agents-work/<workstream>/<report-type>/` or existing approved workstream folder. `agent-reports/` remains an existing reference or historical location, not the default for new work.
- Active plan material uses the applicable `./plans/<name>/` folder indexed by `plans/README.md`; a result file is never treated as plan state.
- True Blockers and reproducible blocker evidence use root `Failures.md` as the sole canonical blocker ledger; supporting authored analysis may use the selected workstream subfolder.
- If a root-level result artifact is reviewed and observed evidence does not establish relocation or purpose assignment, classify it `legacy/owner-review pending` and do not claim that it has been reorganized.
- When an artifact has multiple possible homes, Authority Ordering determines the selected placement and the Route Record records rejected placements. A placement decision is not evidence that an artifact has already moved.

The `.kiro/skills/`, `.kiro/specs/`, and `.kiro/agents/` directories remain workspace-control destinations with their own ownership rules. The guide's Markdown and existing static HTML are human guide work under the approved `./agents-work/oando-repository-guide/` folder, not generated tech-docs output.

## 12. Protected Commands, validation, and Failure Triage

### 12.1 Command classification

The guide uses four labels:

- **read-only inspection:** file/path/document inspection that does not run a user-owned quality, service, or external action;
- **Normal-Agent Eligible Check:** an exact, named, non-mutating type/lint/static check explicitly permitted by the live policy and enabled hook within declared scope;
- **Protected Command:** a Full Gate, test, coverage, browser-test runner, build, deployment, database action, backup, or Local-Service Command;
- **no-run pending authorization:** a command whose exact current-session authorization or hook permission is absent, whose eligibility is not explicitly named, or whose evidence is otherwise unavailable.

Protected Commands require both exact current-session Explicit User Authorization and Hook Permission. An inline environment variable, prompt token, comment, or similar Inline Authorization Marker is not sufficient for the guide's authorization record. The guide does not bypass, weaken, or reinterpret the hook. The current enabled hook's observed source and the owner authorization state are recorded separately.

The Full Gate is never a default action. Normal checks are eligible only if an active policy and enabled hook name the exact command; repository convention is not enough. While the current `block-agent-tests` hook matches `typecheck`, `pnpm run typecheck` remains pending user validation and any change to make it normally eligible is a separate Policy Implementation Proposal. `pnpm run typecheck:scripts` is unavailable because `scripts/tsconfig.json` is absent and is excluded from suggested validation.

### 12.2 Honest validation record

For every observed validation command, record exact command, repository-root working directory, scope, current-session authorization, hook decision, exit status, output limitation, and behavior not verified. For every Output-Producing Task, separately record Artifact Class, selected Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, and observed placement; for any `./site/` target, record the Site Write Gate decision and exact Core Product outcome. One Vitest lane is not the full suite; static or disk evidence is not browser/hosted evidence; a configured command is not a passing result.

### 12.3 Full Gate Failure Triage

When a Full Gate Failure is reported or observed:

1. Do not propose a gate, hook, baseline, test-selection, or allowlist change first.
2. Capture the exact command, repository-root cwd, authorization state, hook decision, exit status, first failed subcommand, relevant output summary, and cause classification.
3. If current authorized output is absent, label the cause unobserved/unverified and request only the smallest authorized diagnostic; do not assert a root cause.
4. Preserve Full Gate composition, test selection, coverage requirements, quality baselines, and Hook Permission enforcement while the cause is unverified.
5. If evidence establishes a True Blocker that prevents scoped completion, record it with reproduction evidence only in root `Failures.md`.

## 13. Current Guidance Deliverable versus Separate Approval Work

### In the Current Guidance Deliverable

- Augment the eleven guide chapters and README with the Begin Here flow, Domain Index, Coverage Audit, and Coverage-Gap Admission rules.
- Add the 22 concrete cards and their verified-path baseline.
- Update `.kiro/skills/oando-master/SKILL.md` with first-router, conditional skill, response, command, and completion contracts.
- Author `.kiro/skills/ai-retrieval/SKILL.md` as guidance only if the approved task includes the proposed AI Package Skill; its trigger, canonical path, Local Evidence, authority order, advisory boundary, and completion expectation are mandatory.
- Add the complete Prompt Cookbook and exactly four-role multi-agent procedure to the guide.
- Reconcile Surface Status and placement guidance from current evidence, including the Workstream/Purpose Subfolder model, exact workspace paths, Route/Completion artifact fields, and Site Write Gate wording.
- Preserve `.kiro/specs/oando-master/.config.kiro`.

### Separate Approval Work

The following are discovered and recorded, never silently performed, by this revision:

- `.kiro/hooks/block-agent-tests.json`, `.kiro/hooks/block-agent-tests.mjs`, hook matchers, hook overrides, command allowlists, or any policy implementation;
- product runtime code, routes, APIs, UI behavior, Planner/Studio source, or cross-fork changes;
- package installation, dependency or lockfile changes, or workspace changes;
- any move or relationship change involving `./tech-docs-generator/`, `./generated-documents/`, `./site/`, or `./results/site/`; a proposed move is a dedicated Workspace-Boundary Task and is not implied by this guidance;
- Products/Admin schema, migrations, grants, policies, generated types, seed, or remote database actions;
- Vercel, Cloudflare Worker, R2, Supabase, observability, backup, deployment, or local-service actions;
- external MCP configuration/connection or any external data/credential access;
- Power activation or changes to the installed-power registry.

Each discovered separate item is a separate approval-required Repository Task and, when active, gets plan material under `plans/<name>/`. A Current Guidance Completion Record states that Separate Approval Work remains unimplemented unless independent observed evidence proves otherwise. A documented placement decision or Site Write Gate classification is not evidence that a relocation, product write, or other Separate Approval Work occurred.

## 14. Conceptual records and interfaces

These records are documentation contracts, not TypeScript types or persisted data.

### RouteRecord

```text
RouteRecord {
  outcome: ordinary-language Task Outcome;
  domain: Domain Index card;
  candidatePaths: exact paths with reasons;
  selectedSkills: all matching Package Skills or Local Evidence;
  rejectedSkills: skill plus plain-language reason;
  workflowMode: Vibe | Plan | Spec | Autopilot | Supervised;
  risk: Operational-Risk Classification;
  commandClasses: command -> read-only | eligible | protected | pending;
  artifactClass: Agent Work Report | Machine Evidence | Generated Tech-Docs Output |
                Active Plan | True Blocker | Core Product Write | not applicable;
  selectedWorkstreamOrPurposeSubfolder: exact approved path or not applicable;
  filenamePattern: expected output name or not applicable;
  owningSourceOrScript: source, generator, command, or product owner;
  authoredOrGenerated: authored | generated | not applicable;
  rejectedPlacements: proposed invalid homes and reasons;
  siteWriteGate: Core Product Write | Non-Core Artifact | not applicable;
  validationState: not-needed | eligible | pending-user-authorization |
                    blocked-by-hook | observed-pass | observed-fail | not-run;
  ownerDecisions: unavoidable decisions only;
}
```

### CoverageAuditRow

```text
CoverageAuditRow {
  cardId;
  requiredOutcome;
  numberedChapter;
  verifiedStartPaths;
  coverageStatus;
  evidenceSourcesChecked;
  evidenceLimitation;
  nextDecision;
}
```

Coverage status describes guide/path coverage, not runtime wiring. A separate Surface Status and Coverage-Gap Admission Card describes capability completeness.

### ValidationObservation

```text
ValidationObservation {
  exactCommand;
  repositoryRoot;
  scope;
  explicitUserAuthorization;
  hookDecision;
  exitStatus;
  outputLimitation;
  behaviorNotVerified;
}
```

### CompletionRecord

```text
CompletionRecord {
  outcome;
  changedScope;
  selectedSkills;
  rejectedSkills;
  artifactClass;
  selectedWorkstreamOrPurposeSubfolder;
  filenamePattern;
  owningSourceOrScript;
  authoredOrGenerated;
  rejectedPlacements;
  siteWriteGate;
  observedPlacementEvidence;
  observedEvidence;
  pendingValidation;
  coverageGaps;
  separateApprovalWork;
  trueBlockers;
}
```

## 15. Safe error handling and fallback matrix

| Condition | Required safe behavior |
|---|---|
| Ordinary request lacks safe-modification facts | Use D22 read-only discovery; list only unavoidable Owner Decision. |
| No Package Skill trigger matches | Select Local Evidence and record the no-match reason. |
| Multiple triggers match | Select every matching skill; do not discard a route to simplify the record. |
| AI task before `ai-retrieval` exists | Use Local Evidence, `repo-map`, and other matches; record missing skill; frame output as advisory. |
| Path is absent, legacy, generated, private, or unverified | Create/link a Coverage-Gap Admission Card and do not claim wired/complete. |
| Surface status evidence changes | Update status, source, limitation, next action, and Route Record before wired claim. |
| Markdown and HTML differ | Determine source relationship first; if unresolved, do not invent a generator and admit parity gap. |
| Output-Producing Task lacks Artifact Class, subfolder, filename pattern, owning source/script, or authored/generated state | Stop before writing; complete the Route Record fields and select the approved destination. |
| Agent-authored report/work product targets the `./agents-work/` root | Stop the write; redirect to `./agents-work/<workstream>/<report-type>/` or an existing approved workstream folder; do not claim relocation. |
| Machine Evidence targets the `./results/` root | Stop publication; require the owning source/script to use `./results/<purpose>/`, including an approved existing purpose folder where applicable. |
| Existing root-level result artifact has no observed purpose assignment or relocation evidence | Label it `legacy/owner-review pending`; inventory it without moving it or claiming reorganization. |
| Generated tech-docs output is proposed outside `./generated-documents/` | Reject the destination; keep `./generated-documents/` separate from `./site/` and `./results/`, and regenerate from `./tech-docs-generator/`. |
| `./tech-docs-generator/` is proposed for movement into `./site/` or `./results/site/` | Reject the move; require a separately approved Workspace-Boundary Task; do not claim that a relocation occurred. |
| `./results/site/` is treated as a source tree or package home | Reject the classification; it is a Machine Evidence Purpose Subfolder distinct from `./site/`. |
| Any proposed write under `./site/` is not explicitly classified as a Core Product Write | Apply the Site Write Gate and stop the write until the Route Record classifies it. |
| A report, result, audit, handoff, prompt, plan, Agent Work Report, skill, steering file, MCP definition, generated file, temporary/debug file, or other Non-Core Artifact targets `./site/` | Reject and redirect to the approved non-site home; do not allow a Site Write Gate bypass. |
| An explicitly approved Core Product Write targets `./site/` | Require exact core outcome, owned paths, matching skills, expected evidence, and Site Write Gate approval before writing; preserve all applicable fork/data/CSS/security boundaries. |
| Protected command lacks either permission | Do not execute; classify exact command pending user validation. |
| Check is not named by active policy/hook | Do not infer eligibility from convention; classify pending. |
| Inline authorization marker is present without explicit user authorization | Keep pending in the guide record. |
| Full Gate Failure lacks current authorized output | Label cause unverified and request the smallest authorized diagnostic; preserve controls. |
| Ownership overlaps or edits/evidence conflict | Invoke Conflict Stop Rule; stop affected writes and route to owner review. |
| True Blocker is evidenced | Record only in root `Failures.md` with reproducible evidence; supporting authored analysis may use the selected `./agents-work/<workstream>/<report-type>/`. |
| Human report is proposed under `./results/` | Reject placement; use an approved `./agents-work/<workstream>/<report-type>/`; use `./plans/<name>/` only when the artifact is active plan material. |
| Generated inventory/static site is hand-edited | Reject edit; change source and regenerate into `./generated-documents/`. |

## 16. Correctness Properties

*A property is a universal documentation invariant over Route Records, cards, prompts, handoffs, evidence classifications, and completion reports. These properties describe what a future static/documentation checker could validate; they do not claim that the repository has a runtime router.*

### Property Reflection

The prework classified exact inventories (22 cards, 25 cookbook categories, four roles, fixed paths, special Surface Statuses, retained configuration, and the corrected artifact/workspace destinations) as static smoke/example checks. They remain explicit validation items rather than redundant universal properties. Repeated skill triggers are consolidated into additive routing; repeated response fields into one ordered contract; repeated command rules into classification, permission, evidence, and triage properties; repeated placement rules into one producer-owned typed destination and Site Write Gate property; and repeated gap/status rules into one no-overclaim property. Conflict, missing-evidence, missing-skill, root-output, invalid-site-write, and proofless-response branches remain edge cases because they prevent silent invention or boundary drift.

### Property 1: First-router authority and Begin Here ordering

For any ordinary-language Repository Task, the documentation flow reads `oando-master` first, applies the preserved authority order, produces exact first evidence locations, selects a Domain Index outcome, and classifies Workflow Mode, Operational Risk, and every proposed command before requesting an Owner Decision or allowing modification.

**Validates: Requirements SR1.1, 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.9, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 21.1, 21.2, 21.3, 21.4, 21.5**

### Property 2: Complete additive Route Records

For any Repository Task, the Route Record contains the outcome, domain, candidate paths, every matching selected skill, every considered rejected skill with a reason, risk, command classification, and validation state; when no skill matches, it selects Local Evidence with a no-match reason, and the Completion Record preserves the selected and rejected sets.

**Validates: Requirements SR1.2, SR1.3, SR1.4, SR1.5, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.1, 9.2, 9.7**

### Property 3: Complete 22-card coverage and ordered evidence

For any Coverage-Audited Domain Index card, the card has the required outcome-focused fields, exact Start Paths or an explicit discovery instruction, a numbered chapter mapping, the classifier fields, and Evidence Steps in authority → listed paths → live comparison → status/risk → evidence/decision order; the Coverage Audit has a corresponding row, and an outside-baseline area first routes through unknown discovery.

**Validates: Requirements SR2.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 20.1, 20.2, 20.3, 20.4, 20.5, 20.7, 20.8**

### Property 4: Mandatory ordered Plain-Language Response Contract

For any task-start, progress, handoff, pause, or completion response, the fields appear in the required order from Outcome through Unavoidable Owner Decisions, specialized terms are explained before a decision, and omitted fields or missing completion proof are explicitly labelled incomplete with the missing field, validation state, and next owner action.

**Validates: Requirements SR2.2, SR2.3, SR2.4, 15.1, 15.2, 15.3, 15.4, 15.5, 21.6, 21.7, 21.8, 21.9, 21.10, 22.7**

### Property 5: Complete safe Prompt Cookbook

For any Prompt Cookbook category block, the block contains the complete Prompt Safety Preamble, desired outcome and ordinary-language context placeholders, scope boundary, exact first evidence instruction, expected evidence, stop condition, additive skill-selection instruction, command classification and Protected Command authorization rule, and request for exact proof or explicit pending/unverified reporting; the category set contains all 25 required categories, including the one-sentence Emergency Prompt.

**Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7**

### Property 6: Conditional skill routing and local-first capability selection

For any task evidence, every matching existing Package Skill is selected and every non-matching skill is rejected with a reason; Local Evidence is used before a Power or MCP, an optional Power is presented only after Installed-Power Registry confirmation, an unconfirmed candidate is not represented as available, and a requested activation remains blocked without confirmation; MCP schema, configuration, and connection are distinct states.

**Validates: Requirements 3.7, 5.1, 5.2, 5.4, 5.5, 5.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.3, 9.4, 9.5, 9.6, 13.1, 13.2, 13.3, 13.4**

### Property 7: UI, fork, and AI evidence boundaries

For any interface, Planner, Studio, asset, motion, or AI task, the guide routes from user-facing path through the relevant feature/component/FOCSS pattern, requires the Visual Detail Checklist and asset/motion safeguards when applicable, preserves the Planner/Studio no-cross-import boundary, and describes AI output as advisory unless current evidence proves a stronger claim.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.3, 5.7, 12.5**

### Property 8: Evidence-labelled technical and data ownership

For any guide claim about a package, framework, command, route, database, asset pipeline, or persistence path, the claim names an evidence status and source; any data task selects Products or Admin ownership before change, uses the correct migration path and mode-aware persistence boundary, and treats live evidence as stronger than conflicting documentation.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 10.5, 11.6**

### Property 9: Typed artifact placement and producer ownership

For any Output-Producing Task, the Route Record declares an Artifact Class, an exact selected Workstream Subfolder or Purpose Subfolder, a filename pattern, the owning source or script, the authored-or-generated state, and rejected placements; Agent Work Reports use `./agents-work/<workstream>/<report-type>/` or an existing approved workstream folder, Machine Evidence uses `./results/<purpose>/`, generated tech-docs use `./generated-documents/`, active plans use the applicable `./plans/<name>/`, and a True Blocker with reproducible evidence uses only root `Failures.md`. The Completion Record repeats those fields with observed placement evidence; root-level artifacts are not claimed relocated without evidence.

**Validates: Requirements SR3.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 18.1, 18.2, 18.3, 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8**

### Property 10: Protected Command permission and honest validation

For any proposed Protected Command, execution requires both exact current-session Explicit User Authorization and Hook Permission; without either, the exact command remains pending and is not run; a Normal-Agent Eligible Check is permitted only when an active policy and enabled hook name that exact non-mutating check, and every observed result records command, root cwd, scope, exit status, authorization, hook decision, limitation, and unverified behavior.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.6, 10.7, 10.8, 10.9, 18.4, 18.5, 18.6, 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.10**

### Property 11: Failure Triage preserves controls

For any reported or observed Full Gate Failure, read-only Failure Triage precedes a control-change proposal and records the exact command, repository-root cwd, authorization, hook decision, exit status, first failed subcommand, output summary, and cause classification; when output is unavailable, the cause is unverified and the smallest authorized diagnostic is requested while gate composition, tests, coverage, baselines, and Hook Permission remain unchanged.

**Validates: Requirements SR3.1, SR3.2, SR3.3, SR3.4, 18.7, 18.8, 24.7, 24.8, 25.7, 25.8, 25.9**

### Property 12: Exactly four roles and conflict-safe integration

For any multi-agent Repository Task, the active roles are a subset of exactly Scout/Map, Planner/Risk, Implementer, and Verifier/Reporter with a maximum of four; read-only research or disjoint exclusive writes may run in parallel, every Implementer path is owned before writing, all handoff fields are present or explicitly not observed, and ownership overlap, edit conflict, or contradictory evidence stops affected writes before owner review and Serial Integration.

**Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8, 23.9, 23.10, 23.11, 23.12, 23.13, 23.14**

### Property 13: Surface Status and Coverage-Gap no-overclaim

For any area without current End-to-End Evidence, the guide creates a Coverage-Gap Admission Card with an allowed status, evidence source, limitation, next evidence source, owner action, scope boundary, and next decision; the card propagates to the response and Completion Record, and the area is never reported as wired or complete until status evidence is updated.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7**

### Property 14: Minimal scope, approval separation, and task-state honesty

For any Current Guidance task, the planned change is the smallest sound modification, the proof is the narrowest permitted evidence, and any hook/policy/runtime/package/database/deployment/backup/MCP/Power work is recorded as Separate Approval Work rather than performed; the downstream tasks artifact keeps unproven work open or pending, places separate active plans under `plans/<name>/`, and states separate work remains unimplemented at guidance completion.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4, 18.7, 19.6, 19.7, 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7**

### Property 15: Exact workspace boundaries and Site Write Gate

For any Output-Producing Task or proposed write under `./site/`, the documentation uses exact directory paths, keeps `./tech-docs-generator/` as a root-level sibling of `./site/`, keeps `./generated-documents/` as its separate tech-docs output, treats `./results/site/` as Machine Evidence rather than source, and requires the Route Record to classify the target as a Core Product Write or Non-Core Artifact. A Non-Core Artifact is stopped and redirected; a move into `./site/` or `./results/site/` remains a separately approved Workspace-Boundary Task; an explicitly approved Core Product Write records its exact outcome, owned paths, matching skills, and expected evidence; neither a boundary decision nor a static record claims that relocation occurred.

**Validates: Requirements 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 28.8, 28.9, 28.10, 28.11, 28.12, 28.13, 28.14, 28.15, 28.16, 28.17, 28.18, 28.19, 28.20, 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7, 29.8, 29.9, 29.10**

## 17. Validation and evidence strategy

This design introduces no runtime behavior, so validation is static/documentation validation. No command has been run in this design phase.

### 17.1 Checkable static/documentation validation

The next implementation tasks must check, without inventing pass evidence:

- the 22 Domain Index IDs and outcome names exactly match the baseline;
- every card maps to at least one chapter 01–11 and contains all card fields;
- every Start Path is exact or explicitly marked discovery, and the evidence-step order is unchanged;
- the Coverage Audit has one row per card and every unresolved path/capability links to a Coverage-Gap Admission Card;
- the 25 Prompt Cookbook categories exist exactly once, each has the complete safety preamble, placeholders, scope, expected evidence, stop condition, command classification, and Contract request;
- the Plain-Language Response Contract fields appear in the required order;
- the multi-agent procedure contains exactly four role names and all ownership/handoff/conflict rules;
- the current skill inventory and conditional triggers are present, `ai-retrieval` is marked absent until created, and no runtime discovery behavior is claimed;
- the beginner output-placement reference contains the exact `./agents-work/<workstream>/<report-type>/`, `./results/<purpose>/`, `./generated-documents/`, `./plans/<name>/`, root `Failures.md`, and approved `./site/` destinations, rejects new reports/evidence at the `./agents-work/` or `./results/` roots, and records no relocation claim;
- every Output-Producing Task's Route Record and Completion Record declare and repeat Artifact Class, selected subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and observed placement evidence;
- `./tech-docs-generator/` is documented as a root-level sibling of `./site/`, `./generated-documents/` as its separate output, and `./results/site/` as a purpose folder distinct from `./site/`; any proposed move is routed to a separate Workspace-Boundary Task;
- the Site Write Gate stops every Non-Core Artifact under `./site/` and permits only explicitly approved Core Product Writes with exact outcome, owned paths, matching skills, and expected evidence; the prohibited report/result/audit/handoff/prompt/plan/skill/steering/MCP/generated/temp/debug list is present;
- Protected Command and inline-marker rules, `typecheck` pending status, and unavailable `typecheck:scripts` status are present;
- no hooks, commands, package manifests, migrations, deployment assets, MCP settings, or runtime files are changed by the guidance implementation;
- `.config.kiro` remains valid and unchanged;
- Markdown/HTML synchronization is either evidenced and reconciled or explicitly admitted as a gap.

A future static checker may implement the universal properties with table-driven fixtures and at least 100 generated combinations per property where useful, but that checker is not part of this deliverable. Static inventory checks, examples, edge cases, and integration-like external-state claims remain separate from such properties. No rendered UI, hosted persistence, connected MCP, installed Power, successful command, or full-gate result may be claimed from this documentation inspection.

### 17.2 Owner-controlled checks

The following are not run by this design and remain pending unless separately authorized in the current session and permitted by the enabled hook:

- `pnpm run check:docs-all` and `pnpm run docs:check:root-links`;
- any `pnpm run check:layout`, gate, test, coverage, browser, build, typecheck, database, backup, deployment, or local-service command;
- any static check not explicitly named as a Normal-Agent Eligible Check by live policy and hook.

If a future check is authorized and observed, its Completion Record must include exact command, repository-root cwd, scope, authorization state, hook decision, exit status, limitation, and unverified behavior.

## 18. Downstream task-artifact replacement and serial implementation shape

The existing `tasks.md` is a stale completed plan for the former one-file skill reconciliation. The next Tasks phase must replace its content with open, serial, evidence-bound tasks; it must not preserve the all-checked state as completion evidence. This Phase 3 writes no `tasks.md`.

The replacement task artifact should use this dependency sequence and exclusive ownership:

1. **Evidence and source-provenance baseline** — read the current guide, all 11 chapters, HTML siblings, scripts/docs references, current skills, hook/settings boundaries, and path baseline. Inventory `./agents-work/`, `./results/`, `./generated-documents/`, `./tech-docs-generator/`, `./site/`, `./results/site/`, existing purpose/workstream folders, and any observed root-level artifacts; record the Markdown/HTML synchronization decision, artifact/workspace status, and unresolved gaps. Do not relocate anything or claim that a relocation occurred. No runtime or Protected Command action.
2. **Begin Here, Domain Index, card schema, Coverage Audit, gap templates, and boundary reference** — own `./agents-work/oando-repository-guide/README.md`; add the 22 cards and exact verified-path mapping; add the beginner output-placement reference and required copy-paste wording; define Workstream Subfolders, Purpose Subfolders, `./generated-documents/`, `./tech-docs-generator/` as a root-level sibling of `./site/`, `./results/site/` as a result purpose, the Site Write Gate, Non-Core Artifact redirects, and no-relocation wording; static-check card fields, count, chapter mapping, evidence order, gap links, exact directory forms, and root rejection rules.
3. **Evidence chapter augmentation** — serially own `01-repository-map.md` through `10-quality-validation.md` (one owner at a time or one exclusive serial task) to attach card links, current facts, status/placement rules, exact artifact destinations, D17/D19 workspace and output boundaries, Site Write Gate references, and protected-command guidance without duplicating authority.
4. **Response Contract, Prompt Cookbook, and four-role procedure** — own `11-working-with-kiro.md`; add all 25 complete blocks, the safety preamble, exact directory-path wording, artifact-class/subfolder/source-script/authored-generated fields, Site Write Gate instructions, delegation/review prompts, exactly four roles, handoff schema, parallel-safe rules, serial integration, and Conflict Stop Rule. Ensure every prompt that names a boundary uses the exact `./` path form and no prompt proposes a move without a Workspace-Boundary Task.
5. **Master router and AI guidance** — own `.kiro/skills/oando-master/SKILL.md` and, if approved as current guidance, create `.kiro/skills/ai-retrieval/SKILL.md`; preserve the existing first-router authority and add conditional triggers, no-runtime disclaimer, advisory AI boundary, artifact/workspace routing, Route/Completion Record fields, Site Write Gate, and completion policy. These files are serially integrated after the guide terms are fixed; they do not authorize implementation or relocation.
6. **Static HTML projection reconciliation** — own the matching HTML siblings only after Task 1 confirms the source relationship. If no relationship is established, create the documented parity gap rather than hand-editing or inventing a generator; retain the approved `./agents-work/oando-repository-guide/` guide workstream and do not write HTML or report material under `./site/` or `./results/`.
7. **Documentation/static validation and completion reconciliation** — read all changed paths, compare against every requirement/property including Requirements 28–29, check the placement table, exact subfolder rules, producer ownership, root-artifact legacy handling, workspace sibling/separation claims, Site Write Gate and Non-Core Artifact rejection, and forbidden scope; classify all unrun owner checks as pending; and report separate approval work. Any active plan for separate work belongs under `./plans/<name>/`; any true blocker belongs only in root `Failures.md`; no relocation is claimed without observed evidence.

Each task remains open until its exact static evidence is recorded. If an owner-controlled check cannot run, the task is pending or blocked with the next owner action, not complete. Serial integration occurs after each task because README, chapter cross-links, cookbook terms, skill triggers, artifact fields, Site Write Gate language, and HTML projections share concepts even when files are disjoint. A task that changes `./site/` must pass the Site Write Gate before its first write; a task that proposes a workspace-package move must stop for separate approval.

## 19. Requirement coverage summary

| Requirement group | Design sections |
|---|---|
| Special Requirements 1–3 | Sections 5, 6, 8, 12, 14, 16, 17 |
| Requirements 1–4 | Sections 3–7, 16 |
| Requirements 5–9 | Sections 7–9, 12–14, 16 |
| Requirements 10–13 | Sections 8, 12, 13, 16–18 |
| Requirements 14–16 and 21–22 | Sections 5, 6, 9, 16 |
| Requirements 17 and 23 | Section 10 and Property 12 |
| Requirements 18, 24–26 | Sections 7, 11–12, 15, Properties 9–13 |
| Requirement 27 | Sections 2, 11, 13, 18, Property 14 |
| Requirement 28 | Sections 3, 5–9, 11, 14–18, Properties 9 and 15 |
| Requirement 29 | Sections 3, 5, 7–9, 11, 13–18, Property 15 |

## 20. Implementation boundary

The implementation is complete only when the guidance artifacts described above are reconciled and statically inspected. It may modify the guide Markdown in its approved `./agents-work/oando-repository-guide/` workstream, its confirmed static projection, `.kiro/skills/oando-master/SKILL.md`, and the proposed AI Package Skill guidance. It must not modify hooks, package commands, runtime source, database/deployment/MCP configuration, or other Separate Approval Work. It must not relocate `./tech-docs-generator/`, `./generated-documents/`, `./site/`, or existing root-level result artifacts, and it must not place Non-Core Artifacts under `./site/`. Any Core Product Write under `./site/` requires its own explicit approval and Site Write Gate record; any workspace-boundary move requires a separately approved Workspace-Boundary Task. The final Completion Record must distinguish changed guidance scope, Artifact Class and observed placement evidence, documentation/static evidence, pending owner-controlled checks, Coverage-Gap Admissions, and Separate Approval Work that remains unimplemented; it must not claim a relocation without observed evidence.


## 21. Serial integration of the four read-only Design handoffs

The four completed read-only Design handoffs are integrated here as four concerns, in a fixed serial order. No handoff is allowed to overwrite an earlier decision; each handoff is reconciled against the current user request, the requirements addendum, the existing design, the exact four-role constraint, and the protected-path rules before the next concern is accepted. The handoffs are logical inputs to this design phase; no separate handoff file was found in `./.kiro/specs/oando-master/`, so the requirements addendum is the persisted source of their reconciled constraints.

| Serial handoff | Concern integrated | Design decision | Carry-forward condition |
|---|---|---|---|
| H1 | Canonical Kiro Markdown contract and literal inventory | Use one Kiro Agent Contract block or the exact Canonical Inclusion for Active Contract-Bearing Documents; classify every Kiro Markdown path rather than inferring runtime loading from presence. | The 51-file `./.kiro/**/*.md` baseline and the live `./agents-work/oando-repository-guide/` Markdown surfaces remain explicit inventory inputs. |
| H2 | Four-Agent Standing Mode and controlled execution | Model exactly four Active Agent slots and exactly four available duties: Scout/Map, Planner/Risk, Implementer, and Verifier/Reporter. Coordinator/Serial Integration Owner is a function assigned to one of those slots, never a fifth Agent. | All writes require exact ownership and a serial integration checkpoint; current runtime proof remains separate from prose design. |
| H3 | Pre-action enforcement, protected paths, and exact-line migration | Model one fail-closed pre-action decision boundary for reads, writes, deletes, commands, delegation, and handoffs; lock protected paths by default; make Exact-Line Rule rollout idempotent and owner-authorized. | Existing command-specific hook evidence is not generalized to universal action enforcement; current protected files remain unchanged unless separately authorized. |
| H4 | Deliverables, statuses, evidence honesty, and coordinator handoff | Define the Agent Roster, Ownership Matrix, Route Record, Pre-Action Gate Records, Handoff Register, optional Conflict Stop Record, and Completion Record with closed status vocabularies and explicit static/runtime evidence separation. | Missing, inaccessible, pending, or unobserved evidence keeps the task pending, blocked, or not-observed; it never becomes verified by implication. |

### 21.1 Serial integration protocol

1. The Coordinator function attached to one of the four slots records the current user request, applicable repository standard, exact scope, exclusions, and delivery conditions.
2. H1 is reconciled first because every later record depends on knowing which Markdown documents are active instructions, references, history, package documents, or generated output.
3. H2 is reconciled against the H1 inventory and establishes the four-slot roster, exact ownership, serial integration owner, and the rule that the physical definition-file count is not the active-roster count.
4. H3 is reconciled against H1 and H2. A proposed action cannot use a contract text, roster entry, or path classification as a substitute for a real pre-action decision. Protected-path and exact-line decisions are applied before any target write or delete.
5. H4 is reconciled last. It converts the preceding decisions into required records, statuses, completion proof, and unresolved-owner actions. A handoff that cannot be reconciled to the current request, ownership matrix, exclusions, or delivery conditions is rejected or returned for owner review.
6. Only after all four read-only handoffs are serially reconciled may the approved current Design artifact be written. This phase writes only the existing `./.kiro/specs/oando-master/design.md`; it does not modify application code, root controls, `./docs/`, `./Agents/`, `./.kiro/agents/`, hooks, package files, or runtime governance code.

## 22. Kiro Markdown inventory and contract propagation

The Kiro Markdown Inventory is a static, path-by-path evidence artifact. Each entry records `path`, `classification`, `contractMode`, `owner`, `evidenceState`, and `limitation`. `classification` is one of `Active Contract-Bearing`, `Reference or History`, `Package Document`, or `Generated Kiro Markdown`. `contractMode` is `exact-block`, `canonical-inclusion`, `not-applicable`, or `not-observed`. The inventory must not infer that a file is loaded by Kiro or that its text is enforced at runtime.

### 22.1 Literal Active Contract-Bearing inventory

The following 36 paths are individually named and remain the required active-document baseline:

1. `./.kiro/agents/capability-powers-author.md`
2. `./.kiro/agents/containment-reconciler.md`
3. `./.kiro/agents/hook-localizer.md`
4. `./.kiro/agents/spec-task-runner.md`
5. `./.kiro/agents/spec-task-runner2.md`
6. `./.kiro/skills/db-migrations/SKILL.md`
7. `./.kiro/skills/focss-css/SKILL.md`
8. `./.kiro/skills/fork-boundaries/SKILL.md`
9. `./.kiro/skills/graph-impact/SKILL.md`
10. `./.kiro/skills/oando-master/SKILL.md`
11. `./.kiro/skills/planner-studio/SKILL.md`
12. `./.kiro/skills/powers-skills-model/SKILL.md`
13. `./.kiro/skills/repo-map/SKILL.md`
14. `./.kiro/skills/verify-and-gate/SKILL.md`
15. `./.kiro/steering/agent-behavior.md`
16. `./.kiro/steering/ai.md`
17. `./.kiro/steering/api.md`
18. `./.kiro/steering/coding-standards.md`
19. `./.kiro/steering/database.md`
20. `./.kiro/steering/deployment.md`
21. `./.kiro/steering/graph-layer.md`
22. `./.kiro/steering/INDEX.md`
23. `./.kiro/steering/ltm-memory-format.md`
24. `./.kiro/steering/ltm-operations.md`
25. `./.kiro/steering/nova-act-viewport.md`
26. `./.kiro/steering/product.md`
27. `./.kiro/steering/seo.md`
28. `./.kiro/steering/tech-stack.md`
29. `./.kiro/steering/testing.md`
30. `./.kiro/steering/ui-css.md`
31. `./.kiro/powers/analytics/POWER.md`
32. `./.kiro/powers/oando-workflow/POWER.md`
33. `./.kiro/powers/observability/POWER.md`
34. `./.kiro/powers/security/POWER.md`
35. `./.kiro/powers/oando-workflow/steering/routing.md`
36. `./.kiro/kiro-repo-guidance-setup/README.md`

The five physical files under `./.kiro/agents/` are all individually inventoried. Their physical presence does not authorize an Agent to edit them, and the five-file count does not contradict the four-slot Active Agent roster.

### 22.2 Literal reference, package, and reconciliation inventory

The following ten specification/reference documents are individually classified as `Reference or History` rather than active contract surfaces:

- `./.kiro/specs/documentation-global-standards/design.md`
- `./.kiro/specs/documentation-global-standards/implementation-record.md`
- `./.kiro/specs/documentation-global-standards/requirements.md`
- `./.kiro/specs/documentation-global-standards/tasks.md`
- `./.kiro/specs/kiro-config-rewrite/design.md`
- `./.kiro/specs/kiro-config-rewrite/requirements.md`
- `./.kiro/specs/kiro-config-rewrite/tasks.md`
- `./.kiro/specs/oando-master/design.md`
- `./.kiro/specs/oando-master/requirements.md`
- `./.kiro/specs/oando-master/tasks.md`

The following four files are individually classified as `Package Document` and are not active workspace contract surfaces:

- `./.kiro/power-packages/analytics/skills/analytics/SKILL.md`
- `./.kiro/power-packages/oando-workflow/skills/oando-workflow/SKILL.md`
- `./.kiro/power-packages/observability/skills/observability/SKILL.md`
- `./.kiro/power-packages/security/skills/security/SKILL.md`

The inventory also records `./.kiro/kiro-repo-guidance-setup/RECONCILIATION.md` as `Reference or History`. No Generated Kiro Markdown is claimed in the inspected `./.kiro/` tree, and no Markdown files are claimed under `./.kiro/hooks/`, `./.kiro/mcp/`, or `./.kiro/settings/`. If a later inventory observes a new path in one of those classes, it must add a row and classify it before any contract claim.

### 22.3 Literal live guide Markdown inventory

The Kiro inventory is supplemented by the live guide Markdown surfaces because they are the human-facing documentation work product that carries the same routing vocabulary:

- `./agents-work/oando-repository-guide/README.md`
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

These paths are guide work surfaces, not additional entries in the 51-file `./.kiro/**/*.md` inventory. Their later updates must use the guide's Workstream Subfolder and Locked Path Gate rules.

### 22.4 Contract forms

The exact Kiro Agent Contract is the full pre-work declaration defined by the requirements and existing design: current user request state; applicable global standard state; precedence/override state; requested outcome; assigned scope; exact owned paths and permissions; exclusions; delivery conditions; validation allowed; validation pending authorization; and next owner. The Canonical Inclusion is exactly:

```text
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.
```

An Active Contract-Bearing Document uses either the exact block or the exact inclusion. A paraphrase is not a third form. Reference/history, package, generated, and inaccessible documents retain their inventory classification and are not reported as contract-covered unless a separate owner-authorized scope selects them.

## 23. Four-Agent Standing Mode and controlled-task architecture

Standing Multi-Agent Mode is a task-state contract, not a claim that the current host automatically spawns or schedules Agents. Every Repository Task has exactly four Active Agent roster entries before any exploration, modification, command proposal, delegation, or handoff. The four available roles are exactly:

- **Scout/Map** — read-only authority mapping, repository orientation, candidate paths, and evidence discovery.
- **Planner/Risk** — read-only scope decomposition, skill selection, Workflow Mode, operational risk, command classification, ownership proposal, and validation planning.
- **Implementer** — read-only until an approved exclusive write scope exists; then writes only the exact owned paths.
- **Verifier/Reporter** — read-only evidence reconciliation, coverage-gap review, completion-proof review, and Plain-Language Response Contract reporting.

`Coordinator/Serial Integration Owner` is a designation attached to one of the four slots. It is not a fifth role and is not added to the role enum. The default assignment may attach the designation to Planner/Risk for planning-time coordination or Verifier/Reporter for closure, but the roster always contains four entries and the designation is recorded as a field on one entry.

### 23.1 Controlled-task lifecycle

```text
ordinary-language outcome
  -> create four roster entries and designate one coordinator slot
  -> publish Ownership Matrix, Route Record, Deliverable Register, Conflict Stop Rule
  -> obtain Agent Compliance declarations before each slot acts
  -> allow read-only Scout/Map and Planner/Risk work
  -> keep Implementer read-only until exclusive scope is approved
  -> evaluate every proposed action through the Pre-Action Gate
  -> reconcile each handoff serially against current scope and evidence
  -> allow only exclusive or serially owned writes
  -> run read-only Verifier/Reporter review
  -> emit Completion Record with observed, pending, blocked, and not-observed states
```

A `Multi-Agent Availability State` of `available`, `limited`, or `unavailable` describes capacity, not permission to collapse the roster. If four Active Agent entries cannot be created or proven, the state is `guidance-only` or `not-observed`, automatic assignment remains Separate Approval Work, and no silent single-Agent fallback is allowed.

### 23.2 Conceptual TypeScript records

These are design interfaces for a future controlled executor or static record checker. They are not application runtime types and are not created by this Design phase.

```typescript
type ActiveRole = "Scout/Map" | "Planner/Risk" | "Implementer" | "Verifier/Reporter";
type Availability = "available" | "limited" | "unavailable";
type LifecycleStatus =
  | "planned" | "assigned" | "ready" | "in-progress" | "blocked"
  | "denied" | "handoff-ready" | "serial-integrated" | "verified"
  | "complete" | "pending-owner" | "not-observed";
type EnforcementStatus =
  | "guidance-only" | "not-observed" | "partially-enforced"
  | "enforced" | "blocked";

interface ActiveAgentEntry {
  agentId: string;
  role: ActiveRole;
  coordinator: boolean;
  readPermission: boolean;
  writePermission: boolean;
  ownedPaths: readonly string[];
  exclusions: readonly string[];
  availability: Availability;
  status: LifecycleStatus;
  nextOwner: string;
}

interface AgentRoster {
  taskId: string;
  agents: readonly [
    ActiveAgentEntry,
    ActiveAgentEntry,
    ActiveAgentEntry,
    ActiveAgentEntry,
  ];
  coordinatorAgentId: string;
  conflictStopRule: "attached";
  status: LifecycleStatus;
}
```

The tuple shape is deliberate: a valid controlled task cannot contain three or five entries. Validation also checks that the four role values are unique, exactly one entry has `coordinator: true`, and no coordinator role is added to `ActiveRole`.

### 23.3 Serial integration and ownership

The Ownership Matrix maps every objective, evidence item, artifact, and exact path to one of the four Agent IDs or to the Serial Integration Owner designation. Shared files, manifests, configurations, migrations, hooks, generated evidence, result paths, and shared guide/router vocabulary are serially owned. Parallel work is permitted only for read-only research or disjoint exclusive file ownership, and the next shared-path write waits for serial integration.

A handoff is accepted only after the Serial Integration Owner compares it with the current user request, Route Record, roster, ownership matrix, exclusions, delivery conditions, prior handoffs, and current evidence. Overlap, contradiction, or unowned paths activate the Conflict Stop Rule and deny affected writes before any reconciliation edit.

## 24. Fail-closed Pre-Action Enforcement Layer

The Pre-Action Enforcement Layer is the required future executable or host-integrated component. It is not satisfied by Markdown instructions, prompts, self-attestation, a post-action review, or a file-save hook. It receives an Action Record before execution and returns an explicit `allow` or `deny` decision with a reason and ordered evidence record.

### 24.1 Action records and gate interface

```typescript
type ActionKind = "read" | "write" | "delete" | "command" | "delegation" | "handoff";
type GateDecision = "allow" | "deny";

type ActionRecord = {
  taskId: string;
  agentId: string;
  role: ActiveRole;
  action: ActionKind;
  targetPath?: string;
  command?: string;
  repositoryRoot?: string;
  requestedScope: string;
  ownershipState: "exclusive" | "serial" | "unowned" | "conflict";
  authorizationState: "explicit-current-session" | "absent" | "not-required" | "not-observed";
  hookDecision: "permitted" | "denied" | "not-required" | "not-observed";
  routeRecordRef: string;
  deliveryConditionRef?: string;
};

type PreActionDecision = {
  decision: GateDecision;
  reason: string;
  nextOwnerAction: string;
  recordedAtOrOrder: string;
};

interface PreActionEnforcementLayer {
  evaluate(record: ActionRecord): PreActionDecision;
}
```

For `read`, the gate verifies task identity, Agent identity, role, exact target, read permission, Protected Path classification, and current lifecycle status. For `write`, it additionally verifies exclusive or serial ownership, write permission, Route Record, Protected Path Lock, Site Write Gate when relevant, and delivery-condition match. For `delete`, it verifies explicit deletion scope, exact owner authorization, exclusive ownership, and the protected-path state. For `command`, it verifies command classification, repository-root working directory, exact current-session authorization when required, Hook Permission, and recorded scope. For `delegation`, it verifies that the Coordinator function is delegating to one of the four current entries and that role, paths, delivery conditions, and next owner are present. For `handoff`, it verifies complete fields, ownership-matching changed paths, observed-versus-not-run validation state, and receiving owner.

A missing, malformed, stale, ambiguous, contradictory, denied, or unavailable Action Record is denied before execution. The layer never selects an alternate tool, path, Agent, permission, or inferred approval. If the layer is unavailable or indeterminate, the result is Fail-Closed Denial and Enforcement Status becomes `blocked` or `not-observed`.

### 24.2 Current evidence boundary

The current repository contains command-specific hook evaluation and governance interfaces that can support future evidence collection, including read-only hook parsing, ownership declarations, wave preflight, reviewer stages, and integration handoff projections under `./.kiro/kiro-repo-guidance-setup/`. Those assets do not by themselves prove a host-integrated gate for every read, write, delete, command, delegation, and handoff. The existing `block-agent-tests` hook is reported only for its observed command-tool scope. Until a current-session observation establishes the universal layer, Enforcement Status is `guidance-only` or `not-observed` and implementation remains Separate Approval Work.

## 25. Protected Path Lock and Exact-Line Rule

### 25.1 Protected Path Lock

The Protected Path Set is:

- every path under `./docs/`;
- every path under `./Agents/`;
- every root file directly under `./`, including root Markdown and other root control files; and
- every path under `./.kiro/agents/`.

Protected paths are readable as Read-Only Evidence Sources. A read grant never becomes write or delete permission. A proposed write or delete is allowed only when the Repository Owner names the exact file path in the current request; naming one file does not unlock neighboring files. Without exact authorization, the gate denies the action before modification, preserves the target, and records a pending Owner Decision and Separate Approval Work. A copy, mirror, generated substitute, or report elsewhere never proves that the protected source changed.

The current Design-phase target `./.kiro/specs/oando-master/design.md` is writable because it is the existing spec artifact selected by this authorized workflow; it is not an Agent definition and is outside the Protected Path Set. This exception does not authorize any other `.kiro` or root-path write, and `./.kiro/specs/oando-master/.config.kiro` remains unchanged.

### 25.2 Exact-Line Rule

The one-time migration line is exactly:

```text
Before any action, read the current user request and applicable repository standard, declare exact scope and permissions, and stop on denial, conflict, or missing authorization.
```

A future owner-authorized rollout may select `./AGENTS.md` and directly applicable files under `./Agents/`, including `./Agents/01-standard.md`, but it must name each exact target in the current request. It inserts exactly one occurrence per selected target, retains one occurrence when already present, and records a line count of one. Failure to insert or normalize the line stops the rollout and records a blocker or pending Owner Decision; it does not claim completion. The current requirements and Design phases define this rollout but do not perform it.

The rollout uses the Route Record, Protected Path Lock, exclusive ownership, serial integration, pre-action decisions, and Completion Record. The phrase “relevant guidance” is not an exact-file authorization.

## 26. Required records and closed status schemas

### 26.1 Deliverable Register

Every controlled Repository Task starts with exactly these named deliverables:

1. Agent Roster
2. Ownership Matrix
3. Route Record
4. Pre-Action Gate Records
5. Handoff Record Register
6. Conflict Stop Record, when a conflict occurs
7. Completion Record

Each deliverable has one owner, a lifecycle status from the closed Status Vocabulary, and an evidence reference. A missing deliverable or field prevents `verified` or `complete` status.

### 26.2 Route Record

The Route Record remains the first routing record and is extended for controlled execution:

```typescript
interface RouteRecord {
  taskOutcome: string;
  domain: string;
  candidatePaths: readonly { path: string; reason: string }[];
  selectedSkills: readonly string[];
  rejectedSkills: readonly { skill: string; reason: string }[];
  workflowMode: "Vibe" | "Plan" | "Spec" | "Autopilot" | "Supervised";
  operationalRisk: string;
  artifactClass?: string;
  commandClassification: readonly { command: string; class: string }[];
  protectedPathLock: "Locked" | "explicitly-owner-authorized" | "writable" | "not-applicable";
  siteWriteGate: "Core Product Write" | "Non-Core Artifact" | "not-applicable";
  nextAction: string;
}
```

An Output-Producing Task also records the exact Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, and rejected placements. A `./site/` target is not writable until the Site Write Gate classifies it as an explicitly approved Core Product Write.

### 26.3 Pre-Action Gate Records

There is one Action Record and one decision/reason for each proposed read, write, delete, command, delegation, and handoff. The records distinguish `allow` from `deny`, state the next owner action, and preserve the fact that an unavailable decision is a denial rather than an implicit allow.

### 26.4 Handoff Record Register

Every handoff contains the following fields, with `not-observed` instead of omission:

```text
Objective
Role and Next Owner
Scope
Paths Read and Paths Changed
Route Record
Evidence
Decisions
Coverage Gaps
Validation Command
Repository Root
Authorization State
Hook Decision
Exit Status
Validation Limitation
Blockers
Next Action
Status
```

Changed paths must match ownership. Validation actually run is separated from validation not run; an unobserved command is unrun. The receiving owner is explicit. The four Design handoffs integrated in Section 21 follow this shape conceptually even though this phase does not create separate handoff files.

### 26.5 Completion Record

The Completion Record contains every changed file and why it changed, actual validation with exact observed results, validation not run with the exact pending/unauthorized reason, remaining issues, unverified behavior, blockers, next owner action, scope and exclusions, Multi-Agent Evidence, Coverage-Gap Admission Cards, Separate Approval Work, and final lifecycle status. It repeats output artifact fields and observed placement evidence when output was produced.

The lifecycle Status Vocabulary is exactly:

```text
planned | assigned | ready | in-progress | blocked | denied | handoff-ready
serial-integrated | verified | complete | pending-owner | not-observed
```

The Enforcement Status Vocabulary is exactly:

```text
guidance-only | not-observed | partially-enforced | enforced | blocked
```

No state transition may replace missing, pending, denied, or not-observed evidence with `verified` or `complete`.

## 27. Static evidence versus runtime evidence

The design separates three evidence layers:

| Evidence layer | What it can establish | What it cannot establish |
|---|---|---|
| Static inventory/read-back | exact paths, classifications, text forms, counts, links, scope, and unchanged-file observations | runtime loading, Agent spawning, tool interception, fail-closed denial, command success, rendered behavior, hosted persistence, connected MCP, or installed Power |
| Host/integration observation | a real roster, pre-action decision, hook result, command result, or runtime load for the observed scope | behavior outside the observed host/scope, future sessions, or unobserved external/global files |
| Owner-authorized validation | the exact authorized command or external action result, with cwd, authorization, hook decision, exit status, and limitation | any broader claim than the command/action scope proves |

The prior requirements-only clarification phase changed only `./.kiro/specs/oando-master/requirements.md` to append the clarification reconciliation, supplemental glossary, and normal Requirements 33–40 addendum; it did not change application code, Agent definitions, root standards, `./Agents/`, or other files. The current Design phase has only static inspection and the single existing design-artifact edit. Neither phase may claim that four Active Agent entries were created by the runtime, that a universal Pre-Action Enforcement Layer is installed, that any Exact-Line Rule was migrated, that all 36 active documents were contract-appended, or that an external/global Kiro file was inspected. The five physical definition files are static inventory evidence; they are not five active Agents. `spec-task-runner2.md` is preserved.

A command-specific `block-agent-tests` hook observation is reported only for the command family and tool surface it actually covers. It is not generalized to reads, writes, deletes, delegation, or handoffs. The current Enforcement Status for the universal controlled-executor requirement is `guidance-only` or `not-observed` until a separate approved implementation and current-session observation establish otherwise.

## 28. Error handling and safe fallback matrix for Requirements 33–40

| Condition | Required behavior |
|---|---|
| Kiro Markdown path is absent or unreadable | Add an inventory row with `not-observed`, limitation, and next evidence source; do not claim contract coverage. |
| Active document contains a paraphrased contract | Reject the paraphrase for contract compliance; require the exact block or Canonical Inclusion in an owner-authorized task. |
| Reference, history, package, or generated document is treated as active | Preserve its classification and stop the contract claim until a separate owner-approved scope reclassifies it. |
| External/global Kiro file is inaccessible | Mark `not-observed`; never claim it was read, changed, or covered. |
| Physical Agent definition count differs from four | Preserve all physical files, including `spec-task-runner2.md`; distinguish inventory count from four Active Agent slots. |
| Four roster entries cannot be created or proven | Set Enforcement Status to `guidance-only` or `not-observed`; do not silently use one Agent. |
| Action Record is missing, malformed, stale, ambiguous, contradictory, or unavailable | Fail-Closed Denial before action, record reason, and name next owner action. |
| Pre-Action Enforcement Layer is unavailable or indeterminate | Deny the action; set `blocked` or `not-observed`; never choose an alternate permission/tool/path. |
| Agent ownership overlaps or evidence conflicts | Invoke Conflict Stop Rule, stop affected writes, route to Repository Owner review, and serially integrate only after resolution. |
| Protected write/delete lacks exact current-request file authorization | Deny before modification; keep source unchanged; record pending Owner Decision and Separate Approval Work. |
| Exact-Line Rule already appears more than once | Stop rollout, normalize only under exact owner authorization, and preserve one occurrence; do not claim an unapproved repair. |
| Exact-Line Rule insertion fails | Stop the rollout and record the target, reason, blocker/pending state, and next owner action. |
| Handoff or Completion Record omits a required field | Mark the record incomplete and keep lifecycle status `blocked`, `pending-owner`, or `not-observed`. |
| Static evidence is used to claim runtime enforcement or successful behavior | Reject the overclaim and replace it with the observed scope, limitation, and next evidence source. |
| Current phase proposes tests, gates, builds, typechecks, scripts, package commands, or implementation commands | Do not run; classify as pending owner validation or Separate Approval Work. |

## 29. Requirements 33–40 traceability

The addendum is implemented by the following design surfaces while preserving the existing Special Requirements and Requirements 1–32 sections and Properties 1–15:

| Requirement | Design sections and evidence contract |
|---|---|
| 33 | Sections 21, 22, 27, and Property 16: serial H1 integration; exact contract forms; literal 36/10/4 inventories; reconciliation classification; guide Markdown coverage; static-only limitation. |
| 34 | Sections 21, 23, 26, 27, and Property 17: exactly four slots; four role enum; coordinator function without fifth role; roster-before-action; ownership and serial integration; physical five-file distinction; no silent fallback. |
| 35 | Sections 21, 24, 26, 27, 28, and Property 18: executable/host-integrated gate requirement; Action Record evaluation for all six action kinds; explicit allow/deny; Fail-Closed Denial; current command-hook limitation. |
| 36 | Sections 21, 25, 28, and Property 18: Protected Path Set; exact-file authorization; read/write separation; no substitute-copy claim; future Exact-Line targets. |
| 37 | Sections 21, 23, 26, 28, and Property 17: exact Deliverable Register; roster and ownership fields; Route Record; Action Records; Handoff Register; Completion Record; closed lifecycle/enforcement statuses. |
| 38 | Sections 21, 24.2, 27, 28, and Property 19: static/runtime separation; command-specific hook scope; inaccessible-file limitation; five-file/four-slot reconciliation; requirements-only scope. |
| 39 | Sections 21, 25.2, 28, and Property 20: exact line; owner-authorized target set; one-occurrence/idempotence rule; insertion failure; serial ownership and completion proof. |
| 40 | Sections 21, 26.4–26.5, 27, 28, and Property 19: coordinator handoff fields; changed-file reasons; actual versus pending validation; 51-file baseline; unobserved implementation gaps; exactly three Special Requirements. |

The existing design sections remain authoritative for Requirements 1–32. The addendum does not narrow those requirements, merge the 22 Domain Index cards, reduce the 25 Prompt Cookbook categories, alter artifact placement, or create a fourth Special Requirement.

## 30. Correctness Properties — addendum

The first 15 properties remain unchanged and continue to cover the inherited requirements. The following properties are the non-redundant additions derived from the four Design handoffs and the completed prework/reflection.

### Property 16: Canonical Kiro inventory and contract-form integrity

For any static Kiro Markdown inventory, every Active Contract-Bearing Document is represented individually and uses exactly the Kiro Agent Contract block or the Canonical Inclusion when contract coverage is claimed; every Reference or History, Package, Generated, or inaccessible document retains its classification and is not represented as active contract evidence, and the inventory is never used as proof of runtime loading or enforcement. The live guide Markdown paths are tracked as a separate documented work-surface inventory.

**Validates: Requirements 33.1, 33.2, 33.3, 33.4, 33.5, 33.6, 33.7, 33.8, 33.9**

### Property 17: Four-slot controlled-task records remain complete and serial

For any controlled Repository Task, the Agent Roster contains exactly four Active Agent entries whose roles are Scout/Map, Planner/Risk, Implementer, and Verifier/Reporter, exactly one entry carries the Coordinator/Serial Integration Owner designation, and the roster, Ownership Matrix, Route Record, Deliverable Register, Conflict Stop Rule, and statuses exist before action; Implementer writes are limited to exact approved exclusive paths, handoffs are serially reconciled, conflicts stop affected writes, and missing evidence never advances a deliverable to `verified` or `complete`.

**Validates: Requirements 34.1, 34.2, 34.3, 34.4, 34.5, 34.6, 34.7, 34.8, 34.9, 34.10, 37.1, 37.2, 37.3, 37.4, 37.5, 37.6, 37.7, 37.8, 37.9, 37.10, 37.11**

### Property 18: Fail-closed action and protected-path boundary

For any proposed read, write, delete, command, delegation, or handoff, the Pre-Action Gate either observes all required identity, role, target, ownership, permission, route, authorization, hook, lock, scope, and delivery conditions and returns an explicit allow, or denies before execution with a reason and next owner action; unavailable or indeterminate gate state denies, protected reads never upgrade to writes/deletes, and an unauthorized copy never proves a protected source changed.

**Validates: Requirements 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9, 35.10, 35.11, 36.1, 36.2, 36.3, 36.4, 36.5, 36.6**

The existence of a real executable or host-integrated enforcement layer in Requirement 35.1 is a separate smoke/integration check. Static contract text cannot satisfy it.

### Property 19: Evidence-honest handoffs and completion records

For any handoff or Completion Record, each changed file has a reason, validation actually run is separated from validation not run, inaccessible or unobserved evidence is labelled accordingly, command-specific hook evidence is not generalized, physical definition-file inventory is distinguished from the four-slot roster, and static text/path evidence is never reported as runtime enforcement, automatic spawning, command success, rendered behavior, hosted persistence, connected MCP, or installed Power evidence.

**Validates: Requirements 38.1, 38.2, 38.3, 38.4, 38.5, 38.6, 40.1, 40.2, 40.3, 40.4, 40.5, 40.6**

### Property 20: Exact-Line Rule rollout is owner-authorized and idempotent

For any exact target selected by a future owner-authorized Exact-Line Rule rollout, the exact required line appears exactly once after a successful rollout, an existing single occurrence remains single, and an unauthorized target or insertion failure stops the rollout with a pending Owner Decision or blocker rather than modifying a protected file or claiming completion.

**Validates: Requirements 39.1, 39.2, 39.3, 39.4, 39.5, 39.6, 39.7**

## 31. Validation strategy and unresolved work carried into Tasks

This Design phase performed only read-only file/path inspection and the single authorized write to the existing Design artifact. No tests, gates, builds, typechecks, scripts, package commands, implementation commands, or external actions were run. The next Tasks phase must keep the following work open and evidence-bound:

1. **Static Kiro Markdown inventory:** enumerate and classify all 51 required `./.kiro/**/*.md` paths individually, plus the 12 live `./agents-work/oando-repository-guide/` Markdown paths, and record any inaccessible or newly observed path without claiming runtime loading.
2. **Contract rollout decision:** determine the exact owner-authorized target set for appending the exact Kiro Agent Contract or Canonical Inclusion. Do not write `./.kiro/agents/**`, `./AGENTS.md`, `./docs/`, or `./Agents/` without exact current-request authorization. Preserve the distinction between active, reference/history, package, generated, and guide work surfaces.
3. **Four-slot runtime evidence:** establish, or explicitly leave unobserved, a real four-entry Active Agent roster and the Coordinator/Serial Integration Owner designation. Preserve all five physical definition files, including `./.kiro/agents/spec-task-runner2.md`; do not alter the definition inventory to force four.
4. **Pre-Action Enforcement Layer:** separately scope and authorize an executable or host-integrated gate for all six action kinds. Existing read-only governance modules and command-specific hook evaluation are supporting evidence only, not proof of universal interception. Implement Fail-Closed Denial and record every allow/deny decision before claiming `enforced`.
5. **Protected Path Lock:** separately implement or observe exact-file authorization, read-only evidence access, conflict stop behavior, and no-substitute-copy semantics. Keep the current root/docs/Agents/`.kiro/agents` paths unchanged in this phase.
6. **Exact-Line migration:** prepare a future owner-authorized, serial, idempotent rollout for `./AGENTS.md` and selected `./Agents/` files, including `./Agents/01-standard.md`; record line counts, failures, and completion proof. The current phase deliberately performs no migration.
7. **Record and status checker:** create only under a separately approved scope any static or host-integrated checker needed to validate the closed schemas, exact four-entry roster, action records, handoffs, completion records, and status transitions. A checker or test is not implied by this Design phase.
8. **Final static and runtime evidence reconciliation:** preserve the exact three Special Requirements, all 22 Domain Index cards, all 25 Prompt Cookbook categories, artifact placement, workspace sibling boundaries, Site Write Gate, and no-runtime-claim rules. Any unobserved roster, pre-action layer, contract append, lock implementation, external/global file, or rendered/hosted behavior remains `not-observed` or `pending-owner` with a named next action.

These are downstream Tasks, not additional Design-phase writes. The existing `tasks.md` remains untouched in this phase and must be replaced or reconciled in the Tasks phase with open tasks that preserve these boundaries and serial dependencies.

## 32. Design-phase completion boundary

The integrated Design artifact is complete for this phase when the preceding sections are read as an additive extension of the existing design: the four read-only handoffs are reconciled serially; all 51 Kiro Markdown classifications and all live guide Markdown paths are explicit; exactly four roles and serial integration are modeled; pre-action decisions are fail-closed for every action kind; protected paths and Exact-Line Rule are owner-controlled; records and status vocabularies are closed; static/runtime evidence is separated; and Requirements 33–40 map to concrete design sections and properties.

This document does not claim that the controlled executor, universal pre-action gate, exact-line migration, active-document contract append, or four-entry runtime roster currently exists. It records those as implementation and observation work for the next Tasks phase, while preserving the exact constraints and scope of the existing Quick Spec.
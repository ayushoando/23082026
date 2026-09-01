# 01 · Full repository map

[Start](../README.md) · [Next: application architecture →](./02-application-architecture.md)

This is the exhaustive functional map, excluding dependency contents and individual generated files. A listed path is a starting location, not proof that a capability is wired, loaded, hosted, or complete.

## Product and source areas

| Area | Status | Role |
|---|---|---|
| `./site/` | Source / editable | Main Next.js product: UI, API, security edge, platform adapters, styles, assets, i18n, and observability. |
| `./tests/` | Source / editable | Vitest, Testing Library, Playwright, fixtures/helpers, and the tech-docs test lane. |
| `./scripts/` | Source / editable, sometimes operational | Checks, audits, migrations, seeds, backup/R2, catalog assets, generators, codemods, and command dispatch. |
| `./config/` | Source / editable | Build/test harness, governance baselines, and local observability configuration. |
| `./workers/` | Source / editable | Cloudflare Worker source, separate from the Vercel application deploy. |
| `./tech-docs-generator/` | Source / editable | Separate Vite inventory SPA and source-to-documentation generator. |
| `./i18n/` | Source / editable | Root next-intl resolver shim; real messages/config are in `./site/i18n/`. |

## Delivery, governance, and coordination areas

| Area | Status | Role |
|---|---|---|
| `./.github/` | Source / editable | CI workflows, scoped instructions, and Dependabot configuration. |
| `./docs/` | Canonical durable documentation | Architecture, database, and governance reference; live code wins on mismatch. Locked Path evidence. |
| `./plans/` | Active-work coordination | Requirements/design/tasks/plan evidence; use `./plans/README.md` for placement and authority. |
| `./Agents/` | Process handbook | Agent standard/testing/browser/failure/documentation/architecture/CSS procedures (`01`–`07`, indexed by `./Agents/INDEX.md`). Locked Path evidence. |
| `./agent-reports/` | Absent | `AGENTS.md` §8 forbids recreating Phase A audit dumps or PNGs here; not product source. |
| `./agents-work/` | Working material | Research/work products, including this guide; not application runtime authority. |

## Output, local, and private areas

| Area | Status | Role |
|---|---|---|
| `./generated-documents/` | Generated / disposable | Tech-docs generator output: data, rendered docs, and static site. Regenerate rather than patch. |
| `./results/` | Generated evidence | Command/test/report output. Use a purpose subfolder; never place handwritten plans or audits at the root. |
| `./node_modules/` | Local generated | Installed dependencies. Never hand-edit. |
| `./.git/` | Local VCS state | Git metadata only. |
| `./.vscode/` | Editor configuration | VS Code workspace settings/tasks. |
| `./.env.local`, `./.env copy.local` | Local/private | Credentials and local runtime configuration; never commit or expose. |
| `./.env.example` | Editable template | Non-secret environment shape/documentation. |

## Root control files

| File or group | Owns |
|---|---|
| `./package.json`, `./pnpm-workspace.yaml`, `./pnpm-lock.yaml`, `./turbo.json` | Package ownership, scripts, workspace, package-manager lock, and task runner. |
| `./vercel.json`, `./.vercelignore` | Vercel build/deploy behavior. |
| `./.oxlintrc.json`, `./.gitignore` | Lint and ignore policy. |
| `./.postman.json` | API collection. |
| `./skills-lock.json` | Versioned lock pinning one externally sourced skill (`onboarding` from `launchdarkly/agent-skills`, GitHub, with a computed hash). It does not govern the user-global opencode guidance layer. |
| `./AGENTS.md` | Repository process floor; Locked Path evidence. |
| `./START.md`, `./README.md`, `./CONTENTS.md`, `./DOC-MAP.md` | Onboarding and documentation index/placement; direct root Markdown is Locked Path evidence. |
| `./OPERATIONS_RUNBOOK.md`, `./Testing-handbook.md` | Operations and test/validation procedures. |
| `./Failures.md` | Sole hard-blocker ledger. |
| `./HANDOVER.md`, `./owners.md` | Historical handoff and ownership context; verify against live code. |

## Areas that are not live source

- `./site/.next/`, `./site/next-env.d.ts`, `./site/tsconfig.tsbuildinfo`, and test/package build-info are local/generated.
- `./site/data/storage/` is legacy. Do not write runtime behavior there.
- A generic document may mention root `./supabase/` or `./mcp/`; neither exists. Supabase code and migrations live only under `./site/platform/supabase/` (`migrations/` and `migrations.admin/`).

## Fast routing

| If the task is about… | Start at… |
|---|---|
| Product page/API behavior | [Application architecture](./02-application-architecture.md) then [Product domains](./03-product-domains.md) |
| DB, RLS, catalog/furniture persistence | [Data, API, and persistence](./04-data-api-persistence.md) |
| Test, check, script, CI, or generated tech docs | [Tooling, CI, and tech docs](./05-tooling-ci-tech-docs.md) |
| Deploy, Worker, R2, backup, incident | [Operations and infrastructure](./06-operations-infrastructure.md) |
| Docs, plan, policy, ownership, blocker | [Docs, governance, and planning](./07-docs-governance-planning.md) |
| Agent guidance, global skills, or commands | [Agent workspace](./08-agent-workspace.md) |
| Local environment or generated output | [Local, generated, and environment](./09-local-generated-environment.md) |

## Evidence-first map and task routing

Use this chapter for D01 Repository map and authority and D22 Unknown-area discovery. The first read is the root `./AGENTS.md` process floor; then apply the authority order `current user instruction → live code and fresh command output → ./AGENTS.md → ./Agents/ (INDEX.md plus handbooks 01–07) → ./docs/`, with `./plans/README.md` governing active coordination after those sources. The agent tooling layer is the user-global opencode skills `oando-repo-map`, `oando-testing`, `oando-focss-css`, `oando-databases`, and `oando-browser-ui` plus the `/gate`, `/boundaries`, and `/db-dry` commands. Do not treat a durable document, route name, directory, or skill name as self-validating.

### D01 — Map repository authority

- **Goal:** Map repository authority, exact candidate paths, and the next safe inspection action for an unfamiliar Repository Task.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./docs/architecture/stack.md`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./agents-work/oando-repository-guide/README.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./plans/README.md`.
- **Scope:** Authority order, exact paths, source/generated/private/legacy/absent/unverified classification, active planning, and Domain Index selection. Excludes product implementation, commands, and runtime-availability claims.
- **Evidence Steps:**
  1. Read the root `./AGENTS.md` process floor, then apply the authority order above.
  2. Inspect the listed paths and the nearest live owner for the requested outcome.
  3. Compare durable documentation and guide claims with live files; record contradictions instead of guessing.
  4. Classify each candidate area, risk, and Surface Status or Coverage-Gap state.
  5. Record the Route Record, selected/rejected skills, artifact and gate state, evidence limitation, and next decision before any modification.
- **Conditional Skills:** Select `oando-repo-map` for orientation or path discovery. Add `oando-databases` for schema/RLS/ownership evidence and `oando-focss-css` for styling/token evidence. Add `oando-testing` (or `/gate`) only when an exact protected check is explicitly authorized and hook-permitted this session; otherwise reject it as pending. Shared-code or blast-radius questions use Local Evidence. All other skills are rejected with their non-matching reason.
- **Allowed Actions:** Read-only mapping, Route Record creation, and explicitly owned edits to the guide workstream; a proposed edit must still pass the relevant path gate.
- **Forbidden Actions:** Guessing missing paths, treating documents as self-validating, changing `./docs/`, `./Agents/`, or direct root files, running commands by convention, or turning a path into a runtime claim.
- **Artifact / Workspace Boundary:** Authored guide work goes under `./agents-work/<workstream>/<report-type>/`; Machine Evidence under `./results/<purpose>/`; generated tech-docs under `./generated-documents/`; plan material under `./plans/<name>/`; a True Blocker only in `./Failures.md` with exact authorization. `./tech-docs-generator/` stays a root-level sibling of `./site/`; `./results/site/` is Machine Evidence, not a source-tree target.
- **Locked Path / Site Write Gates:** Direct root files, `./docs/**`, and `./Agents/**` are read-only evidence unless the Repository Owner names and authorizes the exact file in the current request; a substitute copy never proves a locked source changed. Map work has no Site Write permission: a `./site/` target requires an explicitly approved Core Product Write, and reports, prompts, plans, skills, generated files, and other Non-Core Artifacts are redirected.
- **Risk:** Documentation, authority, scope, and hidden-constraint risk.
- **Expected Evidence:** Exact first paths and reasons, authority order, candidate classification, selected/rejected skills, Route Record, artifact/gate decision, and a completion limitation when runtime proof is absent.
- **Surface Status / Coverage Gap:** Use only `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy`; cite the evidence source, owner, next action, and limitation. If ownership or end-to-end proof is unresolved, create a Coverage-Gap Admission rather than promoting the area to wired.
- **Evidence-Honest Response:** Distinguish observed static map facts from unrun commands, runtime loading, hosted or rendered behavior, and external capability availability. The next decision is a bounded card selection, not an implementation claim.
- **Next Decision:** Choose the next D02–D21 card, or route an unfamiliar topic through D22.

### D22 — Discover an unknown area safely

- **Goal:** Discover the canonical owner and bounded next action for an unfamiliar repository area without inventing a category or capability.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/README.md`; `./plans/README.md`; `./Agents/INDEX.md`; `./Failures.md`.
- **Scope:** Local Evidence inventory, authority comparison, candidate paths, risk, status, and proposed card/skill update. Excludes package, external-capability, route, and runtime implementation.
- **Evidence Steps:**
  1. Read authority sources in the required order and define any specialized term.
  2. Inspect the candidate paths and the nearest live source/configuration owner.
  3. Compare the guide and durable claims with live evidence; mark absent or contradictory claims.
  4. Classify `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy` and record operational risk.
  5. Record the gap, selected/rejected skills, artifact/gate state, owner action, and one next decision.
- **Conditional Skills:** Select `oando-repo-map` for discovery. Add `oando-databases` for schema evidence, or `oando-testing` only for an exact authorized and hook-permitted check. Otherwise select Local Evidence and record the no-match reason; do not infer an unavailable skill.
- **Allowed Actions:** Read-only discovery and a proposed Domain Index or skill-guidance update in an approved guide workstream.
- **Forbidden Actions:** Creating a package, external connection, route, or runtime implementation from guesswork; writing to a Locked Path; running an unapproved command; or claiming a missing area is wired.
- **Artifact / Workspace Boundary:** Authored discovery work uses `./agents-work/<workstream>/<report-type>/`; `./results/<purpose>/` only for command-generated evidence; `./generated-documents/` for tech-docs; `./Failures.md` only for an evidenced True Blocker with exact authorization. Never put a handwritten report at `./results/` root or `./agents-work/` root.
- **Locked Path / Site Write Gates:** Locked sources require exact current-request owner authorization; a read grant is not write/delete permission and a substitute copy is not proof. A discovery task cannot write `./site/`; a proposed product change needs its own Core Product Write approval, owned paths, matching skills, and expected evidence.
- **Risk:** Scope, hidden constraint, capability, authority, and overclaim risk.
- **Expected Evidence:** Evidence inventory, canonical owner, selected/rejected skills, a Coverage-Gap Admission when unresolved, and a single next decision.
- **Surface Status / Coverage Gap:** Keep the named area’s status separate from neighboring surfaces. A gap card must name the area, sources checked, limitation, next source, owner action, scope boundary, and next decision.
- **Evidence-Honest Response:** Report static discovery only; do not claim runtime loading, automatic routing, external access, command success, or hosted persistence without the corresponding observation.
- **Next Decision:** The Repository Owner approves a bounded guidance task, requests one exact diagnostic, or keeps the area pending.

## Locked and generated map boundaries

Every direct root file and every path under `./docs/` or `./Agents/` is a Locked Path and read-only evidence unless the Repository Owner names and authorizes the exact file in the current request; root-level `./*.md` files are included. `./agents-work/<workstream>/<report-type>/` is the home for authored work, `./results/<purpose>/` for command-generated Machine Evidence, `./generated-documents/` for tech-docs output, `./plans/<name>/` for active plan material, and root `./Failures.md` is the sole canonical True Blocker ledger. Do not create a substitute copy and claim a locked source changed.

Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; `./results/site/` is a result-purpose folder, not a source tree. Any proposed `./site/` write must pass the Site Write Gate as an explicitly approved Core Product Write, never a report, result, skill, prompt, plan, generated file, or other Non-Core Artifact.

## Begin Here output for map work

Return the Plain-Language Response Contract in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions. For an Output-Producing Task, also state Artifact Class, selected Workstream/Purpose Subfolder, filename pattern, owning source or script, authored/generated state, rejected placements, Locked Path Gate, and Site Write Gate state. For read-only map work, exact static paths and classifications are completion evidence; runtime, command, hosted, rendered, and external capability states remain unverified unless observed separately.


## D01/D22 map-card execution contract

This chapter is the evidence-oriented detail for **D01 — Repository map and authority** and the **D22 — Unknown-area discovery** fallback. It augments the guide index; it does not add a D23 category, create a runtime router, or promote a path into a wired capability. The first router remains the authority order beginning at the root [`./AGENTS.md`](../../../AGENTS.md), and the guide start page remains [`./agents-work/oando-repository-guide/README.md`](../README.md).

### Exact first evidence and current guide workstream

Begin with Local Evidence: read the exact paths below for the stated reason, then compare their claims with the live repository. Root process guidance, architecture documentation, and every other direct root file are read-only evidence under the Locked Path Gate; planning coordination comes from the plans index; the guide workstream is authored material in its agents-work subtree.

| Exact first evidence location | Why it is first | Static classification and limitation |
|---|---|---|
| `./START.md` | Establishes repository-root, `pnpm`, onboarding order, authority order, and the first durable references. | Root guidance evidence; static onboarding text does not prove installation, service, or route behavior. |
| `./AGENTS.md` | Establishes the process floor, repository layout, persistence boundaries, protected validation, and blocker rule. | Locked root evidence; not changed by map work unless the owner names it exactly. |
| `./docs/architecture/layout.md` | Maps top-level source, documentation, package, generated, local, and legacy roles. | Locked canonical documentation; live code and fresh authorized output win on mismatch. |
| `./docs/architecture/stack.md` | Grounds workspace, package, persistence, and configured-versus-observed technology claims. | Locked architecture evidence; declarations/imports do not prove runtime loading or builds. |
| `./docs/architecture/routes.md` | Supplies the static page/API inventory and records absent route families. | Locked route evidence; route-file presence does not prove loading, authorization, or browser behavior. |
| `./docs/architecture/product-map.md` | Maps product surfaces, source roots, fork boundaries, storage distinctions, and tech-docs placement. | Locked product-placement evidence; source pointers do not prove end-to-end or hosted behavior. |
| `./plans/README.md` | Identifies active-plan ownership and distinguishes plan evidence from durable docs and generated results. | Planning coordination evidence; authorizes no write. |
| `./agents-work/oando-repository-guide/README.md` | Beginner start page, D01–D22 index, card contract, response contract, and chapter navigation. | Human-authored guide surface; presence proves no runtime loading. |
| `./agents-work/oando-repository-guide/markdown/01-repository-map.md` | This chapter’s current map and the owned detail for D01/D22. | Human-authored chapter and the only write target for this leaf; read-back proves text/path state only. |

The live guide Markdown workstream contains these twelve authored paths; they are not product runtime files:

| Guide path | Navigation | Classification |
|---|---|---|
| `./agents-work/oando-repository-guide/README.md` | [Start page](../README.md) | Human-authored guide start page / source work surface. |
| `./agents-work/oando-repository-guide/markdown/01-repository-map.md` | This chapter | Human-authored D01/D22 chapter / current owned source work surface. |
| `./agents-work/oando-repository-guide/markdown/02-application-architecture.md` | [Application architecture](./02-application-architecture.md) | Human-authored chapter; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/03-product-domains.md` | [Product domains](./03-product-domains.md) | Human-authored chapter; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md` | [Data, API, and persistence](./04-data-api-persistence.md) | Human-authored chapter; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md` | [Tooling, CI, and tech docs](./05-tooling-ci-tech-docs.md) | Human-authored chapter; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md` | [Operations and infrastructure](./06-operations-infrastructure.md) | Human-authored chapter; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md` | [Docs, governance, and planning](./07-docs-governance-planning.md) | Human-authored chapter; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/08-agent-workspace.md` | [Agent workspace](./08-agent-workspace.md) | Human-authored chapter; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md` | [Local, generated, and environment](./09-local-generated-environment.md) | Human-authored chapter; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/10-quality-validation.md` | [Quality and validation](./10-quality-validation.md) | Human-authored chapter; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/11-agent-workflows.md` | [Agent workflows](./11-agent-workflows.md) | Human-authored chapter; not changed by this leaf. |

### Static path classification without overclaiming

Classification is about the observed repository location; it is not a substitute for the five Surface Status values below.

| Classification | Current examples | What the classification permits and does not prove |
|---|---|---|
| **Source / editable** | `./site/`, `./tests/`, `./scripts/`, `./config/`, `./workers/`, `./tech-docs-generator/`, `./i18n/`, and the authored guide workstream under `./agents-work/oando-repository-guide/`. | A candidate source owner for an explicitly scoped task; proves nothing is loaded or complete. A `./site/` target additionally requires the Site Write Gate. |
| **Generated** | `./generated-documents/`, `./results/<purpose>/`, `./site/.next/`, generated TypeScript/build-info artifacts, and `./node_modules/`. | Producer-owned output or local build state; regenerate rather than hand-edit. Not an editable source authority or proof of freshness. |
| **Private / local** | `./.env.local`, `./.env copy.local`, `./site/.env.local`, local editor/VCS state, and other credential-bearing files. | Read only for safe shape/classification, secrets withheld. Does not prove shared configuration, valid credentials, or hosted behavior. |
| **Legacy** | `./site/data/storage/`, retained archive/local tooling areas, and any path identified as historical by live authority evidence. | Migration or avoidance evidence only; do not add new production behavior or write runtime data there. |
| **Absent** | No root `./supabase/` directory, no root `./mcp/` directory, and no `./site/package.json`. | A bounded static fact for the inspected scope, not permission to create a replacement. Re-check when current evidence requires it. |
| **Present-but-unverified** | Route inventories, source directories, configuration files, user-global opencode skill/command configuration (outside this repository), and capability imports whose loading, rendering, hosted persistence, or external connection has not been observed. | Keep the claim pending; record the owner, limitation, next evidence source, and next decision. Never promote path presence to `wired`. |

A documentation claim that conflicts with live evidence is pending correction: route the task to the live source and record the contradiction; do not silently “fix” a locked authority document or create a substitute copy. Static reads establish path, text, link, ownership, and classification facts only — not runtime/loading, automatic routing or spawning, generator execution, rendered behavior, hosted persistence, connected external services, or universal enforcement.

### Begin Here Route Record for D01 and D22

The Begin Here Flow accepts one ordinary-language desired outcome. Paths, packages, skills, Workflow Mode, and commands are outputs of discovery, not prerequisites. Before any modification or output-path selection, publish this Route Record in plain language:

```text
Outcome: action verb + named repository domain or Product Surface
Domain / Domain Index card: D01 Repository map and authority, or D22 Unknown-area discovery fallback
Exact first evidence locations and reasons: exact ./ paths plus the reason for each read
Candidate paths: evidence-backed candidates only; no guessed path
Selected skills and trigger evidence: authority order from root AGENTS.md first; live global oando-repo-map for map/discovery; add every other evidenced match
Rejected skills and reasons: each non-match or unavailable skill and its plain-language reason
Workflow Mode: Vibe | Plan | Spec | Autopilot | Supervised
Operational-Risk Classification: documentation, scope, source, data, security, fork, release, external, or infrastructure risk as evidenced
Command Classification: each proposed command -> read-only inspection | Normal-Agent Eligible Check | Protected Command | no-run pending authorization
Artifact Class: when the task produces a report, guide, result, plan, blocker, or product source
Selected Workstream or Purpose Subfolder: exact approved destination when output is produced
Filename pattern: expected authored or generated name
Owning source or script / authored or generated: producer and state
Rejected placements: every invalid or unauthorized candidate home
Locked Path Gate state: Locked | explicitly owner-authorized | writable
Site Write Gate state: Core Product Write | Non-Core Artifact | not-applicable
Validation State: not-needed | eligible | pending-user-authorization | blocked-by-hook | observed-pass | observed-fail | not-run
Unavoidable Owner Decisions: only decisions Local Evidence cannot answer
Next action: one smallest bounded step
```

For D01 mapping, choose `Vibe` for narrow read-only orientation, `Plan` when ownership/artifact/validation sequencing is needed, or `Supervised` when a shared/protected path or owner checkpoint is involved; for D22, prefer `Plan` or `Supervised` for unfamiliar, high-risk, or external areas. A mode is guidance language, not a runtime switch.

**Routing baseline:** entry begins with the authority order starting at root `./AGENTS.md`, then the `Agents/` handbooks `01`–`07`, `./docs/`, and `./plans/`. The agent tooling layer is the user-global opencode skills (`oando-repo-map`, `oando-testing`, `oando-focss-css`, `oando-databases`, `oando-browser-ui`) plus the `/gate`, `/boundaries`, and `/db-dry` commands and permission guardrails, all outside the repository. Select a validation skill or command only after an exact current-session validation authorization and enabled Hook Permission are both observed per `AGENTS.md`; otherwise reject it with its non-matching or unavailable reason. When no skill matches, select Local Evidence and state the no-match reason. A selected skill name is static routing guidance, not proof of loading or activation.

**Command baseline:** static file reads and post-edit read-back are `read-only inspection`. Tests, gates, coverage, browser runners, builds, deployments, database actions, backups, local services, generators, package/install actions, and external calls are `Protected Command` or `no-run pending authorization` unless exact current-session Explicit User Authorization and Hook Permission are both present. A narrow type/lint/static check is a `Normal-Agent Eligible Check` only when the active policy and enabled hook name that exact command. If no command is authorized, say `no-run pending authorization` and perform only static reads.

### D01 — common Coverage-Audited Task Card

D01 keeps the common card shape used by the Domain Index:

- **Card ID and outcome:** `D01 — Map repository authority and the first safe inspection path`.
- **Goal:** Map repository authority, exact candidate paths, and the first safe inspection action for a Repository Task; “Surface Status” means an evidence label, and “End-to-End Evidence” means current proof across route/interface, behavior, data flow, and persistence or external boundary.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./docs/architecture/stack.md`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./agents-work/oando-repository-guide/README.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./plans/README.md`.
- **Scope:** Authority ordering, exact-path discovery, path classification, Domain Index selection, conditional skill routing, artifact/gate planning, and the next bounded decision. Excludes product implementation, runtime routing, package/database/deployment actions, and claims that a path is wired.
- **Evidence Steps, in order:** (1) read authority sources in authority order; (2) inspect every listed Start Path; (3) compare guide/durable claims with live evidence; (4) classify the path/surface and operational risk; (5) record evidence, gaps, the Route Record, and one Next Decision.
- **Allowed Actions:** Read-only mapping, exact-path inventory, Route Record creation, Coverage-Gap Admission recording, and an explicitly owner-authorized edit to the exact guide path owned by the current task; any other write or command needs its own route and authorization.
- **Forbidden Actions:** Guessing paths; treating a document, route name, skill name, schema, import, or directory as self-validating; changing locked authority files; writing a substitute copy; exposing secrets; expanding to a neighboring chapter; running a Protected Command without both permissions; or implementing Separate Approval Work.
- **Risk:** Documentation, authority, scope, path-ownership, artifact-placement, protected-path, and evidence-integrity risk; elevate to data, security, fork, release, external-system, or infrastructure risk when evidence introduces those boundaries.
- **Expected Evidence:** Exact first paths and reasons; candidate-path classifications; selected and rejected skills; Workflow Mode; command classifications; artifact/gate state; static read-back or exact authorized output; and explicit unverified/next-owner language where completion proof is absent.
- **Next Decision:** Select the next D02–D21 card, or use D22 when the outcome does not fit an existing card. The next decision is not permission to execute a command, create a package, or change a locked path.

### D22 — common Coverage-Audited Task Card and fallback

D22 is the existing **Unknown-area discovery** card, not a new category. Use it when an ordinary-language outcome does not fit D01–D21 or when the apparent canonical owner is unresolved.

- **Card ID and outcome:** `D22 — Discover an unknown or newly discovered repository area safely`.
- **Goal:** Discover the canonical owner, exact candidate path, evidence status, and bounded next action for an unfamiliar repository area without inventing a category, capability, package, external connection, route, or runtime implementation.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/README.md`; `./plans/README.md`; `./Agents/INDEX.md`; `./Failures.md`.
- **Scope:** Local Evidence inventory, authority comparison, candidate paths, classification, owner/risk/status selection, matching-skill routing, artifact/gate decision, and one proposed card or skill update. Excludes creating a new category, package, external connection, route, database, hook, policy, or runtime behavior from guesswork.
- **Evidence Steps, in order:** (1) read authority sources in authority order and define unfamiliar terms; (2) inspect the exact listed Start Paths; (3) compare documentation with live evidence and record contradictions; (4) classify status and operational risk; (5) record the Route Record, evidence limitation, Coverage-Gap Admission when needed, owner action, and Next Decision.
- **Allowed Actions:** Read-only discovery, canonical-owner identification, bounded status/gap recording, and a proposed update in an already approved guide workstream after exact owner authorization. Local Evidence is the default route when no skill trigger is evidenced.
- **Forbidden Actions:** Guessing or creating a path; treating a missing directory as permission to create it; declaring an unfamiliar area wired; selecting an external capability from a name alone; modifying `./docs/**`, `./Agents/**`, or a direct root file without exact authorization; running a command by convention; or turning a discovery result into Separate Approval Work implementation.
- **Risk:** Scope, authority, capability, security, external-system, artifact-placement, protected-path, and overclaim risk; record data, fork, release, or infrastructure risk when the evidence reaches those boundaries.
- **Expected Evidence:** Local Evidence inventory with exact sources and reasons; canonical owner and candidate paths; selected/rejected skills; Workflow Mode and command classifications; path labels; Surface Status or Coverage-Gap Admission; approved artifact destination; evidence limitation; and a single owner action/next decision.
- **Next Decision:** Choose an existing D01–D21 card, request one exact owner-approved diagnostic or write, or keep the area pending with a Coverage-Gap Admission. Do not add a new category until discovery evidence and a separately approved guide task establish the need.

### Surface Status and Coverage-Gap Admission

Surface Status is not a file classification. Use only these five values, with the exact evidence source, current owner, evidence limitation, next evidence source/action, and next decision:

| Status | Use |
|---|---|
| `wired` | Only current End-to-End Evidence proves the route/interface, relevant behavior, data flow, and required persistence or external boundary. A path, import, schema, screenshot, or plan alone cannot establish it. |
| `demo/local-only` | Local/browser/demo evidence exists without hosted or production proof; the CRM browser workspace remains this status when evidence is the `oando-crm-storage` browser/Zustand boundary. |
| `present-but-unverified` | A path, route, source, or described capability is present, but complete behavior or an external boundary is not proven. |
| `unwired/absent` | Current evidence does not establish a connected route/data flow or identifies the required surface as absent. |
| `legacy` | The path/surface is retained historical or legacy evidence and is not a current implementation target. |

When End-to-End Evidence is absent, add this Coverage-Gap Admission before describing an area as wired or complete:

```text
Coverage-Gap Admission Card
Named Area or Capability:
Status: wired | demo/local-only | present-but-unverified | unwired/absent | legacy
Evidence Sources Checked:
Evidence Limitation:
Next Evidence Source:
Owner Action:
Scope Boundary:
Next Decision:
```

A gap card is not a True Blocker and does not authorize implementation. Keep `./Failures.md` unchanged unless the Repository Owner names and authorizes that exact file; supporting authored analysis belongs only under `./agents-work/<workstream>/<report-type>/`. Update the status, evidence source, limitation, next action, and Route Record before any later `wired` claim.

### Locked Path Gate, artifact boundaries, and four-role guidance

Before any write, apply the Locked Path Gate: classify the exact target in the Route Record as `Locked`, explicitly owner-authorized, or `writable`. Treat `./docs/**`, `./Agents/**`, and every direct root file (including root-level `./*.md`) as read-only evidence unless the Repository Owner explicitly names and authorizes the exact file in the current request; a general task request is not authorization. If the exact locked file is not authorized, stop before writing, explain the file and reason, record the change as an unavoidable Owner Decision and Separate Approval Work, and place supporting analysis only in an approved `./agents-work/<workstream>/<report-type>/` folder; never write a copy elsewhere and claim the locked source was updated. `./agents-work/` is distinct from `./Agents/`. Keep `./Failures.md` unchanged until exact owner authorization exists and record pending owner action instead.

For an output-producing map task, record Artifact Class, exact destination, filename pattern, owning source or script, authored/generated state, rejected placements, and observed placement. Agent-authored work goes to `./agents-work/<workstream>/<report-type>/`, command evidence to `./results/<purpose>/`, tech-docs output to `./generated-documents/`, plan material to `./plans/<name>/`, and evidenced True Blockers only to `./Failures.md` after exact authorization. Keep `./tech-docs-generator/` a root-level sibling of `./site/`, keep `./generated-documents/` separate, and treat `./results/site/` as Machine Evidence, not the `./site/` source tree. Never put report or non-core work in `./site/`.

Any proposed `./site/` target must pass the Site Write Gate: an explicitly approved Core Product Write with an exact outcome, owned paths, matching skills, and expected evidence, or a Non-Core Artifact stopped and redirected to its approved non-site home. This chapter’s map work is not a product-source write and must not move any workspace boundary.

The four-role terminology is guidance for bounded ownership only: **Scout/Map** performs read-only orientation and evidence discovery; **Planner/Risk** plans scope, skills, risk, commands, artifacts, and validation; **Implementer** writes only after an exact exclusive path is approved; **Verifier/Reporter** reconciles evidence and reports. A `Coordinator/Serial Integration Owner` designation may attach to one slot but is not a fifth role; shared paths and terminology are serially integrated. These prose roles do not claim runtime four-agent creation, automatic spawning, or enforcement; such states remain `guidance-only` or `not-observed` until separately evidenced.

**Map completion proof:** the exact chapter path is read back after its owned edit; static path, text, link, classification, ownership, and scope evidence are recorded; unobserved runtime, loading, generation, rendering, hosting, external, command, and enforcement behavior remains explicitly unverified. The next action is one bounded D01/D22 decision, not an inferred implementation or command.

# 01 · Full repository map

[Start](./../README.md) · [Next: application architecture →](./02-application-architecture.md)

This is the exhaustive functional map. It includes all meaningful repository areas while intentionally excluding dependency contents and individual generated files. A listed path is a starting location, not proof that a capability is wired, loaded, hosted, or complete.

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
| `./.kiro/` | Workspace source / editable by separately scoped tasks | Skills, steering, hooks, specs, Agent definitions, Power/MCP schemas, and settings. Referenced files do not prove runtime loading. |
| `./docs/` | Canonical durable documentation | Architecture, database, and governance reference; live code wins on mismatch. Treat as Locked Path evidence. |
| `./plans/` | Active-work coordination | Requirements/design/tasks/plan evidence; use `./plans/README.md` for placement and authority. |
| `./Agents/` | Process handbook | Agent standard/testing/browser/failure/documentation/architecture/CSS procedures. Treat as Locked Path evidence. |
| `./agent-reports/` | Reference pointer | Agent-report conventions, not product source. |
| `./agents-work/` | Working material | Research/work products, including this guide; not application runtime authority. |
| `./ltm/` | Local Kiro memory state | Tool continuity support, not product source. |

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
| `./skills-lock.json` | Kiro skill lock/configuration state. |
| `./AGENTS.md` | Repository process floor; Locked Path evidence. |
| `./START.md`, `./README.md`, `./CONTENTS.md`, `./DOC-MAP.md` | Onboarding and documentation index/placement; direct root Markdown is Locked Path evidence. |
| `./OPERATIONS_RUNBOOK.md`, `./Testing-handbook.md` | Operations and test/validation procedures. |
| `./Failures.md` | Sole hard-blocker ledger. |
| `./HANDOVER.md`, `./owners.md` | Historical handoff and ownership context; verify against live code. |

## Areas that are not live source

- `./site/.next/`, `./site/next-env.d.ts`, `./site/tsconfig.tsbuildinfo`, and test/package build-info are local/generated.
- `./site/data/storage/` is legacy. Do not write runtime behavior there.
- A generic document may mention root `./supabase/` or `./mcp/`, but live repository evidence for this guide uses `./site/platform/supabase/` and `./.kiro/mcp/`; verify before relying on either claim.

## Fast routing

| If the task is about… | Start at… |
|---|---|
| Product page/API behavior | [Application architecture](./02-application-architecture.md) then [Product domains](./03-product-domains.md) |
| DB, RLS, catalog/furniture persistence | [Data, API, and persistence](./04-data-api-persistence.md) |
| Test, check, script, CI, or generated tech docs | [Tooling, CI, and tech docs](./05-tooling-ci-tech-docs.md) |
| Deploy, Worker, R2, backup, incident | [Operations and infrastructure](./06-operations-infrastructure.md) |
| Docs, plan, policy, ownership, blocker | [Docs, governance, and planning](./07-docs-governance-planning.md) |
| Kiro configuration or external-tool capability | [Kiro workspace](./08-kiro-workspace.md) |
| Local environment or generated output | [Local, generated, and environment](./09-local-generated-environment.md) |

## Evidence-first map and task routing

Use this chapter for D01 Repository map and authority and D22 Unknown-area discovery. The first read is `./.kiro/skills/oando-master/SKILL.md`; then apply the authority order `current user instruction → live code and fresh command output → ./AGENTS.md → ./Agents/ → ./docs/`, with `./plans/README.md` governing active coordination after those sources. Do not treat a durable document, route name, directory, or skill name as self-validating.

### D01 — Map repository authority

- **Goal:** Map repository authority, exact candidate paths, and the next safe inspection action for an unfamiliar Repository Task.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./docs/architecture/stack.md`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./agents-work/oando-repository-guide/README.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./plans/README.md`.
- **Scope:** Authority order, exact paths, source/generated/private/legacy/absent/unverified classification, active planning, and Domain Index selection. It excludes product implementation, commands, and claims of runtime availability.
- **Evidence Steps:**
  1. Read `./.kiro/skills/oando-master/SKILL.md` first, then apply the authority order above.
  2. Inspect the listed paths and the nearest live owner for the requested outcome.
  3. Compare durable documentation and guide claims with live files; record contradictions instead of guessing.
  4. Classify each candidate area, risk, and Surface Status or Coverage-Gap state.
  5. Record the Route Record, selected/rejected skills, artifact and gate state, evidence limitation, and next decision before any modification.
- **Conditional Skills:** Select `repo-map` for orientation or path discovery. Add `graph-impact` only when shared-code, dependency, blast-radius, or cycle evidence is present. Add `powers-skills-model` only when the task is actually about packaging a skill, Power, Agent, steering file, or MCP capability. Add `verify-and-gate` only when an exact protected check is explicitly authorized and hook-permitted; otherwise it is rejected as pending. All other skills are rejected with their non-matching reason.
- **Allowed Actions:** Read-only mapping, Route Record creation, and explicitly owned edits to the guide workstream. A proposed edit must still pass the relevant path gate.
- **Forbidden Actions:** Guessing missing paths, treating documents as self-validating, changing `./docs/`, `./Agents/`, direct root files, or `./.kiro/agents/**`, running commands by convention, or turning a path into a runtime claim.
- **Artifact / Workspace Boundary:** Agent-authored guide work belongs under `./agents-work/oando-repository-guide/` or `./agents-work/<workstream>/<report-type>/`; Machine Evidence belongs under `./results/<purpose>/`; generated tech-docs belong under `./generated-documents/`; active plan material belongs under `./plans/<name>/`; and a True Blocker belongs only in `./Failures.md` when the exact file is authorized. Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; `./results/site/` is Machine Evidence, not a source-tree relocation target.
- **Locked Path / Site Write Gates:** Treat every direct root file, every path under `./docs/`, every path under `./Agents/`, and every path under `./.kiro/agents/` as read-only evidence unless the Repository Owner names and authorizes the exact file in the current request. A substitute copy never proves a locked source changed. A map/report task has no Site Write permission; any proposed `./site/` target must first be classified as an explicitly approved Core Product Write, while reports, prompts, plans, skills, generated files, and other Non-Core Artifacts are redirected.
- **Risk:** Documentation, authority, scope, and hidden-constraint risk.
- **Expected Evidence:** Exact first paths and reasons, authority order, candidate classification, selected/rejected skills, Route Record, artifact/gate decision, and a completion limitation when runtime proof is absent.
- **Surface Status / Coverage Gap:** Use only `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy`; cite the evidence source, owner, next action, and limitation. If ownership or end-to-end proof is unresolved, create a Coverage-Gap Admission rather than promoting the area to wired.
- **Evidence-Honest Response:** The Plain-Language Response Contract must distinguish observed static map facts from unrun commands, runtime loading, hosted behavior, connected MCP, installed Powers, and rendered behavior. The next decision is a bounded card selection, not an implementation claim.
- **Next Decision:** Choose the next D02–D21 card, or route an unfamiliar topic through D22.

### D22 — Discover an unknown area safely

- **Goal:** Discover the canonical owner and bounded next action for an unfamiliar repository area without inventing a category or capability.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/README.md`; `./plans/README.md`; `./.kiro/skills/repo-map/SKILL.md`; `./Failures.md`.
- **Scope:** Local Evidence inventory, authority comparison, candidate paths, risk, status, and proposed card/skill update. It excludes package, Power, MCP, route, and runtime implementation.
- **Evidence Steps:**
  1. Read authority sources in the required order and define any specialized term.
  2. Inspect the candidate paths and the nearest live source/configuration owner.
  3. Compare the current guide and durable claims with live evidence; mark absent or contradictory claims.
  4. Classify `wired`, `demo/local-only`, `present-but-unverified`, `unwired/absent`, or `legacy` and record operational risk.
  5. Record the gap, selected/rejected skills, artifact/gate state, owner action, and one next decision.
- **Conditional Skills:** Select `repo-map` for discovery. Add `graph-impact` only if shared dependency evidence emerges. Add `powers-skills-model` only for a demonstrated capability-packaging question. Otherwise select Local Evidence and record the no-match reason; do not infer an unavailable skill or Power.
- **Allowed Actions:** Read-only discovery and a proposed Domain Index or Package Skill update in an approved guide workstream.
- **Forbidden Actions:** Creating a package, Power, MCP connection, route, or runtime implementation from guesswork; writing to a Locked Path; running an unapproved command; or claiming a missing area is wired.
- **Artifact / Workspace Boundary:** Use the approved `./agents-work/<workstream>/<report-type>/` home for authored discovery work, `./results/<purpose>/` only for command-generated evidence, `./generated-documents/` for generated tech-docs, and `./Failures.md` only for an evidenced True Blocker with exact authorization. Never put a handwritten report at `./results/` root or `./agents-work/` root.
- **Locked Path / Site Write Gates:** Locked sources require exact current-request owner authorization; a read grant is not write/delete permission and a substitute copy is not proof. A discovery task cannot write `./site/`; a proposed product change requires its own Core Product Write approval, owned paths, matching skills, and expected evidence.
- **Risk:** Scope, hidden constraint, capability, authority, and overclaim risk.
- **Expected Evidence:** Evidence inventory, canonical owner, selected/rejected skills, a Coverage-Gap Admission when unresolved, and a single next decision.
- **Surface Status / Coverage Gap:** Keep the named area’s status separate from neighboring surfaces. A gap card must name the area, sources checked, limitation, next source, owner action, scope boundary, and next decision.
- **Evidence-Honest Response:** Report static discovery only; do not claim runtime loading, automatic routing, external access, command success, or hosted persistence without the corresponding observation.
- **Next Decision:** The Repository Owner approves a bounded guidance task, requests one exact diagnostic, or keeps the area pending.

## Locked and generated map boundaries

Every file directly under `./`, every path under `./docs/`, every path under `./Agents/`, and every path under `./.kiro/agents/` is a Locked Path and read-only evidence unless the Repository Owner names and authorizes the exact file in the current request. Root-level `./*.md` files are included; the protected set is not limited to Markdown. `./agents-work/<workstream>/<report-type>/` is the home for authored work; `./results/<purpose>/` is the home for command-generated Machine Evidence; `./generated-documents/` is tech-docs output; `./plans/<name>/` is active plan material; and root `./Failures.md` is the sole canonical True Blocker ledger. Do not create a substitute copy and claim a locked source changed.

Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; `./results/site/` is a result-purpose folder, not a source tree. Any proposed `./site/` write must pass the Site Write Gate and be classified as an explicitly approved Core Product Write, never a report, result, skill, prompt, plan, generated file, or other Non-Core Artifact.

## Begin Here output for map work

Return the Plain-Language Response Contract in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions. For an Output-Producing Task, also state Artifact Class, selected Workstream/Purpose Subfolder, filename pattern, owning source or script, authored/generated state, rejected placements, Locked Path Gate, and Site Write Gate state. For read-only map work, exact static paths and classifications are completion evidence; runtime loading, command success, hosted behavior, rendered behavior, and external capability availability remain unverified unless observed separately.


## D01/D22 map-card execution contract

This chapter is the evidence-oriented detail for **D01 — Repository map and authority** and the **D22 — Unknown-area discovery** fallback. It augments the guide index; it does not add a D23 category, create a runtime router, or promote a path into a wired capability. The first router remains [`./.kiro/skills/oando-master/SKILL.md`](../../../audit/.kiro/skills/oando-master/SKILL.md), and the guide start page remains [`./agents-work/oando-repository-guide/README.md`](./../README.md).

### Exact first evidence and current guide workstream

Begin with Local Evidence: read the exact paths below for the stated reason, then compare their claims with the live repository paths available to the task. Root process guidance, architecture documentation, and every other direct root file are read-only evidence under the Locked Path Gate; active planning coordination comes from the plans index; the guide workstream is authored material in its dedicated agents-work subtree.

| Exact first evidence location | Why it is first | Static classification and limitation |
|---|---|---|
| `./START.md` | Establishes repository-root, `pnpm`, onboarding order, authority order, and the first durable references. | Root guidance evidence; static onboarding text does not prove installation, service, or route behavior. |
| `./AGENTS.md` | Establishes the process floor, repository layout, persistence boundaries, protected validation, and blocker rule. | Locked root evidence; the file is not changed by map work unless the owner names it exactly in a current request. |
| `./docs/architecture/layout.md` | Maps top-level source, documentation, package, generated, local, and legacy roles. | Locked canonical documentation; live code and fresh authorized output still win on mismatch. |
| `./docs/architecture/stack.md` | Grounds workspace, package, persistence, and configured-versus-observed technology claims. | Locked architecture evidence; declarations/imports do not prove runtime loading or successful builds. |
| `./docs/architecture/routes.md` | Supplies the static page/API inventory and explicitly records absent route families. | Locked route evidence; route-file presence does not prove loading, authorization, or browser behavior. |
| `./docs/architecture/product-map.md` | Maps product surfaces, source roots, fork boundaries, storage distinctions, and tech-docs placement. | Locked product-placement evidence; source pointers do not prove end-to-end or hosted behavior. |
| `./plans/README.md` | Identifies active-plan ownership and distinguishes plan evidence from durable docs and generated results. | Planning coordination evidence; it does not authorize a plan, report, result, or protected-path write. |
| `./agents-work/oando-repository-guide/README.md` | Provides the beginner start page, D01–D22 index, common card contract, response contract, and chapter navigation. | Human-authored guide work surface; its presence does not prove runtime loading or HTML parity. |
| `./agents-work/oando-repository-guide/markdown/01-repository-map.md` | Provides this chapter’s current map and the owned detail for D01/D22. | Human-authored chapter and the only write target for this leaf; read-back proves text/path state only. |

The live guide Markdown workstream currently contains these twelve authored paths; they are separate from the `.kiro` Markdown inventory and are not product runtime files:

| Guide path | Navigation | Classification |
|---|---|---|
| `./agents-work/oando-repository-guide/README.md` | [Start page](./../README.md) | Human-authored guide start page / source work surface. |
| `./agents-work/oando-repository-guide/markdown/01-repository-map.md` | This chapter | Human-authored D01/D22 chapter / current owned source work surface. |
| `./agents-work/oando-repository-guide/markdown/02-application-architecture.md` | [Application architecture](./02-application-architecture.md) | Human-authored chapter / source work surface; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/03-product-domains.md` | [Product domains](./03-product-domains.md) | Human-authored chapter / source work surface; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md` | [Data, API, and persistence](./04-data-api-persistence.md) | Human-authored chapter / source work surface; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md` | [Tooling, CI, and tech docs](./05-tooling-ci-tech-docs.md) | Human-authored chapter / source work surface; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md` | [Operations and infrastructure](./06-operations-infrastructure.md) | Human-authored chapter / source work surface; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md` | [Docs, governance, and planning](./07-docs-governance-planning.md) | Human-authored chapter / source work surface; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md` | [Kiro workspace](./08-kiro-workspace.md) | Human-authored chapter / source work surface; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md` | [Local, generated, and environment](./09-local-generated-environment.md) | Human-authored chapter / source work surface; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/10-quality-validation.md` | [Quality and validation](./10-quality-validation.md) | Human-authored chapter / source work surface; not changed by this leaf. |
| `./agents-work/oando-repository-guide/markdown/11-working-with-kiro.md` | [Working with Kiro](./11-working-with-kiro.md) | Human-authored chapter / source work surface; not changed by this leaf. |

The matching HTML projection remains conditional until its Markdown-to-HTML provenance is evidenced. The current conditional paths are `./agents-work/oando-repository-guide/html/index.html`, `./agents-work/oando-repository-guide/html/repository-map.html`, `./agents-work/oando-repository-guide/html/application-architecture.html`, `./agents-work/oando-repository-guide/html/product-domains.html`, `./agents-work/oando-repository-guide/html/data-api-persistence.html`, `./agents-work/oando-repository-guide/html/tooling-ci-tech-docs.html`, `./agents-work/oando-repository-guide/html/docs-governance-planning.html`, `./agents-work/oando-repository-guide/html/kiro-workspace.html`, `./agents-work/oando-repository-guide/html/local-generated-environment.html`, `./agents-work/oando-repository-guide/html/quality-and-validation.html`, `./agents-work/oando-repository-guide/html/working-with-kiro.html`, and `./agents-work/oando-repository-guide/html/guide.css`. Filename pairing, links, or content similarity do not establish an authoring source, deterministic generator, freshness, or rendered parity. Do not modify those projection paths as part of D01/D22 map work without a separate provenance decision and exact authorization.

### Static path classification without overclaiming

Use the following classifications before choosing a path or describing a capability. Classification is about the observed repository location; it is not a substitute for the five Surface Status values below.

| Classification | Current examples | What the classification permits and does not prove |
|---|---|---|
| **Source / editable** | `./site/`, `./tests/`, `./scripts/`, `./config/`, `./workers/`, `./tech-docs-generator/`, `./i18n/`, and the authored guide workstream under `./agents-work/oando-repository-guide/`. | A candidate source owner for an explicitly scoped task. It does not prove that a route, package, generator, or capability is loaded or complete. A `./site/` target additionally requires the Site Write Gate. |
| **Generated** | `./generated-documents/`, `./results/<purpose>/`, `./site/.next/`, generated TypeScript/build-info artifacts, and `./node_modules/`. | Producer-owned output or local build state; regenerate from the owning source/script rather than hand-editing. A generated path is not an editable source authority or proof of freshness. |
| **Private / local** | `./.env.local`, `./.env copy.local`, `./site/.env.local`, local editor/VCS state, and other credential-bearing or machine-specific files. | Read only for safe shape/classification, with secret values withheld. Private presence does not prove shared configuration, valid credentials, or hosted behavior. |
| **Legacy** | `./site/data/storage/`, retained archive/local tooling areas, and any path explicitly identified as retired or historical by live authority evidence. | Evidence for migration or avoidance decisions only; do not add new production behavior or write runtime data there. |
| **Absent** | The live map records no root `./supabase/` directory, no root `./mcp/` directory, no `./site/package.json`, and no `./.kiro/skills/ai-retrieval/SKILL.md` in the current skill baseline. | A missing path is a bounded static fact for the inspected scope, not permission to create a replacement. Re-check the exact path when current evidence or an owner-approved task requires it. |
| **Present-but-unverified** | Route inventories, source directories, configuration files, guide projections, `.kiro` schemas/settings, and capability imports whose loading, generation, rendering, hosted persistence, or external connection has not been observed. | Keep the claim pending; record the owner, limitation, next evidence source, and next decision. Never promote path presence to `wired`. |

A documentation claim that conflicts with live evidence is pending correction: route the task to the live source, record the contradiction, and do not silently “fix” a locked authority document or create a substitute copy. Static reads can establish path, text, link, ownership, and classification facts only. They cannot establish runtime/loading, automatic routing or spawning, generator execution, rendered behavior, hosted persistence, connected MCP, installed Power state, or universal enforcement.

### Begin Here Route Record for D01 and D22

The Begin Here Flow accepts one ordinary-language desired outcome. It makes paths, packages, skills, Workflow Mode, and commands outputs of discovery rather than prerequisites. Before any modification or output-path selection, publish this Route Record in plain language:

```text
Outcome: action verb + named repository domain or Product Surface
Domain / Domain Index card: D01 Repository map and authority, or D22 Unknown-area discovery fallback
Exact first evidence locations and reasons: exact ./ paths plus the reason for each read
Candidate paths: evidence-backed candidates only; no guessed path
Selected Package Skills and trigger evidence: oando-master first; repo-map for map/discovery; add every other evidenced match
Rejected Package Skills and reasons: each non-match or unavailable skill and its plain-language reason
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

For ordinary D01 mapping, choose `Vibe` for narrow read-only orientation, `Plan` when ownership/artifact/validation sequencing is needed, or `Supervised` when a shared/protected path or owner checkpoint is involved. For D22, choose `Plan` or `Supervised` when the area is unfamiliar, high-risk, external, or likely to require a new artifact; do not ask the contributor to supply a mode before discovery. A mode is guidance language, not a runtime switch.

**Routing baseline:** `oando-master` is always read first. Select `repo-map` for D01 and D22 orientation/path discovery. Add `graph-impact` only when the evidence demonstrates shared code, dependency, blast-radius, or cycle analysis. Add `powers-skills-model` only when the unfamiliar area is actually a repository-local skill, steering, Agent, Power, MCP, or capability-packaging question. Select `verify-and-gate` only after an exact current-session validation authorization and Hook Permission are both observed. Select `db-migrations`, `focss-css`, `fork-boundaries`, `planner-studio`, or a future `ai-retrieval` skill only when their documented triggers are evidenced; otherwise reject each with its non-matching or unavailable reason. When no domain skill matches, select Local Evidence and state the no-match reason. A selected skill name is static routing guidance, not proof of loading or activation.

**Command baseline:** static file reads and post-edit read-back are `read-only inspection`. Tests, gates, coverage, browser runners, builds, deployments, database actions, backups, local services, generators, package/install actions, and external calls are `Protected Command` or `no-run pending authorization` unless exact current-session Explicit User Authorization and Hook Permission are both present. A narrow type/lint/static check is a `Normal-Agent Eligible Check` only when the active policy and enabled hook name that exact command. Do not infer permission from an inline marker, a task name, or a prose rule. If no command is authorized, say `no-run pending authorization` and perform only static reads.

### D01 — common Coverage-Audited Task Card

D01 keeps the common card shape used by the Domain Index:

- **Card ID and outcome:** `D01 — Map repository authority and the first safe inspection path`.
- **Goal:** Map repository authority, exact candidate paths, and the first safe inspection action for a Repository Task; “Surface Status” means an evidence label, and “End-to-End Evidence” means current proof across route/interface, behavior, data flow, and persistence or external boundary.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./docs/architecture/stack.md`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./agents-work/oando-repository-guide/README.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./plans/README.md`.
- **Scope:** Authority ordering, exact-path discovery, source/generated/private/legacy/absent/unverified classification, Domain Index selection, conditional skill routing, artifact/gate planning, and the next bounded decision. It excludes product implementation, runtime routing, package/database/deployment actions, and claims that a path is wired.
- **Evidence Steps, in order:** (1) read authority sources in authority order; (2) inspect every listed Start Path; (3) compare guide/durable claims with live repository evidence; (4) classify the path/surface and operational risk; (5) record evidence, gaps, the Route Record, and one Next Decision.
- **Allowed Actions:** Read-only mapping, exact-path inventory, Route Record creation, Coverage-Gap Admission recording, and an explicitly owner-authorized edit to the exact guide path owned by the current task. Any other write or command needs its own route and authorization.
- **Forbidden Actions:** Guessing paths; treating a document, route name, skill name, schema, import, or directory as self-validating; changing locked authority files; writing a substitute copy; exposing secrets; expanding to a neighboring chapter; running a Protected Command without both permissions; or implementing Separate Approval Work.
- **Risk:** Documentation, authority, scope, path-ownership, artifact-placement, protected-path, and evidence-integrity risk; elevate to data, security, fork, release, external-system, or infrastructure risk when evidence introduces those boundaries.
- **Expected Evidence:** Exact first paths and reasons; candidate-path classifications; selected and rejected skills; Workflow Mode; command classifications; artifact/gate state; static read-back or exact authorized output; and explicit unverified/next-owner language where completion proof is absent.
- **Next Decision:** Select the next D02–D21 Domain Index card, or use D22 when the desired outcome does not fit an existing card. The next decision is not permission to execute a command, create a package, or change a locked path.

### D22 — common Coverage-Audited Task Card and fallback

D22 is the existing **Unknown-area discovery** card, not a new category. Use it when an ordinary-language outcome does not fit D01–D21 or when the apparent canonical owner is unresolved.

- **Card ID and outcome:** `D22 — Discover an unknown or newly discovered repository area safely`.
- **Goal:** Discover the canonical owner, exact candidate path, evidence status, and bounded next action for an unfamiliar repository area without inventing a category, capability, package, Power, MCP connection, route, or runtime implementation.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/README.md`; `./plans/README.md`; `./.kiro/skills/repo-map/SKILL.md`; `./Failures.md`.
- **Scope:** Local Evidence inventory, authority comparison, candidate paths, source/generated/private/legacy/absent/unverified classification, owner/risk/status selection, matching-skill routing, artifact/gate decision, and one proposed card or skill update. It excludes creating a new category, package, Power, MCP configuration/connection, route, database, hook, policy, or runtime behavior from guesswork.
- **Evidence Steps, in order:** (1) read authority sources in authority order and define unfamiliar terms; (2) inspect the exact listed Start Paths; (3) compare documentation with live evidence and record contradictions; (4) classify status and operational risk; (5) record the Route Record, evidence limitation, Coverage-Gap Admission when needed, owner action, and Next Decision.
- **Allowed Actions:** Read-only discovery, canonical-owner identification, bounded status/gap recording, and a proposed update in an already approved guide workstream after exact owner authorization. Local Evidence is the default route when no Package Skill trigger is evidenced.
- **Forbidden Actions:** Guessing or creating a path; treating a missing directory as permission to create it; declaring an unfamiliar area wired; selecting a Power or MCP from a name alone; modifying `./docs/**`, `./Agents/**`, a direct root file, or `./.kiro/agents/**` without exact authorization; running a command by convention; or turning a discovery result into Separate Approval Work implementation.
- **Risk:** Scope, authority, capability, security, external-system, artifact-placement, protected-path, and overclaim risk; record data, fork, release, or infrastructure risk when the evidence reaches those boundaries.
- **Expected Evidence:** Local Evidence inventory with exact sources and reasons; canonical owner and candidate paths; selected/rejected skills; Workflow Mode and command classifications; source/generated/private/legacy/absent/unverified labels; Surface Status or Coverage-Gap Admission; approved artifact destination; evidence limitation; and a single owner action/next decision.
- **Next Decision:** Choose an existing D01–D21 card, request one exact owner-approved diagnostic or write, or keep the area pending with a Coverage-Gap Admission. Do not add a new D01–D22 category until this discovery evidence and a separately approved guide task establish the need.

### Surface Status and Coverage-Gap Admission

Surface Status is not a file classification. Use only these five values, with the exact evidence source, current owner, evidence limitation, next evidence source/action, and next decision:

| Status | Use |
|---|---|
| `wired` | Only current End-to-End Evidence proves the route/interface, relevant behavior, data flow, and required persistence or external boundary. A path, import, schema, screenshot, or plan alone cannot establish it. |
| `demo/local-only` | Local/browser/demo evidence exists without hosted or production proof; the CRM browser workspace remains this status when evidence is the `oando-crm-storage` browser/Zustand boundary. |
| `present-but-unverified` | A path, route, source, or described capability is present, but complete behavior or an external boundary is not proven. |
| `unwired/absent` | Current evidence does not establish a connected route/data flow or identifies the required surface as absent. |
| `legacy` | The path/surface is retained historical, retired, or legacy evidence and is not a current implementation target. |

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

Before any write, apply the Locked Path Gate: classify the exact target in the Route Record as `Locked`, explicitly owner-authorized, or `writable`. Treat `./docs/**`, `./Agents/**`, every direct root file (including root-level `./*.md`), and `./.kiro/agents/**` as read-only evidence unless the Repository Owner explicitly names and authorizes the exact file in the current request; do not treat a general task request as authorization. If the exact locked file is not authorized, stop before writing, explain the exact file and reason, record the change as an unavoidable Owner Decision and Separate Approval Work, and place supporting analysis only in an approved `./agents-work/<workstream>/<report-type>/` folder. Do not create a copy elsewhere and claim that the locked source was updated. `./agents-work/` is distinct from `./Agents/`, and `./.kiro/` remains governed by the current spec and Site Write Gate. For `./Failures.md`, keep the canonical ledger unchanged until exact owner authorization exists and record pending owner action instead.

For an output-producing map task, record Artifact Class, exact destination, filename pattern, owning source or script, authored/generated state, rejected placements, and observed placement. Use `./agents-work/<workstream>/<report-type>/` for an agent-authored report or guide work product; `./results/<purpose>/` for command-generated Machine Evidence; `./generated-documents/` for output produced by `./tech-docs-generator/`; `./plans/<name>/` for active plan material; and `./Failures.md` only for an evidenced True Blocker after exact authorization. Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; keep `./generated-documents/` separate; and keep `./results/site/` as Machine Evidence, not the `./site/` source tree. If it is written by an agent, use agents-work subfolders; if it is produced by a script/command, use results subfolders; if it is product source, use its approved source tree; never put report/skill/non-core work in site.

Any proposed `./site/` target must pass the Site Write Gate before selection: classify it as an explicitly approved Core Product Write with an exact outcome, owned paths, matching skills, and expected evidence, or as a Non-Core Artifact that must be stopped and redirected to its approved non-site home. This chapter’s map work is not a product-source write. Do not move or copy `./tech-docs-generator/`, `./generated-documents/`, `./results/site/`, or any other workspace boundary as a consequence of a map task.

The four-role terminology is guidance for bounded ownership only: **Scout/Map** performs read-only orientation and evidence discovery; **Planner/Risk** performs read-only scope, skill, risk, command, artifact, and validation planning; **Implementer** writes only after an exact exclusive path is approved; and **Verifier/Reporter** performs read-only evidence reconciliation and handoff reporting. A `Coordinator/Serial Integration Owner` designation may attach to one of these slots, but it is not a fifth role. Shared paths and shared terminology are serially integrated. These prose roles do not claim runtime four-agent creation, automatic spawning, universal enforcement, or command-hook coverage; those states remain `guidance-only` or `not-observed` until separately evidenced.

**Map completion proof:** the exact chapter path is read back after its owned edit; static path, text, link, classification, ownership, and scope evidence are recorded; unobserved runtime, loading, generation, rendering, hosting, external, command, Power/MCP, and enforcement behavior remains explicitly unverified. The next action is one bounded D01/D22 decision, not an inferred implementation or command.
# 01 · Full repository map

[Start](../README.md) · [Next: application architecture →](./02-application-architecture.md)

This is the exhaustive functional map. It includes all meaningful repository areas while intentionally excluding dependency contents and individual generated files.

## Product and source areas

| Area | Status | Role |
|---|---|---|
| `site/` | Source / editable | Main Next.js product: UI, API, security edge, platform adapters, styles, assets, i18n, observability. |
| `tests/` | Source / editable | Vitest, Testing Library, Playwright, fixtures/helpers, and the tech-docs test lane. |
| `scripts/` | Source / editable, sometimes operational | Checks, audits, migrations, seeds, backup/R2, catalog assets, generators, codemods, and command dispatch. |
| `config/` | Source / editable | Build/test harness, governance baselines, and local observability configuration. |
| `workers/` | Source / editable | Cloudflare Worker source, separate from the Vercel application deploy. |
| `tech-docs-generator/` | Source / editable | Separate Vite inventory SPA and source-to-documentation generator. |
| `i18n/` | Source / editable | Root next-intl resolver shim; real messages/config are in `site/i18n/`. |

## Delivery, governance, and coordination areas

| Area | Status | Role |
|---|---|---|
| `.github/` | Source / editable | CI workflows, scoped instructions, Dependabot configuration. |
| `.kiro/` | Workspace source / editable | Skills, steering, hooks, specs, agent definitions, power/MCP schemas, settings. |
| `docs/` | Canonical durable documentation | Architecture, database, and governance reference; live code wins on mismatch. |
| `plans/` | Active-work coordination | Requirements/design/tasks/plan evidence. The live tree currently has `PLAN.md` and `README.md`; no named active plan folder was found. |
| `Agents/` | Process handbook | Agent standard/testing/browser/failure/documentation/architecture/CSS procedures. |
| `agent-reports/` | Reference pointer | Agent-report conventions, not product source. |
| `agents-work/` | Working material | Research/work products, including this guide; not application runtime authority. |
| `ltm/` | Local Kiro memory state | Tool continuity support, not product source. |

## Output, local, and private areas

| Area | Status | Role |
|---|---|---|
| `generated-documents/` | Generated / disposable | Tech-docs generator output: data, rendered docs, static site. Regenerate rather than patch. |
| `results/` | Generated evidence | Command/test/report output. Never place handwritten plans/audits here. |
| `node_modules/` | Local generated | Installed dependencies. Never hand-edit. |
| `.git/` | Local VCS state | Git metadata only. |
| `.vscode/` | Editor configuration | VS Code workspace settings/tasks. |
| `.env.local`, `.env copy.local` | Local/private | Credentials and local runtime configuration; never commit. |
| `.env.example` | Editable template | Non-secret environment shape/documentation. |

## Root control files

| File or group | Owns |
|---|---|
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json` | Package ownership, scripts, workspace, package-manager lock, task runner. |
| `vercel.json`, `.vercelignore` | Vercel build/deploy behavior. |
| `.oxlintrc.json`, `.gitignore` | Lint/ignore policy. |
| `.postman.json` | API collection. |
| `skills-lock.json` | Kiro skill lock/configuration state. |
| `AGENTS.md` | Repository process floor. |
| `START.md`, `README.md`, `CONTENTS.md`, `DOC-MAP.md` | Onboarding and documentation index/placement. |
| `OPERATIONS_RUNBOOK.md`, `Testing-handbook.md` | Operations and test/validation procedures. |
| `Failures.md` | Sole hard-blocker ledger. |
| `HANDOVER.md`, `owners.md` | Historical handoff and ownership context; verify against live code. |

## Areas that are not live source

- `site/.next/`, `site/next-env.d.ts`, `site/tsconfig.tsbuildinfo`, and test/package build-info are local/generated.
- `site/data/storage/` is legacy. Do not write runtime behavior there.
- A generic doc may mention root `supabase/` or root `mcp/`, but neither exists in the live tree. Use `site/platform/supabase/` and `.kiro/mcp/`.

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

Use this chapter for D01 Repository map and authority and D22 Unknown-area discovery. The first read is `.kiro/skills/oando-master/SKILL.md`; then apply the authority order `current user instruction → live code and fresh command output → AGENTS.md → Agents/ → docs/`, with `plans/README.md` governing active coordination after those sources. A path is a starting location, not proof that a capability is wired.

### D01 coverage-audited task card

- **Goal:** Map repository authority, exact candidate paths, and the next safe repository action.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./docs/architecture/stack.md`; `./docs/architecture/routes.md`; `./docs/architecture/product-map.md`; `./agents-work/oando-repository-guide/README.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./plans/README.md`.
- **Scope:** Root layout, authority, status categories, active planning, and route selection.
- **Evidence Steps:** Read authority; inspect listed paths; compare claims to live evidence; classify risk/status; record Route Record and next decision.
- **Allowed Actions:** Read-only orientation and bounded edits to owned guide files.
- **Forbidden Actions:** Guessing missing paths, treating docs as self-validating, changing protected authority files, or running commands.
- **Risk:** Documentation and scope risk.
- **Expected Evidence:** Exact first paths, authority order, selected/rejected skills, and a completion limitation if no runtime proof exists.
- **Next Decision:** Select a D02–D21 card or route the unfamiliar topic through D22.

### D22 unknown-area discovery card

- **Goal:** Discover the canonical owner for an unfamiliar repository area without inventing a new category or capability.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./docs/architecture/layout.md`; `./agents-work/oando-repository-guide/markdown/01-repository-map.md`; `./agents-work/oando-repository-guide/README.md`; `./plans/README.md`; `./.kiro/skills/repo-map/SKILL.md`; `./Failures.md`.
- **Scope:** Local Evidence inventory, authority comparison, candidate paths, risk, and proposed card/skill update.
- **Evidence Steps:** Read authority; inspect candidate locations; compare durable claims with live files; classify `wired`, `present-but-unverified`, `unwired/absent`, `demo/local-only`, or `legacy`; record the gap and next owner action.
- **Allowed Actions:** Read-only discovery and a proposed Domain Index or Package Skill update.
- **Forbidden Actions:** Creating a package, Power, MCP, route, or runtime implementation from guesswork; writing to locked paths.
- **Risk:** Scope, hidden constraint, capability, and authority risk.
- **Expected Evidence:** Evidence inventory, canonical owner, selected/rejected skills, Coverage-Gap Admission Card when unresolved, and one next decision.
- **Next Decision:** Owner approves a bounded guidance task or keeps the area pending.

### Locked and generated map boundaries

Every file directly under `./`, every path under `./docs/`, every path under `./Agents/`, and every path under `./.kiro/agents/` is a Locked Path and read-only evidence unless the Repository Owner names and authorizes the exact file in the current request. Root-level `./*.md` files are included; the protected set is not limited to Markdown. `./.kiro/agents/` remains protected read-only evidence. `./agents-work/<workstream>/<report-type>/` is the home for authored work; `./results/<purpose>/` is the home for command-generated Machine Evidence; `./generated-documents/` is tech-docs output; `./plans/<name>/` is active plan material; and root `./Failures.md` is the sole canonical True Blocker ledger. Do not create a substitute copy and claim a locked source changed.

Keep `./tech-docs-generator/` as a root-level sibling of `./site/`; `./results/site/` is a result-purpose folder, not a source tree. Any proposed `./site/` write must pass the Site Write Gate and be classified as an explicitly approved Core Product Write, never a report, result, skill, prompt, plan, generated file, or other Non-Core Artifact.

### Begin Here output for map work

Return the Plain-Language Response Contract in this order: Outcome; Known; Unverified; Exact First Evidence Locations; Selected Skills; Rejected Skills and Reasons; Numbered Next Actions; Likely Files or Areas; Risk; Allowed Checks; Protected or Pending Checks; Exact Completion Proof; Unavoidable Owner Decisions. For read-only map work, exact static paths and classifications are completion evidence; runtime loading, command success, hosted behavior, and external capability availability remain unverified unless observed separately.

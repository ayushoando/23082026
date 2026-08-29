# 09 · Local, generated, and environment areas

[← Kiro workspace](08-kiro-workspace.md) · [Next: quality and validation →](./10-quality-validation.md)

These paths matter to development but are not normal product feature source.

## Environment and secrets

| Path | Status | Rule |
|---|---|---|
| `.env.example` | Editable template | Documents non-secret environment shape. |
| `.env.local`, `.env copy.local` | Local/private | Credentials/runtime configuration; never commit or expose. |
| `site/.env.local` | Local/private | Next-specific local configuration when required. |

## Generated/evidence output

| Path | Status | Rule |
|---|---|---|
| `generated-documents/data/` | Generated | Structured tech-docs inventory data. Regenerate. |
| `generated-documents/docs/` | Generated | Rendered docs output. Regenerate. |
| `generated-documents/site/` | Generated | Built tech-docs static site. Regenerate. |
| `results/` | Generated evidence | Command/test result output. Never hand-write plans/audits here. |
| `site/.next/` | Local/generated | Next build/cache output. Never edit as source. |
| `site/next-env.d.ts`, `*.tsbuildinfo` | Generated/local | Tooling artifacts. |

## Local tool/editor/VCS state

| Path | Status | Role |
|---|---|---|
| `node_modules/` | Local/package-manager output | Installed dependencies. Do not edit. |
| `.git/` | Local VCS | Git metadata. |
| `.vscode/` | Editor configuration | VS Code workspace behavior. |
| `ltm/` | Local Kiro tooling state | Agent continuity/memory, not product code. |
| `agent-reports/` | Reference pointer | Agent-report guidance area. |
| `agents-work/` | Working material | Research/work products; includes this guide. |

## Legacy and absent areas

- `site/data/storage/` is legacy. Do not add runtime writes there.
- The live repository has no root `supabase/` directory; use `site/platform/supabase/`.
- The live repository has no root `mcp/` directory; use `.kiro/mcp/`.
- Documentation may refer to archival/local directories that are absent; live filesystem takes precedence.

## Safe request

```text
Classify [path] as source of truth, generated, local/private, legacy, or archival.
Explain whether it is safe to edit, how it is regenerated, and what current source
should be changed instead. Do not modify it yet.
```

Next: [Quality and validation](./10-quality-validation.md).


## Coverage-audited local and output cards

### D02 — Initialization, local development, and debugging

- **Goal:** Map local setup and debugging facts without starting a service or changing private configuration by assumption.
- **Start Paths:** `./START.md`; `./AGENTS.md`; `./package.json`; `./site/`; `./config/build/`; `./Failures.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Root `pnpm` boundary, environment status, local/generated areas, and reported symptoms.
- **Evidence Steps:** Read authority; inspect exact paths; compare command/config claims; classify environment/secret/service risk; record pending owner actions.
- **Allowed Actions:** Read-only inventory and owned guide edits.
- **Forbidden Actions:** Install, dev server, build, test, typecheck, sync, or changing environment files without exact authorization.
- **Risk:** Secret, environment, service, and local-state risk.
- **Expected Evidence:** Status-labelled map with private values excluded and no unobserved command result.
- **Next Decision:** Request one exact owner-approved diagnostic if read-only evidence is insufficient.

### D04 — Environment

- **Goal:** Classify configured environment shape separately from private local values.
- **Start Paths:** `./.env.example`; `./.env.local`; `./site/.env.local`; `./package.json`; `./pnpm-workspace.yaml`; `./START.md`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Non-secret template, private runtime config, workspace boundaries, and local-only limitations.
- **Evidence Steps:** Read authority; inspect only permitted metadata; compare environment references; classify secret risk; record status and next decision.
- **Allowed Actions:** Read-only classification; keep local values private.
- **Forbidden Actions:** Printing, copying, syncing, committing, or modifying secrets.
- **Risk:** Credentials, environment, and deployment risk.
- **Expected Evidence:** Redacted status map and explicit unverified values/behaviors.
- **Next Decision:** Separate environment/service work requires owner approval.

### D19 — Results, generated documents, agent work, and blocker placement

- **Goal:** Direct each artifact to its producer-owned destination and preserve evidence integrity.
- **Start Paths:** `./results/`; `./results/tests/`; `./results/site/`; `./results/site-ui/`; `./results/ops/`; `./generated-documents/`; `./agents-work/`; `./plans/`; `./plans/README.md`; `./Failures.md`; `./agent-reports/`; `./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md`.
- **Scope:** Authored versus generated output, Machine Evidence, active plans, legacy root artifacts, and canonical blockers.
- **Evidence Steps:** Read placement authorities; inspect proposed path; compare producer/destination; classify evidence risk; record Route/Completion artifact fields and next decision.
- **Allowed Actions:** Read-only classification and approved guide edits.
- **Forbidden Actions:** Handwritten reports in `./results/`, new reports in the `./agents-work/` root, hand-editing generated output, or duplicate blocker ledgers.
- **Risk:** Reproducibility, evidence integrity, and discoverability.
- **Expected Evidence:** Artifact Class, exact subfolder, filename pattern, owner/source, authored/generated state, rejected placements, and observed placement.
- **Next Decision:** Select a Workstream/Purpose Subfolder before any Output-Producing Task write.

## Artifact class and workspace boundary record

Before an Output-Producing Task writes, its Route Record names the Artifact Class, exact Workstream Subfolder or Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state. The Completion Record repeats those fields with observed placement evidence; a placement decision is not evidence that anything was moved.

| Artifact Class | Approved destination and producer | Rejected destination or boundary |
|---|---|---|
| Agent Work Report | `./agents-work/<workstream>/<report-type>/` or an approved guide workstream; authored by an agent | `./agents-work/` root, `./results/`, or `./site/` |
| Machine Evidence | `./results/<purpose>/`; produced by the owning command or script | `./results/` root, `./agents-work/`, or `./site/`; do not hand-edit generated evidence |
| Generated Tech-Docs Output | `./generated-documents/`; produced by `./tech-docs-generator/` | `./results/`, `./agents-work/`, or `./site/` |
| Active Plan | `./plans/<name>/` indexed by `./plans/README.md`; authored plan material | `./results/`, `./site/`, or an unowned root location |
| True Blocker | Root `./Failures.md`; supporting authored analysis may use an approved workstream | Duplicate blocker ledgers in `./results/`, `./agents-work/`, or `./site/` |
| Core Product Write | Explicitly approved product source, including `./site/` only after its Site Write Gate | `./site/` for reports, prompts, skills, results, plans, handoffs, generated files, or other Non-Core Artifacts |

The exact workspace boundary is preserved: `./tech-docs-generator/` remains a root-level sibling of `./site/`; `./generated-documents/` remains separate generated output; and `./results/site/` is a Machine Evidence Purpose Subfolder, never a source tree or package relocation target. A move or relationship change is a separate Workspace-Boundary Task.

## Exact output and workspace boundaries

- Agent-authored reports and work products use `./agents-work/<workstream>/<report-type>/` or an existing approved guide workstream; the `./agents-work/` root is not a report destination.
- Machine Evidence from commands, tests, gates, builds, browser runs, coverage, deployments, database actions, backups, or local services uses `./results/<purpose>/`, including `./results/tests/`, `./results/site/`, `./results/site-ui/`, or `./results/ops/`; the `./results/` root is not a publication destination.
- Tech-docs generator output uses `./generated-documents/`; it is separate from source and is regenerated rather than hand-edited.
- Active plan material uses `./plans/<name>/` indexed by `./plans/README.md`.
- A True Blocker uses root `./Failures.md` as the sole canonical ledger, with supporting authored analysis in an approved workstream; without exact owner authorization the locked ledger remains unchanged.
- `./tech-docs-generator/` remains a root-level sibling of `./site/`; `./results/site/` is Machine Evidence and is distinct from `./site/`; neither is a relocation target.
- `./site/` is reserved for explicitly approved Core Product Writes. Reports, results, prompts, skills, plans, handoffs, generated files, and other Non-Core Artifacts are redirected elsewhere by the Site Write Gate.

For every Output-Producing Task, the Route Record declares Artifact Class, exact selected Workstream or Purpose Subfolder, filename pattern, owning source/script, authored-or-generated state, rejected placements, and Site Write Gate state when applicable. The Completion Record repeats those fields with observed placement evidence. An existing root artifact without observed purpose assignment is `legacy/owner-review pending`; a placement decision is not a relocation claim.

## Private and generated-state rule

Never expose `.env.local` or `./site/.env.local`; never treat `./generated-documents/`, `./site/.next/`, generated TypeScript artifacts, `node_modules/`, or local VCS/editor state as editable product source. Use live source and the owning generator/script. The Plain-Language Response Contract must state what was inspected, what remains unverified, exact allowed/pending checks, and the next owner action.

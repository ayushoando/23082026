# Requirements Document: Kiro Configuration Rewrite

## Introduction

The repository's Kiro-managed assets are split between root `.kiro/`, a partially copied governance tree under `scripts/`, an external hook helper, and root MCP schema snapshots. The owner requires one containment rule: **all tracked files owned by this Kiro configuration rewrite must live under the repository-root `.kiro/` directory**.

A six-slice audit covering all 4,079 tracked files established the baseline. A later live check found both governance trees present with 25 top-level TypeScript modules and 43 tests each. The existing test harness already targets `.kiro/kiro-repo-guidance-setup/**`; therefore `.kiro` is canonical and the incomplete `scripts/` relocation is reversed.

This spec changes Kiro-managed files and removes obsolete outside-`.kiro` duplicates only. Application code, general repository authority documents, test harness configuration, database schema, and production infrastructure remain unchanged.

## Outcomes

After the rewrite:

- all tracked Kiro-managed configuration, capability metadata, hook code, governance modules, and MCP schema snapshots are under root `.kiro/`;
- `.kiro/kiro-repo-guidance-setup/` remains canonical with 25 modules and 43 tests;
- `scripts/kiro-repo-guidance-setup/` and `scripts/general/block-agent-tests.mjs` are absent after safe reconciliation;
- root tracked MCP schema snapshots are consolidated under `.kiro/mcp/`;
- `.kiro/skills/` contains exactly 9 repo-specific skills and `.kiro/agents/` contains exactly 4 focused agents: `spec-task-runner`, `containment-reconciler`, `hook-localizer`, and `capability-powers-author`;
- observability, analytics, and security powers use evidence-based capability states;
- an enabled `PreToolUse` hook invokes its helper inside `.kiro/hooks/`;
- `steering/INDEX.md` describes the real post-state and containment boundary.

## Boundary definitions

- **Kiro-managed asset:** A file whose primary purpose is Kiro configuration, steering, skills, powers, agents, hooks, specs, Kiro-specific governance execution, or Kiro MCP capability metadata.
- **Referenced repository asset:** Application source, tests, commands, `AGENTS.md`, `Agents/`, plans, docs, or infrastructure that Kiro reads or routes to but does not own. These remain at their established paths.
- **Canonical Kiro root:** Repository-root `.kiro/`.
- **Schema present:** Tool schemas exist under `.kiro/mcp/<name>/`; this does not prove workspace configuration or runtime installation.
- **Present but unmounted:** Packages/components exist, but no live importer, render, or invocation was found.

## Requirements

### Requirement 1: Enforce the root `.kiro` containment boundary

**User Story:** As the repo owner, I want all Kiro-managed files in one root directory so Kiro configuration is discoverable and cannot drift across the repository.

#### Acceptance Criteria

1. The final tracked location of every asset created, retained, or modified as Kiro-owned by this rewrite SHALL be under root `.kiro/`.
2. The implementation SHALL NOT create or modify a Kiro-managed file under `scripts/`, `tests/`, `plans/`, root `mcp/`, or another repository directory.
3. Outside-`.kiro` mutations are limited to deleting obsolete Kiro-owned duplicates after their unique content has been reviewed and reconciled into canonical `.kiro` files.
4. Referenced repository assets such as `site/**`, `tests/**`, `AGENTS.md`, `Agents/**`, `plans/**`, and operational scripts that are not Kiro-owned SHALL remain at their established paths.
5. Live source, current Git state, `AGENTS.md`, and current package/config files SHALL override historical reports.
6. The implementation SHALL preserve unrelated work and perform a final changed-path audit distinguishing canonical `.kiro` writes from approved duplicate deletions.

### Requirement 2: Remove the generic workflow bundle

**User Story:** As an agent, I want discoverable Kiro capabilities to be relevant to this repository.

#### Acceptance Criteria

1. Delete the six generic skill directories `ai-framing`, `ai-framing-template`, `claude-code-workflow`, `deep-research`, `prd`, and `prfaq`.
2. Retain exactly these 9 skills: `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`, `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate`.
3. Delete the six matching workflow guides from `.kiro/agents/`; retain `spec-task-runner.md` and create `containment-reconciler.md`, `hook-localizer.md`, and `capability-powers-author.md` as the three additional execution agents.
4. The final `.kiro/agents/` inventory SHALL contain exactly these 4 definitions, with non-overlapping ownership, no worktrees, preservation of unrelated work, explicit owner authorization for behavioral validation, and stop/escalate behavior for out-of-scope writes.
5. Delete `.kiro/steering/product-workflow.md` and the two workflow HTML templates; remove the template directory if empty.
6. Do not relocate the deleted bundle elsewhere.
7. Active Kiro runtime configuration SHALL NOT route to deleted assets. Historical references inside this spec and the INDEX removal ledger are permitted when classified.

### Requirement 3: Consolidate and correct steering and retained skills

**User Story:** As the Kiro runtime, I want one accurate source per concern.

#### Acceptance Criteria

1. Retain `product.md` as the sole product-context file; delete `product-context.md`, `spec.md`, and the empty `spec-guide.md`.
2. Keep `tech-stack.md`, `coding-standards.md`, and `agent-behavior.md` explicit, current, and grounded in the actual `site/` architecture and authority documents.
3. Do not claim that absent `scripts/tsconfig.json` or `plans/PLAN.md` exists.
4. Do not claim Next.js 14, npm, ESLint configuration, root `/supabase/`, Datadog RUM, or Sentry.
5. Preserve retained domain steering inclusion behavior unless a live path is stale; every remaining steering file SHALL have valid front matter.
6. Audit all retained skills, including `powers-skills-model`, for stale counts, paths, MCP assumptions, and hook lifecycle text.

### Requirement 4: Keep the governance module canonical inside `.kiro`

**User Story:** As a maintainer, I want the complete governance implementation retained under `.kiro` without losing useful fixes from the incomplete outside copy.

#### Acceptance Criteria

1. `.kiro/kiro-repo-guidance-setup/` SHALL be the only final governance root and contain exactly 25 top-level TypeScript modules and 43 tests in the existing subtree structure.
2. Before deleting the duplicate, compare exact relative-path sets and content between `.kiro/kiro-repo-guidance-setup/` and `scripts/kiro-repo-guidance-setup/`.
3. Review every differing duplicate file. Copy only valid relocation-independent fixes into the canonical `.kiro` counterpart; do not import path changes whose sole purpose was the abandoned `scripts/` destination.
4. Canonical test imports and embedded roots SHALL resolve from and identify `.kiro/kiro-repo-guidance-setup/**`.
5. `tests/vitest.shared.ts` and `tests/tsconfig.json` SHALL remain unchanged because they already target the canonical `.kiro` tree.
6. Create `.kiro/kiro-repo-guidance-setup/README.md` documenting purpose, canonical status, entry points, tests, and the reversed relocation.
7. Maintain a reconciliation ledger listing each differing file, the chosen canonical content, and the reason.
8. Delete `scripts/kiro-repo-guidance-setup/` only after canonical counts, references, and reconciliation evidence pass static inspection.
9. No active Kiro configuration SHALL route to the deleted outside duplicate; historical ledger references are allowed when classified.

### Requirement 5: Keep hook enforcement entirely inside `.kiro`

**User Story:** As the repo owner, I want agent test execution blocked before it starts without a Kiro helper under general scripts.

#### Acceptance Criteria

1. Keep `domain-fast-check.json` lightweight: test files skipped, Studio/Planner boundary checks retained, FOCSS/UI checks retained, and other matching saves passing without broad validation.
2. Replace the currently enabled but ineffective `PostTaskExec` test hook with an enabled `PreToolUse` hook matched to `execute_pwsh|control_pwsh_process`.
3. The hook SHALL invoke `node .kiro/hooks/block-agent-tests.mjs`.
4. Create or repair `.kiro/hooks/block-agent-tests.mjs` so all matchers are defined, payload parsing is defensive, prohibited agent commands return exit code 2, and unrelated commands return 0.
5. After static comparison, delete obsolete `scripts/general/block-agent-tests.mjs`; no Kiro hook may reference it.
6. The blocker SHALL affect agent shell-tool calls, not commands the user runs directly in a terminal.
7. Retained skills, powers, hooks, and INDEX SHALL describe the actual enabled `PreToolUse` behavior.
8. Add `session-start-orient.json` under `.kiro/hooks/`; leave `ltm-postturn-capture.json` unchanged.
9. The implementation SHALL NOT run tests, typechecks, gates, coverage, browser checks, builds, or Docker services.

### Requirement 6: Consolidate Kiro MCP metadata under `.kiro`

**User Story:** As an agent, I want Kiro capability metadata stored with the rest of Kiro configuration and described honestly.

#### Acceptance Criteria

1. Create `.kiro/settings/mcp.json` with an empty workspace `mcpServers` object.
2. Move tracked schema snapshots from root `mcp/chrome-devtools`, `mcp/cloudflare-docs`, `mcp/github`, and `mcp/tasks` to corresponding `.kiro/mcp/<name>/` paths, preserving relative paths and bytes unless a containment reference requires correction.
3. Delete the tracked root schema copies only after destination path-set and byte/hash parity succeeds.
4. Gitignored/local cache data such as the Datadog cache is not source configuration; do not copy secrets or generated cache content into `.kiro`.
5. Describe schemas as present and workspace-unconfigured. Claim runtime installation only after a direct registry check; otherwise state runtime availability is not verified.
6. No power may bundle or install an MCP server.

### Requirement 7: Add truthful capability powers

**User Story:** As an agent, I want observability, analytics, and security routing grounded in live repository evidence.

#### Acceptance Criteria

1. Create `.kiro/powers/observability/POWER.md` routing OTel, Prometheus/Grafana, metrics availability, client errors, structured console sink, and `Failures.md`; state Sentry and Datadog RUM are not wired.
2. Create `.kiro/powers/analytics/POWER.md` routing consent/event/queue/conversion/KPI modules and classify Vercel Analytics/Speed Insights as present but unmounted.
3. Create `.kiro/powers/security/POWER.md` distinguishing proxy prechecks/headers, server session validation, and API authorization, and route strict SVG, CSRF, origin/upload, and rate-limit controls.
4. Security command text SHALL use `pnpm run scan:secrets`, `pnpm run ops -- lint:secrets`, `pnpm run test:audit:api-routes`, and `pnpm run test:audit:eslint-disable` while preserving user-owned execution.
5. Power references to MCP schemas SHALL use `.kiro/mcp/**` and the status vocabulary in Requirement 6.
6. Update `oando-workflow` routing to remove deleted workflow routes, add the three powers, preserve repo-specific routing, and describe the actual hook.

### Requirement 8: Create the canonical index and verify containment

**User Story:** As the repo owner, I want one truthful inventory proving Kiro-owned files are contained under `.kiro`.

#### Acceptance Criteria

1. Create `.kiro/steering/INDEX.md` with `inclusion: manual`, listing steering modes, four hooks, exactly four agents, nine skills, four powers, settings, governance tooling, and `.kiro/mcp` schemas.
2. Include a labeled removal/reversal ledger for deleted workflow assets and outside Kiro duplicates.
3. Perform non-test static audits for manifests, JSON, front matter, capability wording, governance reconciliation, MCP parity, hook paths, and containment.
4. Search active Kiro configuration for operational references to `scripts/kiro-repo-guidance-setup`, `scripts/general/block-agent-tests.mjs`, and root `mcp/`; classify specs and INDEX history separately.
5. Perform a final diff/scope audit. Final Kiro-owned files must be under `.kiro`; approved outside changes must be deletions of superseded Kiro duplicates only.
6. Do not offer `pnpm run typecheck:scripts`; its config is absent. Do not claim validation passed unless the owner authorizes and an observed result exists.
7. Until required `check:layout` and gate validation has owner-authorized observed results, report: “Configuration changes complete; mandatory repository validation pending owner execution/authorization.”

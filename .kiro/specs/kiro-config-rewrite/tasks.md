# Implementation Plan: Kiro Configuration Rewrite

## Execution contract

Implement `requirements.md` and `design.md` without changing application behavior. Before mutation, read the live target and preserve unrelated work. Allowed paths are `.kiro/**`, `scripts/kiro-repo-guidance-setup/**`, `scripts/general/block-agent-tests.mjs`, `tests/vitest.shared.ts`, and `tests/tsconfig.json`.

Do not run tests, typechecks, gates, coverage, browser checks, builds, or Docker services. Mandatory repository validation remains pending until the owner executes or explicitly authorizes exact commands and the active hook permits them.

## Multi-agent execution model

Use at most **4 agents total**: one coordinator/integrator and three additional execution agents. The user's explicit request for additional agents and the root `AGENTS.md` four-agent ceiling govern this plan. No agent may create a worktree, broaden scope, run prohibited validation, or edit a file owned by another active lane.

### Agent ownership

| Agent | Role | Owned tasks | Exclusive write scope |
|---|---|---|---|
| **Agent A — Coordinator / Integrator** | Sequence work, protect scope, reconcile handoffs, finish routing/index/audits, and issue the truthful completion report | Tasks 7–10; coordination of all tasks | `.kiro/powers/oando-workflow/**`, `.kiro/steering/INDEX.md`, this spec's `tasks.md` status updates, and final integration-only corrections after worker handoff |
| **Agent B — Governance Relocation** | Complete the transactional module move and relocation evidence | Task 4 | `.kiro/kiro-repo-guidance-setup/**`, `scripts/kiro-repo-guidance-setup/**`, `tests/vitest.shared.ts`, and `tests/tsconfig.json` |
| **Agent C — Hook Enforcement** | Complete lightweight save hooks, pre-execution blocking, and session orientation | Task 5 | `.kiro/hooks/**` and `scripts/general/block-agent-tests.mjs` |
| **Agent D — Capability Powers** | Complete MCP settings and observability/analytics/security power documents | Task 6 | `.kiro/settings/mcp.json`, `.kiro/powers/observability/**`, `.kiro/powers/analytics/**`, and `.kiro/powers/security/**` |

Completed Task 3 steering/skill files are read-only during parallel execution unless Agent A records a concrete integration defect and assigns one explicit correction after all worker lanes stop. Existing unrelated work remains untouched.

### Parallel wave and dependency rules

1. Agent A performs a live changed-file and ownership preflight before dispatch. If an owned path already has unreviewed edits, the assigned agent must read and preserve them before writing.
2. Agents B, C, and D may execute concurrently because their write scopes do not overlap. Each worker handles only its assigned task and files.
3. Agent A may coordinate and inspect during the worker wave but SHALL NOT edit worker-owned files while their lanes are active.
4. Task 7 starts only after Agents C and D hand off, because master routing depends on final hook, MCP, and power wording.
5. Task 8 reconciliation starts only after Agents B, C, and D hand off, because the index depends on the final relocation and complete configuration inventory.
6. Tasks 9 and 10 are coordinator-only integration work and start after all worker lanes are closed.
7. If a worker discovers a required edit outside its scope, it stops that edit and reports the exact path, reason, and dependency to Agent A. Agent A reassigns ownership only after confirming no active agent owns the target.
8. No two agents may mutate the same file in one wave. Cross-lane review is read-only; fixes return to the owning agent or wait for coordinator integration.

### Required worker handoff

Each execution agent returns a compact handoff containing:

- tasks/subtasks completed and any status that must remain partial;
- exact files changed, created, moved, or deleted;
- static evidence collected without running prohibited commands;
- assumptions, unresolved references, and blockers;
- confirmation that no out-of-scope file was modified.

Agent B additionally returns the collision result, source/destination relative-path comparison, parity exception ledger, and source-removal state. Agent C returns the final hook trigger/matcher/enabled state and blocker-script matcher summary. Agent D returns the power capability classifications and MCP workspace/runtime wording. Agent A verifies these handoffs against the live diff rather than accepting completion claims on trust.

## Tasks

- [x] 1. Capture the live pre-state manifest
  - [x] 1.1 Enumerate the live `.kiro` configuration domains and governance source.
  - [x] 1.2 Confirm 25 top-level governance modules and 43 test files.
  - [x] 1.3 Confirm the destination is not currently tracked; do not use the historical CSV as a move manifest.
  - [x] 1.4 Record unexpected files before any deletion.
  - _Requirements: 1.1–1.3, 4.1–4.2_

- [x] 2. Remove the generic product-workflow bundle
  - [x] 2.1 Delete the six generic workflow skill directories.
  - [x] 2.2 Delete the six mirrored workflow guides from `.kiro/agents/`.
  - [x] 2.3 Delete `.kiro/steering/product-workflow.md`.
  - [x] 2.4 Delete the two workflow templates and remove the empty template directory.
  - [x] 2.5 Preserve `spec-task-runner.md` and all nine retained skills.
  - [x] 2.6 Confirm no `plans/prompts/` directory was created.
  - _Requirements: 2.1–2.6_

- [x] 3. Consolidate steering and repair retained guidance
  - [x] 3.1 Delete duplicate/empty `product-context.md`, `spec.md`, and `spec-guide.md`.
  - [x] 3.2 Rewrite `tech-stack.md` with the audited stack and current `site/` paths.
  - [x] 3.3 Rewrite `agent-behavior.md` to current repo authority and path conventions.
  - [x] 3.4 Preserve the completed `coding-standards.md` front matter and `site/` path corrections.
  - [x] 3.5 Inspect all retained domain steering front matter and live path references; preserve intentional scoped inclusion.
  - [x] 3.6 Remove stale Datadog-RUM/Sentry, deleted-workflow, absent `scripts/tsconfig.json`, and absent `plans/PLAN.md` claims from active steering.
  - [x] 3.7 Audit all nine retained skills; repair `powers-skills-model/SKILL.md` stale candidate-count, `plans/ref`, local power-MCP, and hook claims, plus any equivalent stale assumptions elsewhere.
  - _Requirements: 3.1–3.9_

- [~] 4. Relocate the governance module with collision and parity controls
  - [x] 4.1 Enumerate the source relative-path set and capture a hash or byte count for every file.
  - [x] 4.2 Fail before mutation if `scripts/kiro-repo-guidance-setup/` contains any colliding path or unrelated content.
  - [-] 4.3 Create the destination and relocate all 25 top-level modules plus the complete 43-test subtree, preserving relative paths.
  - [~] 4.4 Recalculate every moved test import from its destination. Replace old repo-root-style imports only with paths that resolve from the moved file; do not apply an unverified blanket depth.
  - [~] 4.5 Fix relocation-caused module references, including `pipeline.ts` importing `./reviewers`.
  - [~] 4.6 Search every moved module/test for embedded `.kiro/kiro-repo-guidance-setup` roots. Update current-location values in manifests, contracts, freeze/ownership data, and command/path fixtures only where relocation changes their meaning.
  - [~] 4.7 Update only the governance include globs in `tests/vitest.shared.ts` and `tests/tsconfig.json` to the destination; do not modify test logic.
  - [~] 4.8 Create the destination README with purpose, non-runtime status, entry points, tests, relocation history, and validation limitations.
  - [~] 4.9 Produce an exception ledger of every content-edited relocated file and its reason. Verify hash/byte parity for every file outside the ledger.
  - [~] 4.10 Compare exact source/destination relative-path sets and counts. Delete the source only after equality and parity succeed.
  - [~] 4.11 Verify active runtime/harness configuration has no operational old-root reference; classify spec and removal-ledger history separately.
  - _Requirements: 1.3–1.6, 4.1–4.10_

- [~] 5. Make hook enforcement real and pre-execution
  - [~] 5.1 Rewrite `domain-fast-check.json`: retain the test skip, Studio/Planner boundary check, and FOCSS/UI check; make every other branch pass without broad validation.
  - [~] 5.2 Replace `block-agent-tests.json` with an enabled `PreToolUse` hook using matcher `execute_pwsh|control_pwsh_process`, remove the existing `"enabled": false` state, and invoke `node scripts/general/block-agent-tests.mjs`.
  - [~] 5.3 Repair `block-agent-tests.mjs`: define all blocked matchers, parse command payload fields defensively, return exit 2 for agent test/gate/coverage/browser/build/typecheck/local-service commands, and return 0 otherwise.
  - [~] 5.4 Ensure hook name/description, retained skills, powers, and INDEX all describe enabled pre-execution blocking—not disabled `PostTaskExec` behavior.
  - [~] 5.5 Create the agent-action `SessionStart` orientation hook and leave `ltm-postturn-capture.json` unchanged.
  - [~] 5.6 Inspect hook JSON and blocker source statically; do not test the blocker by attempting a prohibited command.
  - _Requirements: 5.1–5.7_

- [~] 6. Create honest MCP settings and capability powers
  - [~] 6.1 Create `.kiro/settings/mcp.json` with an empty workspace `mcpServers` object.
  - [~] 6.2 Create `observability/POWER.md` routing OTel, metrics, `/api/metrics`, local Prometheus/Grafana, client errors, console sink, and `Failures.md`; state Sentry/Datadog RUM are not wired.
  - [~] 6.3 Create `analytics/POWER.md` routing consent/event/queue/conversion/KPI modules; classify Vercel Analytics and Speed Insights as present-but-unmounted and do not claim operational transport.
  - [~] 6.4 Create `security/POWER.md` distinguishing proxy prechecks/headers, server session validation, and API authorization; route remaining controls and use exact security commands.
  - [~] 6.5 Use “schema present, workspace unconfigured, runtime availability not verified” unless a direct registry check supplies stronger evidence.
  - [~] 6.6 Verify power directory/front-matter names match and none bundles MCP.
  - _Requirements: 6.1–6.6, 7.1–7.7, 8.1–8.7, 9.1–9.8_

- [ ] 7. Rewrite master routing and correct retained references
  - [~] 7.1 Remove deleted workflow and stale Datadog routes from `oando-workflow/POWER.md`.
  - [~] 7.2 Add observability, analytics, and security routing while preserving repo-map, graph, fork, FOCSS, migration, and user-owned verification routing.
  - [~] 7.3 Correct hook wording to the enabled `PreToolUse` implementation.
  - [~] 7.4 Update routing steering only where the post-state inventory requires it.
  - [~] 7.5 Audit all active skills/powers/steering for false external-registry conclusions and stale deleted-asset routes.
  - _Requirements: 2.7–2.8, 5.5, 6.4–6.6_

- [~] 8. Create the canonical post-state index
  - [~] 8.1 Create `steering/INDEX.md` with `inclusion: manual`.
  - [~] 8.2 List all retained steering files/modes, the four hooks with enabled status and actual triggers/actions, one agent, nine skills, four powers, and settings.
  - [~] 8.3 Document capability vocabulary and workspace-versus-runtime MCP uncertainty.
  - [~] 8.4 Add a clearly labeled removal/relocation ledger. State that ledger names are historical and excluded from active-route failures.
  - [~] 8.5 Reconcile the index against the live filesystem after all mutations.
  - _Requirements: 10.1–10.2_

- [ ] 9. Perform the permitted static post-state audit
  - [~] 9.1 Changed-path audit: compare `git diff --name-only` with the explicit allowlist and investigate every extra path.
  - [~] 9.2 Manifest audit: verify exact retained/deleted configuration and relocation counts.
  - [~] 9.3 Front-matter/JSON audit: inspect every retained steering/power header and parse every hook/settings JSON.
  - [~] 9.4 Relocation audit: verify collision record, path-set equality, parity outside the edit ledger, all relocation edits justified, and source removal.
  - [~] 9.5 Active-reference audit: scan runtime configuration and harness files for deleted routes/old roots. Separately classify `.kiro/specs/**`, Kiro metadata, INDEX history, URLs, globs, commands, env vars, and unavailable capabilities.
  - [~] 9.6 Truth audit: verify no stale stack, `plans/PLAN.md`, analytics-mounted, auth-layer, command, hook, or MCP-installation claim remains.
  - [~] 9.7 Security-command audit: verify `pnpm run ops -- lint:secrets` and the other exact package commands are written correctly.
  - [~] 9.8 Requirement coverage audit: map every acceptance criterion to a task/evidence item and resolve omissions.
  - [~] 9.9 Run formatting-only `git diff --check` on changed spec/config/source text and inspect the final diff. Do not run behavioral checks.
  - _Requirements: 10.1–10.5, 10.8_

- [ ] 10. Report configuration completion and mandatory validation honestly
  - [~] 10.1 Do not offer or run `pnpm run typecheck:scripts`; record that its `scripts/tsconfig.json` target is absent.
  - [~] 10.2 Identify `pnpm run typecheck:tests` as the candidate relocated-module typecheck only after the owner authorizes it and the repaired include is present.
  - [~] 10.3 Record `pnpm run check:layout` plus `pnpm run gate:fast` or `pnpm run gate` as mandatory pending AGENTS validation unless separately owner-authorized and observed.
  - [~] 10.4 If those commands have not produced observed results, report exactly: “Configuration changes complete; mandatory repository validation pending owner execution/authorization.”
  - [~] 10.5 Never infer a pass from historical files, package scripts, or static inspection.
  - _Requirements: 5.7, 10.6–10.8_

## Dependency order

```text
Completed foundation: Tasks 1–3

Parallel worker wave (maximum 4 total agents including coordinator)
  ├─ Agent B → Task 4 governance relocation
  ├─ Agent C → Task 5 hook enforcement
  ├─ Agent D → Task 6 settings and capability powers
  └─ Agent A → coordination/read-only inspection
                  ↓ all worker handoffs accepted
Agent A → Task 7 master routing
        → Task 8 canonical index reconciliation
        → Task 9 static integration audit
        → Task 10 truthful pending-validation report
```

Agents B–D may run concurrently only within their exclusive scopes. Tasks 7–10 are coordinator-owned and wait for all relevant worker handoffs. A failed static audit returns to the original owning agent when that lane is still active; otherwise Agent A records and performs one integration correction after confirming exclusive ownership. Checks must not be weakened to make the result pass.

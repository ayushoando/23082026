# Implementation Plan: Kiro Configuration Rewrite

## Execution contract

All Kiro-managed files retained, created, or modified by this plan must finish under repository-root `.kiro/`. Outside paths may only be deleted after their unique Kiro content has been reconciled into `.kiro` and parity/static evidence succeeds. Do not modify application code, test harness configuration, general repo authority, databases, CI, or infrastructure.

Do not run tests, typechecks, gates, coverage, browser checks, builds, or Docker services. Mandatory validation remains pending owner execution/authorization.

## Multi-agent execution model

Use exactly **4 agent definitions** and at most **4 active agents total**: `spec-task-runner` plus three focused execution agents. No worktrees, overlapping writes, scope broadening, or prohibited validation.

| Agent | Role | Owned tasks | Canonical write scope | Approved outside deletion |
|---|---|---|---|---|
| **Agent A — `spec-task-runner`** | Coordinator/general executor: sequence lanes, reconcile handoffs, complete routing/index/audits/report | Tasks 7–10 | `.kiro/powers/oando-workflow/**`, `.kiro/steering/INDEX.md`, spec task-status updates, post-handoff integration fixes | None unless explicitly reassigned after all workers stop |
| **Agent B — `containment-reconciler`** | Governance canonicalization and MCP schema consolidation | Task 4 | `.kiro/kiro-repo-guidance-setup/**`, `.kiro/mcp/**` | `scripts/kiro-repo-guidance-setup/**`, tracked `mcp/{chrome-devtools,cloudflare-docs,github,tasks}/**` after evidence |
| **Agent C — `hook-localizer`** | Save hook, pre-execution blocker, session orientation | Task 5 | `.kiro/hooks/**` | `scripts/general/block-agent-tests.mjs` after behavior is preserved |
| **Agent D — `capability-powers-author`** | MCP settings and observability/analytics/security powers | Task 6 | `.kiro/settings/mcp.json`, `.kiro/powers/{observability,analytics,security}/**` | None |

Agents B–D may run concurrently. Agent A inspects but does not edit active worker paths. Any required out-of-scope write is refused and escalated. Each worker returns exact changed/deleted paths, static evidence, unresolved issues, and confirmation that no unapproved outside file was modified.

## Tasks

- [x] 1. Capture and reconcile the live baseline
  - [x] 1.1 Audit Kiro configuration and the 4,079 tracked-file repository inventory.
  - [x] 1.2 Confirm the canonical `.kiro` governance tree contains 25 top-level modules and 43 tests.
  - [x] 1.3 Record that a partial outside copy now also exists with the same counts; historical destination-absent assumptions are superseded.
  - [x] 1.4 Confirm the existing test harness already targets `.kiro/kiro-repo-guidance-setup/**`.
  - _Requirements: 1.5, 4.1–4.2_

- [x] 2. Remove the generic workflow bundle and establish the focused agent set
  - [x] 2.1 Delete six generic workflow skills and six mirrored workflow guides.
  - [x] 2.2 Delete workflow steering and two templates; do not relocate them.
  - [x] 2.3 Retain `spec-task-runner.md` as the coordinator/general executor.
  - [x] 2.4 Create `containment-reconciler.md`, `hook-localizer.md`, and `capability-powers-author.md` under `.kiro/agents/` with exclusive ownership and safety contracts.
  - [x] 2.5 Confirm the final intended inventory is exactly four agent definitions and no deleted workflow guide remains.
  - _Requirements: 2.1–2.7_

- [x] 3. Consolidate steering and retained skills
  - [x] 3.1 Delete duplicate/empty steering files.
  - [x] 3.2 Correct tech stack, agent behavior, coding standards, and retained domain steering.
  - [x] 3.3 Remove absent `scripts/tsconfig.json`, absent `plans/PLAN.md`, stale integration, and deleted-workflow claims.
  - [x] 3.4 Audit all nine retained skills and repair stale assumptions.
  - _Requirements: 3.1–3.6_

- [~] 4. Consolidate all Kiro governance and MCP metadata under `.kiro`
  - [x] 4.1 Confirm both governance roots currently contain 25 top-level modules and 43 tests.
  - [x] 4.2 Compare exact governance relative-path sets and hashes/bytes; enumerate every differing pair.
  - [x] 4.3 Review each difference and merge only valid relocation-independent fixes into `.kiro/kiro-repo-guidance-setup/**`.
  - [x] 4.4 Restore/retain canonical imports, manifests, contracts, freeze data, and command/path fixtures that identify `.kiro/kiro-repo-guidance-setup/**`.
  - [x] 4.5 Confirm `tests/vitest.shared.ts` and `tests/tsconfig.json` already target `.kiro`; leave both unchanged.
  - [x] 4.6 Create `.kiro/kiro-repo-guidance-setup/README.md` describing canonical status and reversed relocation.
  - [x] 4.7 Record the governance reconciliation ledger and verify canonical counts/references.
  - [x] 4.8 Delete `scripts/kiro-repo-guidance-setup/**` only after 4.2–4.7 succeed.
  - [x] 4.9 Enumerate tracked root MCP schema relative paths for chrome-devtools, cloudflare-docs, github, and tasks; preflight `.kiro/mcp` collisions.
  - [~] 4.10 Copy tracked schemas to `.kiro/mcp/<name>/**`, preserving path sets and bytes/hashes; do not copy Datadog cache, secrets, or generated local state.
  - [~] 4.11 Delete the tracked root MCP schema copies only after parity, then verify active Kiro references use `.kiro/mcp/**`.
  - _Requirements: 1.1–1.6, 4.1–4.9, 6.2–6.5_

- [~] 5. Localize hook enforcement under `.kiro/hooks`
  - [~] 5.1 Keep `domain-fast-check.json` limited to the test skip, boundary check, FOCSS/UI checks, and pass-through.
  - [~] 5.2 Replace the currently enabled `PostTaskExec` blocker with enabled `PreToolUse`, matcher `execute_pwsh|control_pwsh_process`, and command `node .kiro/hooks/block-agent-tests.mjs`.
  - [~] 5.3 Create/repair `.kiro/hooks/block-agent-tests.mjs`; define all matchers, parse payload defensively, return exit 2 for prohibited agent commands, and return 0 otherwise.
  - [~] 5.4 Compare the obsolete external helper, preserve any valid behavior, then delete `scripts/general/block-agent-tests.mjs`.
  - [~] 5.5 Reconcile hook/skill/power/INDEX wording with the actual enabled pre-execution behavior.
  - [~] 5.6 Create `session-start-orient.json`; leave `ltm-postturn-capture.json` unchanged.
  - [~] 5.7 Inspect hook JSON/helper statically without attempting a prohibited command.
  - _Requirements: 5.1–5.9_

- [~] 6. Complete MCP settings and capability powers under `.kiro`
  - [~] 6.1 Create `.kiro/settings/mcp.json` with empty workspace `mcpServers`.
  - [~] 6.2 Complete observability power with live OTel/metrics/error routing and honest not-wired states.
  - [~] 6.3 Complete analytics power with consent routing and present-but-unmounted transport status.
  - [~] 6.4 Complete security power with layered auth/security routing and exact commands.
  - [~] 6.5 Update schema references from root `mcp/**` to `.kiro/mcp/**` and preserve workspace/runtime uncertainty.
  - [~] 6.6 Verify power front matter and confirm no bundled server.
  - _Requirements: 6.1, 6.5–6.6, 7.1–7.5_

- [ ] 7. Rewrite master routing
  - [~] 7.1 Remove deleted workflow and stale capability routes.
  - [~] 7.2 Route to observability, analytics, security, and retained repo skills.
  - [~] 7.3 Route hook references to `.kiro/hooks/block-agent-tests.mjs` and schema references to `.kiro/mcp/**`.
  - [~] 7.4 Correct hook lifecycle, MCP status, and capability wording.
  - [~] 7.5 Confirm no operational route targets an outside Kiro duplicate.
  - _Requirements: 2.6, 5.7, 6.5, 7.5–7.6_

- [~] 8. Reconcile the canonical INDEX
  - [~] 8.1 Keep `steering/INDEX.md` manual.
  - [~] 8.2 List steering, hooks, exactly four agents, nine skills, four powers, settings, governance tooling, and `.kiro/mcp` schemas.
  - [~] 8.3 Record the reversed governance relocation, localized hook helper, and MCP-schema consolidation in a historical ledger.
  - [~] 8.4 Preserve capability vocabulary and runtime uncertainty.
  - [~] 8.5 Reconcile the index against the final filesystem.
  - _Requirements: 8.1–8.2_

- [ ] 9. Perform the permitted static containment audit
  - [~] 9.1 Manifest audit: verify final Kiro-owned assets are under `.kiro` with expected counts.
  - [~] 9.2 Governance audit: verify reconciliation ledger, canonical references, source counts, and outside duplicate deletion.
  - [~] 9.3 MCP audit: verify `.kiro/mcp` path/byte parity and tracked root-copy deletion.
  - [~] 9.4 Hook audit: parse JSON, inspect local helper, and verify no external-helper reference.
  - [~] 9.5 Front-matter/capability audit: verify powers/steering and truthful status wording.
  - [~] 9.6 Active-reference audit: reject operational `scripts/kiro-repo-guidance-setup`, `scripts/general/block-agent-tests.mjs`, and root `mcp/` routes; classify spec/INDEX history separately.
  - [~] 9.7 Diff/scope audit: all canonical Kiro writes must be under `.kiro`; outside changes must be approved duplicate deletions only.
  - [~] 9.8 Requirement coverage and `git diff --check`; do not run behavioral validation.
  - _Requirements: 8.3–8.5_

- [ ] 10. Report completion honestly
  - [~] 10.1 Do not offer `pnpm run typecheck:scripts`; its config is absent.
  - [~] 10.2 Keep required `check:layout` and gate validation pending unless owner-authorized and observed.
  - [~] 10.3 Report “Configuration changes complete; mandatory repository validation pending owner execution/authorization” while gates remain pending.
  - [~] 10.4 Never infer a pass from static inspection or historical evidence.
  - _Requirements: 5.9, 8.6–8.7_

## Dependency order

```text
Completed foundation: Tasks 1–3

Parallel worker wave (maximum 4 active agents)
  ├─ `containment-reconciler` → Task 4 containment reconciliation
  ├─ `hook-localizer` → Task 5 hook localization
  ├─ `capability-powers-author` → Task 6 settings and powers
  └─ `spec-task-runner` → coordination/read-only inspection
                  ↓ worker handoffs accepted
`spec-task-runner` → Task 7 routing
                   → Task 8 INDEX
                   → Task 9 containment audit
                   → Task 10 pending-validation report
```

No worker may delete an outside duplicate before its canonical `.kiro` evidence passes. Failed static checks return to the owning lane; checks are never weakened to manufacture completion.

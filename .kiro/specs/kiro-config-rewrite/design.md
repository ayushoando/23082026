# Design Document: Kiro Configuration Rewrite

## Decision

All tracked assets owned by this Kiro rewrite live under the repository-root `.kiro/` directory. Kiro may reference application code, repository authority, tests, plans, commands, and infrastructure at their normal locations, but it does not relocate or duplicate those referenced assets.

The prior design attempted to move Kiro governance code into `scripts/`. Live state now contains both roots with 25 modules and 43 tests each, while the test harness still targets `.kiro`. The owner has selected `.kiro` containment, so the design reverses that partial relocation, moves the hook helper into `.kiro/hooks/`, and consolidates tracked MCP schemas into `.kiro/mcp/`.

## Principles

1. **One Kiro root:** `.kiro/` is canonical for Kiro-managed files.
2. **References are not ownership:** `site/**`, tests, commands, `AGENTS.md`, `Agents/**`, plans, and docs remain where repository architecture places them.
3. **Reconcile before deleting:** useful changes in outside duplicates are reviewed and merged into canonical files before duplicate removal.
4. **No outside Kiro writes:** outside changes are deletion-only cleanup of superseded Kiro-owned copies.
5. **Evidence-based capabilities:** wired, present-but-unmounted, schema-present, workspace-configured, and runtime-installed remain distinct.
6. **Pre-execution enforcement:** the hook and helper both live under `.kiro/hooks/`.
7. **No implied validation:** static inspection is allowed; user-owned tests/gates remain pending.

## Change boundary

### Canonical write surface

```text
.kiro/**
```

### Approved outside cleanup

```text
scripts/kiro-repo-guidance-setup/**      # delete after reconciliation
scripts/general/block-agent-tests.mjs    # delete after helper is canonical in .kiro
mcp/{chrome-devtools,cloudflare-docs,github,tasks}/**  # delete after parity in .kiro/mcp
```

No outside path may receive new or modified Kiro-owned content. `tests/vitest.shared.ts` and `tests/tsconfig.json` remain unchanged because they already point to `.kiro/kiro-repo-guidance-setup/**`.

## Target state

```text
.kiro/
├── agents/
│   ├── capability-powers-author.md
│   ├── containment-reconciler.md
│   ├── hook-localizer.md
│   └── spec-task-runner.md
├── hooks/
│   ├── block-agent-tests.json
│   ├── block-agent-tests.mjs
│   ├── domain-fast-check.json
│   ├── ltm-postturn-capture.json
│   └── session-start-orient.json
├── kiro-repo-guidance-setup/
│   ├── README.md
│   ├── 25 top-level TypeScript modules
│   └── tests/                       # 43 tests
├── mcp/
│   ├── chrome-devtools/
│   ├── cloudflare-docs/
│   ├── github/
│   └── tasks/
├── powers/
│   ├── analytics/POWER.md
│   ├── observability/POWER.md
│   ├── oando-workflow/{POWER.md,steering/routing.md}
│   └── security/POWER.md
├── settings/{lsp.json,mcp.json}
├── skills/                          # exactly 9
├── specs/
└── steering/                       # canonical steering plus INDEX.md
```

Final tracked Kiro copies do not remain under root `scripts/` or root `mcp/`.

## Change model

### 1. Keep completed configuration cleanup

Retain the completed removal of the generic product-workflow bundle, duplicate steering, empty steering, and stale retained-skill assumptions. Keep the nine repo-specific skills. Retain `spec-task-runner.md` as the coordinator/general spec executor and add three focused execution agents: `containment-reconciler.md`, `hook-localizer.md`, and `capability-powers-author.md`. The final agent inventory is exactly four definitions.

### 2. Reverse the incomplete governance relocation safely

Treat `.kiro/kiro-repo-guidance-setup/` as canonical because:

- it is the owner-selected Kiro root;
- it contains the complete 25-module/43-test tree;
- `tests/vitest.shared.ts` and `tests/tsconfig.json` already target it.

The `scripts/` duplicate may contain edits made during the abandoned relocation. Reconciliation therefore proceeds file-by-file:

1. compare exact relative-path sets and hashes/bytes;
2. inspect every differing pair;
3. retain valid behavior fixes in `.kiro`;
4. reject destination-only path rewrites such as imports or embedded roots that assume `scripts/`;
5. ensure canonical imports and manifests resolve to `.kiro/kiro-repo-guidance-setup/**`;
6. add `.kiro/kiro-repo-guidance-setup/README.md`;
7. record a reconciliation ledger;
8. delete `scripts/kiro-repo-guidance-setup/` only after the canonical tree passes static count/reference checks.

This design does not edit test harness configuration. Historical references to the abandoned destination may remain only in specs and labeled INDEX history.

### 3. Localize hook enforcement

The live hook is currently enabled `PostTaskExec`, which is too late to block a command, and it invokes a broken general-script helper whose `BLOCKED` matcher is undefined.

Replace it with:

```text
.kiro/hooks/block-agent-tests.json
  trigger: PreToolUse
  matcher: execute_pwsh|control_pwsh_process
  action: node .kiro/hooks/block-agent-tests.mjs
  enabled: true
```

The local helper parses hook input defensively and exits 2 for agent-initiated tests, gates, coverage, browser runners, builds, typechecks, and local-service commands. After its relevant behavior is preserved, delete `scripts/general/block-agent-tests.mjs`.

Keep `domain-fast-check` lightweight, add the agent-action session orientation hook, and leave the LTM hook unchanged.

### 4. Consolidate Kiro MCP metadata

Move tracked tool schema snapshots from root `mcp/<name>/` into `.kiro/mcp/<name>/` with path-set and byte/hash parity before deleting root copies. Do not import gitignored Datadog cache data, secrets, credentials, or generated local state.

`.kiro/settings/mcp.json` remains the workspace connection configuration with an empty `mcpServers` object. Schema presence proves neither a configured server nor runtime installation. If no direct registry check occurs, powers say “runtime availability not verified.”

### 5. Keep capability powers truthful

- **Observability:** route to live OTel, metrics, local Prometheus/Grafana, client-error ingestion, structured console sink, and `Failures.md`; Sentry/Datadog RUM are not wired.
- **Analytics:** route through consent and event contracts; Vercel Analytics/Speed Insights are present but unmounted.
- **Security:** distinguish proxy prechecks/headers, server session validation, and API authorization; use exact security commands and user-owned execution.

All schema references use `.kiro/mcp/**`. Powers contain routing documentation only and bundle no server.

### 6. Update routing and index

`oando-workflow` routes to the three powers and retained repo-specific skills. It describes the `.kiro/hooks/` blocker accurately and does not route to deleted workflow assets or outside Kiro copies.

`steering/INDEX.md` lists all active Kiro domains, governance tooling, MCP schemas, and capability states. Its historical ledger may name removed outside paths without making them active routes.

## Multi-agent execution design

Use exactly four agent definitions and at most four active agents total:

- **Agent A — `spec-task-runner`:** coordinator/general spec executor for routing, INDEX, final audits, status, and approved integration fixes.
- **Agent B — `containment-reconciler`:** canonical governance reconciliation and MCP schema consolidation; writes only under its `.kiro` scope, then deletes parity-proven outside duplicates.
- **Agent C — `hook-localizer`:** hook JSON/helper under `.kiro/hooks`, then deletes the behavior-reconciled external helper.
- **Agent D — `capability-powers-author`:** workspace MCP settings and the observability, analytics, and security powers under `.kiro`.

Each agent definition includes its evidence resources, exclusive ownership, no-worktree rule, preservation requirement, prohibition on unauthorized tests/typechecks/gates/builds/browser checks/Docker, and stop/escalate behavior for out-of-scope writes. Agents B–D may run concurrently because their canonical write paths do not overlap. Agent A does not edit worker-owned files until handoff.

## Static verification

Permitted non-test checks:

1. exact `.kiro` manifest and expected counts;
2. governance and MCP source/destination path-set plus hash/byte comparison;
3. documented reconciliation decisions for differing governance files;
4. JSON/front-matter parsing and power-name checks;
5. active-reference scans for outside Kiro paths;
6. changed-path review proving canonical writes are under `.kiro` and outside changes are approved deletions only;
7. requirement-to-task coverage and `git diff --check`.

Do not run tests, typechecks, gates, builds, browser checks, coverage, or Docker services. `typecheck:scripts` remains unavailable because `scripts/tsconfig.json` does not exist. Repository completion remains pending until the owner authorizes and observes required gates.

# Oando Subsystem Remediation Plan: Scripts and Operational Catalog

**File Target:** `plans/05092026/07-scripts-and-operational-catalog.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md`)  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Methodology:** Complete Script Inventory, Central Ops Dispatcher (`run-ops.mjs`), Governance Ratchet Engine, and Cross-Platform Execution Contracts.

---

## 1. Subsystem Overview & Architectural Inventory

The Oando operations toolchain manages database migrations, asset generation, static quality gates, and deployments through a centralized, cross-platform scripting architecture.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   OANDO SCRIPTS SUBSYSTEM ARCHITECTURE                 │
├────────────────────────────────────────────────────────────────────────┤
│                       Repository Script Inventory                      │
│ • Root Scripts (scripts/): 111 files across 7 domain directories       │
│ • General Scripts (scripts/general/): 56 utility & audit tools         │
│ • As-Needed Scripts (scripts/AsNeeded/): 8 allowlisted maintenance tools│
├────────────────────────────────────────────────────────────────────────┤
│                     Central Ops Dispatcher (pnpm run ops)              │
│                           scripts/run-ops.mjs                          │
│ • 149 registered commands introspected from ops-command-registry.mjs   │
│ • Windows-safe execution: shell: false for node, .cmd path resolution   │
│ • Unified logging, exit code propagation, and environment passthrough  │
├────────────────────────────────────────────────────────────────────────┤
│                  Quality & Governance Ratchet Engine                   │
│      scripts/general/check-governance.mjs & governance-baseline.json   │
│ • 6 ratcheted metrics (all baseline 0)                                 │
│ • Strictly prohibits debt escalation (--update refuses to raise values)│
│ • Enforces migration rollbacks, CSP safety, and CI portability         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout & Boundaries

The scripting system is strictly partitioned into distinct directories based on lifecycle and execution frequency:

| Directory | Count | Purpose & Invariants | Key Reference Documents |
|-----------|-------|----------------------|-------------------------|
| `scripts/` | 111 files | Primary entrypoints called directly from `package.json` scripts. Contains domain roots and subdirectories. | [`docs/architecture/scripts.csv`](file:///d:/23082026/docs/architecture/scripts.csv) |
| `scripts/general/` | 56 files | Secondary helpers, static code audits, and maintenance utilities invoked by root scripts or the ops dispatcher. | [`scripts/general/README.md`](file:///d:/23082026/scripts/general/README.md) |
| `scripts/AsNeeded/` | 8 files | Restricted tools for on-demand diagnostics, static cycles, and heavy catalog verification. | [`scripts/AsNeeded/ALLOWLIST.md`](file:///d:/23082026/scripts/AsNeeded/ALLOWLIST.md) |
| `scripts/generate-svg/` | 12 files | Standalone SVG plan symbol rasterizer and test fixtures packaged into production standalone. | `scripts/generate-svg/README.md` |
| `scripts/codemods/` | 4 files | One-off AST transformation scripts for migrations. | — |
| `scripts/lib/` | 8 files | Shared utility functions (logging, chalk, spawn wrappers, path helpers) for Node scripts. | — |

### As-Needed Directory & Allowlist Reconciliation
Inspection of `scripts/AsNeeded/` reveals 8 physical files on disk:
1. `ALLOWLIST.md`: Governing contract documentation.
2. `_audit-stale-scripts.mjs`: Scans repository for unreferenced script files.
3. `_scan-circular-imports.mjs`: AST static cycle detection across modules.
4. `audit-css-packages.mjs`: CSS dependency and import hygiene checker.
5. `audit-focss-static-defects.mjs`: Evaluates FOCSS static token/property anomalies.
6. `audit-seo-indexability.mjs`: Checks XML and HTML sitemap indexability.
7. `verify-db-svg-matrix.mjs`: Validates SVG assets against database records.
8. `verify-focss.mjs`: Canonical FOCSS structure and boundary verification (`pnpm run verify:focss`).

> [!IMPORTANT]
> **Allowlist Discrepancy Note:** [`scripts/AsNeeded/ALLOWLIST.md#L12-L20`](file:///d:/23082026/scripts/AsNeeded/ALLOWLIST.md#L12-L20) currently lists only 6 script basenames in its markdown table (+ `ALLOWLIST.md`). `audit-seo-indexability.mjs` was introduced in commit `32c0a87` and is active in the filesystem, but was omitted from the markdown documentation table. This discrepancy must be rectified during documentation cleanup.

---

## 3. Central Ops Dispatcher (`scripts/run-ops.mjs`)

The ops runner provides a single, controlled gateway for all operational tasks, invoked via `pnpm run ops <command> [-- args]`.

### Dispatcher Architecture
- **Dynamic Command Discovery:** Introspects [`scripts/ops-command-registry.mjs`](file:///d:/23082026/scripts/ops-command-registry.mjs) via `listOpsCommandNames()`.
- **Command Categories (149 total registered commands):**
  - **Database Management:** `db:apply`, `db:apply:admin`, `db:types`, `db:types:admin`, `db:test`, `db:seed`.
  - **Cloudflare & R2 Ops:** `backup:r2`, `repo:backup:r2`, `assets:cdn:sync`, `assets:r2:mirror`, `sync:r2:secrets`.
  - **Catalog & Plan Operations:** `seed:furniture`, `seed:block-descriptors`, `catalog:sync`, `symbols:rasterize`.
  - **Deployments:** `vercel:prod`, `vercel:preview`, `worker:deploy`.
- **Cross-Platform Process Safety:**
  - Direct Node executions use `child_process.spawn` with `shell: false` to ensure exact exit code preservation on Windows and Linux.
  - Windows wrappers (`.cmd`) are resolved dynamically when delegating to `pnpm` or `vercel`.

---

## 4. Governance Ratchet Engine (`check:governance`)

Governed by [`scripts/general/check-governance.mjs`](file:///d:/23082026/scripts/general/check-governance.mjs) and [`config/quality/governance-baseline.json`](file:///d:/23082026/config/quality/governance-baseline.json).

### The 6 Ratcheted Governance Invariants (Baseline: all 0)
```json
{
  "D2_npx": 0,
  "D3_dead_overrides": 0,
  "D6_nonportable_in_gate": 0,
  "P2_csp_unsafe_inline": 0,
  "P4_migration_no_rollback": 0,
  "S2_stray_report": 0
}
```

1. **`D2_npx` (No npx in package.json):** All tooling must be installed and resolved deterministically inside the `pnpm-lock.yaml`. Dynamic `npx` calls are strictly rejected.
2. **`D3_dead_overrides` (No package.json overrides):** Dependency overrides in `package.json` are ignored by pnpm; all package overrides must reside in `pnpm-workspace.yaml`.
3. **`D6_nonportable_in_gate` (Cross-Platform Portability):** Forbids invoking `pwsh` or `python` inside gate or test commands because CI runners execute on `ubuntu-latest`.
4. **`P2_csp_unsafe_inline` (CSP Security):** Prohibits `'unsafe-inline'` inside `script-src` in [`site/proxy.ts`](file:///d:/23082026/site/proxy.ts) for production environments.
5. **`P4_migration_no_rollback` (Mandatory Migration Rollback):** Asserts every SQL migration file in `site/platform/supabase/migrations` and `migrations.admin` defines a `-- rollback` or `-- down` section.
6. **`S2_stray_report` (Plan Cleanliness):** Prohibits stray Markdown audit reports or dump files matching `/(report|handover|outstanding|finish-plan|completion-contract)/i` under `plans/` (only `README.md` and authorized plans are exempt).

### Ratchet Anti-Escalation Mechanism
- If current findings exceed the baseline, the script terminates with exit code 1.
- Running `check:governance --update` **strictly refuses to increase debt** (`check-governance.mjs#L148-L156`).
- Updating the baseline downwards (locking in improvements) requires explicit authorization via `--confirm` or the environment variable `GOVERNANCE_BASELINE_CONFIRM=1`.

---

## 5. Verification & Operational Runbook

### Authorized Script & Governance Commands
```bash
# Verify repository governance against baseline
pnpm run check:governance

# Verify directory layout and forbidden files
pnpm run check:layout

# Scan repository for leaked credentials or tokens
pnpm run scan:secrets

# List all 149 registered ops commands
pnpm run ops:list

# Execute database migration dry-run via ops dispatcher
pnpm run ops db:apply -- --dry
pnpm run ops db:apply:admin -- --dry
```

### Script Development Rules
1. Never commit a new `.mjs` script into `scripts/AsNeeded/` without simultaneously adding its entry and rationale to [`scripts/AsNeeded/ALLOWLIST.md`](file:///d:/23082026/scripts/AsNeeded/ALLOWLIST.md) and [`docs/architecture/scripts.csv`](file:///d:/23082026/docs/architecture/scripts.csv).
2. All Node scripts must support Windows paths using `path.resolve` or `fileURLToPath` and avoid hardcoded POSIX forward slashes in filesystem operations.
3. Every database migration must include a rollback block before running `pnpm run check:governance`.

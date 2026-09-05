# Test Results & Artifact Storage Architecture Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`results/`](file:///d:/23082026/results/) and [`tests/`](file:///d:/23082026/tests/)  
**Method:** Live file inspection of `.gitignore` storage rules, `scripts/general/generate-docs.mjs`, and results persistence checks.

---

## 1. Storage Tier Architecture

To maintain a clean git history and prevent repository bloat, test artifacts follow a dual-tier persistence model:

| Storage Tier | Directory | Git Tracking | Lifecycle & Artifact Contents |
| :--- | :--- | :--- | :--- |
| **Tier 1: Ephemeral Evidence** | `results/` | Gitignored (`results/*`, `!results/.gitkeep`) | Raw Vitest JSON output, test runner timings, coverage HTML reports. |
| **Tier 1b: Browser Artifacts** | `test-results/` | Gitignored (`test-results/`) | Playwright failure screenshots, video recordings, and trace zips. |
| **Tier 2: Durable Inventories** | `tests/INVENTORY.md` | Tracked in Git | Canonical census of tests, line counts, and directory distribution. |
| **Tier 3: Actionable Plans** | `plans/` | Tracked in Git | Audits, execution runbooks, and operator guidance. |

---

## 2. Core Governance Rules (Per `AGENTS.md §1` & `§8`)

1. **No Hand-Written Markdown in `results/`:**
   `results/` is strictly for machine-generated execution data. Placing manual Markdown files or audit writeups under `results/` is a governance violation tracked by `check:governance` metric `S2_stray_report`.
2. **Gitignored Ephemeral Outputs:**
   `.gitignore` ensures raw execution results are never committed to the repository tree.

---

## 3. The CI Diff-Ratchet Mechanism (`docs:check`)

In [`scripts/general/generate-docs.mjs`](file:///d:/23082026/scripts/general/generate-docs.mjs), the release gate enforces documentation currency:

```javascript
const TRACKED = ["tests/INVENTORY.md"];

for (const rel of TRACKED) {
  const diff = spawnSync("git", ["diff", "--exit-code", "--", rel], { stdio: "inherit" });
  if (diff.status !== 0) {
    console.error(`Generated document ${rel} is out of date. Run 'pnpm run docs:sync' and commit.`);
    process.exit(1);
  }
}
```

Whenever a developer adds, renames, or deletes a test file, running `pnpm run docs:sync` regenerates `tests/INVENTORY.md`. If this change is uncommitted, `pnpm run docs:check` will fail the release gate.

---

## 4. Verification Commands

```powershell
# 1. Clean local test results artifacts
pnpm run test:clean

# 2. Check if generated test docs are in sync with git tree
pnpm run docs:check

# 3. Synchronize test inventory docs with latest test count
pnpm run docs:sync
```

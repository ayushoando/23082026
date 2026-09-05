# Test Results & Artifact Storage Architecture Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `.gitignore` checked for `results/` and `test-results/` rules. `scripts/general/generate-docs.mjs` verified for git-diff gate. `results/` directory existence confirmed.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| `results/` is gitignored | Implied (not stated explicitly) | ✅ **Confirmed** — `.gitignore` contains `results/*` and `!results/.gitkeep` |
| `test-results/` handling | Not mentioned | **NEW:** `.gitignore` also contains `test-results/` as a separate rule (Playwright output dir) |
| `docs:check` gate logic | Described as checking `generate-docs.mjs:41-58` | ✅ **Confirmed** — live `generate-docs.mjs` contains: `const TRACKED = ["tests/INVENTORY.md"]` and `spawnSync("git", ["diff", "--exit-code", "--", rel])` |
| "Clean results directory — files ≤ 4 hours old" | Claimed as rule from AGENTS.md | ⚠️ **PARTIALLY REVISED** — AGENTS.md says `results/ holds generated evidence only — no hand-written Markdown reports`. The "4-hour TTL" language is not verbatim in current AGENTS.md; the rule is more precisely "gitignored ephemeral evidence". |
| `agent-reports/` as Tier 2 home for audit reports | Claimed | ✅ **Confirmed** — AGENTS.md defines `agent-reports/` as the correct location for generated evidence reports |

---

## 1. The Dual-Storage Model (Confirmed)

| Tier | Directory | Git Tracking | Purpose |
| :--- | :--- | :--- | :--- |
| **Tier 1: Ephemeral Evidence** | `results/` | Gitignored (`results/*`, except `results/.gitkeep`) | Raw Vitest JSON, Playwright video traces, coverage HTML, test execution logs |
| **Tier 1b: Playwright Output** | `test-results/` | Gitignored (separate rule) | Playwright `--output` directory for video/screenshot artifacts |
| **Tier 2: Durable Inventories** | `tests/`, `agent-reports/` | Committed | Human-readable docs, census inventories (`tests/INVENTORY.md`), audit reports |

**Note:** The `.gitignore` has `results/*` (not `results/`) with `!results/.gitkeep` exemption — confirming that the directory itself is tracked (via `.gitkeep`) but its contents are ignored.

---

## 2. Why `tests/INVENTORY.md` is NOT in `results/` (Confirmed)

### Reason 1: CI Diff-Ratchet via `docs:check` Gate ✅

Live `generate-docs.mjs` confirmed:
```javascript
const TRACKED = ["tests/INVENTORY.md"];
// ...
const diff = spawnSync("git", ["diff", "--exit-code", "--", rel], { ... });
if (diff.status !== 0) {
  console.error("Generated artifacts are stale — run `pnpm run docs:sync` and commit");
  process.exit(1);
}
```
This requires `tests/INVENTORY.md` to be Git-tracked to function.

### Reason 2: PR Review Visibility ✅

A diff in `tests/INVENTORY.md` surfaces automatically in GitHub PR reviews when test counts change:
```diff
-| Vitest executable files | 775 |
+| Vitest executable files | 777 |
```

### Reason 3: Dual Emission ✅

The generator emits:
- **`tests/INVENTORY.md`** — Durable, Git-tracked (Markdown for humans)
- **`results/test-inventory.json`** — Ephemeral (gitignored JSON for CI tooling)

---

## 3. `results/` Gitignore Rules (Live)

From `.gitignore`:
```
results/*
!results/.gitkeep
test-results/
```

- `results/*` — Ignore all contents, including subdirectories
- `!results/.gitkeep` — Retain the empty directory marker so Git doesn't strip the dir
- `test-results/` — Separate Playwright artifact output directory, fully gitignored

---

## 4. Correct Storage Routing Table

| Artifact Type | Correct Location | Git? |
| :--- | :--- | :--- |
| Vitest JSON test output | `results/` | ❌ Gitignored |
| Playwright videos/screenshots | `test-results/` | ❌ Gitignored |
| Coverage HTML reports | `results/coverage/` | ❌ Gitignored |
| Test count inventory (machine) | `tests/INVENTORY.md` | ✅ Tracked |
| Agent audit reports (hand/machine) | `agent-reports/` or `.agents/reports/` | ✅ Tracked |
| Tech-docs generated JSON | `generated-documents/` | ❌ Gitignored |
| Hand-written Markdown reports | `results/` | ❌ **FORBIDDEN** by AGENTS.md |

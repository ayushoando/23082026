# Package & Dependency Audit Plan

**Created:** 2026-08-31
**Status:** Audit complete, 3-wave remedy plan ready for execution
**Owner:** Repository owner

## Documents

| Document | Purpose |
|---|---|
| [`package-audit-report.md`](./package-audit-report.md) | Full audit: 49 deps + 27 devDeps — vulnerabilities, dead packages, usage analysis, version hygiene |
| [`remedy-plan.md`](./remedy-plan.md) | 3-wave fix plan with exact commands, diffs, and verification steps |

## Key Findings

### Remove immediately (zero imports confirmed)
- **`use`** v3.1.1 — Accidental install. Not React's `use()` hook. Zero imports.
- **`corepack`** v0.35.0 — Node.js built-in, not a project dependency. `packageManager` field already handles this.
- **`pnpm`** v11.24.0 — Declared as both `packageManager` AND dependency. Redundant ~30MB.

### Security (3 vulnerabilities, all transitive)
- **HIGH:** sharp <0.35.0 via `@lancedb/lancedb` → Fix with pnpm override
- **MODERATE:** esbuild ≤0.24.2 via `drizzle-kit` → Fix with pnpm override
- **LOW:** `@ai-sdk/provider-utils` ≤3.0.97 via `@mastra/core` → Monitor

### Replaceable
- **`axios`** v1.20.0 — 1 import in entire codebase (`studioApi.ts`). Replace with native `fetch`.

### Outdated
- 17 packages behind by minor/patch versions. `pnpm update` resolves all.

## Remedy Timeline

| Wave | What | Effort | Risk |
|---|---|---|---|
| Wave 1 | Remove 3 dead packages + move polygon-clipping to dev | 30 min | Zero |
| Wave 2 | pnpm overrides for CVEs + `pnpm update` | 1-2 hours | Low |
| Wave 3 | Replace axios, align framer-motion, standardize pinning | 2-3 hours | Medium |

## Data Sources
- `pnpm outdated` — 17 packages behind
- `pnpm audit` — 3 vulnerabilities (1 high, 1 moderate, 1 low)
- `pnpm ls --depth 0` — 109 packages across 2 workspaces
- Import grep analysis — every dependency checked for actual usage

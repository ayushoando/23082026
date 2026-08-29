# scripts/AsNeeded — allowlist

**Purpose:** One-shot tools and explicitly allowlisted specialized validators.
**Rule:** Only basenames listed here may live under `scripts/AsNeeded/`; a listed validator may be a package-gate dependency, including `verify-focss.mjs` for `verify:focss`.

```powershell
node scripts/AsNeeded/<name>
```

## Allowlist (basenames)

| Basename | Kind | Notes |
|----------|------|--------|
| `_audit-stale-scripts.mjs` | audit | Find dead script refs |

| `_scan-circular-imports.mjs` | audit | Static import cycle scan |
| `audit-css-packages.mjs` | audit | Broken imports / unreferenced CSS |
| `audit-focss-static-defects.mjs` | audit | Read-only FOCSS custom-property, selector, reduced-motion, and orphan-style audit (`--json` for machine output) |
| `verify-focss.mjs` | verify | Canonical FOCSS structure, imports, fences, and module graph (`verify:focss`; `--scope=<name>`) |
| `verify-db-svg-matrix.mjs` | verify | DB/SVG matrix (`verify:db-svg`) |

## Do **not** put here

- Root package script entrypoints or unallowlisted package-gate dependencies; intentionally allowlisted specialized validators, including `verify-focss.mjs` for `verify:focss`, are permitted.
- `generate-svg.mjs` / `generate-svg/*`
- `scripts/general/*`
- Probe / one-shot diagnostics (do not reintroduce under root `scripts/` unless gated)

## Cleaned 2026-07-28

Deleted ~77 spent `probe-*` / `diag-*` / one-shot `verify-*` from this folder (pass3/pass4 waves, design/motion audits, media rescue, C4 diags). Not archived — deleted per task.

**Pass 2 (root):** deleted `scripts/fix_and_reseed.ts` (+ name-mirror test; dropped from `test:priority-7`) and gitignored `scripts/tsconfig.tsbuildinfo`.

**Pass 3 (2026-08-02):** deleted root one-shots (`live_openrouter_failover_stress`, `recovery-*`, `audit-hosted-runtime`, `audit-hardcoded-detail`, `audit-tsx-hardcoded`) and AsNeeded `copy-i18n-messages-from-20072026` / `probe-focss-browser-parity`. Kept coverage/SVG/e2e helpers that are imported or name-mirrored.

**Pass 4 (2026-08-18):** deleted 58 unwired one-shots (flatten/brighten/delete/merge/r2-nuke/temp_check) and session AsNeeded extract/sweep/orphan finders. Ops-wired R2/db/gate scripts kept.

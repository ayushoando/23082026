# 20 — Scripts, Governance & Prioritized Recommendations

## Script inventory

- **`scripts/` root (105 files):** mixed bag with many one-off/recovery names — `audit-disk-image-twins.mjs`, `delete-twin-images.mjs`, `five-majors-hash-dedup.mjs`, `merge-recovery-into-majors.mjs`, `planner-lift-project-trees.mjs`, `ui-polish-pass1-audit.mjs`, plus one-off `.ps1`/`.py`. Mitigant: `scripts/run-ops.mjs` + `ops-command-registry.mjs` provide a command registry and many are wired into `package.json`. **Orphan risk is real for unregistered one-offs** — Low-med.
- **`scripts/general/` (54 files):** curated, gate-wired set. 6 Python helpers, none gate-reachable (consistent with `D6_nonportable_in_gate: 0`).
- **`scripts/AsNeeded/` (8 files):** self-documenting with `ALLOWLIST.md` + own hygiene tools (`_audit-stale-scripts.mjs`, `_scan-circular-imports.mjs`); `verify-focss.mjs` is in the gate.
- **`scripts/site-ui-content-links-audit/` (25-file wave framework):** the two untracked files (`wave3-partitions.ts`, `wave5-reconcile.ts`) are load-bearing — see report 04. HIGH if untracked.

## Governance ratchet

`scripts/general/check-governance.mjs` + `config/quality/governance-baseline.json`: well-built — 6 rules, fails only when counts *rise* over baseline, `--update` rewrites. Current baseline:

| Rule | Count | Status |
|---|---|---|
| `D2_npx` | 0 | clean |
| `D3_dead_overrides` | 0 | clean |
| `D6_nonportable_in_gate` | 0 | clean |
| `P2_csp_unsafe_inline` | 0 | clean |
| **`P4_migration_no_rollback`** | **8** | 8 migrations under `site/platform/supabase/migrations{,.admin}` lack `-- rollback`/`-- down` markers — accepted debt worth retiring |
| **`S2_stray_report`** | **22** | 22 report-like `.md` in `plans/`' 16 subdirectories |

| # | Severity | Finding |
|---|----------|---------|
| 20.1 | Med | Two nonzero ratchets are live debt (P4: 8 rollback-less migrations; S2: 22 stray reports incl. `plans/comprehensive-code-review-report.md` at `plans/` root). |
| 20.2 | Low | `--update` is a single command that can silently launder an increase into the baseline. |

## tech-docs-generator — LOW severity

Proper workspace package `oando-tech-docs` (own package.json, vite/vitest configs, own vercel.json, 13 pages, 55 scripts modules, own test lane). `generate-all.mjs` works well: wipe `generated-documents/` + staging → `buildGeneratorModel` → parity check → surface validation → repository graph + blast-radius reports + repository-map render; in-process queue prevents overlapping regens; failure throws → gate fails. Duplication with root scripts: (a) same-named `generate-coverage-report.mjs` in both `scripts/` and `tech-docs-generator/scripts/` (name-collision trap); (b) root `package.json` reaches into tech-docs internals (`test:audit:fake-test`, `graph:page-components`); (c) capability overlap with root audit scripts (route extraction, sitemap health). All low-med — worth a boundary doc.

## Consolidated prioritized recommendations

1. **HIGH** — Commit `scripts/site-ui-content-links-audit/wave3-partitions.ts` + `wave5-reconcile.ts` (repo doesn't build from clean clone without them).
2. **MED** — Wire `sanitizeSvg` into the Studio furniture upload path (or `Content-Disposition: attachment` / separate origin) — report 08.
3. **MED** — Add `scan:secrets` to `release:gate:fast` — report 09.
4. **MED** — Retire legacy `site/data/storage/` (user-confirmed deletion, git-recoverability check first) + forbid in `check-repo-layout.mjs` + fix stale tech-docs pages — report 04.
5. **MED** — De-hardcode `VERCEL_ORIGIN` in the worker; move SKU/material slug tables out of worker code — report 12.
6. **HIGH/MED** — Split `Planner.tsx`; reconcile fork drift (StudioToast a11y, IconButton behavior) — reports 03/17.
7. **MED** — Add route-level `error.tsx` under admin/ooplanner/oostudio — report 17.
8. **MED** — Document or collapse the redirect destination overrides; re-evaluate production-unoptimized images — report 19.
9. **MED** — Bundle diet: dynamic-import gsap per-view, jspdf/fabric at export time — report 17.
10. **MED** — Governance: add `-- rollback` to the 8 migrations; triage the 22 stray reports in `plans/`.
11. **LOW** — i18n: route workspace chrome strings through the `workspace` namespace; fix `deliveryMedia` hi/en content drift — report 15.
12. **LOW** — Remove dead code (user-confirmed): `ServiceWorkerRegister.tsx`, `home/Hero.tsx`; drop the likely-unused root `react-router-dom` — reports 05/19.
13. **LOW** — Env contract: declare the ad-hoc `process.env` consumers in `env.server.ts` schema — report 09.
14. **LOW** — Docs: add the 2 missing `/tools/*` pages to `docs/architecture/routes.md` — report 02.

---

*Evidence boundary: static source audit only. No gates, tests, or browser checks were run (owner-gated per repo rules). All paths verified against disk at audit time.*

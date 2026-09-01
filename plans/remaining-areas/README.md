# Remaining Audit Areas — Backlog

Created 2026-09-01 as part of the plans/audit program. **List only — none of these have been started.** Each needs its stated prerequisite before work begins.

| Area | What an audit would cover | Needs |
|------|---------------------------|-------|
| 1. Runtime verification pass | git status (untracked wave3/wave5 files), gates, two-lane tests, scan:secrets | Owner-authorized commands (`pnpm run gate:fast`, `pnpm run test`) |
| 2. CVE / dependency currency | `pnpm audit` + `pnpm outdated` (1,023 packages) | Network access + owner go-ahead |
| 3. Real bundle-size measurement | gsap/jspdf/fabric findings are import-graph based; needs real `.next` output analysis | Owner-authorized `build:site` |
| 4. Browser / a11y / visual evidence | axe beyond 4 surfaces, visual baselines (0 on disk vs 216 expected), Lighthouse | Dev server + Playwright, owner-gated |
| 5. Live database state | RLS verification, archived block_themes reads, missing rate_limits table, SEC-R08 migration apply | `db:test` + dry-runs, owner-gated |
| 6. Git-history orphan dating | 105 root scripts one-offs, specs/ abandonment, plans contradiction ages | git log access |
| 7. Data quality in live Supabase | furniture_catalog, plans, price books contents | DB access, owner-gated |
| 8. i18n translation quality (hi) | Parity is gated; semantic accuracy of hi strings is not audited | Static reads + translator review |
| 9. Canvas algorithm correctness | Fabric serialization round-trip, snap math, DXF geometry fidelity, polygon clipping | Property tests + runtime; partially covered by report 28, algorithmic proofs outstanding |
| 10. Worker live behavior | HSTS header verification blocked by CF-TOKEN-01 (Failures.md) | Owner token rotation, then worker:deploy + curl checks |
| 11. CI runtime evidence | Workflows read (report 26) but never observed green/red | Push/PR observation or act run, owner-gated |
| 12. SEO rendered-HTML audit | The repo's own `--html` mode over built output (static source audit passed, rendered evidence outstanding) | Build + script run |

None of these have been started. Each needs the stated prerequisite before work begins.

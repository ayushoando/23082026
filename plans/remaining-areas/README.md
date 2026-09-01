# Remaining Audit Areas — Backlog

Updated 2026-09-01. **List only — none of these have been started.** Each needs its stated prerequisite before work begins.

Recently covered (reports 30–33): git-history orphan dating, CVE/dependency currency (pnpm audit), i18n hi translation quality, canvas algorithm correctness.

| Area | What an audit would cover | Needs |
|------|---------------------------|-------|
| 1. Runtime verification pass | Gates, two-lane tests, scan:secrets execution | Owner-authorized commands (`pnpm run gate:fast`, `pnpm run test`) |
| 2. Real bundle-size measurement | gsap/jspdf/fabric findings are import-graph based; needs real `.next` output analysis | Owner-authorized `build:site` |
| 3. Browser / a11y / visual evidence | axe beyond 4 surfaces, visual baselines (0 on disk vs 216 expected), Lighthouse | Dev server + Playwright, owner-gated |
| 4. Live database state | RLS verification, archived block_themes reads, missing rate_limits table, SEC-R08 migration apply | `db:test` + dry-runs, owner-gated |
| 5. Data quality in live Supabase | furniture_catalog, plans, price books contents | DB access, owner-gated |
| 6. Worker live behavior | HSTS header verification blocked by CF-TOKEN-01 (Failures.md) | Owner token rotation, then worker:deploy + curl checks |
| 7. CI runtime evidence | Workflows read (report 26) but never observed green/red | Push/PR observation or act run, owner-gated |
| 8. SEO rendered-HTML audit | The repo's own `--html` mode over built output (static source audit passed, rendered evidence outstanding) | Build + script run |

None of these have been started. Each needs the stated prerequisite before work begins.

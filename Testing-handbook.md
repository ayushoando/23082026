# Testing handbook

Use this handbook to choose and report validation evidence without overstating what a result proves. Before running anything, work from the repository root, obtain current-session authorization for the exact command, and confirm that the enabled pre-execution hook permits it.

Canonical sources: the [process floor](./AGENTS.md), root `package.json`, [active blockers](./Failures.md), [benchmark definitions](./docs/governance/benchmarks.md), and the [agent testing workflow](./Agents/02-testing.md).

## Rules

- Fresh output only. Old `results/` prove nothing. Unit ≠ browser.
- No hidden skips / forced clicks. Name timeout causes.
- Don’t mutate real catalog data; clean up always.
- `pnpm` from root. Output → `results/` only.

**Report:** command · cwd · scope · exit · not verified · blockers.  
**Browser +:** route · journey · console · failed requests · a11y · traces.

## Commands

| | `pnpm run …` |
|--|-------------|
| Layout / docs | `check:layout` · `check:docs-all` · `docs:check:root-links` |
| Types | `typecheck` · `typecheck:tests` · `typecheck:scripts` (currently configured; no result inferred) |
| Tests / gates | `test` (**2 lanes**) · `p0:unit` · `test:priority-7` · `test:priority-8` · `gate` · `release:gate` |
| Coverage | `test:coverage` · `test:coverage:site` · `test:coverage:admin` · `ops test:coverage:inventory` |
| E2E / a11y | `test:planner-catalog` · `test:a11y` |
| Audits | `test:audit:hollow` · `test:audit:gate-skips` · `test:audit:api-routes` · `test:audit:fake-test` |
| Fork / CSS | `scan:boundaries` · `verify:focss` · `lint:ui:strict` · `check:style-tokens` · `check:composer-styles` |
| DB / deploy / R2 | `db:apply` · `db:test` · `vercel:prod` · `worker:deploy` · `r2:backup` · `ops:list` |

Lint: `lint` (oxlint) · `lint:ui:strict`. DOM: **happy-dom**.  PowerShell stderr ≠ fail — trust the exit code.

### Two lanes

`pnpm run test` = default + tech-docs lanes. Check **both**:

```text
results/tests/vitest-results.json
results/tests/vitest-tech-docs-results.json
```

```powershell
pnpm exec vitest run --config tests/vitest.config.ts <file>
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts
pnpm exec playwright test -c config/build/playwright.config.ts <spec> --reporter=list
pnpm --filter oando-tech-docs test
```

Vitest `root` = `site/` → `cwd` inside tests is under `site/`. Harness: `config/build/`.

### Quality floor

- **No empty lane:** every lane in `results/tests/summary.json` must have `total > 0` and `failed = 0`. A lane with `total = 0`, or a missing lane, is a **failure**, not a pass.
- **Assertion floor:** `test:audit:hollow` (zero-`expect`, `expect(true)`, sole `toBeTruthy`, empty `catch {}`). Also reject empty `it("…", () => {})` bodies, an `expect(...)` with no matcher, and a `.skip`-only file — those hide problems instead of verifying.
- **Determinism:** re-run `pnpm run test`; per-lane `passed/failed` must be identical. Different ⇒ flaky ⇒ [`Failures.md`](./Failures.md).
- **Regression guard:** a closed defect's reproduction test stays in the suite, so reintroducing it re-fails.

## Live DB (skips if env missing)

| Suite | Env |
|-------|-----|
| `plannerHandoffsRlsPolicy` | `SUPABASE_AUTH_DATABASE_URL` |
| `serviceRoleOnlyTables.db` | + `PRODUCTS_DATABASE_URL` |
| `*.supabase.db.smoke` | `NEXT_ADMIN_SUPABASE_URL` + `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |

## Persistence in tests

Vitest sets `DEV_AUTH_BYPASS: "true"` — not `"1"` — so `withAuth` gates run for real **and** both persistence selectors resolve to `supabase`. A route test that mocks only the disk helpers will reach the network. Disk-path contract tests must pin the mode with `vi.mock` on `plannerPersistenceMode` / `furnitureCatalogMode`.

> **Production hazard:** the production filesystem is read-only. Disk-mode mock tests prove nothing about the live write path. For every mutating route, provide both a disk-mode test and a Supabase-mode test.

Disk tests mock:

```ts
vi.mock("@planner/lib/plannerPersistenceMode", () => ({
  getPlannerPersistenceMode: () => "disk",
  isPlannerPersistenceConfigured: () => true,
}));
```

Don’t assign `process.env.NODE_ENV` — pass env bags.

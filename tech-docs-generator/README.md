# Tech-docs generator

A **source-driven inventory SPA** (Vite), separate from the product runtime — `site/` does not import it. It is still required by monorepo `pnpm run build` (the `build:tech-docs` step), so a red `tech-docs:gate` blocks neither the product build nor a ship unless `Failures.md` says otherwise.

- Aligned with [`docs/architecture/stack.md`](../docs/architecture/stack.md) §1–2 and [`docs/architecture/product-map.md`](../docs/architecture/product-map.md) § Tech-docs.
- **Inventory SPA only.** Not a fact authority — that is `docs/`. Blockers: root [`Failures.md`](../Failures.md) only. Gate truth: fresh `pnpm run tech-docs:gate`.

## Generated output is disposable

Every `generate` / gate run:

1. **deletes** all of `generated-documents/` (docs, data, site)
2. **writes fresh** docs + data (no `.tmp` staging for those trees)
3. fails non-zero if generation fails
4. Vite rebuilds `generated-documents/site` (`emptyOutDir`)

No “keep last good tree.” Coverage / cache live under `results/tooling/tech-docs/`.

`generated-documents/` is regenerated each run and not committed, so there is no stale tree to chase — every run is fresh.

Gate order: **generate → validate surfaces → hardcoding guard → fake-test audit → theme alignment → typecheck → build site → publish → coverage** (`scripts/gate.mjs`).

## Commands (repo root)

Install only from the monorepo root — never inside this package.

| Need | Command |
|------|---------|
| Dev SPA | `pnpm run tech-docs:dev` → http://localhost:3001/tech-stack |
| CI gate | `pnpm run tech-docs:gate` |
| Regenerate + validate + parity | `pnpm run ops tech-docs:generate` |
| Standalone regen + validate | `pnpm run ops tech-docs:check` |
| Package tests | `pnpm --filter oando-tech-docs test` |
| Root vitest lane | `pnpm run ops test:tech-docs` |

| App | Command | Port |
|-----|---------|------|
| Product (Next) | `pnpm run dev` | **3000** |
| Tech-docs (Vite) | `pnpm run tech-docs:dev` | **3001** (strict; never fall back to 3000) |

Admin **System → Architecture docs** is an external link via `site/lib/admin/techDocsUrl.ts` (`NEXT_PUBLIC_TECH_DOCS_URL` in prod). Root `pnpm run build` runs `build:site` **and** `build:tech-docs`.

## Tests

Specs live under `tests/tech-docs-generator/` — the **second lane** of `pnpm run test`. Check both lane summaries (or `results/tests/vitest-tech-docs-results.json`). The lane is serial and slow by design (per-file `testTimeout: 120_000`); a short probe timeout is not a failure signal.

```bash
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts
```

`tech-docs:gate` is stricter than the dual-lane root `test` alone.

## CSS

`src/styles/` (imported by `src/index.css`) — **not** FOCSS; do not move it into `site/focss/`. See [`docs/governance/focss-stop-drift.md`](../docs/governance/focss-stop-drift.md).

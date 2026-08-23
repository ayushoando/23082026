# Doc map

What lives where, and what wins. Keep this up to date when you add or move a doc.

## Authority

```
user  >  live code + fresh commands  >  AGENTS.md  >  Agents/  >  docs/**
```

- Docs are not proof. `results/` is never PASS.
- Blockers live only in **`Failures.md`**.
- Code beats docs — fix the doc, don't delete the code.

## Placement

| Kind | Where |
|------|--------|
| Durable facts (stack, routes, schema, rules, benchmarks) | `docs/**` — see tree below |
| Execution/how-to procedures | root docs (`OPERATIONS_RUNBOOK.md`, `Testing-handbook.md`) |
| Coordination (active plan) | [`plans/PLAN.md`](./plans/PLAN.md), [`plans/README.md`](./plans/README.md) |
| Evidence | `results/**` (txt/json only) |
| Blockers | `Failures.md` |
| Session agent rules | `Agents/**` |

## Layers

| Layer | Role |
|-------|------|
| Root | Front doors — `START.md`, `README.md`, `CONTENTS.md` |
| `Agents/` | Session handbooks ([`INDEX`](./Agents/INDEX.md)) |
| `docs/` | Durable reference (13 files) |
| `.github/` | JIT instructions + skills |
| `.archive/` | Retired — never authority |
| Runtime constraints | [`AGENTS.md`](./AGENTS.md) §5 — read-only production contract |

## Root files

| File | For |
|------|-----|
| [`START.md`](./START.md) | First read / onboarding |
| [`package.json`](./package.json) `scripts` | Authoritative command names — root docs must match |
| [`CONTENTS.md`](./CONTENTS.md) | Full index |
| [`README.md`](./README.md) | Product + platform facts + checks |
| [`AGENTS.md`](./AGENTS.md) | Process floor (non-negotiable) |
| [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) | Deploy · migrate · seed · rollback |
| [`Testing-handbook.md`](./Testing-handbook.md) | Testing (two vitest lanes) |
| [`Failures.md`](./Failures.md) | Open blockers only |
| [`owners.md`](./owners.md) | Code and document ownership map |
| [`ORIGINAL_REQUEST.md`](./ORIGINAL_REQUEST.md) | Authoritative record of user requests and requirements |

## Durable docs (`docs/`)

See [`docs/README.md`](./docs/README.md) for the full 13-file table. Highlights:

| Topic | Home |
|-------|------|
| Repo layout / stack / routes / css | `docs/architecture/{layout,stack,routes,css}.md` |
| Product placement + tech-docs | `docs/architecture/product-map.md` |
| Database (schema, drizzle, ops) | `docs/database/*` |
| Rules / benchmarks / charter / css-debt | `docs/governance/{rules,benchmarks,charter,focss-stop-drift}.md` |
| Security facts (CSP, mutators) | `docs/governance/rules.md` |

## Don't mix

| | Session | Programme | Evidence |
|--|---------|-----------|----------|
| Folder | `Agents/` | `plans/` (coordination) | `results/` |

## Checks

```bash
pnpm run check:docs-all
pnpm run docs:check:root-links
```

## Add a doc

1. Prefer edit over add.
2. Durable fact → `docs/`. Procedure → root doc. Evidence → `results/`.
3. Add a row to [`CONTENTS.md`](./CONTENTS.md) and this map.
4. Run the checks above.

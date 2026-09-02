# Documentation map

This map defines where repository documentation belongs and which source controls when claims conflict. Use it before adding or moving documentation.

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
| Coordination and active plans | [`plans/PLAN.md`](./plans/PLAN.md); index [`plans/README.md`](./plans/README.md) |
| Generated evidence | `results/**` (machine-generated output; not authority) |
| Blockers | `Failures.md` |
| Session agent rules | `Agents/**` |

## Layers

| Layer | Role |
|-------|------|
| Root | Front doors — `START.md`, `README.md`, `CONTENTS.md` |
| `Agents/` | Session handbooks ([`INDEX`](./Agents/INDEX.md)) |
| `docs/` | Durable reference (14 files) |
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

## Durable docs (`docs/`)

See [`docs/README.md`](./docs/README.md) for the full 14-file table. Highlights:

| Topic | Home |
|-------|------|
| Repo layout / stack / routes / css / sitemap | `docs/architecture/{layout,stack,routes,css,sitemap}.md` |
| Scripts catalog, commands, and documentation sources | `docs/architecture/scripts.md` |
| Product placement + tech-docs | `docs/architecture/product-map.md` |
| Database (schema, drizzle, ops) | `docs/database/*` |
| Rules / benchmarks / charter / css-debt | `docs/governance/{rules,benchmarks,charter,focss-stop-drift}.md` |
| Security facts (CSP, mutators) | `docs/governance/rules.md` |

## Don't mix

| | Session | Programme | Evidence |
|--|---------|-----------|----------|
| Folder | `Agents/` | `plans/` (coordination) | `results/` |

## Validation commands

**Authorization required:** run these test-like documentation checks only when the current user authorizes the exact command and the enabled pre-execution hook permits it. If unrun, report them as pending rather than passed.

```bash
pnpm run check:docs-all
pnpm run docs:check:root-links
```

## Add a doc

1. Prefer edit over add.
2. Durable fact → `docs/`. Procedure → root doc. Evidence → `results/`.
3. Add a row to [`CONTENTS.md`](./CONTENTS.md) and this map.
4. Run the checks above.

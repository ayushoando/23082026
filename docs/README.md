# Durable documentation index

Use this index to find architecture, database, and governance references that should remain stable across individual tasks. Authority order: user instruction > live code and fresh command output > [`AGENTS.md`](../AGENTS.md) > [`Agents/`](../Agents/INDEX.md) > this tree.

> **Production filesystem is read-only.** Runtime writes use mode-aware wrappers.
> See [`AGENTS.md`](../AGENTS.md) §5.

| | |
|--|--|
| New | [`../START.md`](../START.md) |
| Index | [`../CONTENTS.md`](../CONTENTS.md) · [`../DOC-MAP.md`](../DOC-MAP.md) |

## Find it

| Need | Open |
|------|------|
| Where code goes / source pointers / tech-docs | [`architecture/product-map.md`](./architecture/product-map.md) |
| Stack (Node, Next, FOCSS, packages) | [`architecture/stack.md`](./architecture/stack.md) |
| Pages + API | [`architecture/routes.md`](./architecture/routes.md) |
| Site map (all surfaces, redirects, boundaries) | [`architecture/sitemap.md`](./architecture/sitemap.md) |
| CSS | [`architecture/css.md`](./architecture/css.md) · [`governance/focss-stop-drift.md`](./governance/focss-stop-drift.md) |
| Scripts and command authorities | [`architecture/scripts.md`](./architecture/scripts.md) · [catalog CSV](./architecture/scripts.csv) · [staleness CSV](./architecture/scripts-stale-review.csv) |
| Schema | [`database/schema.md`](./database/schema.md) |
| Drizzle wiring | [`database/drizzle.md`](./database/drizzle.md) |
| DB ops (modes, seed, restore) | [`database/ops.md`](./database/ops.md) |
| Programme rules | [`governance/rules.md`](./governance/rules.md) |
| Charter / benchmarks | [`governance/charter.md`](./governance/charter.md) · [`governance/benchmarks.md`](./governance/benchmarks.md) |
| Deploy | [`../OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) |
| Security (CSP, mutators) | [`governance/rules.md`](./governance/rules.md) |
| Tech-docs package | [`../tech-docs-generator/README.md`](../tech-docs-generator/README.md) |
| Blockers | [`../Failures.md`](../Failures.md) |

## Layout (14 files including this index)

| Path | Owns |
|------|------|
| `architecture/layout.md` | Repository directory map (top-level + `site/`) |
| `architecture/scripts.md` | Command authorities, script references, and documentation map |
| `architecture/product-map.md` | Placement, Studio→Planner, source pointers, tech-docs |
| `architecture/stack.md` | Toolchain, workspace, FOCSS-on-Tailwind, package truth |
| `architecture/routes.md` | Page + API inventories |
| `architecture/sitemap.md` | Whole-site surface map, redirect register, system boundaries |
| `architecture/css.md` | FOCSS zones |
| `database/schema.md` | Tables, RLS, archive |
| `database/drizzle.md` | Two DBs, Drizzle vs Supabase JS, mermaid |
| `database/ops.md` | Modes, advisors, seed, restore |
| `governance/rules.md` | Programme rules + enforcement |
| `governance/charter.md` | Locked decisions |
| `governance/benchmarks.md` | Measurable bars |
| `governance/focss-stop-drift.md` | CSS debt ratchet |

Evidence → `results/`. Blockers → [`../Failures.md`](../Failures.md).

Session rules: [`../Agents/INDEX.md`](../Agents/INDEX.md) beats governance restatements.

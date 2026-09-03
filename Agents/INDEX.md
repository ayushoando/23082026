# Agent handbook index

Use this index to load only the session handbook relevant to the current task. The root [process floor](../AGENTS.md) controls; these handbooks add task-specific procedure without changing authority or current repository truth.

| File | Read it when |
|------|--------------|
| [`01-standard.md`](./01-standard.md) | Always — the work bar and what counts as evidence |
| [`02-testing.md`](./02-testing.md) | Writing or running tests |
| [`03-browser.md`](./03-browser.md) | Claiming anything about the UI |
| [`04-failures.md`](./04-failures.md) | Something is broken and needs recording |
| [`05-documentation.md`](./05-documentation.md) | Editing docs |
| [`06-architecture.md`](./06-architecture.md) | Deciding where code goes |
| [`07-css.md`](./07-css.md) | Touching styles |

Other Markdown files in this folder are agent notes, not handbooks. Keep generated
evidence under `results/`; keep hand-written Markdown reports out of `results/`.

Agent-directed meta-rules — user-wins, do-not-modify, commit policy — live in
[`../AGENTS.md`](../AGENTS.md), not repeated atop every handbook.

**Not the same as `docs/governance/`.** That folder holds programme commitments
with enforcement columns and an establishment date: long, consulted occasionally.
This folder is how a session works: short, read every time. Where the two overlap,
**this folder is the source** — governance exists to make a rule phase-enforceable,
not to restate it.

Filenames are asserted by `check:agents-md` and `check:agents-folder`. Rename one
and you must update both checkers and the `AGENTS.md` handbook table in the same
change; that trio drifted once and failed the gate on files that were present.

## Authority

```text
user instruction  >  live code + fresh commands  >  AGENTS.md  >  Agents/  >  docs/
```

- The current task sets the goal. Clear goals execute without ceremony.
- Fresh evidence decides PASS / FAIL / ship. No fake proof.
- Programme direction: live code + coordination in `plans/`.
- Active blockers: root `Failures.md` alone. Raw/generated output: `results/`, never PASS.

## Working loop

Source of truth: [`../plans/README.md`](../plans/README.md), which indexes active plan folders.
Builder: slice → build → prove with appropriately classified evidence. Integrate serially and use only an exact validation command authorized by the current user and permitted by the enabled hook.

## Execution floor

- Repo-root checkout. No worktrees. `pnpm` from root only.
- Smallest sound change; preserve unrelated work; no handwritten `any`.
- Secrets only in `.env.local` (and `site/.env.local` when Next loads from `site/`).
- UI claims: `http://localhost:3000` only, never `127.0.0.1`.
- Before completion, statically inspect changed files. Run `pnpm run check:layout` only with exact current-session authorization and enabled-hook permission.

## The product, briefly

One Next app under `site/` serving four surfaces: marketing `/`, admin `/admin/*`,
**Furniture Studio** `/oostudio`, **Floor Planner** `/ooplanner`. Studio and
Planner are fully forked — separate `@studio/*` and `@planner/*` trees that never
import each other (`pnpm run scan:boundaries`). They meet only at a shared backing
store: the Studio writes the furniture library, the Planner rail reads it.

Persistence is exclusive-mode. `DEV_AUTH_BYPASS=1` on a non-production build
selects **disk**; everything else selects **Supabase**. Production's filesystem is
read-only, so a route that writes must call the mode-aware store wrapper, never the
raw disk helper. Selectors: `site/lib/Planner/plannerPersistenceMode.ts`,
`site/lib/catalog/furnitureCatalogMode.ts`.

Enterprise client registry: 116 canonical clients across 4 sectors in
`site/lib/clients/clientRegistry.ts`, verified vector logos in
`site/public/assets/marketing/client-logos/`, zero letter monogram fallbacks, and
quiet luxury proof surfaces on `/trusted-by` and `/clients`. Hardened security:
CSP headers in `site/next.config.js`/`mjs` and `site/proxy.ts`, secure cookies,
and input sanitization in `site/lib/security/`. Complete i18n: 861 keys across 26
namespaces with 100% Hindi Devanagari parity in `site/i18n/messages/{en,hi}.json`.

## Where to look

| Need | Open |
|------|------|
| Onboarding | [`../START.md`](../START.md) |
| Index | [`../CONTENTS.md`](../CONTENTS.md) · [`../DOC-MAP.md`](../DOC-MAP.md) |
| Deploy / migrate | [`../OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) · `pnpm run ops:list` |
| Where code goes | [`../docs/architecture/product-map.md`](../docs/architecture/product-map.md) |
| Client registry & logos | [`../docs/architecture/product-map.md`](../docs/architecture/product-map.md) · [`../docs/architecture/routes.md`](../docs/architecture/routes.md) |
| Stack | [`../docs/architecture/stack.md`](../docs/architecture/stack.md) |
| Routes | [`../docs/architecture/routes.md`](../docs/architecture/routes.md) |
| Schema / DB ops | [`../docs/database/schema.md`](../docs/database/schema.md) · [`../docs/database/drizzle.md`](../docs/database/drizzle.md) · [`../docs/database/ops.md`](../docs/database/ops.md) |
| Tech-docs SPA | [`../tech-docs-generator/README.md`](../tech-docs-generator/README.md) |
| Programme rules | [`../docs/governance/rules.md`](../docs/governance/rules.md) |
| Blockers | [`../Failures.md`](../Failures.md) |
| Product | [`../README.md`](../README.md) |
| Proof surfaces & FOCSS | [`../docs/architecture/css.md`](../docs/architecture/css.md) |
| Security / i18n | [`../docs/architecture/stack.md`](../docs/architecture/stack.md) §7–8 · [`../docs/governance/rules.md`](../docs/governance/rules.md) |
| Tests / coverage | [`../Testing-handbook.md`](../Testing-handbook.md) |

## VS Code Customizations

Just-in-time instructions loaded when editing specific file types:

| File | Applies to | Purpose |
|------|-----------|---------|
| [`.github/instructions/focss.instructions.md`](../.github/instructions/focss.instructions.md) | `site/focss/**/*.css` | FOCSS zone boundaries, token rules |
| [`.github/instructions/testing.instructions.md`](../.github/instructions/testing.instructions.md) | `tests/**/*.{ts,tsx}` | Test conventions, persistence mocking |
| [`.github/instructions/boundaries.instructions.md`](../.github/instructions/boundaries.instructions.md) | Studio/Planner forked code | Fork isolation rules |
| [`.github/instructions/migrations.instructions.md`](../.github/instructions/migrations.instructions.md) | `site/platform/supabase/migrations/**/*.sql` | Rollback requirements, Supabase grants |

No `/gate` or `/new-test` commands exist. When the current user authorizes the exact command and the enabled hook permits it, use the configured root gate route described in the [operations runbook](../OPERATIONS_RUNBOOK.md).

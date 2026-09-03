# Programme governance rules

This reference defines programme constraints and their evidence boundaries. Authority order is current user instruction > live repository evidence > [`AGENTS.md`](../../AGENTS.md) > [`Agents/`](../../Agents/INDEX.md) > `docs/`.

## Status vocabulary

Use `observed`, `configured`, `present-but-unverified`, `planned`, `historical`, `deprecated`, `blocked`, or `pending-owner-validation`. A declared command is configured, not passed. Active hard blockers belong only in [`Failures.md`](../../Failures.md).

## Execution and evidence

| ID | Rule | Evidence |
|---|---|---|
| E1 | Work from the repository root with `pnpm`; never create worktrees. | Static process inspection |
| E2 | Preserve unrelated and pre-existing work; use explicit, disjoint ownership for concurrent work. | Diff and ownership review |
| E3 | Run tests, typechecks, gates, builds, browser checks, coverage, and test-like commands only with exact current-session authorization and enabled-hook permission. | Authorization and command record |
| E4 | Record exact command, arguments, working directory, exit status, scope, and redacted result. An unobserved command is unrun. | Command record |
| E5 | Generated `results/` output is not authority or proof without its originating source or command. | Evidence review |
| E6 | Retire tracked files through named tasks and Git history; never create duplicate archives. | Plan and diff review |

## Architecture and persistence

| ID | Rule | Evidence |
|---|---|---|
| A1 | Studio and Planner remain forked and never import each other. | Static imports; authorized `pnpm run scan:boundaries` when requested |
| A2 | Read the relevant installed Next.js 16 guide under `node_modules/next/dist/docs/` before changing Next.js code. | Task record |
| A3 | Production filesystem is read-only. Runtime writes use mode-aware wrappers. | Selector and call-site inspection |
| A4 | Persistence is exclusive: local disk only with `DEV_AUTH_BYPASS=1` outside production, Supabase otherwise; never dual-write. | Selector and store inspection |
| A5 | Products owns marketing catalog/configurator migrations; Admin owns staff/customer data, plans, furniture, and descriptors. | Migration path and client inspection |
| A6 | Route modules stay thin and delegate domain behavior to owning modules. | Static architecture review |

## Database and security

| ID | Rule | Evidence |
|---|---|---|
| P1 | Every deployable schema change uses the owning Supabase migration directory. | Changed-path review |
| P2 | Every migration includes `-- rollback`, grants, policies, and row-level security (RLS) appropriate to the table. | SQL inspection; configured governance check |
| P3 | Run the owning dry-run before any authorized apply, then regenerate the owning database types. | Authorized command records |
| P4 | Service-role and server credentials remain server-only and absent from client code, browser output, client-visible configuration, and documentation output. | Static security review |
| P5 | Security capabilities unsupported by live configuration remain present-but-unverified or pending, never “enforced.” | Claim review |
| P6 | A backup is proven only by a successful restore exercise. | Authorized restore evidence |
| P7 | Risky procedures state prerequisites, target, impact, and recovery before executable steps. | Documentation review |
| P8 | Universal security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, strict CSP with `frame-ancestors 'none'` and `form-action 'self'`) and secure cookie options (`HttpOnly`, `Secure` in prod, `SameSite`) must be enforced across site entry points. | Config and proxy header inspection |
| P9 | User-submitted inputs and serialized script payloads must be sanitized via mode-aware security helpers (`sanitizeInput`, `sanitizeJsonForScript`) before persistence or rendering. | Sanitizer and route inspection |

## Styling and dependencies

| ID | Rule | Evidence |
|---|---|---|
| C1 | `site/focss/` is the single product CSS home; preserve site, admin, Planner, and Studio zone boundaries. | Static import review |
| C2 | Product presentation uses semantic tokens; do not add raw color or duplicate token systems. | Static review; configured token check |
| C3 | Studio and Planner FOCSS never cross-import. | Static review; configured FOCSS check |
| C4 | Public proof and directory surfaces (`/trusted-by`, `/clients`) follow quiet luxury standards (borderless marks, split-story installation cards, clean metric counters) using FOCSS semantic tokens without raw color classes. | Component and token inspection |
| D1 | Use `pnpm exec`, never `npx`; product dependencies remain in root `package.json`. | Manifest and script review |
| D2 | Add or upgrade dependencies only with explicit approval, a pinned version where required, and license/duplication review. | Plan and manifest review |
| D3 | Never weaken a baseline or threshold to manufacture a green result. | Diff and evidence review |

Configured CSS routes include `pnpm run verify:focss`, `pnpm run lint:ui:strict`, and `pnpm run check:style-tokens`. They remain unrun unless an authorized command record says otherwise. See [FOCSS drift prevention](./focss-stop-drift.md).

## Testing and release

| ID | Rule | Evidence |
|---|---|---|
| T1 | `pnpm run test` contains two Vitest lanes; both completed summaries are required for a suite result. | Authorized command record |
| T2 | Unit evidence does not prove browser behavior; disk-mode evidence does not prove hosted Supabase behavior. | Scope review |
| T3 | Empty, skipped-only, or hollow tests do not count as validation. | Test review; authorized audit |
| T4 | `pnpm run gate:fast` maps to `release:gate:fast`; `pnpm run gate` maps to the full `release:gate`. | Root `package.json` |
| T5 | A failed authorized command remains failed until an authorized corrective rerun completes successfully. | Command ledger |
| T6 | Coverage floors and quality thresholds may decrease debt but never rise to silence a failure. | Config diff and evidence |

## Documentation and status

- Root files are front doors and procedures; `Agents/` contains session guidance; `docs/` contains durable reference; plan folders contain active coordination.
- [`DOC-MAP.md`](../../DOC-MAP.md) owns placement, [`CONTENTS.md`](../../CONTENTS.md) owns the index, and [`Testing-handbook.md`](../../Testing-handbook.md) owns validation reporting.
- Do not duplicate active status across durable docs. Historical values must be labeled and cannot close current work.
- Documentation links use repository-relative destinations; external references use canonical HTTPS URLs.
- Static Markdown review does not establish formal accessibility conformance.

## Ratchets

Governance and style-token baselines may contain existing debt. A ratchet can block increases without claiming the baseline is clean. Lower a baseline only after an authorized observation proves the count decreased and the active task records the change. Never raise a baseline to bypass a failure.

## Definition of done

A programme task is complete only when its user-approved scope is implemented, required static review is closed, every authorized command has an honest terminal state, unresolved hard blockers are recorded in [`Failures.md`](../../Failures.md), and no unowned or excluded path was modified. Broader product goals remain `not-measured` until the evidence described in [benchmarks](./benchmarks.md) is observed.

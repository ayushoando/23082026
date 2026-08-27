# Trusted By Duplicate Roster Kicker — Reconciliation Design

## Decision

Treat the historical duplicate `rosterKicker` bug as already fixed in the current repository state. Revise the plan and its indexes to match live code, then execute a documentation-only closeout. Do not edit the Trusted By route merely to reproduce a defect that is no longer present.

## Current implementation truth

The route at `site/app/(site)/trusted-by/page.tsx` creates locale-aware copy with `withLocaleCopy` and passes the following mapping exactly once to `TrustedByPageView`:

```tsx
rosterKicker={copy.rosterKicker}
```

The `copy` expression is authoritative at runtime. It preserves the Hindi/localized override behavior; changing it to `TRUSTED_BY_PAGE_COPY.rosterKicker` would bypass that behavior and would be an incorrect “fix.”

The focused test at `tests/unit/app/(site)/trusted-by/page.test.tsx` already checks:

- one `rosterKicker` attribute in the route invocation;
- one `rosterKicker={copy.rosterKicker}` expression; and
- all 21 non-roster mappings in their existing order.

The route also preserves metadata, JSON-LD, `TRUSTED_BY_CLIENTS`, unique sector derivation, `HomeMarketingLayout`, and `ContactTeaser`. None of those areas requires a source change for this plan.

## Historical defect model

The original report was based on an earlier snapshot containing a second `rosterKicker` attribute after `sectors`. That snapshot also described the value as `TRUSTED_BY_PAGE_COPY.rosterKicker`. Both claims are stale against the current route. The historical TS17001 explanation remains useful provenance, but it is not a current failing condition and must be labeled accordingly.

The current plan state is therefore:

```text
historical duplicate report
        ↓
source correction already present
        ↓
plan/reference reconciliation
        ↓
non-test closeout evidence
        ↓
optional user-run validation
```

## Scope and ownership

### In scope

- Create the missing canonical `requirements.md` under the target plan directory.
- Rewrite `bugfix.md`, `design.md`, and `tasks.md` so they use current source truth.
- Record the reconciliation in `tasks.meta.json` while preserving its historical execution history.
- Update the target rows in both CSV reference indexes from `.kiro/specs/...` to `plans/...`.
- Perform a path-scoped, non-test closeout review.

### Explicitly out of scope

- Any edit to `site/app/(site)/trusted-by/page.tsx`.
- Any edit to the focused test, route-copy data, proof data, client logos, or `TrustedByPageView`.
- New or changed FOCSS selectors, tokens, imports, or styles.
- Planner, Studio, database, persistence, deployment, browser, or generated-result work.
- Hand-editing files under `results/**`.
- Running tests, builds, browser checks, `gate:fast`, or other repository gates automatically.

## Reference layout

The primary spec remains at:

```text
plans/trusted-by-duplicate-roster-kicker/
├── .config.kiro
├── requirements.md       # canonical current requirements
├── design.md             # this reconciliation design
├── tasks.md              # executable closeout tasks
├── bugfix.md             # historical bug analysis
└── tasks.meta.json       # historical execution record plus reconciliation
```

The CSV indexes must point to these paths. The generated `results/**` locators may retain historical `.kiro` provenance and are not part of this edit.

## Validation design

The agent closeout is limited to non-test evidence:

1. Inspect the route and focused-test source invariants.
2. Verify the target plan paths and both index rows.
3. Run a path-scoped `git diff --check`.
4. Inspect status/diff to confirm no target source or test file changed.

The focused Vitest file, typecheck, production build, and repository gates are follow-up commands for the user to invoke. Historical values in `tasks.meta.json` are not fresh command output and must never be reported as newly executed.

## Completion definition

The plan is reconciled when all target documents consistently describe an already-resolved duplicate, the reference indexes point into `plans/`, the source/test invariants remain unchanged, no unrelated dirty-tree changes are overwritten, and the non-test path-scoped review shows no unexpected target-source change.

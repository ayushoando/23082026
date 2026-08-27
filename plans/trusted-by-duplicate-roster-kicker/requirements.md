# Trusted By Duplicate Roster Kicker — Requirements

## Status

**Reconciled on 2026-08-27.** The historical duplicate-prop defect is already absent from the current working tree. This document is the canonical requirements record for closing the stale implementation plan without reintroducing the defect.

## Context

The original bug report described two `rosterKicker` JSX attributes in the `TrustedByPageView` invocation for `/trusted-by`, which would produce TypeScript diagnostic TS17001. The current route no longer contains that duplicate. Its localized copy flow is:

```tsx
const copy = await withLocaleCopy({ ...TRUSTED_BY_PAGE_COPY }, "trustedBy");
```

and the route passes the runtime-localized value exactly once:

```tsx
rosterKicker={copy.rosterKicker}
```

The existing focused test already asserts that invariant and preserves the complete set of sibling prop mappings. The plan therefore records a completed source state and requires documentation/index reconciliation rather than a second source edit.

## Requirements

### 1. Current source truth

1.1. The `TrustedByPageView` invocation in `site/app/(site)/trusted-by/page.tsx` SHALL contain exactly one `rosterKicker` attribute.

1.2. The remaining attribute SHALL be `rosterKicker={copy.rosterKicker}`, because `copy` is the locale-resolved route-copy object. The plan SHALL NOT instruct an implementation to replace it with the raw `TRUSTED_BY_PAGE_COPY.rosterKicker` expression.

1.3. The source SHALL remain free of a duplicate `rosterKicker` attribute and the plan SHALL not recreate the historical TS17001 counterexample merely to make an exploration step fail.

### 2. Behavior preservation

2.1. All 21 non-roster prop mappings in the `TrustedByPageView` call SHALL remain present with their current expressions and ordering semantics.

2.2. The route SHALL continue to preserve its localized copy assembly, client roster, derived unique sectors, metadata, JSON-LD, layout composition, and `ContactTeaser`.

2.3. `TrustedByPageView` SHALL continue to use the single roster kicker for both the roster heading and the client-list accessible label.

2.4. No changes are authorized to `TrustedByPageView`, route-copy data, proof data, client-logo data, FOCSS, unrelated routes, Planner, Studio, databases, persistence, or deployment configuration.

### 3. Plan and reference integrity

3.1. The canonical artifacts SHALL live under `plans/trusted-by-duplicate-roster-kicker/`.

3.2. The canonical requirements artifact SHALL be this `requirements.md`. `bugfix.md` SHALL remain a clearly labeled historical analysis rather than a second competing requirements source.

3.3. The design, tasks, requirements, bugfix, and metadata references in both `plans-reports-references.csv` and `plans/plans-reports-references.csv` SHALL use the `plans/trusted-by-duplicate-roster-kicker/` paths.

3.4. Generated historical evidence under `results/**` SHALL not be hand-edited or moved as part of this reconciliation.

3.5. Existing unrelated changes in the working tree, including changes to the `plans/` reference-index copy, SHALL be preserved.

### 4. Execution and evidence

4.1. The executable plan SHALL treat the source correction as already complete and shall use a no-source-change closeout task.

4.2. The closeout SHALL record that the four-agent audit found no current duplicate and no Planner/Studio or FOCSS implementation impact.

4.3. Agent execution SHALL use only non-test, non-gate checks. Tests, builds, browser checks, and repository gates remain user-invoked follow-up validation and SHALL not be claimed as fresh evidence here.

4.4. If a later user-run validation exposes a new failure, the exact command and evidence SHALL be recorded in `Failures.md` according to repository policy.

## Acceptance criteria

- [ ] The current route still has exactly one `rosterKicker={copy.rosterKicker}` mapping.
- [ ] The focused source assertion and its 21 non-roster mappings are documented as existing regression protection, not as new implementation work.
- [ ] `requirements.md`, `design.md`, `tasks.md`, `bugfix.md`, and `tasks.meta.json` agree that the duplicate is historical/already resolved.
- [ ] Both reference-index copies point the target artifacts into `plans/trusted-by-duplicate-roster-kicker/`.
- [ ] No source, test, CSS, generated-result, Planner, Studio, database, or deployment files are changed by this reconciliation.
- [ ] Non-test path-scoped diff validation completes without whitespace errors or unexpected target-source changes.

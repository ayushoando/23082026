# Trusted By Duplicate Roster Kicker — Historical Bugfix Analysis

## Purpose

This document preserves the original bug report and explains how it was reconciled with the current repository. It is historical analysis, not the canonical requirements artifact; current requirements live in `requirements.md`.

## Historical report

An earlier `/trusted-by` route snapshot contained the `rosterKicker` JSX attribute twice in the `TrustedByPageView` invocation. TypeScript reports TS17001 when a JSX element has duplicate attributes, so the safe historical correction was to remove the second occurrence and preserve the first.

The historical report described both occurrences as:

```tsx
rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}
```

and placed the duplicate after the `sectors` mapping. That description is retained only as provenance for the original defect.

## Current repository evidence

The current route no longer contains that duplicate. Its locale-aware assembly is:

```tsx
const copy = await withLocaleCopy({ ...TRUSTED_BY_PAGE_COPY }, "trustedBy");
```

and its single runtime mapping is:

```tsx
rosterKicker={copy.rosterKicker}
```

The focused route test already asserts one roster mapping, the localized `copy.rosterKicker` expression, and preservation of all 21 non-roster mappings. The current source therefore satisfies the narrow bug invariant without another implementation edit.

## Reconciled interpretation

- The duplicate and the reported TS17001 are historical, not current source conditions.
- `copy.rosterKicker` is the correct authoritative runtime expression; replacing it with the raw English constant would regress localization.
- The route, view component, copy source, roster data, sectors, metadata, JSON-LD, layout, and contact teaser remain unchanged.
- The appropriate next action is to reconcile the plan artifacts and references, then perform non-test closeout review.

## Preservation checklist

- [x] Exactly one current `rosterKicker` mapping.
- [x] Localized `copy.rosterKicker` is preserved.
- [x] Existing focused source assertions preserve the sibling mappings.
- [x] No Planner/Studio or FOCSS implementation scope is implicated.
- [x] Generated historical result evidence remains untouched.
- [ ] User-run focused test/typecheck/build/gate evidence, if desired, is intentionally deferred and must not be represented by this document as fresh execution.

## Disposition

**Reconciled / no source change required.** Keep this file for historical traceability and use `requirements.md` for current acceptance criteria.

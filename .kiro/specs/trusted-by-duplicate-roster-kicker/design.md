# Trusted By Duplicate Roster Kicker Bugfix Design

## Overview

The production type check fails for the marketing Trusted By page because the `TrustedByPageView` JSX invocation supplies the `rosterKicker` attribute twice. Both occurrences currently use `TRUSTED_BY_PAGE_COPY.rosterKicker`, but TypeScript rejects duplicate JSX attributes with TS17001 before the page can be accepted for production.

The fix is intentionally narrow: retain exactly one `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` attribute in `site/app/(site)/trusted-by/page.tsx`, remove only the duplicate occurrence, and leave every other prop, copy source, route, component, and runtime behavior unchanged. This design documents the correction and its validation plan; no source implementation changes are made in this phase.

## Glossary

- **Bug_Condition (C)**: A `TrustedByPageView` JSX call contains more than one `rosterKicker` attribute, causing TS17001 during type checking.
- **Property (P)**: The corrected call provides `rosterKicker` exactly once from `TRUSTED_BY_PAGE_COPY.rosterKicker` and otherwise preserves the existing call-site behavior.
- **Preservation**: All non-duplicate props, page copy, routes, rendered roster content, and unrelated application behavior remain unchanged.
- **`TrustedByPageView`**: The Trusted By client-rendered view component that receives the page content and uses `rosterKicker` for the roster heading and accessible client-list label.
- **`TRUSTED_BY_PAGE_COPY`**: The Trusted By route-copy object in `site/features/site/data/routeCopy.ts`; its `rosterKicker` value is the authoritative roster kicker copy.
- **`TrustedByPage`**: The route component in `site/app/(site)/trusted-by/page.tsx` that assembles metadata, JSON-LD, route copy, clients, sectors, and the `TrustedByPageView` invocation.
- **TS17001**: The TypeScript diagnostic stating that JSX elements cannot have multiple attributes with the same name.

## Bug Details

### Bug Condition

The bug manifests when the Trusted By route is type checked and its `TrustedByPageView` JSX invocation contains two `rosterKicker` attributes. The duplicate attributes are semantically redundant but syntactically invalid in JSX, so TypeScript reports TS17001 at the second occurrence and prevents the type-check step from succeeding.

**Formal Specification:**

```text
FUNCTION isBugCondition(input)
  INPUT: input representing the TrustedByPageView JSX invocation
  OUTPUT: boolean

  RETURN countAttributes(input, "rosterKicker") > 1
         AND atLeastOneAttributeValueIs(input, "rosterKicker", "TRUSTED_BY_PAGE_COPY.rosterKicker")
         AND typeCheckerReports(input, "TS17001")
END FUNCTION
```

### Examples

1. **Current production call site**: The invocation supplies `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` before `quotesKicker` and supplies the same attribute again after `sectors`. Type checking reports TS17001 at the second occurrence instead of producing a valid route build input.
2. **Corrected call site**: The invocation retains one `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` attribute and removes only the duplicate. TypeScript accepts the JSX attribute set, and `TrustedByPageView` receives the same roster copy value.
3. **Other page content**: `heroTitleLead`, `heroTitleAccent`, `heroSubtitle`, overview fields, `statsKicker`, `clients`, quotes, sectors, sector copy, and CTA fields remain present with their existing `TRUSTED_BY_PAGE_COPY`, `TRUSTED_BY_CLIENTS`, or derived `sectors` values. The duplicate-prop correction must not remove or change any of them.
4. **Edge case—authoritative copy**: If `TRUSTED_BY_PAGE_COPY.rosterKicker` changes in the route-copy source, the single remaining prop must still resolve to that updated value; no literal replacement or second competing value may be introduced.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- `TrustedByPageView` must receive `rosterKicker` exactly once, with the value `TRUSTED_BY_PAGE_COPY.rosterKicker`.
- Every other existing `TrustedByPageView` prop must remain present and retain its current source and value semantics, including hero, overview, statistics, clients, quotes, sectors, and CTA content.
- The Trusted By page must continue to use the existing `/trusted-by` route, metadata, JSON-LD generation, `TRUSTED_BY_CLIENTS` roster, derived sectors, layout, and `ContactTeaser`.
- The roster heading and client-list accessible label must continue to receive the same `rosterKicker` value inside `TrustedByPageView`.
- No unrelated routes, components, data files, page copy, or application behavior may be changed.

**Scope:**

All inputs and code paths outside the duplicate `rosterKicker` attribute condition are outside the fix scope and must remain unaffected. This includes:

- Other props passed to `TrustedByPageView`.
- Mouse, keyboard, animation, and interaction behavior implemented by `TrustedByPageView`.
- Other marketing routes and unrelated application areas.
- Existing route copy, client data, sectors, metadata, breadcrumbs, and calls to shared layout components.

## Hypothesized Root Cause

Based on the confirmed source and type-check output, the likely root causes are:

1. **Duplicate JSX attribute introduced during call-site editing**: The same `rosterKicker` mapping appears once with the quote props and again after the sectors prop, likely from an additive edit or merge that did not remove the original mapping.
2. **Insufficient call-site uniqueness validation**: The component prop interface correctly declares one `rosterKicker` field, and the component destructures one field, but no check prevented the route invocation from supplying the same JSX attribute twice.
3. **Prop placement drift**: The duplicate appears in two logical sections of the long prop list, making it easy to overlook in review even though both values are identical.
4. **Build/type-check gate exposure**: The defect is caught by TypeScript rather than by runtime behavior; a production type-check or build is therefore required to detect the invalid JSX before release.

## Correctness Properties

Property 1: Bug Condition - Unique authoritative roster kicker

_For any_ Trusted By page JSX invocation where `isBugCondition(input)` returns true, the fixed invocation SHALL contain exactly one `rosterKicker` attribute, that attribute SHALL use `TRUSTED_BY_PAGE_COPY.rosterKicker`, and type checking SHALL no longer report TS17001 for `site/app/(site)/trusted-by/page.tsx`.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - All non-roster-kicker behavior

_For any_ Trusted By page invocation where `isBugCondition(input)` returns false, the fixed code SHALL produce the same prop mappings, page copy, route structure, and component behavior as the original code, preserving every existing prop other than eliminating the invalid duplicate attribute.

**Validates: Requirements 2.3, 3.1, 3.2, 3.3**

### Properties Specification

```text
FUNCTION expectedBehavior(input)
  INPUT: a Trusted By page JSX invocation
  OUTPUT: boolean

  RETURN countAttributes(input, "rosterKicker") == 1
         AND onlyRosterKickerValue(input) == TRUSTED_BY_PAGE_COPY.rosterKicker
         AND allOtherPropMappingsUnchanged(input)
         AND pageCopyRoutesAndBehaviorUnchanged(input)
         AND typeCheck(input) succeeds without TS17001
END FUNCTION
```

## Fix Implementation

### Changes Required

Assuming the confirmed root cause is correct:

**File**: `site/app/(site)/trusted-by/page.tsx`

**Function**: `TrustedByPage`

**Specific Changes**:

1. **Remove the duplicate attribute**: Delete the second `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` entry from the `TrustedByPageView` JSX invocation.
2. **Retain the authoritative mapping**: Keep exactly one `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` mapping in the invocation. Do not replace it with a literal, a different copy field, or a derived value.
3. **Preserve adjacent props**: Leave `quotesKicker`, `quotesTitle`, `quotes`, `sectors`, sector copy, CTA props, and all other existing mappings unchanged.
4. **Preserve route assembly**: Do not modify metadata, JSON-LD, `TRUSTED_BY_CLIENTS`, sector derivation, layout composition, or `ContactTeaser`.
5. **Avoid unrelated changes**: No changes are required or authorized in `TrustedByPageView`, route-copy data, other routes, or shared components.

## Testing Strategy

### Validation Approach

Validation follows the bug-condition methodology: establish the unfixed counterexample, apply only the duplicate-attribute correction in a later implementation phase, then verify the fix and preservation requirements. The requested commands are `pnpm run typecheck` and `pnpm run build:site` from the repository root. This design phase does not implement the source fix.

The current baseline confirms the defect: `pnpm run typecheck` reports TS17001 at `site/app/(site)/trusted-by/page.tsx:62`, where the second `rosterKicker` attribute appears. `pnpm run build:site` was also invoked against the unfixed tree, but the environment terminated the build with exit code `-1` during the optimized production build before a final pass/fail result was emitted. After implementation, both commands must be rerun to completion; the build must complete successfully and the type check must contain no TS17001 diagnostic.

### Exploratory Bug Condition Checking

**Goal**: Surface and document the concrete unfixed counterexample before implementation, confirming that the failure is caused by the repeated JSX attribute rather than by the component prop type or route copy.

**Test Plan**: Run `pnpm run typecheck` on the unfixed source and inspect the diagnostic location. Confirm in the route source that both `rosterKicker` attributes resolve to `TRUSTED_BY_PAGE_COPY.rosterKicker`. Run `pnpm run build:site` as the production validation path and record whether the build reaches or is blocked by type checking.

**Test Cases**:

1. **Duplicate attribute type check**: Type check the current Trusted By route and observe TS17001 at the second `rosterKicker` occurrence.
2. **Authoritative value inspection**: Verify both duplicate attributes use `TRUSTED_BY_PAGE_COPY.rosterKicker`, identifying the safe correction as removal of one occurrence rather than a copy change.
3. **Prop contract comparison**: Compare the call site with `TrustedByPageViewProps` and its destructuring to verify the component expects and consumes one `rosterKicker` value.
4. **Production build baseline**: Run `pnpm run build:site` on the unfixed tree; after the fix, rerun it to completion and require success.

**Expected Counterexamples**:

- TypeScript reports `TS17001: JSX elements cannot have multiple attributes with the same name` at the second `rosterKicker` attribute.
- The production build cannot be accepted while the type-check failure remains.
- No runtime roster-copy discrepancy is expected because both duplicate values are identical; the observable defect is the compile-time rejection.

### Fix Checking

**Goal**: Verify that every input satisfying the bug condition receives the expected unique authoritative prop and passes the requested validation gates.

**Pseudocode:**

```text
FOR ALL input WHERE isBugCondition(input) DO
  fixedInput := applyDuplicateRosterKickerRemoval(input)
  ASSERT expectedBehavior(fixedInput)
  ASSERT countAttributes(fixedInput, "rosterKicker") == 1
  ASSERT typeCheck(fixedInput) succeeds
  ASSERT buildSite(fixedInput) succeeds
END FOR
```

**Fix-checking cases**:

1. Confirm the exact current duplicate layout is corrected by removing one occurrence only.
2. Confirm the remaining value is `TRUSTED_BY_PAGE_COPY.rosterKicker`.
3. Run `pnpm run typecheck` and verify no TS17001 is reported for the Trusted By route.
4. Run `pnpm run build:site` and verify the site production build completes successfully.

### Preservation Checking

**Goal**: Verify that for all behavior outside the duplicate attribute condition, the fixed page is equivalent to the original intended page behavior.

**Pseudocode:**

```text
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalPropMappings(input) == fixedPropMappings(input)
  ASSERT originalPageCopyAndRoutes(input) == fixedPageCopyAndRoutes(input)
  ASSERT originalBehavior(input) == fixedBehavior(input)
END FOR
```

**Testing Approach**: Use focused source-level assertions and the existing type/build checks. Because this is a one-attribute JSX correction, preservation is principally verified by ensuring the diff removes only the duplicate line and that all remaining prop mappings and route assembly are byte-for-byte unchanged. Where the repository’s existing tests cover the route or shared view, run the relevant targeted tests after implementation.

**Test Cases**:

1. **Prop preservation**: Compare the `TrustedByPageView` invocation before and after implementation; assert every prop other than the duplicate `rosterKicker` occurrence remains present with the same expression.
2. **Page-copy preservation**: Assert the remaining roster prop still references `TRUSTED_BY_PAGE_COPY.rosterKicker`, and no route-copy source values change.
3. **Route and behavior preservation**: Assert `/trusted-by`, metadata, JSON-LD, client data, sectors, layout, and `ContactTeaser` remain unchanged.
4. **Regression validation**: Run `pnpm run typecheck` and `pnpm run build:site`; confirm the correction removes the compile-time error without introducing new diagnostics or build failures.

### Unit Tests

- Add or run a focused static/source assertion that the Trusted By page contains exactly one `rosterKicker` JSX attribute in the `TrustedByPageView` invocation.
- Assert the remaining attribute expression is `TRUSTED_BY_PAGE_COPY.rosterKicker`.
- Assert all other existing prop names and their source expressions remain unchanged.
- Confirm the `TrustedByPageView` prop contract and render usage continue to accept and use one roster kicker value.

### Property-Based Tests

- Generate valid Trusted By prop-call configurations and assert the corrected call has one authoritative `rosterKicker` mapping whenever the duplicate-attribute bug condition is introduced.
- Generate changes to the authoritative `TRUSTED_BY_PAGE_COPY.rosterKicker` value and assert the page forwards that value exactly once without introducing a second source.
- Generate non-roster prop mappings and assert removing the duplicate does not alter their names, expressions, ordering semantics, or values.

### Integration Tests

- Run `pnpm run typecheck` and verify the Trusted By route no longer emits TS17001.
- Run `pnpm run build:site` and verify the production site build completes successfully.
- Render or exercise the `/trusted-by` page through the existing site integration coverage, if available, and verify the roster section, page copy, route, metadata, clients, sectors, quotes, and CTA behavior remain unchanged.

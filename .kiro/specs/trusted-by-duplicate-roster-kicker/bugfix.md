# Bugfix Requirements Document

## Introduction

Resolve the production type-check failure in the marketing Trusted By page caused by a repeated `rosterKicker` JSX attribute passed to `TrustedByPageView`. The scope is limited to removing the duplicate prop occurrence while preserving the page’s intended roster copy, all other page content, and unrelated application behavior. Acceptance is based on the requirements below and on the relevant repository validation commands completing successfully with no TS17001 diagnostic in `site/app/(site)/trusted-by/page.tsx`.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the `TrustedByPageView` JSX invocation in `site/app/(site)/trusted-by/page.tsx` is type checked THEN the system reports TS17001 because `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` is supplied more than once.
1.2 WHEN the production site build reaches type checking for the Trusted By page THEN compilation may complete but the build validation fails, preventing the production build from being accepted.

### Expected Behavior (Correct)

2.1 WHEN the `TrustedByPageView` JSX invocation is type checked THEN the system SHALL provide `rosterKicker` exactly once, using `TRUSTED_BY_PAGE_COPY.rosterKicker`, and SHALL produce no TS17001 duplicate-attribute diagnostic for the page.
2.2 WHEN the production site is type checked and built after the correction THEN the system SHALL pass `pnpm run typecheck` and `pnpm run build:site` without a type-check failure originating from `site/app/(site)/trusted-by/page.tsx`.
2.3 WHEN the correction is applied THEN the system SHALL remain within the Trusted By page call site and SHALL not alter unrelated routes, components, data sources, or page copy.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Trusted By page renders after the correction THEN the system SHALL CONTINUE TO expose the same single roster kicker value from `TRUSTED_BY_PAGE_COPY.rosterKicker` to the roster section.
3.2 WHEN the Trusted By page is rendered THEN the system SHALL CONTINUE TO pass all other existing `TrustedByPageView` props, including hero, overview, statistics, clients, quotes, sectors, and CTA content, without changing their values or ordering semantics.
3.3 WHEN other marketing routes and unrelated application areas are type checked or built THEN the system SHALL CONTINUE TO behave as before, with no regressions caused by this narrowly scoped correction.

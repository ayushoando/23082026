# Remaining — i18n
**Date:** 2026-09-01

- 15.2 (broader scope): the rest of the Planner/Studio workspace trees still hardcode user-facing English (only `PlannerEntry.tsx` was claimed by this plan's action; extending next-intl across the remaining ~175 non-i18n components is a program-level effort, not a single plan action). The `workspace.plannerEntry` keys added 2026-09-01 are the pattern to follow.
- 15.4 (residual): physically deleting the (already empty) `site/i18n/pending-translations/` directory requires user confirmation (hard rule: no deletions) — and `tests/unit/i18n/pending-translations.test.ts` currently asserts the directory exists whenever the deferred-locale workflow is active, so removal also needs that test retired with owner sign-off.

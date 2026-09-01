# Plan — i18n

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Eliminate en/hi content drift and route workspace chrome strings through next-intl.

## Actions (prioritized)
1. **Med** Fix the per-locale `solutions.deliveryMedia.src` drift so hi serves the intended hero (`site/i18n/messages/hi.json:534` vs `site/i18n/messages/en.json:653`).
2. **Med** Wire the Planner/Studio workspace trees through the existing `workspace` namespace, starting with `site/components/Planner/PlannerEntry.tsx:32-46` ("Guest workspace", "Sign in to save", "View saved plans") — hi users currently get English workspace chrome.
3. **Low** Localize the hardcoded `aria-label="Planner access status"` in `site/components/Planner/PlannerEntry.tsx:27`.
4. **Low** Empty and retire the deferred backlog directory `site/i18n/pending-translations/` (deleting the folder itself requires user confirmation).

## Verification
- `pnpm run check:i18n:parity` — hi must mirror every top-level en key (`scripts/check-i18n-key-parity.mjs`).
- `pnpm run gate:fast` — owner authorization required; parity gate must stay green after string moves.

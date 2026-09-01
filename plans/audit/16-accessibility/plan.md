# Plan — Accessibility

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Extend the enforced a11y bar (zero axe WCAG-2AA on scanned surfaces) to the remaining interactive surfaces and remove drift-prone duplicate mechanisms.

## Actions (prioritized)
1. **Low** Extend the axe scan targets in `tests/e2e/accessibility.spec.ts` beyond home + guest planner + export menu to the PDP/catalog surfaces and the contact form (`site/components/contact/CustomerQueryForm.tsx`).
2. **Low** Drop the manual Tab-cycle trap in `site/components/site/MobileNavDrawer.tsx:141-159` in favor of the react-aria-components `Modal` it already imports (`site/components/ui/dialog.tsx`) — one trap mechanism per component.
3. **Low** Replace the explicit allowlist in `site/focss/site/components/shared/mobile-tap-targets.css` with structural selectors (built on `--control_height-sm: 2.75rem` from `site/focss/base/tokens/layout.css:23`) so new link classes cannot silently miss the 44px floor.
4. **Low** Port PlannerToast's a11y upgrades (aria-live, role=alert, dismiss button) to `site/components/Studio/StudioToast.tsx` (cross-ref reports 03/17).

## Verification
- `pnpm run test:a11y` — zero axe violations on all scanned surfaces; owner authorization required (dev server on http://localhost:3000).

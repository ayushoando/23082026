# Oando Subsystem Plan: Accessibility, Performance, and Inclusive UX

**File Target:** `plans/05092026/13-accessibility-performance-and-inclusive-ux.md`  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Scope:** WCAG-focused UX, keyboard and focus contracts, reduced motion, responsive/mobile ergonomics, performance measurement, and budget governance.  
**Out of Scope:** Visual redesign, arbitrary performance “optimizations,” and altering Planner/Studio product features without their own plans.

---

## 1. Why This Is a Separate Plan

The current suite has valuable ingredients—Axe scans, keyboard coverage, reduced-motion helpers, a mobile-chrome plan, a planner measurement harness, and a dev-only Lighthouse reader—but they do not form one quality contract. No plan currently says which user journeys are representative, which findings block release, how numeric budgets are approved, or how desktop/mobile regressions are compared.

This plan turns those ingredients into evidence-led quality work without inventing thresholds from a single developer machine.

### Evidence Anchors

| Surface | Observed responsibility | Planning implication |
|---|---|---|
| `tests/e2e/accessibility.spec.ts` | Axe WCAG AA scans for homepage, catalog/PDP/contact, guest Planner, export menu, and keyboard flow. | Preserve zero-violation coverage and expand by representative journey, not by route count alone. |
| `tests/support/accessibility/assertA11y.ts` | Shared accessibility assertion surface. | Keep common rules consistent across browser tests. |
| `site/lib/helpers/gsapMotion.ts` and FOCSS mobile chrome | Reduced motion and viewport-specific UI behaviour. | Motion, focus, cookie, tab bar, and FAB behaviour require desktop and mobile comparison. |
| `tests/e2e/planner-performance-required.spec.ts` | Authored collection harness; numeric execution evidence is intentionally pending. | Establish controlled measurements before declaring a budget or regression. |
| `tests/e2e/helpers/plannerPerformanceBudgets` | Route-entry, interaction, canvas FPS, API latency, and cleanup measurement helpers. | Budgets must be documented with hardware, browser, dataset, and percentile. |
| `site/app/api/dev-tools/lighthouse/route.ts` | Development-only access to local Lighthouse artifacts. | Do not expose dev reports in production or substitute an artifact listing for live performance evidence. |

---

## 2. Inclusive UX Invariants

1. Automated Axe results are a floor, not the entire accessibility review.
2. Every critical journey has a keyboard-only path with visible focus, sensible focus return, usable error feedback, and no pointer-only action.
3. Reduced-motion preference removes nonessential animation without removing information, navigation, or interactive feedback.
4. Responsive work is accepted only after the requested mobile viewport and an unchanged desktop comparison are observed.
5. Private and guest flows have equivalent focus, announcement, and error-handling quality; authentication must not create inaccessible redirect loops.
6. Performance budgets are based on repeatable measurements from documented profiles—not aspirational values or a one-off Lighthouse score.
7. Accessibility/performance changes may not hide content, reduce semantic structure, or disable controls merely to improve a metric.

---

## 3. Quality Inventory and Coverage Model

### Phase A — Define Representative Journeys

Build an owned matrix before modifying tests or UI:

| Journey class | Required coverage |
|---|---|
| Marketing discovery | Homepage navigation, hero action, header/footer, cookie decision, mobile tab bar. |
| Product discovery | Category, product detail, filters/search, image/content alternatives, quote/contact transition. |
| Access boundary | Access form, invalid return path, authenticated redirect, private-shell focus landing. |
| Guest workspace | Entry, onboarding dismissal, primary tool, save/export handoff, recoverable error. |
| Member/Admin task | A representative read action, mutation confirmation/error, and logout/return path. |
| Responsive/motion | Requested desktop/mobile pairs and `prefers-reduced-motion` behaviour. |

For each row name route, auth state, viewport, input mode, expected accessible name/role, focus start/end, and owner. Do not claim coverage for a journey until the route and state were actually exercised.

### Phase B — Accessibility Execution Rules

1. Run Axe at WCAG AA tags for stable page states after fonts and relevant content load.
2. Pair every automated scan with manual keyboard checks for menus, dialogs, drawers, canvas toolbars, forms, error handling, and focus restoration.
3. Verify headings, landmarks, labels, errors, state changes, and dynamic announcements on the user-visible outcome—not only DOM presence.
4. When a canvas cannot expose its graphical state directly, provide an equivalent labelled control/summary path and test it with keyboard navigation.
5. Treat a new skipped test or `aria-hidden` workaround as a regression until justified by an equivalent accessible interaction.

### Phase C — Responsive and Motion Regression Control

Use the exact requested viewport as the acceptance viewport. For mobile chrome, verify the top bar, overflow drawer, cookie bar, tab bar, and floating actions do not overlap; then compare the corresponding desktop shell. For motion, verify `prefers-reduced-motion` retains the content and interaction outcome while removing nonessential effects.

---

## 4. Performance Measurement and Budget Governance

### Baseline Before Budget

The Planner performance suite states that it has authored coverage but no numeric evidence yet. Collect a baseline only with an authorized environment, a representative fixture, declared browser version, viewport/device profile, network condition, and warm/cold-cache state. Store the measurement as generated evidence, not hand-written reports.

Measure the categories already represented by the harness:

- route entry and usable-first-interaction timing;
- non-canvas interaction responsiveness;
- direct-feedback timing;
- canvas frame behaviour during pan, zoom, select, move, rotate, and resize;
- approved API operation latency; and
- cleanup/reload behaviour across repeated project operations.

Set thresholds only after enough comparable samples exist. Each threshold must identify its metric definition, percentile, reference hardware/profile, fixture size, owner, review date, and exception expiry. A number without this context is not a quality budget.

### Lighthouse and Web-Vitals Discipline

Lighthouse artifacts may help diagnose local work, but the development-only report route must remain unavailable in production. Use field or controlled lab evidence appropriate to the route; do not publish a local report as proof of canonical-host performance.

---

## 5. Verification and Triage

Run checks only when separately authorized. A quality evidence bundle contains:

1. Axe output and manual keyboard/focus notes for each changed representative journey.
2. Desktop/mobile screenshots or deterministic browser observations for affected responsive chrome.
3. Reduced-motion observations for an affected animated surface.
4. Controlled performance samples and environment metadata when performance work is in scope.
5. Clear separation between an application regression, a local environment problem, and a production-proven issue.

Triage order:

1. Block user access, unsafe/inaccessible primary actions, focus traps, missing form errors, or critical contrast failures.
2. Fix semantic/keyboard regressions before cosmetic movement or score chasing.
3. Investigate measurement regressions only after comparing the same profile, fixture, browser, and cache conditions.
4. Escalate missing production evidence rather than guessing from local tooling.

---

## 6. Completion Criteria

- Representative journey matrix is current and maps each critical flow to an accessibility and responsive test owner.
- Every changed interactive flow has automated and manual keyboard/focus evidence.
- Reduced motion and mobile/desktop comparisons are observed for affected UI.
- Performance budgets, if adopted, are reproducible and carry profile/fixture/percentile metadata.
- No dev-only Lighthouse artifact or local benchmark is represented as production evidence.
- No quality fix crosses Studio/Planner boundaries or changes product scope without separate authorization.

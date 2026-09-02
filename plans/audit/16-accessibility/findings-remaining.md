# Remaining — Accessibility
**Date:** 2026-09-02

- **16.1:** axe scan coverage still limited to home + guest planner + export menu (4 targets); PDP/catalog/contact form unscanned — open. Adding targets is e2e/Playwright work whose result can only be observed in a browser run; browser evidence is an authorized-run item this session (no deploys / no browser runs in the allowed command set), so no scan code was added blind. Pick up in an authorized browser session.
- **16.3:** tap-target 44px floor in `site/focss/site/components/shared/mobile-tap-targets.css` is still an explicit `:where(…)` allowlist — open. Replacing it with structural selectors (on `--control_height-sm: 2.75rem`) changes the computed box of every link/button that the current allowlist misses, which is unverifiable without visual/browser review (and visual baselines must not be regenerated this session). Low severity; needs an authorized visual pass.
- 16.2 / 16.4: resolved-stale — see findings-resolved.md (verified against current code 2026-09-02, not action items anymore).

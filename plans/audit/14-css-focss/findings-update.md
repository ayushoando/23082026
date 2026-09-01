# Updated findings — CSS system (FOCSS)

**Date:** 2026-09-01

## Resolved
- None yet. No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- None.

## Remaining (failures / open items)
- 14.1 (Med): single-entry marketing CSS bundle ships all route CSS on every marketing page (3–4× over-ship) — decision/fix open, not started.
- 14.2: three sheets within 4–35 lines of the 800-line cap (`planner/workspace.css` 796, `home-layout.css` 779, `home-base.css` 767) — open, not started.
- 14.3: `@import "./shell-main.css"` after 600+ lines of rules in `shell.css` (spec-invalid without bundler hoisting) — open, not started.
- 14.4: `missing-components.css` (233 lines) still a permanent shared-barrel resident — open, not started.

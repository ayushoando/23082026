---
inclusion: manual
---

# Nova Act — Browser-Layer Visual QA

## Purpose
Automate viewport testing at 1920w, 1440w, 1024w, and 390w using Nova Act browser automation. This steering file is invoked manually when a visual regression check is needed.

## When to use
- After UI/CSS changes that affect layout or responsive behavior.
- Before deployment to catch viewport-specific regressions.
- During the four-viewport audit protocol defined in ui-css.md.

## Viewport matrix

| Width | Category | Breakpoint class |
|-------|----------|-----------------|
| 1920px | Desktop wide | `2xl:` |
| 1440px | Desktop standard | `xl:` |
| 1024px | Tablet landscape | `lg:` |
| 390px | Mobile (iPhone SE/14) | default (mobile-first) |

## Check protocol

For each viewport width, verify:

1. **No horizontal overflow** — document width equals viewport width, no horizontal scrollbar.
2. **Navigation** — hamburger/mobile nav at ≤1024, full nav at ≥1440.
3. **Grid layout** — columns collapse appropriately (4→2→1 as width decreases).
4. **Typography** — text remains readable, no truncation without affordance.
5. **Images** — responsive srcset loads correct size, no layout shift.
6. **Touch targets** — interactive elements ≥44×44px at ≤1024.
7. **Modals/overlays** — don't exceed viewport bounds at 390px.
8. **Tables** — scroll horizontally or stack at mobile; no data hidden.

## Routes to test (priority order)
1. `/` — Homepage (marketing hero, product grid)
2. `/ooplanner` — Planner app shell (canvas, panels, toolbar)
3. `/oostudio` — Studio app shell (workspace, tools)
4. `/admin` — Admin dashboard (tables, forms, KPIs)

## Nova Act invocation pattern

```python
# Conceptual — adapt to actual Nova Act API
from nova_act import NovaAct

viewports = [1920, 1440, 1024, 390]
routes = ["/", "/ooplanner", "/oostudio", "/admin"]

for width in viewports:
    for route in routes:
        with NovaAct(starting_page=f"http://localhost:3000{route}") as nova:
            nova.set_viewport(width=width, height=900)
            # Check no horizontal overflow
            nova.act("Verify the page has no horizontal scrollbar")
            # Check navigation state
            if width <= 1024:
                nova.act("Verify mobile navigation menu is present")
            else:
                nova.act("Verify full desktop navigation is visible")
            # Check layout integrity
            nova.act("Verify no elements overflow or overlap")
```

## Integration with static layer
For an explicitly requested visual check, run `pnpm run verify:focss` and `pnpm run lint:ui:strict` before visual testing. Do not run tests or gates automatically.

## Integration with graph layer
Inspect imports and dependents directly from the live source tree to narrow which routes need visual testing.

## Token efficiency
- Only invoke this steering file when visual testing is actually needed.
- Narrow the route list to only routes affected by the current change.
- Report findings as a structured table: viewport × route × issue.
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.
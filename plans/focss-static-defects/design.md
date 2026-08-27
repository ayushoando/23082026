# Design: FOCSS static-defects remediation

## Design intent

This design reconciles the static-defects plan with the current working tree. It defines two pending edits in `mobile-tap-targets.css`, three source changes already present and requiring accurate task state, and one catalog-CSS evidence gate. It does not use static analysis to claim browser behavior.

### Evidence classes

| Class | Meaning | Not a substitute for |
|---|---|---|
| Current source fact | A declaration, import, or file state read from the working tree. | Runtime behavior. |
| Static equivalence | Selector/declaration and import-graph comparison. | Rendered result. |
| Implemented in source | A scoped source change exists in the working tree. | User-run validation. |
| Decision evidence | A bounded uncertainty recorded for explicit user direction. | Permission to mutate assets. |

## Reconciled source state

| Area | Current state | Next acceptance event |
|---|---|---|
| R1 undefined token | Consumer remains in `mobile-tap-targets.css`. | Preflight, one-property edit, static review. |
| R2 foreign-zone selector | `:where(.admin-btn--md)` remains in the same sheet. | Import-path preflight, narrow removal. |
| R3 portal duplicate | Deleted stylesheet and stale script entry removal are already present. | Confirm recorded equivalence and user validation. |
| R4 canvas fragment | Homepage canvas fragment removal is already present. | Confirm scoped values and user validation. |
| R5 reduced-motion owner | Base relocation and teaser cleanup are already present. | Confirm atomic ownership state and user validation. |
| R6 catalog CSS | Runtime owner is unproved. | Record evidence and obtain user decision; do not mutate. |

## Architecture and file ownership

FOCSS has four zone entries: Site, Admin, Planner, and Studio. Site, Admin, and Studio reach the Base index; Planner deliberately does not. That entry distinction is pinned and not part of this plan.

- Moving the universal reset to `base/animations.css` makes it reachable by Site, Admin, and Studio. Planner remains excluded; no Planner import is added.
- Admin loads `@focss/admin/entry.css`, not the Site components barrel. A Site-zone rule targeting an Admin primitive is inert for Admin and invalid for zone ownership.
- Site component order places the planner landing shared sheet after the homepage sheet. This supports static analysis of the duplicate canvas fragment but is not browser proof.

| Requirement | Target | Allowed action | State |
|---|---|---|---|
| R1/R2 | `site/focss/site/components/shared/mobile-tap-targets.css` | Replace one token reference; delete one rule. | Pending. |
| R3 | `portal-svg-catalog.css`, `shell-portal.css`, classifier script | Accept existing deletion only after static review; script change is deletion only. | Source change present. |
| R4 | Homepage and planner-landing hero sheets | Scope is the canvas fragment only. | Source change present. |
| R5 | Base animations and contact teaser sheets | Atomic relocation. | Source change present. |
| R6 | Catalog styles and theme sources | Read-only evidence tracing. | Decision blocked. |

No other stylesheet, fork tree, catalog file, or plan folder is implicitly owned.

## Detailed design

### R1 — established control-height token

The consent-link selector has specificity `0,1,1`; the preceding `:where(...)` group has zero specificity. The invalid `var(--touch-target-min)` declaration therefore wins and removes the floor. Replace only that reference with `var(--control-height-sm)`. Preserve the other declarations and do not create a synonym token.

Precondition: `--touch-target-min` remains undeclared and `--control-height-sm` remains `2.75rem`. If either is false, stop rather than apply the historical patch.

### R2 — inert foreign-zone selector

Remove only the `:where(.admin-btn--md)` rule after tracing the Admin layout through `admin/entry.css` and confirming it does not load Site components. The Admin button ramp is evidence for another owner; this design never edits it.

R1 and R2 are one reviewable edit because they share a file, but each has an independent precondition and rollback reason.

### R3 — portal deletion from static equivalence

The historical portal sheet was a duplicate of `shell-portal.css`. Accept its existing deletion only after recording a comparison of the scoped selectors, declarations, and 640px/768px/1100px/390px media rules. There must be no orphan-only declaration. The stale classifier-list entry is removed with the file.

This design states **static equivalence of the scoped source**, not that a rendered page was unchanged. If evidence is incomplete, restore the stylesheet and its classifier-list entry together.

### R4 — canvas-fragment ownership only

The canonical owner is `planner-landing-shared.css` for:

- `.planner-hero-demo__canvas`;
- its `svg` rule; and
- its scoped `.pl-*` descendants.

The homepage sheet retains parent, chrome, title/status, and keyframe rules. The design makes no general “one hero namespace” claim, because those remaining symbols were not part of the source change and are not established equivalent. Before accepting the existing removal, compare every scoped value and retain a differing value in the shared owner. Decorative SVG text sizes are preserved.

### R5 — atomic Base reset relocation

The universal `*, ::before, ::after` reduced-motion block belongs in `base/animations.css`. `home-base.css` remains the only owner of the scoped `.home-reveal` override. The atomic source state is:

1. Base has the seven universal declarations once.
2. The teaser sheet has neither the universal block nor duplicate `.home-reveal` rule.
3. The emptied component-level media wrapper is absent.

The reachability expansion to Site/Admin/Studio is intentional. Planner remains unchanged. Rollback reverses the move exactly: restore the teaser media wrapper with the two original rules and remove the Base block.

### R6 — catalog evidence before choice

Catalog CSS needs four facts kept separate:

| Evidence | Established fact | Unproved conclusion |
|---|---|---|
| Barrel imports | `styles/index.css` directly imports `theme.css`, `theme-premium-light.css`, and components. | The barrel is loaded by the application. |
| Theme imports | `theme-premium-light.css` transitively imports five token sheets. | All catalog styles are barrel-reachable. |
| Static import search | No static app-source import of the barrel or `blocks.css` was found. | No runtime loader exists. |
| Theme maps and filtering | TypeScript maps mirror material concepts; listed geometry keys are filtered. | TypeScript is sole owner or every material key is filtered. |

The result is a local decision record, not a CSS edit. It must state evidence, uncertainty, a bounded recommendation, a named decision maker, a date, and an explicit user decision. Any retain/delete/wire/tokenise implementation is a new approved plan.

## Correctness properties

1. The consent link uses the established control-height token and preserves its non-height declarations.
2. The Site zone no longer declares the named Admin selector.
3. The portal deletion has documented selector/declaration/media-query equivalence and no stale classifier reference.
4. The scoped canvas fragment has one owner; no assertion is made about other hero symbols.
5. The universal reset has one Base owner and `.home-reveal` has one homepage owner.
6. Catalog CSS remains untouched while the decision record distinguishes fact from runtime uncertainty.
7. No scope-external file, raw color, duplicate token concept, or foreign-zone import is introduced.

All properties are static. Viewport or rendered confirmation is outside this plan.

## Failure and rollback matrix

| Trigger | Required response |
|---|---|
| R1 token premise changes | Do not edit; re-plan from current source. |
| R2 import premise changes | Do not delete the selector. |
| Portal comparison finds divergence | Restore/retain the portal source until a deliberate merge is recorded. |
| Canvas fragment has divergent values | Preserve the value in the canonical owner before accepting removal. |
| Reset relocation is not atomic | Restore the teaser block and remove the Base copy. |
| Runtime ownership remains unproved | Record that limit; do not convert uncertainty into a deletion or wiring recommendation. |
| User static check fails | Preserve output, revert the smallest implicated atomic hunk, then re-evaluate evidence. |

## Verification design

Agents do not run tests, gates, browsers, builds, or test-like commands. After R1/R2 and source reconciliation, the user may run the exact static commands in [tasks.md](./tasks.md). Passing them validates their respective repository contracts only; it does not establish rendered or viewport outcomes.

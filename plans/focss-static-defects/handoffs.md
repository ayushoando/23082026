# Decision and handoff record — FOCSS static defects

This is a plan-local evidence record. It does not modify, supersede, or mark complete any other plan.

## Catalog CSS runtime-ownership decision

**Status:** Open — no user decision recorded.  
**Decision owner:** _Unassigned_  
**Decision date:** _Unassigned_  
**Follow-up plan:** _Unassigned_  
**Catalog mutation authorized:** No.

### Static evidence

| Source | Established fact | Limit |
|---|---|---|
| `site/lib/catalog/styles/index.css` | Directly imports `theme.css`, `theme-premium-light.css`, and catalog component sheets. | Does not prove the barrel is application-loaded. |
| `theme-premium-light.css` | Transitively imports `tokens-wood.css`, `tokens-metal.css`, `tokens-fabric.css`, `tokens-lighting.css`, and `tokens-primitives.css`. | Does not make all catalog sheets barrel-reachable. |
| Application source search | No static import of the catalog barrel or `site/lib/catalog/blocks.css` was found. | Does not exclude runtime loading outside that static path. |
| `site/lib/theme/plannerThemePacks.ts` | Material-token maps mirror CSS concepts and include raw hex values. | Does not prove TypeScript is the sole runtime owner. |
| `catalogTokenKeys.ts`, `ThemeProvider`, active-theme API | Enumerated catalog geometry keys are filtered from theme injection. | Does not prove every material `--block-*` key is filtered. |

### Current recommendation

Do not delete, wire, or tokenise catalog CSS. First establish a runtime load path or record that available source evidence cannot establish one. Then obtain an explicit user decision selecting exactly one of:

1. retain current catalog CSS and create a separately scoped remediation plan;
2. approve a separately scoped deletion proposal; or
3. approve a separately scoped barrel-wiring/tokenisation proposal.

No selection is currently made.

## Admin button ramp — owner handoff

**Target owner:** `plans/site-page-css-remediation/`  
**Transfer status:** Local evidence only; no external plan file was changed.

`site/focss/admin/base/buttons.css` defines `--sm` at 36px, `--xs` at 30px, `--icon-sm` at 36px, and `--icon-xs` at 30px. `--md` and `--icon` are 40px. The static audit associates this one shared ramp with the nineteen Admin-route target-size findings. The finding must be evaluated by the Admin/page-remediation owner; this plan must not change the Admin stylesheet.

## Planner/Studio control-density policy question

**Target owners:** Planner/Studio and page-remediation owners.  
**Transfer status:** Local evidence only; no fork file was changed.

Sub-40px controls occur in both forks, including small icon buttons, swatches, range thumbs, chips, and status controls. The required decision is product policy: whether a CAD-style workspace must support narrow 390px interaction with the same target-size expectation. This is not a mechanical CSS patch in the FOCSS static-defects plan.

## Deferred Next image-wrapper consolidation

**Target owner:** A future shared-primitive plan.  
**Transfer status:** Deferred.

The `span:has(> img)` wrapper override is repeated across approximately ten page-owned sheets. Consolidation offers no established behavior gain and would cross ownership boundaries. No source change is authorized here.

## 2026-08-27 execution reconciliation

### R2 selector ownership

**Status:** Blocked — re-plan required.  
`site/components/ui/Button.tsx` emits `admin-btn--md`. The former premise that the Site-zone selector had no Site-markup owner is false. Keep `:where(.admin-btn--md)` in place until the owning surface and responsive control-height policy are decided. No Admin or Site button CSS was changed in this plan.

### Non-fork TSX hardcoding inventory

**Scope:** Production non-fork TSX; Planner, Studio, `ooplanner`, and `oostudio` implementation paths excluded.  
**Resolved:** 21 exact source occurrences with existing semantic utilities.  
**Open:** 33 actionable source rows in `results/tsx-hardcoding-non-fork-remaining-actionable.csv`.

Open values lack an exact semantic owner. They include fixed panel dimensions, compact typography, stacking, dark-surface aliases, and error-boundary art direction. They need a separately approved semantic-token/utility decision; do not replace them with visually similar arbitrary Tailwind values.

### Admin ramp owner update

The candidate recipient for the Admin ramp evidence is `plans/remediation-unified/` if that plan accepts the handoff. This record does not modify or assume ownership transfer to that plan.

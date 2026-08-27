# CSS static audit baseline — FOCSS static defects

**Evidence class:** source-level baseline; not a browser, build, or verification report.

- **Baseline date:** 2026-08-26
- **Reconciled against working tree:** 2026-08-27
- **Baseline scope:** 172 CSS files, excluding `node_modules`, `.next`, and `.tmp`
- **Canonical plan:** [requirements](./requirements.md), [design](./design.md), [tasks](./tasks.md), [handoffs](./handoffs.md)

## Evidence limits

The audit establishes declarations, source-level import reachability, selector ownership, and duplicate source. It does not establish computed style, rendered target size, viewport outcome, screenshot equivalence, or runtime CSS loading that is absent from the searched static import graph.

## Reconciled status

| Baseline finding | Current source state | Plan state |
|---|---|---|
| Undefined `--touch-target-min` consumer | Still present in `mobile-tap-targets.css`. | Pending. |
| Site-zone `.admin-btn--md` rule | Still present in `mobile-tap-targets.css`. | Pending. |
| Unreachable portal duplicate | Stylesheet and stale classifier entry are absent in the working tree. | Source implementation present; user validation pending. |
| Duplicate hero canvas fragment | Homepage canvas fragment is absent; shared owner remains. | Source implementation present; user validation pending. |
| Universal reset in component sheet | Universal reset is in Base; component copies are absent. | Source implementation present; user validation pending. |
| Catalog CSS ownership | Runtime owner remains unproved. | Decision gate open; catalog is read-only. |

## Baseline inventory

| Location | Files | FOCSS-governed |
|---|---:|---|
| `site/focss/**` | 148 | Yes |
| `site/lib/catalog/**` | 19 | No |
| `tech-docs-generator/src/**` | 2 | No — separate inventory application |
| `site/app/(site)/globals.css` | 1 | Entry re-export |
| Other CSS/tooling artifacts | 2 | No |
| **Total** | **172** | |

## Findings retained by this plan

### 1. Undefined control-height reference

`a.contact-form-consent__link` consumes `var(--touch-target-min)` with no fallback. A baseline repository search found no declaration. The declaration is invalid at computed-value time; because its `a.contact-form-consent__link` selector outranks the preceding `:where(...)` floor rule, it suppresses rather than supplements that floor. The existing `--control-height-sm` token is `2.75rem`.

**Disposition:** R1 replaces only the invalid reference after fresh preflight. It does not introduce a new token.

### 2. Site-zone Admin selector

The Site-zone mobile-target sheet contains `:where(.admin-btn--md)`. Admin routes load the Admin entry, not the Site components barrel, so this is an inert foreign-zone rule.

**Disposition:** R2 deletes the rule after re-confirming imports. The Admin size ramp is explicitly out of scope and recorded in [handoffs](./handoffs.md).

### 3. Portal duplicate baseline

The audit found `portal-svg-catalog.css` unreachable from zone entries and duplicated by the portal block in `shell-portal.css`, including responsive rules at 640px, 768px, 1100px, and 390px. The only reference was a stale classifier-list path.

**Reconciliation:** The working tree removes both the orphan and stale list entry. The plan records source-level equivalence only; it does not claim rendered equivalence. `admin/components/design-kit.css` and `base/root.css` remain legitimate documented reachability exceptions.

### 4. Hero canvas fragment duplication baseline

The homepage and shared planner-landing sheets duplicated `.planner-hero-demo__canvas`, its `svg`, and a `.pl-*` canvas fragment. The shared sheet was the intended canonical owner.

**Reconciliation:** The homepage fragment is removed in the working tree; remaining homepage hero/chrome/keyframe rules are intentionally outside this plan. The previous broad “one namespace” wording is not retained because it exceeded the changed scope.

### 5. Universal reduced-motion reset baseline

A component sheet carried a universal `*, ::before, ::after` reduced-motion block and a duplicate `.home-reveal` override. The Base animations sheet is the correct universal-reset owner.

**Reconciliation:** The reset is now in Base, Site/Admin/Studio reach it through the Base index, Planner remains intentionally excluded, and `home-base.css` is the `.home-reveal` owner. This is a source-reachability change, not a browser claim.

### 6. Catalog CSS requires a decision, not a patch

The catalog CSS set contains duplicate primitive declarations and raw literals. It is outside FOCSS verification. The baseline's prior statement that catalog CSS was the only application raw-hex location was incorrect: raw hex also exists in `plannerThemePacks.ts`.

`styles/index.css` directly imports `theme.css`, `theme-premium-light.css`, and component sheets. `theme-premium-light.css` transitively imports five token sheets. A static search found no application import of the barrel or `blocks.css`, but that does not prove runtime non-use. The catalog key filter is limited to enumerated geometry keys and does not prove all material tokens are excluded.

**Disposition:** Record evidence and explicit user decision in [handoffs](./handoffs.md). No catalog deletion, wiring, or tokenisation belongs in this plan.

## Excluded evidence

- The Admin button ramp belongs to its owning remediation plan and is preserved locally as a handoff only.
- Planner/Studio control density is a product-policy decision, not a mechanical change here.
- Repeated Next image-wrapper overrides are deferred because consolidation crosses page ownership without established behavior gain.

## Unverified items

No browser measurement, computed-style inspection, build, test, gate, or static repository command was run by the agent. User-owned validation commands are listed in [tasks](./tasks.md).

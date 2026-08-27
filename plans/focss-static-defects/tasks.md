# Execution plan: FOCSS static-defects remediation

## Execution contract

This task register is the source of truth for this plan's current state. Scope is limited to this plan folder, named R1-R5 files, and necessary root planning index updates. It does not edit another plan, a fork, or catalog CSS.

- **`[ ]` Pending:** no accepted implementation exists.
- **`[x] Implemented in source:** the scoped change exists and static evidence has been reconciled. User validation is still pending.
- **Blocked:** no code action may proceed until the stated evidence or user decision exists.
- Wave 5 commands are user-owned. Agents do not run them.
- This plan must not absorb unrelated staged changes.

## State matrix

| Wave | State | Meaning |
|---|---|---|
| 0 | Pending | Reconfirm R1/R2 preconditions immediately before editing. |
| 1 | Pending | One narrow atomic edit to `mobile-tap-targets.css`. |
| 2 | Implemented in source | Existing structural duplicate cleanup; user validation pending. |
| 3 | Implemented in source | Existing reduced-motion relocation; user validation pending. |
| 4 | Blocked | Catalog CSS stays read-only pending evidence and explicit decision. |
| 5 | User-owned | Static validation commands only. |
| 6 | Local evidence complete | Handoffs are local; owner acceptance is external to this plan. |

## Wave 0 — Mandatory static preflight

- [ ] **0.1 Reconfirm R1 token premises.** Search for a declaration of `--touch-target-min`; confirm none exists. Confirm `site/focss/base/tokens/layout.css` still defines `--control-height-sm: 2.75rem`. Record both outcomes below. If either premise changed, stop and re-plan R1.
- [ ] **0.2 Reconfirm R2 reachability premises.** Read the Admin layout, `admin/entry.css`, and Site-components path. Record that Admin does not load the Site components barrel and `.admin-btn--md` has no Site-markup owner. If either condition is false, stop and re-plan R2.
- [ ] **0.3 Rebaseline current FOCSS exceptions.** Resolve imports from zone entries after the existing portal deletion. The expected exceptions are `admin/components/design-kit.css` (route-local) and `base/root.css` (pinned entry). The deleted portal file is not an expected current exception.
- [x] **0.4 Record boundaries.** The apparent duplicate Tailwind import in `chrome/index.css` was comment text. Planner/Studio entry divergence is pinned. Cross-plan evidence belongs only in [handoffs.md](./handoffs.md).

### Wave 0 evidence note

The 2026-08-27 source snapshot shows the R1 token consumer and R2 Admin selector still present. It also shows the R3-R5 source changes already present. Snapshot evidence is not a substitute for immediately preceding R1/R2 preflight.

## Wave 1 — Pending R1/R2 atomic edit

Perform 1.1 and 1.2 in one reviewable patch to `site/focss/site/components/shared/mobile-tap-targets.css`. Do not change adjacent rules.

- [ ] **1.1 Restore the consent-link floor.** Replace only `min-height: var(--touch-target-min)` with `min-height: var(--control-height-sm)` on `a.contact-form-consent__link`. Preserve `display`, `align-items`, and `padding-block`. Do not add a token declaration.
- [ ] **1.2 Remove the inert foreign-zone selector.** Delete only the `:where(.admin-btn--md)` rule after 0.2 passes. Do not change Admin button CSS.
- [ ] **1.3 Record the Site-zone foreign-selector inventory.** Search `site/focss/site/**` for `.admin-`, `.ooplanner-`, and `.oostudio-`. Record findings; new findings are handoff evidence only.
- [ ] **1.4 Review exact scope and rollback condition.** Confirm the patch changes only the two targeted rules. If 0.1/0.2 did not hold, or another selector/property changed, restore the one-file patch and re-plan.

### Wave 1 rollback

Restore the original token reference and exact Admin selector rule together when rolling back the atomic one-file patch. Do not alter Admin CSS as compensation.

## Wave 2 — Implemented structural duplicate cleanup; user validation pending

- [x] **2.1 Portal equivalence reconciled.** The deleted portal block matched `shell-portal.css` selector-for-selector and declaration-for-declaration, including 640px, 768px, 1100px, and 390px media rules. No orphan-only declaration or live-owner merge was identified.
- [x] **2.2 Portal orphan removed.** `site/focss/site/components/chrome/portal-svg-catalog.css` is absent in the working tree.
- [x] **2.3 Stale script entry removed.** `scripts/AsNeeded/finalize-surface-classify.mjs` no longer lists the obsolete portal path. Neighboring entries were not changed by this plan.
- [x] **2.4 Canvas-fragment equivalence reconciled.** The scoped homepage `.planner-hero-demo__canvas`/`.pl-*` fragment was a subset of the shared owner. No scoped value required a merge.
- [x] **2.5 Scoped homepage fragment removed.** The homepage file retains rules outside the canvas fragment. This plan does not claim remaining hero/chrome/keyframe symbols are deduplicated.
- [ ] **2.6 Preserve or reverse existing atomic hunks deliberately.** Before Wave 5, confirm the working-tree changes remain limited to the source changes described in 2.2, 2.3, and 2.5. If static equivalence is contradicted, reverse the affected atomic hunk rather than opportunistically changing a live owner.

### Wave 2 rollback

Restore the portal stylesheet and its classifier-list entry together. Restore only the deleted homepage canvas fragment for R4. Do not modify `shell-portal.css` or the shared planner owner unless a recorded merge exists.

## Wave 3 — Implemented Base reset relocation; user validation pending

- [x] **3.1 Universal reset relocated.** `base/animations.css` contains the seven-declaration universal reduced-motion block; `home-contact-teaser.css` no longer contains it.
- [x] **3.2 Reachability expansion recorded.** Site, Admin, and Studio reach the Base reset. Planner does not import the Base index and remains excluded. No Planner import was added.
- [x] **3.3 Duplicate component override removed.** `home-base.css` remains the sole `.home-reveal` owner. The teaser sheet has no duplicate rule or empty reduced-motion wrapper.
- [ ] **3.4 Preserve or reverse the atomic relocation deliberately.** Before Wave 5, re-read both files and confirm the seven universal declarations are in Base exactly once and the teaser change removed no unrelated rule.

### Wave 3 rollback

Remove the Base universal block. Restore the teaser's original reduced-motion media wrapper with its `.home-reveal` rule and seven-declaration universal block. Do not modify `home-base.css` or Planner imports.

## Wave 4 — Catalog evidence and explicit decision gate

No file under `site/lib/catalog/` is editable in this wave. There is no delete, move, barrel-wiring, or tokenisation task in this plan.

- [x] **4.1 Baseline trace recorded.** [handoffs.md](./handoffs.md) distinguishes barrel direct imports, five token sheets imported transitively by `theme-premium-light.css`, static-import absence, and the TypeScript/filter limitations.
- [ ] **4.2 Resolve runtime ownership or state the evidence limit.** Trace a verifiable runtime load path if one exists. If it cannot be established from permitted source evidence, record that uncertainty; do not infer TypeScript is the sole owner.
- [ ] **4.3 Obtain an explicit user decision in `handoffs.md`.** Allowed outcomes: retain with a separate follow-up plan; approve a separately scoped delete proposal; or approve a separately scoped wiring/tokenisation proposal. No decision means no catalog mutation.

### Wave 4 decision boundary

The decision record must contain decision maker, date, selected outcome, and follow-up plan identifier. Static-import absence alone never proves files are dead.

## Wave 5 — User-owned static validation

The user may run these from the repository root after Wave 1 and the Wave 2/3 reconciliation tasks are accepted. Agents do not run them.

- [ ] **5.1** `pnpm run verify:focss`
- [ ] **5.2** `pnpm run check:style-tokens`
- [ ] **5.3** `pnpm run lint:ui:strict`
- [ ] **5.4** `pnpm run check:layout`

A failure blocks acceptance of the implicated change; preserve its output and apply the relevant atomic rollback before re-planning. A pass proves only the associated static contract, not rendered or viewport behavior. `pnpm run scan:boundaries` is excluded because this plan does not edit a fork.

## Wave 6 — Local handoffs; no cross-plan mutation

- [x] **6.1 Admin ramp evidence captured locally.** The Admin size ramp and 19-route implication are recorded in [handoffs.md](./handoffs.md) for review by the owner of `plans/site-page-css-remediation/`; this plan does not modify that folder.
- [x] **6.2 Fork control-density decision captured locally.** Planner/Studio control density is recorded as a product decision, not a mechanical CSS defect.
- [x] **6.3 Image-wrapper duplication deferred locally.** The repeated Next image-wrapper selector is recorded as a future shared-primitive candidate; no source change is made.
- [ ] **6.4 Owner acceptance occurs outside this plan.** An owner may transfer the local evidence into its canonical plan only in a separately authorized task. This plan neither performs nor claims that transfer.

## Completion conditions

1. Wave 0 and Wave 1 are recorded against current source.
2. Wave 2 and Wave 3 reconciliation tasks show no unsupported source hunk.
3. Wave 4 has a dated explicit user decision, or an explicit unresolved state with no catalog mutation.
4. The user has recorded Wave 5 results, or has explicitly left the plan unverified.
5. No task claims browser or rendered verification that did not occur.

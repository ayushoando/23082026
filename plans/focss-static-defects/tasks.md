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
| 0 | Partially implemented | R1 preflight passed; R2 preflight disproved the no-Site-markup premise and is blocked. |
| 1 | Partially implemented | R1 is implemented in `mobile-tap-targets.css`; R2 remains blocked. |
| 2 | Implemented in source | Existing structural duplicate cleanup; user validation pending. |
| 3 | Implemented in source | Existing reduced-motion relocation; user validation pending. |
| 4 | Blocked pending explicit decision | Catalog evidence limit is recorded; catalog CSS stays read-only until a user decision. |
| 5 | User-owned | Static validation commands only. |
| 6 | Local evidence complete | Handoffs are local; owner acceptance is external to this plan. |

## Wave 0 — Mandatory static preflight

- [x] **0.1 Reconfirm R1 token premises.** No declaration of `--touch-target-min` exists. `site/focss/base/tokens/layout.css` defines `--control-height-sm: 2.75rem`. Both outcomes are recorded below; R1 was safe to implement.
- [ ] **0.2 Reconfirm R2 reachability premises — Blocked.** Admin does not load the Site components barrel, but shared `site/components/ui/Button.tsx` emits `.admin-btn--md`. The required no-Site-markup premise is false; R2 was re-planned as blocked and no selector was deleted.
- [ ] **0.3 Rebaseline current FOCSS exceptions.** Resolve imports from zone entries after the existing portal deletion. The expected exceptions are `admin/components/design-kit.css` (route-local) and `base/root.css` (pinned entry). The deleted portal file is not an expected current exception.
- [x] **0.4 Record boundaries.** The apparent duplicate Tailwind import in `chrome/index.css` was comment text. Planner/Studio entry divergence is pinned. Cross-plan evidence belongs only in [handoffs.md](./handoffs.md).

### Wave 0 evidence note

The 2026-08-27 source snapshot shows the R1 token consumer and R2 Admin selector still present. It also shows the R3-R5 source changes already present. Snapshot evidence is not a substitute for immediately preceding R1/R2 preflight.

## Wave 1 — Partially implemented: R1 complete; R2 blocked

Perform 1.1 and 1.2 in one reviewable patch to `site/focss/site/components/shared/mobile-tap-targets.css` only when both preconditions pass. R1 was implemented independently because R2's precondition is false. Do not change adjacent rules.

- [x] **1.1 Restore the consent-link floor.** Replaced only `min-height: var(--touch-target-min)` with `min-height: var(--control-height-sm)` on `a.contact-form-consent__link`; `display`, `align-items`, and `padding-block` are preserved. No token declaration was added.
- [ ] **1.2 Remove the inert foreign-zone selector — Blocked.** Do not delete `:where(.admin-btn--md)`: shared Button markup owns the class. Re-plan ownership before any selector removal.
- [ ] **1.3 Record the Site-zone foreign-selector inventory.** Search `site/focss/site/**` for `.admin-`, `.ooplanner-`, and `.oostudio-`. Record findings; new findings are handoff evidence only.
- [x] **1.4 Review exact scope and rollback condition.** Confirmed the R1 edit changes only the consent-link `min-height` declaration. R2 was not included because 0.2 failed; if the R1 property or an adjacent declaration changes, restore only the R1 declaration and re-plan.

### Wave 1 rollback

Restore only the original consent-link token reference when rolling back R1. Do not alter `:where(.admin-btn--md)` or Admin CSS; R2 was not changed.

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
- [x] **4.2 State the runtime-ownership evidence limit.** No verifiable runtime load path was established from permitted source evidence. The uncertainty is recorded in [handoffs.md](./handoffs.md); static-import absence does not establish dead code or TypeScript-only ownership, so no catalog mutation is authorized.
- [x] **4.3 Explicit user decision recorded — 2026-08-27.** Decision maker: repository owner. Selected outcome: **option 3, separately scoped wiring/tokenisation proposal**. Follow-up plan identifier: `catalog-theme-wiring-tokenisation` (to be created and approved as its own plan). Until that follow-up is approved and executed, catalog CSS is retained and remains read-only in this plan.

### Wave 4 decision boundary

The decision record must contain decision maker, date, selected outcome, and follow-up plan identifier. Static-import absence alone never proves files are dead.

## Wave 5 — Explicitly authorized static validation

These commands ran from the repository root on 2026-08-27 under then-explicit user authorization. They predate the later R1 and TSX exact-owner edits; their results remain historical evidence only, and post-edit reruns require current explicit authorization plus hook permission.

- [x] **5.1** `pnpm run verify:focss` — passed. Import, site CSS, fence, module-import, and structure checks passed; structure reported 142 stylesheets.
- [x] **5.2** `pnpm run check:style-tokens` — executed and failed, unrelated to this plan. The ratchet increased from `1 -> 3` in `site/components/home/Collections.tsx` and `5 -> 7` in `site/components/home/ShowcaseCarousel.tsx`, for a total `227 -> 231`. The two added animation arbitrary values in each component predate this plan and have no plan-owned source overlap. Do not run `--update`, change the baseline, or roll back R3-R5. Route a separate homepage-component remediation, then rerun this check.
- [x] **5.3** `pnpm run lint:ui:strict` — passed: `lint-ui-contract: ok (scheme freeze)`.
- [x] **5.4** `pnpm run check:layout` — passed: required workspace present, no nested installs, and no incorrect lock files.

A failure blocks acceptance only of the implicated source change. The Wave 5 token failure does not implicate an R1-R5 plan hunk, so no plan rollback is authorized. Passing checks prove their associated static contracts, not rendered or viewport behavior. `pnpm run scan:boundaries` remains excluded because this plan does not edit a fork.

## Wave 6 — Local handoffs; no cross-plan mutation

- [x] **6.1 Admin ramp evidence captured locally.** The Admin size ramp and 19-route implication are recorded in [handoffs.md](./handoffs.md) for conditional review by the owner of `plans/remediation-unified/`; this plan does not modify that folder.
- [x] **6.2 Fork control-density decision captured locally.** Planner/Studio control density is recorded as a product decision, not a mechanical CSS defect.
- [x] **6.3 Image-wrapper duplication deferred locally.** The repeated Next image-wrapper selector is recorded as a future shared-primitive candidate; no source change is made.
- [ ] **6.4 Owner acceptance occurs outside this plan.** An owner may transfer the local evidence into its canonical plan only in a separately authorized task. This plan neither performs nor claims that transfer.

## Completion conditions

1. Wave 0 and Wave 1 are recorded against current source.
2. Wave 2 and Wave 3 reconciliation tasks show no unsupported source hunk.
3. Wave 4 has a dated explicit user decision, or an explicit unresolved state with no catalog mutation.
4. Wave 5 results are recorded. After Wave 1 lands, rerun the applicable checks; final acceptance remains blocked until the separate homepage-component remediation resolves the `check:style-tokens` ratchet without raising its baseline.
5. No task claims browser or rendered verification that did not occur.

## Reconciliation supplement — 2026-08-27

This supplement supersedes earlier Wave 0/1 and completion wording where it conflicts with the current source.

- [x] **R1 preflight and implementation.** `--touch-target-min` was undeclared; `--control-height-sm` remained `2.75rem`; the consent-link declaration now uses the established token and preserves its surrounding declarations.
- [x] **TSX exact-owner remediation.** Twenty-one production non-fork audit occurrences were replaced only where an existing exact semantic utility was available. No Planner/Studio implementation path was changed.
- [x] **Inventory correction.** The three fractional-grid rows were reclassified out of actionable remediation. The plan baseline is 54 actionable rows; 21 are resolved by exact substitutions and 33 remain in `results/tsx-hardcoding-non-fork-remaining-actionable.csv`.
- [ ] **R2 blocked — re-plan required.** Do not delete `:where(.admin-btn--md)`: shared `site/components/ui/Button.tsx` emits that class, invalidating the former no-Site-markup premise.
- [x] **R6 decision recorded — wiring/tokenisation follow-up.** On 2026-08-27 the repository owner selected option 3: retain catalog CSS in this plan and create the separately scoped `catalog-theme-wiring-tokenisation` proposal. No catalog implementation file is modified here.
- [x] **Post-edit validation attempted and recorded.** On 2026-08-27, `pnpm run typecheck` passed and `pnpm run lint:ui:strict` passed. `pnpm run gate` stopped at `test:audit` on unrelated API-route policy failures (`app/api/hello/route.ts` lacks rate-limit/auth enforcement; `app/api/metrics/route.ts` lacks auth). General `pnpm run lint` reported 26 unused import/parameter errors. A Kane browser smoke attempt reached `http://localhost:3000` but exceeded the 180-second command limit without a final result; browser evidence is inconclusive, not passed. No gate failure is attributed to the R1 or exact TSX utility substitutions.

The active Admin ramp handoff owner is conditionally `plans/remediation-unified/` if that plan accepts the concern; no external plan file was changed.

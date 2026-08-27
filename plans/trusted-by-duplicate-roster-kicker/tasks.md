# Trusted By Duplicate Roster Kicker — Execution Tasks

## Execution status

The four-agent audit found that the reported duplicate is already absent from the current source. This task list therefore executes a plan/reference reconciliation and closeout, not a second source fix.

## Dependency graph

```text
1. Four-agent audit (complete)
   └── 2. Reconcile target plan artifacts (complete in this revision)
       └── 3. Relocate target references into plans/ (complete in this revision)
           └── 4. Spec-task-runner non-test closeout (next)
               └── 5. User-invoked validation follow-up (deferred)
```

No task may edit `site/app/(site)/trusted-by/page.tsx` because the current route already contains the required single localized mapping.

## Tasks

- [x] 1. Complete the four-agent audit
  - Audit the target plan and inbound references.
  - Trace the live `/trusted-by` route, view, copy, roster, and focused test.
  - Audit FOCSS/governance and confirm no CSS or fork scope is implicated.
  - Audit execution readiness, dirty-tree constraints, and runner ownership.
  - Record the consensus: current source has exactly one `rosterKicker={copy.rosterKicker}` and the original task graph is stale.

- [x] 2. Reconcile the target plan artifacts
  - Add `requirements.md` as the canonical current requirements record.
  - Rewrite `design.md` around the already-complete source state and localized `copy.rosterKicker` expression.
  - Rewrite `bugfix.md` as historical analysis, clearly separated from current requirements.
  - Replace this task graph with documentation-only closeout tasks.
  - Add a reconciliation record to `tasks.meta.json` while preserving historical execution records.

- [x] 3. Relocate target references into `plans/`
  - Update the four target rows in `plans-reports-references.csv`.
  - Update the same four target rows in `plans/plans-reports-references.csv` without overwriting its unrelated existing changes.
  - Point requirements, design, tasks, and bugfix rows at existing files under `plans/trusted-by-duplicate-roster-kicker/`.
  - Do not hand-edit or move generated `results/**` evidence.

- [ ] 4. Execute the reconciled closeout with `/spec-task-runner` and `/oando-master`
  - Inspect the route and focused-test invariants without modifying them.
  - Confirm the target plan/index paths and that no target source/test diff exists.
  - Run only non-test path-scoped checks, including `git diff --check` where appropriate.
  - Preserve unrelated dirty-tree changes.
  - Report changed files, commands, results, and blockers.

- [ ] 5. User-invoked validation follow-up
  - If the user wants fresh behavioral evidence, run the focused Trusted By test, typecheck, and build in a separate user-invoked validation session.
  - Run repository gates only when explicitly requested through the repository verification workflow.
  - Do not treat historical `tasks.meta.json` timestamps or generated screenshots as fresh validation.

## Acceptance criteria

- [ ] All current plan artifacts agree that the duplicate is historical/already resolved.
- [ ] The route still contains exactly one `rosterKicker={copy.rosterKicker}` mapping.
- [ ] The focused test’s 21 non-roster mappings remain unchanged.
- [ ] Both reference indexes point the target artifacts into `plans/trusted-by-duplicate-roster-kicker/`.
- [ ] No source, test, CSS, generated-result, Planner, Studio, database, or deployment file is changed by this execution.
- [ ] Non-test path-scoped closeout produces no unexpected target-source change or whitespace error.

## Notes

- `TRUSTED_BY_PAGE_COPY` remains the base copy source, but `copy` is the runtime-localized value and must remain authoritative at the route call site.
- Existing `.kiro/specs/...` locators in generated historical evidence are not current plan references and are intentionally left untouched.
- Existing unrelated modifications/deletions in the repository are outside this plan and must be preserved.

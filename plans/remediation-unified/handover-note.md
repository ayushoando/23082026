# Handover Note — Unified Remediation

**Date:** 2026-08-27  
**Owning plan:** `plans/remediation-unified/`  
**Status:** Implementation pass complete; verification and test cleanup remain open  
**Commit:** None created

## Purpose

This note records the current execution state for the unified remediation plan. The canonical requirements, design, and task definitions remain `audit.md`, `requirements.md`, `design.md`, and `tasks.md` in this directory. The existing `verification-checklist.md` contains the user-run verification matrix; this note adds the current handoff state and known gaps.

## Completed in the remediation pass

### Lane E — audit instrumentation

- Confirmed the existing audit support for storage-state sessions, bypass labeling, redirect-aware outcomes, measured/unmeasured coverage, route-chrome footer rules, the 24px floor/40px advisory split, and uncapped text sampling.
- Updated `scripts/site-page-audit.mjs` so its default output directory includes the `AUDIT_BASE_URL` hostname. A default localhost run is therefore labelled with `localhost-3000` rather than `production`.
- Recorded the implementation details in `decisions/E-audit-implementation.md`.
- E1.9/E1.10 remain user-owned because they require authenticated audit runs and publication of fresh evidence.

### Lane P — Planner project loading

- P1 client error handling now preserves HTTP status and a mirrored machine-readable error code while handling both bare-detail and error-envelope responses.
- `getProject`/related project calls accept optional abort-signal options without changing the URL or method contract.
- The P1.2 client error-carrier choice and rationale are recorded in `decisions/P1.2-error-carrier.md`.
- A prior code review verified the existing P2–P5 implementation surfaces:
  - typed Draft/Loading/Ready/Unauthorized/Forbidden/NotFound/Transient state handling;
  - parent-owned recovery actions through `PlannerProjectLoadState`;
  - route-id precedence over local storage;
  - stale/aborted request protection and success-handoff guards;
  - a mounted Fabric canvas with a Planner-scoped load gate;
  - project-list error, retry, stale-response, and unmount-abort handling;
  - Planner-scoped responsive gate/recovery styles in `workspace-shell.css`.
- No Planner API route was changed, so P6.3 route coverage was not added. The route remains uncovered as required by the plan’s “if and only if touched” rule.

### Lane S — calculator owner gap

- Added `site/focss/site/components/shared/tools.css` for `.tools-engine-placeholder` and `.tools-faq`.
- Imported the new sheet from `site/focss/site/components/shared/index.css`.
- The decision to style the existing non-indexable pages instead of withdrawing them or building a real calculator is recorded in `decisions/S1.1-calculator-gap.md`.

### Supporting test changes

- Repaired the malformed `include` array in `tests/tsconfig.json`, which previously caused `TSCONFIG_ERROR` at line 33.
- Added/updated Planner API assertions for error codes and adjusted Planner integration-test mocks for the dock-panel exports and Fabric refs.

## Validation observed

These results were observed during the implementation pass; no new test or gate command was run while creating this note.

| Check | Result |
|---|---|
| `pnpm run typecheck` | Passed during the prior implementation pass. |
| `pnpm run test:unit -- tests/unit/components/Planner/PlannerProjectLoadState.test.tsx` | Passed: 12/12 tests. |
| `pnpm run test:unit -- tests/unit/lib/Planner/plannerApi.test.ts` | 25/28 passed. Three legacy path assertions still expect `browserApiFetch(url)` but receive `browserApiFetch(url, { signal: undefined })`. |
| `pnpm run test:unit -- tests/unit/components/Planner/Planner.test.tsx` | 1/9 passed. The suite still does not invoke the mocked project load for route-id cases and needs harness/effect investigation. |
| Audit, browser lane, layout/style gates, boundary scan | Not run in this handoff; these are user-owned verification steps. |

The two failing test groups are not evidence that the production behavior is correct. Keep P6.2 open until the integration harness is fixed and the focused lane passes or the remaining failures are explicitly accepted by the user.

## Immediate follow-up

1. Resolve the three `plannerApi` path-contract assertions. Decide whether the client should omit the options object when no signal is supplied or whether the tests should assert the optional `{ signal: undefined }` argument.
2. Fix `Planner.test.tsx` so route-id loading, loading state, all error branches, retry, stale/abort suppression, successful handoff, and Draft preservation are actually exercised.
3. Run the focused Planner tests again after those fixes.
4. Run the authenticated E1.9 audit using admin and member storage states. Preserve the existing `results/site/page-audit-production-complete` artifact and publish a newly labelled result.
5. Complete V3’s five-width browser checks and confirm there is one active GET per project id on mount and user-triggered retry.
6. Run the user-owned V4 gates: `check:layout`, `verify:focss`, `lint:ui:strict`, `check:style-tokens`, and `scan:boundaries`.
7. Reconcile the V5 graph command before running it: the plan references `scripts/graph-impact.mjs`, while the current scripts listing visibly contains `scripts/generate-page-component-graph.mjs`. Do not silently substitute one for the other.
8. Add only genuine runtime/environment blockers to root `Failures.md`; it is currently empty.

### Windows audit reminder

For a storage-state audit in PowerShell, set the environment variable before invoking the command, for example:

```powershell
$env:AUDIT_STORAGE_STATE = ".\storage-state-admin.json"
pnpm run audit:site-pages
Remove-Item Env:AUDIT_STORAGE_STATE
```

The package script currently passes an explicit `--out=results/site/page-audit-latest`; confirm the chosen output path still satisfies the hostname-label requirement before treating the run as complete.

## Working-tree boundaries

The following files are part of the remediation pass or its handoff records:

- `scripts/site-page-audit.mjs`
- `site/lib/Planner/plannerApi.ts`
- `site/focss/site/components/shared/index.css`
- `site/focss/site/components/shared/tools.css`
- `tests/tsconfig.json`
- `tests/unit/lib/Planner/plannerApi.test.ts`
- `tests/unit/components/Planner/Planner.test.tsx`
- `plans/remediation-unified/decisions/*`
- `plans/remediation-unified/verification-checklist.md`
- `plans/remediation-unified/handover-note.md`

The current working tree also contains unrelated changes, including environment and AI-provider files, dependency/lockfile changes, and deletions or relocations under `plans/ref/` and `plans/scripts-folder-audit/`. Do not reset, clean, or attribute those changes to this remediation pass. Review them separately before staging or committing.

`plans/PLAN.md` is referenced by repository guidance but is not present in the current working tree. Use `plans/remediation-unified/` and this note as the active handoff context until that coordination-file discrepancy is resolved.

## Definition of handoff complete

The implementation can be handed to the next agent with the following caveat: the code and decision records are present, the load-state component tests pass, and the known remaining work is test-harness cleanup plus user-owned audit/browser/gate verification. Do not mark the unified plan fully verified until those checks produce fresh evidence.

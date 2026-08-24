## Overview

This plan resolves the duplicate `rosterKicker` JSX attribute in the Trusted By page through a requirements-first bugfix workflow. It preserves the existing exploratory and preservation checks, applies only the narrow call-site correction, validates the fix with the specified `pnpm` commands, and finishes with a diff and checkpoint review.

## Task Dependency Graph

Execution order and prerequisites:

```text
1. Bug-condition exploration test
   └── prerequisite for 3.1; establishes and documents the unfixed counterexample

2. Preservation property tests
   └── prerequisite for 3.1; establishes the non-buggy baseline to preserve

3. Remove exactly one duplicate rosterKicker attribute
   ├── 3.1 Implement the narrow call-site correction
   │   ├── requires tasks 1 and 2
   │   ├── prerequisite for 3.2
   │   └── prerequisite for 3.3
   ├── 3.2 Verify the bug-condition exploration test now passes
   │   └── requires 3.1
   └── 3.3 Verify preservation tests still pass
       └── requires 3.1

4. Run repository validation gates
   └── requires 3.2 and 3.3; check:layout runs before gate:fast

5. Check final diff and checkpoint
   └── requires task 4 and all preceding implementation and verification tasks
```

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "dependsOn": []
    },
    {
      "wave": 2,
      "tasks": ["3.1"],
      "dependsOn": ["1", "2"]
    },
    {
      "wave": 3,
      "tasks": ["3.2", "3.3"],
      "dependsOn": ["3.1"]
    },
    {
      "wave": 4,
      "tasks": ["4"],
      "dependsOn": ["3.2", "3.3"]
    },
    {
      "wave": 5,
      "tasks": ["5"],
      "dependsOn": ["4"]
    }
  ]
}
```

No implementation or validation task may begin before the required pre-fix exploration and preservation observations are complete. Tasks 3.2 and 3.3 may run independently after 3.1, but both must complete before task 4; task 5 is the final checkpoint.

## Tasks

# Implementation Plan

- [-] 1. Write the bug-condition exploration test before implementing the fix
  - **Property 1: Bug Condition** - Unique authoritative roster kicker
  - **IMPORTANT**: Write and run this exploration check against the unfixed source before changing `site/app/(site)/trusted-by/page.tsx`.
  - **GOAL**: Surface the concrete counterexample proving that the failure is caused by the repeated JSX attribute, not by the `TrustedByPageView` prop contract or route-copy source.
  - **Scoped PBT Approach**: Scope the deterministic property to the current `TrustedByPageView` invocation where `countAttributes(input, "rosterKicker") > 1`, both occurrences resolve to `TRUSTED_BY_PAGE_COPY.rosterKicker`, and the type checker reports TS17001. The focused source assertion should require the corrected invocation to contain exactly one authoritative mapping; it is expected to fail on the unfixed snapshot and pass after the fix.
  - Inspect the current invocation and confirm the duplicate occurrence appears after `sectors`, while the retained occurrence appears before `quotesKicker`.
  - Run `pnpm run typecheck` from the repository root against the unfixed code and record the exact TS17001 diagnostic for `site/app/(site)/trusted-by/page.tsx`.
  - Run `pnpm run build:site` from the repository root against the unfixed code and record the exit/output honestly; a build interrupted by the environment is not evidence of a successful build.
  - Document the counterexample: the same `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` mapping is supplied twice, so TypeScript rejects the JSX before production validation can pass.
  - _Requirements: 1.1, 1.2_

- [~] 2. Write preservation property tests before implementing the fix
  - **Property 2: Preservation** - All non-roster-kicker behavior
  - **IMPORTANT**: Follow the observation-first methodology and verify the preservation checks pass on the unfixed code before changing the source.
  - **Scoped PBT Approach**: For the non-bug condition (`NOT isBugCondition(input)`), compare the Trusted By invocation and rendered route behavior while excluding only the duplicate `rosterKicker` occurrence. Generate or inspect valid non-roster prop mappings and assert their names, source expressions, ordering semantics, and values remain unchanged.
  - Extend the existing focused coverage at `tests/unit/app/(site)/trusted-by/page.test.tsx` or add the smallest focused source-level assertion needed to verify that the remaining roster mapping must continue to be `TRUSTED_BY_PAGE_COPY.rosterKicker` and that every other `TrustedByPageView` prop remains present.
  - Observe and capture the unfixed baseline for the roster section, roster kicker text/accessibility label, hero, overview, statistics, clients, quotes, sectors, CTA, `/trusted-by` route, metadata, JSON-LD, derived sectors, layout, and `ContactTeaser`.
  - Run the focused test with `pnpm exec vitest run --config tests/vitest.config.ts "tests/unit/app/(site)/trusted-by/page.test.tsx"` from the repository root and require the existing non-buggy behavior checks to pass on the unfixed code.
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Remove exactly one duplicate `rosterKicker` JSX attribute
  - _Bug_Condition: `isBugCondition(input)` where the `TrustedByPageView` invocation contains more than one `rosterKicker` attribute, at least one uses `TRUSTED_BY_PAGE_COPY.rosterKicker`, and type checking reports TS17001.
  - _Expected_Behavior: `expectedBehavior(result)` requires exactly one `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` mapping, no TS17001 diagnostic for the Trusted By page, and unchanged non-duplicate mappings and route behavior.
  - _Preservation: Preserve the authoritative roster copy, every other existing `TrustedByPageView` prop and its source/value semantics, route assembly, metadata, JSON-LD, clients, sectors, layout, `ContactTeaser`, and unrelated application behavior.
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

  - [~] 3.1 Implement the narrow call-site correction
    - Modify only `site/app/(site)/trusted-by/page.tsx` in the `TrustedByPage` component’s `TrustedByPageView` JSX invocation.
    - Delete exactly one duplicate `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` attribute: remove the second occurrence after `sectors` and retain the existing occurrence before `quotesKicker`.
    - Do not replace the remaining mapping with a literal, another copy field, or a derived value; it must remain `TRUSTED_BY_PAGE_COPY.rosterKicker`.
    - Leave `quotesKicker`, `quotesTitle`, `quotes`, `sectors`, sector copy, all hero/overview/statistics/client props, all CTA props, metadata, JSON-LD, route paths, layout composition, and `ContactTeaser` unchanged.
    - Do not modify `TrustedByPageView`, route-copy data, client data, shared components, unrelated routes, or any other source file.
    - _Requirements: 2.1, 2.3, 3.1, 3.2, 3.3_

  - [~] 3.2 Verify the bug-condition exploration test now passes
    - **Property 1: Expected Behavior** - Unique authoritative roster kicker
    - Re-run the same Property 1 exploration check from task 1; do not write a replacement test.
    - Assert the invocation now contains exactly one `rosterKicker` attribute and that its expression is `TRUSTED_BY_PAGE_COPY.rosterKicker`.
    - Run `pnpm run typecheck` from the repository root and require no TS17001 diagnostic originating from `site/app/(site)/trusted-by/page.tsx`.
    - Run `pnpm run build:site` from the repository root to completion and require a successful production site build with no Trusted By type-check failure.
    - _Requirements: 2.1, 2.2_

  - [~] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - All non-roster-kicker behavior
    - Re-run the same Property 2 checks from task 2; do not write replacement tests.
    - Run `pnpm exec vitest run --config tests/vitest.config.ts "tests/unit/app/(site)/trusted-by/page.test.tsx"` and require the existing Trusted By rendering, copy, roster, sectors, CTA, metadata, JSON-LD, and `ContactTeaser` assertions to pass.
    - Confirm the diff contains no changes to any non-duplicate prop mapping, copy source, route assembly, component, data source, or unrelated application area.
    - _Requirements: 2.3, 3.1, 3.2, 3.3_

- [~] 4. Run the repository validation gates
  - Run commands from the repository root using `pnpm` only; do not substitute npm, yarn, or another package manager.
  - Run `pnpm run check:layout` first, as required by the repository process floor.
  - Run `pnpm run gate:fast` and require all included checks to pass, including type checking, test/typecheck lanes, lint, UI validation, launch checks, documentation checks, style-token checks, and governance checks.
  - If a validation command fails, record the fresh command, working directory, exit code, relevant output, and blocker in `Failures.md`; do not claim the task is complete from a partial green result.
  - _Requirements: 2.2, 3.3_

- [~] 5. Check the final diff and checkpoint
  - Run `git diff --check` and inspect `git status --short` from the repository root.
  - Inspect `git diff -- "site/app/(site)/trusted-by/page.tsx"` and confirm the source diff removes exactly one duplicate `rosterKicker` JSX attribute and makes no other source changes.
  - Confirm the single remaining roster mapping still uses `TRUSTED_BY_PAGE_COPY.rosterKicker`, all other props and behavior remain preserved, and no unrelated file is modified.
  - Confirm the only intentional deliverables are this tasks document and the narrowly scoped implementation/test changes produced by the later implementation phase; this task-creation phase itself must not modify source code.
  - Ensure all tests and validation commands above pass before marking the bugfix complete.
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
## Notes

- Preserve the current task scope, ordering, requirement references, validation commands, and bug-condition methodology.
- The intended implementation remains limited to deleting exactly one duplicate `rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}` attribute from `site/app/(site)/trusted-by/page.tsx`.
- Do not modify the requirements document, design document, unrelated source code, or other routes as part of this task-plan update.
- Validation failures must be recorded in `Failures.md` as already specified; do not claim completion from partial validation.
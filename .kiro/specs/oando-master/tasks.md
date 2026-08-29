# Implementation Plan: Oando Master Skill Reconciliation

## Overview

Reconcile only the canonical repository-local Kiro skill at `.kiro/skills/oando-master/SKILL.md`. The work makes its entry-point, additive skill-routing, local-first optional Power-selection, and evidence-based completion guidance explicit while preserving its existing authority order and unrelated guidance. No runtime code, scripts, tests, hooks, policy changes, or Power activation are in scope.

## Tasks

- [x] 1. Reconcile the canonical Oando Master Skill contract
  - [x] 1.1 Make the canonical entry-point and authority language explicit in `.kiro/skills/oando-master/SKILL.md`
    - State that this exact path is the canonical repository-local Kiro skill workflow for Repository Task routing and completion criteria.
    - Retain the existing front matter, the exact authority order, the smallest-sound-change directive, and the direction to use referenced skill guidance for domain-specific instructions.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 4.1, 4.2_

  - [x] 1.2 Reconcile conditional, additive routing for named and additional repository skills in `.kiro/skills/oando-master/SKILL.md`
    - Preserve the named routes to `repo-map`, `graph-impact`, `focss-css`, `fork-boundaries`, and `db-migrations`; clarify that `graph-impact` applies to shared-code changes as well as impact analysis.
    - Require routing to every applicable referenced guidance when conditions overlap, and add a conditional route for an evidenced matching Additional Repository Skill without inventing a fixed inventory or default route.
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 1.3 Reconcile the local-first, registry-confirmed optional Power decision in `.kiro/skills/oando-master/SKILL.md`
    - Preserve the candidate-Power table as candidate guidance rather than installation evidence.
    - State the ordered decisions: use Local Evidence first; consult the Installed-Power Registry only when it is insufficient; present a needed, confirmed Power as optional; continue with local evidence and applicable skills when unconfirmed; and require confirmation before any requested activation.
    - Do not activate a Power or modify the installed-power registry.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 1.4 Wire the completion and reporting contract together in `.kiro/skills/oando-master/SKILL.md`
    - Preserve current User Authorization and Hook Permission policy. Clarify that an observed Test-Like Command result is Validation Evidence only when both apply, otherwise identify the exact command as Pending User Validation without claiming a pass.
    - Require applicable Fork Boundary validation evidence before a changed Studio or Planner Fork Tree is reported as fully complete; distinguish the task goal, changed scope, observed evidence, and pending validation in completion reporting.
    - Limit escalation to evidenced True Blockers that prevent completion within the authorized scope, recorded in root `Failures.md`; retain unrelated existing content and confirm no files outside the canonical skill require changes.
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

- [x] 2. Checkpoint - Ensure documentation reconciliation is coherent
  - Perform the design-specified static inspection of the final skill against the requirements and one-file scope; do not add or run tests and do not seek user input. No test is added or run for this documentation-only feature; perform only the design-specified static inspection of the final skill against the requirements and its one-file scope.

## Notes

- Every implementation leaf modifies the same canonical Markdown file and is intentionally serialized to prevent conflicting edits.
- The design's Correctness Properties describe the prose contract; no property, unit, integration, or runtime test task is included because the approved scope and verification strategy explicitly exclude tests and scripts.
- The plan preserves, rather than changes, validation authorization policy, hook behavior, validation command inventory, and candidate-Power installation status.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4"] }
  ]
}
```

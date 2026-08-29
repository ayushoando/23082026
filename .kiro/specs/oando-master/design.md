# Design Document: Oando Master Skill

## Overview

This change is a documentation-only reconciliation of the canonical repository-local Kiro skill at `.kiro/skills/oando-master/SKILL.md`. The skill remains the single entry point for repository task routing and evidence-based completion. The design makes the existing guidance explicit where the requirements need precision, without creating a product feature, executable routing engine, runtime interface, package command, hook change, validation-policy change, or automatic Power activation.

The canonical skill will continue to honor the repository authority order:

1. Current user instruction
2. Live repository evidence and fresh command output
3. `AGENTS.md`
4. `Agents/`
5. `docs/`

The change is intentionally limited to the canonical skill content. The existing `.kiro/specs/oando-master/.config.kiro` already identifies this as a `fast-task` feature specification and requires no change.

## Goals

- State `.kiro/skills/oando-master/SKILL.md` as the canonical surface for repository task routing and completion criteria.
- Preserve conditional, additive routing to repository-local skill guidance.
- Make Power selection local-first, registry-confirmed, optional, and non-automatic.
- Make completion claims depend on the task goal, appropriately authorized evidence, required fork-boundary evidence, and honest pending-validation reporting.
- Preserve the existing smallest-change and narrow-validation discipline.

## Non-Goals

- No modification to hooks, including `block-agent-tests`, tool matchers, permission behavior, or hook files.
- No modification to the repository validation policy, its authorization model, or the commands it names.
- No runtime, product, database, application, package, or CI changes.
- No creation of a router implementation, schema, API, CLI, or executable test suite.
- No automatic activation of Powers, and no assertion that listed candidate Powers are installed.
- No replacement of domain-skill guidance; the master skill directs work to the referenced canonical guidance.

## Current-State Reconciliation

The existing skill already provides the authority order, domain routing table, candidate-Power table, validation guard, and completion checklist. The reconciliation tightens those existing sections instead of restructuring the repository:

| Existing area | Required hardening | Design decision |
|---|---|---|
| Introduction | Canonical surface and workflow terminology are implicit | Name the exact canonical path and describe it as the repository-local Kiro skill workflow for routing and completion. |
| Domain routing | Shared-code wording and additional-skill routing are incomplete | Retain the current named Domain Skills; expand `graph-impact` to include shared-code changes or impact analysis, and add a generic conditional rule for any matching Additional Repository Skill. |
| Multiple conditions | Current wording activates both matching skills | Preserve additive routing while phrasing it as routing to every applicable referenced guidance; this avoids treating non-matching skills as required. |
| Power routing | Local-first and confirmation are present but not fully decision-complete | State the evidence sufficiency, registry confirmation, optional presentation, unavailable-candidate fallback, and requested-activation checks as ordered decisions. |
| Completion | Evidence and pending status are present but reporting and fork gating need precision | Keep the existing authorization conditions unchanged; distinguish observed evidence from pending validation, require fork-boundary evidence before a fork change is reported fully complete, and identify changed scope and true-blocker escalation. |

## Architecture

### Canonical Documentation Surface

`SKILL.md` remains the only implementation surface. Its front matter continues to identify `oando-master` as the entry point. The body has four stable concerns:

1. **Authority and scope:** identifies the canonical surface, repository-local workflow, authority ordering, and smallest-sound-change directive.
2. **Conditional skill routing:** selects all applicable repository-local Domain Skills or Additional Repository Skills from task conditions.
3. **Local-first capability routing:** selects a specialized Power only after local evidence is insufficient and the installed-power registry confirms the needed candidate.
4. **Evidence-based completion:** classifies validation status, gates completion, identifies scope, and escalates only evidenced true blockers.

This keeps the skill a concise navigation and completion contract rather than duplicating the detailed instructions held by referenced skills or governance documents.

### Content Flow

```text
Repository Task
  → apply authority ordering
  → inspect local repository evidence
  → route to every matching Domain/Additional Repository Skill guidance
  → if the unanswered need requires a specialized capability:
       consult Installed-Power Registry
       → confirmed and needed: present optional Power
       → not confirmed: continue with local evidence and applicable skills
  → make the smallest sound change
  → select narrow, applicable validation
  → classify results as evidence or pending validation
  → evaluate completion and report scope, evidence, pending work, or true blocker
```

The flow is guidance only. It does not execute tools, invoke Powers, alter validation permissions, or perform side effects itself.

## Components and Responsibilities

| Component | Location | Responsibility | Boundary |
|---|---|---|---|
| Master routing and completion contract | `.kiro/skills/oando-master/SKILL.md` | Express authority, routing, capability selection, and completion rules | Documentation guidance only; not an executable router. |
| Referenced Domain Skill guidance | Existing repository-local skills such as `repo-map`, `graph-impact`, `focss-css`, `fork-boundaries`, and `db-migrations` | Supply domain-specific workflow after a condition matches | Remains authoritative for domain details; is not duplicated. |
| Additional Repository Skill guidance | Matching repository-local skill | Supply its own documented instructions when a task condition matches | Selected conditionally; no fixed inventory is assumed. |
| Installed-Power Registry | Current workspace capability inventory | Confirm whether a candidate Power is available | Confirmation is required before a Power is offered or activated. |
| Repository governance | `AGENTS.md`, `Agents/`, and `docs/` | Provide ordered repository rules and references | Retains precedence under user instruction and live evidence. |
| Failure record | Root `Failures.md` | Hold evidence for an actual blocker that prevents scoped completion | Used only for true blockers, never as a general status log. |

## Interfaces

The skill exposes a prose workflow rather than a programmatic API. The following conceptual interfaces define how its guidance should be applied.

### Task-routing interface

| Input condition | Required guidance output |
|---|---|
| A Repository Task begins | Provide routing guidance and completion criteria from the canonical skill. |
| Orientation or location discovery is needed | Route to `repo-map` referenced guidance. |
| Shared code changes or impact analysis is needed | Route to `graph-impact` referenced guidance. |
| Styling Scope changes | Route to `focss-css` referenced guidance. |
| A Studio or Planner Fork Tree changes, or related imports are evaluated | Route to `fork-boundaries` referenced guidance. |
| Database Work is needed | Route to `db-migrations` referenced guidance. |
| A condition matches an Additional Repository Skill | Route to that skill's referenced guidance. |
| More than one condition matches | Preserve all applicable routes; do not choose one by discarding another. |

### Capability-selection interface

| Input state | Decision |
|---|---|
| Local Evidence answers the question | Use Local Evidence; do not select a Power. |
| Local Evidence is insufficient | Consult the Installed-Power Registry before evaluating a candidate Power. |
| A needed candidate is confirmed by the registry | Present it as an optional specialized capability. |
| A candidate is unconfirmed | Do not claim it is installed, do not activate it, and continue with Local Evidence and applicable skills. |
| A task explicitly requests activation | Require Installed-Power Registry confirmation before activation can occur. |

### Completion-reporting interface

| Input state | Required report behavior |
|---|---|
| Changed task scope | Identify the changed scope. |
| Test-Like Command has current User Authorization and Hook Permission | Treat its observed result as Validation Evidence. |
| A required Test-Like Command lacks either condition | Identify the exact command as Pending User Validation; do not report it as passed. |
| Fork Tree changed | Require applicable Fork Boundary validation evidence before claiming the task fully complete. |
| True Blocker prevents completion within authorized scope | Record the evidenced blocker in root `Failures.md`. |

## Conceptual Data Model

No data is persisted and no production type is introduced. These conceptual records make the documentation contract unambiguous and can guide a future static checker without requiring one now.

| Record | Fields | Meaning |
|---|---|---|
| `RepositoryTaskContext` | `conditions`, `goal`, `changedScope`, `localEvidenceSufficient`, `forkChanged` | Facts used to route a repository task and determine completion needs. |
| `RouteDecision` | `matchedDomainSkills`, `matchedAdditionalSkills`, `referencedGuidance` | Additive set of applicable repository-local instructions. |
| `CapabilityDecision` | `registryConsulted`, `candidateConfirmed`, `candidateNeeded`, `optionalPower`, `activationAllowed` | Local-first decision state for a candidate Power. |
| `ValidationStatus` | `command`, `userAuthorized`, `hookPermitted`, `observedResult`, `classification` | Classifies a command result as Validation Evidence or Pending User Validation. |
| `CompletionReport` | `goalMet`, `changedScope`, `validationEvidence`, `pendingValidation`, `forkBoundaryEvidence`, `trueBlocker` | The facts needed to make an evidence-based completion statement. |

## Detailed Design

### 1. Canonical entry point and authority

The opening section will explicitly state that `.kiro/skills/oando-master/SKILL.md` is the canonical repository-local Kiro skill workflow for Repository Task routing and completion criteria. It will retain the existing authority order exactly and direct domain-specific questions to the referenced skill guidance rather than restating it.

### 2. Conditional, additive skill routing

The routing table will preserve the existing five named Domain Skills and their normal validation context. Its conditional language will cover orientation, shared-code impact, styling, fork boundaries, and Database Work. A final rule will cover an Additional Repository Skill when its condition matches.

The routing semantics are additive: a task can route to more than one skill when its conditions overlap. This preserves the useful existing behavior for, for example, a shared Studio change that needs both impact analysis and fork-boundary guidance. It does not create a default route for unrelated skills.

### 3. Local-first, confirmed Power selection

The Power section will retain its candidate table and explicitly label the entries as candidate routes rather than installation claims. Its ordered decision rule is:

1. Use repository documentation, source, configuration, and fresh command output first.
2. Only when those sources do not answer the need, inspect the Installed-Power Registry.
3. Offer a confirmed and needed Power as an optional specialized capability.
4. If the registry does not confirm the candidate, keep routing through Local Evidence and applicable repository skills.
5. A requested Power activation still requires confirmation; the master skill never activates a Power automatically.

This uses available local evidence before external capability selection and prevents a stale candidate list from being mistaken for an installed capability inventory.

### 4. Narrow, authorized validation and completion

The existing test-and-gate authorization section is retained as policy, not changed. The design only makes its use in the completion contract explicit:

- The task owner chooses the smallest sound change and narrowest applicable validation.
- A Test-Like Command produces Validation Evidence only after current-session User Authorization and Hook Permission, and only after an observed result.
- If either permission condition is missing, the exact command is Pending User Validation. It is not a passing result and it is not silently bypassed.
- Fork Tree changes add Fork Boundary validation to the applicable completion evidence. If that validation is pending, the report must state that pending status rather than falsely claiming fully evidenced completion.
- A completion report identifies the goal, changed scope, observed Validation Evidence, and Pending User Validation separately.
- Only an evidenced condition that prevents completion within authorized scope is a True Blocker, and it is recorded in root `Failures.md`.

## Error Handling and Safe Fallbacks

| Situation | Safe response |
|---|---|
| A task condition does not match a named Domain Skill | Continue under the master completion contract and route to a matching Additional Repository Skill only if one is evidenced. |
| More than one condition matches | Preserve every applicable skill route instead of resolving the conflict by dropping guidance. |
| Local Evidence is incomplete | Consult the Installed-Power Registry before considering a candidate Power. |
| Candidate Power is absent from the registry | Do not activate or represent it as available; continue with Local Evidence and applicable Domain Skills. |
| A Power activation is requested but unconfirmed | Decline activation pending registry confirmation; no automatic fallback activation occurs. |
| Required Test-Like Command lacks user authorization or hook permission | Mark the exact command Pending User Validation and retain the task's evidence gap honestly. |
| Fork Boundary validation is pending for a fork change | Do not make a fully evidenced completion claim; identify the missing validation as pending. |
| A validation result fails | Address it within scope when possible; otherwise identify it with evidence as an unrelated constraint or true blocker only if it prevents completion. |
| A true blocker prevents completion | Record evidence in root `Failures.md` and report the blocker without creating a competing blocker log. |

## Correctness Properties

*A property is a behavior that must hold across the applicable task states. These properties describe the master skill's routing and completion contract; they do not require the documentation-only change to add an executable router.*

### Property Reflection

The prework identified individual routing rules for five Domain Skills and Additional Repository Skills. They are consolidated into Property 1 because one additive routing invariant subsumes each individual category rule and also covers tasks with multiple matching conditions. The five capability rules are consolidated into Property 2 because they are branches of one local-first selection decision. The two permission conditions, permitted-evidence branch, pending branch, and reporting distinction are consolidated into Property 3. Completion goal, evidence, and fork-boundary gating combine in Property 4. Scope disclosure and true-blocker escalation remain separate in Property 5 because they govern report integrity and external record placement rather than the completion predicate.

### Property 1: Additive guidance routing

For any Repository Task whose conditions match one or more named Domain Skills or an Additional Repository Skill, the routing decision includes the referenced guidance for every matching skill and provides the master completion contract without excluding another applicable match.

**Validates: Requirements 1.2, 1.3, 1.5, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

### Property 2: Local-first confirmed capability selection

For any Repository Task question, sufficient Local Evidence prevents Power selection; otherwise the Installed-Power Registry is consulted before selection, and a Power is presented or activated only when it is both needed and registry-confirmed, with unconfirmed candidates falling back to Local Evidence and applicable skill guidance.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 3: Honest validation-status classification

For any required Test-Like Command, its observed result is classified as Validation Evidence if and only if current-session User Authorization and Hook Permission are both present; otherwise it is classified and reported as Pending User Validation, never as passing evidence.

**Validates: Requirements 4.3, 4.4, 4.5, 4.10**

### Property 4: Evidence-gated completion

For any Repository Task modification, fully evidenced completion is possible only when the stated goal is met and all applicable Validation Evidence is present; for any Fork Tree change, that applicable evidence includes Fork Boundary validation.

**Validates: Requirements 4.6, 4.7, 4.8**

### Property 5: Scope-transparent reporting and blocker containment

For any Repository Task outcome, the completion report identifies the changed scope, and for any evidenced True Blocker that prevents authorized-scope completion, the escalation target is root `Failures.md`.

**Validates: Requirements 4.9, 4.11**

## Verification Strategy

This is a documentation-only hardening, so it introduces no runnable feature behavior and no test commands are required or authorized by this design. Validation is deliberately narrow:

1. Inspect `SKILL.md` after the reconciliation to confirm the canonical path, exact authority ordering, all routing conditions, local-first confirmation, non-automatic Power behavior, evidence classification, fork-boundary gate, reporting fields, and `Failures.md` escalation.
2. Compare the final content against every acceptance criterion in `requirements.md`.
3. Confirm no files outside `.kiro/skills/oando-master/SKILL.md` are required by the implementation, apart from the already-created spec artifacts.

If a future documentation linter is introduced, its unit-level examples should cover the static path/order/wording requirements. A pure table-driven model of the conceptual records may implement Properties 1–4 with at least 100 generated cases per property, while the True Blocker path remains a representative integration inspection rather than a routine destructive test. No such linter or test is part of this feature.

## Requirement Coverage

| Requirement area | Design coverage |
|---|---|
| 1. Canonical entry point | Overview, Canonical Documentation Surface, Task-routing interface, and narrow artifact inspection. |
| 2. Authority and guidance routing | Authority section, conditional routing table, additive-routing detail, and Property 1. |
| 3. Confirmed local Power selection | Capability-selection interface, local-first detail, error fallbacks, and Property 2. |
| 4. Safe evidence-based completion | Completion-reporting interface, validation/completion detail, error handling, Properties 3–5, and verification strategy. |

## Implementation Boundaries

The subsequent implementation may change only `.kiro/skills/oando-master/SKILL.md` to reconcile the documented contract described above. It must retain unrelated existing content, the authority sequence, candidate-Power table semantics, test and hook authorization wording, and existing validation references unless a requirement explicitly calls for clarification. It must not modify `.kiro/hooks/`, validation scripts or policy, runtime/product code, or activate a Power.

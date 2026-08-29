# Requirements Document

## Introduction

The Oando Master Skill is the repository-local Kiro entry point for routing repository work to applicable guidance and establishing evidence-based completion criteria. The Oando Master Skill complements the existing repository governance without creating a product route, package command, runtime CLI, automatic power activation, test-hook changes, validation-policy changes, or product/runtime code.

## Glossary

- **Oando Master Skill**: The repository-local Kiro skill maintained at `.kiro/skills/oando-master/SKILL.md` and used to route work and define completion criteria.
- **Canonical Surface**: The authoritative repository path at which a repository-local Kiro skill is maintained.
- **Repository Task**: A user-requested activity that requires repository guidance, source inspection, modification, validation, or reporting.
- **Authority Ordering**: The precedence sequence: current user instruction, live repository evidence and fresh command output, `AGENTS.md`, `Agents/`, and `docs/`.
- **Local Evidence**: Repository documentation, source files, configuration, and fresh command output available in the workspace.
- **Domain Skill**: A repository-local Kiro skill that provides guidance for a defined task category.
- **Additional Repository Skill**: A repository-local Kiro skill beyond the Domain Skills explicitly named in this document.
- **Referenced Skill Guidance**: The canonical documented instructions for a Domain Skill or Additional Repository Skill.
- **Repository-Local Kiro Skill Workflow**: Guidance performed through repository-local Kiro skill documentation rather than a product or runtime interface.
- **Shared Code**: Source code used by more than one repository feature or surface.
- **Styling Scope**: CSS, Tailwind styling, design tokens, and files under `site/focss/`.
- **Fork Tree**: The Studio or Planner source tree.
- **Database Work**: SQL, database schema, database migration, or database selection work.
- **Installed-Power Registry**: The current workspace inventory that confirms which Kiro powers are available for activation.
- **Power**: An installed Kiro capability that supplies specialized tools, guidance, or integrations.
- **Candidate Power**: A Power considered for a Repository Task before Installed-Power Registry confirmation.
- **Completion Criteria**: The Repository Task goal and the observed evidence required to report a Repository Task as complete.
- **Smallest Sound Change**: The minimum scoped modification that meets the stated Repository Task goal without changing unrelated behavior.
- **Narrow Validation**: The least broad check that directly evaluates a changed Repository Task outcome.
- **Test-Like Command**: A command that runs tests, gates, coverage, browser-test runners, or static validation checks governed by repository authorization policy.
- **User Authorization**: Explicit current-session user permission to execute a Test-Like Command.
- **Hook Permission**: An enabled pre-execution hook decision that permits a Test-Like Command tool call.
- **Validation Evidence**: An observed result from a Test-Like Command with User Authorization and Hook Permission or from an authorized non-test validation activity.
- **Pending User Validation**: A required Test-Like Command that lacks User Authorization or Hook Permission.
- **Fork Boundary**: The repository rule that prevents imports between the Studio and Planner Fork Trees.
- **True Blocker**: An evidenced condition that prevents completion of a Repository Task within the authorized scope.

## Requirements

### Requirement 1: Provide the canonical repository entry point

**User Story:** As a repository contributor, I want one repository-local Kiro entry point for task routing and completion criteria, so that Repository Tasks begin with consistent guidance.

#### Acceptance Criteria

1. THE Oando Master Skill SHALL present `.kiro/skills/oando-master/SKILL.md` as the Canonical Surface for Repository Task routing and completion criteria.
2. WHEN a Repository Task begins, THE Oando Master Skill SHALL provide routing guidance for the Repository Task.
3. WHEN a Repository Task begins, THE Oando Master Skill SHALL provide completion criteria for the Repository Task.
4. THE Oando Master Skill SHALL describe Repository Task routing as a Repository-Local Kiro Skill Workflow.
5. THE Oando Master Skill SHALL identify Referenced Skill Guidance for Domain Skill-specific instructions.

### Requirement 2: Preserve authority and route applicable guidance

**User Story:** As a repository contributor, I want task-specific guidance selected under the repository authority model, so that Repository Task decisions use the correct repository sources and constraints.

#### Acceptance Criteria

1. THE Oando Master Skill SHALL preserve the Authority Ordering for Repository Task decisions.
2. WHEN a Repository Task requires repository orientation or location discovery, THE Oando Master Skill SHALL direct the Repository Task to the `repo-map` Domain Skill.
3. WHEN a Repository Task changes shared code or requires impact analysis, THE Oando Master Skill SHALL direct the Repository Task to the `graph-impact` Domain Skill.
4. WHEN a Repository Task changes Styling Scope, THE Oando Master Skill SHALL direct the Repository Task to the `focss-css` Domain Skill.
5. WHEN a Repository Task changes a Fork Tree or evaluates imports involving a Fork Tree, THE Oando Master Skill SHALL direct the Repository Task to the `fork-boundaries` Domain Skill.
6. WHEN a Repository Task requires Database Work, THE Oando Master Skill SHALL direct the Repository Task to the `db-migrations` Domain Skill.
7. WHEN a Repository Task condition matches an Additional Repository Skill, THE Oando Master Skill SHALL direct the Repository Task to the Additional Repository Skill.

### Requirement 3: Select powers from confirmed local information

**User Story:** As a repository contributor, I want specialized capabilities selected only when repository evidence is insufficient, so that Repository Tasks avoid unnecessary external capability use.

#### Acceptance Criteria

1. WHEN Local Evidence answers a Repository Task question, THE Oando Master Skill SHALL direct the Repository Task to Local Evidence before selecting a Power.
2. WHEN Local Evidence does not answer a Repository Task question, THE Oando Master Skill SHALL consult the Installed-Power Registry before selecting a Power.
3. WHERE the Installed-Power Registry confirms a Power and a Repository Task requires the Power, THE Oando Master Skill SHALL present the Power as an optional specialized capability.
4. WHEN the Installed-Power Registry does not confirm a Candidate Power, THE Oando Master Skill SHALL continue Repository Task routing with available Local Evidence and applicable Domain Skills.
5. WHEN a Repository Task requests Power activation, THE Oando Master Skill SHALL require Installed-Power Registry confirmation for the Power before Power activation.

### Requirement 4: Define safe, evidence-based completion

**User Story:** As a repository contributor, I want explicit completion criteria, so that completed Repository Tasks meet the stated goal with honest evidence.

#### Acceptance Criteria

1. WHEN preparing a Repository Task modification, THE Oando Master Skill SHALL select a Smallest Sound Change.
2. WHEN a Repository Task modification requires validation, THE Oando Master Skill SHALL select Narrow Validation.
3. THE Oando Master Skill SHALL retain User Authorization and Hook Permission as the conditions for executing a Test-Like Command.
4. WHERE a Test-Like Command has User Authorization and Hook Permission, THE Oando Master Skill SHALL permit the Repository Task to use the Test-Like Command as Validation Evidence.
5. IF a required Test-Like Command lacks User Authorization or Hook Permission, THEN THE Oando Master Skill SHALL identify the Test-Like Command as Pending User Validation.
6. WHEN a Repository Task changes a Fork Tree, THE Oando Master Skill SHALL require Fork Boundary validation before the Repository Task is complete.
7. WHEN completion criteria are evaluated, THE Oando Master Skill SHALL require the stated Repository Task goal.
8. WHEN completion criteria are evaluated, THE Oando Master Skill SHALL require applicable Validation Evidence.
9. WHEN reporting Repository Task completion, THE Oando Master Skill SHALL identify the changed Repository Task scope.
10. WHEN reporting Repository Task completion, THE Oando Master Skill SHALL distinguish Validation Evidence from Pending User Validation.
11. IF a True Blocker prevents completion within the authorized scope, THEN THE Oando Master Skill SHALL record the True Blocker with evidence in root `Failures.md`.

# Requirements Document

## Introduction

This feature establishes an evidence-led rewrite and re-verification of the repository's 34 in-scope Markdown documents: all 10 root-level Markdown files, all 10 Markdown files under `Agents/`, and all 14 Markdown files under `docs/`. The rewrite improves information architecture, task orientation, clarity, consistency, accessibility, navigation, technical accuracy, status honesty, security hygiene, and maintainability without weakening repository-specific operational rules.

The feature is separate from `.kiro/specs/kiro-config-rewrite/`. The existing Kiro configuration rewrite explicitly excludes general authority and documentation files, so this feature shall not modify, absorb, supersede, or reinterpret that spec.

The governing authority order remains:

```text
user > live code and fresh commands > AGENTS.md > Agents/ > docs/
```

The requirements use `SHALL` as the mandatory requirement keyword, consistent with [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and its capitalization clarification in [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).

## Research basis

The rewrite shall translate authoritative guidance into repository-appropriate practices rather than impose one external template on every document. The initial research baseline is:

- [W3C Writing for Web Accessibility](https://www.w3.org/WAI/tips/writing/) and WCAG guidance for [headings and labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html) and [link purpose](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context) for perceivable structure, descriptive headings, and meaningful links.
- [Diátaxis](https://diataxis.fr/) for distinguishing tutorials, how-to guides, reference, and explanation according to reader need without requiring a directory reorganization.
- The [Microsoft Writing Style Guide on scannable content](https://learn.microsoft.com/en-us/style-guide/scannable-content/) and [Microsoft style quick start](https://learn.microsoft.com/en-us/contribute/content/style-quick-start) for concise, front-loaded, consistent technical writing.
- The [Google developer documentation style guide](https://developers.google.com/style/), including its guidance for [accessible documentation](https://developers.google.com/style/accessibility), [inclusive documentation](https://developers.google.com/style/inclusive-documentation/), and [descriptive link text](https://developers.google.com/style/link-text).
- [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/) for unambiguous Markdown structure and syntax.
- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) where documentation defines normative requirement levels.

Content was rephrased for compliance with licensing restrictions. External guidance does not override the repository authority order or live repository evidence.

## Glossary

- **Documentation_Rewrite**: The feature that researches, rewrites, reconciles, and re-verifies the in-scope documentation.
- **In_Scope_Document_Set**: The exact 34 Markdown paths listed in the Coverage Matrix.
- **Root_Document_Set**: The 10 in-scope Markdown files at repository root.
- **Agent_Document_Set**: The 10 in-scope Markdown files under `Agents/`.
- **Durable_Document_Set**: The 14 in-scope Markdown files under `docs/`.
- **New_Spec_Artifacts**: Files created under `.kiro/specs/documentation-global-standards/` by this requirements-first workflow.
- **Excluded_Asset_Set**: Application code, database assets, infrastructure, generated evidence, existing specs, files outside the In_Scope_Document_Set, and unrelated work.
- **Authority_Order**: User instruction, then live code and fresh command output, then `AGENTS.md`, then `Agents/`, then `docs/`.
- **Live_Repository_Evidence**: Current tracked source, package scripts, configuration, directory structure, and fresh command output.
- **Authoritative_Source**: Current first-party standards or official guidance published by the organization responsible for the subject.
- **Research_Process**: The process that retrieves, evaluates, records, and applies Authoritative Sources.
- **Source_Register**: A record within New_Spec_Artifacts that maps each applied documentation principle to its source, access date, scope, and repository application.
- **Coverage_Matrix**: The per-file record that tracks audience, purpose, authority role, disposition, checks, and final verification for every path in the In_Scope_Document_Set.
- **Final_Disposition**: One of `rewritten`, `verified-retained`, or `consolidated-as-pointer`, accompanied by a rationale and verification state; every original path remains present.
- **Information_Architecture**: The organization, naming, hierarchy, navigation, and cross-linking that help a reader find the correct document and complete a task.
- **Content_Rewriter**: The editorial part of the Documentation_Rewrite that changes prose and structure while preserving verified meaning.
- **Accessibility_Review**: The review of headings, links, tables, images, code blocks, language, and non-visual comprehension against applicable W3C and official developer-documentation guidance.
- **Accuracy_Review**: The comparison of documentation claims with Live_Repository_Evidence.
- **Conflict_Review**: The identification and resolution of duplicate, contradictory, misplaced, or stale statements across the In_Scope_Document_Set.
- **Security_Review**: The check for secrets, personal data, unsafe examples, misleading security claims, and weakened safeguards.
- **Operational_Contract**: The repository-specific rules whose meaning and force must survive the rewrite.
- **Status_Vocabulary**: Explicit labels such as observed, configured, present-but-unverified, planned, historical, deprecated, blocked, and pending-owner-validation.
- **User_Authorized_Validation**: A test, gate, build, browser check, coverage run, or test-like repository command explicitly authorized by the user in the current session and permitted by the enabled pre-execution hook.
- **Permitted_Doc_Check**: A current documentation-oriented command confirmed in root `package.json` and allowed by repository execution policy.
- **Verification_Process**: The static and, when authorized, command-based review performed after rewriting and again after corrections.
- **Verification_Record**: The final per-file and cross-file status recorded in New_Spec_Artifacts without hidden scoring or internal quality metrics.
- **Diátaxis**: A documentation framework that distinguishes tutorial, how-to, reference, and explanation content by reader need.
- **CommonMark**: The referenced Markdown syntax specification.

## Scope and initial Coverage Matrix

Every row requires an evidence-led editorial pass and a final disposition. `Pending` means no implementation disposition has yet been claimed; it does not permit a file to be skipped.

| Path | Document group | Required review | Initial state |
|---|---|---|---|
| `AGENTS.md` | Root authority | Process floor, authority, operational constraints | Pending |
| `CONTENTS.md` | Root navigation | Complete index and link integrity | Pending |
| `DOC-MAP.md` | Root navigation | Authority, placement, and document ownership | Pending |
| `Failures.md` | Root operations | Blocker truth, status, and evidence hygiene | Pending |
| `HANDOVER.md` | Root operations | Audience, current status, and stale handoff claims | Pending |
| `OPERATIONS_RUNBOOK.md` | Root how-to | Commands, prerequisites, recovery, and safety | Pending |
| `owners.md` | Root reference | Ownership, escalation, and path accuracy | Pending |
| `README.md` | Root front door | Product, platform, routes, and onboarding navigation | Pending |
| `START.md` | Root onboarding | First-run sequence, commands, and orientation | Pending |
| `Testing-handbook.md` | Root how-to | Test lanes, authorization, commands, and evidence | Pending |
| `Agents/01-standard.md` | Agent handbook | Standard execution and evidence rules | Pending |
| `Agents/02-testing.md` | Agent handbook | Testing policy, lanes, and authorization | Pending |
| `Agents/03-browser.md` | Agent handbook | Browser evidence and UI claim boundaries | Pending |
| `Agents/04-failures.md` | Agent handbook | Blocker recording and escalation | Pending |
| `Agents/05-documentation.md` | Agent handbook | Documentation placement and workflow | Pending |
| `Agents/06-architecture.md` | Agent handbook | Architecture decision routing | Pending |
| `Agents/07-css.md` | Agent handbook | FOCSS and styling workflow | Pending |
| `Agents/INDEX.md` | Agent navigation | Handbook roles, authority, and links | Pending |
| `Agents/research-gap-areas.md` | Agent research | Scope, evidence, status, and current relevance | Pending |
| `Agents/research-practices.md` | Agent research | Research method, citations, and evidence quality | Pending |
| `docs/README.md` | Durable navigation | Durable-document index and ownership | Pending |
| `docs/architecture/css.md` | Durable reference | FOCSS architecture and source accuracy | Pending |
| `docs/architecture/layout.md` | Durable reference | Repository structure and path accuracy | Pending |
| `docs/architecture/product-map.md` | Durable explanation | Product surfaces, placement, and source pointers | Pending |
| `docs/architecture/routes.md` | Durable reference | Page and API route accuracy | Pending |
| `docs/architecture/scripts.md` | Durable reference | Script inventory, authorities, and command accuracy | Pending |
| `docs/architecture/stack.md` | Durable reference | Toolchain, versions, and integration status | Pending |
| `docs/database/drizzle.md` | Durable explanation | ORM wiring and two-database boundaries | Pending |
| `docs/database/ops.md` | Durable how-to | Modes, seed, restore, and operational safety | Pending |
| `docs/database/schema.md` | Durable reference | Tables, ownership, RLS, and migration truth | Pending |
| `docs/governance/benchmarks.md` | Durable governance | Measurable bars and evidence basis | Pending |
| `docs/governance/charter.md` | Durable governance | Decisions, status, and authority | Pending |
| `docs/governance/focss-stop-drift.md` | Durable governance | CSS debt controls and current enforcement | Pending |
| `docs/governance/rules.md` | Durable governance | Programme rules, enforcement, and security | Pending |

## Requirements

### Requirement 1: Bound the rewrite and preserve authority

**User Story:** As the repository owner, I want the documentation rewrite contained to the declared corpus so unrelated work and higher-authority truth remain intact.

#### Acceptance Criteria

1. THE Documentation_Rewrite SHALL limit content edits to the exact 34 distinct paths in the In_Scope_Document_Set.
2. WHERE a workflow artifact is required, THE Documentation_Rewrite SHALL create or modify the workflow artifact only within New_Spec_Artifacts.
3. THE Documentation_Rewrite SHALL preserve the content, path, and presence of every asset in the Excluded_Asset_Set.
4. THE Documentation_Rewrite SHALL apply the five-level Authority_Order in this sequence: user instruction, Live_Repository_Evidence, `AGENTS.md`, `Agents/`, then `docs/`.
5. IF two documentation claims from different authority levels conflict, THEN THE Documentation_Rewrite SHALL retain the claim supported by the higher level of the Authority_Order.
6. IF conflicting claims at the same authority level remain unresolved by Live_Repository_Evidence, THEN THE Documentation_Rewrite SHALL classify the conflict as `pending-owner-validation`.
7. WHILE evaluating repository behavior, THE Documentation_Rewrite SHALL treat Live_Repository_Evidence as authoritative over `AGENTS.md`, `Agents/`, and `docs/`.
8. THE Documentation_Rewrite SHALL preserve every pre-existing user change in an in-scope file.
9. IF a pre-existing user change conflicts with a named higher-authority source or acceptance criterion, THEN THE Documentation_Rewrite SHALL record the conflicting change, the controlling source or criterion, and the resolution before modifying the change.
10. THE Documentation_Rewrite SHALL keep `.kiro/specs/kiro-config-rewrite/` separate and unchanged.
11. THE Documentation_Rewrite SHALL keep all 34 original in-scope paths present after the rewrite.
12. WHEN evaluating completion, THE Verification_Record SHALL provide evidence for every acceptance criterion in this requirement and for the content, path, and presence of each of the 34 in-scope paths.

### Requirement 2: Base editorial decisions on authoritative research

**User Story:** As a documentation maintainer, I want current first-party guidance to support editorial decisions so the rewrite reflects internationally applicable practice rather than unsupported preference.

#### Acceptance Criteria

1. WHEN the Research_Process begins, THE Research_Process SHALL retrieve Authoritative_Source records from official publishers.
2. THE Research_Process SHALL classify an Authoritative_Source as current only when the official publisher does not mark the source as withdrawn or superseded on the recorded access date.
3. THE Research_Process SHALL apply each Authoritative_Source only within the source's stated governing scope and from the latest applicable non-superseded edition available on the access date.
4. THE Research_Process SHALL prioritize W3C, Diátaxis, Microsoft, Google, RFC Editor or IETF, and official Markdown guidance for the concerns each source governs.
5. THE Source_Register SHALL record the publisher, title, canonical URL, successful UTC access date, displayed publication or update date when available, current or unverified status, applied principle, and every affected document path for each applied source.
6. WHEN source guidance informs a rewrite decision, THE Content_Rewriter SHALL paraphrase the guidance, retain required attribution, and provide an accessible citation.
7. IF official sources conflict, THEN THE Research_Process SHALL apply the source that governs the specific subject scope and then the latest applicable non-superseded guidance within that scope.
8. IF a secondary source conflicts with an Authoritative_Source, THEN THE Research_Process SHALL use the Authoritative_Source.
9. IF an external recommendation conflicts with the Authority_Order or Live_Repository_Evidence, THEN THE Documentation_Rewrite SHALL preserve repository truth and record the recommendation as inapplicable.
10. IF a citation cannot be retrieved successfully on the re-verification date, THEN THE Research_Process SHALL classify the citation as unverified and record the failed access attempt.
11. WHERE normative requirement keywords are appropriate, THE Content_Rewriter SHALL apply RFC 2119 and RFC 8174 conventions consistently.
12. THE Content_Rewriter SHALL use original wording and SHALL omit verbatim source passages.

### Requirement 3: Account for every in-scope file

**User Story:** As the repository owner, I want explicit per-file coverage so no document is silently skipped or rewritten without a reason.

#### Acceptance Criteria

1. THE Coverage_Matrix SHALL contain exactly one row for each distinct path in the In_Scope_Document_Set and zero rows for paths outside the In_Scope_Document_Set.
2. THE Coverage_Matrix SHALL record a non-empty audience, primary purpose, authority role, and required check set for each path.
3. THE Coverage_Matrix SHALL record source dependencies for each path or the explicit value `none` when no source dependency applies.
4. WHEN an editorial pass is complete, THE Coverage_Matrix SHALL assign exactly one Final_Disposition to the reviewed path.
5. WHEN the Verification_Process evaluates a path, THE Coverage_Matrix SHALL assign exactly one verification state to the path.
6. IF a path receives `verified-retained`, THEN THE Coverage_Matrix SHALL identify the evidence showing that no textual change was required.
7. IF a path receives `consolidated-as-pointer`, THEN THE Coverage_Matrix SHALL identify the canonical destination and the operational context retained locally.
8. THE Coverage_Matrix SHALL trace each Final_Disposition and verification state to a named evidence source and location.
9. IF the Coverage_Matrix contains a missing path, duplicate path, outside path, empty required field, missing disposition, multiple dispositions, missing verification state, or multiple verification states, THEN THE Documentation_Rewrite SHALL report the feature as incomplete.
10. THE Verification_Record SHALL omit hidden scoring, internal quality metrics, and private evaluation data.

### Requirement 4: Improve information architecture and navigation

**User Story:** As a reader, I want each document to have a clear role and reliable navigation so I can find authoritative information for my task.

#### Acceptance Criteria

1. THE Information_Architecture SHALL assign exactly one primary reader need and exactly one primary purpose to each in-scope document.
2. WHEN a document mixes tutorial, how-to, reference, or explanation content, THE Information_Architecture SHALL separate each content type with a descriptive labeled section or a descriptive link to the canonical document.
3. THE Information_Architecture SHALL preserve the established placement of root front doors, `Agents/` session guidance, and `docs/` durable reference.
4. THE Information_Architecture SHALL preserve `AGENTS.md` as the process floor, `Failures.md` as the sole blocker record, and `results/` as generated evidence rather than authority.
5. THE Information_Architecture SHALL provide each document with a unique descriptive title and a purpose statement of no more than two sentences.
6. WHEN a document requires prerequisite context, THE Information_Architecture SHALL place or link the prerequisite before the first dependent instruction.
7. WHEN a document contains at least three level-two headings or more than 1,000 words, THE Information_Architecture SHALL provide either a table of contents linking every level-two heading or a heading hierarchy with no skipped levels.
8. THE Information_Architecture SHALL make `START.md`, `README.md`, `CONTENTS.md`, `DOC-MAP.md`, `Agents/INDEX.md`, and `docs/README.md` identify the same canonical owner and destination for each shared topic.
9. THE Information_Architecture SHALL use descriptive cross-references to the canonical home of each topic.
10. THE Information_Architecture SHALL express every repository-local link as a repository-relative link that resolves to an existing destination.

### Requirement 5: Make content audience-oriented, concise, and consistent

**User Story:** As a global technical reader, I want direct and consistent language so I can understand and act on the documentation without interpreting local shorthand.

#### Acceptance Criteria

1. THE Content_Rewriter SHALL place the reader's goal, prerequisites, and observable outcome before the first procedure step in each task-oriented document.
2. THE Content_Rewriter SHALL remove only words whose removal does not change a task, condition, interpretation, or outcome.
3. THE Content_Rewriter SHALL preserve every condition, exception, warning, and recovery step supported by Live_Repository_Evidence.
4. THE Content_Rewriter SHALL use active voice and name the actor responsible for each action.
5. WHEN a statement contains a vague qualifier, THE Content_Rewriter SHALL replace the qualifier with a source-supported observable criterion or the status `clarification-needed`.
6. WHEN a specialized term is necessary, THE Content_Rewriter SHALL define the term at first use or link to the canonical definition.
7. THE Content_Rewriter SHALL use canonical terminology and capitalization for each product, subsystem, command, role, and evidence state.
8. THE Content_Rewriter SHALL use sentence-case headings and parallel grammatical structure for comparable list items and procedure steps.
9. THE Content_Rewriter SHALL use inclusive, culturally neutral global English suitable for readers who use English as an additional language.
10. THE Content_Rewriter SHALL remove idioms, unexplained abbreviations, humor-dependent instructions, and promotional claims.
11. WHEN an example uses a person, organization, credential, URL, or identifier, THE Content_Rewriter SHALL use a clearly non-real placeholder.
12. THE Content_Rewriter SHALL preserve emphasis only when the emphasis communicates a technically meaningful distinction, warning, or status.

### Requirement 6: Meet Markdown and accessibility expectations

**User Story:** As a reader using varied devices or assistive technology, I want structurally sound Markdown so navigation and comprehension do not depend on visual presentation alone.

#### Acceptance Criteria

1. THE Accessibility_Review SHALL verify that each document begins with exactly one non-empty level-one heading.
2. THE Accessibility_Review SHALL verify that heading levels form a logical hierarchy with no skipped level and do not serve only as visual styling.
3. THE Accessibility_Review SHALL verify that each link uses standalone descriptive text that identifies the destination or purpose without requiring surrounding visual context.
4. IF a document contains an informative image, THEN THE Accessibility_Review SHALL verify that the image has purpose-specific alternative text of no more than 150 characters.
5. IF a document contains a decorative image, THEN THE Accessibility_Review SHALL verify that the image has empty alternative text.
6. THE Accessibility_Review SHALL verify that each retained table has textual column headers and communicates no meaning through visual position, color, or formatting alone.
7. IF a table cannot satisfy textual header or linear-comprehension requirements, THEN THE Content_Rewriter SHALL replace the table with headings, lists, or simpler tables.
8. THE Accessibility_Review SHALL verify that each warning and status has a text label rather than relying on color, emoji, or formatting alone.
9. WHEN a fenced code block's language is known, THE Accessibility_Review SHALL verify that the code fence declares the applicable language.
10. THE Accessibility_Review SHALL verify that each command sample is copyable without prompt characters, output, or line numbers in the same code block.
11. THE Accessibility_Review SHALL verify CommonMark-compatible structure.
12. WHERE a document uses a Markdown extension, THE Accessibility_Review SHALL identify live documentation proving that the repository renderer supports the extension.
13. THE Accessibility_Review SHALL verify that each Unicode symbol has textual context and each acronym is expanded at first use or defined in the document's glossary.
14. THE Accessibility_Review SHALL apply W3C and official developer-documentation guidance without claiming formal accessibility conformance from static Markdown review alone.

### Requirement 7: Align claims, commands, paths, metadata, and status with live evidence

**User Story:** As a maintainer, I want documentation to match the live repository so instructions and reference facts are dependable.

#### Acceptance Criteria

1. WHEN a document names a command, THE Accuracy_Review SHALL verify the command name, complete arguments, package manager, and working directory against Live_Repository_Evidence.
2. WHEN a document names a repository path, THE Accuracy_Review SHALL verify the path's existence and role against Live_Repository_Evidence or classify the path as `historical`, `planned`, or `absent`.
3. WHEN a document states an application behavior, version, route, schema, persistence, deployment, observability, analytics, or security claim, THE Accuracy_Review SHALL trace the claim to the owning source or configuration.
4. IF Live_Repository_Evidence cannot establish a claim, THEN THE Accuracy_Review SHALL classify the claim as pending and identify the evidence needed to resolve the claim.
5. IF a document includes a date, THEN THE Accuracy_Review SHALL record the date's operational purpose and supporting evidence.
6. IF a date lacks a verified operational purpose or supporting evidence, THEN THE Content_Rewriter SHALL remove the date.
7. WHEN a document reports an observed validation result, THE Accuracy_Review SHALL record the exact command, arguments, working directory, and observed result.
8. WHILE `scripts/tsconfig.json` is absent, THE Accuracy_Review SHALL omit `pnpm run typecheck:scripts`.
9. WHEN a document contains an external link, THE Accuracy_Review SHALL verify that the link resolves to the canonical destination identified by the owning organization.
10. IF an external link cannot be verified as the owner-identified canonical destination, THEN THE Accuracy_Review SHALL classify the link as pending and identify the required verification.
11. IF a command, path, link, source, configuration value, or documented claim changes during the rewrite, THEN THE Documentation_Rewrite SHALL re-run the affected Accuracy_Review.
12. THE Accuracy_Review SHALL record the evidence source, evidence location, and observed value for every review outcome.
13. IF a validation command is unobserved, interrupted, or blocked, THEN THE Accuracy_Review SHALL classify the validation as pending rather than pass or fail.

### Requirement 8: Remove duplicate and conflicting guidance without losing meaning

**User Story:** As a reader, I want one canonical answer per topic so duplicate text does not drift or contradict higher-authority guidance.

#### Acceptance Criteria

1. THE Conflict_Review SHALL map each repeated claim to a canonical owner selected by the Authority_Order, established document placement, and Live_Repository_Evidence.
2. WHEN lower-authority content exactly duplicates a canonical rule, THE Content_Rewriter SHALL replace the exact duplicate with the minimum context needed at the point of use and a descriptive link to the canonical owner.
3. WHEN two in-scope documents conflict, THE Conflict_Review SHALL resolve the conflict using Live_Repository_Evidence and the Authority_Order.
4. IF repeated content contains a unique local prerequisite, exception, warning, or recovery step, THEN THE Content_Rewriter SHALL preserve the unique local detail at the point of use.
5. THE Conflict_Review SHALL classify each repeated passage as `exact-duplicate`, `deliberate-linked-summary`, `authority-conflict`, or `unique-local-detail`.
6. THE Conflict_Review SHALL remove stale references only when the references occur within the In_Scope_Document_Set and identify missing files, retired paths, obsolete commands, or unsupported capabilities.
7. WHEN canonical ownership changes within the In_Scope_Document_Set, THE Information_Architecture SHALL update every affected in-scope index and cross-reference.
8. THE Conflict_Review SHALL preserve each original in-scope file as substantive guidance or a purposeful pointer with a named canonical destination.
9. THE Conflict_Review SHALL leave historical evidence outside the In_Scope_Document_Set unchanged.

### Requirement 9: Preserve security and secret hygiene

**User Story:** As the repository owner, I want documentation examples and procedures to maintain security boundaries without exposing sensitive data.

#### Acceptance Criteria

1. IF an in-scope document contains an unredacted real secret, token, private key, credential, customer identifier, personally identifiable information (PII), or environment value, THEN THE Security_Review SHALL reject the document from completion.
2. WHEN documentation refers to local secrets, THE Content_Rewriter SHALL name only `.env.local` or `site/.env.local` and use unassigned variable-name placeholders without example values.
3. WHEN documentation names a server credential or service-role credential, THE Content_Rewriter SHALL label the credential as server-only and state that the credential must remain absent from client code, browser output, and client-visible configuration.
4. WHERE Live_Repository_Evidence supports an authorization, row-level security (RLS), origin, upload, rate-limit, strict scalable vector graphics (SVG), cross-site request forgery (CSRF), or session-validation boundary, THE Security_Review SHALL preserve the documented boundary.
5. WHEN a procedure can delete data, alter production, deploy infrastructure, or expose security-sensitive output, THE Content_Rewriter SHALL place a warning before the first executable step that names prerequisites, scope, impact, and recovery guidance or explicitly states that no recovery procedure exists.
6. WHEN an external destination supports a canonical HTTPS URL, THE Content_Rewriter SHALL use the canonical HTTPS URL.
7. IF a security capability is not verified in live configuration, THEN THE Accuracy_Review SHALL classify the capability as pending or present-but-unverified rather than enforced.
8. WHEN documentation or a verification record includes command output, THE Security_Review SHALL redact sensitive values while preserving non-sensitive context required to interpret the result.
9. THE Security_Review SHALL record a result for each in-scope document covering sensitive-data exposure, server/client credential boundaries, security-status accuracy, risky-procedure warnings, and output redaction.

### Requirement 10: Preserve the repository operational contract

**User Story:** As a developer or agent, I want the rewrite to retain repository-specific constraints so improved prose does not change safe execution behavior.

#### Acceptance Criteria

1. THE Operational_Contract SHALL preserve repository-root execution, exclusive `pnpm` usage, no-worktree operation, preservation of unrelated work, and `http://localhost:3000` UI guidance.
2. WHEN future work changes Next.js code, THE Operational_Contract SHALL require reading the relevant Next.js 16 guide under `node_modules/next/dist/docs/` before writing code.
3. THE Operational_Contract SHALL preserve the Studio and Planner fork boundary and the `pnpm run scan:boundaries` validation command.
4. THE Operational_Contract SHALL preserve Products database ownership of the marketing catalog and configurator in project `erpweaiypimorcunaimz` with migrations under `site/platform/supabase/migrations/`.
5. THE Operational_Contract SHALL preserve Admin database ownership of staff and customer data, plans, furniture, and descriptors in project `rxzpznmxbaoxpikowmfc` with migrations under `site/platform/supabase/migrations.admin/`.
6. THE Operational_Contract SHALL preserve migration rollback sections, grants, policies, dry-run-before-apply commands, and `pnpm run db:types` or `pnpm run db:types:admin` type generation for the owning database.
7. THE Operational_Contract SHALL preserve exclusive persistence modes with no dual write: disk only when `DEV_AUTH_BYPASS=1` in non-production, Supabase otherwise, a read-only production filesystem, and mode-aware write wrappers.
8. THE Operational_Contract SHALL preserve `Failures.md` as the sole hard-blocker record and `results/` as generated evidence that does not prove a claim without its originating command or source.
9. THE Operational_Contract SHALL preserve the two Vitest lanes and distinguish static, unit, browser, build, coverage, and full-gate evidence by the scope each observed result proves.
10. WHEN a test, gate, coverage run, browser check, build, or test-like command is requested, THE Operational_Contract SHALL require explicit user authorization for the exact command and permission from the enabled pre-execution hook.
11. IF a command has no observed completed run, THEN THE Operational_Contract SHALL classify the command as unrun rather than passed.
12. IF editorial simplification would omit or weaken an Operational_Contract rule, THEN THE Content_Rewriter SHALL retain the complete rule.
13. IF Operational_Contract sources conflict, THEN THE Documentation_Rewrite SHALL resolve the conflict in this sequence: user instruction, Live_Repository_Evidence, `AGENTS.md`, `Agents/`, then `docs/`.
14. THE Verification_Record SHALL trace each Operational_Contract rule to a named source location and each command result to the exact command, arguments, working directory, and observed status of passed, failed, or unrun.

### Requirement 11: Re-verify the complete corpus and report honestly

**User Story:** As the repository owner, I want comprehensive post-rewrite verification so every document and cross-document claim has an explicit result.

#### Acceptance Criteria

1. WHEN the first rewrite pass completes, THE Verification_Process SHALL perform a first review of all 34 distinct paths and record a file-specific result for each path.
2. WHEN all first-review corrections complete, THE Verification_Process SHALL perform a second review of all 34 distinct paths and record a file-specific result for each path.
3. THE Verification_Process SHALL verify each repository-local link, anchor, and destination and trace the outcome to the source path and destination.
4. THE Verification_Process SHALL verify headings, lists, tables, code fences, and other Markdown structures in each in-scope file and trace each outcome to the file location.
5. THE Verification_Process SHALL verify each documented command and path against Live_Repository_Evidence and record the supporting source location or observed command evidence.
6. THE Verification_Process SHALL verify each authority decision against the Authority_Order and record the controlling source.
7. THE Verification_Process SHALL verify each repository fact against current source or configuration and record the evidence source, location, and observed value.
8. THE Verification_Process SHALL verify each citation for destination, publisher authority, governing applicability, and successful access status and record the evidence.
9. THE Verification_Process SHALL verify that each duplicate or conflict has a recorded classification, canonical owner, resolution, and supporting evidence.
10. THE Verification_Process SHALL verify that each Coverage_Matrix row satisfies Requirement 3 and traces its disposition and state to evidence.
11. WHEN a verification finding causes a correction, THE Verification_Process SHALL re-verify the corrected file and every affected link, index, canonical reference, and evidence record.
12. WHERE User_Authorized_Validation names an exact documentation command and the enabled hook permits execution, THE Verification_Process SHALL run only the authorized command from the repository root and record the exact command, arguments, working directory, exit status, and observed result.
13. WHERE the exact command is authorized and permitted, THE Verification_Process SHALL run `pnpm run check:docs-all`, `pnpm run docs:check:root-links`, or `pnpm run check:layout` only when that command is included in User_Authorized_Validation.
14. WHERE the user explicitly authorizes an exact test, build, coverage run, browser check, `pnpm run gate:fast`, or `pnpm run gate` command and the enabled hook permits execution, THE Verification_Process SHALL execute only that exact authorized command.
15. IF command authorization is absent, denied, interrupted, or blocked, THEN THE Verification_Record SHALL classify the command as pending and record the specific reason.
16. IF an authorized command fails, THEN THE Verification_Record SHALL preserve the exact failed result and SHALL omit a pass claim until an authorized corrective rerun completes successfully.
17. IF an authorized check fails because of an in-scope documentation defect, THEN THE Documentation_Rewrite SHALL correct the defect and re-run the check only after exact user authorization and enabled-hook permission.
18. IF an authorized check fails outside the declared scope, THEN THE Verification_Record SHALL report the observed failure without modifying the Excluded_Asset_Set.
19. THE Verification_Process SHALL record changed-path evidence that identifies every modified, created, deleted, or renamed path.
20. IF changed-path evidence identifies a path outside the In_Scope_Document_Set or New_Spec_Artifacts, THEN THE Verification_Record SHALL classify the change as an unresolved changed-path exception.
21. THE Verification_Record SHALL classify every verification outcome as static inspection, observed command result, or pending validation.
22. IF a command is unrun, interrupted, blocked, denied, or unobserved, THEN THE Verification_Record SHALL omit a pass status for the command.
23. WHEN evaluating completion, THE Verification_Process SHALL require two recorded file-specific reviews for each of the 34 paths, exactly one resolved Final_Disposition per path, closure of every correction loop, zero changed-path exceptions, and zero required verification outcomes in pending or failed state.
24. IF any completion condition in criterion 23 is unsatisfied, THEN THE Verification_Record SHALL report the feature as incomplete.

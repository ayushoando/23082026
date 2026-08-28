# Implementation Plan: Documentation Global Standards

## Overview

Rewrite and re-verify exactly the 34 Markdown files named by the approved requirements and design. A single agent executes every task serially, records all evidence in `.kiro/specs/documentation-global-standards/implementation-record.md`, preserves the authority order `user > live code and fresh commands > AGENTS.md > Agents/ > docs/`, and leaves every other repository path unchanged.

## Execution contract

- Work from the repository root without worktrees and use `pnpm` only for an exact command the user authorizes in the current session and the enabled hook permits.
- Create only `implementation-record.md` in addition to this task file. Do not modify `requirements.md`, `design.md`, `.config.kiro`, `.kiro/specs/kiro-config-rewrite/**`, application code, tests, databases, migrations, infrastructure, package or configuration files, generated evidence, or out-of-scope Markdown.
- The cohort subtasks in Task 4 are the sole write owners for the 34 documentation paths. Later findings must be routed back to the owning cohort and recorded as focused rereviews; they do not establish duplicate ownership.
- Preserve all pre-existing user changes. If one conflicts with a named higher-authority source or acceptance criterion, record the original change, controlling source, and proposed resolution before editing it.
- Do not implement property-based tests or validator code. Apply Design Properties 1–21 as static acceptance checks in the implementation record.
- Do not run or offer `pnpm run typecheck:scripts`; `scripts/tsconfig.json` is absent.

## Tasks

- [x] 1. Establish the immutable corpus baseline and containment controls
  - [x] 1.1 Create the baseline and allowlist sections in `.kiro/specs/documentation-global-standards/implementation-record.md`
    - Record exactly the 34 approved paths, their cohort, presence, tracked state, baseline content identity, and pre-existing-change status before any documentation edit.
    - Record protected paths and excluded asset classes, including `.kiro/specs/kiro-config-rewrite/**`, and define the only allowed outcomes: the 34 paths remain present and are unmodified or modified; permitted spec artifacts are created or modified.
    - Capture each pre-existing user change without overwriting it and create the conflict-before-modification record required when a higher-authority source or criterion controls.
    - Add the changed-path ledger schema, sole cohort ownership map, rollback rule, and stop conditions for missing, duplicate, outside, deleted, or renamed paths.
    - Apply static acceptance checks from Design Properties 1, 3, and 20.
    - _Requirements: 1.1–1.3, 1.8–1.12, 3.1, 8.9, 11.19–11.20_

- [x] 2. Research current official documentation guidance
  - [x] 2.1 Build the Source Register in `.kiro/specs/documentation-global-standards/implementation-record.md`
    - Retrieve only official, canonical HTTPS sources from W3C, Diátaxis, Microsoft, Google, the RFC Editor or IETF, and official CommonMark guidance for the concerns each publisher governs.
    - For every applied source, record publisher, title, canonical URL, successful UTC access time, displayed publication or update date when available, governing scope, current/superseded/unverified decision, latest applicable edition evidence, retrieval evidence, licensing-safe paraphrase, and every affected in-scope path.
    - Record failed access and supersession uncertainty as `unverified`; do not silently replace an unavailable official source with a secondary source.
    - Record external guidance that conflicts with repository truth as inapplicable, preserve attribution, and use original wording rather than copied passages.
    - Apply static acceptance checks from Design Properties 4 and 5.
    - _Requirements: 2.1–2.12, 6.14, 7.9–7.10, 9.6, 11.8_

- [x] 3. Build the evidence and editorial control ledgers
  - [x] 3.1 Populate the pre-rewrite ledgers in `.kiro/specs/documentation-global-standards/implementation-record.md`
    - Create claim records for commands, paths, dates, versions, routes, schemas, persistence, deployment, observability, analytics, security, and other repository facts; include owning source, exact source location, observed value, status, and needed evidence when unresolved.
    - Create the canonical terminology and canonical-owner registries, including the six shared navigation documents, blocker ownership, validation evidence, browser evidence, operations, product map, script reference, fork boundary, two databases, persistence, FOCSS, plans, generated evidence, and status vocabulary.
    - Create conflict records with allowed classifications, authority levels, canonical owner, controlling evidence, unique local detail, affected paths, resolution, and state.
    - Tag every operational-contract clause covering root-only `pnpm`, no worktrees, unrelated-work preservation, `http://localhost:3000`, Next.js guide prerequisites, Studio/Planner separation, database ownership and migration safeguards, exclusive persistence modes, blocker/evidence placement, two Vitest lanes, and evidence-scope distinctions.
    - Create five-dimension security records for every path: sensitive data, credential boundaries, security-status accuracy, risky-procedure warnings, and output redaction.
    - Expand the coverage matrix to exactly 34 unique rows with audience, primary reader need, purpose, authority role, required checks, source dependencies, sole write owner, disposition placeholder, verification state, and evidence references.
    - Apply static acceptance checks from Design Properties 2, 6, 7, 10, 13, 15–17.
    - _Requirements: 1.4–1.7, 3.1–3.9, 4.1–4.4, 4.8–4.9, 5.3–5.7, 7.1–7.6, 7.8, 7.12–7.13, 8.1–8.5, 9.1–9.9, 10.1–10.9, 10.12–10.14_

- [x] 4. Rewrite each authority-ordered cohort and complete its first static review
  - [x] 4.1 Rewrite and first-review `AGENTS.md`
    - Preserve the generated Next.js block and reconcile the process floor against user instructions and live source before lower-authority prose.
    - Give the document a unique title and concise purpose, improve global plain language and structure, preserve every operational rule, and correct only evidence-supported claims.
    - Review and correct title/purpose, reader need, CommonMark and accessibility, local and external links, claim accuracy, duplicates/conflicts, security, and operational-contract preservation; record disposition, findings, corrections, and focused rereviews in `implementation-record.md`.
    - _Requirements: 1.4–1.9, 3.4–3.8, 4.1–4.7, 5.1–5.12, 6.1–6.14, 7.1–7.13, 8.1–8.8, 9.1–9.9, 10.1–10.14, 11.4–11.7_

  - [x] 4.2 Rewrite and first-review root navigation: `README.md`, `START.md`, `CONTENTS.md`, and `DOC-MAP.md`
    - Treat the four files as one navigation transaction while assigning each one a distinct audience, reader need, purpose, and title.
    - Make shared-topic destinations agree with `AGENTS.md`, `Agents/INDEX.md`, and `docs/README.md`; put prerequisites before dependent instructions and use descriptive repository-relative links.
    - Review and correct global plain language, CommonMark/accessibility, links and anchors, live source accuracy, duplicate/conflict handling, security, and operational-rule preservation; record one disposition and first-review result per file.
    - _Requirements: 3.2–3.8, 4.1–4.10, 5.1–5.12, 6.1–6.14, 7.1–7.13, 8.1–8.8, 9.1–9.9, 10.1–10.14, 11.3–11.7_

  - [x] 4.3 Rewrite and first-review root operations and ownership: `Failures.md`, `HANDOVER.md`, `OPERATIONS_RUNBOOK.md`, `owners.md`, and `Testing-handbook.md`
    - Keep `Failures.md` the sole blocker record; classify handoff statements honestly as observed, historical, planned, deprecated, blocked, or pending; verify ownership and escalation paths.
    - Put goal, prerequisites, warnings, scope, expected outcome, and recovery before risky operational steps; retain exact database, migration, persistence, deployment, and validation boundaries supported by live evidence.
    - Distinguish static, unit, browser, build, coverage, and full-gate evidence and preserve both Vitest lanes without claiming an unobserved command passed.
    - Review and correct title/purpose, global plain language, CommonMark/accessibility, links, live source accuracy, duplicate/conflict handling, security, and operational-rule preservation; record one disposition and first-review result per file.
    - _Requirements: 3.2–3.8, 4.1–4.10, 5.1–5.12, 6.1–6.14, 7.1–7.13, 8.1–8.8, 9.1–9.9, 10.1–10.14, 11.3–11.7_

  - [x] 4.4 Rewrite and first-review agent handbooks and navigation: `Agents/INDEX.md`, `Agents/01-standard.md`, `Agents/02-testing.md`, `Agents/03-browser.md`, `Agents/04-failures.md`, `Agents/05-documentation.md`, `Agents/06-architecture.md`, and `Agents/07-css.md`
    - Keep session guidance subordinate to `AGENTS.md`, preserve unique task prerequisites and safeguards, and replace only exact lower-authority duplication with minimum local context plus descriptive canonical links.
    - Reconcile `Agents/INDEX.md` with the root navigation transaction and durable-document destinations; preserve browser-proof boundaries, blocker rules, architecture routing, and FOCSS workflow.
    - Review and correct title/purpose, global plain language, CommonMark/accessibility, links, live source accuracy, duplicate/conflict handling, security, and operational-rule preservation; record one disposition and first-review result per file.
    - _Requirements: 1.4–1.7, 3.2–3.8, 4.1–4.10, 5.1–5.12, 6.1–6.14, 7.1–7.13, 8.1–8.8, 9.1–9.9, 10.1–10.14, 11.3–11.7_

  - [x] 4.5 Rewrite and first-review agent research documents: `Agents/research-gap-areas.md` and `Agents/research-practices.md`
    - Separate research method from findings, verify citations and status, and prevent historical observations or research gaps from becoming unsupported current repository facts.
    - Apply the Source Register method, licensing-safe paraphrases, explicit evidence classes, and pending status for unresolved claims.
    - Review and correct title/purpose, global plain language, CommonMark/accessibility, links, live source accuracy, duplicate/conflict handling, security, and operational-rule preservation; record one disposition and first-review result per file.
    - _Requirements: 2.1–2.12, 3.2–3.8, 4.1–4.10, 5.1–5.12, 6.1–6.14, 7.1–7.13, 8.1–8.8, 9.1–9.9, 11.3–11.8_

  - [x] 4.6 Rewrite and first-review durable navigation and architecture: `docs/README.md`, `docs/architecture/css.md`, `docs/architecture/layout.md`, `docs/architecture/product-map.md`, `docs/architecture/routes.md`, `docs/architecture/scripts.md`, and `docs/architecture/stack.md`
    - Rebuild durable claims from owning source and configuration; verify product surfaces, current paths, routes, scripts, versions, integration states, and FOCSS architecture without inferring runtime success.
    - Make `docs/README.md` agree with the other five navigation documents and keep procedures linked to their canonical operational owners.
    - Exclude `pnpm run typecheck:scripts` while `scripts/tsconfig.json` is absent and classify unsupported or unavailable behavior as pending, planned, historical, deprecated, or absent.
    - Review and correct title/purpose, global plain language, CommonMark/accessibility, links, live source accuracy, duplicate/conflict handling, security, and operational-rule preservation; record one disposition and first-review result per file.
    - _Requirements: 3.2–3.8, 4.1–4.10, 5.1–5.12, 6.1–6.14, 7.1–7.13, 8.1–8.8, 9.1–9.9, 10.1–10.14, 11.3–11.7_

  - [x] 4.7 Rewrite and first-review database documentation: `docs/database/drizzle.md`, `docs/database/ops.md`, and `docs/database/schema.md`
    - Verify Admin and Products ownership, project references, migration directories, Drizzle roles, row-level security, grants, policies, rollback requirements, dry-run-before-apply commands, type generation, seed/restore procedures, and exclusive persistence modes against live source.
    - Put security and data-loss warnings before risky commands, name prerequisites, scope, impact, and recovery, and keep server credentials out of client-visible examples.
    - Review and correct title/purpose, global plain language, CommonMark/accessibility, links, live source accuracy, duplicate/conflict handling, security, and operational-rule preservation; record one disposition and first-review result per file.
    - _Requirements: 3.2–3.8, 4.1–4.10, 5.1–5.12, 6.1–6.14, 7.1–7.13, 8.1–8.8, 9.1–9.9, 10.4–10.7, 10.10–10.14, 11.3–11.7_

  - [x] 4.8 Rewrite and first-review governance documentation: `docs/governance/benchmarks.md`, `docs/governance/charter.md`, `docs/governance/focss-stop-drift.md`, and `docs/governance/rules.md`
    - Retain only evidence-backed governance decisions and measurable bars; distinguish configured, observed, present-but-unverified, planned, historical, deprecated, blocked, and pending-owner-validation states.
    - Preserve security and operational safeguards without presenting plans, generated evidence, or prior command logs as proof of current behavior.
    - Review and correct title/purpose, global plain language, CommonMark/accessibility, links, live source accuracy, duplicate/conflict handling, security, and operational-rule preservation; record one disposition and first-review result per file.
    - _Requirements: 3.2–3.8, 4.1–4.10, 5.1–5.12, 6.1–6.14, 7.1–7.13, 8.1–8.8, 9.1–9.9, 10.8–10.14, 11.3–11.7_

- [x] 5. Checkpoint — close the complete first pass before second-pass review
  - [x] 5.1 Reconcile all first-pass findings and dependency closures in `.kiro/specs/documentation-global-standards/implementation-record.md`
    - Confirm all 34 sole-owner cohort entries have completed first reviews, one provisional disposition, all required review dimensions, security records, claim/conflict evidence, and no omitted or duplicate path.
    - Process corrections in authority order by routing each change back to its sole owning cohort; append focused rereviews for every affected file, link, index, canonical reference, claim, conflict, source dependency, and operational-contract tag.
    - For a same-level unresolved conflict, preserve both baseline meanings, set `pending-owner-validation`, stop dependent work, and request owner resolution rather than inventing policy.
    - If correction requires an excluded path, record the block and leave the excluded asset untouched; use only file-level, cohort-bounded rollback for feature-owned regressions.
    - Apply static acceptance checks from Design Properties 6–17 and confirm first-pass correction loops are closed before Task 6.
    - Ensure all authorized tests pass, ask the user if questions arise; if no test was authorized and observed, record it as unrun rather than passed.
    - _Requirements: 1.5–1.9, 3.4–3.9, 7.11–7.13, 8.3–8.8, 9.1–9.9, 10.11–10.14, 11.1, 11.9–11.11, 11.16–11.18_

- [ ] 6. Perform a fresh complete second-pass review
  - [ ] 6.1 Re-read and second-review the exact 34-path corpus in `.kiro/specs/documentation-global-standards/implementation-record.md`
    - Use fresh file reads in allowlist order; do not copy first-pass conclusions. Record a distinct second-review result for every path and every required dimension.
    - Verify exact corpus membership and path presence; unique title and purpose; reader need; heading/list/table/image/fence/command-block structure; CommonMark/accessibility; local links and anchors; external citations; evidence-backed commands, paths, dates, and repository facts; conflict closure; security; operational-contract preservation; and six-navigation-document agreement.
    - Recheck every official source for canonical destination, publisher authority, applicability, access, and supersession; mark failed retrieval and dependent decisions unverified without inventing a pass.
    - Route any finding back to the path's sole cohort owner, apply the smallest in-scope correction, and append focused rereviews of the complete dependency closure before assigning `verified`.
    - Apply all Design Properties 1–21 as static acceptance checks, explicitly excluding PBT implementation and command-pass claims.
    - _Requirements: 1.12, 2.2–2.10, 3.1–3.9, 4.1–4.10, 5.1–5.12, 6.1–6.14, 7.1–7.13, 8.1–8.9, 9.1–9.9, 10.1–10.14, 11.2–11.11, 11.21–11.24_

- [ ] 7. Prove containment and derive the completion state
  - [ ] 7.1 Finalize changed-path, coverage, and completion records in `.kiro/specs/documentation-global-standards/implementation-record.md`
    - Compare baseline and final path maps and record every created, modified, deleted, or renamed path with ownership, allowlist status, and evidence.
    - Require all 34 original paths to remain present, exactly one resolved disposition and verified final state per path, two file-specific reviews per path, all corrections reverified, complete evidence classifications, zero changed-path exceptions, and zero required pending or failed outcomes.
    - Treat a `verified-retained` disposition as valid only with evidence for every required check; treat `consolidated-as-pointer` as valid only with a canonical destination and retained local operational context.
    - Roll back only feature-owned out-of-scope changes without destructive repository-wide commands. Preserve pre-existing outside work byte-for-byte and report any unresolved exception honestly.
    - Derive `complete` only if every stated condition holds; otherwise derive `incomplete` and list the exact unresolved records.
    - Apply static acceptance checks from Design Properties 1, 6, 7, 14, and 20–21.
    - _Requirements: 1.1–1.3, 1.10–1.12, 3.1–3.10, 7.11, 8.7–8.9, 11.10–11.11, 11.19–11.24_

- [ ] 8. Run only explicitly authorized exact-command validation
  - [ ]* 8.1 Run `pnpm run check:docs-all` only with exact current-session authorization and hook permission
    - Run from the repository root without substitution or expansion; record authorization, hook decision, exact command and arguments, working directory, exit status, redacted output summary, and evidence class in `implementation-record.md`.
    - If absent, denied, blocked, interrupted, unobserved, or failed, retain the exact non-pass state. Correct only in-scope documentation defects through the sole owner and rerun only with applicable fresh exact authorization.
    - _Requirements: 7.7, 7.13, 9.8, 10.10–10.11, 10.14, 11.12–11.17, 11.21–11.22_

  - [ ]* 8.2 Run `pnpm run docs:check:root-links` only with exact current-session authorization and hook permission
    - Run and record evidence under the same exact-command, repository-root, redaction, failure-honesty, scoped-correction, and rerun rules as Task 8.1.
    - _Requirements: 7.7, 7.13, 9.8, 10.10–10.11, 10.14, 11.12–11.17, 11.21–11.22_

  - [ ]* 8.3 Run `pnpm run check:layout` only with exact current-session authorization and hook permission
    - Run and record evidence under the same exact-command, repository-root, redaction, failure-honesty, scoped-correction, and rerun rules as Task 8.1.
    - _Requirements: 7.7, 7.13, 9.8, 10.10–10.11, 10.14, 11.12–11.17, 11.21–11.22_

  - [ ]* 8.4 Run a broader gate only when the user names and authorizes that exact command and the hook permits it
    - Do not select a gate on the user's behalf. Record the exact authorized test, build, coverage, browser, `pnpm run gate:fast`, or `pnpm run gate` command and its observed state without generalizing its evidence scope.
    - Report out-of-scope failures without modifying excluded assets; do not bypass the hook, broaden authorization, infer a pass, or run `pnpm run typecheck:scripts`.
    - _Requirements: 7.7, 7.13, 10.9–10.11, 10.14, 11.14–11.18, 11.21–11.22_

- [ ] 9. Finalize honest implementation reporting
  - [ ] 9.1 Complete the final summary in `.kiro/specs/documentation-global-standards/implementation-record.md`
    - Report all 34 dispositions and final states, first- and second-pass evidence, correction closure, source status, unresolved authority decisions, changed paths, and exact observed or pending command states.
    - Never report a pending, unrun, denied, blocked, interrupted, failed, or unobserved command as passed; distinguish static inspection from observed command evidence.
    - If a same-level authority conflict remains, identify it as `pending-owner-validation`, preserve the competing meanings, and request owner resolution. If an observed failure is outside scope, report it without changing excluded assets.
    - State `complete` only when the coverage-derived completion conditions in Task 7.1 remain true after any authorized command records; otherwise state `incomplete` and name every unmet condition.
    - _Requirements: 1.12, 3.8–3.10, 7.7, 7.12–7.13, 10.11, 10.14, 11.15–11.24_

- [ ] 10. Final checkpoint — ensure the implementation record is internally complete
  - [ ] 10.1 Confirm the implementation record is internally complete
    - Confirm `tasks.md` and `implementation-record.md` are the only feature-created artifacts, all 34 documentation paths remain present, and no prohibited path was modified.
    - Ensure all authorized tests pass, ask the user if questions arise; preserve every unauthorized or unobserved command as pending rather than passed.
    - _Requirements: 1.1–1.3, 1.10–1.12, 10.10–10.11, 11.19–11.24_

## Notes

- Tasks marked with `*` are optional and require exact current-session user authorization plus enabled-hook permission.
- The eight cohort subtasks are the sole write owners for the 34 documentation files. All later correction work is routed through that ownership map.
- `implementation-record.md` is the only implementation evidence artifact; do not write handwritten reports under `results/`.
- Property-based test implementation is intentionally excluded. Design Properties 1–21 are enforced as static acceptance checks.
- A checkpoint failure returns work to the owning earlier task; checks, authority rules, and completion criteria must not be weakened to manufacture completion.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["4.3"] },
    { "id": 6, "tasks": ["4.4"] },
    { "id": 7, "tasks": ["4.5"] },
    { "id": 8, "tasks": ["4.6"] },
    { "id": 9, "tasks": ["4.7"] },
    { "id": 10, "tasks": ["4.8"] },
    { "id": 11, "tasks": ["5.1"] },
    { "id": 12, "tasks": ["6.1"] },
    { "id": 13, "tasks": ["7.1"] },
    { "id": 14, "tasks": ["8.1"] },
    { "id": 15, "tasks": ["8.2"] },
    { "id": 16, "tasks": ["8.3"] },
    { "id": 17, "tasks": ["8.4"] },
    { "id": 18, "tasks": ["9.1"] },
    { "id": 19, "tasks": ["10.1"] }
  ]
}
```

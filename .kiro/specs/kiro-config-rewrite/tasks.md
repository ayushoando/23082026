# Implementation Plan: kiro-config-rewrite

## Overview

This plan executes the `.kiro` configuration rewrite as a sequence of concrete file operations — create, rewrite, move, and delete. There is **no application code** in this feature; every task is a filesystem/config operation. Tasks are grouped into the eight phases defined in design.md "Execution Order" (T1.1–T8.2) and ordered to respect the phase dependencies documented there.

For any task that requires exact file content, the executor MUST read the referenced design section (e.g., "Content per design §1a") rather than relying on content duplicated here. The design document is the authoritative content source.

**Testing note:** Property-based testing does not apply (see design.md "Correctness Properties" preamble). Verification is a one-time post-rewrite audit of the seven correctness properties (Phase 8). The moved-module Vitest smoke check is a **user-invoked** step per repo testing policy — agents do not auto-run tests.

## Tasks

- [ ] 1. Phase 1 — Delete duplicate and stub steering files
  - [ ] 1.1 Delete `steering/product-context.md`
    - Delete `.kiro/steering/product-context.md` (exact duplicate of `product.md`; the duplicate has no front-matter)
    - Reference: design §1e (Files to Delete)
    - _Requirements: 1.1, 9.4_

  - [ ] 1.2 Delete `steering/spec-guide.md`
    - Delete `.kiro/steering/spec-guide.md` (generator-comment stub carrying `inclusion: always`)
    - Reference: design §1e (Files to Delete)
    - _Requirements: 1.2, 9.6_

  - [ ] 1.3 Delete `steering/spec.md`
    - Delete `.kiro/steering/spec.md` (duplicate tech-stack definition, no front-matter); must be gone before `tech-stack.md` is rewritten so there is no competing authoritative definition
    - Reference: design §1e (Files to Delete)
    - _Requirements: 1.3, 9.5_

- [ ] 2. Phase 2 — Rewrite and correct steering files (requires Phase 1 complete)
  - [ ] 2.1 Rewrite `steering/tech-stack.md` as the authoritative tech-stack definition
    - Add `inclusion: always` front-matter; write all required sections with verified facts (Next.js 16, pnpm, Turborepo, oxlint, two Supabase DBs, migration paths, fork tree, deployment, observability, key dirs)
    - Must NOT contain any forbidden content: ESLint, `eslint.config.mjs`, root `/supabase/` path, `plans/PLAN.md`, "Next.js 14", `npm run build`/`npm`
    - Content per design §1a (section table + exclusion list)
    - _Requirements: 1.3, 1.3a, 1.3b, 1.3c, 1.3d, 1.3e, 1.3f, 1.3g, 1.3h, 1.3i, 9.3_

  - [ ] 2.2 Rewrite `steering/agent-behavior.md` to remove dead references
    - Retain `inclusion: always`; replace `npm run build` → `pnpm run build` (Turborepo) note; replace `/supabase/` migration path with the two correct migration paths; replace the "When Stuck" block referencing `errors.md`/`implementation_plan.md`/`CHANGELOG.md` with `Failures.md`, `plans/README.md`, `AGENTS.md` §1, `Agents/01-standard.md`; retain all existing H2 headings
    - Content per design §1b
    - _Requirements: 1.4, 8.2_

  - [ ] 2.3 Add `inclusion: always` front-matter to `steering/coding-standards.md`
    - Insert the YAML front-matter block at the very top, before the `# Coding Standards` heading; no content changes
    - Content per design §1c
    - _Requirements: 1.5, 9.2_

  - [ ] 2.4 Demote `steering/product-workflow.md` to manual inclusion
    - Change front-matter `inclusion: always` → `inclusion: manual`; add the one-line `# Activation` note after the front-matter and before `# Orchestrator Agent`; leave the ~600-line body otherwise unchanged
    - Content per design §1d
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Phase 3 — Relocate the guidance module to `scripts/` (independent of Phases 1–2)
  - [ ] 3.1 Create `scripts/kiro-repo-guidance-setup/` directory
    - Create the destination directory (the `scripts/` parent already exists)
    - Reference: design §5a (Directory Move — Execution note)
    - _Requirements: 5.1_

  - [ ] 3.2 Move all 25 `.ts` files from `.kiro/kiro-repo-guidance-setup/` to `scripts/kiro-repo-guidance-setup/`
    - Move the top-level TypeScript files listed in design §5a, preserving filenames
    - Reference: design §5a (file inventory)
    - _Requirements: 5.1_

  - [ ] 3.3 Move the `tests/` subdirectory to `scripts/kiro-repo-guidance-setup/tests/`
    - Move `tests/` with its four lane subdirs plus `integration/`, preserving structure
    - Reference: design §5a (file inventory)
    - _Requirements: 5.1_

  - [ ] 3.4 Fix the broken import in `scripts/kiro-repo-guidance-setup/pipeline.ts` (requires 3.2)
    - Change `from "../../scripts/kiro-repo-guidance-setup/reviewers"` → `from "./reviewers"`; leave all other sibling imports unchanged
    - Content per design §5b
    - _Requirements: 5.2_

  - [ ] 3.5 Create `scripts/kiro-repo-guidance-setup/README.md`
    - Document purpose (governance framework for concurrent implementation waves), what it is NOT (not runtime-executed), entry-points table, tests note, and the move history note
    - Content per design §5c
    - _Requirements: 5.3_

  - [ ] 3.6 Delete the now-empty `.kiro/kiro-repo-guidance-setup/` directory (requires 3.2 and 3.3)
    - Remove the source directory after all files and `tests/` have been moved out
    - Reference: design §5a; verify no `.kiro/` file references `kiro-repo-guidance-setup`
    - _Requirements: 5.4_

- [ ] 4. Phase 4 — Clean up the agents directory (independent of Phases 1–3)
  - [ ] 4.1 Create `plans/prompts/` directory
    - Create the directory if it does not already exist
    - Reference: design §3a (Prerequisite)
    - _Requirements: 4.1_

  - [ ] 4.2 Move the six workflow guide files from `.kiro/agents/` to `plans/prompts/` (requires 4.1)
    - Move `AI_Framing_Agent.md`, `AI_Framing_Template.md`, `Claude_Code_Workflow.md`, `Deep_Research_Agent.md`, `PRD_Creation_Guide.md`, `PRFAQ_Guide.md`, preserving filenames; retain `spec-task-runner.md` in `.kiro/agents/`
    - Reference: design §3a (move table), §3b (retain)
    - _Requirements: 4.2, 4.3_

  - [ ] 4.3 Update moved-file path references in `steering/product-workflow.md` (requires 4.2)
    - Rewrite `prompts/*.md` references to `plans/prompts/{filename}` per the design mapping table; also update any `.kiro/agents/*.md` reference to the new path
    - Content per design §3c
    - _Requirements: 4.4, 8.2_

  - [ ] 4.4 Create `plans/prompts/README.md` (requires 4.2)
    - Document the directory purpose, the file inventory table (role in pipeline + invoked-by), and the relationship note to the orchestrator
    - Content per design §3d
    - _Requirements: 4.5_

- [ ] 5. Phase 5 — Rewrite powers manifest and add MCP scaffold (independent of all above)
  - [ ] 5.1 Rewrite `powers/oando-workflow/POWER.md` with a three-tier MCP status table
    - Retain existing front-matter, companion skills, and activation routing verbatim; replace the `## MCP` section with `## MCP Status` split into Installed (empty), Partially Set Up (chrome-devtools, cloudflare-docs, github, tasks with `mcp/` paths), and Planned (nine MCPs marked `[NOT YET INSTALLED]`); append the fallback rule to the Rules section; leave `steering/routing.md` unchanged
    - Content per design §4a; leave routing.md per design §4b
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 5.2 Create `settings/mcp.json` empty scaffold
    - Write the exact JSON scaffold (`$schema`, `_comment` listing partially-set-up + planned MCPs, empty `mcpServers` object)
    - Content per design §4c
    - _Requirements: 6.4, 6.5_

- [ ] 6. Phase 6 — Rewrite hooks (independent of all above)
  - [ ] 6.1 Rewrite `hooks/domain-fast-check.json` to remove the catch-all typecheck
    - Keep trigger/matcher/timeout; retain the test-skip, boundary-scan, and FOCSS branches unchanged; remove the supabase/drizzle/etc. `elif` typecheck branch and the final catch-all typecheck, both replaced with `exit 0`; add no new typecheck or test-runner call
    - Content per design §2a
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 6.2 Create `hooks/session-start-orient.json`
    - Write the new `SessionStart` hook with action type `agent` whose prompt instructs reading `AGENTS.md` §1–§3 and `Agents/01-standard.md` before acting; leave `block-agent-tests.json` and `ltm-postturn-capture.json` untouched
    - Content per design §2b; no-change confirmation per §2c and §2d
    - _Requirements: 3.5, 3.6_

- [ ] 7. Phase 7 — Create the canonical steering index (requires Phases 1–6 complete)
  - [ ] 7.1 Create `steering/INDEX.md`
    - Add `inclusion: manual` front-matter; include the Steering Files table (File/Inclusion/Domain/Notes), Hooks table, Agents table, Powers table, Post-MCP Install Checklist (all four partially-set-up + nine planned), and a Removed References subsection; list the actual post-rewrite state of `.kiro/steering/`, `.kiro/hooks/`, `.kiro/agents/`, `.kiro/powers/`
    - Content per design §1f; requirements coverage: R7 fields, R9.8 front-matter audit visibility
    - _Requirements: 1.7, 7.1, 7.2, 7.3, 7.4, 9.8_

- [ ] 8. Phase 8 — Post-rewrite audit (final phase; requires all prior phases complete)
  - [ ] 8.1 Run the Property 3 reference audit across `.kiro/**/*.{md,json}`
    - Extract path-like strings (markdown links, backtick file refs, JSON `command` paths) and resolve each relative to the repo root; correct or remove any dead reference and record removals in `steering/INDEX.md` "Removed References"; must pass before running 8.2
    - **Property 3: Every path referenced inside `.kiro/**/*.{md,json}` resolves**
    - PowerShell check per design "Property 3"
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 8.2 Run the remaining correctness-property checks (Property 1, 2, 4, 5, 6, 7)
    - Run each check and confirm its pass condition; fix any failure at its source task before re-running
    - **Property 1: No two steering files share >30% H2 heading overlap** — Jaccard H2 overlap ≤ 0.30 for every pair (design "Property 1"). _Validates: 1.6_
    - **Property 2: Every steering file has explicit `inclusion` front-matter** — valid `always`/`fileMatch`/`auto`/`manual` value (design "Property 2"). _Validates: 9.1, 9.2, 9.3_
    - **Property 4: `.kiro/agents/` contains only Kiro agent definitions** — exactly `spec-task-runner.md`; no workflow-guide markers (design "Property 4"). _Validates: 4.2, 4.3_
    - **Property 5: `pipeline.ts` import resolves — `./reviewers` sibling exists** — files present, import path corrected, no `.kiro/` reference to `kiro-repo-guidance-setup` (design "Property 5"). _Validates: 5.1, 5.2, 5.4_
    - **Property 6: `settings/mcp.json` exists and is valid JSON** — parses, has `mcpServers` key (design "Property 6"). _Validates: 6.4_
    - **Property 7: No steering file references forbidden patterns** — zero matches for eslint, `eslint.config.mjs`, `plans/PLAN.md`, `errors.md`, `implementation_plan.md`, `CHANGELOG.md`, "Next.js 14", root `/supabase/` (design "Property 7"). _Validates: 1.3, 1.4, 8.2_
    - _Requirements: 1.6, 4.2, 4.3, 5.1, 5.2, 5.4, 6.4, 9.1, 9.2, 9.3, 8.2_

  - [ ] 8.3 (User-invoked) Smoke-check the moved guidance module
    - Verify the existing Vitest tests for `scripts/kiro-repo-guidance-setup/` still pass after the move: `pnpm run test --filter scripts/kiro-repo-guidance-setup` (or the tech-docs Vitest lane covering `scripts/`)
    - **NOTE: user-invoked only** — per repo testing policy agents do NOT auto-run tests; this step is run manually by the user
    - Reference: design "Testing Strategy" (Smoke check for moved module)
    - _Requirements: 5.1_

## Notes

- Tasks marked with `*` are optional/user-invoked and are NOT run by the agent (repo testing policy: tests are user-invoked only).
- This is a configuration rewrite — every task is a file create/rewrite/move/delete operation; there is no application code.
- Exact file content lives in design.md. Tasks reference the design section (e.g., "Content per design §1a") rather than duplicating content; the executor reads design.md for the authoritative text.
- Phase 1 (deletions) must complete before Phase 2 (rewrites) so the rewritten `tech-stack.md` has no competing definition.
- Phases 3, 4, 5, and 6 are mutually independent and may run in any relative order, but all must complete before Phase 7.
- Phase 7 (INDEX.md) must reflect the final post-rewrite state, so it depends on all prior phases.
- Phase 8 is the final audit; Property 3 (8.1) must pass before the remaining property checks (8.2) run.

## Task Dependency Graph

The graph below encodes the phase dependencies from design.md "Execution Order". Waves execute sequentially; tasks within a wave are independent and may run in parallel. Tasks writing to the same file are placed in different waves to avoid conflicts (e.g., 2.4 rewrites `product-workflow.md` before 4.3 edits its references).

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "3.1", "4.1", "5.1", "5.2", "6.1", "6.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "3.2", "3.3", "4.2"] },
    { "id": 2, "tasks": ["3.4", "3.5", "4.3", "4.4"] },
    { "id": 3, "tasks": ["3.6"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3"] }
  ]
}
```

### Dependency rationale

- **Wave 0** — Phase 1 deletions (1.1–1.3) plus the no-dependency setup/independent tasks that can start immediately: dir creation (3.1, 4.1), powers/settings (5.1, 5.2), hooks (6.1, 6.2).
- **Wave 1** — Phase 2 rewrites (require Phase 1 deletions done); module file moves (3.2, 3.3 require dir from 3.1); agents move (4.2 requires dir from 4.1). Note 2.4 must precede 4.3 since both touch `product-workflow.md`.
- **Wave 2** — Import fix (3.4 requires pipeline.ts moved in 3.2), module README (3.5), product-workflow reference update (4.3 requires 4.2 and 2.4), prompts README (4.4 requires 4.2).
- **Wave 3** — Delete the emptied source dir (3.6 requires 3.2 and 3.3).
- **Wave 4** — INDEX.md (7.1 requires all prior phases to reflect final state).
- **Wave 5** — Property 3 reference audit (8.1 requires all content in place).
- **Wave 6** — Remaining property checks (8.2 requires 8.1 to pass) and the user-invoked smoke check (8.3).

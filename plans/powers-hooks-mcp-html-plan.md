# Powers, Hooks, MCP, and Tech-Docs Implementation Plan

## Objective

Implement the approved repository maintenance work for powers, workspace hooks, repository MCP assets, and the existing tech-docs HTML app. Preserve the repository's fork boundaries, persistence rules, documentation conventions, validation gates, and all Postman resources.

## Scope and constraints

- Work only in the repository root at `d:\23082026`; do not create a worktree.
- Use at most one delegated agent, for read-only codebase context gathering.
- Use `pnpm` for repository commands.
- Do not modify `.postman.json`, Postman collections, Postman environments, or other Postman resources.
- Do not activate unrelated powers. Inventory all installed powers and activate none unless a requested operation clearly requires one; Postman is explicitly out of scope for this task.
- Keep Studio and Planner fork trees isolated.
- Do not add handwritten reports under `results/`.
- Preserve existing hooks and repository conventions unless the inventory identifies them as the intended hooks for explicit enablement or prompt optimization.

## Work sequence

1. **Record this plan.** Save this complete plan at `plans/powers-hooks-mcp-html-plan.md` before repository implementation work.
2. **Inventory current state.**
   - Enumerate installed powers and record their purpose and activation status.
   - Enumerate workspace hook files under `.kiro/hooks/`, including trigger, matcher, action type, enabled/disabled behavior, and prompt text.
   - Enumerate repository MCP assets under `mcps/`, their files, and all references in source, scripts, documentation, lint configuration, tests, and CI.
   - Locate the existing tech-docs HTML app, its source/data/build entry points, and the appropriate section or navigation model for adding this explanation.
   - Inspect package scripts and relevant repository guidance so validation uses the existing project commands.
3. **Define intended hook state.** Based on the inventory, select only hooks that are intended for this repository workflow. Make their enablement explicit in the supported hook configuration format, preserve trigger and matcher behavior, and avoid enabling unrelated or destructive automation. Reduce prompts to concise instructions containing only the necessary scope, constraints, and expected output; do not mention or activate unrelated powers.
4. **Relocate repository MCP assets.** Move `mcps/` to root-level `mcp/` without changing Postman resources. Update all non-Postman references, scripts, documentation, tests, ignore/lint rules, CI or tooling configuration, and any generated inventories that refer to the old path. Preserve file contents unless a path reference must change.
5. **Update documentation and tests.** Add a clear powers/hooks/MCP explanation to the existing tech-docs HTML app using its established data and rendering conventions. Update or add focused tests and inventory assertions only where the repository already has a suitable test/lint surface; do not create unrelated tests.
6. **Validate and repair.** Run, in the repository root, each required command:
   - `pnpm run check:layout`
   - `pnpm run gate:fast`
   - `pnpm run check:docs-all`
   - `pnpm run test`
   - `pnpm run build:tech-docs`
   Also run any targeted check needed for changed files, including boundary or style checks when applicable. If a command fails, fix the underlying issue and rerun the affected command(s).
7. **Final review.** Inspect the final diff and status, verify that `.postman.json` and Postman resources are unchanged, confirm the old `mcps/` references are removed except for intentional historical text, confirm the root `mcp/` tree exists, and report every changed file and every validation result with failures and repairs clearly identified.

## Acceptance criteria

- This plan exists at `plans/powers-hooks-mcp-html-plan.md` and contains the complete implementation and validation approach.
- Installed powers and workspace hooks are inventoried in the implementation evidence or repository-supported documentation without activating unrelated powers.
- Intended workspace hooks are explicitly enabled and have token-efficient, task-scoped prompts.
- Repository MCP assets live under root `mcp/`, with all applicable references, documentation, lint rules, and tests updated.
- Postman resources are byte-for-byte untouched by this work.
- The existing tech-docs HTML app explains the relationship between powers, hooks, and repository MCP assets.
- All requested validation commands have been executed and their actual results are reported.
- The final response lists every changed file and does not claim success for any criterion that was not verified.

# Implementation Plan: Kiro Configuration Rewrite

## Execution contract

This plan implements the audited target state in `design.md`. It changes Kiro configuration and relocates the existing governance module; it does not change application behavior.

Before each mutation, read the target file or enumerate the target directory. Preserve unrelated content. Do not run tests, typechecks, gates, coverage, browser checks, builds, or Docker services unless the user explicitly authorizes the exact command and the active hook permits it.

## Tasks

- [x] 1. Capture the live pre-state manifest
  - [x] 1.1 Enumerate `.kiro/steering`, `.kiro/skills`, `.kiro/agents`, `.kiro/hooks`, `.kiro/powers`, `.kiro/settings`, `.kiro/templates`, and `.kiro/kiro-repo-guidance-setup` from the live worktree.
  - [x] 1.2 Confirm the governance source contains 25 top-level `.ts` modules and 43 `.ts` test files before moving anything.
  - [x] 1.3 Confirm Git tracks no destination files under `scripts/kiro-repo-guidance-setup/`; do not infer destination state from `docs/architecture/scripts-stale-review.csv`.
  - [x] 1.4 Record any deviation from the design manifest before continuing; do not silently delete an unexpected file.
  - _Requirements: 1.1, 1.2, 1.4, 4.1, 4.2_

- [x] 2. Remove the generic product-workflow bundle
  - [x] 2.1 Delete the six skill directories: `ai-framing`, `ai-framing-template`, `claude-code-workflow`, `deep-research`, `prd`, and `prfaq`.
  - [x] 2.2 Delete the six mirrored workflow guides from `.kiro/agents/`: `AI_Framing_Agent.md`, `AI_Framing_Template.md`, `Claude_Code_Workflow.md`, `Deep_Research_Agent.md`, `PRD_Creation_Guide.md`, and `PRFAQ_Guide.md`.
  - [x] 2.3 Delete `.kiro/steering/product-workflow.md`.
  - [x] 2.4 Delete `.kiro/templates/ProjectDashboard_Template.html` and `.kiro/templates/ScreenIndex_Template.html`; remove `.kiro/templates/` if empty.
  - [x] 2.5 Confirm `.kiro/agents/spec-task-runner.md` remains and the nine retained skill directories are untouched.
  - [x] 2.6 Confirm no `plans/prompts/` directory was created by this work.
  - _Requirements: 2.1–2.8_

- [~] 3. Consolidate and correct steering
  - [x] 3.1 Delete `.kiro/steering/product-context.md`, `spec.md`, and `spec-guide.md`.
  - [x] 3.2 Rewrite `.kiro/steering/tech-stack.md` with `inclusion: always` and the audited stack/paths from Requirements 3.4–3.6 and design "Consolidate steering".
  - [x] 3.3 Rewrite `.kiro/steering/agent-behavior.md` to use pnpm, `site/` paths, both migration directories, `Failures.md`, `plans/PLAN.md`, `plans/README.md`, `AGENTS.md`, and `Agents/01-standard.md`.
  - [-] 3.4 Add `inclusion: always` to `.kiro/steering/coding-standards.md` and replace stale root-level app/lib/component paths with the actual `site/` layout without weakening its rules.
  - [ ] 3.5 Inspect all retained domain steering front matter and path references; preserve intentional fileMatch/manual inclusion behavior.
  - [ ] 3.6 Remove stale Datadog-RUM/Sentry claims and references to deleted workflow assets from retained steering.
  - _Requirements: 3.1–3.10_

- [~] 4. Relocate the governance module to `scripts/`
  - [ ] 4.1 Create `scripts/kiro-repo-guidance-setup/`.
  - [ ] 4.2 Move all 25 top-level TypeScript modules from `.kiro/kiro-repo-guidance-setup/` to the new directory, preserving filenames and content.
  - [ ] 4.3 Move the complete tests subtree (43 TypeScript files) to `scripts/kiro-repo-guidance-setup/tests/`, preserving its directory structure.
  - [ ] 4.4 In moved `pipeline.ts`, change only the confirmed broken reviewers import to `from "./reviewers"`.
  - [ ] 4.5 Inspect moved modules for paths made invalid by relocation; update only relocation-caused paths, documenting each change.
  - [ ] 4.6 Create `scripts/kiro-repo-guidance-setup/README.md` with purpose, non-runtime status, primary entry points, test location, and relocation history.
  - [ ] 4.7 Remove the empty source directory and verify no `.kiro` file references the old path.
  - _Requirements: 4.1–4.7_

- [~] 5. Align hooks with actual policy
  - [ ] 5.1 Rewrite `.kiro/hooks/domain-fast-check.json`: preserve the test skip, Studio/Planner boundary branch, and FOCSS/UI branch; replace every other branch with successful pass-through.
  - [ ] 5.2 Confirm `domain-fast-check.json` contains no typecheck, test, coverage, build, browser-runner, or Docker-service command.
  - [ ] 5.3 Keep `block-agent-tests.json` trigger `PostTaskExec`; replace only its garbled description with an accurate concise description.
  - [ ] 5.4 Create `.kiro/hooks/session-start-orient.json` as an agent-action `SessionStart` hook instructing the agent to read `AGENTS.md` sections 1–3 and `Agents/01-standard.md`.
  - [ ] 5.5 Leave `ltm-postturn-capture.json` unchanged.
  - _Requirements: 5.1–5.8_

- [~] 6. Create honest MCP settings and the three new powers
  - [ ] 6.1 Create `.kiro/settings/mcp.json` using the Kiro MCP schema and an empty `mcpServers` object; document local schemas as unconnected without inventing server commands or credentials.
  - [ ] 6.2 Create `.kiro/powers/observability/POWER.md` using the wired/not-wired boundaries in Requirement 7 and design "Observability power".
    - Route OTel to `site/instrumentation.ts`.
    - Route Prometheus/Grafana to `site/lib/observability/metrics.ts`, `/api/metrics`, `config/observability/`, and existing pnpm commands.
    - Route client errors to `/api/log-error`, `reportClientError.ts`, console output, and `Failures.md` for hard blockers.
    - State explicitly that Sentry and Datadog RUM are not wired.
  - [ ] 6.3 Create `.kiro/powers/analytics/POWER.md` using Requirement 8 and design "Analytics power".
    - Route through the consent-gated analytics modules and existing conversion taxonomy.
    - Mark Vercel Analytics and Speed Insights wired.
    - Do not claim GA4/Zaraz from CSP evidence alone.
  - [ ] 6.4 Create `.kiro/powers/security/POWER.md` using Requirement 9 and design "Security power".
    - Use the exact live paths for proxy CSP, CSRF, strict SVG validation, origin/upload checks, and `site/lib/rateLimit.ts`.
    - Preserve fail-closed invariants and user authorization for test-like checks.
    - Mark GitHub security tools schema-present, not connected.
  - [ ] 6.5 Verify each power directory name matches its front-matter `name`; none ships an MCP server.
  - _Requirements: 6.1–6.4, 7.1–7.8, 8.1–8.7, 9.1–9.8_

- [ ] 7. Rewrite the master workflow routing
  - [ ] 7.1 Rewrite `.kiro/powers/oando-workflow/POWER.md` to remove deleted workflow-skill routing and stale Datadog assumptions.
  - [ ] 7.2 Add routing to `observability`, `analytics`, and `security`, while preserving repo-map, graph-impact, fork-boundary, FOCSS, migration, and user-authorized verification routing.
  - [ ] 7.3 Correct all references to `block-agent-tests` so they describe its actual `PostTaskExec` trigger.
  - [ ] 7.4 Update `.kiro/powers/oando-workflow/steering/routing.md` only where its skill/power/MCP/hook inventory no longer matches the post-state.
  - [ ] 7.5 Update retained skills that call the hook `PreToolUse`; do not change hook lifecycle semantics.
  - _Requirements: 5.4–5.6, 6.2–6.7_

- [ ] 8. Create the canonical post-state index
  - [ ] 8.1 Create `.kiro/steering/INDEX.md` with `inclusion: manual`.
  - [ ] 8.2 List all 16 remaining steering files with inclusion mode and purpose.
  - [ ] 8.3 List all four hooks and their actual triggers/actions.
  - [ ] 8.4 List the sole agent, all nine retained skills, all four powers, and both settings files.
  - [ ] 8.5 Document capability status: wired, schema present, and not installed; include the four root MCP schema directories and the gitignored Datadog cache distinction.
  - [ ] 8.6 Add a removed-references table covering deleted steering, skills, agent guides, templates, and the old guidance-module path.
  - _Requirements: 10.1–10.4_

- [ ] 9. Perform the static post-state audit
  - [ ] 9.1 Manifest audit: compare the live `.kiro` tree to the design target state; confirm deleted bundle paths are absent and retained paths exist.
  - [ ] 9.2 Steering audit: parse front matter for every remaining steering file and confirm valid explicit inclusion values.
  - [ ] 9.3 Agent/skill audit: confirm exactly one agent and nine skills; search `.kiro` for all deleted workflow names and fix remaining references.
  - [ ] 9.4 Power audit: confirm four powers, matching front-matter names, no bundled MCP servers, and no false installed-capability claims.
  - [ ] 9.5 Hook/MCP JSON audit: parse every hook and `settings/mcp.json`; verify `mcpServers` is empty and `domain-fast-check` has no prohibited commands.
  - [ ] 9.6 Guidance-module audit: confirm 25 top-level modules, 43 test files, sibling `reviewers.ts`, `pipeline.ts` importing `./reviewers`, and no old source directory.
  - [ ] 9.7 Reference audit: validate repo-relative paths in `.kiro/**/*.{md,json}` while excluding classified external URLs, globs, commands, environment variables, and explicitly uninstalled capabilities.
  - [ ] 9.8 Stale-claim audit: confirm no retained steering claims Next.js 14, npm as package manager, ESLint config, root `/supabase/`, Datadog RUM, Sentry, or deleted workflow assets.
  - [ ] 9.9 Re-read `steering/INDEX.md` and reconcile it with the final filesystem after all fixes.
  - _Requirements: 10.5–10.8_

- [ ] 10. Record optional user-authorized validation without auto-running it
  - [ ] 10.1 If the user explicitly authorizes it and the active hook permits it, run `pnpm run typecheck:scripts` as the narrowest validation for the relocated TypeScript module.
  - [ ] 10.2 Record the exact observed result; do not infer success from historical report files.
  - [ ] 10.3 Do not run broader tests/gates/browser checks unless separately and explicitly requested.
  - _Requirements: 10.8, 10.9_

## Dependency order

```text
1 Pre-state
  ├─ 2 Remove workflow bundle
  ├─ 3 Consolidate steering
  └─ 4 Relocate governance module
       ↓
5 Hooks + 6 powers/settings
       ↓
7 Master routing
       ↓
8 Canonical index
       ↓
9 Static audit
       ↓
10 Optional user-authorized validation
```

Tasks 2, 3, and 4 may be implemented independently after Task 1, but the index and final audit must wait until all mutations are complete. If a static audit fails, fix the owning task before re-running that audit; do not weaken the check or document a known mismatch as complete.

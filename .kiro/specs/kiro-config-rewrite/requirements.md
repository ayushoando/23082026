# Requirements Document: Kiro Configuration Rewrite

## Introduction

The `.kiro` directory contains conflicting steering, an unrelated generic product-workflow bundle, misplaced executable TypeScript, and capability descriptions that do not match the live repository. A six-slice audit covering all 4,079 tracked files established the current state. Live source and current Git state take precedence over historical reports.

This rewrite changes Kiro configuration, relocates the existing governance module, repairs only the references and harness configuration broken by that relocation, and repairs the test-command blocker that enforces user-owned verification. It does not change application behavior, database schema, production infrastructure, or test assertions.

## Outcomes

After the rewrite:

- each steering domain has one authoritative file with explicit inclusion metadata;
- `.kiro/skills/` contains exactly 9 repo-specific skills;
- `.kiro/agents/` contains only `spec-task-runner.md`;
- observability, analytics, and security powers describe only verified capability states;
- MCP schema presence is distinguished from workspace configuration and runtime-registry availability;
- the governance module lives under `scripts/` with imports, embedded paths, and test discovery repaired;
- an enabled `PreToolUse` hook blocks agent-initiated test-like shell commands before execution;
- `steering/INDEX.md` describes the real post-state while preserving an explicit removal ledger.

## Glossary

- **Active runtime configuration:** `.kiro` steering, skills, powers, agents, hooks, and settings loaded or discoverable by Kiro. It excludes `.kiro/specs/**` and historical/removal-ledger text.
- **Wired capability:** Live source is mounted or invoked in the current application/runtime, with prerequisites documented.
- **Present but unmounted:** Packages or components exist, but no live importer/render/invocation was found.
- **Schema present:** Root `mcp/<name>/tools/*.json` exists. This proves neither workspace configuration nor an active external registry connection.
- **Workspace configured:** A server entry exists in `.kiro/settings/mcp.json`.
- **Runtime installed:** A direct runtime-registry check confirms availability.
- **Workflow bundle:** The coupled research → PRFAQ → PRD → prototype skills, agent guides, steering orchestrator, and HTML templates.

## Requirements

### Requirement 1: Audit authority and bounded scope

**User Story:** As the repo owner, I want the rewrite based on current repository evidence and limited to necessary files.

#### Acceptance Criteria

1. The Config Rewriter SHALL treat live source, current Git state, `AGENTS.md`, and current package/config files as authoritative over historical reports.
2. `docs/architecture/scripts-stale-review.csv` and `results/ops/coverage-admin.txt` SHALL be treated as historical evidence, not current verification or move manifests.
3. Normal implementation scope SHALL be `.kiro/**` plus relocation into `scripts/kiro-repo-guidance-setup/**`.
4. The only authorized files outside that normal scope are `scripts/general/block-agent-tests.mjs`, `tests/vitest.shared.ts`, and `tests/tsconfig.json`, because enforcement and test discovery cannot be repaired solely inside `.kiro`.
5. The Config Rewriter SHALL NOT change application source, test assertions/fixtures, Supabase migrations, CI workflows, public assets, or production infrastructure.
6. The Config Rewriter SHALL preserve unrelated work and SHALL perform a final changed-path audit against this allowlist.

### Requirement 2: Remove the generic product-workflow bundle

**User Story:** As an agent, I want discoverable capabilities to be relevant to this repository.

#### Acceptance Criteria

1. Delete these skill directories: `ai-framing`, `ai-framing-template`, `claude-code-workflow`, `deep-research`, `prd`, and `prfaq`.
2. Retain exactly these 9 skills: `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`, `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate`.
3. Delete these workflow guides from `.kiro/agents/`: `AI_Framing_Agent.md`, `AI_Framing_Template.md`, `Claude_Code_Workflow.md`, `Deep_Research_Agent.md`, `PRD_Creation_Guide.md`, and `PRFAQ_Guide.md`.
4. Retain `.kiro/agents/spec-task-runner.md` as the sole agent definition.
5. Delete `.kiro/steering/product-workflow.md` and both `.kiro/templates/*.html` workflow templates; remove the template directory if empty.
6. Do not create `plans/prompts/` or relocate the deleted bundle elsewhere.
7. No active runtime configuration SHALL route to a deleted bundle asset.
8. References inside this spec, Kiro-managed metadata, and `steering/INDEX.md` removal history are permitted when explicitly classified as historical/removed and must not be treated as runtime routes.

### Requirement 3: Consolidate and correct steering

**User Story:** As the Kiro runtime, I want one accurate source per steering concern.

#### Acceptance Criteria

1. Retain `product.md` as the sole product-context file; delete `product-context.md`, `spec.md`, and the empty `spec-guide.md`.
2. Rewrite `tech-stack.md` as the sole stack definition with `inclusion: always` and the audited Next.js 16, React 19, TypeScript, pnpm, Tailwind v4/FOCSS, oxlint, Supabase/Drizzle, AI/search, testing, deployment, and observability stack.
3. Use current paths: app under `site/`; Products migrations under `site/platform/supabase/migrations/`; Admin migrations under `site/platform/supabase/migrations.admin/`; primary TypeScript config at `site/tsconfig.json`.
4. Do not claim that `scripts/tsconfig.json` exists. The currently broken `typecheck:scripts` package command SHALL be documented as unavailable rather than offered as validation.
5. Do not claim Next.js 14, npm, ESLint/`eslint.config.mjs`, root `/supabase/`, Datadog RUM, or Sentry.
6. Update `agent-behavior.md` to use current paths and authority documents. It may reference `plans/README.md`, but SHALL NOT reference absent `plans/PLAN.md`.
7. Keep `coding-standards.md` explicit `inclusion: always` and current `site/` paths without overwriting its completed corrections.
8. Preserve retained domain steering inclusion behavior unless a live path is stale; every remaining steering file SHALL have valid explicit front matter.
9. Audit and repair retained skill assumptions, especially `powers-skills-model/SKILL.md`: remove stale candidate counts, `plans/ref/<name>/` ownership claims, claims that `oando-workflow` ships an empty local `mcp.json`, and inaccurate hook lifecycle/status text.

### Requirement 4: Relocate the governance module safely

**User Story:** As a maintainer, I want executable governance code under `scripts/` without silent loss or broken imports.

#### Acceptance Criteria

1. Before mutation, enumerate the exact source relative-path set, reject any destination collision, and record hashes or byte counts for every source file.
2. Move all 25 top-level TypeScript modules and all 43 tests, preserving the tests subtree structure.
3. Recalculate every moved test import against its new location. Existing `../../../scripts/kiro-repo-guidance-setup/*` imports SHALL NOT remain when they would resolve to `scripts/scripts/*`.
4. Fix relocation-sensitive module imports, including `pipeline.ts` using destination-local `./reviewers`.
5. Search all moved modules/tests for embedded old-root strings and update semantic paths that must now identify `scripts/kiro-repo-guidance-setup/**`, including manifests/contracts/freeze data where present.
6. Update `tests/vitest.shared.ts` include globs and `tests/tsconfig.json` includes from the old `.kiro` tree to the destination tree. No test logic may change.
7. Create `scripts/kiro-repo-guidance-setup/README.md` describing purpose, non-runtime status, entry points, test location, relocation, and validation limitations.
8. Compare destination and source relative-path sets. For files not on the documented relocation-edit exception list, hashes/bytes SHALL match. Every edited file SHALL be listed with its relocation reason.
9. Delete the source directory only after destination parity succeeds.
10. Active runtime configuration and active harness configuration SHALL contain no operational reference to the old module root. Historical/removal-ledger references remain allowed when classified.

### Requirement 5: Enforce user-owned verification before execution

**User Story:** As the repo owner, I want agent test execution blocked before it starts, while ordinary lightweight hooks remain truthful.

#### Acceptance Criteria

1. Rewrite `domain-fast-check.json` so test files remain skipped, Studio/Planner saves retain `pnpm run scan:boundaries`, FOCSS/UI saves retain their current UI checks, and all other matching saves pass without typecheck/test/build/browser/Docker commands.
2. Replace the disabled `PostTaskExec` test hook with an enabled `PreToolUse` hook whose matcher is `execute_pwsh|control_pwsh_process`, invoking `node scripts/general/block-agent-tests.mjs` before either shell tool runs; remove the existing `"enabled": false` state.
3. Repair `block-agent-tests.mjs` so every referenced matcher is defined and test-like commands, gates, coverage, browser-test runners, builds, typechecks, and local-service commands produce exit code 2 before execution.
4. The blocker SHALL affect agent tool calls, not commands the user runs directly in their own terminal.
5. Retained skills, powers, the index, and hook descriptions SHALL describe the actual enabled `PreToolUse` behavior; no file may claim a disabled `PostTaskExec` hook enforces policy.
6. Add `session-start-orient.json` with `SessionStart` agent action directing the agent to current authority docs. Leave `ltm-postturn-capture.json` unchanged.
7. Implementation of this spec SHALL NOT run tests, typechecks, gates, coverage, browser checks, builds, or Docker services.

### Requirement 6: Establish honest MCP and master routing

**User Story:** As an agent, I want MCP status stated only to the level current evidence supports.

#### Acceptance Criteria

1. Create `.kiro/settings/mcp.json` with the Kiro MCP schema and an empty `mcpServers` object.
2. Root `mcp/chrome-devtools`, `cloudflare-docs`, `github`, and `tasks` SHALL be labeled schema-present and not configured in workspace settings.
3. The gitignored `mcp/Datadog/` convention SHALL be labeled a regenerable local cache, not runtime source or proof of an installed integration.
4. Repo inspection alone SHALL NOT claim that an external/global runtime registry is empty. Runtime installation SHALL be stated only after a direct registry check; otherwise status is “runtime availability not verified.”
5. Update `oando-workflow` routing to remove deleted workflow routes, add the three new powers, preserve repo-specific routing, and describe the actual hook.
6. No power created or modified by this spec may bundle or install an MCP server.

### Requirement 7: Add the observability power

**User Story:** As an agent investigating traces, metrics, or errors, I want routing to observability tooling actually wired in this repo.

#### Acceptance Criteria

1. Create `.kiro/powers/observability/POWER.md` with valid repo-specific front matter.
2. Route tracing to `site/instrumentation.ts`, `@vercel/otel`, `OTEL_SERVICE_NAME`, and configured OTLP environment.
3. Route metrics to `site/lib/observability/metrics.ts`, `/api/metrics`, `config/observability/`, and existing observability commands; state that production metrics return 404 unless `OBSERVABILITY_METRICS_ENABLED=1`.
4. Route client errors to `/api/log-error` and `site/lib/observability/reportClientError.ts`; identify structured `console.error` as the current sink and `Failures.md` as the blocker ledger.
5. State that Sentry and Datadog RUM are not wired.
6. Describe Chrome DevTools schemas only as schema-present/workspace-unconfigured unless a runtime check proves more.
7. State that Docker observability services are user-invoked.

### Requirement 8: Add the analytics power

**User Story:** As an agent changing events or KPIs, I want consent-safe routing and truthful transport status.

#### Acceptance Criteria

1. Create `.kiro/powers/analytics/POWER.md` with valid repo-specific front matter.
2. Route to the existing analytics event, queue, conversion, KPI, transport, and consent modules.
3. Preserve the consent contract: accepted emits, undecided queues, rejected drops; new events reuse conversion taxonomy/privacy filtering.
4. Describe `@vercel/analytics`, `@vercel/speed-insights`, and `SiteAnalytics.tsx` as present but unmounted because no live importer/render was found.
5. Do not describe Vercel Analytics or Speed Insights as operationally wired unless application scope is separately widened to mount the component.
6. Treat GA4/Zaraz as wired only when a live component/configuration proves invocation; CSP allowance alone is insufficient.
7. State analytics MCP workspace/runtime status using Requirement 6 vocabulary.

### Requirement 9: Add the security power

**User Story:** As an agent touching a security boundary, I want routing to the actual layered controls.

#### Acceptance Criteria

1. Create `.kiro/powers/security/POWER.md` with valid repo-specific front matter.
2. Distinguish `site/proxy.ts` cookie/precheck plus CSP/header ownership from actual server session validation in `site/lib/auth/session.ts#getOptionalUser`/`requireAuthUser` and API authorization in `site/features/shared/api/withAuth.ts`.
3. Route CSRF to `site/lib/security/csrf.ts`, strict untrusted SVG validation to `site/lib/security/svgSanitizer.ts`, origin/upload checks to `site/lib/security/`, and rate limiting to `site/lib/rateLimit.ts`.
4. Distinguish the strict SVG validator from the weaker regex sanitizer and never recommend the weaker boundary for untrusted input.
5. Preserve fail-closed behavior for protected/member routes and AI-scoped production rate limiting.
6. Use exact commands: `pnpm run scan:secrets`, `pnpm run ops -- lint:secrets`, `pnpm run test:audit:api-routes`, and `pnpm run test:audit:eslint-disable`; label test-like commands user-owned and blocked for agent execution.
7. Describe GitHub security schemas as schema-present/workspace-unconfigured unless runtime availability is checked.
8. Note the worker RFC 9116 response without treating it as MCP capability.

### Requirement 10: Index, static audit, and completion status

**User Story:** As the repo owner, I want a truthful post-state inventory and no false completion claim.

#### Acceptance Criteria

1. Create `.kiro/steering/INDEX.md` with `inclusion: manual`, listing remaining steering and modes, four hooks with actual status/triggers, one agent, nine skills, four powers, and settings.
2. Include a clearly labeled removal/relocation ledger. Old names in that ledger are allowed and excluded from active-route stale-reference failures.
3. Run non-test static audits for manifests, JSON, front matter, capability wording, allowed changed paths, relocation path-set/parity, and active references.
4. Scope deleted-name and old-root searches to active runtime/harness references; classify `.kiro/specs/**`, Kiro metadata, and INDEX history separately rather than demanding impossible zero textual matches.
5. Perform a final `git diff --name-only`/scope review and a cross-document requirement-to-task coverage review.
6. Do not offer `pnpm run typecheck:scripts`; its referenced config is absent. If the owner later authorizes validation, `pnpm run typecheck:tests` is the candidate moved-module typecheck only after its include path is repaired, followed by the repository-required `pnpm run check:layout` and `pnpm run gate:fast` or `pnpm run gate` as separately authorized.
7. Until required gates have observed owner-authorized results, report “configuration changes complete; mandatory repository validation pending” rather than “done” or “passed.”
8. Never infer validation success from historical reports or command existence.

# Requirements Document: Kiro Configuration Rewrite

## Introduction

The `.kiro` directory contains conflicting steering, generic product-management workflow assets unrelated to this office-furniture application, misplaced executable TypeScript, an over-broad save hook, and power routing that does not distinguish live integrations from local MCP schemas or uninstalled services.

A six-slice audit covering all 4,079 tracked files established the real repository structure before these requirements were rewritten. Live code and Git state take precedence over historical reports. The rewrite is limited to Kiro configuration and relocation of the existing governance module; it does not change application behavior, database schema, or production infrastructure.

## Outcomes

After the rewrite:

- each steering domain has one authoritative file with explicit inclusion metadata;
- `.kiro/skills/` contains 9 repo-specific skills, not generic PM/ML workflow prompts;
- `.kiro/agents/` contains only `spec-task-runner.md`;
- three repo-local powers route observability, analytics, and security work to verified source and commands;
- MCP schema presence is never misrepresented as an installed connection;
- the governance TypeScript module lives under `scripts/`;
- every remaining repo-relative reference under `.kiro` resolves;
- `steering/INDEX.md` describes the real post-rewrite state.

## Glossary

- **Config Rewriter:** The executor of this spec.
- **Wired capability:** A live source/config/command exists in the current repo and any prerequisites are documented.
- **Schema-present MCP:** Tool JSON schemas exist under root `mcp/`, but no Kiro server connection exists.
- **Installed MCP:** A server is active in the Kiro registry or configured in `.kiro/settings/mcp.json`.
- **Workflow bundle:** The coupled generic research → PRFAQ → PRD → prototype skills, agent guides, steering orchestrator, and HTML templates.

## Requirements

### Requirement 1: Audit authority and scope

**User Story:** As the repo owner, I want the rewrite based on the current repository rather than stale summaries, so that configuration does not encode false capabilities or paths.

#### Acceptance Criteria

1. The Config Rewriter SHALL treat live source, current Git state, `AGENTS.md`, and current package/config files as authoritative over historical CSV/TXT reports.
2. The Config Rewriter SHALL NOT treat `docs/architecture/scripts-stale-review.csv` as a current move manifest; Git currently tracks no files under `scripts/kiro-repo-guidance-setup/`.
3. The Config Rewriter SHALL NOT treat `results/ops/coverage-admin.txt` as current verification; it is historical UTF-16 evidence from another worktree.
4. The Config Rewriter SHALL limit implementation to `.kiro/**` and relocation of `.kiro/kiro-repo-guidance-setup/**` into `scripts/kiro-repo-guidance-setup/**`.
5. The Config Rewriter SHALL NOT change application source, tests, Supabase migrations, CI workflows, public assets, or production infrastructure in this spec.

### Requirement 2: Remove the generic product-workflow bundle

**User Story:** As an agent working in this codebase, I want discoverable skills and agents to be relevant to the repo, so that unrelated product-management workflows do not consume context or get activated accidentally.

#### Acceptance Criteria

1. The Config Rewriter SHALL delete these skill directories: `.kiro/skills/ai-framing/`, `ai-framing-template/`, `claude-code-workflow/`, `deep-research/`, `prd/`, and `prfaq/`.
2. The Config Rewriter SHALL retain exactly these 9 skills: `db-migrations`, `focss-css`, `fork-boundaries`, `graph-impact`, `oando-master`, `planner-studio`, `powers-skills-model`, `repo-map`, and `verify-and-gate`.
3. The Config Rewriter SHALL delete these mirrored workflow guides from `.kiro/agents/`: `AI_Framing_Agent.md`, `AI_Framing_Template.md`, `Claude_Code_Workflow.md`, `Deep_Research_Agent.md`, `PRD_Creation_Guide.md`, and `PRFAQ_Guide.md`.
4. The Config Rewriter SHALL retain `.kiro/agents/spec-task-runner.md` as the sole agent definition.
5. The Config Rewriter SHALL delete `.kiro/steering/product-workflow.md`.
6. The Config Rewriter SHALL delete `.kiro/templates/ProjectDashboard_Template.html` and `ScreenIndex_Template.html`, then remove `.kiro/templates/` if empty.
7. The Config Rewriter SHALL NOT create `plans/prompts/` or relocate the deleted workflow files elsewhere.
8. No remaining `.kiro` file SHALL reference a deleted workflow skill, agent guide, steering file, or template.

### Requirement 3: Consolidate steering into one authoritative file per domain

**User Story:** As the agent runtime, I want steering to be correct, non-duplicative, and explicitly scoped, so that instructions do not conflict.

#### Acceptance Criteria

1. The Config Rewriter SHALL retain `.kiro/steering/product.md` as the sole product-context file and delete `product-context.md`.
2. The Config Rewriter SHALL delete `spec-guide.md` because it is an empty always-loaded stub.
3. The Config Rewriter SHALL delete `spec.md` and rewrite `tech-stack.md` as the sole stack definition.
4. Rewritten `tech-stack.md` SHALL begin with `inclusion: always` and describe the audited stack: Next.js 16 App Router; TypeScript; pnpm; React 19; Tailwind CSS v4/FOCSS; oxlint; Supabase with Admin and Products databases; Drizzle; Mastra/Bedrock/LanceDB/Orama/Fuse; Playwright and Vitest; Vercel and Cloudflare Worker/R2; OpenTelemetry, Prometheus/Grafana, Vercel Analytics, and Speed Insights.
5. `tech-stack.md` SHALL use current paths: Next app under `site/`; Products migrations under `site/platform/supabase/migrations/`; Admin migrations under `site/platform/supabase/migrations.admin/`; primary TypeScript config at `site/tsconfig.json`; script config at `scripts/tsconfig.json`.
6. `tech-stack.md` SHALL NOT claim Next.js 14, npm as package manager, ESLint/`eslint.config.mjs`, a root `/supabase/` directory, Datadog RUM, or Sentry.
7. The Config Rewriter SHALL update `agent-behavior.md` to use `pnpm`, current `site/` paths, `Failures.md` for blockers, `plans/PLAN.md` and `plans/README.md` for coordination, `AGENTS.md` for authority, and `Agents/01-standard.md` for standard procedure.
8. The Config Rewriter SHALL add explicit `inclusion: always` front matter to `coding-standards.md` and correct stale root-level directory references within it.
9. Existing domain steering SHALL retain its current fileMatch/manual behavior unless a referenced path is stale.
10. Every remaining `.kiro/steering/*.md` file SHALL begin with valid explicit front matter using `always`, `fileMatch`, `auto`, or `manual`.

### Requirement 4: Relocate the governance TypeScript module

**User Story:** As a maintainer, I want executable governance code under `scripts/`, so that `.kiro` remains configuration-only and imports resolve correctly.

#### Acceptance Criteria

1. The Config Rewriter SHALL move all 25 top-level TypeScript modules from `.kiro/kiro-repo-guidance-setup/` to `scripts/kiro-repo-guidance-setup/`, preserving filenames.
2. The Config Rewriter SHALL move all 43 existing test files and their directory structure to `scripts/kiro-repo-guidance-setup/tests/`.
3. The Config Rewriter SHALL change the broken `pipeline.ts` import from `../../scripts/kiro-repo-guidance-setup/reviewers` to `./reviewers` after relocation.
4. No other module content SHALL change as part of the move unless required to correct a path broken by relocation.
5. The Config Rewriter SHALL create `scripts/kiro-repo-guidance-setup/README.md` describing purpose, non-runtime status, primary entry points, tests, and relocation history.
6. The source `.kiro/kiro-repo-guidance-setup/` directory SHALL be absent after the move.
7. No remaining `.kiro` file SHALL reference the old module path.

### Requirement 5: Align hooks with user-owned verification

**User Story:** As the repo owner, I want save/session hooks to remain lightweight and truthful, so that agents do not trigger expensive verification without permission.

#### Acceptance Criteria

1. The Config Rewriter SHALL rewrite `hooks/domain-fast-check.json` so test files remain skipped, Studio/Planner saves retain `pnpm run scan:boundaries`, and FOCSS/component/CSS saves retain `pnpm run verify:focss` plus `pnpm run lint:ui:strict`.
2. All other matching saves SHALL exit successfully without running typecheck, tests, coverage, build, or browser commands.
3. The Config Rewriter SHALL remove the existing Supabase/Drizzle catch-all typecheck branch and the final catch-all typecheck branch.
4. The Config Rewriter SHALL retain `block-agent-tests.json` trigger `PostTaskExec`; this spec SHALL NOT change its lifecycle semantics.
5. The Config Rewriter SHALL replace the garbled `block-agent-tests.json` description with a concise description matching its actual trigger/action.
6. Retained powers/skills SHALL describe `block-agent-tests` as `PostTaskExec`, not `PreToolUse`.
7. The Config Rewriter SHALL add `hooks/session-start-orient.json` with trigger `SessionStart` and agent action instructing the agent to read `AGENTS.md` sections 1–3 and `Agents/01-standard.md` before acting.
8. `ltm-postturn-capture.json` SHALL remain unchanged.

### Requirement 6: Establish honest MCP and master-power routing

**User Story:** As the agent using powers, I want capability status to distinguish live tools from schemas and plans, so that routing never calls an unavailable service.

#### Acceptance Criteria

1. The Config Rewriter SHALL create `.kiro/settings/mcp.json` with the Kiro MCP schema and an empty `mcpServers` object.
2. Root `mcp/chrome-devtools/`, `mcp/cloudflare-docs/`, `mcp/github/`, and `mcp/tasks/` SHALL be described as schema-present, not installed.
3. The gitignored `mcp/Datadog/` convention SHALL be described as a regenerable local data cache, not runtime source and not an installed Datadog integration.
4. External capabilities SHALL be labeled installed only when present in the active registry or `settings/mcp.json`.
5. The Config Rewriter SHALL update `powers/oando-workflow/POWER.md` to remove deleted workflow routing, route to the three new powers, preserve repo-map/graph/fork/FOCSS/database/verification routing, and correct the hook-trigger description.
6. `powers/oando-workflow/steering/routing.md` SHALL be updated only where required to match the final skill, power, MCP, or hook inventory.
7. No power created or modified by this spec SHALL bundle or install an MCP server.

### Requirement 7: Add the observability power

**User Story:** As an agent investigating traces, metrics, or errors, I want routing to the observability tooling actually wired in this repo.

#### Acceptance Criteria

1. The Config Rewriter SHALL create `.kiro/powers/observability/POWER.md` with valid power front matter and repo-specific keywords.
2. The power SHALL route tracing to `site/instrumentation.ts` and `@vercel/otel`, using `OTEL_SERVICE_NAME` and any configured OTLP environment.
3. The power SHALL route metrics to `site/lib/observability/metrics.ts`, `/api/metrics`, `config/observability/`, and `pnpm run observability:up|down|logs`.
4. The power SHALL state that `/api/metrics` returns 404 in production unless `OBSERVABILITY_METRICS_ENABLED=1`.
5. The power SHALL route client-error investigation to `/api/log-error` and `site/lib/observability/reportClientError.ts`, whose current sink is structured `console.error`; hard blockers belong in root `Failures.md`.
6. The power SHALL state that Sentry and Datadog RUM are not wired in current source.
7. The power SHALL identify Chrome DevTools performance schemas as schema-present but not connected.
8. The power SHALL state that starting/stopping local Docker observability services is user-invoked.

### Requirement 8: Add the analytics power

**User Story:** As an agent changing events or KPIs, I want routing through the existing consent and event contracts, so that analytics remains privacy-safe and consistent.

#### Acceptance Criteria

1. The Config Rewriter SHALL create `.kiro/powers/analytics/POWER.md` with valid power front matter and repo-specific keywords.
2. The power SHALL route to `site/lib/analytics/emitTransport.ts`, `emitSiteEvent.ts`, `eventQueue.ts`, `conversionContract.ts`, `siteEvents.ts`, `kpiEvents.ts`, `kpiIntegrity.ts`, and `site/lib/consent.ts`.
3. The power SHALL define the consent contract: accepted emits; undecided queues; rejected drops.
4. The power SHALL require new events to reuse the taxonomy/privacy filtering in `conversionContract.ts` rather than bypassing it.
5. The power SHALL identify Vercel Analytics and Speed Insights as wired.
6. GA4/Zaraz SHALL be described as wired only where current live components/configuration confirm it; CSP allowance alone is insufficient evidence.
7. The power SHALL state that no analytics MCP is installed unless a runtime connection is added later.

### Requirement 9: Add the security power

**User Story:** As an agent touching a security boundary, I want routing to the repo's actual fail-closed controls and checks.

#### Acceptance Criteria

1. The Config Rewriter SHALL create `.kiro/powers/security/POWER.md` with valid power front matter and repo-specific keywords.
2. The power SHALL route CSP, nonce, protected routes, and security headers to `site/proxy.ts`.
3. The power SHALL route CSRF to `site/lib/security/csrf.ts`, untrusted SVG validation to `site/lib/security/svgSanitizer.ts`, origin/upload checks to `site/lib/security/`, and rate limiting to `site/lib/rateLimit.ts`.
4. The power SHALL distinguish the strict SVG validator from the weaker regex sanitizer and SHALL NOT recommend the weaker sanitizer as an untrusted-input boundary.
5. The power SHALL preserve fail-closed invariants for AI-scoped production rate limits and protected/member-only routes.
6. The power SHALL route secret/API/security checks to the existing root/ops commands, including `scan:secrets`, `ops lint:secrets`, `test:audit:api-routes`, and `test:audit:eslint-disable`, while stating that test-like commands require explicit user authorization.
7. The power SHALL identify GitHub security schemas as schema-present but not connected.
8. The power SHALL note the Cloudflare worker's RFC 9116 security response without treating it as an MCP capability.

### Requirement 10: Create the canonical post-state index and verify the rewrite

**User Story:** As an agent entering the repo, I want one accurate inventory of Kiro configuration and capability status.

#### Acceptance Criteria

1. The Config Rewriter SHALL create `.kiro/steering/INDEX.md` with `inclusion: manual`.
2. The index SHALL list all remaining steering files and inclusion modes, all 4 hooks with actual triggers, the sole agent, all 9 retained skills, all 4 powers, and both settings files.
3. The index SHALL document MCP status using the terms wired, schema present, and not installed.
4. The index SHALL include removed references and their replacements where applicable.
5. A static post-state audit SHALL verify the exact manifest, valid JSON, valid steering/power front matter, absence of the deleted workflow bundle, and absence of stale stack claims.
6. A repo-relative reference audit SHALL verify paths in `.kiro/**/*.{md,json}` while classifying external URLs, globs, commands, environment variables, and explicitly uninstalled capabilities separately.
7. The module audit SHALL verify 25 top-level TypeScript files and 43 test files at the destination and the `./reviewers` import.
8. No implementation task SHALL claim a test, typecheck, gate, coverage run, browser check, or local-service startup passed unless the user explicitly authorized it and an observed result exists.
9. If authorized, the narrowest applicable moved-module validation is `pnpm run typecheck:scripts`; broader gates remain outside this spec unless explicitly requested.

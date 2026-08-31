---
name: capability-powers-author
description: Authors workspace MCP settings and evidence-based observability, analytics, and security powers under .kiro. Use for Task 6 of the Kiro configuration rewrite.
resources:
  - file://AGENTS.md
  - file://Agents/01-standard.md
  - file://plans/README.md
  - file://.kiro/specs/kiro-config-rewrite/requirements.md
  - file://.kiro/specs/kiro-config-rewrite/design.md
  - file://.kiro/specs/kiro-config-rewrite/tasks.md
  - file://.kiro/settings/mcp.json
  - file://.kiro/powers/{observability,analytics,security}/**/*
  - file://.kiro/mcp/**/*
  - file://site/instrumentation.ts
  - file://site/lib/observability/**/*
  - file://site/components/site/SiteAnalytics.tsx
  - file://config/observability/**/*
tools: ["read", "write", "shell"]
---

Execute only the capability-powers lane for Task 6 of the Kiro configuration rewrite.

## Ownership

Canonical write scope:
- `.kiro/settings/mcp.json`
- `.kiro/powers/observability/**`
- `.kiro/powers/analytics/**`
- `.kiro/powers/security/**`

There are no approved outside deletions. All repository paths outside this scope are read-only evidence sources. Do not edit application code, tests, test configuration, specs, plans, authority documents, hooks, governance modules, MCP schemas, other settings, `oando-workflow`, steering, skills, or agents.

## Execution contract

1. Work from the repository root. Never create a worktree.
2. Read live source and configuration before writing capability claims. Preserve unrelated and concurrent changes; never overwrite, revert, or clean work you do not own.
3. Create or repair `.kiro/settings/mcp.json` with an empty workspace `mcpServers` object and the expected Kiro MCP schema declaration. Do not invent server commands, credentials, or runtime availability.
4. Author `observability/POWER.md` from live evidence for OpenTelemetry, Prometheus/Grafana, metrics availability, client errors, the structured console sink, and `Failures.md`. State that Sentry and Datadog RUM are not wired unless current live evidence proves otherwise.
5. Author `analytics/POWER.md` from live consent, event, queue, conversion, and KPI evidence. Classify Vercel Analytics and Speed Insights as present but unmounted unless current live evidence proves mounting.
6. Author `security/POWER.md` with distinct routing for proxy prechecks/headers, server session validation, and API authorization, plus strict SVG, CSRF, origin/upload, and rate-limit controls. Preserve owner-owned execution for `pnpm run scan:secrets`, `pnpm run ops -- lint:secrets`, `pnpm run test:audit:api-routes`, and `pnpm run test:audit:eslint-disable`.
7. Use `.kiro/mcp/**` for schema references. Distinguish `schema present`, `workspace configured`, and `runtime installed`; if no direct registry evidence exists, say runtime availability is not verified. Do not bundle, install, or configure an MCP server in a power.
8. Keep each power focused, ensure its directory matches its front-matter name, and give actionable routing rather than unsupported capability claims.
9. Use shell access only for read-only evidence search, JSON/front-matter inspection, Git-state, and diff/scope inspection. Do not install dependencies, access secrets, make outbound requests with repository data, or start services.
10. Do not run tests, typechecks, gates, coverage, builds, browser checks, browser runners, or Docker commands without explicit owner authorization in the current session. Static inspection is not a behavioral pass.
11. Before every mutation, verify the target is owned by this lane. If a needed write is outside the scopes above, a live claim cannot be substantiated, or another worker changed an owned file unexpectedly, stop without making that change and escalate to the coordinator/owner.

## Handoff

Return:
- every settings or power file created or modified;
- the live evidence supporting each wired, not-wired, present-but-unmounted, schema-present, workspace-configured, or runtime-unverified statement;
- static commands run with observed results;
- required routing or INDEX follow-up for the coordinator, without editing those files;
- unresolved evidence gaps or out-of-scope needs;
- confirmation that no prohibited validation ran, no worktree was created, and no outside file was modified.

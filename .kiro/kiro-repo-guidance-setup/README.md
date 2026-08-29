# Kiro Repository Guidance Setup

## Purpose and runtime boundary

This directory contains the repository-governance implementation for Kiro guidance setup. Its TypeScript modules model discovery, authority and scope resolution, capability evaluation, ownership and reservation controls, validation records, review, rollback, handover, enablement, and post-wave integration.

This is governance tooling, not Next.js application runtime code. It is not a route, component, server handler, or production runtime dependency under `site/`; application code should not import it as a product feature.

## Canonical location

`.kiro/kiro-repo-guidance-setup/` is the sole canonical governance root. The expected canonical inventory is 29 top-level TypeScript modules plus 43 tests in the existing subtree. Imports, embedded roots, manifests, contracts, fixtures, and documentation must continue to identify `.kiro/kiro-repo-guidance-setup/**`.

Kiro-managed governance changes belong here under the repository-root `.kiro/` containment boundary. Do not recreate or route active configuration to `scripts/kiro-repo-guidance-setup/`.

## Key entry points

- `contracts.ts` defines the shared governance contracts and records used across stages.
- `wave-manifest.ts` freezes the canonical implementation and test roots plus execution constraints.
- `pipeline.ts` exposes `IntegrationPipelineService` and `runIntegrationPipeline` for post-wave orchestration.
- `integration-gate.ts` exposes `IntegrationValidationGateService` and `runIntegrationValidationGate` for final integration evidence and changed-file assessment.
- `runtime-records.ts` defines the declared four-slot roster, closed lifecycle/enforcement vocabularies, and fail-closed validators for roster, ownership, route, gate, handoff, conflict, and completion records. Its declared runtime activation remains `not-observed`.
- `action-gate.ts` evaluates one untrusted Action Record for each of the six controlled action kinds and denies malformed, unavailable, conflicting, unauthorized, or indeterminate state before execution.
- `.kiro/hooks/pre-action-delegation-gate.json` and `.mjs` provide a bounded host adapter for `invoke_sub_agent` only; this is partial/static integration and does not establish universal read/write/delete/command/handoff interception.
- `contract-coverage.ts` and `exact-line.ts` enforce the approved static document manifests and idempotent insertion rules.
- `enablement.ts`, `validation.ts`, `reviewers.ts`, `rollback.ts`, and `handover.ts` implement the downstream decision and recovery stages.
- The remaining top-level modules implement focused discovery, compatibility, policy, ownership, reservation, capability, hook, skill, continuity, and contract-freeze stages.

There is no package-level barrel or standalone command in this directory. Consumers should import the specific contract or stage they need.

## Capability reconciliation

- The selected optional repository skill is `.kiro/skills/ai-retrieval/SKILL.md`. It routes the observed server-only Mastra, provider, embedding, LanceDB, Orama, catalog-retrieval, advisory-output, and route-contract evidence; it does not activate providers or make model output authoritative.
- The four legacy repository Power documents under `.kiro/powers/` remain routing-only and contain no MCP server. Their local-first, least-privilege, empty-workspace-MCP boundaries remain consistent; no Power was activated.
- `.kiro/settings/mcp.json` remains `{ "mcpServers": {} }`. The repository's MCP schema snapshots and Power prose are not evidence of a configured, connected, authenticated, or runtime-available server.
- The planner client-to-route relationship remains a coverage gap: `site/lib/ai/mastra/plannerAdvisorClient.ts` names `/api/planner/ai-advisor`, while the observed canonical App Router advisor endpoint is `/api/ai-advisor`. No product route repair is included in this governance change.

## Tests and harness targeting

Tests are grouped by implementation lane and integration scope:

```text
tests/
├── lane-a/
├── lane-b/
├── lane-c/
├── lane-d/
└── integration/
```

The repository test harness already targets this canonical tree:

- `tests/vitest.shared.ts` includes `.kiro/kiro-repo-guidance-setup/tests/**/*.test.ts` and `*.test.tsx`.
- `tests/tsconfig.json` includes `.kiro/kiro-repo-guidance-setup/**/*.ts` and `*.tsx`.

Those harness files remain at their established repository paths and are referenced assets, not Kiro-owned files to relocate.

## Reversed relocation history

A partial relocation previously copied this governance tree to `scripts/kiro-repo-guidance-setup/`. That destination was abandoned and the relocation was reversed because the owner-selected containment boundary is root `.kiro/` and the existing test harness already targets this directory. Relocation-independent fixes from the outside copy are reconciled into canonical counterparts before the duplicate is removed; path rewrites made only for the abandoned `scripts/` destination are not retained.

References to `scripts/kiro-repo-guidance-setup/` are historical only when they appear in the rewrite spec or a labeled reconciliation/removal ledger. They are not active routes or alternate ownership locations.

## Validation status and limits

Static inspection may verify manifests, expected file counts, relative path sets, hashes/bytes, canonical references, reconciliation decisions, and changed-path containment. Static evidence does not establish behavioral correctness and must not be reported as a passing test, typecheck, gate, build, browser check, coverage run, or service check.

Behavioral validation is pending explicit repository-owner authorization and an observed run. Do not offer `pnpm run typecheck:scripts`; its referenced `scripts/tsconfig.json` is absent. Until the required repository checks are owner-authorized and observed: **Configuration changes complete; mandatory repository validation pending owner execution/authorization.**
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.
Before any action, read the current user request and applicable repository standard, declare exact scope and permissions, and stop on denial, conflict, or missing authorization.
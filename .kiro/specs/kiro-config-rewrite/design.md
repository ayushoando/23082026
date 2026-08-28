# Design Document: Kiro Configuration Rewrite

## Purpose

Rebuild `.kiro/` around the repository that actually exists, not around generic product-development prompts or stale configuration assumptions. The rewrite removes irrelevant workflow machinery, establishes one authoritative steering file per domain, keeps only repo-specific skills and agents, adds three routing powers backed by live code, and moves the TypeScript governance module out of configuration space.

This design is based on:

- a six-slice audit covering all 4,079 tracked files;
- direct inspection of every `.kiro` file;
- the complete browser/API and test inventories;
- live source checks for observability, analytics, and security;
- repository evidence under `agent-reports/`, `results/`, and `docs/architecture/`.

Where an audit report conflicted with live code or Git, live state won. Two corrections matter:

1. Datadog is **not wired** in current source or `package.json`; it appears only in a local-cache convention, documentation, and the lockfile. The observability power must not present it as installed.
2. `docs/architecture/scripts-stale-review.csv` is historical: Git currently tracks no files under `scripts/kiro-repo-guidance-setup/`. The move from `.kiro/kiro-repo-guidance-setup/` therefore creates the destination rather than restoring an existing tracked tree.

## Design principles

1. **Repo-specific context only.** Always-loaded or discoverable Kiro configuration must help with this office-furniture application, its forks, data boundaries, styling, tests, or operations.
2. **One source per concern.** Duplicate steering, mirrored workflow guides, and stale stack descriptions are deleted rather than preserved through aliases.
3. **Routing, not duplication.** Powers point to live source, commands, and evidence. They do not copy implementation rules or ship MCP servers.
4. **Honest capability status.** Wired repo tooling, local MCP schemas, and uninstalled external capabilities are described separately.
5. **Configuration stays configuration.** Executable TypeScript governance code belongs under `scripts/`, not `.kiro/`.
6. **No implied verification.** Static audits may be run by the executor. Tests, gates, coverage, browser runners, and local service startup remain user-invoked.
7. **Smallest coherent post-state.** If an entire workflow bundle is irrelevant, remove the bundle instead of relocating its pieces.

## Target state

```text
.kiro/
├── agents/
│   └── spec-task-runner.md
├── hooks/
│   ├── block-agent-tests.json
│   ├── domain-fast-check.json
│   ├── ltm-postturn-capture.json
│   └── session-start-orient.json
├── powers/
│   ├── analytics/POWER.md
│   ├── observability/POWER.md
│   ├── oando-workflow/
│   │   ├── POWER.md
│   │   └── steering/routing.md
│   └── security/POWER.md
├── settings/
│   ├── lsp.json
│   └── mcp.json
├── skills/
│   ├── db-migrations/SKILL.md
│   ├── focss-css/SKILL.md
│   ├── fork-boundaries/SKILL.md
│   ├── graph-impact/SKILL.md
│   ├── oando-master/SKILL.md
│   ├── planner-studio/SKILL.md
│   ├── powers-skills-model/SKILL.md
│   ├── repo-map/SKILL.md
│   └── verify-and-gate/SKILL.md
├── specs/                       # untouched except this spec
└── steering/
    ├── INDEX.md
    ├── agent-behavior.md
    ├── ai.md
    ├── api.md
    ├── coding-standards.md
    ├── database.md
    ├── deployment.md
    ├── graph-layer.md
    ├── ltm-memory-format.md
    ├── ltm-operations.md
    ├── nova-act-viewport.md
    ├── product.md
    ├── seo.md
    ├── tech-stack.md
    ├── testing.md
    └── ui-css.md

scripts/
└── kiro-repo-guidance-setup/
    ├── README.md
    ├── 25 TypeScript modules
    └── tests/                   # 43 existing tests, preserved
```

The following no longer exist:

- `.kiro/kiro-repo-guidance-setup/`;
- `.kiro/templates/` (both files belong only to the removed workflow bundle);
- six generic product/ML workflow skills;
- six mirrored workflow-guide files under `.kiro/agents/`;
- `steering/product-workflow.md`, `product-context.md`, `spec.md`, and `spec-guide.md`;
- `plans/prompts/` as a proposed destination (it is not created).

## Change model

### 1. Remove the generic product-workflow bundle

The audit found one coupled bundle rather than independent reusable assets:

- skills: `ai-framing`, `ai-framing-template`, `claude-code-workflow`, `deep-research`, `prd`, `prfaq`;
- matching prose files in `.kiro/agents/`;
- always-loaded `steering/product-workflow.md`;
- `ProjectDashboard_Template.html` and `ScreenIndex_Template.html`.

These files all implement the same research → PRFAQ → PRD → prototype workflow. Keeping any subset leaves dead references or exposes irrelevant skills. The design therefore deletes the bundle atomically.

`spec-task-runner.md` remains the sole agent because it is a valid Kiro agent definition. The nine retained skills are tied to current repo architecture, CSS, database routing, fork boundaries, graph analysis, or verification policy.

### 2. Consolidate steering

#### Canonical global files

- `product.md` remains the only product-context file.
- `tech-stack.md` becomes the only stack definition and starts with `inclusion: always`.
- `coding-standards.md` gains explicit `inclusion: always`.
- `agent-behavior.md` retains `inclusion: always` but replaces stale root paths, npm/ESLint assumptions, and missing-document references with current repo paths and authority sources.

#### Deleted steering

- `product-context.md`: duplicate product context.
- `spec.md`: competing stack description.
- `spec-guide.md`: empty always-loaded stub.
- `product-workflow.md`: controller for the deleted workflow bundle.

#### Preserved scoped steering

Existing file-matched/manual domain files remain unless their references need correction: `ai.md`, `api.md`, `database.md`, `deployment.md`, `graph-layer.md`, both LTM files, `nova-act-viewport.md`, `seo.md`, `testing.md`, and `ui-css.md`.

Every remaining steering file must begin with explicit valid front matter. `INDEX.md` is manual and records the post-state, not the pre-rewrite plan.

### 3. Move executable governance code

Move the complete live directory `.kiro/kiro-repo-guidance-setup/` to `scripts/kiro-repo-guidance-setup/`:

- 25 top-level TypeScript modules;
- 43 existing test files under `tests/`;
- no file omissions or content rewrites during the move.

After relocation, fix the one confirmed broken import in `pipeline.ts`:

```ts
// before
from "../../scripts/kiro-repo-guidance-setup/reviewers"

// after
from "./reviewers"
```

Add a short README describing the module as agent/governance tooling, its primary entry points, and that it is not part of the Next.js runtime. The historical CSV is not a move manifest and must not be used to infer destination files; live source enumeration is authoritative.

### 4. Make hooks consistent with repo policy

#### `domain-fast-check.json`

Keep only the lightweight domain checks already justified on save:

- skip test files;
- Studio/Planner paths → `pnpm run scan:boundaries`;
- FOCSS/component/CSS paths → `pnpm run verify:focss` and `pnpm run lint:ui:strict`;
- all other matching saves → `exit 0`.

Remove both the domain-specific and catch-all typecheck branches. Do not add tests, typechecks, coverage, builds, or browser runners.

#### `block-agent-tests.json`

Live JSON declares `PostTaskExec`; other Kiro docs incorrectly call it `PreToolUse`. This rewrite does **not** change lifecycle semantics without a separate user decision. It corrects the garbled description and updates references in retained skills/powers so they describe the committed `PostTaskExec` hook accurately.

#### `session-start-orient.json`

Add an agent-action `SessionStart` hook that tells the agent to read `AGENTS.md` sections 1–3 and `Agents/01-standard.md` before work. It executes no shell command.

`ltm-postturn-capture.json` remains unchanged.

### 5. Add three repo-local powers

All three powers are routing documents with no bundled MCP server. Each has valid power front matter, a concise capability map, explicit non-capabilities, and repo-first rules.

#### Observability power

**Wired:**

- OpenTelemetry registration: `site/instrumentation.ts` using `@vercel/otel` and `OTEL_SERVICE_NAME`;
- Prometheus metrics: `site/lib/observability/metrics.ts`;
- metrics endpoint: `/api/metrics`, disabled in production unless `OBSERVABILITY_METRICS_ENABLED=1`;
- local Prometheus/Grafana stack and `pnpm run observability:up|down|logs`;
- client-error ingestion: `/api/log-error` → `reportClientError`, which sanitizes and writes structured `console.error` records;
- hard blockers: root `Failures.md`.

**Not wired:** Sentry and Datadog RUM. Datadog references are documentation/local-cache remnants, not a runtime integration.

**Partially available:** `mcp/chrome-devtools/` schemas provide browser performance tools but are not connected in `settings/mcp.json`.

#### Analytics power

Route to the existing consent-gated flow:

```text
siteEvents / conversionContract / kpiEvents
  → emitSiteEvent
  → consent check
  → emitTransport or eventQueue
  → @vercel/analytics
```

The power treats `site/lib/consent.ts` as a hard boundary: accepted emits, undecided queues, rejected drops. New events reuse `conversionContract.ts` taxonomy/privacy filtering. Vercel Analytics and Speed Insights are wired; GA4/Zaraz is treated only as present where live site components/config confirm it, not merely because CSP permits its endpoints.

#### Security power

Route to:

- CSP, nonce, protected-route and security-header policy: `site/proxy.ts`;
- CSRF: `site/lib/security/csrf.ts`;
- strict untrusted-SVG validation: `site/lib/security/svgSanitizer.ts`;
- origin checks and upload limits: `site/lib/security/`;
- rate limiting and AI fail-closed behavior: `site/lib/rateLimit.ts`;
- secret checks and API-route audits exposed by root `pnpm`/ops commands;
- RFC 9116 edge response in the Cloudflare worker.

The power distinguishes the strict SVG validator from the weaker regex-based sanitizer and never recommends the latter as an untrusted-input boundary. GitHub security tool schemas under `mcp/github/` are “schema present, not connected.”

### 6. Update the existing workflow power and MCP status

`oando-workflow/POWER.md` remains the master router but is shortened and corrected:

- remove references to deleted skills and generic PM workflow;
- route traces/metrics/errors to `observability`;
- route event/KPI/consent work to `analytics`;
- route CSP/CSRF/secrets/sanitization work to `security`;
- keep repo-map, graph, fork, FOCSS, migration, and verification routing;
- state the real hook trigger rather than claiming a PreToolUse block.

Create `.kiro/settings/mcp.json` with the Kiro schema and an empty `mcpServers` object. Its comment/status documentation distinguishes:

- local tool-schema snapshots: `chrome-devtools`, `cloudflare-docs`, `github`, `tasks`;
- gitignored local Datadog data cache: not source, not an installed server;
- external capabilities named in routing: uninstalled until present in `mcpServers` or the active power registry.

No power may claim an MCP is installed solely because schemas exist under root `mcp/`.

### 7. Create the canonical index

`steering/INDEX.md` is the inventory for the final state. It includes:

- every remaining steering file and inclusion mode;
- all four hooks and their actual triggers;
- the single agent;
- all nine retained skills;
- all four powers;
- settings files;
- MCP schema/connectivity status;
- removed references and their replacements.

The index does not enumerate every file in `specs/`, because specs are Kiro-managed work products rather than runtime configuration domains.

## Reference and data contracts

### Steering front matter

```yaml
---
inclusion: always | fileMatch | auto | manual
---
```

For `fileMatch`, the existing pattern metadata remains required. The rewrite validates front matter structurally rather than relying on implicit default behavior.

### Power front matter

```yaml
---
name: <directory-name>
displayName: <human-readable name>
description: <repo-specific capability statement>
keywords: [<routing terms>]
author: workspace
---
```

The power directory name and `name` value must match.

### Capability status vocabulary

- **Wired:** live source/config/command exists and is usable with documented prerequisites.
- **Schema present:** root `mcp/<name>/tools/*.json` exists, but no Kiro runtime connection exists.
- **Not installed:** no active registry or `settings/mcp.json` entry.

## Verification design

Verification is a deterministic post-state audit, not a property-based test suite.

### Static checks the executor may perform

1. **Manifest check:** exact expected files exist; deleted bundle paths do not.
2. **Steering check:** every remaining steering file has valid explicit front matter; no duplicate canonical domains remain.
3. **Skill/agent check:** exactly nine retained skills and one agent; no removed workflow names remain under `.kiro/`.
4. **Power check:** four power directories; front-matter names match directories; all referenced repo paths resolve.
5. **Hook check:** all hook JSON parses; actual triggers/actions match the index; `domain-fast-check` contains no typecheck/test/build command.
6. **MCP check:** `settings/mcp.json` parses and contains an empty `mcpServers` object; schema presence is not labeled installed.
7. **Module check:** 25 top-level modules and 43 test files exist at the destination; `pipeline.ts` imports `./reviewers`; no source files remain in `.kiro/kiro-repo-guidance-setup/`.
8. **Reference check:** repo-relative paths in `.kiro/**/*.{md,json}` resolve. External URLs, glob patterns, command names, environment variables, and explicitly labeled uninstalled capabilities are classified rather than falsely treated as missing files.
9. **Forbidden-stale check:** no remaining steering references Next.js 14, npm as package manager, ESLint config, root `/supabase/`, or deleted workflow assets.

### User-invoked validation

After implementation, the user may authorize the narrowest applicable commands:

- `pnpm run typecheck:scripts` for the moved TypeScript module;
- any additional test/gate only if explicitly requested and permitted by the active hook.

The spec does not claim historical `results/ops/coverage-admin.txt` as current validation. That file is stale evidence from another worktree and is outside this configuration rewrite.

## Out of scope audit findings

The full-repo audit found issues that should not be silently folded into this config rewrite:

- `/tools` has no index page although tool breadcrumbs target it;
- `/api/hello` is a likely scaffold route;
- CRM admin pages are localStorage demos;
- the theme editor has read-only/stubbed persistence behavior;
- several orphaned test helpers/fixtures and a personal-path Playwright script exist;
- `results/ops/coverage-admin.txt` is stale UTF-16 evidence;
- public assets are approximately 201 MB, dominated by seating photography;
- a Supabase edge function appears to belong to an older AI/domain path;
- two SVG sanitizers have materially different security strength;
- committed legacy data and historical report inventories need separate ownership decisions.

These findings should become separate plans only with explicit user approval. They do not alter `.kiro` in this spec.

## Completion state

The rewrite is complete when the target manifest, static checks, and reference audit pass; the index matches the real filesystem; no irrelevant workflow bundle remains; the three new powers route only to verified capabilities; and any user-authorized script validation has an observed result. Task ordering and mutation details belong in `tasks.md`, not in this design.

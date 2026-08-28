# Design Document: Kiro Configuration Rewrite

## Purpose and reviewed status

Rebuild `.kiro/` around the repository that actually exists: remove the unrelated product-workflow bundle, consolidate steering, retain only repo-specific skills/agents, add truthful observability/analytics/security routing, and relocate executable governance TypeScript into `scripts/` without breaking its imports or test discovery.

Two independent post-rewrite reviews rated the previous version **NO-GO**. This revision resolves their critical/high findings: nonexistent script tsconfig, impossible textual bans, incomplete relocation mechanics, ineffective hook enforcement, unmounted analytics, incomplete auth routing, command errors, unsupported MCP conclusions, stale retained-skill assumptions, and the conflict between mandatory repo gates and user-owned execution.

## Design principles

1. **Live state wins.** Current source, Git state, `AGENTS.md`, and current package/config files override historical reports.
2. **Small allowed surface.** Changes stay in `.kiro/**`, the relocated module, the blocker script, and two test-discovery configs. Application and test behavior remain untouched.
3. **One source per concern.** Duplicate or irrelevant configuration is deleted rather than aliased.
4. **Routing, not duplication.** Powers point to live implementation and commands; they do not copy code or bundle MCP.
5. **Capability status is evidentiary.** Wired, present-but-unmounted, schema-present, workspace-configured, and runtime-installed are different states.
6. **Move with parity.** Relocation uses collision checks, relative-path-set comparison, hashes/bytes, and an explicit edit exception ledger.
7. **Pre-execution enforcement.** A disabled post-task hook is not a blocker. Test ownership is enforced before shell execution.
8. **No implied verification.** Static inspection may run. Test-like commands and mandatory gates remain pending until the owner runs or explicitly authorizes them and the active hook permits them.

## Allowed change surface

```text
.kiro/**
scripts/kiro-repo-guidance-setup/**             # relocation destination
scripts/general/block-agent-tests.mjs            # enforcement repair
tests/vitest.shared.ts                            # destination discovery only
tests/tsconfig.json                               # destination include only
```

No application source, test assertion/fixture, migration, CI workflow, public asset, or production configuration belongs in this implementation.

## Target state

```text
.kiro/
├── agents/spec-task-runner.md
├── hooks/
│   ├── block-agent-tests.json          # enabled PreToolUse
│   ├── domain-fast-check.json
│   ├── ltm-postturn-capture.json
│   └── session-start-orient.json
├── powers/
│   ├── analytics/POWER.md
│   ├── observability/POWER.md
│   ├── oando-workflow/{POWER.md,steering/routing.md}
│   └── security/POWER.md
├── settings/{lsp.json,mcp.json}
├── skills/                             # exactly 9 retained skills
├── specs/                              # Kiro work products, not active-route audit scope
└── steering/                           # canonical files plus manual INDEX.md

scripts/kiro-repo-guidance-setup/
├── README.md
├── 25 top-level TypeScript modules
└── tests/                              # 43 relocated tests
```

Deleted assets are the six workflow skills, six mirrored agent guides, `product-workflow.md`, both workflow templates, duplicate/empty steering files, and the old governance source root. `plans/prompts/` is not created.

## Change model

### 1. Remove the workflow bundle atomically

The research → PRFAQ → PRD → prototype skills, mirrored agent prose, orchestrator steering, and HTML templates are one generic bundle unrelated to the office-furniture product. Delete it as a unit. Retain `spec-task-runner.md` and the nine repository-specific skills.

Runtime-reference checks examine active steering/skills/powers/agents/hooks/settings. This spec and the INDEX removal ledger necessarily name deleted assets; those historical references are classified, not treated as routing defects.

### 2. Consolidate steering and repair retained guidance

- `product.md` is the only product-context file.
- `tech-stack.md` is the only stack definition and uses current `site/` paths.
- `coding-standards.md` retains the already-completed front matter/path corrections.
- `agent-behavior.md` points to `AGENTS.md`, `Agents/01-standard.md`, `Failures.md`, and existing `plans/README.md`; it does not invent `plans/PLAN.md`.
- Scoped steering keeps its current inclusion behavior unless a path is stale.

The retained `powers-skills-model` skill is part of the audit surface, not presumed correct. Remove its obsolete six-skill count, `plans/ref/<name>/` requirement, empty local power-MCP claim, and inaccurate hook description. Apply the same stale-assumption review to all retained skills.

`tech-stack.md` must not list `scripts/tsconfig.json`: it does not exist. The package script `typecheck:scripts` is therefore known-broken and unavailable for this work; the spec does not silently create a config merely to validate itself.

### 3. Relocate governance code transactionally

#### Preflight

1. Enumerate every source relative path and classify 25 top-level modules plus 43 tests.
2. Refuse to continue if any destination path already exists or would overwrite unrelated work.
3. Record source hashes or byte counts.

#### Copy/move and required edits

Relocate the entire tree preserving relative paths. Then repair only relocation-caused references:

- recalculate each moved test import. For example, a lane test at `scripts/kiro-repo-guidance-setup/tests/lane-d/*.test.ts` reaches a root module via `../../<module>.ts`; retaining `../../../scripts/kiro-repo-guidance-setup/<module>.ts` would resolve incorrectly to `scripts/scripts/...`;
- change `pipeline.ts` to destination-local `./reviewers`;
- scan all moved modules/tests for embedded `.kiro/kiro-repo-guidance-setup` roots and update semantic manifests/contracts/freeze/path ownership data where the location is meant to be current;
- change only the old governance globs in `tests/vitest.shared.ts` and includes in `tests/tsconfig.json` to `../scripts/kiro-repo-guidance-setup/**`.

Maintain an exception ledger naming every content-edited file and why. Files outside that ledger must retain their source hash/bytes. Compare exact source and destination relative-path sets before deleting the source. Delete the source only after parity succeeds.

Add a destination README explaining that the module is governance tooling, not Next.js runtime code, and that current validation routes through the repaired test tsconfig rather than nonexistent `scripts/tsconfig.json`.

### 4. Make hook policy enforceable

#### Domain save hook

Keep the existing test-file skip, Studio/Planner boundary check, and FOCSS/UI checks. All other matching saves return success without broad typecheck, test, coverage, build, browser, or Docker work.

#### Test-command blocker

Replace the disabled `PostTaskExec` configuration with an enabled `PreToolUse` hook using matcher `execute_pwsh|control_pwsh_process`; remove the existing `"enabled": false` state. It calls `node scripts/general/block-agent-tests.mjs`; exit code 2 prevents either shell tool call.

Repair the script by defining the complete blocked matcher set and parsing command fields from hook input. It blocks agent attempts to run tests, gates, coverage, browser-test runners, builds, typechecks, and local-service commands. It does not intercept a human typing directly in a terminal. No retained document may claim that disabled post-execution behavior provides enforcement.

Add the non-command `SessionStart` orientation hook; preserve the LTM hook unchanged.

### 5. Model capability states honestly

Use these terms consistently:

- **Wired:** live importer/render/invocation exists.
- **Present but unmounted:** package/component exists but no live invocation was found.
- **Schema present:** root MCP tool schemas exist.
- **Workspace configured:** `.kiro/settings/mcp.json` has a server entry.
- **Runtime installed:** a direct active-registry check confirms it.
- **Runtime availability not verified:** no direct registry check was performed.

Create workspace MCP settings with an empty `mcpServers` object. This proves “not configured in this workspace,” not “not installed anywhere.” Root schema folders and the Datadog cache convention do not prove a connection. Powers ship no MCP manifests or servers.

### 6. Add repo-local powers

#### Observability

Route OpenTelemetry to `site/instrumentation.ts` and `@vercel/otel`; metrics to `site/lib/observability/metrics.ts`, `/api/metrics`, and `config/observability/`; client errors to `/api/log-error` and `reportClientError.ts`. Document the production metrics flag, structured-console sink, user-owned Docker commands, and that Sentry/Datadog RUM are not wired.

#### Analytics

Route event work through consent, event queue, conversion taxonomy, KPI integrity, and transport modules. Preserve accepted/undecided/rejected semantics.

`SiteAnalytics.tsx` contains Vercel Analytics and Speed Insights components, but repository search found no live importer/render. Therefore packages and component are **present but unmounted**, and the power must not call either transport operationally wired. Mounting the component would be an application change outside this spec. CSP allowance alone also does not prove GA4/Zaraz invocation.

#### Security

Describe the layered boundary accurately:

1. `site/proxy.ts`: cookie existence/precheck, CSP, nonce, route/header policy;
2. `site/lib/auth/session.ts`: actual server user/session resolution and page/server authorization helpers;
3. `site/features/shared/api/withAuth.ts`: API rate limit, Supabase user resolution, role enforcement, optional CSRF, and standardized errors.

Route remaining controls to strict SVG validation, CSRF, origin/upload helpers, and `site/lib/rateLimit.ts`. Use exact commands: `pnpm run scan:secrets`, `pnpm run ops -- lint:secrets`, `pnpm run test:audit:api-routes`, and `pnpm run test:audit:eslint-disable`. The latter test-like checks are documented for the owner, not run by the agent.

### 7. Update master routing and canonical index

Shorten `oando-workflow` to repo-specific routing and the three new powers. Correct hook and MCP vocabulary everywhere.

`steering/INDEX.md` is a manual post-state inventory containing steering modes, four hooks with enabled/trigger/action status, one agent, nine skills, four powers, and settings. Its removal ledger intentionally contains old names and paths. Static scans must classify that section rather than demand zero textual matches across all `.kiro` work products.

## Verification design

### Permitted non-test static evidence

1. **Changed-path audit:** `git diff --name-only` contains only the allowlisted scope.
2. **Manifest audit:** exact retained/deleted assets and destination counts.
3. **Relocation audit:** collision record, exact relative-path-set equality, hash/byte parity outside the exception ledger, and source deletion only after parity.
4. **Reference audit:** active runtime/harness references resolve; specs, Kiro metadata, INDEX history, URLs, globs, commands, env vars, and explicitly unavailable capabilities are classified separately.
5. **Configuration audit:** JSON parses; front matter is valid; power directory names match; no power bundles MCP.
6. **Truth audit:** no stale stack, analytics, auth, hook, command, MCP, or `plans/PLAN.md` claims.
7. **Coverage audit:** every requirement maps to an implementation task and final evidence item.
8. **Diff quality:** inspect the final diff and run `git diff --check` on the three spec documents and later on implementation paths. This is formatting inspection, not behavioral validation.

### User-owned mandatory validation

`pnpm run typecheck:scripts` is not valid because `scripts/tsconfig.json` is absent. After relocation and only with owner authorization plus hook permission, `pnpm run typecheck:tests` is the candidate typecheck because its repaired include covers the module and tests.

`AGENTS.md` still requires `pnpm run check:layout` and then `pnpm run gate:fast` or `pnpm run gate` before the repository can be declared done. This spec does not waive that floor. If the owner has not authorized and observed those commands, the final status is:

> Configuration changes complete; mandatory repository validation pending owner execution/authorization.

No historical report or successful static audit may be presented as a gate pass.

## Out of scope findings

Application route gaps, demo/localStorage behavior, stubbed persistence, orphaned tests, large assets, legacy data, old edge functions, and sanitizer consolidation remain separate work. This rewrite does not modify them.

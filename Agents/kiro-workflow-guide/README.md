# OandO Agent Workflow Guide

A practical guide to working in this repository with Kiro, workspace skills, installed powers, command-line tooling, the import graph, and the verification gates.

- **Static walkthrough:** [`index.html`](./index.html) — open directly in a browser.
- **Repository root:** [`AGENTS.md`](../../AGENTS.md)
- **Canonical starting point:** [`START.md`](../../START.md)
- **Last inventory:** 2026-08-26. Re-run `pnpm run ops:list` when the command registry may have changed. The LTM section reflects the project-local memory setup and its enabled capture hook.

## 1. The short version

Use this loop for almost every task:

```text
1. Read the user request and identify the exact success criteria.
2. Orient from AGENTS.md, START.md, the relevant Agents handbook, and live code.
3. Route the work to the smallest matching passive skill and/or installed power.
4. Inspect the nearest existing implementation before proposing a change.
5. Make the smallest sound edit; preserve unrelated work.
6. Run graph impact when shared code or dependency reach is involved.
7. Run the narrowest useful validation, then the repository gate required by the task.
8. Report what changed, what was verified, and any honest blocker.
```

The authority order is:

```text
user instruction > live code + fresh commands > AGENTS.md > Agents/ > docs/
```

A command that exits with code 0 is not automatically proof of the user’s requested outcome. Verify the actual criterion.

## 2. Non-negotiable repository rules

These rules are the process floor, not optional style preferences:

- Work from the repository root. Do not create worktrees.
- Use `pnpm` for the JavaScript workspace, from the root only. Do not run package-manager commands inside `site/` or `tech-docs-generator/`.
- Make the smallest sound change. Preserve unrelated user work.
- Do not hand-write `any` in TypeScript. Regenerate types or fix the contract instead.
- Store secrets only in `.env.local` or `site/.env.local` when the loader requires it. Never put keys in source, Markdown, HTML, commands committed to history, or screenshots.
- For UI claims, use `http://localhost:3000`; never substitute `127.0.0.1`.
- Studio (`/oostudio`) and Planner (`/ooplanner`) are forked surfaces. They must not import one another.
- Production filesystem writes are not a fallback. Use mode-aware persistence wrappers; production disk is read-only.
- Database changes require a rollback section, grants and policies, a dry run first, and regenerated types when the schema changes.
- `pnpm run test` has two Vitest lanes. Read both summaries.
- `results/` is for generated evidence. Do not put hand-written reports or audit archives there.
- Record hard blockers only in [`../Failures.md`](../../Failures.md).
- Never push directly to `main` or `master`, and do not create commits unless the user explicitly asks.

## 3. Where things live

| Location | Purpose |
|---|---|
| `site/` | Next.js product application |
| `site/app/(site)` | Marketing surface |
| `site/app/admin` | Admin surface |
| `site/app/oostudio` | Furniture Studio route |
| `site/app/ooplanner` | Floor Planner route |
| `site/{components,lib,hooks,store,server}/{Studio,Planner}` | Forked Studio and Planner trees |
| `site/focss/` | FOCSS/Tailwind CSS zones |
| `site/platform/shared/data/furniture/` | Development furniture furniture data; runtime writes must still use mode-aware wrappers |
| `site/inventory/descriptors/` | Development descriptor data |
| `tests/` | Vitest and Playwright test lanes |
| `scripts/` | Repository tooling, audits, graph analysis, operations runner |
| `tech-docs-generator/` | Inventory/documentation SPA and second test lane |
| `Agents/` | Handbooks and agent-readable notes |
| `plans/` | Plans, issues, context, and ADRs |
| `results/` | Generated evidence only |
| `docs/architecture/` | Layout, stack, routes, product map, CSS architecture |
| `docs/database/` | Schema, Drizzle, database operations |
| `.kiro/skills/` | Passive workspace skills |
| `.kiro/powers/` | Repo-local power bundles |
| `mcp/` | MCP tool schemas |

The two database projects are deliberately separate:

| Database | Project ref | Owns |
|---|---|---|
| Admin | `rxzpznmxbaoxpikowmfc` | Staff/customer data, plans, furniture, descriptors, teams, price books, audit, queries |
| Products | `erpweaiypimorcunaimz` | Marketing catalog, configurator, flags, themes |

Staff/customer data, furniture, and descriptors belong to **Admin**. Marketing catalog data belongs to **Products**.

## 4. Read the right context without wasting time

Start with the smallest relevant set:

1. `AGENTS.md` — always loaded process floor.
2. `START.md` — onboarding and repository read order.
3. `Agents/01-standard.md` — always read before non-trivial work.
4. The relevant handbook:
   - `Agents/02-testing.md` for tests.
   - `Agents/03-browser.md` for UI/browser claims.
   - `Agents/04-failures.md` when blocked.
   - `Agents/05-documentation.md` for docs.
   - `Agents/06-architecture.md` for placement and system boundaries.
   - `Agents/07-css.md` for CSS.
5. The relevant `docs/architecture/*` or `docs/database/*` file.
6. Live code and fresh commands when a document may be stale.

Use the `repo-map` skill before scanning large parts of the tree. Use `scripts/graph-impact.mjs` instead of manually reading every importer.

## 5. Workspace skills

This repository has four distinct guidance layers. **Skills** are passive Markdown instructions that shape a procedure. **Powers** are installed active capability bundles that may provide MCP tools. **Steering** is persistent or on-demand project knowledge under `.kiro/steering/`, selected by frontmatter such as `inclusion: auto` or `inclusion: fileMatch`. **Project memory** is durable, project-local state operated through the installed `ltm-power`; it is not a seventh workspace skill. A power may draw on skills and steering, but those layers do not become MCP tools by themselves.

### Fast chooser

| If you are trying to… | Start with… | Then… |
|---|---|---|
| Find a feature or understand an unfamiliar area | `repo-map` | Read the nearest live implementation. |
| Change shared code or choose affected tests | `graph-impact` | Run the suggested focused tests. |
| Edit Planner or Studio | `fork-boundaries` | Run `pnpm run scan:boundaries` before commit. |
| Edit product UI or CSS | `focss-css` | Run the CSS checks and browser proof when needed. |
| Change SQL, schema, RLS, or database ownership | `db-migrations` | Dry-run the correct Admin or Products migration. |
| Decide whether the work is actually complete | `verify-and-gate` | Run the smallest useful proof, then the right gate. |

**Rule of thumb:** use the smallest matching skill. Use more than one when the task crosses boundaries—for example, Planner UI work uses `fork-boundaries` and `focss-css`; shared Planner code also uses `graph-impact`.


### 5.1 `repo-map`

**Use when:** starting work, exploring the repository, locating a feature, or asking where something lives.

**Procedure:**

1. Read `AGENTS.md`, `START.md`, `docs/architecture/layout.md`, `docs/architecture/stack.md`, `docs/architecture/routes.md`, and `docs/architecture/product-map.md` as needed.
2. Prefer canonical docs and live code over a blind recursive scan.
3. Use graph impact for dependency questions.
4. Run `pnpm run docs:sync` only when inventories are stale and regeneration is actually needed.

**Do not:** claim a structure from memory or from one directory listing.

### 5.2 `graph-impact`

**Use when:** changing shared code, estimating blast radius, choosing tests, or checking dependency cycles.

```powershell
node scripts/graph-impact.mjs --stats
node scripts/graph-impact.mjs --circles
node scripts/graph-impact.mjs --file=site/lib/ai/providerChain.ts
node scripts/graph-impact.mjs --file=site/lib/ai/providerChain.ts --depth=2
```

The file query returns transitive dependents, domains, covering tests, and a suggested focused test command. High fan-in files are fragile; high fan-out files are complex. The normal loop is:

```text
edit -> graph impact -> run suggested focused test -> fix (up to 3 iterations) -> gate:fast
```

Current baseline observed during this guide’s inventory: **1,736 files and 3,367 import edges**. The graph is a snapshot, not a permanent fact; run it again after meaningful changes.

### 5.3 `verify-and-gate`

**Use when:** deciding what to test, claiming completion, or preparing to ship.

Development sequence:

```powershell
pnpm exec vitest run --config tests/vitest.config.ts <focused-path>
pnpm run gate:fast
```

Release sequence:

```powershell
pnpm run gate
```

Remember:

- `pnpm run test` runs the default and tech-docs Vitest lanes.
- A green unit lane is not browser proof.
- Production filesystem behavior is not proven by disk-only mocks.
- A build interrupted by the environment is not a successful build.
- If a blocker is real and cannot be fixed in the task, record it in `Failures.md`.

### 5.4 `fork-boundaries`

**Use when:** editing Studio or Planner components, libraries, hooks, stores, servers, or before committing either fork.

Rules:

- Planner files must not import `@studio/*`.
- Studio files must not import `@planner/*`.
- Do not share geometry helpers between the forks: Studio uses 0.2 px/mm; Planner uses 0.05 px/mm.
- CSS zones are separate: `site/focss/studio/` and `site/focss/planner/`.
- Studio APIs use `/api/Studio/*`; Planner APIs use `/api/Planner/*`.

Before committing a fork change:

```powershell
pnpm run scan:boundaries
```

### 5.5 `focss-css`

**Use when:** editing `site/focss`, product TSX styles, PostCSS, or Tailwind configuration.

Rules:

- FOCSS is a semantic-token layer on top of Tailwind v4, not a replacement.
- Write against semantic tokens and the correct zone, not arbitrary raw utilities.
- Keep the four zones separate: site, admin, planner, studio.
- Planner has its own Tailwind import in `entry.css`; it does not import `scan.css`.
- Compose classes with `tailwind-merge` and `clsx`.
- Use the app’s Phosphor `PhIcon`/`phIconMap`; no inline SVG or Lucide.

Required CSS checks:

```powershell
pnpm run verify:focss
pnpm run lint:ui:strict
pnpm run check:style-tokens
```

### 5.6 `db-migrations`

**Use when:** writing SQL, changing schema, deciding database ownership, or working with Supabase tables/RLS.

Every migration must include:

- A `-- rollback` section.
- Grants and policies as well as DDL.
- The correct Admin or Products target.

Apply safely from the repository root:

```powershell
pnpm run db:apply -- --dry
pnpm run db:apply

pnpm run db:apply:admin -- --dry
pnpm run db:apply:admin

pnpm run db:types
pnpm run db:types:admin
```

Never use raw disk helpers for runtime writes. The selector is mode-aware: disk only for non-production `DEV_AUTH_BYPASS=1`; otherwise Supabase. For live schema, RLS, or policy operations, activate `supabase-hosted` only after confirming the target project and receiving explicit confirmation for destructive SQL.

### 5.7 Specs and Quick Spec

Kiro’s **Spec** workflow is built into the IDE; it is not a repository skill or a custom agent that needs registration. Start it from the workflow picker or the Specs panel. The generated, versioned artifacts normally live under `.kiro/specs/<name>/`; this repository's relocated planning artifacts live under `plans/ref/<name>/`:

```text
requirements.md → design.md → tasks.md
```

Use **Requirements-First** when you want the gated feature-spec flow: capture behavior, review requirements, then produce design and tasks. Use **Quick Spec** when the feature is understood well enough to generate all three documents in one pass without phase-by-phase approval.

The local `spec-task-runner` agent executes already-approved tasks; it does not replace the built-in Spec workflow. Likewise, `feature-requirements-first-workflow` is not a documented Kiro agent, preset, or skill name.

Official references:

- [Specs overview](https://kiro.dev/docs/specs/)
- [Quick Spec](https://kiro.dev/docs/specs/quick-spec/)
- [Requirements-First](https://kiro.dev/docs/specs/feature-specs/requirements-first/)

## 6. Installed powers

Powers are active capability bundles. The normal sequence is:

```text
match request -> activate smallest relevant power -> read its POWER.md -> read the relevant steering guide -> use its MCP/CLI tool -> verify the result
```

In Kiro, use `kiro_powers` like this:

```text
kiro_powers(action="list")
kiro_powers(action="activate", powerName="nova-act")
kiro_powers(action="readSteering", powerName="nova-act", steeringFile="browser_cli.md")
kiro_powers(action="use", powerName="<power>", serverName="<server>", toolName="<tool>", arguments={...})
```

Do not call `use` before `activate`. Do not activate a power when repository docs, local scripts, or a passive skill answer the question. MCP is the live tool layer; the power is the routing/documentation layer.

### Routing policy — plain English

You do not need to memorize the hook. Start with the outcome you need:

| Your goal | Start with | What happens next |
|---|---|---|
| Locate or understand code | `repo-map` | Read canonical docs, then the live implementation. |
| Change shared code | `graph-impact` | See dependents and run the suggested focused tests. |
| Change Planner or Studio | `fork-boundaries` | Keep the forks separate and scan before commit. |
| Change UI or CSS | `focss-css` | Use the correct token zone and run UI checks. |
| Change schema or RLS | `db-migrations` | Choose Admin or Products, dry-run, then regenerate types. |
| Prove or ship a change | `verify-and-gate` | Run focused proof, then `gate:fast` or `gate`. |
| Need an external capability | Choose the matching power below | Activate it only after local code and skills cannot answer. |

For a normal code edit, **no power is the right choice**. The hook is automation for Kiro; it is not a checklist you need to recite.

<details>
<summary>Advanced: view the exact UserPromptSubmit instruction</summary>

The live copy is [`power-request-router.json`](../../.kiro/hooks/power-request-router.json):

```text
Match each request to the smallest relevant tool layer. Use installed powers only when needed: design-system-power-builder for creating a complete design system; nova-act for exploratory human-like browser QA; postman for Postman collections and API testing; context7 for current official library or framework documentation; exa for broad web research; datadog for production observability; ltm-power for project memory and resume requests; cubic-code-review for code review; kane-cli for repeatable browser tests, screenshots, and deployment smoke checks; cloudinary for image or video asset operations; supabase-hosted for Supabase, Postgres, auth, storage, or RLS work; and oando-workflow for this repository's end-to-end orientation, fork boundaries, migrations, gates, and power routing when the local workflow itself is the task. Use workspace skills when applicable: repo-map when starting work, locating features, or mapping the repository; focss-css for site/focss CSS, product UI TSX, or PostCSS/Tailwind configuration; fork-boundaries for any Planner or Studio fork-tree edit and before committing either fork; db-migrations for SQL migrations, schema changes, database selection, or migration safety; graph-impact for shared-code blast-radius analysis, scoped test selection, or circular-dependency checks; and verify-and-gate for test sequencing, gates, shipping preparation, and before claiming any repository change is complete. For architecture impact analysis use the graph-impact skill (scripts/graph-impact.mjs), not an external power. Activate only what is needed; if no power or skill matches, proceed without activation. Relevant file-matched or always-included workspace steering should be followed without duplicating it here. For Postman, inspect .postman.json first, use Postman MCP only, avoid duplicate resources, and validate Collection Format v2.1.0.
```

</details>

### 6.1 `oando-workflow` — repository routing

This repo-local power is the default workflow map. It routes structure questions to `repo-map`, impact questions to `graph-impact`, Studio/Planner changes to `fork-boundaries`, completion to `verify-and-gate`, CSS to `focss-css`, and SQL to `db-migrations`. It routes outward only when the repository cannot answer.

It does not ship a new MCP server. Its key rule is **smallest relevant capability, or none**.

### 6.2 `nova-act` — browser QA and natural-language automation

**Use for:** human-like browser exploration, UI smoke checks, data extraction, bug reproduction, visual evidence, and repeatable Python automation.

Choose authentication first:

- API key for development/testing.
- AWS IAM + Workflow for production, CloudTrail, S3 export, or audited execution.

Before a browser command, choose headed (visible) or headless mode. The browser CLI pattern is:

```powershell
py -m pip install "nova-act[cli]"
$env:NOVA_ACT_API_KEY = "<key>"
act browser goto https://example.com --session-id demo --headed
act browser execute "1. Open the pricing page 2. Extract the plan names" --session-id demo --headed
act browser extract "Return the page title" --session-id demo
```

Use `execute` for a coherent multi-step mission, `extract` for data, `ask` for a read-only question, and `snapshot` to inspect accessibility state. Never kill Chrome/Chromium processes externally. For this repository’s local UI, use `http://localhost:3000`.

Nova Act also supports Python via `NovaAct`, persistent user data directories, secure keyboard entry for passwords, session logs, and Workflow/IAM constructs. Never put passwords in natural-language prompts.

### 6.3 `kane-cli` — browser QA, scenarios, and replayable tests

**Use for:** real-browser navigation, form flows, screenshots, deployment smoke checks, authoring structured test cases, Gherkin-like scenarios, and replay-cached `testmd` tests. The browser is the default target; native mobile support is platform-specific.

Start by activating the power and reading its workflow. Use it when a real browser scenario or committable test artifact is the goal, especially when you need generated scenarios rather than Nova Act’s open-ended mission execution. Validate local UI only on `http://localhost:3000`.

### 6.4 `postman` — API collections and requests

**Use for:** Postman workspaces, collections, environments, REST calls, and API test execution.

Repository-specific safe order:

1. Inspect `.postman.json` first.
2. Check for existing collections/environments before creating anything.
3. Use Postman MCP only for Postman operations.
4. Preserve repository rules and avoid duplicate resources.
5. Validate collection files as Postman Collection Format **v2.1.0** when writing or exporting them.

Do not use Postman to answer a repository question that local code or tests can answer.

### 6.5 `context7` — current library documentation

**Use for:** current, version-correct framework, SDK, library, and API documentation when the repository cannot answer. Prefer official documentation and the exact installed version. Use it to resolve breaking API changes rather than guessing from training memory.

### 6.6 `exa` — live web research

**Use for:** current external research, web search, crawling, code examples, company or technology research, and extracting clean source content. Do not send project code, secrets, or user data to external services unless the user explicitly requests it. Cite external sources when reporting research.

### 6.7 `datadog` — production observability

**Use for:** logs, metrics, traces, APM, RUM, incidents, and monitors during production debugging. Start with the narrowest query and time range. Do not expose secrets or customer data in reports. Use repository logs and local diagnostics first when they are sufficient.

### 6.8 `supabase-hosted` — live Supabase operations

**Use for:** Postgres schema/data inspection, authentication, storage, RLS, and realtime operations against hosted Supabase.

Before use:

- Confirm Admin vs Products project.
- Confirm the operation is read-only or get explicit confirmation for destructive work.
- Keep migrations in the repository; do not make an undocumented live-only change.
- Preserve grants, policies, and least privilege.

### 6.9 `cloudinary` — media management

**Use for:** uploading, transforming, optimizing, searching, and analyzing images or videos in Cloudinary. Confirm the target asset/folder and transformation intent before mutating media. Prefer repository-local asset conventions when the task is only about local files.

### 6.10 `cubic-code-review` — external code review and security analysis

**Use for:** AI code review, security scans, repository wikis, PR review, and team coding patterns when an external review is explicitly useful. Do not send private code or secrets without user authorization. Local diff inspection and repository gates remain the primary proof.

### 6.11 `design-system-power-builder` — design-system scaffolding

**Use for:** generating a design-system skill project with component specifications, accessibility and UI heuristics, governance, build validation, copy rules, technical references, and Kiro Power output. Activate it for a real design-system scaffolding request, not for a small product CSS edit.

### 6.12 `ltm-power` — installed power for project-local memory

**Use for:** scaffolding or maintaining long-term project memory, recalling prior work, validating/repairing memory, or updating durable session context. Store only useful project state, not secrets. A memory summary is not a substitute for fresh code and command evidence.

The installed `ltm-power` is the active capability; this repository’s implementation lives under `ltm/`. It is not a seventh workspace skill or a repo-local `.kiro/powers/` bundle. The enabled [Stop hook](../../.kiro/hooks/ltm-postturn-capture.json) runs `python ltm/bin/ltm.py capture-turn` after agent turns and records redacted file-change events.

The portable project files are `ltm/bin/ltm.py`, `ltm/config.json`, `ltm/manifest.json`, and `ltm/README.md`. Do not commit `ltm/store/`, `ltm/runtime/`, `ltm/reports/`, or `ltm/snapshots/`; those ledgers and generated runtime artifacts are local-private and ignored. Read the LTM steering files before recall or file-format work: [`ltm-operations.md`](../../.kiro/steering/ltm-operations.md) and [`ltm-memory-format.md`](../../.kiro/steering/ltm-memory-format.md).

## 7. CLI toolbox

### 7.1 Core package commands

Run from the repository root:

```powershell
pnpm install
pnpm dev
pnpm run build
pnpm run build:site
pnpm run build:tech-docs
pnpm run typecheck
pnpm run typecheck:tests
pnpm run typecheck:scripts
pnpm run lint
pnpm run lint:ui:strict
pnpm run gate:fast
pnpm run gate
pnpm run test
pnpm run test:unit
pnpm run test:tech-docs
pnpm run test:a11y
pnpm run test:planner-catalog
pnpm run check:layout
pnpm run check:docs-all
pnpm run scan:boundaries
pnpm run scan:secrets
pnpm run ops:list
```

`pnpm run dev` starts the local Next app. UI claims and browser QA target `http://localhost:3000`.

### 7.2 Tests and gates

Focused test first:

```powershell
pnpm exec vitest run --config tests/vitest.config.ts tests/unit/<nearest-test>
pnpm exec vitest run --config tests/vitest.tech-docs.config.ts
```

Fast development bar:

```powershell
pnpm run gate:fast
```

Full release bar:

```powershell
pnpm run gate
```

The full gate includes layout, FOCSS verification, audits, lint, UI lint, type checks, both Vitest lanes, builds, accessibility, planner/catalog tests, coverage, docs, style tokens, and governance.

### 7.3 Database and operations commands

```powershell
pnpm run db:apply -- --dry
pnpm run db:apply:admin -- --dry
pnpm run db:types
pnpm run db:types:admin
pnpm run db:test
pnpm run seed:furniture
pnpm run ops:list
pnpm run ops -- <registered-operation>
```

Use `pnpm run ops:list` as the live registry. The command registry had 142 entries when this guide was written. Destructive operations need explicit confirmation and the appropriate dry-run or backup path.

### 7.4 Documentation and inventories

```powershell
pnpm run docs:check
pnpm run docs:check:root-links
pnpm run docs:sync
pnpm run check:agents-md
pnpm run check:agents-folder
pnpm run check:active-docs
pnpm run check:plans-purity
pnpm run check:docs-purity
pnpm run tech-docs:gate
```

Do not hand-edit generated inventory output when a generator owns it. Read the generator README before changing the tech-docs pipeline.

### 7.5 Deployment and workers

```powershell
pnpm run vercel:preview
pnpm run vercel:prod
pnpm run worker:dev
pnpm run worker:deploy
pnpm run worker:tail
pnpm run r2:backup
```

Deployment is a high-impact action. Verify target, environment, and current diff before running it.

### 7.6 Current operations registry snapshot

Run `pnpm run ops:list` for the authoritative live list. The following names were observed during this guide’s inventory and are grouped for discovery:

<details>
<summary>Assets, catalog, storage, and backup operations</summary>

```text
alt:sync:apply
alt:sync:dry
assets:audit:thirdparty
assets:cdn:audit
assets:cdn:catalog
assets:cdn:fix
assets:cdn:replacements
assets:cdn:sync
assets:cdn:upload
assets:cdn:upload:incremental
assets:r2:count
assets:r2:create-bucket
assets:r2:delete-bucket
audit:products:quality
audit:slug-id
audit:supabase:admin
audit:supabase:catalog
audit:svg-catalog
backup:github-secrets:sync
backup:r2
backup:supabase:r2
catalog:blocks:qa
catalog:organize:apply
catalog:organize:dry
catalog:organize:sync
catalog:qa:sheet
catalog:snapshot:r2
repo:backup:r2
supabase:assets:arrange
supabase:backfill:canonical
supabase:backfill:images
supabase:backup
sync:descriptor-svgs
```
</details>

<details>
<summary>Checks, lint, environment, and governance</summary>

```text
check-sharp
check:active-docs
check:agents-folder
check:agents-md
check:composer-styles
check:docs-all
check:docs-purity
check:failures
check:governance
check:i18n:parity
check:launch
check:layout
check:plans-purity
check:product-icons
check:site-ui
check:site-ui:copy
check:site-ui:dialect
check:site-ui:inline-style
check:site-ui:shell
check:style-tokens
check:ui-assets
check:worker-origin
codemod:homepage-dialect
env:sync
launch:env
launch:smoke
lint:secrets
lint:type-aware
lint:ui
scan:hardcoding
scan:secrets
scan:tokens
```
</details>

<details>
<summary>Database, Drizzle, and seeds</summary>

```text
db:advisors
db:advisors:admin
db:advisors:performance
db:advisors:security
db:apply
db:apply:admin
db:backup-dropped
db:backup:pgdump
db:ensure-plans
db:sync-drizzle
db:test
db:types
db:types:admin
seed
seed:block-descriptors
seed:configurator
seed:furniture
seed:managed
verify:db-svg
```
</details>

<details>
<summary>Docs and tech-docs operations</summary>

```text
docs:check
docs:check:coverage
docs:check:root-links
docs:sync
docs:sync:all
docs:sync:coverage
docs:sync:routes
docs:sync:sitemap-csv
tech-docs:build
tech-docs:check
tech-docs:generate
tech-docs:test
tech-docs:typecheck
```
</details>

<details>
<summary>Planning, site UI, and development</summary>

```text
dev:turbo
gate:open3d
gate:planner
gate:site-ui
i18n:sync:deferred-locales
i18n:sync:hi-wave1
i18n:sync:marketing
i18n:translate:deferred-locales
p0:svg
planner:lift
planner:lift-verify
site-ui:matrix
```
</details>

<details>
<summary>Test, browser, coverage, and authentication operations</summary>

```text
test:admin:production-auth
test:apps
test:audit
test:audit:api-routes
test:audit:eslint-disable
test:audit:fake-test
test:audit:fast
test:audit:gate-skips
test:audit:hollow
test:auth:env
test:auth:seed-users
test:browsers:install
test:coverage:admin
test:coverage:inventory
test:design-kit
test:e2e:admin-retire-restore
test:e2e:assistant
test:e2e:nav
test:e2e:open3d-world
test:e2e:visual
test:e2e:world-standard-w1w2
test:layout:check
test:planner
test:planner-catalog:watch
test:planner:watch
test:site-ui
test:tech-docs
test:ui
test:unit
typecheck:scripts
```
</details>

### 7.3 LTM memory and resume

Use the installed `ltm-power` only when the request concerns recall, durable project context, checkpoints, validation, repair, or LTM maintenance. Run the CLI from the repository root and read `python_cmd` from `ltm/config.json` if the interpreter differs:

```powershell
python ltm/bin/ltm.py files --limit 10
python ltm/bin/ltm.py sessions --limit 5
python ltm/bin/ltm.py search "term"
python ltm/bin/ltm.py checkpoints --days 3
python ltm/bin/ltm.py health
python ltm/bin/ltm.py validate
python ltm/bin/ltm.py repair
python ltm/bin/ltm.py regenerate
python ltm/bin/ltm.py checkpoint --summary "Milestone summary"
```

Use `purge-last`, `purge-all`, or `teardown` only with their explicit confirmation flags. LTM records must follow the JSONL formats in [`ltm-memory-format.md`](../../.kiro/steering/ltm-memory-format.md), and secret-like values or sensitive paths must be redacted or excluded.

## 8. A safe task walkthrough

### Step 1 — Convert the request into acceptance criteria

Write down the exact output, path, behavior, values, and validation the user asked for. If the request is ambiguous but a safe default exists, choose it and state it. Ask only when the decision changes risk or scope.

### Step 2 — Route the task

| Task signal | First capability |
|---|---|
| Where code lives / repository shape | `repo-map` |
| Shared code / affected tests / cycles | `graph-impact` |
| Planner or Studio | `fork-boundaries` |
| CSS or Tailwind | `focss-css` |
| SQL/schema/persistence | `db-migrations` |
| Done/ship/test sequence | `verify-and-gate` |
| Browser proof | `nova-act` or `kane-cli` |
| Current SDK/framework docs | `context7` |
| External web research | `exa` |
| Hosted database/RLS/storage | `supabase-hosted` |
| Postman resources | `postman` |
| Production telemetry | `datadog` |
| Media library | `cloudinary` |
| Memory layer | `ltm-power` |
| Design-system scaffold | `design-system-power-builder` |
| Code review/security review | `cubic-code-review` |

### Step 3 — Inspect before editing

Read the target file and its nearest neighbor. Search symbols and imports. Do not propose edits to code you have not seen. Check whether an existing helper or command already solves the need.

### Step 4 — Make one logical edit per file

Prefer a targeted replacement. For a new file, create it once. Do not create duplicate helpers or competing sources of truth. Keep secrets and generated output out of source.

### Step 5 — Analyze impact

For shared TypeScript code:

```powershell
node scripts/graph-impact.mjs --file=<changed-file>
```

Use the returned suggested test command. For Studio/Planner changes, also run `pnpm run scan:boundaries`. For CSS, run the CSS-specific checks. For a migration, do the dry run and governance checks.

### Step 6 — Validate at the smallest useful scope

Use a focused unit test, type check, lint, static parser, or browser smoke test appropriate to the actual change. Do not run a giant gate when a syntax check answers the question; do not stop at a syntax check when a route behavior changed.

### Step 7 — Run the required gate

- Development change: `pnpm run gate:fast` after focused checks.
- Release/ship: `pnpm run gate`.
- Documentation-only change: at least `pnpm run check:layout` and the applicable docs checks.
- CSS: `verify:focss`, `lint:ui:strict`, `check:style-tokens`.
- Database: dry apply, types, governance, and targeted tests.

### Step 8 — Report evidence honestly

Report:

```text
Changed: exact files and behavior.
Verified: exact commands and meaningful results.
Not run: checks intentionally skipped and why.
Blocked: only real blockers, with the next useful action.
```

## 9. Practical recipes

### UI change

1. Read `Agents/03-browser.md`, `Agents/06-architecture.md`, and `Agents/07-css.md` if styles are involved.
2. Activate `focss-css` and/or `fork-boundaries` when matched.
3. Edit the correct surface and zone.
4. Run `pnpm run verify:focss`, `pnpm run lint:ui:strict`, and `pnpm run check:style-tokens` as applicable.
5. Start the app and verify through `http://localhost:3000` with Nova Act or Kane when browser proof is required.
6. Run `pnpm run gate:fast`.

### Planner or Studio change

1. Keep the fork isolated.
2. Confirm the route and API casing.
3. Do not copy geometry or state helpers across forks.
4. Run `pnpm run scan:boundaries`.
5. Run focused tests, then the fast gate.

### Schema or persistence change

1. Decide Admin vs Products before writing SQL.
2. Read the migration instructions and schema docs.
3. Add DDL, grants, policies, and `-- rollback`.
4. Run the correct dry apply first.
5. Apply only after review/confirmation.
6. Regenerate the correct database types.
7. Test the Supabase production-mode path, not only disk mocks.

### Browser QA

1. Decide whether the goal is open-ended automation (`nova-act`) or a structured/replayable scenario (`kane-cli`).
2. Ask/choose headed or headless mode before launching.
3. Use `localhost:3000` for the local app.
4. Use one coherent mission instead of chaining fragile low-level actions.
5. Save or inspect screenshots, snapshots, logs, and traces when evidence matters.
6. Never enter passwords in a natural-language browser prompt; use secure keyboard APIs or human takeover.

### Current external documentation

1. Search local package/docs first.
2. Activate `context7` for versioned API docs.
3. Use `exa` only for external research beyond the repository.
4. Cite sources and do not upload project secrets or private code.

## 10. Anti-patterns and their replacements

| Avoid | Do instead |
|---|---|
| Blind recursive scanning | `repo-map` + canonical docs + targeted search |
| External power for a local fact | Read live code/docs or run the local script |
| `npm`, `yarn`, or `npx` in this repo | `pnpm` from the root |
| `127.0.0.1` for UI proof | `http://localhost:3000` |
| Studio imports inside Planner or the reverse | Keep fork-local modules; run boundary scan |
| Raw production filesystem writes | Mode-aware persistence wrappers |
| Migration with no rollback | Add rollback, grants, policies, dry-run first |
| One green Vitest summary | Read both test lanes |
| A giant test suite for every edit | Graph-suggested focused test, then the right gate |
| Hardcoded API keys/passwords | Environment variables or secure input |
| Killing Chrome to recover browser QA | Inspect sessions, use a new session, or use supported CLI recovery |
| Handwritten Markdown under `results/` | Put agent notes under `Agents/`; generated evidence under `results/` |
| Claiming a command proves behavior | Verify the user’s actual success criterion |

## 11. Completion checklist

Before saying a task is done:

- [ ] The user’s exact success criteria were re-read.
- [ ] The change is in the correct folder and does not duplicate an existing source.
- [ ] Relevant code/docs were read before editing.
- [ ] The smallest matching skill and power were used, or the reason for none is clear.
- [ ] Shared-code impact and affected tests were checked.
- [ ] Studio/Planner boundaries were checked when relevant.
- [ ] CSS checks were run when relevant.
- [ ] Migration dry run, rollback, grants, policies, and type generation were handled when relevant.
- [ ] Targeted validation passed.
- [ ] `pnpm run check:layout` was run before completion when the repository gate applies.
- [ ] `pnpm run gate:fast` or `pnpm run gate` was run at the required bar.
- [ ] Both Vitest lanes were read when the full test command was run.
- [ ] No secret, generated artifact, or unrelated change was introduced.
- [ ] The final report names files, commands, results, and blockers honestly.

## 12. Source map

- Process floor: [`../AGENTS.md`](../../AGENTS.md)
- Handbooks: [`../INDEX.md`](../INDEX.md)
- Architecture: [`../docs/architecture/`](../../docs/architecture)
- Testing: [`../Testing-handbook.md`](../../Testing-handbook.md)
- Operations: [`../OPERATIONS_RUNBOOK.md`](../../OPERATIONS_RUNBOOK.md)
- Skills: [`../.kiro/skills/`](../../.kiro/skills)
- Powers, skills, and steering model: [`../.kiro/steering/powers-skills-model.md`](../../.kiro/steering/powers-skills-model.md)
- Repo workflow power: [`../.kiro/powers/oando-workflow/POWER.md`](../../.kiro/powers/oando-workflow/POWER.md)
- LTM contract: [`../ltm/README.md`](../../ltm/README.md)
- LTM configuration: [`../ltm/config.json`](../../ltm/config.json)
- LTM manifest: [`../ltm/manifest.json`](../../ltm/manifest.json)
- LTM operations steering: [`../.kiro/steering/ltm-operations.md`](../../.kiro/steering/ltm-operations.md)
- LTM memory format steering: [`../.kiro/steering/ltm-memory-format.md`](../../.kiro/steering/ltm-memory-format.md)
- LTM capture hook: [`../.kiro/hooks/ltm-postturn-capture.json`](../../.kiro/hooks/ltm-postturn-capture.json)
- Graph tool: [`../scripts/graph-impact.mjs`](../../scripts/graph-impact.mjs)

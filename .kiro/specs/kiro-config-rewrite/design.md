# Design Document — kiro-config-rewrite

## Overview

This design reorganises the `.kiro` configuration directory into a coherent, non-contradictory state. The deliverable is a precise file-by-file specification: every file that is deleted, every file that is rewritten (with full final content), every file that is created (with full final content), and every file that is moved. No application code changes. The spec-task-runner agent executes each task against this document as the authoritative source of truth.

### Problem statement

The `.kiro` directory has accumulated six classes of structural defects:

1. **Duplicate steering files** — `product-context.md` duplicates `product.md`; `spec.md` and `tech-stack.md` describe the same domain with contradictory facts.
2. **Empty stub loaded always** — `spec-guide.md` carries `inclusion: always` but contains only a generator comment.
3. **Stale references** — `agent-behavior.md` points to `errors.md`, `implementation_plan.md`, and `CHANGELOG.md`, none of which exist; `tech-stack.md` references `/supabase/` (does not exist), ESLint (not used), and Next.js 14+ (actual: 16).
4. **Wrong inclusion on orchestrator** — `product-workflow.md` is marked `inclusion: always`, adding ~2 000 tokens of orchestration context to every routine coding turn.
5. **Hook violation** — `domain-fast-check.json` runs `pnpm run typecheck` as a catch-all on every `.ts` save, violating the user-invoked-only gate principle.
6. **Misplaced files** — workflow guide prompts live in `.kiro/agents/` (not agent definitions); the governance TypeScript module lives in `.kiro/kiro-repo-guidance-setup/` with a broken import path.

### Goals

- One authoritative file per domain, no overlapping content, no contradictions.
- Every steering file has explicit `inclusion` front-matter.
- Hooks run only lightweight static checks on save; no auto-typecheck.
- `.kiro/agents/` contains only real Kiro agent definitions.
- `powers/oando-workflow/POWER.md` honestly reflects installed vs planned MCPs.
- Every path reference inside `.kiro/**` resolves to a real file after the rewrite.

---

## Architecture

### Change taxonomy

All changes fall into four categories:

| Category | Count | Scope |
|---|---|---|
| Deletions | 3 | `.kiro/steering/` only |
| Rewrites | 7 | `.kiro/steering/`, `.kiro/hooks/`, `.kiro/powers/` |
| New files | 5 | `.kiro/hooks/`, `.kiro/settings/`, `.kiro/steering/`, `plans/prompts/`, `scripts/kiro-repo-guidance-setup/` |
| Moves | 7 + directory | `.kiro/agents/` → `plans/prompts/`; `.kiro/kiro-repo-guidance-setup/` → `scripts/kiro-repo-guidance-setup/` |

### Dependency order

Tasks must be executed in this order to avoid broken references at any intermediate state:

```
Phase 1 — Delete obsolete files (no dependencies)
  DELETE .kiro/steering/spec.md
  DELETE .kiro/steering/product-context.md
  DELETE .kiro/steering/spec-guide.md

Phase 2 — Rewrite steering files (independent of each other)
  REWRITE .kiro/steering/tech-stack.md
  REWRITE .kiro/steering/agent-behavior.md
  REWRITE .kiro/steering/coding-standards.md
  REWRITE .kiro/steering/product-workflow.md

Phase 3 — Rewrite hooks and powers (independent of each other)
  REWRITE .kiro/hooks/domain-fast-check.json
  REWRITE .kiro/powers/oando-workflow/POWER.md
  REWRITE .kiro/powers/oando-workflow/steering/routing.md

Phase 4 — Create new files (mcp.json needed before INDEX; module README needed after move)
  CREATE .kiro/hooks/session-start-orient.json
  CREATE .kiro/settings/mcp.json
  MOVE   .kiro/agents/{6 files} → plans/prompts/
  CREATE plans/prompts/README.md
  MOVE   .kiro/kiro-repo-guidance-setup/** → scripts/kiro-repo-guidance-setup/**
  FIX    scripts/kiro-repo-guidance-setup/pipeline.ts (import path)
  CREATE scripts/kiro-repo-guidance-setup/README.md

Phase 5 — Create INDEX (must be last; lists final state of all files)
  CREATE .kiro/steering/INDEX.md
```

---

## Components and Interfaces

### Kiro steering file contract

Every file under `.kiro/steering/` must satisfy:

```
---
inclusion: <always|fileMatch|auto|manual>
[fileMatchPattern: "glob" — required when inclusion is fileMatch]
---

# <Domain Name>
...content...
```

### Kiro hook file contract

Every file under `.kiro/hooks/` must satisfy the v1 schema:

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "<string>",
      "trigger": "<SessionStart|Stop|PostFileSave|PostTaskExec|...>",
      "action": {
        "type": "<agent|command>",
        "prompt": "<string — required when type is agent>",
        "command": "<string — required when type is command>"
      },
      "enabled": true,
      "matcher": "<optional regex string>",
      "timeout": <optional integer seconds>,
      "description": "<optional string>"
    }
  ]
}
```

### MCP scaffold contract

`.kiro/settings/mcp.json` must be valid JSON with:
- `$schema` pointing to the Kiro MCP schema URL
- `_comment` field documenting all partially-set-up and planned MCPs
- `mcpServers: {}` — empty until MCPs are wired up

---

## Data Models

This section specifies the exact final content for every file that is rewritten or created. Deletions and moves are listed in the following section.

---

### 1. DELETION: `.kiro/steering/spec.md`

**Action:** Delete. Content merged into the rewritten `tech-stack.md`.

---

### 2. DELETION: `.kiro/steering/product-context.md`

**Action:** Delete. `product.md` is the canonical copy with identical content and correct `inclusion: always` front-matter.

---

### 3. DELETION: `.kiro/steering/spec-guide.md`

**Action:** Delete. Contains only a generator comment with no actionable content; carries `inclusion: always`, wasting context on every turn.

---

### 4. REWRITE: `.kiro/steering/tech-stack.md`

**Full final content:**

```markdown
---
inclusion: always
---

# Tech Stack

## Core Framework & Language
- **Framework:** Next.js 16 (App Router) — version 16.3.3
- **Language:** TypeScript ^7.0.2
- **Package Manager:** pnpm 11.24.0 — the only permitted package manager; never use npm or yarn
- **Build Orchestrator:** Turborepo (`turbo.json` at repo root) — `pnpm run build` delegates to `turbo build`

## Frontend & UI
- **React:** 19.2.8 (`react`, `react-dom`)
- **Styling:** Tailwind CSS ^4.3.3 (`@tailwindcss/postcss`); `tailwind-merge`, `clsx`
- **Animations:** GSAP (`@gsap/react`), Framer Motion, `tw-animate-css`
- **State Management:** Zustand (global state), TanStack React Query (async/server state)
- **Forms & Validation:** React Hook Form + Zod (`@hookform/resolvers`)
- **Components:** React Aria Components, Embla Carousel

## Backend & Database
- **Auth & DB:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Two databases:**
  - Admin `rxzpznmxbaoxpikowmfc` — plans, profiles, handoffs, teams, price books, audit, furniture, descriptors
  - Products `erpweaiypimorcunaimz` — marketing catalog, configurator, flags, themes
- **ORM:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Migration paths:**
  - Products DB: `site/platform/supabase/migrations/` (43 files)
  - Admin DB: `site/platform/supabase/migrations.admin/` (18 files)
  - **Note:** there is NO `/supabase/` directory at the repo root — never reference it

## AI, Vectors & Search
- **Agent Framework:** Mastra (`@mastra/core`, `@mastra/memory`, `@mastra/rag`)
- **LLM Provider:** AWS Bedrock (`@ai-sdk/amazon-bedrock`)
- **Vector DB:** LanceDB (`@lancedb/lancedb`)
- **Search:** Orama (`@orama/orama`), Fuse.js
- AI panel: `site/lib/ai/AiAdvisorPanel.tsx`; all LLM calls go through `site/lib/ai/providerChain.ts`

## Linting & TypeScript
- **Linter:** oxlint via `.oxlintrc.json` at repo root — **there is no `eslint.config.mjs` and ESLint is NOT used**
- **TypeScript configs:**
  - `site/tsconfig.json` — primary config for the Next.js app
  - `scripts/tsconfig.json` — covers the scripts directory
  - **There is NO root-level `tsconfig.json`**

## Deployment
- **Hosting:** Vercel (`vercel.json`) — Next.js standalone output; `pnpm run vercel:prod`
- **Edge Workers:** Cloudflare Workers (`workers/oando-worker-proxy`, Wrangler); `pnpm run worker:deploy`
- **Storage:** Cloudflare R2 (asset backup, catalog snapshots); `pnpm run r2:backup`
- **Environment variables:** Vercel dashboard + `.env.local` locally (also `site/.env.local`)

## Testing
- **E2E:** Playwright (`tests/`, `config/build/playwright.config.ts`)
- **Unit/Integration:** Vitest — two lanes (default + tech-docs), always run both; DOM: happy-dom
- **Coverage:** `@vitest/coverage-v8`
- **Accessibility:** `@axe-core/playwright`
- Tests and gates are **user-invoked only** — agents never run tests automatically

## Observability
- Datadog RUM (production only), Vercel Analytics, Vercel Speed Insights, OpenTelemetry (`@vercel/otel`)
- Resend for transactional email

## Key Directory Layout
- `site/` — Next.js application root
- `site/app/(site)`, `site/app/admin` — marketing pages + admin UI
- `site/focss/` — project CSS architecture (`@focss/*` imports)
- `site/{components,lib,hooks,store,server}/{Studio,Planner}/` — **fork trees** (Studio and Planner MUST NOT import each other; run `pnpm run scan:boundaries` before committing)
- `site/platform/supabase/migrations/` — Products DB migrations
- `site/platform/supabase/migrations.admin/` — Admin DB migrations
- `tests/` — Playwright E2E and Vitest unit tests
- `scripts/` — one-off migration/utility scripts
- `plans/` — active plans and agentic execution prompts
- `results/` — generated evidence only (no hand-written reports)
- `Agents/` — agent handbooks and agent-readable notes
```

---

### 5. REWRITE: `.kiro/steering/agent-behavior.md`

**Full final content:**

```markdown
---
inclusion: always
---

# Agent Behavior Rules

## Before Making Changes
- Always read the relevant file(s) before editing
- Check `site/lib/` for existing utilities before writing new ones
- Check `site/components/` for existing components before creating duplicates

## What to Always Do
- Run `pnpm run build` mentally — flag any TypeScript errors before finalising
- Preserve existing Tailwind class patterns from neighbouring components
- Keep Supabase migrations in `site/platform/supabase/migrations/` (Products) or `site/platform/supabase/migrations.admin/` (Admin) — never modify schema directly
- Use `pnpm` only — never npm or yarn

## What to Never Do
- Never delete or overwrite `vercel.json` without confirmation
- Never add new npm packages without listing them explicitly for approval
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Never commit log/audit `.txt` files — they belong in `.gitignore`
- Never reference `/supabase/` at the repo root (it does not exist)
- Never reference an `eslint.config.mjs` (ESLint is not used — oxlint is via `.oxlintrc.json`)
- Never create worktrees

## When Stuck
- **Hard blockers:** record in `Failures.md` at the repo root — this is the only blockers file
- **Active plans:** check `plans/README.md` to find the current active plan subdirectory (e.g., `plans/planner-remediation/`, `plans/remediation-unified/`, `plans/site-page-css-remediation/`); there is no single `plans/PLAN.md`
- **Truth hierarchy:** follow `AGENTS.md` §1 — user > live code + fresh commands > `AGENTS.md` > `Agents/` > `docs/`
- **Architecture:** `Agents/06-architecture.md`, `docs/architecture/product-map.md`
- **CSS:** `Agents/07-css.md`, `docs/architecture/css.md`
- **Testing:** `Agents/02-testing.md`, `Testing-handbook.md`
```

---

### 6. REWRITE: `.kiro/steering/coding-standards.md`

**Full final content** (front-matter added; body unchanged):

```markdown
---
inclusion: always
---

# Coding Standards

## General Rules
- Always use TypeScript — no `.js` files in `/app`, `/components`, `/lib`, `/hooks`
- Use named exports, not default exports for components
- Prefer `async/await` over `.then()` chains
- Never commit `.env` files — use `.env.local` locally

## Component Rules
- One component per file
- Props must be typed with an interface, not inline types
- No business logic in page files — extract to hooks or lib functions
- Use Tailwind utility classes only — no custom CSS unless absolutely necessary

## Database Rules
- All Supabase queries go through `/lib/` helper functions
- Never write raw SQL in components or pages
- Use RLS (Row Level Security) — never bypass with service role key on client side

## File Naming
- Components: `PascalCase.tsx`
- Hooks: `useFeatureName.ts`
- Utilities: `camelCase.ts`
- Pages: Next.js App Router convention (`page.tsx`, `layout.tsx`)

## Cleanup (Important)
- Do NOT commit build logs, link error files, or `.txt` audit files to the repo
- Files like `build-error.log`, `link_errors.json`, `unique_broken.txt` should be in `.gitignore`
```

---

### 7. REWRITE: `.kiro/steering/product-workflow.md`

**Change:** `inclusion: always` → `inclusion: manual`. Insert `## Activation` section immediately after the front-matter block. All other content is preserved exactly as-is.

**Full final content** (showing only the changed header portion; the body is the entire existing file content with no modifications):

```markdown
---
inclusion: manual
---

## Activation

Load this file only when running the full product workflow (deep research → PRFAQ → PRD → prototype).

# Orchestrator Agent

You are a lightweight coordination agent responsible for routing tasks between specialized agents and managing workflow state. You do NOT perform research, writing, or creation tasks yourself. Your role is purely coordination.
```

*(The remainder of the file — from "## Core Responsibilities" to the end — is preserved byte-for-byte. The only changes are: `inclusion: always` → `inclusion: manual`, and the `## Activation` note inserted before `# Orchestrator Agent`.)*

---

### 8. REWRITE: `.kiro/hooks/domain-fast-check.json`

**Change:** Remove the catch-all `pnpm run typecheck` final else-branch. The final else must be a `exit 0` pass-through. All other branches (Studio/Planner → `scan:boundaries`; FOCSS/CSS/components → `verify:focss` + `lint:ui:strict`) are preserved unchanged.

**Full final content:**

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "Domain Fast Check on Save",
      "trigger": "PostFileSave",
      "description": "Routes saved files to domain-specific static checks; test files are skipped so tests remain user-invoked. TypeScript type-checking is user-invoked only and is never run automatically.",
      "enabled": true,
      "matcher": "\\.(ts|tsx|css|mjs|sql)$",
      "timeout": 120,
      "action": {
        "type": "command",
        "command": "powershell -NoProfile -Command \"$input = [Console]::In.ReadToEnd() | ConvertFrom-Json; $f = $input.filePath; if ($f -match 'tests[\\\\/]|vitest|playwright') { Write-Output 'Automatic test checks skipped; invoke verify-and-gate manually.'; exit 0 }; if ($f -match 'Planner|ooplanner|Studio|oostudio') { pnpm run scan:boundaries; exit $LASTEXITCODE }; if ($f -match 'focss|components|\\.css|postcss|tailwind') { pnpm run verify:focss; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; pnpm run lint:ui:strict; exit $LASTEXITCODE }; exit 0\""
      }
    }
  ]
}
```

**Key change:** The previous command ended with `...exit $LASTEXITCODE }; pnpm run typecheck; exit $LASTEXITCODE\"`. The rewritten command ends with `...exit $LASTEXITCODE }; exit 0\"` — the final else-branch is now an unconditional pass-through.

---

### 9. REWRITE: `.kiro/powers/oando-workflow/POWER.md`

**Full final content:**

```markdown
---
name: oando-workflow
displayName: OandO Workflow
description: Repo-local workflow power for the oando1408 monorepo. Orient with the import graph and canonical docs, enforce Studio/Planner fork boundaries, respect user-invoked verification, and route to the smallest installed power only when the repo cannot answer.
keywords: ["oando", "map repo", "orient", "blast radius", "impact", "graph", "fork boundary", "studio", "planner", "gate", "verify", "vitest", "focss", "migration", "supabase", "two databases"]
author: "workspace"
---

# OandO Workflow Power

An ACTIVE workflow bundle for this repo. It routes work to the repo's own tooling
and to the smallest relevant installed power. Authority order: user > live code +
fresh commands > AGENTS.md > Agents/ > docs/.

## Companion skills (the agent draws on these)
Passive reference under `.kiro/skills/`:
- `repo-map` — orient via canonical docs + `scripts/graph-impact.mjs`.
- `graph-impact` — blast radius + scoped test command before running the suite.
- `fork-boundaries` — Studio/Planner never import each other; `pnpm run scan:boundaries`.
- `verify-and-gate` — user-invoked focused tests -> `gate:fast` -> `gate`; two vitest lanes.
- `focss-css` — FOCSS-on-Tailwind-v4 tokens and zones.
- `db-migrations` — two-DB routing; `-- rollback`; dry-run first.

## Activation routing

### → Installed MCPs (active entries in `settings/mcp.json`)
*(none yet — `mcpServers` is currently empty; see MCP installation checklist below)*

### → Partially Set Up (tool schemas present in `mcp/` but not yet wired into `settings/mcp.json`)

| MCP | Local schema path | Status |
|-----|-------------------|--------|
| `chrome-devtools` | `mcp/chrome-devtools/` | Tool schemas present; needs `settings/mcp.json` entry |
| `cloudflare-docs` | `mcp/cloudflare-docs/` | Tool schemas present; needs `settings/mcp.json` entry |
| `github` | `mcp/github/` | Tool schemas present; needs `settings/mcp.json` entry |
| `tasks` | `mcp/tasks/` | Tool schemas present; needs `settings/mcp.json` entry |

**When routing to any of these:** fall back to repo tooling (`pnpm` scripts, `Agents/` docs) and note the fallback to the user. Do NOT attempt to call these as active MCP servers.

### → Planned MCPs [NOT YET INSTALLED]
*(No local files of any kind; do not attempt to route to these)*

| MCP | Intended purpose |
|-----|-----------------|
| `context7` | Current official library/framework docs |
| `exa` | Broad web research |
| `postman` | API collections and resources |
| `cloudinary` | Image/video asset management |
| `ltm-power` | Project memory and recall |
| `cubic-code-review` | AI code-review and security-review |
| `nova-act` | Exploratory human-like browser checks |
| `kane-cli` | Repeatable browser workflows and screenshots |
| `supabase-hosted` | Live DB ops against Admin and Products databases |

**When routing to any of these:** fall back to repo tooling (`pnpm` scripts, `Agents/` docs) and note the fallback to the user. Do NOT invent a server connection.

## Routing decisions (smallest relevant tool, or none)

- Repo structure / where-does-X-live → `repo-map` skill + `graph-impact`. No power.
- Change impact / which tests → `graph-impact` (`node scripts/graph-impact.mjs --file=<path>`). No power.
- Studio/Planner edits → `fork-boundaries` + `pnpm run scan:boundaries`. No power.
- Done/ship check → load `verify-and-gate` only when the user explicitly invokes that skill and asks for tests or gates. Never load automatically.
- Browser proof → `nova-act` (exploratory) or `kane-cli` (repeatable) — **[NOT YET INSTALLED]**; fall back to manual browser check at `http://localhost:3000` and note the fallback.
- CSS → `focss-css` + `pnpm run verify:focss`. No power.
- Schema/SQL → `db-migrations`; live DB ops → `supabase-hosted` — **[NOT YET INSTALLED]**; fall back to `pnpm run db:apply` scripts.
- Current official library/framework docs → `context7` — **[NOT YET INSTALLED]**; fall back to `node_modules/next/dist/docs/` and official documentation websites.
- Broad web research → `exa` — **[NOT YET INSTALLED]**; fall back to web search tool if available.
- API collections → `postman` — **[NOT YET INSTALLED]**; inspect `.postman.json` directly.
- Image/video assets → `cloudinary` — **[NOT YET INSTALLED]**; use direct URLs or local asset pipeline.
- Project memory/recall → `ltm-power` — **[NOT YET INSTALLED]**; use `python ltm/bin/ltm.py` CLI directly.
- AI code-review/security-review → `cubic-code-review` — **[NOT YET INSTALLED]**; use `pnpm run gate` and manual review.
- Production observability → Datadog only if present in installed registry; otherwise proceed without an external power.
- Activate only the named power for the user's concrete need; otherwise use repository tooling or no power.

## Rules

- Skills are passive markdown; the AGENT activates powers/MCP, gated by
  `~/.kiro/settings/permissions.yaml`.
- Do not use an external power when repo docs, the graph, or `pnpm` scripts answer.
- Tests and gates are user-invoked only. The `block-agent-tests` PreToolUse hook is an unconditional hard block.
- **WHEN a planned or partially-set-up MCP is referenced in routing, fall back to repo tooling (`pnpm` scripts, `Agents/` docs) and note the fallback to the user.**
- UI only at `http://localhost:3000`. pnpm only. No worktrees. Prod FS is read-only.

## MCP

This power ships no new MCP server; it routes to already-installed power MCPs.
`mcp.json` is intentionally empty (`mcpServers: {}`). See `.kiro/settings/mcp.json`
for the current installation state.

## MCP installation checklist

To activate a partially-set-up or planned MCP:
1. Add its server entry to `.kiro/settings/mcp.json` under `mcpServers`.
2. Update the routing table above — move it from "Partially Set Up" or "Planned" to "Installed".
3. Update `.kiro/steering/INDEX.md` post-MCP install checklist to mark it complete.
4. Validate with a test call before relying on it in production routing.
```

---

### 10. REWRITE: `.kiro/powers/oando-workflow/steering/routing.md`

**Full final content:**

```markdown
# OandO Workflow — routing detail

Loaded on demand when the OandO Workflow power is active.

## Fallback principle

**If a named MCP is not listed under "Installed" in `POWER.md`, it is unavailable.**
In that case: use the repo fallback listed below, and note the fallback explicitly to the user.
Never attempt to call a partially-set-up or planned MCP as if it were an active server.

## The loop for any code change
1. `node scripts/graph-impact.mjs --file=<changed-file>` — inspect blast radius and note the `suggestedTestCommand`; do not run it automatically.
2. Tests, coverage, browser-test runners, and gates are user-invoked only. Report the exact suggested command to the user instead of executing it.
3. For explicit non-test verification, use the smallest relevant repository check: `pnpm run scan:boundaries` for Studio/Planner, `pnpm run verify:focss` plus `pnpm run lint:ui:strict` for CSS/FOCSS, and the applicable type or migration check for other domains.
4. Interactive/visual claims require an explicitly requested browser check. Use `nova-act` or `kane-cli` if installed; otherwise direct the user to check manually at `http://localhost:3000` and note that browser-automation MCPs are not yet installed.

## Route-by-route fallback table

| Need | First choice | Fallback (if MCP not installed) |
|------|--------------|---------------------------------|
| Repo structure / where-does-X-live | `repo-map` skill + `graph-impact` script | N/A — no MCP needed |
| Change impact / scoped tests | `graph-impact` (`node scripts/graph-impact.mjs --file=<path>`) | N/A — no MCP needed |
| Studio/Planner fork check | `fork-boundaries` + `pnpm run scan:boundaries` | N/A — no MCP needed |
| Ship / gate check | `verify-and-gate` skill (user-invoked only) | N/A — no MCP needed |
| Browser / viewport proof | `nova-act` (exploratory) or `kane-cli` (repeatable) | Manual check at `http://localhost:3000`; note MCPs not installed |
| CSS validation | `focss-css` + `pnpm run verify:focss` | N/A — no MCP needed |
| DB migration / schema | `db-migrations` skill | N/A — no MCP needed |
| Live DB ops | `supabase-hosted` MCP | `pnpm run db:apply` / `db:apply:admin` scripts; note MCP not installed |
| Current library/framework docs | `context7` MCP | `node_modules/next/dist/docs/`; official documentation websites; note MCP not installed |
| Broad web research | `exa` MCP | Web search tool if available; note MCP not installed |
| API collections | `postman` MCP | Inspect `.postman.json` directly; note MCP not installed |
| Image/video assets | `cloudinary` MCP | Direct URLs or local asset pipeline; note MCP not installed |
| Project memory/recall | `ltm-power` MCP | `python ltm/bin/ltm.py` CLI directly; note MCP not installed |
| AI code-review | `cubic-code-review` MCP | `pnpm run gate` + manual review; note MCP not installed |
| Production observability | Datadog (if in installed registry) | Proceed without external observability; note if missing |

## Power vs skill (why routing is one-directional)
- A power is active (owns MCP + activation). A skill is passive markdown.
- The power/agent DRAWS ON skills for procedure; skills never call MCP themselves.
- Activation is gated by `~/.kiro/settings/permissions.yaml` (`power:` allowlist).

## Two databases (for db work)
Admin `rxzpznmxbaoxpikowmfc` (plans/staff/furniture/descriptors/audit) vs Products
`erpweaiypimorcunaimz` (marketing catalog/configurator/flags/themes). Confirm which
before any supabase-hosted power operation.
```

---

### 11. NEW FILE: `.kiro/hooks/session-start-orient.json`

**Full content:**

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "Session Start Orientation",
      "trigger": "SessionStart",
      "description": "Instructs the agent to orient with AGENTS.md and the standard handbook before taking any action.",
      "enabled": true,
      "action": {
        "type": "agent",
        "prompt": "At the start of this session, before taking any other action:\n1. Read AGENTS.md sections 1 (Truth), 2 (Work), and 3 (Layout) at the repo root.\n2. Read Agents/01-standard.md.\nUse these to establish the correct authority order, permitted tools (pnpm only, no worktrees), repo layout, fork boundaries, and active blockers before proceeding with any user request. Do not summarise these files back to the user — just orient silently and then respond to the user's request."
      }
    }
  ]
}
```

---

### 12. NEW FILE: `.kiro/settings/mcp.json`

**Full content:**

```json
{
  "$schema": "https://kiro.dev/schemas/mcp.json",
  "_comment": "Add each server entry under mcpServers when the MCP is installed and credentials are available. Partially-set-up MCPs (tool schemas present under mcp/ at repo root, not yet wired here): chrome-devtools, cloudflare-docs, github, tasks. Planned MCPs (no local files yet): context7, exa, postman, cloudinary, ltm-power, cubic-code-review, nova-act, kane-cli, supabase-hosted.",
  "mcpServers": {}
}
```

---

### 13. NEW FILE: `.kiro/steering/INDEX.md`

**Full content:**

```markdown
---
inclusion: manual
---

# .kiro Configuration Index

This file is the single reference for the complete `.kiro` directory layout after the
`kiro-config-rewrite` reorganisation. Load it when you need to understand which file
governs which domain, or to orient in the config without reading every file.

## Steering files

| File path (relative to `.kiro/`) | Inclusion mode | Domain / purpose | Notes |
|---|---|---|---|
| `steering/agent-behavior.md` | `always` | Agent behavioural rules: read-before-edit, pnpm-only, never-delete-vercel, blockers to `Failures.md`, active plans in `plans/` subdirs | Updated: removed dead refs (`errors.md`, `CHANGELOG.md`); added correct sources |
| `steering/ai.md` | `fileMatch` | AI domain: Mastra, Bedrock, LanceDB, Orama; all LLM calls via `providerChain.ts` | Unchanged |
| `steering/api.md` | `fileMatch` | API domain: Route Handlers, `next-safe-action`, Zod, CSRF, rate limiting | Unchanged |
| `steering/coding-standards.md` | `always` | Coding standards: TypeScript, named exports, Tailwind-only, file naming, cleanup rules | Front-matter added (was implicit) |
| `steering/database.md` | `fileMatch` | Database domain: two-DB routing, Drizzle, migration conventions, persistence rules | Unchanged |
| `steering/deployment.md` | `fileMatch` | Deployment: Vercel, Cloudflare Workers, R2, pre-deploy checklist | Unchanged |
| `steering/graph-layer.md` | `manual` | Graph layer: `scripts/graph-impact.mjs` usage, impact analysis, circular deps | Unchanged |
| `steering/INDEX.md` | `manual` | **This file** — complete `.kiro` config map, post-MCP checklist | New file |
| `steering/ltm-memory-format.md` | `fileMatch` | LTM record formats: events, checkpoints, sessions, threads, redaction rules | Unchanged |
| `steering/ltm-operations.md` | `fileMatch` | LTM operations: recall, checkpoint, maintenance commands | Unchanged |
| `steering/nova-act-viewport.md` | `manual` | Nova Act browser-layer visual QA protocol | Unchanged |
| `steering/product.md` | `always` | Product context: furniture catalog/configurator app, B2B, users, tone | Canonical copy; `product-context.md` deleted |
| `steering/product-workflow.md` | `manual` | Product workflow orchestrator: deep research → PRFAQ → PRD → prototype | Changed from `always` → `manual`; add activation note |
| `steering/seo.md` | `fileMatch` | SEO domain: IndexNow, sitemap, robots, analytics, Core Web Vitals | Unchanged |
| `steering/tech-stack.md` | `always` | Complete tech stack: Next.js 16, React 19, pnpm, Turbo, Tailwind v4, Supabase (2 DBs), Drizzle, Mastra, Bedrock, LanceDB, oxlint, Vercel + Cloudflare Workers | Merged `spec.md` content in; corrected all stale facts; `spec.md` deleted |
| `steering/testing.md` | `fileMatch` | Testing domain: Vitest (2 lanes), Playwright, happy-dom, test conventions | Unchanged |
| `steering/ui-css.md` | `fileMatch` | UI & CSS domain: Tailwind v4, Focss, responsive breakpoints, touch targets | Unchanged |

### Deleted steering files (replaced by the above)

| Deleted file | Reason |
|---|---|
| `steering/product-context.md` | Exact duplicate of `steering/product.md` (which has correct front-matter) |
| `steering/spec.md` | Duplicate tech-stack definition; content merged into `steering/tech-stack.md` |
| `steering/spec-guide.md` | Generator comment only; no actionable content; was wastefully `inclusion: always` |

## Hook files

| File path (relative to `.kiro/`) | Trigger | Type | Domain / purpose | Notes |
|---|---|---|---|---|
| `hooks/block-agent-tests.json` | `PostTaskExec` | `command` | Blocks agent-initiated test runs; unconditional hard block | Unchanged |
| `hooks/domain-fast-check.json` | `PostFileSave` | `command` | Routes saves to domain checks: Studio/Planner → `scan:boundaries`; CSS/FOCSS → `verify:focss` + `lint:ui:strict`; everything else → `exit 0` | Rewritten: removed catch-all `typecheck` else-branch |
| `hooks/ltm-postturn-capture.json` | `Stop` | `command` | Records agent activity to LTM memory store after each turn | Unchanged |
| `hooks/session-start-orient.json` | `SessionStart` | `agent` | Instructs agent to read AGENTS.md §1–§3 and Agents/01-standard.md at session start | New file |

## Agent files

| File path (relative to `.kiro/`) | Purpose | Notes |
|---|---|---|
| `agents/spec-task-runner.md` | Kiro-native agent: executes approved spec tasks | Retained; this is a real agent definition |

### Moved from `.kiro/agents/` to `plans/prompts/`

The following six files were NOT Kiro agent definitions — they are workflow guide prompts
for the product workflow orchestrator. They have been moved to `plans/prompts/`.

| Original path | New path |
|---|---|
| `.kiro/agents/AI_Framing_Agent.md` | `plans/prompts/AI_Framing_Agent.md` |
| `.kiro/agents/AI_Framing_Template.md` | `plans/prompts/AI_Framing_Template.md` |
| `.kiro/agents/Claude_Code_Workflow.md` | `plans/prompts/Claude_Code_Workflow.md` |
| `.kiro/agents/Deep_Research_Agent.md` | `plans/prompts/Deep_Research_Agent.md` |
| `.kiro/agents/PRD_Creation_Guide.md` | `plans/prompts/PRD_Creation_Guide.md` |
| `.kiro/agents/PRFAQ_Guide.md` | `plans/prompts/PRFAQ_Guide.md` |

References in `steering/product-workflow.md` (e.g., `prompts/PRFAQ_Guide.md`) must be
updated to `plans/prompts/PRFAQ_Guide.md` etc. to match the new paths.

## Powers files

| File path (relative to `.kiro/`) | Purpose | Notes |
|---|---|---|
| `powers/oando-workflow/POWER.md` | Routing manifest: installed / partially-set-up / planned MCPs; companion skills; rules | Rewritten: honest 3-section routing |
| `powers/oando-workflow/steering/routing.md` | Detailed routing loop and fallback table | Rewritten: fallback principle + per-route fallback table |

## Settings files

| File path (relative to `.kiro/`) | Purpose | Notes |
|---|---|---|
| `settings/lsp.json` | LSP configuration | Unchanged |
| `settings/mcp.json` | MCP server connection configuration (runtime) | New scaffold file; `mcpServers: {}` |

---

## Post-MCP install checklist

For each MCP below, complete these steps to activate it:
1. Add the server entry to `.kiro/settings/mcp.json` under `mcpServers`
2. Move it from its current section to "Installed" in `powers/oando-workflow/POWER.md`
3. Update its row in the routing table in `powers/oando-workflow/steering/routing.md`
4. Mark it complete in this checklist
5. Validate with a test call before relying on it in production routing

### Partially set up (tool schemas in `mcp/` — closer to ready)

- [ ] **chrome-devtools** — `mcp/chrome-devtools/` has tool schemas; add to `settings/mcp.json`
- [ ] **cloudflare-docs** — `mcp/cloudflare-docs/` has tool schemas; add to `settings/mcp.json`
- [ ] **github** — `mcp/github/` has tool schemas; add to `settings/mcp.json`
- [ ] **tasks** — `mcp/tasks/` has tool schemas; add to `settings/mcp.json`

### Planned (no local files yet — full install required)

- [ ] **context7** — current official library/framework docs; no local files yet
- [ ] **exa** — broad web research; no local files yet
- [ ] **postman** — API collections and resources; no local files yet
- [ ] **cloudinary** — image/video asset management; no local files yet
- [ ] **ltm-power** — project memory/recall (distinct from local `ltm/bin/ltm.py`); no local files yet
- [ ] **cubic-code-review** — AI code-review and security analysis; no local files yet
- [ ] **nova-act** — exploratory human-like browser checks; no local files yet
- [ ] **kane-cli** — repeatable browser workflows and screenshots; no local files yet
- [ ] **supabase-hosted** — live DB ops against Admin (`rxzpznmxbaoxpikowmfc`) and Products (`erpweaiypimorcunaimz`) databases; confirm which DB before any operation; no local files yet

---

## Removed references audit

The following path references were removed during this rewrite because they pointed to
non-existent files:

| Removed reference | Was in file | Replaced with |
|---|---|---|
| `errors.md` | `steering/agent-behavior.md` | `Failures.md` (exists at repo root) |
| `implementation_plan.md` | `steering/agent-behavior.md` | `plans/README.md` + active plan subdirs |
| `CHANGELOG.md` | `steering/agent-behavior.md` | Not replaced (no equivalent exists) |
| `/supabase/` (root path) | `steering/tech-stack.md` | `site/platform/supabase/migrations/` and `migrations.admin/` |
| `eslint.config.mjs` | `steering/tech-stack.md` | `.oxlintrc.json` |
| `plans/PLAN.md` | `AGENTS.md` §9 | `plans/README.md` + subdirs (not in scope to edit AGENTS.md; noted here) |
```

---

### 14. NEW FILE: `plans/prompts/README.md`

**Full content:**

```markdown
# plans/prompts/

This directory holds workflow guide prompts for the product workflow orchestrator
(`steering/product-workflow.md`). These files are **not** Kiro agent definitions —
they are prompt templates and procedure guides invoked by the orchestrator when
dispatching to specialised agents.

## Files

| File | Purpose |
|------|---------|
| `AI_Framing_Agent.md` | Prompt guide for the AI Framing Agent phase (AI/ML products only) |
| `AI_Framing_Template.md` | Structured worksheet template used by the AI Framing Agent |
| `Claude_Code_Workflow.md` | Workflow guide for the full product development cycle via Claude Code |
| `Deep_Research_Agent.md` | Prompt guide for the Deep Market Research Agent phase |
| `PRD_Creation_Guide.md` | Prompt guide for the PRD Agent phase; governs requirements + persona creation |
| `PRFAQ_Guide.md` | Prompt guide for the PRFAQ Agent phase; Working Backwards methodology |

## Relationship to the orchestrator

`steering/product-workflow.md` is the orchestrator. It uses the Task tool to invoke
specialised agents and references these guides with paths like `plans/prompts/PRFAQ_Guide.md`.

When the orchestrator prompt refers to a guide (e.g., `Follow: prompts/PRFAQ_Guide.md`),
the correct path after this reorganisation is `plans/prompts/<filename>`.

## History

These files were previously located under `.kiro/agents/`, which is reserved for real
Kiro-native callable agent definitions. They were moved here during the `kiro-config-rewrite`
reorganisation to keep `.kiro/agents/` semantically correct.
```

---

### 15. NEW FILE: `scripts/kiro-repo-guidance-setup/README.md`

**Full content:**

```markdown
# kiro-repo-guidance-setup

A TypeScript governance framework for the `kiro-repo-guidance-setup` implementation wave.
This module is **not executed at runtime** — it is a type contract used by agents to
reason about concurrent implementation waves, evidence provenance, capability dispositions,
and reviewer handoffs.

## Purpose

Provides shared, side-effect-free contracts for coordinating concurrent agent implementation
lanes (Lane A–D), running sequential reviewer stages, and generating handover records.
The module does not read the filesystem, invoke commands, contact external services, or
enable anything at runtime.

## Entry points

| File | Role |
|------|------|
| `contracts.ts` | All shared TypeScript types and constants (data-only; no side effects) |
| `pipeline.ts` | Integration pipeline: flattens lane outputs → integration gate → reviewer stages → final owner-approved gate |

## Key modules

| File | Purpose |
|------|---------|
| `capabilities.ts` | Capability disposition evaluation |
| `compatibility.ts` | Surface/version compatibility matrix |
| `continuity.ts` | Session continuity and context preservation |
| `contract-freeze.ts` | Shared contract freeze management |
| `coverage.ts` | Coverage matrix building |
| `discovery.ts` | Source discovery and inventory |
| `enablement.ts` | Final owner-approved gate evaluation |
| `handover.ts` | Handover record generation |
| `hooks.ts` | Hook record validation |
| `integration-gate.ts` | Integration validation gate service |
| `inventory.ts` | Repository artifact inventory |
| `owner-decisions.ts` | Owner decision records (OD-01 through OD-10) |
| `ownership.ts` | File ownership reservation management |
| `policy.ts` | Policy guard evaluation |
| `provenance.ts` | Evidence provenance ledger |
| `reservations.ts` | Wave reservation management |
| `reviewers.ts` | Sequential reviewer stages (EvidenceCompatibilityReviewer, SafetyRollbackReviewer) |
| `rollback.ts` | Rollback record management |
| `scope.ts` | Configuration scope and precedence mapping |
| `skills.ts` | Skill record definitions |
| `validation.ts` | Validation run execution |
| `wave-guard.ts` | Wave conflict detection and policy enforcement |
| `wave-manifest.ts` | ConcurrentImplementationWaveRecord construction |
| `tests/` | Vitest test suites for the above modules (lane-a, lane-b, lane-c, lane-d, integration) |

## TypeScript configuration

This module uses `scripts/tsconfig.json`. It is not part of the `site/` Next.js build.

## History

Previously located at `.kiro/kiro-repo-guidance-setup/`. Moved to `scripts/kiro-repo-guidance-setup/`
during the `kiro-config-rewrite` reorganisation to fix a broken import path in `pipeline.ts`
and to place governance tooling alongside other scripts rather than inside the Kiro config directory.
```

---

### 16. MOVE: `.kiro/agents/` workflow guides → `plans/prompts/`

**Files to move** (content preserved exactly; filenames unchanged):

| Source | Destination |
|--------|-------------|
| `.kiro/agents/AI_Framing_Agent.md` | `plans/prompts/AI_Framing_Agent.md` |
| `.kiro/agents/AI_Framing_Template.md` | `plans/prompts/AI_Framing_Template.md` |
| `.kiro/agents/Claude_Code_Workflow.md` | `plans/prompts/Claude_Code_Workflow.md` |
| `.kiro/agents/Deep_Research_Agent.md` | `plans/prompts/Deep_Research_Agent.md` |
| `.kiro/agents/PRD_Creation_Guide.md` | `plans/prompts/PRD_Creation_Guide.md` |
| `.kiro/agents/PRFAQ_Guide.md` | `plans/prompts/PRFAQ_Guide.md` |

**Retained in `.kiro/agents/`:**
- `spec-task-runner.md` — valid Kiro agent definition; not moved

**Reference update required in `steering/product-workflow.md`:**
All occurrences of `prompts/<filename>` must be updated to `plans/prompts/<filename>`.
Specifically:

| Original reference | Updated reference |
|--------------------|-------------------|
| `prompts/AI_Framing_Template.md` | `plans/prompts/AI_Framing_Template.md` |
| `prompts/PRFAQ_Guide.md` | `plans/prompts/PRFAQ_Guide.md` |
| `prompts/PRD_Creation_Guide.md` | `plans/prompts/PRD_Creation_Guide.md` |
| `prompts/Prototype_Creation_Guide.md` | `plans/prompts/Prototype_Creation_Guide.md` |
| `prompts/Shared_Standards.md` | `plans/prompts/Shared_Standards.md` |

*(Note: `Prototype_Creation_Guide.md` and `Shared_Standards.md` are referenced in the orchestrator but were not present in `.kiro/agents/`. Their updated references are listed here for completeness; the task executor should update all `prompts/` occurrences in product-workflow.md to `plans/prompts/`.)*

---

### 17. MOVE: `.kiro/kiro-repo-guidance-setup/**` → `scripts/kiro-repo-guidance-setup/**`

**All 25 TypeScript files and the `tests/` subdirectory tree** are moved to `scripts/kiro-repo-guidance-setup/`. Content is preserved exactly.

**Files:**

```
contracts.ts         capabilities.ts      compatibility.ts
continuity.ts        contract-freeze.ts   coverage.ts
discovery.ts         enablement.ts        handover.ts
hooks.ts             integration-gate.ts  inventory.ts
owner-decisions.ts   ownership.ts         pipeline.ts
policy.ts            provenance.ts        reservations.ts
reviewers.ts         rollback.ts          scope.ts
skills.ts            validation.ts        wave-guard.ts
wave-manifest.ts

tests/
  integration/
  lane-a/
  lane-b/
  lane-c/
  lane-d/
```

**Import fix in `scripts/kiro-repo-guidance-setup/pipeline.ts`:**

After the move, the broken import on line:
```typescript
} from "../../scripts/kiro-repo-guidance-setup/reviewers";
```
must be changed to:
```typescript
} from "./reviewers";
```

This is the only content change to any file in the module. The import resolves correctly as a sibling module once the directory is at `scripts/kiro-repo-guidance-setup/`.

---

## Error Handling

### Reference resolution failures

If any path reference inside a `.kiro` file does not resolve after all tasks are complete, the task executor must either update the reference to the correct path or remove it and document the removal in `steering/INDEX.md` under the "Removed references audit" subsection.

### Partial execution

If the task executor is interrupted mid-sequence, it must not leave any file in a state that references a path deleted in Phase 1 but not yet replaced in Phase 2. The phase ordering in the Architecture section ensures this cannot happen if phases are executed in order. If forced to resume from a partial state, the executor must re-read `steering/INDEX.md` (if it already exists) or re-read this design document to determine which tasks remain.

### product-workflow.md content preservation

The rewrite of `product-workflow.md` is the most risk-prone task because the file is ~600 lines. The task executor must:
1. Read the current file in full before writing.
2. Change only the two things specified: the front-matter inclusion value and the `## Activation` section insertion.
3. Verify the line count of the rewritten file is within ±5 lines of the original.
4. If the write tool truncates the file, the executor must detect this and retry with a different approach (e.g., str_replace on just the front-matter block).

---

## Testing Strategy

Property-based testing is **not applicable** to this feature. This is a configuration reorganisation with no pure functions, no input/output transformations, and no universal properties to test across an input space. All acceptance criteria are structural — they specify file existence, front-matter values, and path resolution.

The appropriate testing approach is **structural validation**:

### Post-execution verification checklist

After all tasks complete, the task executor (or a human reviewer) verifies:

**Deletions**
- [ ] `.kiro/steering/spec.md` does not exist
- [ ] `.kiro/steering/product-context.md` does not exist
- [ ] `.kiro/steering/spec-guide.md` does not exist

**Steering front-matter audit** (every file under `.kiro/steering/` must have explicit `inclusion:` front-matter)
- [ ] `tech-stack.md` — `inclusion: always`
- [ ] `agent-behavior.md` — `inclusion: always`
- [ ] `coding-standards.md` — `inclusion: always`
- [ ] `product.md` — `inclusion: always`
- [ ] `product-workflow.md` — `inclusion: manual`
- [ ] `graph-layer.md` — `inclusion: manual`
- [ ] `nova-act-viewport.md` — `inclusion: manual`
- [ ] `INDEX.md` — `inclusion: manual`
- [ ] `ai.md` — `inclusion: fileMatch`
- [ ] `api.md` — `inclusion: fileMatch`
- [ ] `database.md` — `inclusion: fileMatch`
- [ ] `deployment.md` — `inclusion: fileMatch`
- [ ] `ltm-memory-format.md` — `inclusion: fileMatch`
- [ ] `ltm-operations.md` — `inclusion: fileMatch`
- [ ] `seo.md` — `inclusion: fileMatch`
- [ ] `testing.md` — `inclusion: fileMatch`
- [ ] `ui-css.md` — `inclusion: fileMatch`

**Stale reference checks** (none of these strings should appear in any `.kiro/**` file)
- [ ] `errors.md` — not referenced in any `.kiro` file
- [ ] `implementation_plan.md` — not referenced in any `.kiro` file
- [ ] `CHANGELOG.md` — not referenced in any `.kiro` file
- [ ] `eslint.config.mjs` — not referenced in any `.kiro` file
- [ ] `Next.js 14` — not referenced in `tech-stack.md`
- [ ] `/supabase/` (root path) — not referenced in `tech-stack.md`
- [ ] `../../scripts/kiro-repo-guidance-setup/reviewers` — not present in `pipeline.ts`

**Hook validation**
- [ ] `domain-fast-check.json` — `pnpm run typecheck` does not appear in the command string
- [ ] `domain-fast-check.json` — `exit 0` appears as the final else-branch
- [ ] `session-start-orient.json` exists with trigger `SessionStart` and action type `agent`
- [ ] `block-agent-tests.json` is unchanged
- [ ] `ltm-postturn-capture.json` is unchanged

**Moves validation**
- [ ] `plans/prompts/AI_Framing_Agent.md` exists
- [ ] `plans/prompts/AI_Framing_Template.md` exists
- [ ] `plans/prompts/Claude_Code_Workflow.md` exists
- [ ] `plans/prompts/Deep_Research_Agent.md` exists
- [ ] `plans/prompts/PRD_Creation_Guide.md` exists
- [ ] `plans/prompts/PRFAQ_Guide.md` exists
- [ ] `plans/prompts/README.md` exists
- [ ] `.kiro/agents/` contains only `spec-task-runner.md`
- [ ] `scripts/kiro-repo-guidance-setup/pipeline.ts` exists and imports from `./reviewers`
- [ ] `scripts/kiro-repo-guidance-setup/README.md` exists
- [ ] `.kiro/kiro-repo-guidance-setup/` directory does not exist

**New files**
- [ ] `.kiro/settings/mcp.json` exists with `mcpServers: {}`
- [ ] `.kiro/steering/INDEX.md` exists with `inclusion: manual`

**Overlap check** (no two steering files should share >30% of their H2 headings)
- The remaining `always`-loaded files are: `tech-stack.md`, `agent-behavior.md`, `coding-standards.md`, `product.md`
- Verify no two of these share more than one H2 heading topic

**MCP scaffold integrity**
- [ ] `.kiro/settings/mcp.json` is valid JSON
- [ ] `_comment` field lists all 4 partially-set-up MCPs and all 9 planned MCPs
- [ ] `mcpServers` is an empty object `{}`

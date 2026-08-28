# Design Document: kiro-config-rewrite

## Overview

This design covers the full reorganisation of the `.kiro` configuration directory to establish a single authoritative file per domain, correct all dead path references, enforce explicit front-matter on every steering file, remove misplaced workflow guides from the agent registry, relocate the governance TypeScript module to its correct home in `scripts/`, and produce an honest MCP routing manifest.

The rewrite is a **pure configuration change** — no application source code, no Supabase migrations, no new npm packages. The deliverable is a set of file operations (create, rewrite, move, delete) and a verified post-state where every path reference inside `.kiro` resolves.

### Design Goals

1. Every domain has exactly one steering file with correct, non-contradictory content.
2. Every steering file declares its inclusion mode explicitly via YAML front-matter.
3. No agent context is wasted on always-loaded files that are only relevant in narrow scenarios.
4. `.kiro/agents/` contains only valid Kiro agent definitions.
5. `pipeline.ts` compiles without import resolution errors.
6. The MCP manifest accurately describes which servers are installed, partially set up, or only planned.
7. A single `steering/INDEX.md` provides a complete map of the post-rewrite `.kiro` layout.

### Non-Goals

- No changes to application source code (`site/`, `tests/`, `workers/`).
- No Supabase migration files.
- No changes to the `.kiro/specs/` subtree (managed by Kiro spec workflow).
- No changes to `.kiro/skills/` (15 skill dirs are correct and untouched).
- No changes to `.kiro/templates/` (dashboard/screen templates are correct and untouched).
- No changes to `routing.md` inside powers (content is already accurate; only POWER.md needs rewriting).

---

## Architecture

### Target State: `.kiro` Directory After Rewrite

```
.kiro/
├── agents/
│   └── spec-task-runner.md          ← RETAINED (valid Kiro agent definition)
│   [6 workflow guides REMOVED — moved to plans/prompts/]
│
├── hooks/
│   ├── block-agent-tests.json       ← UNCHANGED
│   ├── domain-fast-check.json       ← REWRITTEN (remove catch-all typecheck)
│   ├── ltm-postturn-capture.json    ← UNCHANGED
│   └── session-start-orient.json   ← NEW (SessionStart orient hook)
│
├── kiro-repo-guidance-setup/        ← ENTIRE DIRECTORY REMOVED
│   [moved to scripts/kiro-repo-guidance-setup/]
│
├── powers/
│   └── oando-workflow/
│       ├── POWER.md                 ← REWRITTEN (three-tier MCP routing table)
│       └── steering/
│           └── routing.md           ← UNCHANGED (content already accurate)
│
├── settings/
│   ├── lsp.json                     ← UNCHANGED
│   └── mcp.json                     ← NEW (empty scaffold with comment)
│
├── skills/                          ← UNCHANGED (15 skill dirs, SKILL.md only)
│
├── specs/                           ← UNTOUCHED (Kiro-managed)
│
├── steering/
│   ├── agent-behavior.md            ← REWRITTEN (remove 3 dead refs, add correct refs)
│   ├── ai.md                        ← UNCHANGED (inclusion: fileMatch, correct)
│   ├── api.md                       ← UNCHANGED (inclusion: fileMatch, correct)
│   ├── coding-standards.md          ← FRONT-MATTER ADDED (inclusion: always)
│   ├── database.md                  ← UNCHANGED (inclusion: fileMatch, correct)
│   ├── deployment.md                ← UNCHANGED (inclusion: fileMatch, correct)
│   ├── graph-layer.md               ← UNCHANGED (inclusion: manual, correct)
│   ├── INDEX.md                     ← NEW (inclusion: manual, full layout map)
│   ├── ltm-memory-format.md         ← UNCHANGED (inclusion: fileMatch, correct)
│   ├── ltm-operations.md            ← UNCHANGED (inclusion: fileMatch + auto, correct)
│   ├── nova-act-viewport.md         ← UNCHANGED (inclusion: manual, correct)
│   ├── product-context.md           ← DELETED (exact duplicate of product.md)
│   ├── product-workflow.md          ← FRONT-MATTER CHANGED (always → manual) + Activation note
│   ├── product.md                   ← UNCHANGED (inclusion: always, canonical product context)
│   ├── seo.md                       ← UNCHANGED (inclusion: fileMatch, correct)
│   ├── spec-guide.md                ← DELETED (empty shell, inclusion: always)
│   ├── spec.md                      ← DELETED (duplicate tech stack, no front-matter)
│   ├── tech-stack.md                ← REWRITTEN (correct facts + inclusion: always)
│   ├── testing.md                   ← UNCHANGED (inclusion: fileMatch, correct)
│   └── ui-css.md                    ← UNCHANGED (inclusion: fileMatch, correct)
│
└── templates/                       ← UNCHANGED
```

**Net steering file count:** 19 before → 16 after (3 deleted: product-context.md, spec-guide.md, spec.md; 1 new: INDEX.md).

**Net hook count:** 3 before → 4 after (1 new: session-start-orient.json).

**Net agents count:** 7 before → 1 after (6 moved to plans/prompts/).

---

## Components and Interfaces

### Module 1: Steering Consolidation

#### 1a. `steering/tech-stack.md` — Full Rewrite

**Front-matter:**
```yaml
---
inclusion: always
---
```

**Required sections and key facts per section:**

| Section heading | Must contain |
|-----------------|-------------|
| `## Core Framework & Language` | Next.js 16 (App Router); TypeScript; **pnpm** as the only permitted package manager; **Turborepo** (`turbo.json` at repo root) — `pnpm run build` delegates to `turbo build`; **oxlint** via `.oxlintrc.json` (no ESLint, no `eslint.config.mjs`); `site/tsconfig.json` as primary TS config; `scripts/tsconfig.json` for scripts dir; no root-level `tsconfig.json` |
| `## Frontend & UI` | React 19, React DOM 19; Tailwind CSS v4; `clsx`, `tailwind-merge`; GSAP (`@gsap/react`), Framer Motion, `tw-animate-css`; Zustand (global state), TanStack React Query (async state); React Hook Form + Zod (`@hookform/resolvers`); React Aria Components, Embla Carousel |
| `## Backend & Data` | Supabase — **two databases**: Admin (`rxzpznmxbaoxpikowmfc`) holds plans/profiles/handoffs/teams/price books/queries/audit/furniture/descriptors; Products (`erpweaiypimorcunaimz`) holds marketing catalog/configurator/flags/themes; Drizzle ORM (`drizzle-orm`, `drizzle-kit`); migration files at `site/platform/supabase/migrations/` (Products, 43 files) and `site/platform/supabase/migrations.admin/` (Admin, 18 files); **the path `/supabase/` at repo root does NOT exist** |
| `## AI, Vectors & Search` | Mastra (`@mastra/core`, `@mastra/memory`, `@mastra/rag`); AWS Bedrock (`@ai-sdk/amazon-bedrock`); LanceDB (`@lancedb/lancedb`), Orama, Fuse.js |
| `## Testing` | Playwright (E2E, `tests/`); Vitest (unit/component, **two lanes** — default + tech-docs, DOM: happy-dom); Testing Library; run `pnpm run gate:fast` for dev loop, `pnpm run gate` for ship bar |
| `## Fork Architecture` | `site/{components,lib,hooks,store,server}/{Studio,Planner}/` are forked — Studio and Planner **must never import each other**; run `pnpm run scan:boundaries` before committing either tree; `site/server/` is part of the fork tree alongside components/lib/hooks/store |
| `## Deployment` | Vercel (`vercel.json`); Cloudflare Workers (`workers/`, `wrangler*`); environment variables via Vercel dashboard + `.env.local` locally |
| `## Observability` | Datadog RUM, Vercel Analytics, Vercel Speed Insights, OpenTelemetry (`@vercel/otel`), Resend (email) |
| `## Key Directories` | `/site/` — Next app; `/site/app/(site)` and `/site/app/admin` — marketing + admin; `tests/` — Playwright E2E; `scripts/` — one-off migration/utility scripts; `plans/` — active plans and agentic execution prompts; `results/` — generated evidence only |

**Content to explicitly exclude (must not appear):**
- Any mention of ESLint or `eslint.config.mjs`
- `/supabase/` as a migration path at repo root
- `plans/PLAN.md` as a reference
- Next.js 14 (must be 16)
- `npm run build` or `npm` as the package manager

#### 1b. `steering/agent-behavior.md` — Targeted Rewrite

**Front-matter:** retain `inclusion: always` (already present).

**"What to Always Do" section changes:**
- Remove: `Run \`npm run build\` mentally` → Replace with: `Run \`pnpm run build\` mentally (delegates to Turborepo); flag any TypeScript errors before finalising`
- Remove: `Keep Supabase migrations in \`/supabase/\`` → Replace with: `Keep Supabase migrations in \`site/platform/supabase/migrations/\` (Products DB) or \`site/platform/supabase/migrations.admin/\` (Admin DB) — the path \`/supabase/\` at repo root does not exist`

**"What to Never Do" section:** no changes required.

**"When Stuck" section — complete replacement:**

Remove these three lines:
```
- Check `errors.md` and `implementation_plan.md` in the repo root for prior context
- Check `CHANGELOG.md` for what has already been attempted
```

Replace with:
```
- Hard blockers → `Failures.md` at repo root
- Active plans → check `plans/README.md` for the current plan index; plans live in subdirectories
  under `plans/` (e.g., `plans/planner-remediation/`, `plans/remediation-unified/`)
- Truth hierarchy → `AGENTS.md` §1 (user > live code > AGENTS.md > Agents/ > docs/)
- Standard procedures → `Agents/01-standard.md`
```

**Section structure (retain all existing H2 headings):**
- `## Before Making Changes`
- `## What to Always Do`
- `## What to Never Do`
- `## When Stuck`

#### 1c. `steering/coding-standards.md` — Front-matter Only

Add at the very top of the file (before the `# Coding Standards` heading):
```yaml
---
inclusion: always
---
```
No content changes.

#### 1d. `steering/product-workflow.md` — Inclusion Mode + Activation Note

**Front-matter change:** `inclusion: always` → `inclusion: manual`

**Add after the front-matter block and before `# Orchestrator Agent`:**
```markdown
# Activation

Load this file only when running the full product workflow (deep research → PRFAQ → PRD → prototype).
```

No other content changes. The 600-line body is preserved verbatim.

#### 1e. Files to Delete

| File | Reason |
|------|--------|
| `steering/product-context.md` | Exact duplicate of `steering/product.md` (identical body, no front-matter on the duplicate) |
| `steering/spec-guide.md` | Contains only a generator comment stub (8 lines); carries `inclusion: always` — loads nothing useful on every turn |
| `steering/spec.md` | Duplicate tech-stack definition; no front-matter; content will be superseded by the rewritten `tech-stack.md` |

Deletion order: delete all three before writing the new `tech-stack.md` to eliminate confusion about which file is authoritative during execution.

#### 1f. `steering/INDEX.md` — New File

**Front-matter:**
```yaml
---
inclusion: manual
---
```

**Purpose:** Single reference for understanding the complete `.kiro` steering layout. An agent starting a new session loads this on demand to orient without reading every file.

**Required sections:**

1. `## Steering Files` — table with columns:
   - `File` (relative path from `.kiro/`)
   - `Inclusion` (mode value)
   - `Domain / Purpose`
   - `Notes` (e.g., "merged from spec.md + old tech-stack.md")

2. `## Hooks` — table with columns: `File`, `Trigger`, `Purpose`

3. `## Agents` — table with columns: `File`, `Type` (Kiro agent def), `Purpose`

4. `## Powers` — table with columns: `File`, `Purpose`

5. `## Post-MCP Install Checklist` — for each MCP in all three tiers:
   - MCP name
   - Current status (Installed / Partially Set Up with tool schemas at `mcp/<name>/` / Planned — no local files)
   - Steps to activate: (1) add server entry to `settings/mcp.json`, (2) update POWER.md routing table section (move from Partially Set Up or Planned to Installed), (3) confirm `~/.kiro/settings/permissions.yaml` allowlist

6. `## Removed References` — subsection listing any dead path references removed during the rewrite and what they were replaced with (feeds Requirement 8 AC2).

---

### Module 2: Hooks

#### 2a. `hooks/domain-fast-check.json` — Rewrite

**Trigger:** `PostFileSave` (unchanged)  
**Matcher:** `\.(ts|tsx|css|mjs|sql)$` (unchanged)  
**Timeout:** 120 (unchanged)

**Decision logic (current → target):**

```
CURRENT LOGIC (pseudocode):
  if file matches tests/|vitest|playwright  → exit 0  (skip test files)
  elif file matches Planner|ooplanner|Studio|oostudio → pnpm run scan:boundaries
  elif file matches focss|components|\.css|postcss|tailwind → pnpm run verify:focss && pnpm run lint:ui:strict
  elif file matches supabase|drizzle|migrations|scripts/db_|lib/ai|mastra|… → pnpm run typecheck  ← REMOVE
  else → pnpm run typecheck  ← REMOVE (the catch-all)

TARGET LOGIC (pseudocode):
  if file matches tests/|vitest|playwright  → exit 0  (skip test files — unchanged)
  elif file matches Planner|ooplanner|Studio|oostudio → pnpm run scan:boundaries  (unchanged)
  elif file matches focss|components|\.css|postcss|tailwind → pnpm run verify:focss && pnpm run lint:ui:strict  (unchanged)
  else → exit 0  ← NEW: pass-through, no typecheck
```

**Key constraint:** The specific `elif` branch that matched supabase/drizzle/migrations/etc. and called `pnpm run typecheck` is removed entirely — it collapses into the final `exit 0` pass-through. No new typecheck or test-runner call is added anywhere in this file.

**Command string approach:** The PowerShell one-liner is retained but the final two lines of the command (`; pnpm run typecheck; exit $LASTEXITCODE` appearing twice — once in the domain-specific elif branch and once as the catch-all) are both replaced with `; exit 0`.

#### 2b. `hooks/session-start-orient.json` — New File

Full JSON specification:

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "Session Start Orient",
      "trigger": "SessionStart",
      "enabled": true,
      "timeout": 30,
      "description": "Instructs the agent to orient via AGENTS.md and the standard handbook before taking any action.",
      "action": {
        "type": "agent",
        "prompt": "At the start of every session, before taking any action or responding to the user's first request: read AGENTS.md sections 1 through 3 (Truth, Work, Layout) and read Agents/01-standard.md. These establish the truth hierarchy, permitted tools, repository layout, and standard operating procedures. Only after reading these may you proceed with the user's request."
      }
    }
  ]
}
```

#### 2c. `hooks/block-agent-tests.json` — No Changes

Current content is correct. Trigger `PostTaskExec`, calls `node scripts/general/block-agent-tests.mjs`. Retain verbatim.

#### 2d. `hooks/ltm-postturn-capture.json` — No Changes

Current content is correct. Trigger `Stop`, calls `python ltm/bin/ltm.py capture-turn`. Retain verbatim.

---

### Module 3: Agents Directory Cleanup

#### 3a. Files to Move: `.kiro/agents/` → `plans/prompts/`

| Source (`.kiro/agents/`) | Destination (`plans/prompts/`) |
|--------------------------|-------------------------------|
| `AI_Framing_Agent.md` | `plans/prompts/AI_Framing_Agent.md` |
| `AI_Framing_Template.md` | `plans/prompts/AI_Framing_Template.md` |
| `Claude_Code_Workflow.md` | `plans/prompts/Claude_Code_Workflow.md` |
| `Deep_Research_Agent.md` | `plans/prompts/Deep_Research_Agent.md` |
| `PRD_Creation_Guide.md` | `plans/prompts/PRD_Creation_Guide.md` |
| `PRFAQ_Guide.md` | `plans/prompts/PRFAQ_Guide.md` |

**Prerequisite:** Create `plans/prompts/` directory before moving files (it does not currently exist).

#### 3b. File to Retain

`agents/spec-task-runner.md` stays in `.kiro/agents/` — it is a valid Kiro agent definition that the spec workflow invokes.

#### 3c. Reference Updates in `steering/product-workflow.md`

After the move, scan `steering/product-workflow.md` for all occurrences of these patterns and update:

| Old reference pattern | New path |
|-----------------------|----------|
| `prompts/PRFAQ_Guide.md` | `plans/prompts/PRFAQ_Guide.md` |
| `prompts/PRD_Creation_Guide.md` | `plans/prompts/PRD_Creation_Guide.md` |
| `prompts/Prototype_Creation_Guide.md` | `plans/prompts/Prototype_Creation_Guide.md` *(if the file is added later; note in INDEX.md as planned)* |
| `prompts/AI_Framing_Template.md` | `plans/prompts/AI_Framing_Template.md` |

Also update any reference to `.kiro/agents/AI_Framing_Agent.md`, `Deep_Research_Agent.md`, etc. in `steering/product-workflow.md` if present.

#### 3d. `plans/prompts/README.md` — New File

Must document:

- **Purpose:** This directory holds workflow guides and prompt templates for the product development pipeline orchestrated by `steering/product-workflow.md`. These are NOT Kiro agent definitions — they are markdown prompts dispatched by the orchestrator.
- **File inventory table:**

| File | Role in pipeline | Invoked by |
|------|-----------------|-----------|
| `AI_Framing_Agent.md` | Defines the AI/ML framing sub-agent prompt | Orchestrator (AI/ML products only) |
| `AI_Framing_Template.md` | Worksheet template passed to the AI framing agent | Orchestrator |
| `Claude_Code_Workflow.md` | Full product development workflow reference | Orchestrator startup |
| `Deep_Research_Agent.md` | Defines the deep market research sub-agent prompt | Orchestrator phase 1 |
| `PRD_Creation_Guide.md` | Defines the PRD creation sub-agent prompt | Orchestrator phase 3 |
| `PRFAQ_Guide.md` | Defines the PRFAQ sub-agent prompt | Orchestrator phase 2 |

- **Relationship note:** These files are loaded by the orchestrator defined in `steering/product-workflow.md` (inclusion: manual). They are not automatically loaded into any agent context.

---

### Module 4: Powers Rewrite

#### 4a. `powers/oando-workflow/POWER.md` — Rewrite

**Front-matter and title:** Retain existing front-matter block and display metadata verbatim.

**Companion skills section:** Retain verbatim.

**Activation routing section:** Retain verbatim (routing instructions reference MCPs by name, which is prose — not a resolvable path).

**MCP routing table — three-tier design:**

Replace the existing `## MCP` section (currently a single paragraph) with a structured three-tier section:

```
## MCP Status

### Installed
*(empty — no MCPs are wired into settings/mcp.json yet)*

### Partially Set Up
Tool-definition schemas exist under `mcp/` but are not yet wired into `settings/mcp.json`:

| MCP | Tool schemas location | Status |
|-----|-----------------------|--------|
| chrome-devtools | `mcp/chrome-devtools/` | Schemas present, not wired |
| cloudflare-docs | `mcp/cloudflare-docs/` | Schemas present, not wired |
| github | `mcp/github/` | Schemas present, not wired |
| tasks | `mcp/tasks/` | Schemas present, not wired |

### Planned
No local files exist for these MCPs:

| MCP | Purpose | Status |
|-----|---------|--------|
| context7 | Official library/framework docs | NOT YET INSTALLED |
| exa | Broad web research | NOT YET INSTALLED |
| postman | API collections | NOT YET INSTALLED |
| cloudinary | Image/video assets | NOT YET INSTALLED |
| ltm-power | Project memory/recall | NOT YET INSTALLED |
| cubic-code-review | AI code-review/security-review | NOT YET INSTALLED |
| nova-act | Exploratory browser checks | NOT YET INSTALLED |
| kane-cli | Repeatable browser workflows and screenshots | NOT YET INSTALLED |
| supabase-hosted | Live DB ops (Admin + Products databases) | NOT YET INSTALLED |
```

**Rules section — add one rule:**

Append to the existing Rules section:
```
- WHEN a planned or partially-set-up MCP is referenced in routing, fall back to repo
  tooling (`pnpm` scripts, `Agents/` docs) and note the fallback to the user.
```

#### 4b. `powers/oando-workflow/steering/routing.md` — No Changes

Content is already accurate (correct DB IDs, correct loop procedure, correct power/skill distinction). Retain verbatim.

#### 4c. `settings/mcp.json` — New File

Exact JSON content:

```json
{
  "$schema": "https://kiro.dev/schemas/mcp.json",
  "_comment": "Add each server entry here when the MCP is installed. Partially-set-up MCPs (tool schemas in mcp/): chrome-devtools, cloudflare-docs, github, tasks. Planned MCPs (no local files yet): context7, exa, postman, cloudinary, ltm-power, cubic-code-review, nova-act, kane-cli, supabase-hosted.",
  "mcpServers": {}
}
```

---

### Module 5: kiro-repo-guidance-setup Relocation

#### 5a. Directory Move

| Source | Destination |
|--------|-------------|
| `.kiro/kiro-repo-guidance-setup/` (entire directory) | `scripts/kiro-repo-guidance-setup/` |

**Files included in move (25 TypeScript files + tests/ subdirectory):**
- Top-level `.ts` files: `capabilities.ts`, `compatibility.ts`, `continuity.ts`, `contract-freeze.ts`, `contracts.ts`, `coverage.ts`, `discovery.ts`, `enablement.ts`, `handover.ts`, `hooks.ts`, `integration-gate.ts`, `inventory.ts`, `owner-decisions.ts`, `ownership.ts`, `pipeline.ts`, `policy.ts`, `provenance.ts`, `reservations.ts`, `reviewers.ts`, `rollback.ts`, `scope.ts`, `skills.ts`, `validation.ts`, `wave-guard.ts`, `wave-manifest.ts`
- `tests/` directory with 4 subdirs: `tests/integration/`, `tests/lane-a/`, `tests/lane-b/`, `tests/lane-c/`, `tests/lane-d/`

**Execution note:** Create `scripts/kiro-repo-guidance-setup/` directory before moving. The `scripts/` directory already exists.

#### 5b. Import Fix in `pipeline.ts`

**File:** `scripts/kiro-repo-guidance-setup/pipeline.ts` (after move)

**Location:** Line ~43 in the original source (the final import statement before the export block).

**Current import:**
```typescript
import {
  runSequentialReview,
  type SequentialReviewInput,
  type SequentialReviewOutput,
} from "../../scripts/kiro-repo-guidance-setup/reviewers";
```

**Corrected import:**
```typescript
import {
  runSequentialReview,
  type SequentialReviewInput,
  type SequentialReviewOutput,
} from "./reviewers";
```

**Rationale:** After the move, `pipeline.ts` and `reviewers.ts` are siblings in `scripts/kiro-repo-guidance-setup/`. The old path `../../scripts/kiro-repo-guidance-setup/reviewers` was written as if `pipeline.ts` were inside `.kiro/` (two levels up from repo root, then back down into `scripts/`), which never resolved. The corrected `./reviewers` is a simple sibling module reference.

**No other import paths in `pipeline.ts` require changes** — all other imports use relative paths to sibling modules (`./contracts`, `./enablement`, `./handover`, `./integration-gate`) which remain correct after the move.

#### 5c. `scripts/kiro-repo-guidance-setup/README.md` — New File

Must contain:

- **Purpose:** Governance framework for concurrent implementation waves. Provides TypeScript type contracts and runtime validation for the multi-lane agent pipeline.
- **What it is NOT:** Not executed at application runtime. Not included in the Next.js bundle. Used as a type contract and validation layer by agents coordinating implementation waves.
- **Entry points table:**

| File | Role |
|------|------|
| `contracts.ts` | Central type definitions for all wave, lane, and gate concepts |
| `pipeline.ts` | Orchestration: flattens lane outputs → Integration Validation Gate → sequential reviewers → final owner gate |
| `integration-gate.ts` | Post-wave evidence collection and gate evaluation |
| `reviewers.ts` | Sequential read-only reviewer execution (`runSequentialReview`) |
| `enablement.ts` | Final owner-approved gate (`runFinalOwnerApprovedGate`) |

- **Tests:** `tests/` subdirectory contains Vitest tests in four lane subdirs plus integration tests. Run with `pnpm run test` (tech-docs Vitest lane includes this module).
- **History note:** Moved from `.kiro/kiro-repo-guidance-setup/` to this location to fix a broken import and place the module alongside other governance scripts.

---

## Data Models

### Front-matter Schema (all steering files)

Every file under `.kiro/steering/` must begin with a YAML front-matter block:

```yaml
---
inclusion: <mode>
---
```

Valid modes and their semantics:

| Mode | Loaded when |
|------|-------------|
| `always` | Every agent turn, regardless of context |
| `fileMatch` | When the active file matches the file pattern specified in the front-matter |
| `auto` | Kiro decides based on relevance |
| `manual` | Only when explicitly requested by user or agent |

### Front-matter Audit Table

Complete target state for every steering file:

| File | Current front-matter | Target front-matter | Change required |
|------|---------------------|--------------------|-----------------| 
| `agent-behavior.md` | `inclusion: always` | `inclusion: always` | None (content rewrite only) |
| `ai.md` | `inclusion: fileMatch` | `inclusion: fileMatch` | None |
| `api.md` | `inclusion: fileMatch` | `inclusion: fileMatch` | None |
| `coding-standards.md` | *(none)* | `inclusion: always` | **Add front-matter** |
| `database.md` | `inclusion: fileMatch` | `inclusion: fileMatch` | None |
| `deployment.md` | `inclusion: fileMatch` | `inclusion: fileMatch` | None |
| `graph-layer.md` | `inclusion: manual` | `inclusion: manual` | None |
| `INDEX.md` | *(new file)* | `inclusion: manual` | **Create with front-matter** |
| `ltm-memory-format.md` | `inclusion: fileMatch` | `inclusion: fileMatch` | None |
| `ltm-operations.md` | `inclusion: fileMatch` + `auto` | `inclusion: fileMatch` + `auto` | None |
| `nova-act-viewport.md` | `inclusion: manual` | `inclusion: manual` | None |
| `product-context.md` | *(none)* | *(deleted)* | **Delete** |
| `product-workflow.md` | `inclusion: always` | `inclusion: manual` | **Change mode** |
| `product.md` | `inclusion: always` | `inclusion: always` | None |
| `seo.md` | `inclusion: fileMatch` | `inclusion: fileMatch` | None |
| `spec-guide.md` | `inclusion: always` | *(deleted)* | **Delete** |
| `spec.md` | *(none)* | *(deleted)* | **Delete** |
| `tech-stack.md` | *(none)* | `inclusion: always` | **Rewrite with front-matter** |
| `testing.md` | `inclusion: fileMatch` | `inclusion: fileMatch` | None |
| `ui-css.md` | `inclusion: fileMatch` | `inclusion: fileMatch` | None |

**Summary of front-matter changes:** 5 files need intervention — coding-standards.md (add), product-workflow.md (change mode), tech-stack.md (add via rewrite); the other 3 are deletions that satisfy the requirement by removal.

---

## Correctness Properties

> Property-based testing does not apply to this feature. The feature is a filesystem/configuration rewrite — file moves, content edits, JSON creation, and path reference corrections. The "properties" here are one-time audit checks (file existence, grep patterns, JSON parsing, set comparison), not universal properties over a random input space. Each check runs once against the post-rewrite state rather than 100 times over generated inputs.

The following properties define the pass/fail criteria for a post-rewrite audit. Each can be evaluated programmatically by a task-execution agent or a shell script.

---

### Property 1: No two steering files share >30% H2 heading overlap

**Validates: Requirements 1.6**

**What to check:** For every pair of files in `.kiro/steering/*.md`, extract all `## ` headings into a set. Compute the Jaccard overlap: `|intersection| / |union|`. Pass if the ratio is ≤ 0.30 for every pair.

**How to check:**
```powershell
# For each .md file in .kiro/steering/, extract H2 headings
# (lines matching '^## ')
# Compare every pair using: overlap = |A ∩ B| / |A ∪ B|
# Flag any pair where overlap > 0.30
```

**Pass condition:** No pair of steering files has a Jaccard H2 heading overlap greater than 0.30.

**Expected result after rewrite:** The three deleted files (spec.md, product-context.md, spec-guide.md) were the primary sources of near-duplicate headings. After deletion and the tech-stack.md rewrite, each file covers a distinct domain.

---

### Property 2: Every steering file has explicit `inclusion` front-matter

**Validates: Requirements 9.1, 9.2, 9.3**

**What to check:** For every file in `.kiro/steering/*.md`, verify the file starts with `---` and contains an `inclusion:` key set to one of `always`, `fileMatch`, `auto`, `manual`.

**How to check:**
```powershell
Get-ChildItem ".kiro/steering/*.md" | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if ($content -notmatch '^---[\s\S]*?inclusion:\s*(always|fileMatch|auto|manual)[\s\S]*?---') {
    Write-Error "Missing or invalid front-matter in: $($_.Name)"
  }
}
```

**Pass condition:** Every `.md` file in `.kiro/steering/` matches the front-matter pattern with a valid inclusion value.

---

### Property 3: Every path referenced inside `.kiro/**/*.{md,json}` resolves to an existing file

**Validates: Requirements 8.1, 8.2**

**What to check:** Extract all strings matching common path patterns from `.kiro/**/*.md` and `.kiro/**/*.json` — specifically:
1. Markdown links: `[text](path)`
2. Backtick file references: `` `path/to/file` `` where the string contains `/` and a file extension
3. JSON `"command"` values containing file paths
4. Import statements in any `.ts` files remaining under `.kiro/` (should be none after module move)

**How to check:**
```powershell
# Extract path-like strings from all .kiro md/json files
# For each candidate path, resolve relative to repo root (d:\23082026\)
# and verify Test-Path returns $true
```

**Pass condition:** Every resolved path exists. Dead references are either corrected or documented in `steering/INDEX.md` under "Removed references".

**Known fixes this property validates:**
- `agent-behavior.md`: `errors.md`, `implementation_plan.md`, `CHANGELOG.md` removed ✓
- `pipeline.ts` import removed from `.kiro/` entirely (module moved to `scripts/`) ✓
- `product-workflow.md` references to `prompts/*.md` updated to `plans/prompts/*.md` ✓

---

### Property 4: `.kiro/agents/` contains only files matching the Kiro agent schema

**Validates: Requirements 4.2, 4.3**

**What to check:** List all files in `.kiro/agents/`. For each file, verify it is a Markdown file whose content contains the structural markers of a Kiro agent definition (a YAML front-matter block and agent-specific directives), not prose workflow guide content.

**How to check:**
```powershell
Get-ChildItem ".kiro/agents/*.md" | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  # Flag files that look like workflow guides (contain "## Workflow Routing",
  # "## Startup Sequence", "## Agent Invocation Templates" — prose orchestrator patterns)
  if ($content -match '## (Workflow Routing|Startup Sequence|Agent Invocation Templates|Process floor)') {
    Write-Error "Workflow guide found in agents/: $($_.Name)"
  }
}
```

**Pass condition:** `.kiro/agents/` contains exactly one file: `spec-task-runner.md`. The six workflow guides are absent.

---

### Property 5: `pipeline.ts` import resolves — `./reviewers` exists as a sibling

**Validates: Requirements 5.1, 5.2, 5.4**

**What to check:** After the module move, verify:
1. `scripts/kiro-repo-guidance-setup/pipeline.ts` exists.
2. `scripts/kiro-repo-guidance-setup/reviewers.ts` exists (sibling).
3. The import in `pipeline.ts` reads `from "./reviewers"` (not `../../scripts/...`).
4. No file under `.kiro/` contains the string `kiro-repo-guidance-setup`.

**How to check:**
```powershell
# Check 1 & 2: file existence
Test-Path "scripts/kiro-repo-guidance-setup/pipeline.ts"
Test-Path "scripts/kiro-repo-guidance-setup/reviewers.ts"

# Check 3: import path
Select-String -Path "scripts/kiro-repo-guidance-setup/pipeline.ts" -Pattern 'from "\./reviewers"'

# Check 4: no .kiro reference remaining
Select-String -Path ".kiro/**/*.{md,json,ts}" -Pattern "kiro-repo-guidance-setup" -Recurse
```

**Pass condition:** Checks 1–3 each return a match/true; Check 4 returns no results.

---

### Property 6: `settings/mcp.json` exists and is valid JSON

**Validates: Requirements 6.4**

**What to check:**
1. `Test-Path ".kiro/settings/mcp.json"` returns `$true`.
2. The file content parses as valid JSON without error.
3. The JSON object contains a `"mcpServers"` key.

**How to check:**
```powershell
$json = Get-Content ".kiro/settings/mcp.json" -Raw | ConvertFrom-Json
if ($null -eq $json.mcpServers) { Write-Error "mcpServers key missing" }
```

**Pass condition:** File exists, parses without error, `mcpServers` key present.

---

### Property 7: No steering file references forbidden patterns

**Validates: Requirements 1.3, 1.4, 8.2**

**What to check:** Grep all files in `.kiro/steering/*.md` for the following forbidden strings:

| Forbidden pattern | Reason |
|------------------|--------|
| `ESLint` or `eslint` | No ESLint in this repo |
| `eslint.config.mjs` | File does not exist |
| `/supabase/` (as a path, not a package name) | Root `/supabase/` directory does not exist |
| `plans/PLAN.md` | File does not exist; active plans are in subdirectories |
| `errors.md` | File does not exist |
| `implementation_plan.md` | File does not exist |
| `CHANGELOG.md` | File does not exist |
| `Next.js 14` | Repo is on Next.js 16 |

**How to check:**
```powershell
$patterns = @('eslint', 'eslint\.config\.mjs', 'plans/PLAN\.md',
              '\berrors\.md\b', 'implementation_plan\.md', 'CHANGELOG\.md',
              'Next\.js 14')
foreach ($p in $patterns) {
  $hits = Select-String -Path ".kiro/steering/*.md" -Pattern $p
  if ($hits) { Write-Error "Forbidden pattern '$p' found: $($hits | Select-Object Filename, LineNumber)" }
}
# Special case: /supabase/ as path (not @supabase/ package reference)
Select-String -Path ".kiro/steering/*.md" -Pattern '`/supabase/`|migrations.*`/supabase'
```

**Pass condition:** Zero matches for every forbidden pattern across all steering files.

---

## Error Handling

### Task Execution Failures

Each task is self-contained and ordered by dependency (see Execution Order below). If a task fails:

- **File delete fails** (file not found): treat as already-done; proceed.
- **File move fails** (destination dir missing): create the destination directory first, then retry.
- **Content rewrite produces wrong result**: the spec-task-runner agent must re-read the file after writing and verify the target pattern is present before marking the task complete.
- **Import fix produces compile error**: do not proceed to marking Property 5 as passing. The `./reviewers` path must exist as a sibling; if it does not, the module move (Task 5a) did not complete — retry Task 5a first.

### Reference Audit (Property 3) Failures

If Property 3 fails post-rewrite, the agent must:
1. Log the unresolved reference (file, line, referenced path).
2. Determine whether the path should be updated to a new location or removed.
3. Apply the fix.
4. Re-run P3 until it passes.
5. Document removed references in `steering/INDEX.md` under "Removed references".

### Ordering Constraint Violations

If a task is executed out of order (e.g., `tech-stack.md` is rewritten before `spec.md` is deleted), there is no data loss — but the INDEX.md will need to be updated to reflect the actual deletion. The tasks below specify the safe execution order.

---

## Testing Strategy

Property-based testing is not appropriate for this feature (see Correctness Properties section preamble). The feature is a deterministic set of file operations with no logic under a pure function.

**Verification approach:** After all tasks complete, run the seven correctness property checks (Property 1–Property 7) in sequence as a post-rewrite audit. Each check is a shell command producing pass/fail output.

**Unit tests:** Not applicable — no new TypeScript or JavaScript logic is introduced. The moved `scripts/kiro-repo-guidance-setup/` module already has Vitest tests in its `tests/` subdirectory; those tests are unchanged by the move and serve as the regression test for the module.

**Smoke check for moved module:** After the move, verify the existing Vitest tests for `kiro-repo-guidance-setup` still pass:
```powershell
pnpm run test --filter scripts/kiro-repo-guidance-setup
```
(If the Vitest configuration does not scope by filter this way, check `scripts/tsconfig.json` for the include paths and run the tech-docs Vitest lane which covers `scripts/`.)

---

## Execution Order

Tasks must be executed in the following sequence. Arrows indicate "must complete before".

```
Phase 1 — Deletions (no dependencies; safe to run first)
──────────────────────────────────────────────────────
T1.1  Delete steering/product-context.md
T1.2  Delete steering/spec-guide.md
T1.3  Delete steering/spec.md

Phase 2 — Steering rewrites (depends on Phase 1 deletions being done)
──────────────────────────────────────────────────────────────────────
T2.1  Rewrite steering/tech-stack.md (authoritative; spec.md now deleted so no conflict)
T2.2  Rewrite steering/agent-behavior.md (remove dead refs, add correct refs)
T2.3  Add front-matter to steering/coding-standards.md
T2.4  Change front-matter + add Activation note to steering/product-workflow.md

Phase 3 — Module move (independent of Phase 1–2)
──────────────────────────────────────────────────
T3.1  Create scripts/kiro-repo-guidance-setup/ directory
T3.2  Move all 25 .ts files from .kiro/kiro-repo-guidance-setup/ to scripts/kiro-repo-guidance-setup/
T3.3  Move tests/ subdirectory to scripts/kiro-repo-guidance-setup/tests/
T3.4  Fix broken import in scripts/kiro-repo-guidance-setup/pipeline.ts (./reviewers)
      ↑ depends on T3.2 (pipeline.ts must exist at new location first)
T3.5  Create scripts/kiro-repo-guidance-setup/README.md
T3.6  Delete .kiro/kiro-repo-guidance-setup/ (now empty after T3.2+T3.3)

Phase 4 — Agents directory (independent of Phase 1–3)
──────────────────────────────────────────────────────
T4.1  Create plans/prompts/ directory
T4.2  Move 6 workflow guide files from .kiro/agents/ to plans/prompts/
      ↑ depends on T4.1
T4.3  Update path references in steering/product-workflow.md for moved files
      ↑ depends on T4.2 (must know final paths before updating references)
T4.4  Create plans/prompts/README.md
      ↑ depends on T4.2 (documents files that must exist)

Phase 5 — Powers and settings (independent of all above)
──────────────────────────────────────────────────────────
T5.1  Rewrite powers/oando-workflow/POWER.md (three-tier MCP table)
T5.2  Create settings/mcp.json (empty scaffold)

Phase 6 — Hooks (independent of all above)
──────────────────────────────────────────
T6.1  Rewrite hooks/domain-fast-check.json (remove catch-all typecheck)
T6.2  Create hooks/session-start-orient.json (new SessionStart hook)

Phase 7 — INDEX (depends on all prior phases; must list final state)
──────────────────────────────────────────────────────────────────────
T7.1  Create steering/INDEX.md
      ↑ depends on T1.x (deletions complete), T2.x (rewrites complete),
        T3.6 (.kiro/kiro-repo-guidance-setup removed), T4.2 (agents cleaned up),
        T5.x (powers/settings updated), T6.x (hooks updated)

Phase 8 — Post-rewrite audit
──────────────────────────────
T8.1  Run P3 reference audit across .kiro/**/*.{md,json}
      ↑ depends on all prior phases
T8.2  Run Property 1–Property 2, Property 4–Property 7 checks
      ↑ depends on T8.1 passing (fix any Property 3 failures before running Property 4–Property 7)
```

**Parallelism notes:**
- Phases 3, 4, 5, and 6 have no dependencies on each other and can be executed in any order relative to each other, but all must complete before Phase 7.
- Phase 1 must complete before Phase 2 (tech-stack.md rewrite must not happen while spec.md still exists as a competing definition).
- Phase 8 must be the final phase.

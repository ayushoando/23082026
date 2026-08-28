# Requirements Document

## Introduction

The `.kiro` configuration directory has accumulated structural problems that degrade agent context quality and violate the repo's own authoritativeness principle (user > live code > `AGENTS.md` > `Agents/` > docs). Problems include duplicate steering files with contradictory content, an empty stub loaded on every turn, workflow guides misplaced in `.kiro/agents/`, a TypeScript governance module (`kiro-repo-guidance-setup/`) that belongs under `scripts/`, a broken import in `pipeline.ts`, a catch-all typecheck hook that contradicts the user-invoked-only verification principle, and no `mcp.json` scaffold for forthcoming MCP installations.

This feature reorganises the entire `.kiro` folder along a one-file-per-domain rule: every concern has exactly one authoritative file, no file is loaded unless its content is genuinely needed at that moment, and every file reference inside `.kiro` resolves to a real path.

The deliverable is a full implementation plan with a task list — not deployed code. Execution tasks must be self-contained and ordered so they can be approved and run sequentially by the `spec-task-runner` agent.

---

## Glossary

- **Config_Rewriter**: The agent or human executing the tasks in this spec.
- **Steering_File**: A Markdown file under `.kiro/steering/` that Kiro loads into agent context according to its `inclusion` front-matter mode (`always`, `fileMatch`, `auto`, or `manual`).
- **Hook_File**: A JSON file under `.kiro/hooks/` defining a trigger → action pair executed by Kiro at specific lifecycle events.
- **Agent_File**: A Markdown file under `.kiro/agents/` defining a Kiro-native callable agent. Workflow guides and prompt templates are NOT agent files.
- **Power_File**: A Markdown file under `.kiro/powers/{name}/POWER.md` describing an installed power and its MCP routing.
- **Guidance_Module**: The TypeScript module currently at `.kiro/kiro-repo-guidance-setup/` — a governance framework for concurrent implementation waves.
- **Settings_Dir**: `.kiro/settings/` — holds `lsp.json` and will hold `mcp.json`.
- **Domain**: A single named concern (e.g., product context, tech stack, testing policy, agent behaviour). One steering file per domain.
- **MCP_Scaffold**: A `mcp.json` stub in `.kiro/settings/` that documents the full list of planned MCPs with empty server entries, ready for credentials to be filled in at install time.
- **Broken_Import**: The `import … from "../../scripts/kiro-repo-guidance-setup/reviewers"` in `pipeline.ts`, which resolves to a path that does not exist because the module is in `.kiro/`, not `scripts/`.
- **Repo_MCP_Dir**: The `mcp/` directory at the repo root, containing tool-definition JSON schemas for MCPs that have already been partially set up (subdirs: `chrome-devtools/`, `cloudflare-docs/`, `github/`, `tasks/`). These are distinct from `settings/mcp.json` and indicate those four MCPs are further along than the five remaining planned ones.

---

## Requirements

### Requirement 1: Steering Consolidation — Eliminate Duplicates and Contradictions

**User Story:** As the agent consuming context, I want each domain to have exactly one steering file with correct, non-contradictory content, so that I do not load conflicting instructions or waste context on empty stubs.

#### Acceptance Criteria

1. THE Config_Rewriter SHALL delete `steering/product-context.md` because `steering/product.md` is the canonical copy and the two files have identical content.
2. THE Config_Rewriter SHALL delete `steering/spec-guide.md` because it contains only a generator comment and no actionable rules, yet carries `inclusion: always`.
3. THE Config_Rewriter SHALL rewrite `steering/tech-stack.md` to contain the single authoritative tech-stack definition and add an `inclusion: always` front-matter block; the conflicting `steering/spec.md` SHALL be deleted after its content is merged into `tech-stack.md`. The rewritten `tech-stack.md` MUST reflect the following verified facts about the repo:
   a. **Framework**: Next.js 16 (App Router), TypeScript, **pnpm** as the only permitted package manager, **Turborepo** (`turbo.json` at repo root) as the build orchestrator — `pnpm run build` delegates to `turbo build`.
   b. **Frontend**: React 19, Tailwind CSS v4, GSAP, Framer Motion, Zustand, TanStack Query, React Hook Form + Zod, React Aria Components.
   c. **Backend/DB**: Supabase (two databases — Admin `rxzpznmxbaoxpikowmfc` and Products `erpweaiypimorcunaimz`), Drizzle ORM; migration files live at `site/platform/supabase/migrations/` (Products DB, 43 files) and `site/platform/supabase/migrations.admin/` (Admin DB, 18 files) — the path `/supabase/` at repo root does NOT exist and MUST NOT be referenced.
   d. **AI/Vectors**: Mastra (`@mastra/core`, `@mastra/memory`, `@mastra/rag`), AWS Bedrock (`@ai-sdk/amazon-bedrock`), LanceDB, Orama, Fuse.js.
   e. **Linter**: **oxlint** configured via `.oxlintrc.json` at repo root — there is no `eslint.config.mjs` and ESLint is NOT used; any reference to ESLint MUST be removed.
   f. **TypeScript config**: `site/tsconfig.json` is the primary TS config; `scripts/tsconfig.json` covers the scripts directory; there is NO root-level `tsconfig.json`.
   g. **Testing**: Playwright (E2E, `tests/`), Vitest (unit/component, two lanes — default + tech-docs, DOM: happy-dom), Testing Library.
   h. **Fork tree directories**: `site/{components,lib,hooks,store,server}/{Studio,Planner}/` — `site/server/` is part of the fork tree alongside `site/components/`, `site/lib/`, `site/hooks/`, and `site/store/`; Studio and Planner MUST NOT import each other.
   i. **Deployment**: Vercel (`vercel.json`), Cloudflare Workers (`workers/`, `wrangler*`), environment variables via Vercel dashboard + `.env.local` locally.
4. THE Config_Rewriter SHALL rewrite `steering/agent-behavior.md` to remove all references to `errors.md`, `implementation_plan.md`, and `CHANGELOG.md` (none of which exist) and replace them with the correct authoritative sources (`Failures.md` for hard blockers; `plans/` subdirectory — check `plans/README.md` for the active plan since there is no single `plans/PLAN.md` file, active plans live in subdirs such as `plans/planner-remediation/`, `plans/remediation-unified/`, `plans/site-page-css-remediation/`; `AGENTS.md` §1 for the truth hierarchy); the `inclusion: always` front-matter SHALL be retained.
5. THE Config_Rewriter SHALL add `inclusion: always` front-matter to `steering/coding-standards.md`, which currently lacks any front-matter and therefore relies on implicit default inclusion.
6. WHEN the consolidation tasks are complete, THE Config_Rewriter SHALL verify that no two steering files share more than 30% overlapping heading structure, measured by comparing the H2 heading sets of each file.
7. THE Config_Rewriter SHALL produce a `steering/INDEX.md` (inclusion: manual) that lists every remaining steering file, its inclusion mode, and a one-line description of its domain — this file is the single reference for understanding the steering layout.

---

### Requirement 2: Steering — product-workflow.md Demotion

**User Story:** As the agent consuming context, I want the 600-line orchestrator workflow prompt loaded only when I am explicitly orchestrating a product workflow, not on every single turn, so that routine coding tasks do not carry ~2 000 tokens of irrelevant orchestration instructions.

#### Acceptance Criteria

1. THE Config_Rewriter SHALL change `steering/product-workflow.md`'s `inclusion` front-matter from `always` to `manual`, so Kiro loads it only when the user or an agent explicitly requests it.
2. THE Config_Rewriter SHALL add a one-line `# Activation` note near the top of `steering/product-workflow.md` stating: "Load this file only when running the full product workflow (deep research → PRFAQ → PRD → prototype)."
3. IF `steering/product-workflow.md` is set to `manual` inclusion, THEN THE Config_Rewriter SHALL confirm that the file content is otherwise unchanged — demotion to `manual` is the only edit, not a content rewrite.

---

### Requirement 3: Hooks Rewrite — Enforce User-Invoked-Only Verification

**User Story:** As the repo owner, I want the `domain-fast-check` hook to run only lightweight static checks on save (boundary scan, FOCSS lint), never a full typecheck, so that the user-invoked-only gate principle stated in `AGENTS.md` is not violated on every file save.

#### Acceptance Criteria

1. THE Config_Rewriter SHALL rewrite `hooks/domain-fast-check.json` so that the catch-all `pnpm run typecheck` branch — the final `else` path triggered for any `.ts` save that does not match a more specific pattern — is removed and replaced with a `exit 0` pass-through.
2. WHERE a saved file matches the Studio or Planner path pattern, THE Config_Rewriter SHALL retain the `pnpm run scan:boundaries` call in `domain-fast-check.json` unchanged.
3. WHERE a saved file matches the FOCSS/CSS/component pattern, THE Config_Rewriter SHALL retain the `pnpm run verify:focss` + `pnpm run lint:ui:strict` sequence in `domain-fast-check.json` unchanged.
4. THE Config_Rewriter SHALL NOT add any new typecheck or test-runner call to `domain-fast-check.json` — type checking remains user-invoked only.
5. THE Config_Rewriter SHALL verify that `hooks/block-agent-tests.json` and `hooks/ltm-postturn-capture.json` are correct and unchanged; no edits to these two files are required by this requirement.
6. THE Config_Rewriter SHALL add a `hooks/session-start-orient.json` file with trigger `SessionStart` and action type `agent` whose prompt instructs the agent to read `AGENTS.md` §1–§3 and `Agents/01-standard.md` at session start before taking any action.

---

### Requirement 4: Agents Directory Cleanup — Remove Misplaced Workflow Guides

**User Story:** As the agent runtime, I want `.kiro/agents/` to contain only real Kiro-native agent definition files, so that workflow guides and prompt templates do not pollute the agent registry.

#### Acceptance Criteria

1. THE Config_Rewriter SHALL create the directory `plans/prompts/` if it does not already exist.
2. THE Config_Rewriter SHALL move the following six files from `.kiro/agents/` to `plans/prompts/`, preserving their filenames: `AI_Framing_Agent.md`, `AI_Framing_Template.md`, `Claude_Code_Workflow.md`, `Deep_Research_Agent.md`, `PRD_Creation_Guide.md`, `PRFAQ_Guide.md`.
3. THE Config_Rewriter SHALL retain `agents/spec-task-runner.md` in `.kiro/agents/` because it is a valid Kiro agent definition.
4. WHEN the six files have been moved, THE Config_Rewriter SHALL update any reference to those files inside `steering/product-workflow.md` (e.g., `prompts/PRFAQ_Guide.md`, `prompts/PRD_Creation_Guide.md`, `prompts/Prototype_Creation_Guide.md`) to use the new path `plans/prompts/{filename}`.
5. THE Config_Rewriter SHALL add a `README.md` to `plans/prompts/` documenting the purpose of each file and its relationship to the product workflow orchestrator.

---

### Requirement 5: Guidance Module Relocation — Fix Broken Import and Move to scripts/

**User Story:** As a TypeScript compiler, I want `pipeline.ts` to import from a path that exists, so that the governance module can be type-checked without a resolution error.

#### Acceptance Criteria

1. THE Config_Rewriter SHALL move the entire `.kiro/kiro-repo-guidance-setup/` directory to `scripts/kiro-repo-guidance-setup/`, preserving all 24 TypeScript files and the `tests/` subdirectory.
2. THE Config_Rewriter SHALL fix the broken import in `pipeline.ts` — the import path `../../scripts/kiro-repo-guidance-setup/reviewers` SHALL become `./reviewers` (sibling module within the same directory) after the move.
3. THE Config_Rewriter SHALL add a `scripts/kiro-repo-guidance-setup/README.md` that explains the module's purpose (governance framework for concurrent implementation waves), its entry points (`pipeline.ts`, `contracts.ts`), and a note that it is not executed at runtime but used as a type contract by agents.
4. WHEN the move is complete, THE Config_Rewriter SHALL verify that no file under `.kiro/` contains an import or reference to `.kiro/kiro-repo-guidance-setup/`.

---

### Requirement 6: Powers Rewrite — Honest Routing for Pending MCPs

**User Story:** As the agent reading the powers manifest, I want `oando-workflow/POWER.md` to accurately reflect which MCPs are installed versus planned, so that I do not attempt to route to uninstalled servers.

#### Acceptance Criteria

1. BEFORE rewriting `powers/oando-workflow/POWER.md`, THE Config_Rewriter SHALL inspect the `mcp/` directory at the repo root to determine which MCP servers have tool-definition JSON schemas already present. The four subdirectories found (`chrome-devtools/`, `cloudflare-docs/`, `github/`, `tasks/`) each contain a `tools/` directory with JSON schema files, indicating these MCPs have been partially set up at the tool-definition level and are closer to installation-ready than the remaining five.
2. THE Config_Rewriter SHALL rewrite `powers/oando-workflow/POWER.md` to split the routing table into three sections:
   - **Partially Set Up** (tool schemas exist under `mcp/` but not yet wired into `settings/mcp.json`): `chrome-devtools`, `cloudflare-docs`, `github`, `tasks` — each listed with its `mcp/` subdirectory path and a note that tool schemas are present.
   - **Planned** (no local files; not yet set up in any form): `context7` (official library/framework docs), `exa` (broad web research), `postman` (API collections), `cloudinary` (image/video assets), `ltm-power` (project memory/recall), `cubic-code-review` (AI code-review/security-review), `nova-act` (exploratory browser checks), `kane-cli` (repeatable browser workflows and screenshots), `supabase-hosted` (live DB ops against Admin and Products databases) — marked `[NOT YET INSTALLED]`.
   - **Installed** (active entry in `settings/mcp.json`): empty until MCPs are wired up.
3. THE Config_Rewriter SHALL add the rule: "WHEN a planned or partially-set-up MCP is referenced in routing, THE Config_Rewriter SHALL fall back to repo tooling (`pnpm` scripts, `Agents/` docs) and note the fallback to the user" to the Rules section of POWER.md.
4. THE Config_Rewriter SHALL create `settings/mcp.json` as an empty-but-structured scaffold:
   ```json
   {
     "$schema": "https://kiro.dev/schemas/mcp.json",
     "_comment": "Add each server entry here when the MCP is installed. Partially-set-up MCPs (tool schemas in mcp/): chrome-devtools, cloudflare-docs, github, tasks. Planned MCPs (no local files yet): context7, exa, postman, cloudinary, ltm-power, cubic-code-review, nova-act, kane-cli, supabase-hosted.",
     "mcpServers": {}
   }
   ```
5. THE Config_Rewriter SHALL NOT treat the `mcp/` directory at repo root as part of `.kiro/settings/` — the two are separate concerns; `mcp/` holds tool schemas for MCP server packages, while `settings/mcp.json` holds the runtime connection configuration that Kiro reads to connect to those servers.

---

### Requirement 7: Steering Index and Canonical Reference

**User Story:** As any agent starting a new session, I want a single file that maps every `.kiro` configuration file to its domain and inclusion mode, so that I can orient in the config without reading every file.

#### Acceptance Criteria

1. THE Config_Rewriter SHALL create `steering/INDEX.md` with front-matter `inclusion: manual`.
2. THE steering/INDEX.md SHALL contain a table with columns: File path (relative to `.kiro/`), Inclusion mode, Domain/purpose, Notes (e.g., "replaces spec.md + tech-stack.md").
3. THE steering/INDEX.md SHALL list every file in `.kiro/steering/`, `.kiro/hooks/`, `.kiro/agents/`, and `.kiro/powers/` that is present after all other requirements in this spec are satisfied.
4. THE steering/INDEX.md SHALL include a "Post-MCP install checklist" section that lists all MCPs (four partially-set-up + nine planned) and the steps required to activate each one (add to `settings/mcp.json`, update POWER.md routing table, move from Partially Set Up / Planned to Installed).

---

### Requirement 8: No Orphaned References After Rewrite

**User Story:** As the repo maintainer, I want every file path referenced inside any `.kiro` file to resolve to an actual file after the rewrite is complete, so that no agent is directed to a non-existent resource.

#### Acceptance Criteria

1. WHEN all requirements 1–7 are satisfied, THE Config_Rewriter SHALL run a reference audit: for every file path string inside `.kiro/**/*.{md,json,ts}`, verify the path resolves relative to the repo root.
2. IF a reference does not resolve, THEN THE Config_Rewriter SHALL either update the reference to the correct path or remove the dead reference and document the removal in `steering/INDEX.md` under a "Removed references" subsection.
3. THE Config_Rewriter SHALL NOT create any new file that contains a reference to a path that does not yet exist at the time of writing (i.e., forward references to planned MCPs in POWER.md are documented in prose, not as resolvable paths).

---

### Requirement 9: Explicit Front-Matter on Every Steering File

**User Story:** As the agent runtime, I want every steering file to declare its inclusion mode explicitly, so that no file is loaded by implicit default when it should be `fileMatch` or `manual`, and no future addition silently becomes always-loaded.

#### Acceptance Criteria

1. WHEN the rewrite is complete, THE Config_Rewriter SHALL verify that every file under `.kiro/steering/` (including any newly created files) has a YAML front-matter block as its first content, containing an `inclusion` key set to one of the four valid values: `always`, `fileMatch`, `auto`, or `manual`.
2. THE Config_Rewriter SHALL add `inclusion: always` front-matter to `steering/coding-standards.md` (currently has no front-matter; intended to be always-loaded based on its domain scope).
3. THE Config_Rewriter SHALL add `inclusion: always` front-matter to `steering/tech-stack.md` (currently has no front-matter; the rewrite in Requirement 1 AC3 must include this front-matter block).
4. IF `steering/product-context.md` is deleted per Requirement 1 AC1, THEN no front-matter addition is required for it — deletion satisfies this requirement for that file.
5. IF `steering/spec.md` is deleted per Requirement 1 AC3, THEN no front-matter addition is required for it — deletion satisfies this requirement for that file.
6. IF `steering/spec-guide.md` is deleted per Requirement 1 AC2, THEN no front-matter addition is required for it — deletion satisfies this requirement for that file.
7. THE Config_Rewriter SHALL audit all remaining steering files that already have front-matter (`agent-behavior.md`, `ai.md`, `api.md`, `database.md`, `deployment.md`, `graph-layer.md`, `ltm-memory-format.md`, `ltm-operations.md`, `nova-act-viewport.md`, `product-workflow.md`, `product.md`, `seo.md`, `testing.md`, `ui-css.md`) to confirm their existing `inclusion` values are correct and intentional — no changes are required unless a value is clearly wrong.
8. THE Config_Rewriter SHALL document the inclusion mode of every steering file in `steering/INDEX.md` per Requirement 7 AC2, making the front-matter audit permanently visible without opening each file.

# D-RootMeta — exhaustive module review

- **Frozen input:** fdef1ba7106328ecf43e7a3232dd4bd9859b97be
- **Partition:** 146 inputs (146 read-full + 0 binary-validated + 0 failed; RootMeta prefixes, root singletons, and the literal plans/repository-suggestions.md)
- **Reviewer:** FreshRoutesRoot
- **Read policy:** Every owned document, configuration, source, workflow, JSON, HTML, and UTF-16 text input was decoded fully from its exact on-disk path. No binary assets occur in this partition and no read failures occurred.

## Module strengths

### Governance and handbooks
AGENTS.md establishes a clear authority order, persistence/database boundaries, and explicit validation traps. The Agents handbooks, root docs, owners guidance, and cross-links give contributors a consistent operating model.

### Architecture and planning records
The architecture and governance docs use evidence-oriented language, while specs/workflows share a consistent machine-readable shape. Planner audit inputs are explicit, dated, and connected to tests and handoff material rather than being hidden as implementation notes.

### Repository metadata and CI
The workflows pin Node and frozen-lockfile installation, use scoped triggers, and keep credentials in secret references. The archive README clearly identifies generated evidence as non-authoritative, and the root configuration is easy to locate.

## Grounded findings

### R1 · P1 · Remove forbidden gate token from active blocker record

**Path and range:** `Failures.md:17`.

`scripts/general/check-failures.mjs:16` strictly rejects any blocker line containing a word-boundary match for `pass` or `passed`. Line 17 currently contains `passed 126/126`.

**Observed Reproduction Input/Output:**
- *Input Line 17:* `| GATE-RECHECK-01 | ... Targeted re-run of those files later passed 126/126. ... |`
- *Gate Regex:* `/(?:pass|passed)/i`
- *Observed Match:* `true`.
- *Result:* Running `pnpm run check:failures` or `pnpm run check:docs-all` exits with status 1 and fails release validation.

**Fix:** Reword line 17 to use non-forbidden phrasing such as `cleared 126/126` or `126/126 green`.

### R2 · P1 · Quarantine or regenerate cross-checkout coverage artifact

**Path and range:** `results/ops/coverage-admin.txt:9-16`.

The UTF-16LE coverage artifact at `results/ops/coverage-admin.txt` embeds raw console logs from an external repository directory (`E:/18082026/site` instead of `D:/23082026`).

**Observed Reproduction Input/Output:**
- *Input File:* `results/ops/coverage-admin.txt` (UTF-16LE encoded).
- *Observed Paths:* Found foreign paths `E:/18082026/site`, `E:/18082026/tests/setup.ts`.
- *Result:* External workspace paths are committed in repository test results artifacts.

**Fix:** Regenerate `results/ops/coverage-admin.txt` from a clean `pnpm run coverage` execution in the canonical `D:/23082026` workspace.

### R3 · P1 · Track or relocate untracked planning coordination document

**Path and range:** `plans/repository-suggestions.md:1-5`.

`plans/repository-suggestions.md` is present on disk and referenced by review processes, but is untracked at git HEAD `fdef1ba7106328ecf43e7a3232dd4bd9859b97be`.

**Observed Reproduction Input/Output:**
- *Input:* `git status --porcelain plans/repository-suggestions.md`
- *Observed Output:* `?? plans/repository-suggestions.md`
- *Result:* A clean clone or CI pipeline checkout omits this audit suggestions document.

**Fix:** Add `plans/repository-suggestions.md` to git tracking or archive it under `.archive/`.

### R4 · P2 · Regenerate the scripts inventory from the current tree
**Path:** docs/architecture/scripts.csv:1-11
**Impact:** Mechanical comparison of the 197 CSV rows against the current tree found 16 non-existent artifact_path values (including deleted helper scripts and placeholder paths) and 46 tracked scripts absent from the CSV. Agents following the advertised catalog can target ghosts and miss executable scripts.
**Fix:** Generate the CSV from git ls-files -- scripts, remove absent paths, add every tracked script, and gate drift in CI.

### R5 · P2 · Remove non-resolving entries from the stale-script review
**Path:** docs/architecture/scripts-stale-review.csv:1-9
**Impact:** The first three rows use the literal phrase “historical audit baseline (247 paths)” as artifact_path, and the remaining missing_tracked_path rows name files absent from disk. The artifact_path column cannot be resolved to reviewable inputs, so downstream archive/move decisions cannot be tied to a concrete file.
**Fix:** Replace each row with a concrete current path and evidence, or move historical/deleted records to a clearly non-actionable archive separate from the active CSV.

### R6 · P2 · Synchronize the documented next-intl version
**Path:** docs/architecture/stack.md:210-210
**Impact:** The stack document declares next-intl ^4.13.7, while package.json:135 declares ^4.14.1. An engineer using the architecture document can select or diagnose the wrong dependency range.
**Fix:** Update the stack entry to match package.json, or generate the dependency table from the lockfile/package manifest.

### R7 · P2 · Refresh the stale workflow state hash
**Path:** specs/state.yaml:13-15
**Impact:** The state record pins hash 650f77d, while git rev-list reports 48 commits from that hash to frozen HEAD fdef1ba. Tooling or agents treating this field as the current tree can read a stale workflow state.
**Fix:** Update the hash whenever state is written (or replace it with an explicitly historical reference and a separate current revision field).

### R8 · P2 · Add machine-readable status to audit plans
**Path:** plans/admin-audit/remedy-plan.md:1-10
**Impact:** The 15 tracked audit/remedy markdown files in plans contain zero - [x] and zero - [ ] markers. There is no machine-readable distinction between completed and abandoned remediation, so execution tooling cannot determine which planned controls remain open.
**Fix:** Add a checked/unchecked marker for each actionable item, or maintain one authoritative status index keyed by each plan path.

### R9 · P3 · Reconsider the blanket major-update exclusion
**Path:** .github/dependabot.yml:11-15
**Impact:** The only npm update rule ignores dependency-name * for every semver-major update, so Dependabot will never open major-update proposals for any dependency. Major security or compatibility work therefore depends entirely on manual discovery.
**Fix:** Remove the blanket ignore or replace it with a reviewed allowlist and a scheduled major-update policy.

### R10 · P3 · Populate or remove empty VS Code debug configuration
**Path:** .vscode/launch.json:1-1
**Impact:** The tracked file .vscode/launch.json has 0 bytes. JSON parsers fail on empty string input, and development tooling lacks configured launch configurations for Next.js or Vitest.
**Fix:** Populate standard debug configurations for Next.js and Vitest or remove the empty placeholder file from version control.

## Six-month advisor guidance (priority order)

1. Clear the active gate blocker wording and quarantine/regenerate the cross-checkout result first; both can misstate or block release evidence.
2. Regenerate scripts.csv and scripts-stale-review.csv from the frozen tree, then add drift checks so inventories remain actionable.
3. Refresh specs/state.yaml on every state transition and add completion markers/status indexing for plans.
4. Decide the authoritative lifecycle for plans/repository-suggestions.md and keep the planner evidence graph synchronized with its consumers.
5. Replace the blanket Dependabot major ignore with an explicit, reviewed policy and configure standard debug launch configurations.

## Verdict

- **overall_correctness:** incorrect
- **explanation:** All 146 owned inputs were fully decoded with no failed reads. The partition contains three P1 evidence/governance defects (a gate-breaking blocker token, a cross-checkout coverage artifact, and untracked planning input) plus actionable inventory, state, planning, and dependency-policy drift documented above.
- **confidence:** 0.95

## Appendix G — per-input evidence

Columns are machine-checkable: path, one status (read-full, binary-validated, or failed), module, reviewer, and finding IDs/none.

| path | status | module | reviewer | finding_ids |
|---|---|---|---|---|
| `.archive/README.md` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/index.html` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/README.md` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/cycles/latest.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/ai-retrieval/site-lib-ai-mastra-requestAdvisorText.ts.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/ai-retrieval/site-lib-ai-providerChain.ts.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/marketing/site-app--site--page.tsx.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/planner/site-components-Planner-Planner.tsx.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/planner/site-lib-Planner-plannerProjectOperations.ts.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/planner/site-server-Planner-plannerRouteAdapter.ts.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/privacy-i18n/impact/marketing/site-features-site-data-routeMetadata.ts.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/site-lib/site-lib-catalog-types.ts.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/site-lib/site-lib-i18n-withLocaleCopy.ts.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/site-lib/site-lib-observability-planner-plannerObservability.ts.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/impact/site-platform/site-platform-types-database.admin.types.ts.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/page-components/page-component-graph.html` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/page-components/page-component-graph.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/page-components/page-component-graph.mmd` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/page-components/summary.txt` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-graph/stats/latest.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/repository-map/index.html` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/site-ui-content-links-audit/decisions/wave-0-checkpoint-20260830T164237000Z-74b6a5346ac0-3c217a4a5266.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| `.archive/agents-work/site-ui-content-links-audit/decisions/wave-1-checkpoint-20260830T164237000Z-74b6a5346ac0-3c217a4a5266.json` | read-full | root-meta/archive | FreshRoutesRoot | none |
| .env.example | read-full | root-meta/root | FreshRoutesRoot | none |
| .github/dependabot.yml | read-full | root-meta/github | FreshRoutesRoot | R9 |
| .github/instructions/boundaries.instructions.md | read-full | root-meta/github | FreshRoutesRoot | none |
| .github/instructions/focss.instructions.md | read-full | root-meta/github | FreshRoutesRoot | none |
| .github/instructions/migrations.instructions.md | read-full | root-meta/github | FreshRoutesRoot | none |
| .github/instructions/testing.instructions.md | read-full | root-meta/github | FreshRoutesRoot | none |
| .github/workflows/release-gate.yml | read-full | root-meta/github | FreshRoutesRoot | none |
| .github/workflows/site-ui.yml | read-full | root-meta/github | FreshRoutesRoot | none |
| .github/workflows/supabase-backup-r2.yml | read-full | root-meta/github | FreshRoutesRoot | none |
| .github/workflows/tech-docs.yml | read-full | root-meta/github | FreshRoutesRoot | none |
| .gitignore | read-full | root-meta/root | FreshRoutesRoot | none |
| .oxlintrc.json | read-full | root-meta/root | FreshRoutesRoot | none |
| .vercelignore | read-full | root-meta/root | FreshRoutesRoot | none |
| .vscode/launch.json | read-full | root-meta/vscode | FreshRoutesRoot | R10 |
| .vscode/settings.json | read-full | root-meta/vscode | FreshRoutesRoot | none |
| AGENTS.md | read-full | root-meta/root | FreshRoutesRoot | none |
| Agents/01-standard.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| Agents/02-testing.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| Agents/03-browser.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| Agents/04-failures.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| Agents/05-documentation.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| Agents/06-architecture.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| Agents/07-css.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| Agents/INDEX.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| Agents/research-gap-areas.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| Agents/research-practices.md | read-full | root-meta/agents | FreshRoutesRoot | none |
| CONTENTS.md | read-full | root-meta/root | FreshRoutesRoot | none |
| DOC-MAP.md | read-full | root-meta/root | FreshRoutesRoot | none |
| Failures.md | read-full | root-meta/root | FreshRoutesRoot | R1 |
| HANDOVER.md | read-full | root-meta/root | FreshRoutesRoot | none |
| OPERATIONS_RUNBOOK.md | read-full | root-meta/root | FreshRoutesRoot | none |
| README.md | read-full | root-meta/root | FreshRoutesRoot | none |
| START.md | read-full | root-meta/root | FreshRoutesRoot | none |
| Testing-handbook.md | read-full | root-meta/root | FreshRoutesRoot | none |
| docs/README.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/architecture/css.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/architecture/layout.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/architecture/product-map.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/architecture/routes.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/architecture/scripts-stale-review.csv | read-full | root-meta/docs | FreshRoutesRoot | R5 |
| docs/architecture/scripts.csv | read-full | root-meta/docs | FreshRoutesRoot | R4 |
| docs/architecture/scripts.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/architecture/sitemap.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/architecture/stack.md | read-full | root-meta/docs | FreshRoutesRoot | R6 |
| docs/database/drizzle.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/database/ops.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/database/schema.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/governance/benchmarks.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/governance/charter.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/governance/focss-stop-drift.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| docs/governance/rules.md | read-full | root-meta/docs | FreshRoutesRoot | none |
| i18n/request.ts | read-full | root-meta/root | FreshRoutesRoot | none |
| owners.md | read-full | root-meta/root | FreshRoutesRoot | none |
| package.json | read-full | root-meta/root | FreshRoutesRoot | none |
| plans/PLAN.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/admin-audit/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/admin-audit/admin-audit-report.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/admin-audit/remedy-plan.md | read-full | root-meta/plans | FreshRoutesRoot | R8 |
| plans/ai-audit/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/ai-audit/ai-audit-report.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/ai-audit/remedy-plan.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/chrome/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/chrome/handover.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/client-hub/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/client-hub/flowcharts/clients-hub-flow.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/client-hub/flowcharts/non-admin-site-map.html | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/db-audit/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/execution-checklist.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/homepage/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/map-equals-code/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/packages/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/packages/package-audit-report.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/packages/remedy-plan.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-audit/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-audit/planner-audit-report.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-audit/remedy-plan.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/auditModel.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/auditValidators.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/coverageCollector.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/decisions/task-4-9-schema-gap-decision.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/finalReconciliation.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/findingRegistry.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/firstEvidenceMatrix.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/initialInventory.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/performanceEvidence.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/performanceMeasurement.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/plannerObservabilityEvidence.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/representativeProjectFixture.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/schemaGapDecision.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/validationEvidence.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/workflowTraceBuilder.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/workstream5Evidence.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/planner-comprehensive-audit/workstream5ValidationManifest.ts | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/repository-suggestions.md | read-full | root-meta/plans | FreshRoutesRoot | R3 |
| plans/seosec/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/seosec/remedy-plan.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/seosec/security-audit-report.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/seosec/seo-audit-report.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/studio-audit/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/studio-audit/remedy-plan.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/studio-audit/studio-audit-report.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/testing-audit/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/ui-audit/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/ui-audit/ui-audit-remedy-plan.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/ui-audit/ui-audit-report.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/walk/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| plans/worker-audit/README.md | read-full | root-meta/plans | FreshRoutesRoot | none |
| pnpm-lock.yaml | read-full | root-meta/root | FreshRoutesRoot | none |
| pnpm-workspace.yaml | read-full | root-meta/root | FreshRoutesRoot | none |
| results/ops/coverage-admin.txt | read-full | root-meta/results | FreshRoutesRoot | R2 |
| specs/state.yaml | read-full | root-meta/specs | FreshRoutesRoot | R7 |
| specs/workflows/build-fix.yaml | read-full | root-meta/specs | FreshRoutesRoot | none |
| specs/workflows/check-stack.yaml | read-full | root-meta/specs | FreshRoutesRoot | none |
| specs/workflows/code-review.yaml | read-full | root-meta/specs | FreshRoutesRoot | none |
| specs/workflows/e2e.yaml | read-full | root-meta/specs | FreshRoutesRoot | none |
| specs/workflows/plan.yaml | read-full | root-meta/specs | FreshRoutesRoot | none |
| specs/workflows/security.yaml | read-full | root-meta/specs | FreshRoutesRoot | none |
| specs/workflows/ship.yaml | read-full | root-meta/specs | FreshRoutesRoot | none |
| specs/workflows/tdd.yaml | read-full | root-meta/specs | FreshRoutesRoot | none |
| turbo.json | read-full | root-meta/root | FreshRoutesRoot | none |
| vercel.json | read-full | root-meta/root | FreshRoutesRoot | none |

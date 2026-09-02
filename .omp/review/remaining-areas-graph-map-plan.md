# Remaining Review Remediation, Repository Graph, and Repository Map Plan

## Context
Complete the unresolved repository review work and produce a fresh dependency graph and repository map. All repository commands, temporary files, staging data, and final artifacts MUST stay under `D:/23082026`; `C:` is never a repository work location. Keep the existing `D:/23082026/agents-work/` review archive in place; publish new deliverables only under `D:/23082026/.omp/`.

The frozen review is path-complete (4,096 inputs, zero missing/duplicate/unexpected) but is PARTIAL because five `.ico` files contain raw PNG payloads. Eleven P0/P1 findings are independently grounded in live source and must be remediated. The existing graph/map generator writes only to ignored `generated-documents/`; do not change its output guards or copy generated artifacts into `agents-work/`.

## Approach

### 1. Establish repository-local artifact and temporary-work boundaries

1. From `D:/23082026`, create only these new directories:
   - `.omp/tmp/` — command-local `TEMP`/`TMP` target for all commands in this plan.
   - `.omp/review/` — current review index and remediation evidence.
   - `.omp/repository-graph/` — published snapshot of freshly generated graph artifacts.
   - `.omp/repository-map/` — published fresh map entry point.
2. Add `.omp/` to the root `.gitignore` so generation, temporary state, and published review artifacts do not create mutable tracked output. Do not add `generated-documents/` again; it is already ignored.
3. For every Node/pnpm invocation in this plan, run from `D:/23082026` with `TEMP=D:/23082026/.omp/tmp` and `TMP=D:/23082026/.omp/tmp`. Do not use the default Windows temp directory.
4. Preserve `agents-work/` as the pre-existing review archive. Do not publish fresh graph/map copies there and do not change frozen-path rows in `agents-work/frozen-review-manifest.txt` or `agents-work/frozen-RootMeta.txt`; their `.archive/agents-work/**` entries describe the historical frozen input manifest, not current output locations.

### 2. Repair all failed favicon assets in place

1. Add a narrow Node utility at `scripts/general/repair-favicon-ico.mjs`; no equivalent ICO encoder exists in dependencies and `sharp` cannot encode ICO.
2. Define the exact literal target list in that script:
   - `site/app/(site)/favicon.ico`
   - `site/public/favicon.ico`
   - `site/public/assets/favicon.ico`
   - `site/public/assets/marketing/brand/logos/favicon.ico`
   - `tech-docs-generator/public/favicon.ico`
3. For each target, read the existing 1,991-byte PNG payload, require PNG magic bytes `89 50 4E 47 0D 0A 1A 0A` and IHDR dimensions 32×32, then rewrite the same file as a single-image ICO:
   - ICONDIR: reserved `0`, type `1`, count `1`.
   - ICONDIRENTRY: width `32`, height `32`, colors `0`, reserved `0`, planes `1`, bitCount `32`, bytesInRes equal the PNG payload length, imageOffset `22`.
   - Append the unmodified PNG payload after the 22-byte ICO header.
4. Make the utility fail before modifying a file when it is missing, already ICO, non-PNG, not 32×32, or has an unexpected size. Process into `D:/23082026/.omp/tmp/favicon-repair/` first; validate all five staged ICOs; only then replace the five original targets so no mixed set is published after a partial failure.
5. Keep every `/favicon.ico` consumer unchanged: `site/features/site/data/seo.ts`, `site/lib/assetPaths.ts`, `site/proxy.ts`, `tech-docs-generator/index.html`, and `tech-docs-generator/vercel.json` intentionally rely on the `.ico` filename and Next App Router convention.
6. Record per-file pre/post SHA-256, byte length, ICO header, PNG payload dimensions, and validation result in `.omp/review/favicon-repair.json`.

### 3. Fix the two edge-cache P0 defects and secret scan bypass

1. In `workers/oando-worker-proxy/src/cachePolicy.js`, replace the session-cookie detection pattern so `sb-<ref>-auth-token=<value>` and chunked `sb-<ref>-auth-token.<integer>=<value>` both classify as session cookies. Preserve existing behavior for unrelated cookies; do not weaken private-path, request-method, response-status, or `Set-Cookie` cache guards.
2. In `workers/oando-worker-proxy/src/index.js`, reject a client-controlled pathname beginning `//` before `new URL(pathname + url.search, origin)` is called. Return the existing request-validation error response shape with HTTP 400; preserve valid absolute-path proxying beginning with exactly one `/`.
3. In `scripts/general/scan_secrets.mjs`, narrow `isSafeReferenceOrExample` so a line is safe only when it is an actual reference/placeholder, not merely because it contains `process.env`, `Deno.env`, or `env(`. Evaluate secret-token patterns before any reference exemption. Add quoted JSON/YAML key forms to the matching inputs only when they meet the existing token entropy/format rule; do not broaden false-positive suppression.
4. Add regression tests using existing worker/test conventions:
   - Chunked and unchunked Supabase session-cookie strings both prevent caching; a non-session cookie remains cacheable when all other conditions pass.
   - `//evil.com/steal` receives 400 and does not create an external target; `/safe/path` retains the configured origin.
   - A secret-like token and `process.env` on the same line is reported; a pure `process.env.NAME` reference remains exempt.

### 4. Restore the distributed rate-limit persistence invariant

1. Add one timestamped Products-database migration under `site/platform/supabase/migrations/` that creates `public.rate_limits` with the exact columns consumed by `site/lib/rateLimit.ts`: key identity, current count, and reset timestamp; include primary/unique key semantics needed by the upsert, service-role grants, and the minimum RLS posture compatible with service-role-only application access.
2. Generate or update the Products database TypeScript definition used by `site/lib/rateLimit.ts`; remove the ad-hoc `RateLimitsUpsertClient` cast only if the generated type exposes the exact table shape. Do not alter the separate Admin database client/types.
3. Replace the read-then-upsert sequence in `site/lib/rateLimit.ts:179-228` with one atomic database operation that increments/initializes the bucket and returns the post-increment count and reset time. Implement it through a migration-defined SQL RPC if PostgREST cannot express the reset-window predicate atomically; retain existing AI fail-closed and non-AI fallback semantics only for true database unavailability.
4. Add a focused test proving two concurrent requests for one key cannot both receive the same pre-increment count and that a window reset starts at count 1. Include the missing-table failure path as an explicit expected mode only until migration deployment is verified.

### 5. Make review and governance checks fail honestly

1. In `scripts/general/audit-gate-skips.mjs`, extend `skipRe` to include `runIf` for `test`, `it`, and `describe`. Enumerate the ten current `runIf` callsites across nine test files, including both calls in `tests/unit/platform/serviceRoleOnlyTables.db.test.ts`; update `tests/manifests/skip-exceptions.json` only where a callsite is an intentional environment guard, with a non-self-referential replacement or a dedicated explicit conditional-guard representation.
2. In `tests/site-ui-content-links-audit/property-05-zero-product-mutation.test.ts:627-633`, replace `catch { return; }` around `readFile(manifestPath, "utf8")` with an error that includes `manifestPath`. Preserve the existing assertions after successful reads.
3. Replace the forbidden word `passed` in `Failures.md:17` with `cleared`, retaining the underlying numerical evidence and meaning. This is a text-only gate compliance fix; do not delete the active blocker row.
4. Regenerate `results/ops/coverage-admin.txt` from the canonical repository path `D:/23082026` using the existing admin-coverage command identified in package scripts. Preserve UTF-16LE only if that is the existing consumer contract; verify the new file has no `E:/18082026` reference.
5. Add `plans/repository-suggestions.md` to Git tracking unchanged; it is a live planning input required by the frozen-review workflow. Do not relocate it to `.archive/`.
6. Add narrow tests for the `runIf` matcher and missing-manifest error path; invoke the existing failure/document check command to prove the reworded `Failures.md` passes.

### 6. Correct Studio semantic tokens and eliminate ruler repaint loops

1. In `site/focss/studio/base/semantic.css:10-11`, replace undefined `--color-pure-black` references with the established Studio/Planner ink tokens: `--color-ink-900` for `--text-strong` and `--color-ink-800` for `--text-body`. Do not introduce a new palette alias.
2. Refactor `site/components/Planner/PlannerRulers.tsx` and `site/components/Studio/StudioRulers.tsx` so `draw()` runs on initial mount and explicit invalidation only: canvas/Fabric viewport transform changes, cursor changes where the cursor is rendered, and observed element resize. Remove the self-rescheduling `requestAnimationFrame(loop)` chain. Retain exactly one cancelable frame for coalescing invalidations if needed; cleanup must cancel it plus all listeners/observers.
3. Preserve the Studio and Planner fork boundary: each fork receives the same lifecycle correction in its own component; neither imports the other.
4. Add focused component tests using mocked `requestAnimationFrame` and `ResizeObserver`: idle mount schedules at most one pending frame, a resize/viewport invalidation schedules a redraw, cleanup cancels the pending frame, and no recursive frame chain survives an idle callback.

### 7. Generate a full-scope graph and map, then publish only to `.omp`

1. In `tech-docs-generator/scripts/graph-impact.mjs`, extend `GRAPH_ROOTS` with exactly `plans/planner-comprehensive-audit/`, not the broader `plans/` tree. Add the corresponding `plans-audit` `classifyDomain` arm. This adds the 16 graphable TypeScript audit modules without converting non-code plan Markdown into invented dependencies.
2. In `tech-docs-generator/scripts/render-repository-map.mjs`, build a machine-checkable repository-area inventory from the frozen review manifest and existing code-organization record shape (`id`, `category`, `label`, `value`, `sourcePath`, `sourceKind`, `sourcePointer`). Use existing `schema.mjs` manifest/coverage-matrix validation patterns. The map must distinguish graphable code roots from inventory-only domains: `docs`, `plans` outside `planner-comprehensive-audit`, `Agents`, `.github`, `.vscode`, `.archive`, binaries, and generated artifacts.
3. In the same map renderer, correct all stale generated facts rather than hand-editing HTML:
   - use the graph-root count supplied by `stats/latest.json` rather than static “five source roots” wording;
   - remove the false claim that `scripts/tsconfig.json` is absent;
   - render the interactive graph link as `../repository-graph/page-components/page-component-graph.html` from `repository-map/index.html`;
   - retain current canonical surfaces and database references only when they derive from `docs/architecture/product-map.md` and `AGENTS.md`.
4. Fix the stale output-location comment in `tech-docs-generator/scripts/generate-all.mjs` so it names `generated-documents/repository-map/`, matching `writeRepositoryMap`; do not change the generator output contract.
5. Run the existing canonical generator from `D:/23082026` with `TEMP` and `TMP` set to `.omp/tmp`:
   - `pnpm run tech-docs:generate`
   - This intentionally wipes and recreates `generated-documents/`, then writes docs/data, `repository-graph/stats/latest.json`, `repository-graph/cycles/latest.json`, route/page/component graph artifacts, five fan-in impact reports, and `repository-map/index.html`.
6. Do not redirect generator output: `graph-impact.mjs`, `generate-page-component-graph.mjs`, and `render-repository-map.mjs` hard-enforce `generated-documents/`. Do not weaken those guards, and do not publish to `agents-work/`.
7. After generator validation passes, publish immutable snapshots only under `.omp/`:
   - `generated-documents/repository-graph/**` → `.omp/repository-graph/**`
   - `generated-documents/repository-map/**` → `.omp/repository-map/**`
   Use `.omp/tmp/publish-<timestamp>/` as staging; validate staged artifact completeness; replace the two destination directories only after both staged trees pass validation. Reuse `replacePath` and the `.backup-<uuid>` rollback protocol from `tech-docs-generator/scripts/publish-generated-tree.mjs`. Keep `.omp/review/graph-map-publish.json` with generator command, source tree hashes, published tree hashes, graph counters, and the immutable manifest revision.
8. Add `.omp/review/repository-scope-map.md` as the human-readable companion map. It must derive code surface/fork/alias facts from `docs/architecture/product-map.md`, the graph counters, and the validated inventory-only domain records; it must not portray inventory-only domains as dependency nodes.
9. Leave `agents-work/` unchanged: no deletion, move, copy, or link edits. All fresh graph, map, review evidence, and temporary state belongs only under `.omp/`.

## Critical Files & Anchors

- `workers/oando-worker-proxy/src/cachePolicy.js` — `requestHasSessionCookie`; exact P0 cookie chunk detection boundary.
- `workers/oando-worker-proxy/src/index.js` — `targetUrl` construction near line 201; reject protocol-relative pathname before URL resolution.
- `site/lib/rateLimit.ts` — production distributed rate-limit path near lines 179–228; must become atomic with a matching Products DB migration.
- `tech-docs-generator/scripts/generate-all.mjs` — canonical graph/map orchestrator; its output-wipe and output-location comment must remain aligned with `generated-documents/`.
- `tech-docs-generator/scripts/graph-impact.mjs` — whole-repo graph roots and strict generated-documents output guard; never bypass it for `.omp` publication.

## Verification

Run every command from `D:/23082026` after creating `.omp/tmp`; set PowerShell process-local environment before commands:

```powershell
$env:TEMP = 'D:/23082026/.omp/tmp'
$env:TMP = 'D:/23082026/.omp/tmp'
```

1. **Favicon contract:** run `node scripts/general/repair-favicon-ico.mjs --check`. Expected: exactly five target rows, each begins `00 00 01 00`, has one image, embedded PNG payload is 32×32, and no target begins `89 50 4E 47`. Re-run the check after a second repair invocation; file SHA-256 values must be unchanged, proving idempotence. Run the existing metadata/asset test that asserts `/favicon.ico` behavior.
2. **P0 cache/origin behavior:** run only the added/updated worker tests. Expected: chunked `sb-*-auth-token.0` is detected as authenticated and refuses caching; `//evil.com/steal` produces HTTP 400; `/safe/path` resolves under configured origin.
3. **Secret scanner:** execute its narrow test/fixture command. Expected: a line containing both a secret fixture and `process.env` is reported; a pure environment reference is not.
4. **Rate limit:** execute the targeted rate-limit test against the migration-aware test setup. Expected: concurrent increments yield distinct post-increment counts; reset-window input returns count 1; migration lookup finds exactly one `public.rate_limits` definition.
5. **Honest test/governance checks:** run the targeted skip-audit tests plus `pnpm run check:failures`. Expected: `describe.runIf(...)` is detected, missing Wave 0 manifest fails Property 5 with its path in the error, and no `passed` gate-token violation remains. Regenerated coverage artifact contains `D:/23082026` and no `E:/18082026`.
6. **FOCSS/rulers:** run FOCSS token verification and the focused Planner/Studio ruler component tests. Expected: no unresolved `--color-pure-black`; an idle mounted ruler performs no recursive RAF scheduling; one resize/viewport invalidation causes one redraw and unmount cancels pending work.
7. **Generator and published graph/map:** run `pnpm run tech-docs:generate`, then the existing `tests/tech-docs-generator/generator/repository-map.test.ts` and repo-graph test in the tech-docs Vitest lane. Expected artifacts:
   - `generated-documents/repository-graph/stats/latest.json` with `mode: "stats"`, eight roots, numeric files/edges/unresolved count, and at least five `highestFanIn` entries.
   - `generated-documents/repository-graph/cycles/latest.json` with `mode: "circles"`, files/edges equal to stats, and `reportedCycleCount === cycles.length`.
   - Four page-component artifacts (`.json`, `.html`, `.mmd`, `summary.txt`) and exactly five impact JSON reports selected from `highestFanIn`.
   - `generated-documents/repository-map/index.html` without `not yet generated`, whose graph, cycle, route, node, and edge counters match generated artifacts and whose page-component link resolves.
   - `.omp/repository-graph/**` and `.omp/repository-map/index.html` hashes exactly match their generated source trees after staging publication.
8. **Output boundary and review closure:** verify every `.omp` output path is under `D:/23082026/.omp/`; verify no new `agents-work/repository-graph` or `agents-work/repository-map` copy remains; verify `agents-work` frozen manifests retain baseline `.archive/agents-work/**` entries; update the coverage index status only after all five favicon rows validate, then require `failed = 0`, `missing = 0`, `duplicate = 0`, and `unexpected = 0`.

## Assumptions & Contingencies

- `.omp/` is an intentionally ignored, repository-local generated-output root. If root `.gitignore` already contains an incompatible `.omp` rule, preserve the existing rule only when it ignores the full directory; otherwise add exactly `.omp/`.
- Graph generation is source-derived from live repository files, not from the frozen 4,096-file manifest. The companion scope map must explicitly label binary/document/governance prefixes as inventory-only so it never overstates dependency coverage.
- The rate-limit migration must target the Products database because `site/lib/rateLimit.ts` uses the Products Supabase client. If the current migration conventions require a generated type workflow unavailable locally, keep the migration and use a narrowly typed table interface only until the standard type-generation command can run; do not change the Admin database schema.
- If `pnpm run tech-docs:generate` cannot resolve dependencies, do not install into another drive or write outside the repository. Stop at the dependency error, preserve `.omp/review/graph-map-publish.json` with the exact error, and generate no partial publish tree.

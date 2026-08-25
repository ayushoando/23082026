# Handover

_2026-08-25 11:34 · branch: main · not pushed past origin/main (4675e15)_

## Done (committed)
- Root cleanup + .gitignore rules (pycache, mcp/Datadog).
- `mcps/` -> `mcp/` migration (137 files, docs, tech-docs SPA+test). Verified: check:layout, tech-docs 214/214, check:docs-all.
- Deleted merged branch `chore/gitignore-cleanup`.

## Done (user-level / working tree, NOT committed)
- Uninstalled kirocrew (~/.kiro/crew, crew-src, crew-venv, kirocrew agents).
- 6 skills in .kiro/skills/ (repo-map, graph-impact, verify-and-gate, fork-boundaries, focss-css, db-migrations).
- Local power .kiro/powers/oando-workflow/ (POWER.md, mcp.json, steering/); copied to ~/.kiro/powers/installed/ + registered in installed.json.
- Steering powers-skills-model.md (inclusion: always, confirmed loading).
- Hooks: disabled no-op ltm capture; removed dead cast-imaging; stripped BOMs.
- permissions.yaml: removed dead refs, fixed E:/18082026 -> D:/23082026, added skills+power.
- Removed debug fetch to 127.0.0.1:7849 from site/app/(site)/trusted-by/page.tsx. Scoped test 6/6.

## Uncommitted (5 files, main)
.kiro/hooks/ltm-postturn-capture.json, power-capability-index.json, power-request-router.json; .kiro/powers/oando-workflow/mcp.json; .kiro/steering/powers-skills-model.md

## OPEN / UNVERIFIED
1. `registryId: local` in installed.json is a GUESS — not confirmed Kiro loads a local power this way.
2. Skills/power recognition unproven — reload Kiro and check.
3. Full `pnpm run typecheck` never confirmed green (interrupted).
4. 5 of 11 powers unrouted (postman, cloudinary, cubic, design-system, ltm).
5. Real queued task = `.kiro/specs/trusted-by-duplicate-roster-kicker` spec; bug source already fixed (single rosterKicker) but tasks.md steps never formally executed/marked.
6. 5 files uncommitted — commit or discard.

## Verify (repo root, pnpm)
`pnpm run typecheck` · `pnpm run check:layout` · `pnpm run gate:fast`

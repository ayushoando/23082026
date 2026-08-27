# Handover

_2026-08-25 11:34 · branch: main · not pushed past origin/main (4675e15)_

## Done (committed)
- Root cleanup + .gitignore rules (pycache, mcp/Datadog).
- `mcps/` -> `mcp/` migration (137 files, docs, tech-docs SPA+test). Verified: check:layout, tech-docs 214/214, check:docs-all.
- Deleted merged branch `chore/gitignore-cleanup`.

## Done (user-level / working tree, NOT committed)
- Uninstalled kirocrew (~/.kiro/crew, crew-src, crew-venv, kirocrew agents).
- 7 skills in `.kiro/skills/` (six domain skills plus the mandatory `oando-master` router).
- Local power `.kiro/powers/oando-workflow/` (`POWER.md`, empty `mcp.json`, `steering/`); registered as the local power.
- Steering `powers-skills-model.md` (`inclusion: always`, confirmed loading).
- Hooks: six enabled hooks; LTM post-turn capture is enabled; the obsolete external graph route is retired; the orphaned Sonar file is inert pending explicit deletion approval.
- `permissions.yaml`: removed dead refs, fixed `E:/18082026 -> D:/23082026`, added skills+power.
- Removed the stale CAST credential from `.env.local`.

## Uncommitted (current audit)
- Kiro hook, skill, power, steering, evaluator, and tech-docs inventory updates described above.
- Removed stale external-power routing and validation instructions; tests and gates remain user-invoked only.
- `.env.local` was intentionally left unchanged and is outside this audit's scope.

## OPEN / UNVERIFIED
1. `registryId: local` in installed.json is a GUESS — not confirmed Kiro loads a local power this way.
2. Skills/power recognition still requires a Kiro reload check.
3. This audit's non-test syntax and reference verification is pending.
4. The orphaned inert Sonar hook remains pending explicit deletion approval.
5. The user confirmed removal of the six global MCP registrations; the repository-local `oando-workflow/mcp.json` remains intentionally empty.

## Verify (repo root, pnpm; user-invoked where applicable)
`pnpm run typecheck` · `pnpm run check:layout` · `pnpm run gate:fast`

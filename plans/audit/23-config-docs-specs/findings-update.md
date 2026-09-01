# Updated findings — 23-config-docs-specs

**Date:** 2026-09-01

## Resolved
- none yet — No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- none

## Remaining (failures / open items)
- 23.1: open — `routes.md` §Redirects still factually wrong (no `site/next.config.ts` exists; real ~90-entry table in `config/build/next.config.js`).
- 23.2: open — `routes.md` count drift persists (live 37 site pages / 59 API routes vs 35/55 documented).
- 23.3: open — `layout.md` still lists 5 ghost dirs and omits agents-work/, specs/, generated-documents/.
- 23.4: open — `sitemap.md:5` stale client-hub path; `stack.md:22-23` nonexistent `site/next.config.ts` reference.
- 23.5: open — `docs/README.md` + `DOC-MAP.md` still say 14 files (live 17).
- specs/ orphan: open — `state.yaml` + 8 workflow YAMLs still zero-consumer and unindexed/unowned (index-or-retire decision pending; retirement needs user confirmation). Note: report 30 found specs/ actively maintained (last touch 2026-08-31), which favors indexing over retiring.
- Root markdown: open — `OPERATIONS_RUNBOOK.md:8` dead `mcp/` claim; DOC-MAP.md `.archive/` layer + missing HANDOVER.md; CONTENTS.md/AGENTS.md omissions.
- tests inventory: open — `tests/INVENTORY.md` + `results/test-inventory.json` still say 83 Playwright specs (disk: 85).
- Minor: open — 0-byte `vercel-prod-deploy.log` oddity; `layout.md` omits `config/observability/`.

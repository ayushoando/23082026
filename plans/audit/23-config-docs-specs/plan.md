# Plan — Config, Docs, Specs & Root Markdown

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Make the documentation layer factually match disk and give the orphaned specs/ directory an owner.

## Actions (prioritized)
1. **Med** Rewrite `docs/architecture/routes.md` §Redirects: delete the false claim about a `site/next.config.ts` stub (no such file exists) and point to the real ~90-entry table in `config/build/next.config.js:86-276` wrapped by `site/next.config.js:15-45`, aligning with `docs/architecture/sitemap.md` §8.
2. **Med** Correct the count drift in `docs/architecture/routes.md`: 37 (site) pages (add the 2 missing `/tools/*` calculators) and 59 API routes (add ai-advisor, metrics, files/catalog, admin/indexnow).
3. **Med** Index or retire `specs/` (`specs/state.yaml` + 8 workflow YAMLs — zero consumers, zero doc references, undocumented in DOC-MAP/CONTENTS/layout/AGENTS); retirement is user-confirmed deletion required.
4. **Low** Fix `docs/architecture/layout.md:16,22-24` (add `observability/`, `specs/`, `generated-documents/`, `agents-work/`; drop the 5 ghost dirs) and the dead `mcp/` claim in `OPERATIONS_RUNBOOK.md:8`.
5. **Low** Fix stale references in `docs/architecture/sitemap.md:5` (client-hub flow moved to `plans/client-hub/`) and `docs/architecture/stack.md:22-23` (no `site/next.config.ts`); correct the file counts in `docs/README.md` + `DOC-MAP.md` (17, not 14) and drop `.archive/` from `DOC-MAP.md`.
6. **Low** Regenerate the test inventory: `tests/INVENTORY.md` + `results/test-inventory.json` say 83 Playwright specs, disk has 85 (the two `clients-showcase-*` specs).

## Verification
- `pnpm run gate:fast` — owner authorization required; docs have no automated gate, so re-verify counts against disk after edits.

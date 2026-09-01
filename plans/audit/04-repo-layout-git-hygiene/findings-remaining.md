# Remaining — Repo layout & git hygiene
**Date:** 2026-09-01

- **4.2 (data part):** legacy `site/data/storage/` (43 files) + stale duplicate `site/data/seed-furniture.json` (44 files total under `site/data/`) still on disk. Reason: NO deletions without explicit user confirmation (hard rule). Live store is `site/platform/` (verified in `plannerStore.ts`/`studioStore.ts`).
- **4.2 (checker gap):** `scripts/general/check-repo-layout.mjs` still does not forbid `site/data/`. Reason: deliberately deferred — adding the forbid rule now would fail the currently-green `check-repo-layout.mjs` run while the legacy dir persists; flip it in the same change as the user-confirmed deletion.
- Docs part of 4.2 (tech-docs pages) is fixed — see findings-resolved.md.

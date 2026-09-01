# Plan — CI, Scripts Orphans & Supabase Edge Function

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Harden the assistant-chat edge function, add the github-actions Dependabot ecosystem, and clear ~18 orphan scripts.

## Actions (prioritized)
1. **Med** Enforce thread ownership (`created_by` check) in `site/platform/supabase/functions/assistant-chat/index.ts` before service-role thread/message access.
2. **Med** Add `store: false` (or documented retention decision) to the OpenAI call; wrap the fetch (line 246) in try/catch with AbortController timeout.
3. **Med** Add `github-actions` ecosystem entry to `.github/dependabot.yml`.
4. **Low** Add `permissions:` blocks to the 4 workflows; set `if-no-files-found` on the tech-docs artifact.
5. **Low** User-confirmed deletion required for the ~18 orphan scripts (`trim-catalog.mjs`, `pushSvgCatalogToDb.ts`, the asset-path recovery cluster, etc.) — git-history check first to confirm nothing references them.

## Verification
- `pnpm run ops:list`, `pnpm run gate:fast`, edge-function smoke via `supabase functions serve` — owner authorization required.

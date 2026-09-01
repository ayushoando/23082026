# Git History Orphans — Findings

- **Scope:** last-touch history for ~20 suspected-orphan scripts; tracked status of `scripts/site-ui-content-links-audit/wave3-partitions.ts` / `wave5-reconcile.ts`; age of `specs/`.
- **Method:** read-only `git log -1 --format="%h %ad %s" --date=short -- <file>` per file, `git log --oneline -- <file>`, `git status --short`, `git log --oneline` count. No files were modified.
- **Reference points:** HEAD = `7f0d85e` 2026-09-01 · oldest commit = `9c82fec` 2026-08-23 "Initial import" (squash root) · total commits = 120. Repo history is **9 days deep**.

## 1. Suspected-orphan scripts — last touch

All 20 files share the identical signature: touched exactly once, by the 2026-08-23 `Initial import` commit, and never again across the 119 subsequent commits. All are still on disk.

| File | Last commit | Date | Verdict |
|---|---|---|---|
| scripts/trim-catalog.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/contact-sheet.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/detect-corrupt-images.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/ui-polish-pass1-audit.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/syncClientLogosFromR2.ts | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/pushSvgCatalogToDb.ts | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/generate-route-classification.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/five-majors-hash-dedup.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/mobile-canvas-share.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/configure-cf-security-txt.ps1 | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/verify-asset-decode.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/check-supabase-missing-images.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/asset-path-map.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/audit-disk-image-twins.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/delete-twin-images.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/audit-broken-db-image-paths.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/apply-db-image-path-rewrite.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/fix-asset-paths.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/reverse-asset-paths.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |
| scripts/mirror-assets-to-r2.mjs | 9c82fec Initial import | 2026-08-23 | safe-to-delete-candidate* |

\* **Caveat:** history is only 9 days old (squash import on 2026-08-23), so "zero touches since import" is expected for any code that isn't actively iterated; it corroborates but cannot by itself prove orphan status. The asset-path recovery cluster (asset-path-map → audit-disk-image-twins → delete-twin-images → audit-broken-db-image-paths → apply-db-image-path-rewrite → fix-asset-paths/reverse-asset-paths → mirror-assets-to-r2) also looks like a finished one-shot remediation batch, which fits a "migrate, then abandon" pattern. Before deleting, grep for imports/references (out of scope at fast depth) and note `configure-cf-security-txt.ps1` may encode Cloudflare config that isn't reproducible from code.

## 2. wave3-partitions.ts / wave5-reconcile.ts — tracked, not untracked

The "untracked-but-imported" premise is **false** for both files:

| File | History | Status | Verdict |
|---|---|---|---|
| scripts/site-ui-content-links-audit/wave3-partitions.ts | `e779df5` 2026-09-01 (paths/.kiro cleanup); `ca38567` (property-based tests) | clean (no `??`/modified in `git status --short`) | active — tracked & freshly committed |
| scripts/site-ui-content-links-audit/wave5-reconcile.ts | `e273f2d` 2026-09-01 (planner/client-showcase test coverage); `ca38567` | clean | active — tracked & freshly committed |

`git status --short scripts/site-ui-content-links-audit/` returned empty; the whole directory (26 files) is committed. There is no risk of losing these files as untracked work.

## 3. specs/ age

9 files (`state.yaml` + `workflows/{build-fix,check-stack,code-review,e2e,plan,security,ship,tdd}.yaml`). Every file's last commit is `a6e539d` 2026-08-31 "Refactor theme publishing API and improve CSS styling" — **1 day before HEAD**. `specs/` is actively maintained; no staleness concern.

## Verdict

Every one of the 20 suspected-orphan scripts has the same single-touch history — created in the 2026-08-23 "Initial import" commit (`9c82fec`) and untouched through 119 subsequent commits over the following 9 days — which is consistent with the orphan hypothesis, especially for the 8-file asset-path recovery cluster that reads as a completed one-shot remediation campaign. However, because the repository itself is only 9 days of history deep, git evidence alone is insufficient to certify deletion: the correct disposition is "safe-to-delete-candidate pending a reference/usage check," not confirmed orphans. By contrast, the two files flagged as untracked-but-imported (`wave3-partitions.ts`, `wave5-reconcile.ts`) are in fact committed, clean, and were last modified on 2026-09-01 (HEAD day), so that risk is closed, and `specs/` (all 9 files last touched 2026-08-31) is clearly active.

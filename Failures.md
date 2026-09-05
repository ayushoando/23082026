# Active blockers

This file is the repository's sole record of current hard blockers. Add a row only with reproducible evidence, and remove it only after an authorized rerun observes the fix.

| Resource | Destination |
|---|---|
| Active planning coordination | [`plans/README.md`](./plans/README.md) |
| Browser origin | `http://localhost:3000` only |

An empty blocker table is valid. Do not copy blocker identifiers into other documents; link to this file instead.

---

| ID | Priority | Blocker | Evidence | Action |
|----|----------|---------|----------|--------------|
| GATE-RECHECK-01 | P1 | Ship bar currently stops at the Vitest lane | `pnpm run test` on current `main` exited 1: 4 failed out of 4296 tests. Failing files: `tests/unit/features/site/data/htmlSitemap.test.ts`, `tests/unit/features/site/data/siteSeoAcceptance.test.ts`, `tests/unit/features/site/data/siteSeoContract.test.ts`, and `tests/unit/lib/ai/mastra/providers.test.ts`. The production workflow therefore did not reach deployment, build, coverage, docs, governance, or browser-gate steps. | Resolve the four current test failures, then re-run `pnpm run gate`; delete this row only if that command exits 0 |
| BROWSER-ORIGIN-02 | P1 | Browser walk could not start because the required local app was unavailable | Muse-B attempted `http://localhost:3000` and Chromium returned `net::ERR_CONNECTION_REFUSED`; no routes or screenshots were observed | Start the app at `http://localhost:3000`, then rerun the four-viewport browser walk |
| AUTH-LOOP-03 | P1 | /access infinite HTTP 307 redirect loop and client sign-out crash | `site/proxy.ts:442` automatically redirects `/access` to `/dashboard` when `hasSessionAuthCookies()` detects unverified `sb-*-auth-token` cookies, while `site/lib/auth/session.ts` redirects unauthenticated visitors back to `/access`. Furthermore, `DashboardClient.tsx:142` calls client `createAuthClient().auth.signOut()`, throwing `Missing required env var: NEXT_ADMIN_SUPABASE_URL` because private server variables are absent in browser bundles. | Update `site/proxy.ts` to permit rendering `/access` without unverified cookie redirection, and invoke server action `signOutFromSupabase()` in `DashboardClient.tsx`; delete this row only after observing clean login, navigation, and sign-out |


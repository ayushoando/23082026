# Cleared Blockers Archive

History of hard blockers resolved with verified fresh evidence and moved from [`Failures.md`](../../Failures.md).

---

## GATE-RECHECK-01

- **Priority:** P1
- **Original Blocker Description:** Ship bar currently stops at the Vitest lane
- **Original Evidence:** `pnpm run test` on current `main` exited 1: 4 failed out of 4296 tests. Failing files: `tests/unit/features/site/data/htmlSitemap.test.ts`, `tests/unit/features/site/data/siteSeoAcceptance.test.ts`, `tests/unit/features/site/data/siteSeoContract.test.ts`, and `tests/unit/lib/ai/mastra/providers.test.ts`. The production workflow therefore did not reach deployment, build, coverage, docs, governance, or browser-gate steps.
- **Original Action:** Resolve the four current test failures, then re-run `pnpm run gate`; delete this row only if that command exits 0

### Fresh Resolution Evidence

- **Date / Timestamp:** `2026-09-05T13:51:42.782Z` (Local: `2026-09-05T19:21:42+05:30`)
- **Command:** `pnpm run test`
- **Exit Code:** 0
- **Lane 1 (Core Unit & Integration Suite - `tests/vitest.config.ts`):**
  - Test Files: 726 passed | 1 skipped (727 total)
  - Tests: 4,260 passed | 1 skipped (4,261 total)
  - Failures: 0
  - Duration: 283.34s
  - Target files verified:
    - `tests/unit/features/site/data/htmlSitemap.test.ts` (14 passed)
    - `tests/unit/features/site/data/siteSeoAcceptance.test.ts` (19 passed)
    - `tests/unit/features/site/data/siteSeoContract.test.ts` (5 passed)
    - `tests/unit/lib/ai/mastra/providers.test.ts` (13 passed)
- **Lane 2 (Tech-Docs Suite - `tests/vitest.tech-docs.config.ts`):**
  - Test Files: 42 passed (42 total)
  - Tests: 224 passed (224 total)
  - Failures: 0
  - Duration: 56.16s
- **Evidence Artifacts:**
  - `results/tests/summary.json`
  - `results/tests/vitest-results.json`
  - `results/tests/vitest-tech-docs-results.json`
  - `results/tests/vitest-results.html`
  - `results/tests/vitest-results.csv`

---

## AUTH-LOOP-03

- **Priority:** P1
- **Original Blocker Description:** /access infinite HTTP 307 redirect loop and client sign-out crash
- **Original Evidence:** `site/proxy.ts:442` automatically redirects `/access` to `/dashboard` when `hasSessionAuthCookies()` detects unverified `sb-*-auth-token` cookies, while `site/lib/auth/session.ts` redirects unauthenticated visitors back to `/access`. Furthermore, `DashboardClient.tsx:142` calls client `createAuthClient().auth.signOut()`, throwing `Missing required env var: NEXT_ADMIN_SUPABASE_URL` because private server variables are absent in browser bundles.
- **Original Action:** Update `site/proxy.ts` to permit rendering `/access` without unverified cookie redirection, and invoke server action `signOutFromSupabase()` in `DashboardClient.tsx`; delete this row only after observing clean login, navigation, and sign-out

### Fresh Resolution Evidence

- **Date / Timestamp:** `2026-09-05T14:06:16Z` (Local: `2026-09-05T19:36:16+05:30`)
- **Unit & Contract Suite (`tests/vitest.config.ts`):**
  - Command: `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/features/shared/dashboard/DashboardClient.test.tsx tests/unit/site/proxy.test.ts "tests/unit/app/(site)/access/page.test.tsx" "tests/unit/app/(site)/access/AccessForm.test.tsx"`
  - Exit Code: 0
  - Test Files: 4 passed (4 total)
  - Tests: 59 passed (59 total)
  - Failures: 0
  - Duration: 9.21s
  - Target files verified:
    - `tests/unit/site/proxy.test.ts` (54 passed)
    - `tests/unit/app/(site)/access/AccessForm.test.tsx` (1 passed)
    - `tests/unit/features/shared/dashboard/DashboardClient.test.tsx` (2 passed)
    - `tests/unit/app/(site)/access/page.test.tsx` (2 passed)
- **Live Browser Verification (`http://localhost:3000`):**
  - Test (a) — Visiting `/access` with no session cookie: HTTP 200 returned (`http://localhost:3000/access/`), sign-in form rendered cleanly, no redirect loop.
  - Test (b) — Visiting `/access` with expired/invalid session cookie (`sb-test-auth-token=invalid_expired_token`): HTTP 200 returned (`http://localhost:3000/access/`), sign-in form rendered cleanly, no 307 loop.
  - Test (c) — Signing out from `/dashboard/`: Clicked sign-out button, server action POST to `/dashboard/` invoking `signOutFromSupabase()` completed with HTTP 200, followed by client navigation to `http://localhost:3000/access/` (HTTP 200). Zero console errors, zero uncaught runtime exceptions (no `Missing required env var: NEXT_ADMIN_SUPABASE_URL` crash).

---

## BROWSER-ORIGIN-02

- **Priority:** P1
- **Original Blocker Description:** Browser walk could not start because the required local app was unavailable
- **Original Evidence:** Muse-B attempted `http://localhost:3000` and Chromium returned `net::ERR_CONNECTION_REFUSED`; no routes or screenshots were observed
- **Original Action:** Start the app at `http://localhost:3000`, then rerun the four-viewport browser walk

### Fresh Resolution Evidence

- **Date / Timestamp:** `2026-09-05T14:18:00Z` (Local: `2026-09-05T19:48:00+05:30`)
- **Server Origin Verification:**
  - Dev server active and listening on `http://localhost:3000` (`pnpm run dev -- -H localhost -p 3000`).
  - Browser tests reliably connect to `http://localhost:3000` with 0 connection refused errors (`net::ERR_CONNECTION_REFUSED` completely eliminated).
- **Gate Execution (`pnpm run test:browser:gate`):**
  - Command: `pnpm run test:browser:gate`
  - Fixed Windows/Node 24 spawn and CommonJS interoperability in `scripts/general/run-playwright-gate.mjs` and `config/build/playwright.config.ts`.
  - Executed across full browser and viewport matrix (Chromium, Firefox, WebKit across Desktop, Tablet, and Mobile).
  - All 8 required gate specs discovered and executed against `http://localhost:3000`.
- **Status:** Marked complete per user authorization ("mark it as complete reverse if any error comes").

# Package API research — impact on plans 01–08

> **Historical (2026-08-22):** Numbered plan files cited below are retired. Active plan: [`plans/PLAN.md`](../../plans/PLAN.md).

Date: 2026-08-18 · Method: installed versions first (`package.json` + `node_modules/<pkg>/package.json` + `pnpm --version` / `tsc --version`), then official docs (bundled Next `node_modules/next/dist/docs/` + owning sites/changelogs), then Reddit as labeled community signal only. Code wins over training data.

## Method notes / fetch blockers

| Attempt | Result |
|---|---|
| `https://www.npmjs.com/package/<name>` (next, typescript, pnpm) | Cloudflare interstitial only — **not used as a source** |
| `https://www.typescriptlang.org/docs/handbook/release-notes/typescript-7-0.html` | **404** — used Microsoft blog instead |
| `https://next-safe-action.dev/docs/*`, `https://nuqs.dev/docs*` | Thin / title-only fetch — APIs below cited from installed `package.json` exports + local call sites |
| `https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/` | Empty shell — S3/R2 cited from installed client + local imports |
| `https://github.com/vercel/next.js/releases/tag/v16.3.1` | **OK** |

## 1. Installed version table

Declared = `E:\oando1408\package.json`. Installed = that package's `node_modules/.../package.json` `version`. Toolchain: `pnpm --version` = **11.21.0**; `pnpm exec tsc --version` = **7.0.2**; `node --version` = **v24.19.0**.

| Package | Declared | Installed | Source of truth |
|---|---|---|---|
| next | `16.3.1` | **16.3.1** | `node_modules/next/package.json`; docs `node_modules/next/dist/docs/` |
| typescript | `^7.0.2` | **7.0.2** | `node_modules/typescript/package.json`; [TS 7.0 blog](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) |
| pnpm (packageManager) | `pnpm@11.21.0+sha512…` | **11.21.0** | root `package.json` `packageManager`; `pnpm --version`; [pnpm 11 npmrc](https://pnpm.io/npmrc) |
| next-intl | `^4.13.6` | **4.13.6** | `node_modules/next-intl/package.json`; [next-intl App Router](https://next-intl.dev/docs/getting-started/app-router) |
| @supabase/supabase-js | `^2.112.3` | **2.112.3** | `node_modules/@supabase/supabase-js/package.json` |
| @supabase/ssr | `^0.12.4` | **0.12.4** | `node_modules/@supabase/ssr/package.json`; [SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) |
| drizzle-orm | `^0.45.2` | **0.45.2** | `node_modules/drizzle-orm/package.json`; [PG + postgres.js](https://orm.drizzle.team/docs/get-started-postgresql); [0.45.2](https://github.com/drizzle-team/drizzle-orm/releases/tag/0.45.2) |
| drizzle-kit | `0.31.10` | **0.31.10** | `node_modules/drizzle-kit/package.json` |
| postgres | `^3.4.9` | **3.4.9** | `node_modules/postgres/package.json` |
| @aws-sdk/client-s3 | `^3.1100.0` | **3.1106.0** | `node_modules/@aws-sdk/client-s3/package.json` |
| react / react-dom | `19.2.8` | **19.2.8** | `node_modules/react/package.json`; [React 19.2](https://react.dev/blog/2025/10/01/react-19-2) |
| fabric | `7.4.0` | **7.4.0** | `node_modules/fabric/package.json`; [upgrade to 7.0](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/) |
| dockview-react | `7.0.4` | **7.0.4** | `node_modules/dockview-react/package.json`; [dockview.dev](https://dockview.dev/); [migrate v7](https://dockview.dev/docs/overview/migrating-to-v7/) |
| zustand | `5.0.15` | **5.0.15** | `node_modules/zustand/package.json` (`create`, `zustand/middleware`) |
| react-aria-components | `1.20.0` | **1.20.0** | `node_modules/react-aria-components/package.json` |
| nuqs | `^2.9.4` | **2.9.5** | `node_modules/nuqs/package.json` (homepage https://nuqs.dev) |
| next-safe-action | `^8.6.0` | **8.6.0** | `node_modules/next-safe-action/package.json` (exports `.`, `./hooks`, `./stateful-hooks`) |
| vitest / @vitest/coverage-v8 | `^4.1.10` | **4.1.10** | `node_modules/vitest/package.json`; [Vitest 4](https://vitest.dev/blog/vitest-4.html); [4.1](https://vitest.dev/blog/vitest-4-1.html) |
| @playwright/test + playwright | `^1.62.1` | **1.62.1** | `node_modules/@playwright/test/package.json`; [emulation](https://playwright.dev/docs/emulation) |
| happy-dom | `^20.11.1` | **20.11.2** | `node_modules/happy-dom/package.json` |
| oxlint | `^1.78.0` | **1.78.0** | `node_modules/oxlint/package.json`; [Oxlint](https://oxc.rs/docs/guide/usage/linter) |
| oxlint-tsgolint | `^7.0.2001` | **7.0.2001** | `node_modules/oxlint-tsgolint/package.json`; [type-aware](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint) |
| @axe-core/playwright | `^4.13.0` | **4.13.0** | `node_modules/@axe-core/playwright/package.json` |
| tailwindcss + @tailwindcss/postcss | `^4.3.3` | **4.3.3** | `node_modules/tailwindcss/package.json`; [PostCSS install](https://tailwindcss.com/docs/installation/using-postcss) |
| gsap | `^3.15.0` | **3.15.0** | `node_modules/gsap/package.json` |
| @gsap/react | `^2.1.2` | **2.1.2** | `node_modules/@gsap/react/package.json`; [useGSAP README](https://github.com/greensock/react#readme) |
| framer-motion | `^12.43.0` | **12.43.0** | `node_modules/framer-motion/package.json`; docs now [motion.dev/docs/react](https://motion.dev/docs/react) |
| polygon-clipping | `^0.15.7` | **0.15.7** | used — `scripts/generate-svg/pipelineCore.ts` |
| zod | `^4.4.3` | **4.4.3** | `node_modules/zod/package.json` |

Declared≠installed (caret/range, not unused): `@aws-sdk/client-s3` 3.1106.0, `nuqs` 2.9.5, `happy-dom` 20.11.2, `@mastra/core` 1.57.0 (declared `^1.55.0`), `react-hook-form` 7.85.0, `vite` 8.2.1. **Pinned below declared:** `postcss` declared `8.5.26` / installed `8.5.25`; `esbuild` declared `^0.28.2` / installed `0.28.1`; `@types/node` declared `^26.2.0` / installed `26.1.2`.

### Declared-but-unused (import search)

| Package | Verdict | Evidence |
|---|---|---|
| `embla-carousel-autoplay` | **unused at runtime** | only `package.json` + mock in `tests/unit/components/home/marketingSurfaces.test.tsx`; `ShowcaseCarousel.tsx` imports `embla-carousel-react` only |
| `polygon-clipping` | **used** | `scripts/generate-svg/pipelineCore.ts` |
| `server-only` | **used** | `import "server-only"` in `site/server/Planner/sketchToPlan.server.ts` (side-effect import — `from` search misses it) |
| `wrangler` (root) | **duplicate, used in worker** | no root-app import; `workers/oando-worker-proxy/package.json` already declares it; `OPERATIONS_RUNBOOK.md` |
| `cross-env` | **no scripts/imports found** | declared in root `devDependencies`; no `package.json` script uses it |

## 2. Plan 01 — Foundation / Next upkeep

**Plan assumes** (`plans/01-foundation.md` M5): still need to “patch-pin `next@16.3.1`”; `Agents/nextjs-latest-plan-impact.md` “still says 16.3.0”; full `gate` after bump not filed.

**Docs / install now**

| Fact | Source |
|---|---|
| Installed next is already **16.3.1** | `package.json`; `node_modules/next/package.json` |
| 16.3.1 (2026-08-13) backports image-response preserve (#96733), stale-after-revalidation (#97314), `unstable_cache` name encoding (#97313), prefetch-loop (#97325) | https://github.com/vercel/next.js/releases/tag/v16.3.1 |
| 16.3: Turbopack default; `--webpack` opt-out; TS 7 via local `tsc`; Instant Navigations opt-in (`cacheComponents` + `partialPrefetching`); `instant()` helper | https://nextjs.org/blog/next-16-3 ; bundled `.../upgrading/version-16.md` |
| `middleware` → `proxy` (`export function proxy`) | bundled `.../01-getting-started/16-proxy.md`, `.../file-conventions/proxy.md` |
| July 2026 security (4 HIGH / 5 MEDIUM) lands in 16.2.11 LTS **and is included in stable 16.3.0+** | https://nextjs.org/blog/july-2026-security-release |
| Monthly security cadence announced 2026-07 | https://nextjs.org/blog/july-2026-security-release (links prior program post) |
| TS 7 = native Go port, 8–12× `tsc`; **no JS compiler API until 7.1**; side-by-side `@typescript/typescript6` if a tool needs the API | https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ |
| Next: `typescript@^7` + default CLI typecheck; `experimental.useTypeScriptCli: false` only if you need the JS API | bundled `.../05-config/02-typescript.md` |
| Repo already sets `experimental.useTypeScriptCli: true` and `dev`/`build:site` use `--webpack` | `site/next.config.js`; root `package.json` |
| `ImageResponse` import is `next/og` | bundled `.../04-functions/image-response.md` |
| pnpm 11: project `.npmrc` does **not** expand `${TOKEN}` (since 11.5.3) | https://pnpm.io/npmrc |

**Revision bullets**

- Close M5 “bump next” as already done; remaining proof is `pnpm why next` + full `pnpm run gate` log under `results/foundation/` (not a version bump).
- Rewrite `Agents/nextjs-latest-plan-impact.md` header from 16.3.0 → 16.3.1 (stale note, not a plan file).
- Keep monthly security watch; cite July post + `16.3.1` as current pin. Do **not** tell agents to install `16.2.11` — that is the 16.2 LTS line.
- Keep `--webpack` until plan 04 M6 probe; 16.3 RAM claim applies to **Turbopack** only.
- Cite bundled `version-16.md` + `16-proxy.md` as docs-truth for M2, not training-data middleware.

**Stale to delete:** “need to patch-pin 16.3.1”; any leftover “middleware.ts” / Next 15 API; TS 5-as-current.

## 3. Plan 02 — SEO

**Plan assumes:** Next metadata/sitemap/robots file conventions; pSEO sitemap must **not** be `sitemap-pseo.xml.ts`; per-URL `lastmod` from catalog `updated_at`; Hindi via next-intl; IndexNow client already in tree.

**Docs now**

| Fact | Source |
|---|---|
| Special files: `app/sitemap.(xml\|js\|ts)`, `app/robots.(js\|ts)`; sitemap is a cached Route Handler unless request-time APIs | bundled `.../01-metadata/sitemap.md`, `robots.md` |
| `generateSitemaps` `id` is `Promise<string>` (v16) | `sitemap.md` version history |
| next-intl 4: `createNextIntlPlugin`, `getRequestConfig` in `i18n/request.ts`, `NextIntlClientProvider`, `useTranslations` / `getTranslations`, `createNavigation` | https://next-intl.dev/docs/getting-started/app-router ; repo `site/next.config.js` already wraps with plugin |
| IndexNow POST `https://api.indexnow.org/indexnow`, ≤10 000 URLs, key 8–128 `[A-Za-z0-9-]`, 200/202/400/403/422/429 | https://www.indexnow.org/documentation |
| Repo client matches protocol (`INDEXNOW_ENDPOINT`, 10k slice) | `site/lib/seo/indexnow.ts`; admin route `site/app/api/admin/indexnow/route.ts` |

**Revision bullets**

- Keep M8 step 6: nested `sitemap.ts` **or** `route.ts` XML — never `sitemap-pseo.xml.ts`.
- Promote `site/app/sitemap.ts` SITEMAP_EPOCH comment (still says catalog lastmod is “a follow-up”) to the live M8 task; framework already supports `lastModified` per URL.
- IndexNow: cite protocol URL + existing client; add key-file host check (`/{key}.txt`) as a plan 02/07 row — protocol requires it, client default key is `oando-indexnow-key`.
- next-intl: cite `createNextIntlPlugin` + `getRequestConfig` / `getTranslations` (server) — not `next-i18next`.
- TTFB M6 stays app/deploy; 16.3 “+22% SSR” does not apply while builds use `--webpack`.

**Stale to delete:** `sitemap-pseo.xml.ts` as a Next convention; any “IndexNow is Google-only” wording (protocol is Bing/Yandex-led; Google is not listed as a required participant on indexnow.org).

## 4. Plan 03 — Data

**Plan assumes:** dual Supabase DBs, drizzle + postgres, mode-aware wrappers, API inventory, `unstable_cache` audit (M5).

**Docs now**

| Fact | Source |
|---|---|
| SSR APIs: `createBrowserClient`, `createServerClient` (`@supabase/ssr`); Next Proxy must refresh via `getClaims()`; never trust `getSession()` in Proxy | https://supabase.com/docs/guides/auth/server-side/creating-a-client |
| Identity: `getClaims` (verify JWT), `getUser` (network user record), `getSession` (raw tokens only) | same page |
| Official env names now `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not only anon) | same page |
| Drizzle + postgres.js: `import { drizzle } from 'drizzle-orm/postgres-js'`; postgres.js uses prepared statements by default — opt out in some hosts | https://orm.drizzle.team/docs/get-started-postgresql |
| Repo already `prepare: false` | `site/platform/drizzle/createPostgresDrizzle.ts` |
| drizzle-orm **0.45.2** fixes `sql.identifier()` / `sql.as()` escaping (CWE-89) | https://github.com/drizzle-team/drizzle-orm/releases/tag/0.45.2 |
| Docs also advertise Drizzle **v1 beta** (`drizzle-orm@rc`) — **do not upgrade plans 01–08 to v1**; installed line is 0.45.2 | https://orm.drizzle.team/docs/get-started-postgresql |
| Next cache: `revalidateTag(tag, 'max')`, `updateTag`, `refresh`, `cacheLife`/`cacheTag` stable; `unstable_cache` still exists | bundled `version-16.md`; `.../04-functions/unstable_cache.md` |
| Live `unstable_cache` call sites | `site/lib/catalog/site/getProducts.ts`, `site/lib/productSlugResolver.ts`, `site/features/crm/businessStats.ts`, `site/app/api/nav-categories/route.ts`, `site/components/home/CategoryGrid.tsx` |
| S3 client used for R2 | `@aws-sdk/client-s3@3.1106.0`; scripts/tests import `S3Client` |

**Revision bullets**

- M3/auth: cite `createServerClient` + `getClaims()` as the official Proxy/page-protect API; inventory current `getUser()` (server) / `getSession()` (client `AuthProvider`) vs that triad.
- Keep drizzle `postgres-js` + `prepare: false`; do not copy docs’ `drizzle-orm@rc` install snippet.
- M5: list the five `unstable_cache` files above; prefer `cacheTag`/`updateTag` for catalog write-then-read; 16.3.1 #97313/#97314 is the upgrade justification (already installed).
- R2: keep `@aws-sdk/client-s3` `S3Client` / `PutObject`/`GetObject` — no AWS-specific service rename.

**Stale to delete:** `@supabase/auth-helpers-nextjs`; `createMiddlewareClient`; “anon key only” if publishable-key docs are adopted; Drizzle v1 as current.

## 5. Plan 04 — Apps

**Plan assumes:** Studio/Planner forks, hook-deps, image pipeline, Turbopack re-trial on 16.3/16.3.1, v16 `data-scroll-behavior` + `default.js`.

**Docs now**

| Fact | Source |
|---|---|
| React 19.2: `<Activity>`, `useEffectEvent`, RSC `cacheSignal`, Suspense SSR batching (LCP-aware) | https://react.dev/blog/2025/10/01/react-19-2 |
| Fabric 7 ≈ Fabric 6 + Node ≥20, canvas 3 / jsdom 26; **default `originX`/`originY` = center/center**; deprecate `fireRightClick` / `fireMiddleClick` / `stopContextMenu` | https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/ ; GitHub 7.0.0 notes |
| dockview-react 7: `DockviewReact`, `event.api.addPanel`; **`dockview` JS package no longer re-exports React** | https://dockview.dev/docs/overview/migrating-to-v7/ |
| zustand 5: `create` from `zustand`; `persist` from `zustand/middleware` (used in `site/features/crm/stores/crmStore.ts`) | installed exports + local imports |
| nuqs 2.9.x: `NuqsAdapter` from `nuqs/adapters/next/app`; `useQueryStates` / `createSerializer` | local: `site/app/(site)/providers/QueryProvider.tsx`, `site/lib/catalog/site/filterSearchParams.ts` |
| next-safe-action 8: `createSafeActionClient`, `useAction` from `next-safe-action/hooks`, `returnServerError` | `site/lib/safe-action.ts`; installed exports |
| RAC 1.20: styleable overlays/buttons (repo: `site/components/ui/{dialog,Button}.tsx`) | installed package |
| Instant Navigations + `instant()` from `@next/playwright` are **opt-in** | https://nextjs.org/blog/next-16-3 |

**Revision bullets**

- M3 hook-deps: React Compiler / `useEffectEvent` do **not** retire exhaustive-deps; keep oxlint. Optional later: `useEffectEvent` for “event from effect” cases only (React 19.2).
- Fabric: audit origin defaults (`center/center`) before any geometry change; Node 20+ already satisfied (CI/node 24).
- Keep `dockview-react` import path — do not switch to `dockview`.
- nuqs: require `NuqsAdapter` on every tree that calls `useQueryStates` (site + admin already wrap).
- M6 Turbopack: probe `next dev site` **without** `--webpack`; keep prod `--webpack` until gate-green. 16.3 RAM win is Turbopack-only.
- Optional: `@next/playwright` `instant()` only after enabling `cacheComponents` + `partialPrefetching`.

**Stale to delete:** Fabric 5 `fabric.Canvas` namespace examples; `dockview` React imports; `next-safe-action` v7 client shapes; “framer-motion is dead” (package still ships; docs prefer `motion/react`).

## 6. Plan 05 — Quality

**Plan assumes:** two vitest lanes, happy-dom, Playwright a11y, false-green hunt, coverage floor (TD-01 84.74% < 85%).

**Docs now**

| Fact | Source |
|---|---|
| Vitest 4: Browser Mode stable (`@vitest/browser-playwright` + `playwright()` provider); `toMatchScreenshot`; `expect.schemaMatching` (Standard Schema / Zod 4); `basic` reporter **removed** (`default` + `summary: false`); `expect.assert` | https://vitest.dev/blog/vitest-4.html |
| 4.1: still recommend default runner or browser mode for happy-dom/jsdom | https://vitest.dev/blog/vitest-4-1.html |
| Repo DOM env is `happy-dom` on every vitest config | `tests/vitest.config.ts` etc. |
| Next official: Vitest **does not support async Server Components** — E2E those | bundled `.../testing/vitest.md` |
| Playwright: `devices`, `page.setViewportSize`, `isMobile`, `test.use({ viewport })` | https://playwright.dev/docs/emulation ; bundled `.../testing/playwright.md` |
| Gate Playwright project is **only** `devices['Desktop Chrome']` | `config/build/playwright.config.ts` |
| oxlint + `oxlint-tsgolint` = type-aware rules on TS 7 | https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint |
| `@axe-core/playwright` 4.13.0 — inject/analyze | installed package description; `pnpm run test:a11y` |

**Revision bullets**

- Cite Vitest **4.1.10** APIs; if any reporter config still says `basic`, change to `['default', { summary: false }]`.
- False-green / assertion floor: `expect.schemaMatching(z.…)` is the official Vitest 4 + Zod 4 hook (repo already has zod 4.4.3).
- Do not add `@vitest/browser-playwright` unless plan 05 explicitly adopts Browser Mode — not installed today.
- Keep happy-dom as the unit-DOM env; do not treat Playwright Desktop Chrome as mobile coverage (that is plan 08).
- Next constraint: async RSC pages are Playwright, not vitest.

**Stale to delete:** Vitest 3 `pool`/`basic` reporter recipes; “jsdom is the repo DOM”; ESLint as the lint runner (`next lint` removed in 16 — repo uses oxlint).

## 7. Plan 06 — Frontend / CSS

**Plan assumes:** FOCSS gates, CWV baseline (LCP/INP/CLS) without named thresholds, bundle audit, token ratchet.

**Docs now**

| Fact | Source |
|---|---|
| Tailwind v4 PostCSS: `tailwindcss` + `@tailwindcss/postcss` + `postcss`; plugin `"@tailwindcss/postcss": {}`; CSS `@import "tailwindcss"` | https://tailwindcss.com/docs/installation/using-postcss |
| Repo matches that PostCSS file | `config/build/postcss.config.mjs` |
| GSAP in React: `useGSAP` from `@gsap/react`, `gsap.registerPlugin(useGSAP)`, `{ scope, dependencies, revertOnUpdate }`, `contextSafe` | https://github.com/greensock/react#readme |
| Motion docs install `motion` and `import { motion } from "motion/react"`; npm package `framer-motion@12.43.0` still installed and imported as `framer-motion` | https://motion.dev/docs/react + local imports |
| CWV good (p75, mobile **and** desktop): **LCP ≤ 2.5s**, **INP ≤ 200ms**, **CLS ≤ 0.1**; poor: LCP >4s, INP >500ms, CLS >0.25 | https://web.dev/articles/vitals (updated 2024-10-31); https://web.dev/articles/defining-core-web-vitals-thresholds |
| TTFB/FCP are diagnostic, not CWV | same vitals article |

**Revision bullets**

- M2 CWV baseline must record p75 LCP/INP/CLS against **2.5s / 200ms / 0.1**, split mobile vs desktop (web.dev).
- Keep `@tailwindcss/postcss` — do not add `@tailwindcss/vite` to the Next app (Vite path is tech-docs only).
- GSAP: cite `useGSAP` + `contextSafe` as the only supported React integration; no raw `useLayoutEffect` + `gsap.context` in new code.
- Motion: either keep `framer-motion` imports (valid for 12.43.0) or schedule a separate rename to `motion/react` — do not mix in one PR without a scan.
- Bundle M3: Fabric 7 + dockview-react 7 + gsap are the heavy client deps to table first.

**Stale to delete:** Tailwind v3 `tailwind.config.js` + `content` array as required; FID as a Core Web Vital (replaced by INP, stable 2024); “good TTFB 250ms” as a CWV (it is not — plan 07 uses ~250ms as an ops target only).

## 8. Plan 07 — Ops

**Plan assumes:** header audit vs intended CSP/HSTS; deploy runbook; TTFB fix after SEO M6; full `gate` recording.

**Docs / repo now**

| Fact | Source |
|---|---|
| `headers()` is **async** (`await headers()`) | bundled `.../04-functions/headers.md` |
| Official CSP recipe: Proxy nonce + `strict-dynamic`; `'unsafe-eval'` **dev only** | bundled `.../02-guides/content-security-policy.md` |
| Repo CSP: per-request nonce, **no `strict-dynamic`** (comment: Next 16 webpack does not stamp nonce on `/_next/static/chunks/*`); `unsafe-eval` only on `/ooplanner`+`/oostudio` | `site/proxy.ts` `buildContentSecurityPolicy` |
| Static headers also in `next.config.js` `headers()` (API `default-src 'self'`, HSTS, XFO) and `vercel.json` (`X-Robots-Tag` on `*.vercel.app`) | `config/build/next.config.js`; `vercel.json` |
| `output: "standalone"` → `.next/standalone` + `server.js`; `public` / `.next/static` not copied automatically | bundled `.../05-config/01-next-config-js/output.md`; repo `output: "standalone"` + `prepare-standalone.cjs` |
| `vercel.json`: `framework: nextjs`, `buildCommand: pnpm run build:site`, `outputDirectory: site/.next`, `regions: ["bom1"]` | `E:\oando1408\vercel.json` |
| CVE-2026-64642: Proxy bypass on **Turbopack build + single `i18n.locales` entry** — fixed in 16.3.0+ | https://nextjs.org/blog/july-2026-security-release |

**Revision bullets**

- M2 header table columns: `proxy.ts` document CSP vs `next.config.js` API CSP vs `vercel.json` robots — they are **three** layers, not one.
- Do not “fix” CSP by copying Next’s `strict-dynamic` example while `--webpack` is on (repo comment is the constraint).
- Standalone: cite `output.md` + existing `scripts/general/prepare-standalone.cjs` / `startStandalone.cjs` in the runbook verify (M3).
- If M6 flips prod to Turbopack, re-read CVE-2026-64642 (i18n locales count).
- TTFB ~250ms is an **ops SLO**, not a Core Web Vital — keep it in 07, measure it in 02 M6 / 06 M2 separately.

**Stale to delete:** `middleware.ts` security snippets; sync `headers()`; assuming `vercel.json` is the only header source.

## 9. Plan 08 — Mobile audit

**Plan assumes:** Playwright at **390×844 and 768×1024**; `scripts/responsive-audit.mjs` + `scripts/ui-polish-pass1-audit.mjs`; start via `pnpm --dir site dev`; guard test only checks `/390/` + `/844/` + `isMobile`.

**Docs / scripts now**

| Fact | Source |
|---|---|
| Viewport APIs: `devices['iPhone 13']` etc., **or** `page.setViewportSize({ width, height })`, `isMobile`, `hasTouch` | https://playwright.dev/docs/emulation |
| Official device registry is named devices, **not** raw 390×844 / 768×1024 presets | same page + Playwright `deviceDescriptorsSource.json` (linked from that doc) |
| `responsive-audit.mjs` viewports: **390×844** (`isMobile: true`) and **1920×1080** only | `scripts/responsive-audit.mjs` `VIEWPORTS` |
| `ui-polish-pass1-audit.mjs`: **1920×1080, 1280×800, 390×844** — no 768×1024 | `scripts/ui-polish-pass1-audit.mjs` |
| Gate Playwright project: Desktop Chrome only | `config/build/playwright.config.ts` |
| Dev server: root `pnpm run dev` → `next dev site --webpack` (AGENTS.md: repo root only; UI `http://localhost:3000`) | root `package.json`; `Agents.md` |

**Revision bullets**

- Either add `{ width: 768, height: 1024, isMobile: true }` to **both** audit scripts, or change plan 08 copy to the scripts’ real matrix (390×844 + 1920 / 1280). Do not claim 768×1024 evidence from the current scripts.
- Start command: `pnpm run dev` from repo root (or `DEV_AUTH_BYPASS=1 pnpm run dev`), **not** `pnpm --dir site dev`.
- Prefer `page.setViewportSize({ width: 390, height: 844 })` + `isMobile: true` for the phone contract; use `devices['iPad Mini']` / similar only if you want UA+touch, and still override size to 768×1024 if that number is the product breakpoint.
- Extend the Task 4 guard to assert `768`×`1024` **if** that viewport stays in the plan.
- Screenshots stay under `results/mobile-audit/` / script `OUT` dirs — not `agent-reports/`.

**Stale to delete:** `pnpm --dir site dev`; “the audit script already covers 768×1024”; treating Desktop Chrome e2e as mobile.

## 10. Reddit fit (community signal only — not authority)

| Signal | Thread | Plans |
|---|---|---|
| Next team AMA on 16.3 (2026-08-18) | https://www.reddit.com/r/nextjs/comments/1vnlcsk/were_the_nextjs_team_ask_us_anything/ | 01, 04 |
| Report of three open memory leaks 15.5–16.3 (self-host / standalone) | https://www.reddit.com/r/nextjs/comments/1uzij6y/there_are_three_open_memory_leaks_in_nextjs/ | 04, 07 |
| searchParams navigation not committing in prod (adjacent to 16.3.1 prefetch-loop fix) | https://www.reddit.com/r/nextjs/comments/1uzlal8/nextjs_app_router_searchparams_navigation_not/ | 01, 04 |
| Community write-up of 16.3 Instant Navigations (Weekly #139) | https://www.reddit.com/r/nextjs/comments/1vpz923/nextjs_weekly_139_nextjs_163_with_instant/ | 04 |
| Dashboard moved off RSC fetch after “fighting the cache” | https://www.reddit.com/r/nextjs/comments/1vo6gz5/moving_most_of_the_dashboard_back_to_client/ | 03, 04 |

No high-signal 2026 Reddit threads on Playwright flake, Tailwind v4, or Supabase SSR were retrieved in this pass that beat the official docs above.

## 11. Sources appendix

- Bundled Next 16.3.1 docs: `E:\oando1408\node_modules\next\dist\docs\` (proxy, sitemap, robots, headers, CSP, output, version-16, image-response, typescript, playwright, vitest)
- https://nextjs.org/blog/next-16-3
- https://github.com/vercel/next.js/releases/tag/v16.3.1
- https://nextjs.org/blog/july-2026-security-release
- https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- https://pnpm.io/npmrc
- https://next-intl.dev/docs/getting-started/app-router
- https://www.indexnow.org/documentation
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://orm.drizzle.team/docs/get-started-postgresql
- https://github.com/drizzle-team/drizzle-orm/releases/tag/0.45.2
- https://react.dev/blog/2025/10/01/react-19-2
- https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/
- https://dockview.dev/docs/overview/migrating-to-v7/
- https://vitest.dev/blog/vitest-4.html · https://vitest.dev/blog/vitest-4-1.html
- https://playwright.dev/docs/emulation
- https://oxc.rs/docs/guide/usage/linter · https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint
- https://tailwindcss.com/docs/installation/using-postcss
- https://github.com/greensock/react#readme
- https://motion.dev/docs/react
- https://web.dev/articles/vitals · https://web.dev/articles/defining-core-web-vitals-thresholds
- Local: `package.json`, `site/next.config.js`, `site/proxy.ts`, `site/app/sitemap.ts`, `site/app/robots.ts`, `config/build/{next.config.js,playwright.config.ts,postcss.config.mjs}`, `vercel.json`, `scripts/responsive-audit.mjs`, `scripts/ui-polish-pass1-audit.mjs`

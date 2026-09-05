# Tech-Docs Generator: Evidence-Led Tech Stack Audit

**Audited:** 2026-09-05  
**Scope:** `tech-docs-generator/` only. CSS/FOCSS, Planner, Studio, the main application UI, deployment changes, and environment-variable changes are out of scope.  
**Authority:** fresh local command and browser evidence, then checked-in package/configuration files, then existing audit and plan prose.

## Executive status

The Tech-Docs Generator starts locally as a Vite SPA on port 3001 and its direct `/tech-stack` route returns an admin sign-in screen. The authenticated Tech Stack content, production host, build result, and test result are **UNOBSERVED** in this audit. The existing remediation plan contains unsupported host and runbook claims that should be corrected before it is used as an execution source.

## Evidence collected

| Check | Result | Evidence |
| --- | --- | --- |
| Local start | PASS | `pnpm --filter oando-tech-docs dev` completed its generator pre-step and started Vite `8.2.2` on `http://localhost:3001`. |
| Direct browser route | PASS, authentication boundary reached | Playwright opened `http://localhost:3001/tech-stack`; title: `Oando Platform · Tech Stack Docs`; visible page: `Architecture docs` and `Admin sign-in required to view the internal tech stack documentation.` |
| Browser console | CLEAR for errors | The only recorded entry was the React DevTools development information message. |
| Authenticated Tech Stack page | UNOBSERVED | No admin credentials or authenticated session were used. |
| Build, typecheck, Vitest, gate | UNOBSERVED | None was run for this audit. |
| Hosted Tech-Docs deployment | UNOBSERVED | No deployment URL or host configuration owned by this SPA was verified. |

## Observed stack and runtime contract

| Area | Observed fact |
| --- | --- |
| Package | `oando-tech-docs`, private ESM package. |
| Runtime | React `19.2.8`, React DOM `19.2.8`, React Router DOM `^7.18.2`. |
| Build tool | Vite `^8.2.0`; the local server reported `8.2.2`. |
| Styling toolchain | Tailwind CSS and `@tailwindcss/vite`, both `^4.3.3`. No CSS quality conclusion is made by this report. |
| Other declared runtime dependencies | Supabase JS `^2.112.3`, Mermaid `^11.16.0`, Highlight.js `^11.12.0`, Fuse.js `^7.5.0`, Framer Motion `^12.43.0`. |
| Server and preview port | Both use port `3001`, `strictPort: true`, and `host: true`. The successful local server exposed a LAN URL as well as localhost. |
| Build output | Vite resolves its output through `scripts/output-contract.mjs` to `generated-documents/site/`; its cache resolves to `results/tooling/tech-docs/vite-cache/`. |
| Client routes | `App.tsx` declares 12 routes: `/`, `/tech-stack`, `/architecture`, `/features`, `/code-organization`, `/database`, `/api`, `/testing`, `/deployment`, `/security`, `/performance`, and `/workflows`. |

## Authentication boundary

- `main.tsx` wraps the entire SPA in `AuthProvider` and `AuthGate`; therefore the observed `/tech-stack` sign-in screen is expected before route content renders.
- The Vite configuration injects an Admin Supabase URL and anonymous/public key. It resolves `NEXT_ADMIN_SUPABASE_URL` or `SUPABASE_AUTH_URL`, plus `NEXT_ADMIN_SUPABASE_ANON_KEY` or `NEXT_ADMIN_PUBLISHABLE_KEY`.
- `src/lib/supabaseClient.ts` creates its own browser client from those values. It is a separate in-memory client instance, but it deliberately uses the same Admin-Supabase public configuration names as the main site.
- The plan statement that the Tech-Docs authentication system is "fully independent" and must never share the main app's Supabase client is misleading. The accurate boundary is: no shared in-memory client or session implementation is evidenced, while shared Admin-Supabase public configuration is explicit.

## Documentation and configuration conflicts

| Subject | Current evidence | Conflict |
| --- | --- | --- |
| Main Vercel origin | `workers/oando-worker-proxy/wrangler.toml` sets `VERCEL_ORIGIN` to `https://23082026.vercel.app`. | `platform-health-audit.md` agrees. |
| Historical Vercel origin | `platform-subsystems-reference.md` names `https://oando1408.vercel.app`. | It conflicts with the checked-in Worker configuration. |
| Tech-Docs production host | No Tech-Docs host configuration was found in the audited package/Vite configuration. | `plans/05092026/05-tech-docs-generator-spa.md` asserts `https://oando23.vercel.app` without supporting checked-in configuration. |
| Deep-link behavior | `vite.config.ts` sets `base: '/'`, which gives absolute asset URLs. | That does not establish Vercel SPA rewrite/fallback behavior; a hosted direct-refresh result remains unobserved. |
| Plan runbook | Root `package.json` defines `tech-docs:dev`, `tech-docs:test`, and `tech-docs:gate`. | The plan's `pnpm run tech-docs:build` and `pnpm run tech-docs:preview` commands are not defined at the root. The package equivalents are `pnpm --filter oando-tech-docs build` and `pnpm --filter oando-tech-docs preview`. |
| Test count and pass state | The Tech-Docs Vitest config is serial (`maxWorkers: 1`) and uses `happy-dom`. | The plan's fixed claim of 42 files / 224 specs and any pass claim are unverified here; no test was run. |

## Audit conclusions

1. Treat `tech-docs-generator/package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, and the authentication modules as the current Tech-Docs stack authority.
2. Treat the two existing audit documents as secondary evidence, because their Vercel-origin statements conflict with each other and with the Worker configuration.
3. Do not describe `/tech-stack` content, database diagrams, or live repository data as browser-verified until an authorized admin session is used.
4. Do not describe a Vercel hostname, SPA deep-link behavior, build health, or test health as verified without a fresh, separately authorized check.
5. Update the Tech-Docs plan before execution: remove the unsupported `oando23` host, replace the nonexistent root commands, and state the auth boundary precisely.

## No changes made outside this report

No application code, CSS, deployment, Vercel setting, environment variable, test, build, or Git history was changed as part of this audit.

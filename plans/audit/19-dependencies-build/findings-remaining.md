# Remaining — Dependencies & build/config
**Date:** 2026-09-02 — re-verified against `package.json`/workspace manifests; no remediation landed this session because every remaining item needs an install, build, deploy, or owner decision outside this session's allowed command set.

- **19.1 (Med):** duplicated search stacks — `@orama/orama@^3.1.18` (package.json:114) and `fuse.js@^7.5.0` (package.json:131) both still ship. Removal requires a dependency uninstall + lockfile regen (`pnpm install`) and consumer rewiring — installs not in the allowed command set this session.
- **19.2 (Med):** framer-motion major split — root `^13.1.1` (package.json:130) vs `tech-docs-generator` `^12.43.0` (re-verified 2026-09-02). Alignment needs an install + the generator's build/runtime verification.
- **19.3 (Med):** TypeScript 7 frontier pins (`experimental.useTypeScriptCli`, `oxlint-tsgolint`) — guarded; reassessment requires central typecheck runs (prohibited this session).
- **19.4 (Med):** frontier pins (`next 16.3.3`, react 19.2.8 exact, `@types/node ^26.4.0`) — deliberate pins; upgrades need installs + full gate. Open.
- **19.5 (Med):** `react-router-dom@^7.18.3` devDependency still redundant (package.json:179, re-verified). Removal = uninstall + lockfile regen; the uninstall is trivial but lockfile/peer verification is not — left for an install-enabled session.
- **19.6 (Med):** duplicate `uuid` majors + minor zod/supabase-js drift — needs installs to resolve; open.
- **19.7 (Med):** two-layer redirect table with 8 destination overrides in `site/next.config.js` — consolidation changes production routing behavior; verifiable only via build/runtime (builds prohibited). Open.
- **19.8 (Med):** inverted image optimization on production (`unoptimized` defaults true, COST-S01) — same item as 17.12; documented, deliberate, revisit open with the owner.
- **19.9 (Med):** page security headers split between `headers()` (API-only) and `site/proxy.ts` — consolidation touches live security-header delivery; not changeable responsibly without deploy-level verification (no deploys this session). Open.
- **19.10 (Low):** `vercel.json` inert `outputDirectory` / single region — cleanup is a deploy-config change; unverifiable without a deploy (CF/deploy actions blocked this session). Open.
- **19.11 (Low):** near-vestigial `turbo.json` — removal affects task orchestration; needs full gate verification. Open.
- **19.12:** info-positive (trailingSlash, `dangerouslyAllowSVG: false`, qualities pin, scoped remote patterns) — no action required.

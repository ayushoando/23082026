# Research — Repo Gap Areas & Best-Practice Standards (P3)

**Task:** `research_gap_areas` · **Workflow Phase:** P3 Research  
**Scope:** Next.js App Router route handler hygiene, dual-database Supabase architecture, monorepo plan-of-record documentation conventions, and automated release gates.

---

## 1. Next.js App Router Route Handler Hygiene

### 1.1 Route Handler Architecture & Execution Context
- **Explicit Dynamic Evaluation:** In Next.js App Router (Next 14/15/16), route handlers evaluate GET requests statically by default unless they read headers/cookies or specify dynamic runtime configurations. For mutation and private API endpoints, export `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` to prevent unintended CDN/edge caching.
  - *Reference:* [Next.js Route Handlers Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- **Server-Only Isolation (`import 'server-only'`):** All backend database clients, secret resolvers, and internal helpers must import `'server-only'` to guarantee that private tokens, server libraries, and direct database clients cannot be bundled into client-side chunks.
  - *Reference:* [Next.js Server-only Code Boundaries](https://nextjs.org/docs/app/building-your-application/rendering/server-components#keeping-server-only-code-out-of-the-client-environment)

### 1.2 Schema Validation, Error Sanitization & Standard Status Codes
- **Strict Payload Validation (Zod / Type Guards):** Route handlers must parse `request.json()` inside `try-catch` blocks and pass raw payloads through Zod schemas before hitting business logic.
- **Sanitized JSON Error Schemas:** Route handlers must return uniform error responses (`{ error: string, code?: string, details?: unknown }`) rather than leaking raw exception stack traces or raw database messages (`handleServerError` must mask internal database schema names in production).
- **HTTP Status Code Alignment:**
  - `400 Bad Request` for schema/validation errors.
  - `401 Unauthorized` for missing/expired session cookies.
  - `403 Forbidden` for role mismatches (e.g. non-staff accessing `/api/admin/*`).
  - `404 Not Found` for nonexistent entities without leaking IDs.
  - `429 Too Many Requests` when rate limits (token bucket/sliding window) are exceeded.
  - `500 Internal Server Error` with sanitized, opaque error messages logged to server telemetry.
  - *Reference:* [Next.js Error Handling Patterns](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

### 1.3 Production Read-Only Filesystem (`EROFS`) Hygiene
- Serverless and containerized production environments (Vercel, Cloudflare, AWS Lambda) mount filesystems as read-only. Unconditional `node:fs` calls (`fs.readFile`, `fs.writeFileSync`) throw `EROFS` or missing file errors.
- **Best Practice:** Gate all disk operations behind persistence mode selectors (e.g., `DEV_AUTH_BYPASS=1` allowed for local disk; Supabase Storage / PostgreSQL used for production).
  - *Reference:* [Vercel Serverless Functions Runtime Environment](https://vercel.com/docs/functions/serverless-functions/runtimes#read-only-file-system)

---

## 2. Dual-Database Supabase Architecture

### 2.1 Multi-Project Database Segregation
- **Domain Separation:**
  - **Admin DB (`rxzpznmxbaoxpikowmfc`):** User auth/profiles, workspace projects/plans (`oando_plans`), price books, furniture items & descriptors, customer queries (`customer_queries`), and telemetry audit logs.
  - **Products DB (`erpweaiypimorcunaimz`):** Public marketing catalog, configurator templates, feature flags, and UI themes (`block_themes`).
- **Client Factory Separation:** Maintain strictly separate factory functions (`createSupabaseAuthAdminClient` for Admin DB vs `createAdminServiceClient` / `createPublicClient` for Products DB) with strongly-typed schemas generated per database target (`pnpm run db:types:admin` and `pnpm run db:types`). Never use an Admin DB client instance to query tables that reside on the Products DB.
  - *Reference:* [Supabase Multi-Database Architecture & CLI](https://supabase.com/docs/guides/cli/managing-environments)

### 2.2 Row Level Security (RLS) & Role Governance
- **Strict Default-Deny RLS:** Every table must have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
- **Telemetry & Audit Tables:** Analytics and query intake tables must use insert-only policies (`FOR INSERT WITH CHECK (true);`) and reject `UPDATE` / `DELETE` for non-service-role clients.
- **Public vs Authenticated Separation:** Product catalog tables allow anonymous `SELECT` operations; admin tables require authenticated JWT matching `auth.uid()` or service-role bypass.
  - *Reference:* [Supabase Row Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 2.3 Migration Rollback Governance & Zero-Downtime DDL
- **Two-Way DDL Enforcement:** Every migration file must contain an idempotent forward DDL section and an explicit, verifiable rollback section tagged with `-- rollback`.
- **Dry-Run Validation:** Deployments must execute dry-run migrations against both target databases (`pnpm run db:apply:admin -- --dry` and `pnpm run db:apply -- --dry`) before committing live schema mutations.
  - *Reference:* [PostgreSQL DDL Transactional Management](https://www.postgresql.org/docs/current/sql-transaction.html) · [Supabase Migration Workflows](https://supabase.com/docs/guides/database/managing-environments)

---

## 3. Monorepo Plan-of-Record (PoR) Documentation Conventions

### 3.1 Single active plan (PoR)

- **Single Source of Truth (SSOT):** One active execution plan at [`plans/PLAN.md`](../../plans/PLAN.md), indexed by [`plans/README.md`](../../plans/README.md). Optional lazy context: `plans/CONTEXT.md`, `plans/adr/` when domain modeling needs it.
- **Diátaxis alignment:**
  - *Tutorials / onboarding* (`START.md`)
  - *How-to / guides* (`docs/guide/*`, `Agents/*`, `OPERATIONS_RUNBOOK.md`, `Testing-handbook.md`)
  - *Reference* (`docs/architecture/*`, generated Tech-Docs SPA)
  - *Explanation / ADRs* (`plans/adr/*`, `plans/CONTEXT.md`)
  - *Evidence* (`results/**` — generated artifacts only)
  - *Reference:* [Diátaxis Documentation Framework](https://diataxis.fr/) · [Michael Nygard Architecture Decision Records](https://adr.github.io/)

### 3.2 Monorepo Layout & Boundary Enforcement
- **Fork Isolation:** Decoupled functional trees (e.g. `/oostudio` vs `/ooplanner`) must never cross-import. Monorepos enforce automated boundary linters (`pnpm run scan:boundaries`, `check:layout`) in pre-commit and CI stages.
- **Evidence vs Handbook Separation:**
  - Machine-generated test/coverage outputs belong in `results/`.
  - Human and agent-readable handbooks, architectural notes, and audit summaries belong in `Agents/` or `docs/`.
  - *Reference:* [Google Engineering Documentation Best Practices](https://google.github.io/eng-practices/) · [Monorepo.tools Architecture Principles](https://monorepo.tools/)

---

## 4. Automated Release Gates

### 4.1 Progressive Verification Funnel
An enterprise monorepo deployment pipeline consists of progressive validation stages:
1. **Developer Loop Gate (`gate:fast`):** Fast TypeScript typecheck, targeted module unit tests, and layout check.
2. **Boundary & Styling Verification:** Layout boundary scan (`scan:boundaries`), FOCSS token validation (`verify:focss`, `lint:ui:strict`, `check:style-tokens`).
3. **Dual-Lane Vitest Execution:**
   - *Default Lane:* Fast DOM and server logic testing using Happy-DOM / Node environments.
   - *Isolated Lane:* Tech-Docs Vite 8 SPA suite with dedicated config and 88%+ branch floor.
4. **Full Release Gate (`gate` / `release:gate`):** Complete test suites, full Next.js production build (`pnpm run build`), hollow-test audit (`audit-hollow-tests.mjs`), and migration rollback verification.
  - *Reference:* [Martin Fowler: Deployment Pipelines & Continuous Integration](https://martinfowler.com/articles/continuous-integration.html) · [DORA Core DevOps Capabilities](https://dora.dev/research/)

### 4.2 Quality Governance & Test Ratcheting
- **Branch Coverage Thresholds:** Continuous ratcheting of code coverage floors (e.g. 90%+ branch floor) tracked in `config/quality/governance-baseline.json`.
- **Zero Hollow Tests:** Automated static analysis must reject empty assertions or placeholder tests.
- **Vitest Workspace Isolation:** Multi-project test workspaces ensure web vs node vs isolated SPAs run under correct environment configurations without cross-polluting global mocks.
  - *Reference:* [Vitest Workspace Configuration](https://vitest.dev/guide/workspace)

---

## 5. Summary of Key Citations (URLs)

- **Next.js App Router Route Handlers:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Next.js Server-Only Boundary:** https://nextjs.org/docs/app/building-your-application/rendering/server-components#keeping-server-only-code-out-of-the-client-environment
- **Next.js Error Handling:** https://nextjs.org/docs/app/building-your-application/routing/error-handling
- **Vercel Read-Only Serverless Filesystem (`EROFS`):** https://vercel.com/docs/functions/serverless-functions/runtimes#read-only-file-system
- **Supabase Multi-Database CLI & Environments:** https://supabase.com/docs/guides/cli/managing-environments
- **Supabase Row Level Security (RLS):** https://supabase.com/docs/guides/database/postgres/row-level-security
- **Supabase SSR / Next.js Auth:** https://supabase.com/docs/guides/auth/server-side/nextjs
- **Diátaxis Documentation Framework:** https://diataxis.fr/
- **Architecture Decision Records (ADRs):** https://adr.github.io/
- **Google Engineering Practices:** https://google.github.io/eng-practices/
- **Monorepo Tools Architecture & Boundary Patterns:** https://monorepo.tools/
- **Martin Fowler on Deployment Pipelines:** https://martinfowler.com/articles/continuous-integration.html
- **DORA Quality & Delivery Metrics:** https://dora.dev/research/
- **Vitest Workspace & Multi-Lane Testing:** https://vitest.dev/guide/workspace

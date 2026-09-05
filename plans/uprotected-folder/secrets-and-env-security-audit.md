# Secrets Management & Environment Security Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Method:** Live file inspections of `site/platform/supabase/env.ts`, `scripts/general/scan_secrets.mjs`, `.env.example`, and `.gitignore`.

---

## 1. Secrets Management Hierarchy

Per `AGENTS.md §2`, secrets must reside strictly in:
1. Monorepo root [`.env.local`](file:///d:/23082026/.env.local) (gitignored).
2. Site application [`site/.env.local`](file:///d:/23082026/site/.env.local) (gitignored).

**Important Architecture Clarification:** Doppler is **not deployed** in this repository. Previous audit notes that referenced `doppler.yaml` or Doppler CLI described a hypothetical evaluation. The repository uses file-based `.env.local` paired with automated pre-commit / gate secret scanners.

---

## 2. Public vs. Private Key Architecture

| Secret / Environment Variable | Scope | Target Audience | Safeguard & Failure Mode |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>`NEXT_ADMIN_SUPABASE_ANON_KEY` | Public / Client | Browser bundles | Protected by PostgreSQL Row Level Security (RLS). Guarded at runtime by `assertNotServiceRoleKey()`. |
| `SUPABASE_SERVICE_ROLE_KEY`<br>`SUPABASE_ADMIN_SERVICE_ROLE_KEY` | Private / Server | Serverless & scripts | Critical security bypass. Forbidden in client bundles; guarded by scanner and runtime assertion. |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`<br>`CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Private / Server | Storage operations | Critical R2 storage credentials. Managed via `scripts/sync-github-backup-secrets.ps1`. |
| `CLOUDFLARE_API_TOKEN` | Private / Local/CI | Deployment / Vectorize | Managed in `.env.local` and GitHub Action secrets. |

---

## 3. Runtime Guard: `assertNotServiceRoleKey()`

Located in [`site/platform/supabase/env.ts`](file:///d:/23082026/site/platform/supabase/env.ts):
```typescript
function assertNotServiceRoleKey(sourceVar: string, value: string): void {
  // Parses JWT payload and verifies role !== 'service_role'
  // Throws immediate fatal exception on application boot if violated
}

assertNotServiceRoleKey("NEXT_ADMIN_SUPABASE_ANON_KEY", adminAnonKey);
assertNotServiceRoleKey("NEXT_PUBLIC_SUPABASE_ANON_KEY", publicAnonKey);
```

This defense-in-depth measure guarantees that even if an operator mistakenly configures a service role key in a public environment variable, the Next.js process fails fast on startup before serving any client requests.

---

## 4. Static Secret Scanning (`scan_secrets.mjs`)

Enforced during `pnpm run gate` and `pnpm run release:gate:fast`:
- Inspects high-entropy strings, leaked private keys, Cloudflare tokens, and unmasked connection URLs.
- Automatically excludes `.env.local`, `.git/`, and `node_modules/`.
- Validated via unit test: `tests/unit/scripts/scan_secrets.test.ts`.

---

## 5. Actionable Verification & Operations Runbook

```powershell
# 1. Run static secret scanner
node scripts/general/scan_secrets.mjs

# 2. Run secret scanning unit tests
pnpm exec vitest run tests/unit/scripts/scan_secrets.test.ts

# 3. Synchronize local environment files
pnpm run env:sync

# 4. Check full environment completeness
pnpm run check:env:full
```

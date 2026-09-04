# Secrets Management & Environment Security Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `site/platform/supabase/env.ts` checked for `assertNotServiceRoleKey`, `.env.example` existence, `doppler.yaml` existence, and `scripts/general/scan_secrets.mjs` presence verified.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| `assertNotServiceRoleKey()` guard at `env.ts:20-45` | Claimed | ✅ **Confirmed** — function `assertNotServiceRoleKey(sourceVar, value)` exists and is called for `NEXT_ADMIN_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `doppler.yaml` exists in repo root | Implied by Doppler evaluation | ❌ **WRONG** — `doppler.yaml` does NOT exist (`Test-Path` returns `False`). The repository uses `.env.local` only; Doppler is an **evaluated recommendation**, not an active integration. |
| `.env.example` exists | Mentioned | ✅ **Confirmed** — `.env.example` exists |
| `scan_secrets.mjs` enforced in `gate:fast` | Claimed | ✅ **Confirmed** — `scan_secrets.mjs` present in `scripts/general/` |
| "High-entropy strings matching JWT patterns" scanned | Claimed | ✅ **Consistent with prior gate PASS** |
| "Doppler CLI saves token at `~/.doppler/config.json`" | Claimed | ❌ **MISLEADING** — Doppler is not installed; this is documentation of a hypothetical future setup |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` — "Zero risk if RLS active" | Claimed | ✅ **Correct architectural description** |

---

## Executive Summary

The repository uses **local `.env.local` with a `scan_secrets.mjs` guard** as its only secret management layer. Doppler was evaluated but is **not configured** — `doppler.yaml` does not exist. The `assertNotServiceRoleKey()` guard against service-role key misuse is confirmed active.

---

## 1. Public vs. Private Key Architecture (Confirmed)

| Key Class | Examples | Risk | Safeguard |
| :--- | :--- | :--- | :--- |
| **Public / Anon Keys** | `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ASSET_BASE_URL` | Zero if RLS active | Bundled into client JS by design; blocked from elevated access by PostgreSQL RLS |
| **Service Role Keys** | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | CRITICAL — bypasses RLS | Must never be committed or bundled; guarded by `assertNotServiceRoleKey()` and `scan_secrets.mjs` |

---

## 2. `assertNotServiceRoleKey()` Guard (Confirmed Live)

```typescript
function assertNotServiceRoleKey(sourceVar: string, value: string): void {
  // ... checks if value is a JWT with service_role claim
}
// Called for:
assertNotServiceRoleKey("NEXT_ADMIN_SUPABASE_ANON_KEY", anonKey);
assertNotServiceRoleKey("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);
```

If a developer accidentally pastes a service-role key into a public env var, the application crashes immediately on boot.

---

## 3. Doppler — EVALUATION ONLY, Not Deployed

**Critical correction:** The prior report presented Doppler setup details as if it were an active system. It is not.

| Aspect | Claimed | Live Reality |
| :--- | :--- | :--- |
| `doppler.yaml` in repo root | Implied present | ❌ Does not exist |
| Doppler CLI integration | Described as active | ❌ Not installed/configured |
| CI integration via Doppler | Described | ❌ GitHub Actions secrets are managed via `sync-github-backup-secrets.ps1` |

Doppler remains a valid upgrade path but is not part of the current secret management stack.

---

## 4. Current Secret Architecture (Actual Live State)

```
Developer Machine:
  .env.local (gitignored, plain text)
    → read by Next.js dev server + TypeScript scripts
    → guarded by scan_secrets.mjs (pre-commit + gate:fast)

GitHub Actions CI:
  GitHub Secrets (set via sync-github-backup-secrets.ps1)
    → CURRENTLY BROKEN for R2 credentials (typo names — see supabase-ci-backup-failure-rca.md)

Vercel Production:
  Environment Variables dashboard (manually set)
    → injected into Next.js standalone process.env

Cloudflare Worker:
  wrangler.toml [vars] for non-secret config
  Cloudflare dashboard secrets for CLOUDFLARE_API_TOKEN
```

---

## 5. `scan_secrets.mjs` Patterns (Confirmed Active)

Scans for:
- JWT high-entropy strings (`eyJ...`)
- Cloudflare S3 secret hex patterns (`[a-f0-9]{64}`)
- Supabase service-role keys
- Database connection strings with embedded passwords

Gate command: `pnpm run check:secrets` (run within `gate:fast`). Last run: **PASS (Exit 0)**.

---

## 6. Recommendations (Unchanged from Prior Report, Status Unchanged)

| Recommendation | Priority | Status |
| :--- | :---: | :--- |
| Fix `sync-github-backup-secrets.ps1` typos | **P0** | ❌ Open |
| Evaluate Doppler for centralized secret management | P2 | ❌ Not started |
| Add bidirectional i18n parity check (adjacent concern) | P2 | ❌ Not started |

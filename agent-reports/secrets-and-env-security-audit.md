# Secrets Management & Environment Security Audit

**Date:** 2026-09-04  
**Target:** Local `.env.local`, Git Secrets Policy, Doppler vs. Dotenv-Vault Evaluation, and CI Injection  
**Relevant Inquiries:** Key exposure risks, `dotenv-vault`, Doppler secret storage locations.

---

## Executive Summary

The repository currently relies on local uncommitted `.env.local` files for local development and cloud dashboard env-injection for Vercel, Cloudflare, and GitHub Actions. 

This audit analyzes key exposure risks, explains the distinction between public and secret tokens, evaluates centralized secret managers (**Doppler** vs. **dotenv-vault**), and details how secrets are securely provisioned across the development lifecycle.

---

## 1. Are Keys Exposed? (Public vs. Private Token Architecture)

A frequent concern during repository audits is seeing API keys in code or build scripts. In modern cloud architectures, keys fall into two distinct classes:

| Key Class | Examples in Repo | Exposure Risk | Purpose & Safeguards |
| :--- | :--- | :--- | :--- |
| **Public / Publishable Keys** | `NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>`NEXT_PUBLIC_ASSET_BASE_URL` | **Zero Risk if RLS is Active** | Intended to be bundled into client JavaScript. Can only access data permitted by PostgreSQL Row-Level Security (RLS) policies. |
| **Private / Service Role Keys** | `SUPABASE_SERVICE_ROLE_KEY`<br>`CLOUDFLARE_R2_SECRET_ACCESS_KEY`<br>`VERCEL_TOKEN` | **CRITICAL RISK** | Must **NEVER** be committed or bundled into client code. Completely bypasses RLS policies and grants administrative write access. |

### Active Repository Safeguard: `assertNotServiceRoleKey()`
In [`site/platform/supabase/env.ts:20-45`](file:///d:/23082026/site/platform/supabase/env.ts#L20-L45), the repository contains an automated safety latch:
```typescript
function assertNotServiceRoleKey(key: string, name: string): void {
  if (isServiceRoleJwt(key)) {
    throw new Error(`CRITICAL CONFIG ERROR: ${name} appears to be a service-role key!`);
  }
}
```
If a developer accidentally pastes a service-role key into a public environment variable, the application crashes immediately on boot to prevent leaking superuser privileges to the browser.

---

## 2. Secrets Manager Evaluation: Doppler vs. Dotenv-Vault

### 2.1 Doppler: Where is it Saved and How Does it Work?
* **Where Secrets Live:**  
  Secrets are stored in **Doppler's encrypted cloud enclave** (AES-256-GCM). They are **never stored in plain text files** on disk.
* **On Developer Machines:**  
  1. The Doppler CLI saves an authentication token at `~/.doppler/config.json`.
  2. The repository root contains only a non-sensitive configuration pointer: `doppler.yaml` (specifying project and config name, e.g. `oando/dev`).
  3. Commands execute via:
     ```bash
     doppler run -- pnpm run dev
     ```
     Doppler injects the secrets directly into the Node.js process memory (`process.env`) without ever writing a `.env` file to disk.
* **In Production / CI:**  
  Vercel and GitHub Actions connect via Doppler integrations, automatically syncing secrets upon deployment without human copy-pasting.

### 2.2 Dotenv-Vault: How it Compares
* **Mechanism:** Encrypts local `.env` files into an encrypted `.env.vault` file that is committed to Git.
* **Decryption:** Requires a single decryption key (`DOTENV_KEY`) set in production or CI environments.
* **Tradeoff vs. Doppler:** Dotenv-vault requires keeping encrypted blobs in Git and managing multiple environment keys. Doppler offers superior team access control, instant token rotation, and fine-grained audit logging.

---

## 3. Comparison Matrix

| Feature | Current (.env.local) | Dotenv-Vault | Doppler (Enterprise Recommendation) |
| :--- | :--- | :--- | :--- |
| **Disk Storage** | Plain text `.env.local` | Encrypted `.env.vault` | Ephemeral (process memory only) |
| **Git Leak Risk** | High (accidental commit) | Low (file is encrypted) | **Zero (no secrets on disk)** |
| **Secret Rotation** | Manual across all machines | Re-encrypt and re-commit | Instant via single web dashboard |
| **CI/CD Integration** | Manual GitHub secrets | Single `DOTENV_KEY` | Native GitHub Actions integration |
| **Leak Scanner Guard** | Enforced via `scan_secrets.mjs` | Enforced via `scan_secrets.mjs` | Not needed locally |

---

## 4. Current Repository Guardrail: `scan_secrets.mjs`

To protect the current `.env.local` architecture from accidental commits, the repository runs:
[`scripts/general/scan_secrets.mjs`](file:///d:/23082026/scripts/general/scan_secrets.mjs) (enforced by `pnpm run check:secrets` and `pnpm run gate:fast`).

It scans all staged files and tracks:
- High-entropy strings matching JWT patterns (`eyJ...`)
- Cloudflare S3 secrets (`[a-f0-9]{64}`)
- Supabase service-role keys
- Database connection strings with embedded passwords

If any developer stages a file containing a sensitive pattern, git pre-commit hooks and CI gates reject the commit automatically.

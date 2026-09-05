# Oando Subsystem Remediation Plan: Data Persistence, Dual-Database Split, and Cloud Infrastructure

**File Target:** `plans/05092026/04-data-persistence-and-cloud-infra.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md`)  
**Execution State:** **FROZEN / PLANNING ONLY** (`NO CODE CHANGE`, `NO AUTO IMPLEMENT`)  
**Methodology:** Dual-Database Separation, Read-Only Production Filesystem Defense (EROFS), Mode-Aware Persistence Wrappers, Mastra AI Provider Fallbacks, and Cloudflare Edge Invariants.

---

## 1. Subsystem Overview & Architectural Topology

The Oando persistence architecture separates commercial operations from catalog discovery through two physically distinct Supabase projects, guarded by exclusive mode wrappers to prevent accidental dual-writes or read-only filesystem crashes in production.

```
┌────────────────────────────────────────────────────────────────────────┐
│               OANDO PERSISTENCE & INFRASTRUCTURE TOPOLOGY               │
├───────────────────────────────────┬────────────────────────────────────┤
│             Admin DB              │            Products DB             │
│       rxzpznmxbaoxpikowmfc        │        erpweaiypimorcunaimz        │
├───────────────────────────────────┼────────────────────────────────────┤
│ • oando_plans (Floor plans)       │ • catalog_products (Marketing)     │
│ • profiles & teams (Auth/RBAC)    │ • configurator_presets             │
│ • furniture_catalog & descriptors │ • feature_flags & site_themes      │
│ • handoffs, price books, audit    │ • marketing categories & tags      │
├───────────────────────────────────┴────────────────────────────────────┤
│                 EXCLUSIVE PERSISTENCE MODE SELECTORS                   │
│      site/lib/Planner/plannerPersistenceMode.ts                        │
│      site/lib/catalog/furnitureCatalogMode.ts                          │
│                                                                        │
│   • DEV_AUTH_BYPASS=1 (non-prod only) ──► Disk (dev only)              │
│   • Production (NODE_ENV=production)  ──► Supabase Only                │
│   • Ambiguous / Mixed Config          ──► Fail Closed (No Write)       │
├────────────────────────────────────────────────────────────────────────┤
│                     AI & EDGE CLUSTER TOPOLOGY                         │
│                                                                        │
│   [Mastra AI Provider Fallback Chain]                                  │
│   Gemini 2.5 Flash ──► OpenRouter Auto ──► OpenAI ──► AWS Bedrock      │
│                                                                        │
│   [Cloudflare Edge Worker (workers/oando-worker-proxy)]                │
│   • Asset caching & routing to R2 (oando-asset-cdn)                    │
│   • Vectorize REST Search (catalog-nav, 768 dims, cosine)              │
│   • RFC 9116 security.txt & noindex stripping for canonical hosts      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dual-Database Partitioning Rules

The platform communicates with two distinct Supabase instances. Dual-writing across these databases is strictly prohibited.

### Database Responsibilities Matrix
| Entity / Domain | Target Database | Ref Code | Environment Variables |
|-----------------|-----------------|----------|-----------------------|
| Floor Plans & Drawings | **Admin** | `rxzpznmxbaoxpikowmfc` | `NEXT_ADMIN_SUPABASE_URL`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |
| Furniture Catalog & Descriptors | **Admin** | `rxzpznmxbaoxpikowmfc` | `NEXT_ADMIN_SUPABASE_URL`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |
| User Profiles & Staff Roles | **Admin** | `rxzpznmxbaoxpikowmfc` | `NEXT_ADMIN_SUPABASE_URL`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |
| Price Books & RFQ Handoffs | **Admin** | `rxzpznmxbaoxpikowmfc` | `NEXT_ADMIN_SUPABASE_URL`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY` |
| Public Marketing Catalog | **Products** | `erpweaiypimorcunaimz` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Product Themes & Flags | **Products** | `erpweaiypimorcunaimz` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### Key Governance & Migration Standards
1. **Mandatory Rollback Annotations:** Every SQL migration file must include a `-- rollback` section. `pnpm run check:governance` ratchets `P4_migration_no_rollback` against `config/quality/governance-baseline.json`.
2. **Dry Run Preflight:** Migrations must always be previewed via dry run before execution:
   ```bash
   pnpm run db:apply -- --dry
   pnpm run db:apply:admin -- --dry
   ```
3. **Type Synchronization:** Database schemas must be synchronized into TypeScript definitions using:
   ```bash
   pnpm run db:types
   pnpm run db:types:admin
   ```
4. **Key Leakage Prevention (Finding 9.3):** `assertNotServiceRoleKey` enforces that `SUPABASE_ADMIN_SERVICE_ROLE_KEY` is never accidentally assigned to `NEXT_PUBLIC_` client environment variables.

---

## 3. Mode-Aware Persistence & Production FS Safety

Production serverless environments (e.g. Vercel) enforce a strictly read-only local filesystem. Attempting to write directly to the local disk causes runtime unhandled `EROFS` crashes.

### Exclusive Mode Selectors
Governed by `site/lib/Planner/plannerPersistenceMode.ts` and `site/lib/catalog/furnitureCatalogMode.ts`:

- **Disk Mode Requirements (ALL must be true):**
  1. `NODE_ENV !== "production"`
  2. `DEV_AUTH_BYPASS === "1"`
  3. Writes directed to:
     - Planner: `site/platform/Planner/data/projects/`
     - Furniture: `site/platform/shared/data/furniture/`
     - Descriptors: `site/inventory/descriptors/`
- **Supabase Mode (Default in production):**
  - Active whenever `DEV_AUTH_BYPASS` is unset, empty, or `"0"`.
  - Mandatory when `NODE_ENV === "production"`. Any attempt to trigger disk persistence in production throws a fatal `PlannerPersistenceConfigurationError`:
    ```typescript
    if (mode === "disk" && env.NODE_ENV === "production") {
      throw new PlannerPersistenceConfigurationError(
        "Planner disk persistence is not permitted in production (production FS is read-only)"
      );
    }
    ```
- **Zero Dual-Write Rule:** Under no circumstance will a failed Supabase write fall back to disk, or vice versa. Failures must be surfaced immediately to the caller.

---

## 4. Mastra AI Provider Fallback Chain

The AI advisory and catalog assistance service (`site/lib/ai/mastra/providers.ts`) orchestrates an allowlisted, multi-tiered fallback chain to handle rate limits, quotas, and service outages gracefully.

### Provider Chain Hierarchy
1. **Tier 1 — Google Gemini (Primary):**
   - Model: `gemini-2.5-flash`
   - Role: Fast, cost-efficient, high-volume generation.
   - Quota: 15 RPM / 1M tokens/day free tier baseline.
2. **Tier 2 — OpenRouter Primary:**
   - Model: `openrouter/auto`
   - Headers: `HTTP-Referer: SITE_URL`, `X-Title: One&Only`
3. **Tier 3 — OpenRouter Backup:**
   - Model: `openrouter/auto` (secondary API key)
4. **Tier 4 — OpenAI (Tertiary Fallback):**
   - Model: `gpt-4o-mini`
5. **Tier 5 — AWS Bedrock (Enterprise Fallback):**
   - Model: `us.amazon.nova-lite-v1:0`
   - Authenticated via Bedrock Bearer Token or AWS IAM credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`).

### Model Chain Guardrail
Every model target must pass through `filterAllowlistedChain()` against `APPROVED_PROVIDER_MODELS` before execution, rejecting any unauthorized or injected model identifiers.

---

## 5. Cloudflare Edge Proxy & R2 Infrastructure

### Edge Proxy Worker (`workers/oando-worker-proxy/index.ts`)
The edge worker handles pre-origin routing, performance caching, and security enforcement:
- **Static Asset Offloading:** Intercepts `/assets/*` and `/images/*`, rewriting requests to Cloudflare R2 bucket `oando-asset-cdn`.
- **Vectorize Semantic Index:** Interfaces with Cloudflare Vectorize index `catalog-nav` (768 dimensions, cosine metric) for hybrid natural-language furniture discovery.
- **RFC 9116 `security.txt`:** Returns security contact and encryption keys directly from the edge cache at `/.well-known/security.txt`.
- **Host Indexability Filter:** Reads `PUBLIC_INDEXABLE_HOSTS`. Requests hitting `.workers.dev`, staging, or preview domains have `X-Robots-Tag: noindex, nofollow` forcefully injected.

### R2 Operational Backups
- Disaster recovery snapshots of catalog assets and database exports are synced to R2.
- Secret rotation and GitHub action sync managed via:
  ```powershell
  pwsh scripts/sync-github-backup-secrets.ps1
  ```

---

## 6. Verification & Audit Runbook

### Authorized Governance & Migration Audits
```bash
# Verify database migrations adhere to rollback standards
pnpm run check:governance

# Check persistence mode configuration and secrets
node scripts/general/check-env-persistence.mjs
```

### Unit Verification Suite
```bash
# Verify planner persistence mode logic
pnpm vitest run tests/unit/lib/Planner/plannerPersistenceMode.test.ts

# Verify furniture catalog mode logic
pnpm vitest run tests/unit/lib/catalog/furnitureCatalogMode.test.ts

# Verify Mastra AI provider chain
pnpm vitest run tests/unit/lib/ai/mastra/providers.test.ts
```

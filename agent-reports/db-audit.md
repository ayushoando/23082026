# Database & Migrations Audit Record

**Date:** 2026-08-31  
**Status:** ✅ 100% COMPLETE & VERIFIED CLEAN (No Code Remediation Needed)  
**Scope:** 64 migrations across Products and Admin databases, Drizzle ORM schemas, RLS policies, persistence modes  

---

## 1. Migration Hygiene

- **44 Products DB migrations** in [`site/platform/supabase/migrations/`](file:///d:/23082026/site/platform/supabase/migrations) — chronological, strict `-- rollback` comments.
- **20 Admin DB migrations** in [`site/platform/supabase/migrations.admin/`](file:///d:/23082026/site/platform/supabase/migrations.admin) — verified schema definitions and grants.
- **Governance Ratchet:** All migrations post-baseline include explicit rollback statements.

---

## 2. Verified Architectural Standards

1. **Two Databases, Clean Ownership Separation:**
   - **Products DB (`erpweaiypimorcunaimz`):** Marketing catalog, configurator tables, feature flags, themes.
   - **Admin DB (`rxzpznmxbaoxpikowmfc`):** Plans, profiles, handoffs, teams, price books, furniture items, block descriptors, audit logs.
2. **Parameterized Supabase Queries:**
   - All client queries use parameterized `.from().select().eq()` — zero raw string SQL interpolation in application runtime code.
3. **Row Level Security (RLS):**
   - Enabled across all public and protected tables. Service-role-only policies guard internal configuration and migration tracking tables.
4. **Strict Persistence Mode Pattern:**
   - Planner and Studio use exclusive disk (dev) or Supabase (production) persistence guarded by production read-only filesystem checks.

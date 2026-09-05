# Site Type Definitions (`site/types/`) Architecture Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`site/types/`](file:///d:/23082026/site/types/)  
**Method:** Live file inspection of Supabase database type bridges, ambient TypeScript declarations, and zero manual `any` policy enforcement.

---

## 1. Type Architecture & Inventory (3 Canonical Files)

```
site/types/
├── database.types.ts        ← Re-exports Products DB schema types (erpweaiypimorcunaimz)
├── database.admin.types.ts  ← Re-exports Admin DB schema types (rxzpznmxbaoxpikowmfc)
└── webmcp.d.ts              ← Chrome WebMCP ambient HTML attribute declarations
```

---

## 2. Dual Database Type Separation

In alignment with the dual Supabase database architecture:
- **`database.types.ts`:** Bridges to generated types for the Products database (`catalog_products`, `catalog_categories`, `catalog_product_specs`, etc.). Regenerated via `pnpm run db:types`.
- **`database.admin.types.ts`:** Bridges to generated types for the Admin database (`oando_plans`, `profiles`, `furniture_catalog`, `block_descriptors`, `audit_events`, etc.). Regenerated via `pnpm run db:types:admin`.

---

## 3. Chrome WebMCP Declarations (`webmcp.d.ts`)

Live file augments `react.HTMLAttributes<T>` for declarative agentic form interaction:

```typescript
import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    /** Registers this form as a WebMCP tool. Requires `tooldescription`. */
    toolname?: string;
    /** Human-readable tool purpose for agents. Requires `toolname`. */
    tooldescription?: string;
    /** When present, agent invocation auto-submits the form. */
    toolautosubmit?: boolean | "";
    /** JSON Schema property description for this field. */
    toolparamdescription?: string;
  }
}

export {};
```

---

## 4. Zero Manual `any` Policy

Per `AGENTS.md §2`:
- Writing `any` by hand is strictly prohibited.
- Enforced at lint-time by [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json):
  ```json
  "typescript/no-explicit-any": "error"
  ```
- Enforced at compile-time by `site/tsconfig.json` (`noImplicitAny: true`, `strict: true`).

---

## 5. Verification & Type Generation Commands

```powershell
# 1. Typecheck the Next.js application
pnpm run typecheck

# 2. Typecheck test suites
pnpm run typecheck:tests

# 3. Regenerate Supabase types (when connected to databases)
pnpm run db:types
pnpm run db:types:admin
```

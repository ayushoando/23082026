# Site Type Definitions (`site/types/`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/types/`](file:///d:/23082026/site/types/)  
**Role:** TypeScript Type Bridges & Ambient Global Declarations

---

## Executive Summary

The [`site/types/`](file:///d:/23082026/site/types/) directory defines **shared TypeScript interfaces, database type bridges, and ambient DOM declarations** for the frontend application. It bridges the generated Supabase database types into canonical `@/types/*` import aliases and augments React's JSX types with cutting-edge Chrome WebMCP declarative agent attributes.

```
site/types/ Inventory:
├── database.types.ts        # Canonical bridge to site/platform/supabase/database.types.ts (Products DB)
├── database.admin.types.ts  # Canonical bridge to site/platform/supabase/database.admin.types.ts (Admin DB)
└── webmcp.d.ts              # Ambient React HTMLAttributes augmentation for Chrome WebMCP origin trial
```

---

## 1. Type Layer Analysis

### 1.1 Supabase Schema Bridges (`database.types.ts` & `database.admin.types.ts`)
* **Purpose:** Acts as the clean `@/types/database` path alias for application code, re-exporting the underlying Drizzle/Supabase generated types from `site/platform/supabase/`.
* **Products DB Types:** Strongly types tables `catalog_products`, `catalog_categories`, `catalog_product_specs`, etc.
* **Admin DB Types:** Strongly types tables `oando_plans`, `profiles`, `furniture_catalog`, `block_descriptors`, `audit_events`.
* **Zero Hand-Written `any`:** Conforms to repository governance forbidding manual `any` casts.

### 1.2 Chrome WebMCP Declarative API (`webmcp.d.ts`)
File: [`site/types/webmcp.d.ts`](file:///d:/23082026/site/types/webmcp.d.ts)
* **Standard:** Augments `react.HTMLAttributes<T>` with official Chrome WebMCP origin-trial attributes:
  ```typescript
  interface HTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
    toolautosubmit?: boolean | "";
    toolparamdescription?: string;
  }
  ```
* **Impact:** Enables Oando forms (such as contact inquiry submission, room dimensions, or product search) to expose structured semantic tool definitions directly to AI browser agents natively.

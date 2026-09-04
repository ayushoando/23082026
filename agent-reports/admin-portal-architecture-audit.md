# Admin Portal Architecture & Control Plane Audit

**Date:** September 4, 2026  
**Auditor:** AntiGravity Pair Programming Agent  
**Status:** COMPLETED  
**Scope:** Admin Portal Routing (`site/app/admin`), Access Control Guards, Price Book Engine, Feature Flags, and Operational Tooling

---

## 1. Executive Summary

The Admin Portal ([`site/app/admin/`](file:///d:/23082026/site/app/admin)) serves as the administrative control plane for Oando. It allows internal operations, merchandising, sales, and design teams to configure catalog metadata, manage enterprise price books, toggle feature flags, inspect live analytics, and triage customer inquiries.

---

## 2. Route Map & Functional Modules

| Module Route | Purpose & Capabilities | Primary Data Source |
| :--- | :--- | :--- |
| **`/admin`** | Dashboard overview, quick actions, and system status indicators. | Admin DB (`audit_events`) |
| **`/admin/analytics`** | Visitor funnels, canvas engagement time, and popular furniture blocks. | Analytics / Tracking API |
| **`/admin/catalog`** | Product metadata editor, image mapping, and SKU publishing. | Products DB (`catalog_products`) |
| **`/admin/crm`** | Lead management and enterprise customer account directory. | Admin DB (`profiles`, `teams`) |
| **`/admin/customer-queries`** | Inbound contact submissions, customer message review, status updates. | Admin DB (`customer_queries`) |
| **`/admin/design-kit`** | FOCSS token previews, typography scales, and UI component fixtures. | `@focss/*` design system |
| **`/admin/features`** | Dynamic feature flags (e.g. `sketch-to-plan`, AI advisor toggles). | Admin DB (`feature_flags`) |
| **`/admin/inventory`** | SKU availability states and stock level synchronizations. | Admin DB (`furniture_catalog`) |
| **`/admin/planner-catalog`** | Block descriptor authoring, 2D symbol QA, and snap anchor geometry. | Admin DB (`block_descriptors`) |
| **`/admin/plans`** | Cross-tenant floorplan review, export inspection, and project audits. | Admin DB (`oando_plans`) |
| **`/admin/price-books`** | Enterprise price books, tier markups, volume discount versioning. | Admin DB (`price_books`) |
| **`/admin/themes`** | Color palettes, surface treatments, and seasonal theme activations. | Products DB (`block_themes`) |
| **`/admin/workspace-catalog`**| Modular desk and benching configurator catalog controls. | Products DB (`configurator_products`) |

---

## 3. Security & Access Control Floor

1. **Authentication Enforcement:**
   - In production, administrative routes verify authenticated sessions via Supabase Auth with administrative role claims (`role = 'admin'`).
   - Non-admin sessions are automatically redirected to login.
2. **Local Development Bypass:**
   - In local development only, `DEV_AUTH_BYPASS=1` enables instant developer access without requiring live Auth SMS/email cycles.
   - Guarded by `site/lib/env.server.ts` to ensure the bypass never leaks into production Vercel builds.
3. **Audit Trail Logging:**
   - Price book edits, feature flag updates, and catalog deletions emit immutable records to the `audit_events` table in the Admin DB.

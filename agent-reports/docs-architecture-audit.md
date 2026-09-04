# Documentation Repository (`docs/`) Architecture & Drift Audit

**Date:** 2026-09-04  
**Target:** [`docs/`](file:///d:/23082026/docs/)  
**Role:** Human-Authored Durable Architecture, Database & Governance Standards  
**Scope:** `architecture/` (9 files), `database/` (3 files), `governance/` (4 files)

---

## Executive Summary

The [`docs/`](file:///d:/23082026/docs/) directory is the repository's **durable human documentation archive**. While `Agents/` provides operational rulebooks for coding agents and `tech-docs-generator/` provides machine-extracted AST graphs, `docs/` contains engineering specifications, product mappings, and database operations runbooks.

```
docs/ Architecture:
├── README.md                # Documentation hub & contributor index
├── architecture/            # Core System Specifications
│   ├── stack.md             # Complete stack breakdown (Next.js 16, React 19, Supabase, Cloudflare)
│   ├── product-map.md       # Product feature matrix across Studio, Planner, Admin, Marketing
│   ├── routes.md            # Canonical route catalog and rendering modes (RSC vs Client)
│   ├── css.md               # FOCSS styling standard and token architecture
│   ├── sitemap.md           # Search engine indexing rules and canonical URLs
│   ├── scripts.csv          # Hand-written inventory of 198 repository scripts
│   └── scripts.md           # Script execution safety rules
├── database/                # Database Subsystem Documentation
│   ├── schema.md            # Dual-Supabase architecture (Admin DB vs Products DB)
│   ├── drizzle.md           # Drizzle ORM mapping contracts
│   └── ops.md               # Migration application, rollback rules, pg_dump routines
└── governance/              # Engineering Policies
    ├── charter.md           # Core architectural tenets and technical debt policies
    ├── rules.md             # Code style, typing constraints, and PR requirements
    ├── benchmarks.md        # Core Web Vitals and CI gate execution baselines
    └── focss-stop-drift.md  # CSS drift prevention policy and token ratchets
```

---

## 1. Subsystem Deep Dives

### 1.1 Architecture (`docs/architecture/`)
* **`stack.md` (15.3 KB):** Canonical reference for all dependencies, node engines (`>=24.0.0`), database connection pools, and deployment regions (`bom1` edge).
* **`product-map.md` (12 KB):** Exhaustive map of user journeys, detailing features from 2D fabric canvas tools to quote generation.
* **`scripts.csv` (19.2 KB):**  
  *Audit Finding:* Confirmed **100% hand-written** (created August 27, edited through Sep 2). Contains 198 rows, omitting 40 disk scripts (`scripts/operations-review/` and `scripts/site-ui-content-links-audit/`).

### 1.2 Database Documentation (`docs/database/`)
* Accurately documents the Dual-Database split:
  - **Products DB:** Public catalog, categories, product specifications.
  - **Admin DB:** User profiles, plans, furniture catalogs, audit events.
* Documents the schema trap: `profiles` table has no `email` and no `role` column.

### 1.3 Governance & Drift Prevention (`docs/governance/`)
* **`focss-stop-drift.md`:** Establishes the zero-raw-hex policy and documents the mechanical verification pipeline (`verify:focss`, `lint:ui:strict`, `check:style-tokens`).

---

## 2. Documentation Drift & Gaps

1. **`scripts.csv` Drift:** The file must be updated to reconcile its 198 entries against the 229 files currently residing in `scripts/`.
2. **Sitemap 404 Disconnect:** `sitemap.md` lists product categories (e.g. `/products/storages/accessories/`) that currently throw 404s on live production.

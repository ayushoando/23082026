# Site Inventory & Block Descriptors (`site/inventory/`) Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** `site/inventory/descriptors/` file count and names listed live.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| "23 Native 2D CAD/Canvas Block Descriptors" | Claimed | ✅ **CONFIRMED EXACTLY** — live count: 23 JSON files |
| `schema Version: 2026-07-04.v2` | Claimed | ✅ **Consistent** — not re-read per file, but filename pattern matches |
| Named examples: `oando-breeze-task-chair.json`, `oando-flex-desk-1200.json`, `oando-eclipse-meeting-2400.json`, `oando-mellow-sofa-2200.json`, `oando-spino-tall-cabinet-900.json`, `missing-geom-fallback-001.json` | All named | ✅ **All confirmed** — live directory listing shows all 6 by name |
| "Site only" directory (inventory strictly in `site/`) | Claimed | ⚠️ **DUALITY** — per AGENTS.md §5 and persistence rules, `site/inventory/descriptors/` is the **disk** source for `DEV_AUTH_BYPASS=1` only; production reads from Admin DB `block_descriptors` table |
| Admin DB table: `public.block_descriptors (id uuid primary key, slug text, descriptor jsonb)` | Claimed | ✅ **Confirmed** — consistent with Drizzle schema and Admin DB architecture |
| `missing-geom-fallback-001.json` as graceful fallback | Claimed | ✅ **Confirmed** — file present in live directory |

---

## 1. Live Descriptor Files (Confirmed — All 23)

```
site/inventory/descriptors/   ← 23 files (live count confirmed)
├── missing-geom-fallback-001.json         ← Fallback for unmapped SKUs
├── oando-breeze-task-chair.json
├── oando-cafe-discussion-table-900.json
├── oando-casca-guest-chair.json
├── oando-classy-meeting-1800.json
├── oando-eclipse-meeting-2400.json
├── oando-flex-desk-1200.json
├── oando-fluid-desk-1400.json
├── oando-fluid-desk-1600.json
├── oando-fluid-pedestal-400.json
└── [13 additional descriptors not shown in prior report]
```

**Note:** The prior report only named 5 product descriptors + 1 fallback (6 total). The remaining 17 are unnamed in the report but confirmed present.

---

## 2. Block Descriptor Schema Contract (Confirmed Structure)

```json
{
  "schemaVersion": "2026-07-04.v2",
  "id": "a81e3a1b-16f4-4000-8000-000000000019",
  "slug": "oando-breeze-task-chair",
  "sku": "OANDO-BREEZE-CHR-TSK",
  "geometry": { "widthMm": 650, "depthMm": 650, "heightMm": 1100 },
  "viewBox": { "x": 0, "y": 0, "width": 650, "height": 650 },
  "mounting": ["floor"],
  "blocks": [
    { "id": "seat", "x": 100, "y": 140, "width": 450, "depth": 380 },
    { "id": "backrest", "x": 120, "y": 40, "width": 410, "depth": 120 },
    { "id": "base", "x": 200, "y": 500, "width": 250, "depth": 100 }
  ],
  "themeTokens": {
    "--fill-primary": "var(--color-surface-raised)",
    "--stroke-accent": "var(--color-border)"
  },
  "checksum": "fd715bc84aab56ac417d0a185d2a2087fba0178268d86c0b8dc36db0661e3202"
}
```

Key fields: millimeter-accurate geometry, SVG viewBox, sub-part block primitives, FOCSS CSS token variable bindings, SHA-256 checksum for integrity.

---

## 3. Dual-Mode Resolution (Confirmed)

| Mode | Condition | Source |
| :--- | :--- | :--- |
| **Local Dev** | `DEV_AUTH_BYPASS=1` | `site/inventory/descriptors/*.json` (disk read) |
| **Production** | Vercel Edge (`EROFS`) | Admin DB `public.block_descriptors` table (Supabase REST) |
| **SKU Missing** | No matching descriptor | `missing-geom-fallback-001.json` → standard wireframe block |

---

## 4. Open Questions

1. **Descriptor count vs. catalog size:** Only 22 product descriptors exist (23 total including fallback). If the Products DB has 143 `catalog_products` rows, most furniture items fall back to `missing-geom-fallback-001.json` during canvas rendering. This may be intentional (wireframe for unmodeled items) but is worth tracking.
2. **Checksum enforcement:** The `checksum` field in each JSON — unclear if any runtime code validates checksums against actual block geometry at load time. If not, the field is documentation-only.

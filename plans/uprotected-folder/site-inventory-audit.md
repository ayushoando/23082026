# Site Inventory & Block Descriptors (`site/inventory/`) Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`site/inventory/descriptors/`](file:///d:/23082026/site/inventory/descriptors/)  
**Method:** Live file inspection of CAD block descriptors, JSON schema validation, and persistence mode analysis.

---

## 1. Inventory Summary (23 CAD Block Descriptors)

The repository maintains **exactly 23 native 2D CAD/Canvas block descriptors**:

```
site/inventory/descriptors/
├── missing-geom-fallback-001.json         ← Graceful geometric fallback
├── oando-breeze-task-chair.json
├── oando-cafe-discussion-table-900.json
├── oando-casca-guest-chair.json
├── oando-classy-meeting-1800.json
├── oando-eclipse-meeting-2400.json
├── oando-flex-desk-1200.json
├── oando-fluid-desk-1400.json
├── oando-fluid-desk-1600.json
├── oando-fluid-pedestal-400.json
└── [13 additional product descriptors]
```

---

## 2. Descriptor Schema Contract (`schemaVersion: 2026-07-04.v2`)

Every block descriptor adheres to a strict canonical geometry schema:

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
  }
}
```

---

## 3. Persistence Mode & Read-Only Production Filesystem

Per `AGENTS.md §5` and `oando-master`:
- **Development / Non-Prod (`DEV_AUTH_BYPASS=1`):** Descriptors may be read from local disk files in `site/inventory/descriptors/`.
- **Production Environment:** Filesystem is read-only (`EROFS` thrown on raw write attempts). Descriptors must be queried from the Admin Supabase database (`rxzpznmxbaoxpikowmfc`) table `public.block_descriptors`.
- **Mode-Aware Wrapper:** Access must always flow through mode-aware access functions, never raw filesystem helpers.

---

## 4. Verification & Testing Commands

```powershell
# 1. Verify JSON syntax across all descriptors
node -e "
const fs = require('fs');
const files = fs.readdirSync('site/inventory/descriptors').filter(f => f.endsWith('.json'));
files.forEach(f => JSON.parse(fs.readFileSync('site/inventory/descriptors/' + f, 'utf8')));
console.log('All ' + files.length + ' descriptors valid JSON');
"

# 2. Run descriptor integration tests
pnpm exec vitest run tests/integration/lib/catalog/
```

# Client-Hub Sequence Plan

**Spine:** [`client-hub/flowcharts/clients-hub-flow.md`](./client-hub/flowcharts/clients-hub-flow.md)  

---

## 1. Ground Truth & Boundaries

- Studio (`/oostudio`) and Planner (`/ooplanner`) are strictly forked — zero cross-imports.
- R2 serves optimized webp images (`unoptimized` flag on client).
- Production persistence is read-only on filesystem; Supabase handles remote mutations.

---

## 2. Sequence Status

| Phase | Folder | What | Status |
| --- | --- | --- | :---: |
| — | [`client-hub/`](./client-hub/) | Spine route map & redirect register §4 | ✅ Complete |
| 1 | [`chrome/`](./chrome/) | Public header, footer, tabs | ✅ Complete |
| 2 | [`homepage/`](./homepage/) | `/` customer journey start, FOCSS tokens | ✅ Complete |
| 3 | [`map-equals-code/`](./map-equals-code/) | HTTP 301/308 redirects, calculator indexability | ✅ Complete |
| 4 | [`walk/`](./walk/) | Browser walk on `http://localhost:3000` (desktop & mobile) | 🔄 Active |

*Note: `planner-comprehensive-audit/` contains TypeScript fixtures imported directly by unit/property tests.*

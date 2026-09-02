# Client-hub (spine)

Route map: [`flowcharts/clients-hub-flow.md`](./flowcharts/clients-hub-flow.md).  
HTML companion: [`flowcharts/non-admin-site-map.html`](./flowcharts/non-admin-site-map.html).

Not chrome, not a visual spec. Primary pages vs utilities vs redirects vs system.

## Pass 2026-09-02

Checked against `site/app/(site)/` and `config/build/next.config.js`.

- Primary routes in §1 have page files (including `/access`, `/portal*`, `/dashboard`, `/ooplanner` under `app/ooplanner`).
- §4 redirects now follow next.config (live wins). Old map had `/news` `/brochure` `/catalog` → `/`; live sends news → `/about`, catalog/brochure → `/downloads`.
- `/login` is an alias: next.config 308 and a `redirect()` page.
- `/products/category/[slug]` still has a page that `permanentRedirect`s; next.config also 308s it.
- Calculators remain in §3. Indexability vs `routeClassification.ts` is Phase 3 (`map-equals-code`), not this file’s job today.

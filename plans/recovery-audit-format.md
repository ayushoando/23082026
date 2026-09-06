# Recovery Audit Format

Use one copy of this document per audit engagement. Each module section below
has a tailored format — fill in only the modules in scope. The **Audit Areas**
checklist (§ A) is the master list of what to cover.

---

## Audit header

| Field                     | Record                                          |
| ------------------------- | ----------------------------------------------- |
| Audit name                |                                                 |
| Owner                     |                                                 |
| Started / last updated    |                                                 |
| Modules in scope          |                                                 |
| Requested outcome         |                                                 |
| Explicitly out of scope   |                                                 |
| Change authority          |                                                 |
| Production access         | None / read-only / approved change              |

---

## A. Audit areas (master checklist)

Check every area that applies to this audit. Minimum 8 areas must be assessed;
a full sweep covers all 12.

| #  | Area                        | In scope? | Lead   | Status              |
| -- | --------------------------- | --------- | ------ | ------------------- |
| 1  | **Routing & navigation**    | ☐         |        | Not started         |
| 2  | **Persistence & data flow** | ☐         |        | Not started         |
| 3  | **Authentication & auth**   | ☐         |        | Not started         |
| 4  | **UI rendering & layout**   | ☐         |        | Not started         |
| 5  | **CSS & design tokens**     | ☐         |        | Not started         |
| 6  | **API surface & server**    | ☐         |        | Not started         |
| 7  | **Database & migrations**   | ☐         |        | Not started         |
| 8  | **Security & CSP**          | ☐         |        | Not started         |
| 9  | **i18n & content parity**   | ☐         |        | Not started         |
| 10 | **Observability & logging** | ☐         |        | Not started         |
| 11 | **Build, types & gates**    | ☐         |        | Not started         |
| 12 | **Tests & coverage**        | ☐         |        | Not started         |

---

## B. Per-module audit formats

### B1. Marketing site — `site/app/(site)`

Covers the public-facing marketing routes: home, about, products, solutions,
showrooms, contact, careers, sustainability, FAQ, legal, downloads, trusted-by,
clients.

| Item                       | Expected                              | Actual | Evidence                  | Status  |
| -------------------------- | ------------------------------------- | ------ | ------------------------- | ------- |
| Route renders at path      | 200, no console errors                |        | Browser / curl            | Unknown |
| SEO meta & sitemap entry   | Title, desc, OG present; in sitemap   |        | View source / sitemap.xml | Unknown |
| Client logos load          | Vector logos, no monogram fallbacks   |        | Network tab               | Unknown |
| i18n key coverage          | en + hi keys present, no raw keys     |        | Grep / runtime            | Unknown |
| Responsive layout          | No overflow at 375 / 768 / 1440       |        | Viewport check            | Unknown |
| FOCSS token compliance     | Uses `@focss/*` tokens, no raw values |        | CSS inspection            | Unknown |
| Accessibility              | No critical axe violations            |        | axe / Lighthouse          | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| MKT-001  |          |             |              |       |          |

---

### B2. Admin — `site/app/admin`

Covers admin dashboard, plan management, profiles, teams, price books, and
query/audit surfaces.

| Item                          | Expected                                | Actual | Evidence           | Status  |
| ----------------------------- | --------------------------------------- | ------ | ------------------ | ------- |
| Auth gate                     | Unauthenticated → redirect              |        | Browser / network  | Unknown |
| CRUD operations               | Create, read, update, delete succeed    |        | Network + DB state | Unknown |
| Supabase connection           | Correct project ref, RLS enforced       |        | Query / policy     | Unknown |
| Server actions                | No client-side secrets, validated input |        | Source / network   | Unknown |
| Admin-only data isolation     | No data leak to public routes           |        | Browser / API      | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| ADM-001  |          |             |              |       |          |

---

### B3. Furniture Studio — `site/app/oostudio`

Forked surface. Never imports from Planner (`@planner/*`).

| Item                            | Expected                                       | Actual | Evidence             | Status  |
| ------------------------------- | ---------------------------------------------- | ------ | -------------------- | ------- |
| Route loads                     | 200, Studio UI renders                         |        | Browser              | Unknown |
| Fork boundary                   | Zero imports from `@planner/*`                 |        | `scan:boundaries`    | Unknown |
| Furniture catalog write         | Mode-aware wrapper, not raw disk helper        |        | Source               | Unknown |
| Persistence mode                | Disk when `DEV_AUTH_BYPASS=1`, else Supabase    |        | Runtime toggle       | Unknown |
| Descriptor sync                 | Block descriptors written via correct selector |        | Source / DB          | Unknown |
| Asset references                | Images resolve, no broken `assetPaths` entries |        | Network tab          | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| STU-001  |          |             |              |       |          |

---

### B4. Floor Planner — `site/app/ooplanner`

Forked surface. Never imports from Studio (`@studio/*`). Reads the furniture
library written by Studio.

| Item                            | Expected                                       | Actual | Evidence             | Status  |
| ------------------------------- | ---------------------------------------------- | ------ | -------------------- | ------- |
| Route loads                     | 200, Planner UI renders                        |        | Browser              | Unknown |
| Fork boundary                   | Zero imports from `@studio/*`                  |        | `scan:boundaries`    | Unknown |
| Furniture library read          | Reads catalog, no direct write                 |        | Source               | Unknown |
| Plan persistence                | Mode-aware wrapper only                        |        | Source / runtime     | Unknown |
| Planner profile save            | Correct columns, no `any` casts                |        | Source / types       | Unknown |
| Canvas / interaction            | Drag-and-drop, zoom, pan functional            |        | Browser              | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| PLN-001  |          |             |              |       |          |

---

### B5. API & server — `site/app/api`, `site/server`

Covers API routes, server actions, proxy, rate limiting, and middleware.

| Item                        | Expected                                    | Actual | Evidence             | Status  |
| --------------------------- | ------------------------------------------- | ------ | -------------------- | ------- |
| Endpoint responds           | Correct status and content-type             |        | curl / network       | Unknown |
| Rate limiting               | `rateLimit.ts` enforced on sensitive routes  |        | Source / test         | Unknown |
| CSP headers                 | `proxy.ts` + `next.config.js` aligned        |        | Response headers     | Unknown |
| Input sanitization          | `site/lib/security/` validators applied      |        | Source               | Unknown |
| No secret exposure          | No env values in client bundle               |        | Build output / source | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| API-001  |          |             |              |       |          |

---

### B6. Database & persistence — Supabase (Admin + Products)

Admin DB `rxzpznmxbaoxpikowmfc`, Products DB `erpweaiypimorcunaimz`.

| Item                        | Expected                                        | Actual | Evidence         | Status  |
| --------------------------- | ----------------------------------------------- | ------ | ---------------- | ------- |
| Table ownership             | Furniture/descriptors → Admin; catalog → Products |        | Schema           | Unknown |
| Migration rollback          | Every migration has `-- rollback`                |        | File inspection  | Unknown |
| RLS policies                | Active on all user-facing tables                 |        | Supabase dash    | Unknown |
| Generated types fresh       | `db:types:admin` + `db:types` match live schema  |        | Diff             | Unknown |
| No dual-write               | Single persistence path per data type            |        | Source           | Unknown |
| Prod FS read-only           | No raw disk write in production code path         |        | Source           | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| DB-001   |          |             |              |       |          |

---

### B7. CSS & FOCSS — `site/focss`

Design token system and style layer.

| Item                        | Expected                                 | Actual | Evidence          | Status  |
| --------------------------- | ---------------------------------------- | ------ | ----------------- | ------- |
| Token usage                 | No raw color / spacing values            |        | Grep / lint       | Unknown |
| Zone boundaries             | FOCSS zones don't leak across modules    |        | `verify:focss`    | Unknown |
| Style-token check           | `check:style-tokens` passes              |        | Command output    | Unknown |
| UI strict lint              | `lint:ui:strict` passes                  |        | Command output    | Unknown |
| Dark mode / theme           | Theme tokens resolve in all modes        |        | Browser           | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| CSS-001  |          |             |              |       |          |

---

### B8. i18n — `site/i18n`

861 keys across 26 namespaces; en + hi parity.

| Item                        | Expected                           | Actual | Evidence         | Status  |
| --------------------------- | ---------------------------------- | ------ | ---------------- | ------- |
| Key count parity            | en.json keys == hi.json keys       |        | Diff / script    | Unknown |
| No raw strings in UI        | All user-facing text uses i18n key |        | Grep / runtime   | Unknown |
| Namespace structure          | 26 namespaces present              |        | File inspection  | Unknown |
| Hindi rendering             | Devanagari renders correctly       |        | Browser          | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| I18N-001 |          |             |              |       |          |

---

### B9. Observability — `site/lib/observability`, New Relic, OpenTelemetry

| Item                        | Expected                              | Actual | Evidence          | Status  |
| --------------------------- | ------------------------------------- | ------ | ----------------- | ------- |
| Instrumentation loads       | `instrumentation.ts` runs at startup  |        | Server logs       | Unknown |
| Browser agent               | New Relic snippet present, no errors  |        | Browser / network | Unknown |
| No credential exposure      | Keys in `.env.local` only             |        | Source / build    | Unknown |
| Error tracking              | Uncaught errors forwarded             |        | Dashboard         | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| OBS-001  |          |             |              |       |          |

---

### B10. Tests & build gate — `tests/`, `config/build/`

| Item                        | Expected                                  | Actual | Evidence          | Status  |
| --------------------------- | ----------------------------------------- | ------ | ----------------- | ------- |
| Two vitest lanes            | Default + tech-docs both reported         |        | `pnpm run test`   | Unknown |
| DOM env                     | happy-dom configured                      |        | vitest config     | Unknown |
| Gate fast                   | `pnpm run gate:fast` passes               |        | Command output    | Unknown |
| Gate full                   | `pnpm run gate` passes                    |        | Command output    | Unknown |
| Layout check                | `pnpm run check:layout` passes            |        | Command output    | Unknown |
| No `any` casts              | Zero handwritten `any`                    |        | Grep              | Unknown |

**Findings:**

| ID       | Severity | Observation | Reproduction | Owner | Boundary |
| -------- | -------- | ----------- | ------------ | ----- | -------- |
| TST-001  |          |             |              |       |          |

---

## C. Change proposal

Do not edit until this section is complete and authorized.

| File or external system | Smallest intended change | Why it addresses the finding | Reversible by |
| ----------------------- | ------------------------ | ---------------------------- | ------------- |
|                         |                          |                              |               |

**Commands or actions requested for authorization:**

1. 
2. 

**No-change alternative and trade-off:**

---

## D. Implementation record

Complete only after the approved work is done.

| Item                       | Record                                    |
| -------------------------- | ----------------------------------------- |
| Files changed              |                                           |
| External changes           |                                           |
| Keys or secrets changed    | None, unless explicitly authorized        |
| Commands run and exit codes |                                           |
| Rollback path              |                                           |

---

## E. Verification matrix

| Check                     | Expected                                         | Observed | Evidence location | Status             |
| ------------------------- | ------------------------------------------------ | -------- | ----------------- | ------------------ |
| Direct endpoint           |                                                  |          |                   | Not run / pass / fail |
| Server logs               | No relevant errors                               |          |                   | Not run / pass / fail |
| Browser console           | No relevant errors                               |          |                   | Not run / pass / fail |
| Browser network           | Required request succeeds; no prohibited request |          |                   | Not run / pass / fail |
| Required viewport matrix  | No regression                                    |          |                   | Not run / pass / fail |
| External telemetry        | Expected signal visible                          |          |                   | Not run / pass / fail |

---

## F. Decision and handoff

| Field                    | Record                                         |
| ------------------------ | ---------------------------------------------- |
| Result                   | Complete / partial / blocked                   |
| Verified facts           |                                                |
| Remaining gaps           |                                                |
| Intentionally not done   |                                                |
| Next smallest action     |                                                |
| Needs owner decision?    | Yes / no — state the single decision           |

Hard blockers belong in `Failures.md` with a minimal, reproducible failure.

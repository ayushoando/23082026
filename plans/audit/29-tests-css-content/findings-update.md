# Updated findings — 29-tests-css-content

**Date:** 2026-09-01

## Resolved
- none yet — No remediation performed for this area as of 2026-09-01.

## Fixed along the way (discovered during remediation)
- none

## Remaining (failures / open items)
- Visual baselines (High): open — still 0 of 216 on disk (re-verified unchanged by report 35 on 2026-09-01); strategy decision (generate + review vs flip manifest/policy) pending.
- 29.1: open — 110 `waitForTimeout` across 24 files unchanged (worst: audit-3a-planner-journey-2 ×29, planner-comprehensive-audit-browser ×13, audit-4a-marketing-pages ×10).
- 29.2: open — 4 specs still hardcode `http://localhost:3000` (+1 self-constructed baseURL).
- 5 weakest suites: open — fonts, i18n/config, sitePackageRoot, clientLogos, trusted-by rewrites not done; `Footer.test.tsx` `expectMinTapTarget()` still vacuous.
- monitoringGapsAttributable.property: open — still validates a local mirror instead of importing the real extractor.
- CSS: no action needed per plan (0–5% unused, dynamic-composition caveat) — stands as recorded.
- Content: no placeholders / no broken internal hrefs — positive results stand as recorded.
- 29.3: no action — no specs reference removed features.

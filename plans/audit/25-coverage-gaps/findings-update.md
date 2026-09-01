# Updated findings — 25-coverage-gaps

**Date:** 2026-09-01

## Resolved
- none yet — no coverage gap in this report was closed by remediation. This report is partially superseded: the backlog items on runtime verification, CVE/currency, git-history dating, i18n hi quality and canvas algorithms are now covered by fresh evidence reports 30–34 (see those folders). Live list of remaining gaps: `plans/remaining-areas/README.md`.

## Fixed along the way (discovered during remediation)
- none

## Remaining (failures / open items)
- Runtime/command evidence: partially covered by report 34 (scan:secrets clean; typecheck green; two-lane test RED at run time, import-path causes since repaired) — full-lane test re-run and gate:fast still outstanding.
- Registry/platform evidence: CVE + currency covered by report 31; Vectorize index existence observed by report 36 (CF-TOKEN-01 resolved) — Admin pending-migration apply, worker deploy and CI-to-green remain outstanding owner actions.
- Browser/rendered evidence: report 35 measured the build (exit 0; heavy deps code-split) but rendered-HTML SEO (--live), visual baselines (0 of 216) and browser/a11y runs remain owner-gated and outstanding.
- Historical evidence: covered by report 30 (git-history dating completed for the suspected orphans, wave3/wave5, specs/).
- Canvas/algorithm correctness: covered by report 33.
- Data quality, security-under-attack, UX/perf feel: open — inherently out of static-audit scope; need owner-authorized live evidence.
- All remaining items need owner authorization; live list in `plans/remaining-areas/README.md`.

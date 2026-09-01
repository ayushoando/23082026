# Resolved — 35-bundle-seo-visual
**Date:** 2026-09-01
- build:site: verified 2026-09-01 — exit 0 (~2m54s), fresh `.next` output (build log captured 0 bytes, so per-route First Load JS figures were not observed; chunk-level measurements used instead).
- Heavy-dep code-split: verified 2026-09-01 — gsap/jspdf/fabric markers absent from the shared entry chunks `framework-*` (185.2 KB) and `main-*` (140.4 KB); jsPDF 322.5 KB (#2 client chunk), fabric 285.9 KB (#3), gsap 112.6 KB combined — each in dedicated client chunks; largest raw files (6.6 MB / 1.5 MB chunks) are server-only. Route-level loading not provable from this build output (0 prerendered pages).
- SEO audit: run 2026-09-01 — source mode passes 61/61 routes; `--html` mode scanned 0 pages (all-SSR build, no static HTML emitted — vacuous pass); rendered check stays owner-gated `--live`.
- Visual baselines: verified 2026-09-01 — 0 of 216 on disk (`tests/visual-baselines/` absent), unchanged from plan 29 §4.

(Fixed along the way: none — measurement pass; no code changes; verdict "no plan needed".)

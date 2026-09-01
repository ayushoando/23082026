# Remaining — Persistence & SQL injection surface
**Date:** 2026-09-01

- 11.3 (Med, cross-ref): legacy `site/data/storage/` still populated (43 stale files), unenforced by `check:layout` — open, not started; cross-ref report 04 (also still open as of 2026-09-01).
- 11.1 / 11.2: info-positive (no unguarded raw-fs writes; no string-interpolated SQL) — no action required.

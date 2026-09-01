# Remaining — Security: CSRF & rate limiting
**Date:** 2026-09-01

- 10.1: fail-open fallback in `site/lib/rateLimit.ts:120-128` — non-AI routes degrade to per-instance in-memory limiting on multi-instance serverless when the distributed backend is unavailable — open, not started.
- 10.2: info-positive (CSRF coverage complete, timing-safe compares) — no action required.

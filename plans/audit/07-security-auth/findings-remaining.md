# Remaining — Security: auth
**Date:** 2026-09-01

- 7.1: `DEV_AUTH_BYPASS` has no allowed-host guard — active on any exposed non-production host with the flag set — open, not started.
- 7.2: `.env.example:90` still ships `DEV_AUTH_BYPASS=1` as template default — open, not started.
- 7.3: info-positive (bypass-status endpoint 404s in prod; no missing auth found) — no action required.

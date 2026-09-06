# Active blockers

This file is the repository's sole record of current hard blockers. Add a row only with reproducible evidence, and remove it only after an authorized rerun observes the fix.

| Resource | Destination |
|---|---|
| Active planning coordination | [`plans/README.md`](./plans/README.md) |
| Browser origin | `http://localhost:3000` only |

An empty blocker table is valid. Do not copy blocker identifiers into other documents; link to this file instead.

---

| ID | Priority | Blocker | Evidence | Action |
|----|----------|---------|----------|--------------|
| OBS-LOCAL-500 | High | Local homepage and New Relic loader return HTTP 500, preventing Browser monitoring verification. Observed 2026-09-06. | `curl.exe --silent --show-error --max-time 30 --output NUL --write-out "%{http_code} %{content_type}" http://localhost:3000/newrelic.js` returns `500 text/html; charset=utf-8`; the same check on `/` returns 500. Curl transport exits 0; this does not indicate HTTP success. | Diagnose the local application failure in a separately scoped repair. Recheck `/` and `/newrelic.js`, then verify nonce CSP and Browser beacons at the required viewports. |

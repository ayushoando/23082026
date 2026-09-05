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
| BROWSER-ORIGIN-02 | P1 | Browser walk could not start because the required local app was unavailable | Muse-B attempted `http://localhost:3000` and Chromium returned `net::ERR_CONNECTION_REFUSED`; no routes or screenshots were observed | Start the app at `http://localhost:3000`, then rerun the four-viewport browser walk |

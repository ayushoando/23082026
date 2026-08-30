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
| BROWSER-PLAYWRIGHT-CONFIG-IMPORT-META | High | Planner browser and performance evidence cannot begin because the Playwright configuration fails while loading. | Authorized command `pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/planner-comprehensive-audit-regression.spec.ts --project=chromium-desktop --grep "desktop-landscape-pointer"` exited 1 before test discovery: `SyntaxError: Cannot use 'import.meta' outside a module` from `config/build/playwright.config.ts`. | Resolve the configuration module-format/loading issue, then rerun the narrowed Chromium regression profile plus required performance and optional Firefox/WebKit profiles. |
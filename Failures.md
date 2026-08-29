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

| TEST-OANDO-AUTHORITY-20260829 | P1 | Default Vitest lane cannot pass because `.kiro/skills/oando-master/SKILL.md` omits the required `` `AGENTS.md` `` marker from its `Begin Here` authority order. This path is outside the authorized test-architecture ownership and already has unrelated user modifications. | Authorized `pnpm run test` rerun on 2026-08-29: 620/621 files and 3321/3322 tests passed; `tests/unit/docs/oando-master-properties.test.ts:148` failed with `Expected marker "`AGENTS.md`"` (`indexOf` returned -1). Tech-docs lane did not run. | Owner restores the routing marker, or explicitly authorizes editing `.kiro/skills/oando-master/SKILL.md`; then rerun `pnpm run test` before continuing coverage and gate commands. |
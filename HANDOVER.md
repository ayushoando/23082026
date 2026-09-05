# Historical handover context

This file preserves prior handoff context; it is not a source of current repository, branch, validation, or deployment status. Verify every claim against live files, current Git state, [`Failures.md`](./Failures.md), and the active plan folders indexed by [`plans/README.md`](./plans/README.md).

## Retained historical outcomes

- A prior configuration audit of an external AI-assistant scaffolding tree (and its spec folders) changed local skills, powers, steering, hooks, and permissions. Its runtime-recognition claims were not fully verified.
- A prior shared-site assistant change reported a corrected launcher and added OpenAI and Amazon Bedrock fallback configuration. It explicitly left Planner and Studio fork trees untouched.
- That handoff reported no commit or push and identified provider credentials and authorized validation as remaining operator work.

## Security boundary

Store credentials only in `.env.local` or `site/.env.local`. Server credentials, including service-role and AI-provider credentials, are server-only and must not appear in client code, browser output, client-visible configuration, documentation output, or Git.

## Session notes — 2026-09-01

- Five `agents\*.md` files and several spec subfolders of the external AI-assistant scaffolding tree (and its spec folders) vanished mid-session while that tree was being modified by another process; not restored, not assumed. Rule for next sessions: **ask the user whenever an expected file is missing.**
- Moved on user instruction: `agents-work\client-hub` → `plans\client-hub`; all spec subfolders of that scaffolding tree → `plans\` (`planner-comprehensive-audit` merged with its existing plan folder). Its spec folders were left empty, and the tree itself has since been removed from this repository. Moves are unstaged in git.
- Root docs, `docs/`, `plans/` (md), the skills of the external AI-assistant scaffolding tree, and `Agents/` handbooks were read in full this session.

## Session notes — 2026-09-05

- **Homepage 5-Viewport Audit:** Completed multi-viewport analysis (1920, 1440, 1080, 768, 390) and documented root causes for missing hero action buttons, title typography clamp (`11ch`), and 1080px grid threshold in [`docs/audit 05092026/homepage-and-auth-audit.md`](./docs/audit%2005092026/homepage-and-auth-audit.md).
- **Authentication Forensic Root Cause:** Logged active blocker `AUTH-LOOP-03` in [`Failures.md`](./Failures.md). Traced `/access` 307 redirect loop to superficial `hasSessionAuthCookies()` in `site/proxy.ts` and client sign-out crash to missing client-side environment variables in `DashboardClient.tsx`.
- **Cloud-First Observability:** Overhauled [`OBSERVABILITY.md`](./OBSERVABILITY.md) to standardize on GA4, Vercel Web Analytics & Speed Insights, and OpenTelemetry without running local Docker Prometheus/Grafana or third-party APMs.
- **Environment Architecture:** Established clean 3-way partition (`.env.local` workstation, `site/.env.example`, `tech-docs-generator/.env.example`).
- **Quick Execution Plan:** Created focused execution plan in [`docs/plans/05092026/README.md`](./docs/plans/05092026/README.md) and [`plans/05092026/short-plan.md`](./plans/05092026/short-plan.md).

## Current-owner checklist

1. Read the [process floor](./AGENTS.md) and [active planning index](./plans/README.md).
2. Inspect live Git and source state; do not treat the historical bullets above as current.
3. Check [active blockers](./Failures.md).
4. Run only an exact validation command authorized by the current user and permitted by the enabled hook.
5. Record observed command, working directory, exit status, and scope; classify every unrun command as pending.

No current validation result is asserted by this file.

# Historical handover context

This file preserves prior handoff context; it is not a source of current repository, branch, validation, or deployment status. Verify every claim against live files, current Git state, [`Failures.md`](./Failures.md), and the active plan folders indexed by [`plans/README.md`](./plans/README.md).

## Retained historical outcomes

- A prior Kiro-configuration audit changed local skills, powers, steering, hooks, and permissions. Its runtime-recognition claims were not fully verified.
- A prior shared-site assistant change reported a corrected launcher and added OpenAI and Amazon Bedrock fallback configuration. It explicitly left Planner and Studio fork trees untouched.
- That handoff reported no commit or push and identified provider credentials and authorized validation as remaining operator work.

## Security boundary

Store credentials only in `.env.local` or `site/.env.local`. Server credentials, including service-role and AI-provider credentials, are server-only and must not appear in client code, browser output, client-visible configuration, documentation output, or Git.

## Session notes — 2026-09-01

- `.kiro\agents\*.md` (5 files) and several `.kiro\specs` subfolders vanished mid-session while `.kiro` was being modified by another process; not restored, not assumed. Rule for next sessions: **ask the user whenever an expected file is missing.**
- Moved on user instruction: `agents-work\client-hub` → `plans\client-hub`; all `.kiro\specs\*` subfolders → `plans\` (`planner-comprehensive-audit` merged with its existing plan folder). `.kiro\specs` is now empty. Moves are unstaged in git.
- Root docs, `docs/`, `plans/` (md), `.kiro\skills`, and `Agents/` handbooks were read in full this session.

## Current-owner checklist

1. Read the [process floor](./AGENTS.md) and [active planning index](./plans/README.md).
2. Inspect live Git and source state; do not treat the historical bullets above as current.
3. Check [active blockers](./Failures.md).
4. Run only an exact validation command authorized by the current user and permitted by the enabled hook.
5. Record observed command, working directory, exit status, and scope; classify every unrun command as pending.

No current validation result is asserted by this file.

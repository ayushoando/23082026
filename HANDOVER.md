# Handover

_2026-08-25 11:34 · branch: main · not pushed past origin/main (4675e15)_

## Done (committed)
- Root cleanup + .gitignore rules (pycache, mcp/Datadog).
- `mcps/` -> `mcp/` migration (137 files, docs, tech-docs SPA+test). Verified: check:layout, tech-docs 214/214, check:docs-all.
- Deleted merged branch `chore/gitignore-cleanup`.

## Done (user-level / working tree, NOT committed)
- Uninstalled kirocrew (~/.kiro/crew, crew-src, crew-venv, kirocrew agents).
- 7 skills in `.kiro/skills/` (six domain skills plus the mandatory `oando-master` router).
- Local power `.kiro/powers/oando-workflow/` (`POWER.md`, empty `mcp.json`, `steering/`); registered as the local power.
- Steering `powers-skills-model.md` (`inclusion: always`, confirmed loading).
- Hooks: six enabled hooks; LTM post-turn capture is enabled; the obsolete external graph route is retired; the orphaned Sonar file is inert pending explicit deletion approval.
- `permissions.yaml`: removed dead refs, fixed `E:/18082026 -> D:/23082026`, added skills+power.
- Removed the stale CAST credential from `.env.local`.

## Uncommitted (current audit)
- Kiro hook, skill, power, steering, evaluator, and tech-docs inventory updates described above.
- Removed stale external-power routing and validation instructions; tests and gates remain user-invoked only.
- `.env.local` was intentionally left unchanged and is outside this audit's scope.

## OPEN / UNVERIFIED
1. `registryId: local` in installed.json is a GUESS — not confirmed Kiro loads a local power this way.
2. Skills/power recognition still requires a Kiro reload check.
3. This audit's non-test syntax and reference verification is pending.
4. The orphaned inert Sonar hook remains pending explicit deletion approval.
5. The user confirmed removal of the six global MCP registrations; the repository-local `oando-workflow/mcp.json` remains intentionally empty.

## Verify (repo root, pnpm; user-invoked where applicable)
`pnpm run typecheck` · `pnpm run check:layout` · `pnpm run gate:fast`

## Handover: shared-site AI chatbot and provider upgrade

_2026-08-27 · shared marketing/site surface only · no commit created_

### Current status
- The clipped assistant launcher is resolved in the active source and live browser. The mounted path is `RouteChrome → DynamicBotWrapper → UnifiedAssistant`; `AdvancedBot` is not mounted by the shared site.
- `UnifiedAssistant` renders icon-only mobile and desktop launchers. The assistant FAB is a stable circular `57.6px × 57.6px` control; the legacy `.site-fab-launcher__label` selector is guarded in `site/focss/site/components/chrome/shell-site-fabs.css`.
- The supplied `/contact/` screenshot matches the live result: the assistant Sparkles FAB is visible at bottom-left with no `AI Chatbot` text or clipping, and WhatsApp remains a separate FAB at bottom-right.

### AI/provider work completed
- Added exact dependency `@ai-sdk/amazon-bedrock@5.0.66`.
- Kept Gemini and OpenRouter on the existing Mastra router path; no redundant `@ai-sdk/openai` or Google adapter was added.
- Extended the server-only provider chain in `site/lib/ai/mastra/providers.ts` with:
  1. Gemini
  2. OpenRouter primary
  3. OpenRouter backup
  4. OpenAI via Mastra `openai/<model>` routing
  5. Amazon Bedrock via a direct Bedrock language-model adapter
- Existing Gemini/OpenRouter order is preserved; OpenAI and Bedrock are appended as fallbacks.
- Added typed direct-model unwrapping for Mastra agent construction and request-time generation.
- Added provider environment schema/runtime wiring in `site/lib/env.server.ts` and non-secret examples in `.env.example`.

### Provider configuration
OpenAI is enabled with:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Bedrock currently requires `AWS_REGION` plus either a bearer token or an explicit access/secret pair:

```env
AWS_REGION=
AWS_BEARER_TOKEN_BEDROCK=
# or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
BEDROCK_MODEL=us.amazon.nova-lite-v1:0
```

`AWS_PROFILE`/the default AWS credential chain is not wired. Do not commit real credentials to `.env.example`, source, or Git.

### Verification evidence
- `git diff --check` passed for the changed files.
- `pnpm list` and `pnpm why` confirmed `@ai-sdk/amazon-bedrock@5.0.66` is installed directly.
- The running development server returned repeated HTTP 200 responses for `/contact/`.
- Nova Act evidence from the fresh live session:
  - Snapshot: `C:\Users\ayush\.act_cli\browser\session_logs\focss-launcher-fresh\20260828_093936_snapshot\snapshot.yaml`
  - Query: `C:\Users\ayush\.act_cli\browser\session_logs\focss-launcher-fresh\20260828_093947_query\query.json`
  - Screenshot: `C:\Users\ayush\.act_cli\browser\session_logs\focss-launcher-fresh\20260828_094000_screenshot\screenshot.png`
  - Query result: one hidden mobile launcher and one visible empty-text assistant launcher at `x=16`, `y=671.40625`, `57.59375px × 57.59375px`.
- No generated `.next` files were edited.
- The documented `scripts/graph-impact.mjs` helper was absent from this checkout and no replacement was found.

### Changed files for this handoff
- `.env.example`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `site/lib/env.server.ts`
- `site/lib/ai/mastra/providers.ts`
- `site/lib/ai/mastra/requestAdvisorText.ts`
- `site/lib/ai/mastra/advisorAgent.ts`
- `site/lib/ai/mastra/catalogAdvisorAgent.ts`

### Boundaries and remaining work
- Planner, Studio, `/ooplanner`, `/oostudio`, and their fork trees were left untouched by this work. Preserve unrelated existing working-tree changes, including the pre-existing Planner diff.
- No tests, typecheck, or gates were run; repository policy leaves those commands user-invoked. The next owner should run the appropriate authorized checks, at minimum `pnpm run typecheck` and `pnpm run check:layout`, then the relevant focused tests/gates.
- Configure provider credentials in the deployment environment before expecting OpenAI or Bedrock fallback traffic. Restart/rebuild the deployed app through the normal deployment path so stale generated assets are regenerated; never edit `.next` manually.
- No commit or push was created.

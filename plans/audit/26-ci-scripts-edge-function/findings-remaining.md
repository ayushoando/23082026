# Remaining — 26-ci-scripts-edge-function
**Date:** 2026-09-01
- 26.1: open — `dependabot.yml` still npm-only (no `github-actions` ecosystem entry).
- 26.2: open — no `permissions:` hardening blocks in the 4 workflows.
- 26.3: open — ~40 workflow-level secrets (incl. `SUPABASE_SERVICE_ROLE_KEY`); empty-string env masking unchanged.
- 26.4: open — browser matrix still runs on every PR; tech-docs artifact `if-no-files-found` unset.
- 26.5: open — assistant-chat thread ownership still unchecked (`office_id` equality only; `created_by` ignored).
- 26.6: open — OpenAI call still lacks `store: false` / PII handling.
- 26.7: open — api.openai.com fetch (line 246) still has no try/catch, AbortController or timeout.
- 26.8: open — user message persisted before the provider call; no streaming; old pinned Deno deps unchanged.
- Orphan scripts (~18): triage evidence confirmed (this report §2; corroborated by report 30's single-touch git history) but no files deleted — deletion still needs user confirmation.

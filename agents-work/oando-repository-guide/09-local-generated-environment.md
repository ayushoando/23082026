# 09 · Local, generated, and environment areas

[← Kiro workspace](08-kiro-workspace.md) · [Next: quality and validation →](10-quality-validation.md)

These paths matter to development but are not normal product feature source.

## Environment and secrets

| Path | Status | Rule |
|---|---|---|
| `.env.example` | Editable template | Documents non-secret environment shape. |
| `.env.local`, `.env copy.local` | Local/private | Credentials/runtime configuration; never commit or expose. |
| `site/.env.local` | Local/private | Next-specific local configuration when required. |

## Generated/evidence output

| Path | Status | Rule |
|---|---|---|
| `generated-documents/data/` | Generated | Structured tech-docs inventory data. Regenerate. |
| `generated-documents/docs/` | Generated | Rendered docs output. Regenerate. |
| `generated-documents/site/` | Generated | Built tech-docs static site. Regenerate. |
| `results/` | Generated evidence | Command/test result output. Never hand-write plans/audits here. |
| `site/.next/` | Local/generated | Next build/cache output. Never edit as source. |
| `site/next-env.d.ts`, `*.tsbuildinfo` | Generated/local | Tooling artifacts. |

## Local tool/editor/VCS state

| Path | Status | Role |
|---|---|---|
| `node_modules/` | Local/package-manager output | Installed dependencies. Do not edit. |
| `.git/` | Local VCS | Git metadata. |
| `.vscode/` | Editor configuration | VS Code workspace behavior. |
| `ltm/` | Local Kiro tooling state | Agent continuity/memory, not product code. |
| `agent-reports/` | Reference pointer | Agent-report guidance area. |
| `agents-work/` | Working material | Research/work products; includes this guide. |

## Legacy and absent areas

- `site/data/storage/` is legacy. Do not add runtime writes there.
- The live repository has no root `supabase/` directory; use `site/platform/supabase/`.
- The live repository has no root `mcp/` directory; use `.kiro/mcp/`.
- Documentation may refer to archival/local directories that are absent; live filesystem takes precedence.

## Safe request

```text
Classify [path] as source of truth, generated, local/private, legacy, or archival.
Explain whether it is safe to edit, how it is regenerated, and what current source
should be changed instead. Do not modify it yet.
```

Next: [Quality and validation](10-quality-validation.md).
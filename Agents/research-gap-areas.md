# Repository research gaps

This note records unresolved research questions; it does not define current product behavior or prove validation status. Resolve each item from live repository evidence first, then use current official sources only within their governing scope.

## Current gaps

| Area | Observed repository context | Status | Evidence needed |
|---|---|---|---|
| Route-handler caching and runtime | Next.js 16.3.3 App Router under `site/app/` | pending | Relevant versioned guide under `node_modules/next/dist/docs/` plus owning route source |
| Server-only boundaries | Database and AI clients live under server-oriented modules | pending per module | Import graph and client/server entry inspection; do not infer from folder names |
| Two-database separation | Products owns marketing catalog/configurator; Admin owns staff, plans, furniture, and descriptors | configured | Owning migrations, client factories, and generated types |
| Row-level security (RLS) | Migrations include grants and policies | present-but-unverified per environment | Owning migration plus authorized environment-specific observation |
| Migration reversibility | Repository requires `-- rollback`, dry-run before apply, grants, policies, and type regeneration | configured | Migration source and, when authorized, exact dry-run output |
| Plan ownership | Active work uses folders indexed by `plans/README.md` | observed | Live index and selected plan folder |
| Release-gate scope | Root `package.json` declares fast and full gates | configured, unrun | Exact authorized command and observed result |
| Documentation accessibility | Static structure can be reviewed; formal conformance cannot be inferred | static-review-only | Assistive-technology and renderer evidence when explicitly authorized |

## Authoritative references

- [Next.js documentation](https://nextjs.org/docs) governs framework behavior, but repository changes must use the installed versioned guide first.
- [Supabase row-level security guidance](https://supabase.com/docs/guides/database/postgres/row-level-security) explains RLS concepts; live migrations control this repository.
- [PostgreSQL transaction documentation](https://www.postgresql.org/docs/current/tutorial-transactions.html) explains transaction behavior; repository migration tooling controls procedure.
- [Diátaxis](https://diataxis.fr/) is a documentation-structure reference. Retrieval returned HTTP 429 on 2026-08-28, so current availability is unverified in this review.
- [W3C Writing for Web Accessibility](https://www.w3.org/WAI/tips/writing/) informs document structure without establishing conformance.

## Evidence rules

- Classify statements as observed, configured, present-but-unverified, planned, historical, deprecated, blocked, or pending-owner-validation.
- Never convert a research recommendation into repository policy without a higher-authority source.
- Never treat a plan, generated result, old command log, or route's presence as proof of current behavior.
- Record failed retrieval and missing evidence instead of substituting an unsupported conclusion.

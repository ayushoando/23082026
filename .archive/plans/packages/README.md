# Package & Dependency Audit Plan

**Created:** 2026-08-31
**Status:** Full audit complete with architecture assessment and replacement analysis
**Owner:** Repository owner

## Documents

| Document | Purpose |
|---|---|
| [`package-audit-report.md`](./package-audit-report.md) | Full inventory: 49 deps + 27 devDeps — vulnerabilities, dead packages, usage classification |
| [`remedy-plan.md`](./remedy-plan.md) | Cleanup actions + replacement analysis + architecture assessment for every package group |

## Key Decisions

### Remove (3 dead, 1 replaceable)
| Package | Action | Reason |
|---|---|---|
| `use` | Remove | Zero imports. Accidental install. Supply chain risk. |
| `corepack` | Remove | Zero imports. Node.js built-in, not a project dep. |
| `pnpm` | Remove | Zero imports. Redundant with `packageManager` field. |
| `axios` | Replace with native `fetch` | 1 import. Rest of codebase uses `browserApiFetch`. |

### Rename (1)
| Package | Action | Reason |
|---|---|---|
| `framer-motion` | Migrate to `motion` package | Same library, renamed in 2025. Better tree-shaking, `motion/mini` (2.3KB) for simple animations. |

### Evaluate (1)
| Package | Action | Reason |
|---|---|---|
| `gsap` + `@gsap/react` | Consider consolidating to `motion` | 3-4 uses doing scroll reveals that motion already handles in 15+ other components. Saves ~25KB. |

### Keep — Architecture Justified (everything else)
| Group | Packages | Reason |
|---|---|---|
| AI & Retrieval (7) | mastra/core, mastra/memory, mastra/rag, ai-sdk/bedrock, lancedb, orama, fuse.js | Each serves a distinct search tier (vector, full-text, fuzzy) or AI role. No redundancy. |
| State (3) | zustand, react-query, nuqs | Clean tier split: client state, server cache, URL state. |
| Database (4) | supabase-js, supabase/ssr, drizzle-orm, postgres | Recommended Supabase + Drizzle pattern. Each has a role. |
| Observability (4) | vercel/otel, prometheus-io, vercel/analytics, vercel/speed-insights | Server metrics, client analytics, traces — no overlap. |
| UI (5) | react-aria, dockview, phosphor-icons, embla-carousel, fabric | Each irreplaceable for its role. No duplication. |
| Forms (4) | react-hook-form, hookform/resolvers, zod, next-safe-action | Consistent pattern across all forms. |

## Security
- 3 transitive CVEs fixable with pnpm overrides
- 17 packages behind by minor/patch — `pnpm update` resolves all

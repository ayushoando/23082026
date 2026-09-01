# Plan — State Management & Data Flow

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Right-size react-query usage on the marketing surface; no changes needed to the zustand stores, server actions, or forked server stores (all verified coherent).

## Actions (prioritized)
1. **Low** Remove react-query or extend its usage: `site/app/(site)/providers/QueryProvider.tsx` is mounted in `site/app/(site)/layout.tsx:4,38` to wrap the entire marketing tree for exactly one consumer — `site/features/site/catalog/FilterGridInner.tsx`. Either drop the dependency (replace with local fetch state) or migrate additional surfaces to justify the provider.

## Verification
- `pnpm run typecheck`, `pnpm run test`, `pnpm run gate:fast` — gate runs require owner authorization.

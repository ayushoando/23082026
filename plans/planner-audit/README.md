# Planner Surface Audit

**Created:** 2026-08-31
**Status:** Audit complete
**Owner:** Repository owner

## Documents

| Document | Purpose |
|---|---|
| [`planner-audit-report.md`](./planner-audit-report.md) | Full audit: 4 routes, 10 API endpoints, canvas, projects, handoff, AI, sketch-to-plan, auth, persistence |
| [`remedy-plan.md`](./remedy-plan.md) | Prioritized fix plan |

## Key Findings

### Strengths (many)
- **Best-in-class request pipeline** — correlation → quota → validation → origin/CSRF → session → owner scope → revision/idempotency → persistence. Every endpoint goes through it.
- **Clean fork boundary** — zero Planner↔Studio imports verified
- **Exclusive persistence mode** — disk (dev) OR Supabase (prod), never both, with production safety guards
- **Rich feature set** — walls, doors, windows, furniture placement, auto-arrange, BOQ handoff, AI advisor, sketch-to-plan, DXF export, command palette, undo/redo (60-step)
- **Comprehensive load state machine** — draft, loading, ready, unauthorized, forbidden, not-found, offline, recovery, transient-error

### Issues
- **No offline persistence** — canvas retains state during network outage but if browser closes, work is lost. No IndexedDB/localStorage auto-save.
- **Planner.tsx ~1500 lines** — monolithic canvas component. Functional but a maintenance risk.
- **Revision/idempotency validation is a pipeline no-op** — `validateRevisionAndIdempotency()` returns `[]`. Actual enforcement deferred to adapter level.
- **AI advisor doesn't use the Planner pipeline** — uses `withAuth` directly instead of `createPlannerHandler`, architecturally inconsistent with every other Planner endpoint.
- **No service worker** — offline page exists at `/offline` but no offline-first PWA capability.

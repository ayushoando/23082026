# Planner Surface Audit Report

**Date:** 2026-08-31
**Scope:** Full /ooplanner surface — routes, canvas, projects, handoff, AI advisor, sketch-to-plan, auth, persistence, components, state, export, fork boundary
**Files audited:** 4 routes, 10 API endpoints, 35+ components, 10 hooks, 2 zustand stores, server adapters, command system, endpoint contract

---

## Executive Summary

The Planner is the **most mature and well-architected surface** in the codebase. It has a formal request pipeline with 8-stage processing, an endpoint contract that declares auth/rate-limit/CSRF/schema for every endpoint, exclusive-mode persistence with production safety guards, a comprehensive canvas built on Fabric.js with undo/redo, and a clean fork boundary with zero Studio imports. Guest access is thoughtfully implemented with progressive capability restrictions.

The main issues are: no offline persistence (canvas state lost if browser closes while offline), a very large main component (~1500 lines), incomplete pipeline-level revision/idempotency validation, and the AI advisor route not using the standard Planner pipeline.

### Severity Summary

| Severity | Count |
|---|---|
| High | 2 |
| Medium | 4 |
| Low | 3 |

No critical issues found. Auth, CSRF, rate limiting, and owner scope are all solid.

---

## Route Inventory (4 routes)

| Route | Auth | Purpose |
|---|---|---|
| `/ooplanner` | Optional (guest allowed) | Main canvas — draws walls, places furniture, AI advisor |
| `/ooplanner` layout | None (shell only) | Imports `@focss/planner/entry.css`, TopBar, Toast |
| `/ooplanner/projects` | Optional → sign-in gate if null | Project list for authenticated users |
| `/ooplanner/projects/[id]` | Optional → sign-in gate if null | Project editor |

---

## API Endpoints (10, all pipeline-processed)

| Endpoint | Method | Auth | Rate Limit | CSRF |
|---|---|---|---|---|
| `/api/Planner/catalog` | GET | guest | 60/min | — |
| `/api/Planner/catalog/upload` | POST | member | 15/min | ✅ |
| `/api/Planner/projects` | GET | member | 60/min | — |
| `/api/Planner/projects` | POST | member | 30/min | ✅ |
| `/api/Planner/projects/[id]` | GET | member | 60/min | — |
| `/api/Planner/projects/[id]` | PATCH | member | 30/min | ✅ |
| `/api/Planner/projects/[id]` | DELETE | member | 20/min | ✅ |
| `/api/Planner/handoff` | POST | guest | 20/min | ✅ |
| `/api/Planner/ai-advisor` | POST | guest | 5/min | ✅ |
| `/api/Planner/sketch-to-plan` | POST | guest | 6/min | ✅ |

---

## Findings

### PLN-H01: No Offline Persistence

**Severity:** HIGH

The Planner tracks `navigator.onLine` and transitions between offline/recovery load states. The canvas retains local work while offline. But there's **no IndexedDB or localStorage auto-save** of canvas state. If the browser tab closes, crashes, or is force-quit while offline, all unsaved work is lost.

The `beforeunload` event warns about unsaved changes, and a `sessionStorage` handoff exists for sign-in redirects (15-minute TTL), but there's no persistent local backup.

**Fix:** Add periodic IndexedDB auto-save (every 30 seconds) using a lightweight wrapper. On reload, offer to restore from local backup if the server version is older.

---

### PLN-H02: AI Advisor Bypasses Planner Pipeline

**Severity:** HIGH

Every Planner endpoint except the AI advisor goes through `createPlannerHandler()` with the full 8-stage pipeline (correlation → quota → validation → origin/CSRF → session → owner scope → revision/idempotency → persistence). The AI advisor uses `withAuth` from the shared API module instead.

This means the AI advisor:
- Has no correlation ID in responses
- Doesn't go through the owner-scope authorization check
- Doesn't benefit from the structured pipeline error handling
- Is architecturally inconsistent with the rest of the Planner surface

**Fix:** Migrate the AI advisor to use `createPlannerHandler()` with its existing endpoint descriptor.

---

### PLN-M01: Planner.tsx ~1500 Lines

**Severity:** MEDIUM

The main Planner component is the largest single component in the codebase. It manages canvas init, all tools, undo/redo, project load/save, layers, snap, grid, panels, workflow steps, auto-arrange, AI, export, online/offline state, conflict resolution, and more.

Hook extraction is good (`useFabric`, `useHistory`, `useCanvasCore`, etc.) but the orchestration component itself is very large. Same pattern as Studio.tsx but with more features.

**Fix:** Future decomposition. Extract: workflow step machine, project load/save logic, panel state, AI integration as separate hooks or sub-components.

---

### PLN-M02: Revision/Idempotency Pipeline Validation is No-Op

**Severity:** MEDIUM

The `validateRevisionAndIdempotency()` dependency in `plannerRouteAdapter.ts` returns an empty array:
```typescript
validateRevisionAndIdempotency() {
  // Task 4.2 wires basic validation; full enforcement completed by workstream 2
  return [];
}
```

Actual revision enforcement happens at the Supabase adapter level (the RPC function `planner_mutate_plan_v1` does CAS checking). But the pipeline-level validation is a no-op, meaning malformed revision/idempotency data isn't rejected before hitting the database.

---

### PLN-M03: Guest Can Access AI and Sketch-to-Plan

**Severity:** MEDIUM

Both `/api/Planner/ai-advisor` (5 req/min) and `/api/Planner/sketch-to-plan` (6 req/min) are guest-accessible. This means unauthenticated users can consume LLM API credits. Rate limiting is in place, but at scale this could be a cost concern.

**Fix:** Consider requiring at least a guest cookie or CAPTCHA for AI endpoints, or reduce the guest rate limit further (e.g., 2/min).

---

### PLN-M04: No Canvas Auto-Save

**Severity:** MEDIUM

Related to PLN-H01. Even for authenticated users, there's no auto-save. The user must explicitly save via the project menu. This is a common cause of data loss in web-based editors.

**Fix:** Add auto-save every 60 seconds when `hasUnsavedChanges` is true and user is authenticated.

---

### PLN-L01: Workflow Step Doesn't Persist

The draw→place→review workflow step resets to "draw" on page reload. This is minor since the canvas state persists, but it's a small UX regression.

### PLN-L02: Export is Client-Only

All exports (PNG, SVG, PDF, DXF) are rendered client-side. Server-side rendering could improve PDF quality and handle larger canvases. Low priority.

### PLN-L03: Handoff Contact Validation is Minimal

The handoff endpoint requires `contact.name` but `email`, `phone`, `company`, `notes` are all optional. A handoff with just a name and no contact info isn't very useful for follow-up.

---

## What's Working Well

| Area | Assessment |
|---|---|
| **Request pipeline** | 8-stage processing with correlation, quota, validation, origin, CSRF, session, owner scope, revision/idempotency. Best-in-class for a Next.js app. |
| **Fork boundary** | Zero violations. Planner and Studio are completely isolated. |
| **Persistence** | Exclusive mode (disk OR Supabase), production safety guards, configuration validation. Never dual-writes. |
| **Undo/redo** | 60-step JSON snapshot stack with suspend/resume for multi-step gestures. |
| **Command palette** | Ctrl+K with tool switching, undo, redo, export, canvas commands. |
| **Canvas tools** | Wall, door, window, measure, select, pan. Wall endpoint grips. Auto-arrange. |
| **BOQ handoff** | Full quote submission flow with idempotency, persistence to Supabase, and recovery state. |
| **Load state machine** | 9 distinct states with appropriate UI for each. Online/offline transitions. |
| **DXF export** | Full ASCII DXF R12 exporter with layer mapping — unusual for a web app. |

---

*Report generated from static code analysis and context-gatherer investigation.*

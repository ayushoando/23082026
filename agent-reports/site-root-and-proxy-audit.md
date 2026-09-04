# Site Root & Edge Middleware Proxy (`site/` & `proxy.ts`) Architecture Audit

**Date:** 2026-09-04  
**Target:** [`site/`](file:///d:/23082026/site/) Root Files & [`site/proxy.ts`](file:///d:/23082026/site/proxy.ts)  
**Execution Runtime:** Next.js Edge Middleware & Server Configuration  
**Core Guard:** 537-line Security, Session & Routing Proxy (`site/proxy.ts`)

---

## Executive Summary

The root of [`site/`](file:///d:/23082026/site/) orchestrates Next.js compilation, TypeScript path alias resolution, and edge security middleware. Its central component, [`site/proxy.ts`](file:///d:/23082026/site/proxy.ts) (20.2 KB), is the **primary runtime security firewall** that intercepts every HTTP request entering the Next.js application server.

```
site/ Root Structure:
├── proxy.ts                 # 20.2 KB Edge Middleware Security Firewall
│   ├── CSRF & Origin Guard # Blocks cross-origin POST/PUT/PATCH/DELETE mutations
│   ├── Dynamic CSP Engine  # Restricts 'unsafe-eval' strictly to /ooplanner & /oostudio
│   ├── Maintenance Mode    # Fail-closed read-only gate on admin and mutating APIs
│   ├── Member Auth Enforcer# Protects /api/plans, /api/admin, /api/theme/manage
│   └── Legacy Redirection  # Short-circuits /crm and /ops to /admin
├── next.config.js           # Subsystem config extending ../config/build/next.config.js
├── instrumentation.ts       # OpenTelemetry runtime hook (register() lifecycle)
├── tsconfig.json            # 1.5 KB Path Aliases (@/lib/*, @studio/*, @planner/*, @focss/*)
└── postcss.config.mjs       # Subsystem PostCSS compiler configuration
```

---

## 1. Deep Dive: Edge Security Proxy (`site/proxy.ts`)

[`site/proxy.ts`](file:///d:/23082026/site/proxy.ts) operates before any App Router page or route handler is evaluated:

### 1.1 Dynamic Content Security Policy (CSP) Scoping
* **The Security Principle:** Canvas engines (Fabric.js in Studio and Three.js in Planner) require `script-src 'unsafe-eval'` to compile WebGL shaders and 2D canvas matrices. However, allowing `'unsafe-eval'` across the marketing site creates an unacceptable XSS vulnerability.
* **The Proxy Solution ([Lines 21-26](file:///d:/23082026/site/proxy.ts#L21-L26)):**  
  The proxy dynamically inspects the request path:
  - If the path matches `CANVAS_HEAVY_PREFIXES` (`/ooplanner`, `/oostudio`), it permits `'unsafe-eval'`.
  - For all marketing pages (`(site)`), admin, and static routes, it injects a **strict CSP with `'unsafe-eval'` completely omitted**.

### 1.2 CSRF & Origin Verification
* Inspects `sec-fetch-site` and `origin` headers on all mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`).
* Rejects cross-origin state mutations with HTTP 403 unless the origin matches trusted hostnames (`oando.co.in`, `localhost:3000`, or Vercel preview deployment origins).

### 1.3 Maintenance & Read-Only Policy
* When `isMaintenanceReadonly()` is active:
  - All mutating HTTP methods across `/api/**` immediately return **HTTP 503 (Service Unavailable)**.
  - Exception: `/api/log-error` remains open to capture client-side crash telemetry during maintenance windows.
  - `/admin` is offlined; guest exploration of `/ooplanner` and `/oostudio` remains functional in read-only mode.

### 1.4 Member Write Enforcement
* Unauthenticated requests to sensitive API endpoints (`/api/plans`, `/api/admin`, `/api/customer-queries/manage`, `/api/theme/manage`) are rejected at the edge before reaching serverless function execution, preventing billing abuse.

---

## 2. Configuration & Aliasing Contracts

### 2.1 Next.js Configuration (`site/next.config.js`)
* Bridges monorepo `.env.local` via `loadEnvLocal.cjs`.
* Integrates `next-intl` plugin targeting `./i18n/request.ts`.
* Inherits base security headers, redirect rules, and standalone outputs from `../config/build/next.config.js`.

### 2.2 TypeScript Path Aliases (`site/tsconfig.json`)
Establishes the strict module resolution contracts:
* `@/lib/*` $\rightarrow$ `site/lib/*`
* `@/components/*` $\rightarrow$ `site/components/*`
* `@/features/*` $\rightarrow$ `site/features/*`
* `@studio/*` $\rightarrow$ `site/{components,lib,hooks,store,server}/Studio/*`
* `@planner/*` $\rightarrow$ `site/{components,lib,hooks,store,server}/Planner/*`
* `@focss/*` $\rightarrow$ `site/focss/*`

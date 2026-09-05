# Oando Subsystem Plan: Admin, Access, and Authorization

**File Target:** `plans/05092026/11-admin-access-and-authorization.md`  
**Execution State:** **IN PROGRESS.** Source contracts landed. Bypass-off browser proof unrun.  
**Scope:** The access entry, private member shells, Admin console, protected APIs, and local-development bypass.  
**Out of Scope:** Planner/Studio product behaviour, database schema changes, and marketing navigation except where a redirect crosses an access boundary.

## Execution checklist (leave open)

- [x] `/access` not 307'd on cookie names
- [x] Sign-out is `signOutFromSupabase`; no `createAuthClient`
- [x] `?direct=true` escape; bypass false in production
- [ ] Bypass-off `/access` cookie-loop browser proof
- [ ] CSRF / rate-limit / wrong-role API matrix not freshly probed

---

## 1. Why This Is a Separate Plan

Existing plans cover persistence, browser tests, and the public route map, but no plan owns the authority boundary between a guest, member, planner user, and admin. That boundary crosses page layouts, server helpers, `site/proxy.ts`, API wrappers, cookies, and the browser gate. It must therefore have one route-and-API authority matrix rather than scattered assumptions.

### Evidence Anchors

| Surface | Observed responsibility | Planning implication |
|---|---|---|
| `site/app/(site)/access/page.tsx` | Sanitizes `next`, redirects an existing user server-side, and determines whether the intended destination requires admin access. | Preserve server-side redirect and reject external or malformed return paths. |
| `site/app/admin/layout.tsx` | Requires an `admin` user and publishes `noindex` metadata for the Admin shell. | The layout remains the defence-in-depth page boundary for every nested Admin route. |
| `site/app/(site)/dashboard/layout.tsx` | Requires a planner user and is noindex. | Member-shell requirements must be recorded independently of public marketing chrome. |
| `site/lib/auth/roles.ts` | Resolves elevated role only from Supabase JWT `app_metadata`. | Never grant privilege from user-writable `user_metadata`. |
| `site/lib/auth/session.ts` and `site/lib/auth/devAuthBypass.ts` | Resolve server sessions and constrain the development bypass to permitted hosts. | The bypass is a local test/dev aid, not a production access mechanism. |
| `site/proxy.ts` and `site/app/api/admin/_lib/server.ts` | Fail closed for protected writes, maintenance, CSRF, and rate-limit cases. | Page guards and API guards must agree; neither may be the only control. |

---

## 2. Authority Model and Invariants

| Principal | Permitted baseline | Must not grant |
|---|---|---|
| Guest | Public marketing pages and explicitly guest-enabled product flows. | Admin, member writes, or any privilege inferred from a URL parameter. |
| Authenticated member | Its own dashboard/portal/planner resources as determined server-side. | Admin functions or another member's resources. |
| Planner user | Planner member surfaces after the appropriate session check. | Admin functions unless the JWT role independently grants them. |
| Admin | Admin UI and APIs after server-side role resolution. | Bypass of CSRF, rate limit, audit, or maintenance protections. |
| Development bypass | Explicit loopback/allowlisted development requests only. | Deployment, public hosts, or a substitute for production authentication. |

Non-negotiable invariants:

1. All redirect targets pass `sanitizeNextPath`; no client-only validation is sufficient.
2. Role elevation uses server-derived Supabase identity and `app_metadata` only.
3. Layout/page protection is paired with handler-level authorization for APIs and mutations.
4. Protected mutations require the intended combination of role, CSRF validation, origin validation, and rate limiting.
5. Private pages, access screens, and Admin remain excluded from public discovery.
6. A maintenance mode must fail closed for mutations according to the explicit allowlist, not a broad path heuristic.

---

## 3. Required Authority Inventory

### Phase A — Build the Route and API Matrix

Create a single reviewed table with these columns before changing any behaviour:

| Field | Required record |
|---|---|
| Route or API prefix | Exact normalized path and supported methods. |
| Principal | Guest, member, planner, admin, or internal service. |
| Page guard | Layout/page helper that enforces the route boundary. |
| API guard | `withAuth`, `requireAdminSession`, or explicit equivalent. |
| Mutation controls | CSRF, origin, rate-limit scope/window, idempotency when relevant. |
| SEO/chrome | Public or noindex, plus shell ownership. |
| Maintenance behaviour | Allowed, read-only, redirected, or denied. |
| Test owner | Existing test or new targeted test required before release. |

Start with `/access`, `/login`, `/dashboard`, `/portal`, `/portal/guest`, `/admin`, `/api/admin/**`, `/api/plans/**`, `/api/Planner/**`, and `/api/Studio/**`. Add no route to this matrix based solely on a client-side link; inspect the actual handler or layout.

### Phase B — Close Boundary Gaps

For each matrix row, compare page and API enforcement. A gap is any of the following:

- a protected page without server-side session enforcement;
- an API mutation that can reach business logic before authorization/CSRF/rate limiting;
- a guest exception that grants unrelated product or admin access;
- a `next` target that escapes the intended host/path namespace;
- an indexable private route or a public navigation link to an unavailable authority surface;
- a superficial edge proxy cookie check triggering infinite redirect loops.

### Phase B.1 — Access and sign-out (source current)
1. **Proxy:** `/access` is not 307'd on cookie names. Protected paths without cookies 307 **to** `/access`. `access/page.tsx` uses `?direct=true` to skip session redirect.
2. **Sign-out:** `DashboardClient` calls `signOutFromSupabase()` from `site/lib/auth/supabaseServerActions.ts`. No `createAuthClient`. Lands on `/access?direct=true`.
3. **Open:** bypass-off browser proof. Do not copy IDs into [`Failures.md`](../../Failures.md).

### Phase C — Traceable Admin Operations

For Admin mutations, document which request establishes identity, which service owns the authorization decision, and where audit/observability is emitted. Price-book activation, catalog publication, theme publication, plan mutations, and customer-query management require special review because they mutate shared business state.

No plan is complete until error responses are safe to expose: they may identify the action category and retry state, but must not disclose tokens, roles, internal identifiers, or other users' data.

---

## 4. Verification Plan

Run checks only when separately authorized. The evidence set must contain:

1. Unauthenticated page navigation confirms private Admin and member routes redirect only to the sanitized access path.
2. Anonymous and wrong-role API probes are denied before mutation; responses do not report success.
3. Authenticated happy-path probes confirm the intended principal can complete the action.
4. CSRF, bad-origin, rate-limit, and maintenance cases each have a deterministic result.
5. Development bypass evidence confirms it is disabled in production and restricted to its allowed host conditions in development.
6. Browser checks cover keyboard focus after an access redirect and the noindex metadata of private shells.

The existing Admin smoke coverage is a starting point, not proof that every API is protected. Expand the matrix before expanding tests.

---

## 5. Rollback and Incident Boundaries

- If an access change may expose a protected route, stop rollout and restore the last known server-side guard before investigating UX.
- If an authorized user loses access, capture route, normalized return path, principal type, and safe error code; do not log session cookies or bearer tokens.
- Do not enable development bypass, weaken a CSP, or mark a route public as an emergency workaround.
- A change affecting role parsing, redirect sanitation, cookies, or proxy path rules requires the authority matrix and targeted evidence to be updated in the same review.

---

## 6. Completion Criteria

- Every protected route/API has a reviewed matrix row and an accountable server-side guard.
- No privilege derives from user metadata, client state, or an unsanitized redirect target.
- Private surfaces are noindex and absent from public discovery structures.
- Anonymous, wrong-role, CSRF, origin, rate-limit, and maintenance behaviours have fresh authorized evidence.
- Development bypass is contained and has no production path.
- No Planner/Studio boundary is changed as part of authority work without its own scoped plan.
## Test reconciliation update (2026-09-05)

### Detailed work packages: session transitions and operation outcomes

1. Extend the route/API matrix with anonymous, permitted role, wrong role, expired session and sign-out states. UI concealment is not sufficient evidence that an operation is denied.
2. Specify redirect termination and return-destination behavior for direct entry and client navigation; keep the loop hypothesis separate from a reproduced redirect chain.
3. For existing mutations, record expected denial result and absence of side effects, as well as the allowed result. Isolate test-created entities and identify cleanup ownership.
4. Separate bypass-backed usability evidence from real authentication evidence. Missing credentials produce a pending profile, not an authorization pass.
5. Assign cross-tab/session-expiry behavior an explicit expected outcome before changing code; retain independent Tech-Docs session ownership under Plan 05.

Deliverable: actor/state/operation matrix linked to retained tests. Acceptance: permitted operations work, denied operations have no unauthorized effect, and sign-out/re-entry results are evidenced without relaxing guards.

Classify guest/member/admin profiles and session setup before moving auth tests. Bypass-mode execution cannot prove access control; preserve denied-access, expired-session and sign-out coverage.

Acceptance: record current path, owner, destination/disposition, preserved assertions, affected commands, and evidence. A filename or age alone is insufficient grounds for retirement. Runtime validation remains pending; this update changes planning documents only.

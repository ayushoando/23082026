---
name: oando-master
description: "Master platform coordinator and compulsory skill dispatch authority for the Oando platform repository. Enforces skill usage authority, just-in-time domain loading, release gating, and cross-cutting architectural invariants."
---

# Oando Master — Platform Coordinator & Compulsory Skill Dispatcher

Use this skill as the master operational coordinator for the Oando platform repository (`d:/23082026`). It governs the **authority hierarchy**, **timing of skill activation**, and **compulsory domain dispatch rules** to ensure that all tasks are executed with thermonuclear precision, zero domain fragmentation, and zero context bloat.

---

## 1. The Thermonuclear Authority Hierarchy

Under `AGENTS.md` and repository governance:
$$\text{User Instruction} > \text{Live Code / Fresh Command Output} > \text{AGENTS.md} > \text{oando-master} > \text{Domain Skills}$$

1. **User Always Wins:** A direct user instruction overrides any standard, handbook, or skill rule.
2. **Repository Floor:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) sets the baseline execution rules (smallest sound change, preserve unrelated work, no handwritten `any`, absolute quarantine on `docs/protected-folder/`).
3. **Master Coordinator (`oando-master`):** Governs which domain skill must be invoked and when.
4. **Domain Skills:** Provide specialized, non-negotiable procedural runbooks for their respective engineering domains. Skills provide operational rigor; they never overrule user instructions.

---

## 2. Skill Usage Timing & Compulsory Loading Invariants

To eliminate both rule neglect and context window bloat, skill usage is governed by three strict laws:

### Law 1: Just-In-Time (JIT) Pre-Flight Activation
- **When to Load:** Immediately upon analyzing the user prompt, **before the first file edit or state-changing command**.
- An agent must never modify files in a managed domain without having loaded the matching domain skill.

### Law 2: Single-Domain Bounding (Anti-Bloat Invariant)
- **Token Tax Protection:** An agent must load **at most ONE domain skill per task slice**.
- Never greedily load multiple skills into context simultaneously. If a multi-step task crosses domains (e.g. database migration followed by UI page update), complete the first domain, verify it, and load the next domain skill serially.

### Law 3: Read-Only & Inspection Exemption
- Compulsory skill activation applies **strictly to implementation and modification turns**.
- Read-only questions, file searches, architectural explanations, status reports, and audits are **exempt** from compulsory skill loading.

---

## 3. Compulsory Domain Dispatch Matrix

Whenever a task touches a specific file pattern, subsystem, or engineering domain, the corresponding domain skill is **mandatory**:

| Managed Domain & File Patterns | Compulsory Skill | Invariants Enforced |
|---|---|---|
| `site/platform/supabase/migrations/`<br>`site/platform/supabase/schema/`<br>Database tables, SQL, Drizzle | **`db-migrations`** | Mandatory `-- rollback` SQL block, dual-DB routing (Admin vs Products), dry-run preflight (`--dry`), RLS policies, automated type regeneration (`db:types`). |
| `tests/**/*.{ts,tsx}`<br>Vitest configs, test mocks, Playwright | **`test-engineering`** | Dual-lane Vitest execution, passing the 5 anti-cheat audits (anti-hollow, anti-fake, no unallowlisted skips, 5-file eslint cap, API route safety), mode-aware persistence mocking. |
| `site/app/(site)/`<br>`site/components/`<br>`site/focss/`<br>CSS, mobile chrome, navigation dock | **`ui-review`** | 4-Phase Evidence-Led Redesign Pipeline, local asset primacy, 8 Unforgivable Sins, FOCSS design tokens, `.mobile-app-main` scroller, 48px touch targets, symbol PNG contracts. |
| `site/i18n/messages/{en,hi}.json`<br>`site/i18n/`<br>Translations, localization, language switcher | **`i18n`** | 100% Devanagari key parity across all 26 marketing namespaces, zero English leaks in Hindi mode, identical dynamic `{param}` placeholders, ban on raw strings in JSX/TSX. |
| `site/app/newrelic.js/`<br>`site/app/api/metrics/`<br>`site/instrumentation.ts`<br>Telemetry, APM, OpenTelemetry, Prometheus | **`observability`** | Same-origin `/newrelic.js` with data masking (`capture_payloads: 'none'`), nonce-based CSP compliance, Node APM hybrid agent with unified `oando-web` OTel bridge, secret scanning. |
| Root markdown docs (`*.md`)<br>`DOC-MAP.md`, `CONTENTS.md`<br>`docs/architecture/` | **`docs-update`** | Zero-drift against live code, 100% link resolution on disk, root surface doc cap ($\le 3$ session docs), `Failures.md` row deletion law, KaTeX literal `\$` escaping, registry sync. |
| Implementation roadmaps under `plans/` | **`plan-review`** | Plan stress-testing, reality check against stale meta-audit toys, ban on code under `plans/`, 8 architectural invariants, single-slice blast radius. |
| Full session sign-off, release preflight,<br>worktree verification, quality gate check | **`thermonuclear-session-audit`** | Scorched-earth forensic quality gate across the 8 Pillars of Inspection (claimed vs observed proof, worktree purity, quarantine isolation, boundaries, regression prevention). |
| Platform architecture lookup, fork specs,<br>cloud infrastructure, Vercel linking | **`tech-stack`** | Master all-in-one technical reference for the repository. |

---

## 4. Master Release Gating & Quality Floors

Before any change or session is marked complete:

```powershell
# 1. Verify repository layout and document cap
pnpm run check:layout

# 2. Verify Studio ↔ Planner boundary isolation
pnpm run scan:boundaries

# 3. Verify Failures.md keyword governance (0 blockers, zero forbidden words)
node scripts/general/check-failures.mjs

# 4. Check style token baseline debt ratchet
pnpm run check:style-tokens

# 5. Verify zero exposed secrets or credentials
pnpm run scan:secrets

# 6. Verify fast development loop
pnpm run gate:fast
```

- **Blocker Clearance:** A blocker recorded in `Failures.md` is resolved **strictly by deleting its entire row** after a fresh passing command run.
- **Absolute Quarantine Floor:** Directory `docs/protected-folder/` is strictly quarantined. Never read, search, list, or reference it.

---
name: plan-review
description: "Execute a thermonuclear review and stress-test of technical implementation plans and roadmaps under plans/. Eliminates stale toy meta-audits, prevents scope creep, enforces architectural invariants, verifies blast radius containment, and demands automated ground-truth verification."
---

# Plan Review — Thermonuclear Plan Audit & Stress-Testing Standard

Use this skill when drafting, reviewing, auditing, or certifying technical implementation plans and roadmaps in this repository (`plans/` or session implementation plans). Plans are engineering contracts: every proposed step, file target, command, and assertion must withstand ruthless forensic scrutiny.

There is zero tolerance for hand-waving, aspirational "TODOs", circular self-testing meta-audits ("stale toys"), boundary violations, uncontained blast radius, or hallucinated verification steps.

---

## 1. The Core Thermonuclear Tenet: Plans Are Code Contracts

Under `AGENTS.md` and `Agents/01-standard.md`:
$$\text{User Instruction} > \text{Live Code / Fresh Command Output} > \text{AGENTS.md} > \text{Agents/} > \text{docs/}$$

A plan does not earn authority by being lengthy, academic, or elaborate. A plan is judged solely by whether it executes the **exact stated task**, makes the **smallest sound change**, protects **unrelated work**, preserves **architectural invariants**, and proves its outcome with **fresh, reproducible command evidence**.

---

## 2. The 6 Thermonuclear Review Gates

Every implementation plan must pass all 6 gates without exception. A failure in any single gate warrants immediate rejection.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE 6 THERMONUCLEAR PLAN REVIEW GATES                │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. REALITY CHECK & ANTI-TOY GATE (Kill Stale Circular Frameworks)       │
│ 2. REPOSITORY ARCHITECTURAL INVARIANTS GATE (The 8 Non-Negotiables)     │
│ 3. BLAST RADIUS & SCOPE CONTAINMENT GATE (Single Slice Discipline)      │
│ 4. PERSISTENCE & MIGRATION SAFETY GATE (No Dual-Write / Prod EROFS)     │
│ 5. RIGOROUS AUTOMATED VERIFICATION GATE (Fresh Concrete Proof)          │
│ 6. DOCUMENTATION & REGISTRY SYNCHRONIZATION GATE (Zero Drift)           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Gate 1: Reality Check & Anti-Toy Gate (Kill the Stale Toys)

Plans frequently fall into the trap of inventing self-referential meta-audit frameworks, synthetic validation manifests, and circular test harnesses that test the harness rather than the product.

- **No Code in `plans/`:** `plans/` is strictly for Markdown documentation, roadmaps, and flowcharts. Any plan proposing to put TypeScript files, test helpers, or executable runtime code under `plans/` is immediately rejected.
- **Kill Circular Meta-Audits:** If a plan introduces a "validator" that checks a "registry" that reads a "matrix" without exercising actual application code, it is a stale toy. Tests must assert live runtime contracts, Drizzle schemas, API route responses, and DOM components.
- **Decouple Genuine Fixtures:** Real test fixtures belong in `tests/fixtures/`. Shared test helpers belong in `tests/e2e/helpers/` or `tests/unit/helpers/`.
- **Stale Workstream Check:** Verify that the plan does not resurrect abandoned, superseded, or dead workstreams. Check git history and active coordination in `plans/README.md`.

---

### Gate 2: Repository Architectural Invariants Gate

The plan must explicitly honor all 8 non-negotiable architectural rules of the Oando platform:

1. **Studio ↔ Planner Fork Isolation:**
   - Furniture Studio (`site/components/Studio/`, `site/lib/Studio/`, `@studio/*`) and Floor Planner (`site/components/Planner/`, `site/lib/Planner/`, `@planner/*`) are strictly forked.
   - They must **never** import each other.
   - Any plan touching either tree must include `pnpm run scan:boundaries` in its verification plan.
2. **Read-Only Production Filesystem:**
   - Production Vercel serverless filesystem is strictly read-only (`EROFS`).
   - Writes are allowed to disk *only* when `DEV_AUTH_BYPASS=1` on non-production.
   - All runtime write operations must use mode-aware wrappers (`writeFurnitureItem`, `plannerPersistenceMode.ts`, `furnitureCatalogMode.ts`), never raw `fs.writeFileSync` or `fs.promises.writeFile`.
3. **Dual-Database Segregation:**
   - **Admin Database** (`rxzpznmxbaoxpikowmfc`): Staff/customer auth, profiles, projects/plans (`oando_plans`), price books, furniture items (`furniture_catalog`), and block descriptors.
   - **Products Database** (`erpweaiypimorcunaimz`): Public marketing catalog, configurator models, themes, feature flags.
   - Plans must route tables and queries to the correct database instance.
4. **FOCSS Design System Strictness:**
   - Zero Tailwind arbitrary values (e.g. `p-[13px]`, `text-[#123456]`).
   - Must use `@focss/*` design tokens and semantic variables.
   - Checked via `node scripts/general/check-style-tokens.mjs`.
5. **Mobile Chrome Architecture:**
   - On viewports `<768px`, page scrolling belongs exclusively to `.mobile-app-main`, not `window`.
   - GSAP and ScrollTrigger animations must bind to `scroller: ".mobile-app-main"` on mobile.
   - Mobile pages must account for bottom navigation bar offset (`pb-20` / 64px + `env(safe-area-inset-bottom)`).
6. **Strict TypeScript & Zero Handwritten `any`:**
   - No `as any` or `: any` escape hatches.
   - When database schema changes, types must be regenerated via `pnpm run db:types:admin` and `pnpm run db:types`.
7. **Absolute Quarantine Isolation:**
   - Directory `docs/protected-folder/` is fully quarantined.
   - Plans must **never** touch, inspect, reference, or list anything inside `docs/protected-folder/`.
8. **Origin Whitelist:**
   - All local UI claims, test configs, and browser instructions must use `http://localhost:3000` (never `127.0.0.1`).

---

### Gate 3: Blast Radius & Scope Containment Gate

Plans must follow the "smallest sound change" rule:

- **Single Finding / Route / Slice Discipline:** Plans must solve the stated objective without tacking on opportunistic refactoring, mass formatting, or cleanup of adjacent files.
- **Explicit Target File Manifest:** Multi-file plans must enumerate every single target file explicitly:
  ```markdown
  ### Affected Files
  - [MODIFY] [clientRegistry.ts](file:///d:/23082026/site/lib/clients/clientRegistry.ts)
  - [NEW] [clientLogoContract.test.ts](file:///d:/23082026/tests/unit/clients/clientLogoContract.test.ts)
  ```
- **Preservation of Unrelated Work:** The plan must explicitly acknowledge and preserve existing, uncommitted work in the tree. No `git reset --hard`, `git checkout .`, or blanket restorations.
- **Phase Reversibility:** Multi-step plans must structure work in atomic, reversible phases. If step 2 fails, step 1 must not leave the repository in a broken or unbuildable state.

---

### Gate 4: Persistence & Migration Safety Gate

Any plan proposing database schema or storage changes must adhere to the persistence lifecycle:

- **Rollback Required:** Every SQL migration file in `site/platform/supabase/migrations/` must contain an explicit `-- rollback` block.
- **Dry-Run Preflight:** Must execute dry runs first:
  ```powershell
  pnpm run db:apply -- --dry
  pnpm run db:apply:admin -- --dry
  ```
- **RLS & Security Policies:** Plans adding tables must include both table permissions (`GRANT`) and Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY; CREATE POLICY ...`).
- **No Dual-Write:** Plans must never write to both Supabase and disk simultaneously. Persistence mode selector decides exclusively based on environment.

---

### Gate 5: Rigorous Automated Verification Gate

A plan without concrete, verifiable command evidence is completely invalid.

- **No Hand-Waving Acceptance:** Terms like "ensure tests pass", "verify visually", or "test thoroughly" are rejected.
- **Mandatory 5-Part Verification Template:** Every task in the plan must define:
  1. **Goal:** Specific outcome being verified.
  2. **Target Files:** Exact files checked.
  3. **Run Command:** Exact shell command to execute (e.g. `pnpm run test:unit`, `pnpm run gate:fast`).
  4. **Expected Output:** Exact expected status, test count, or exit code 0.
  5. **Evidence Artifact:** Where proof is captured (e.g. `results/tests/summary.json`).
- **Dual-Lane Vitest Awareness:** `pnpm run test` executes two separate lanes (default Next app + tech-docs SPA). If unit tests are touched, specify the exact configuration file:
  `pnpm exec vitest run tests/unit/path/to/test.test.ts --config tests/vitest.config.ts`.
- **Browser Claims Verification:** If visual UI behavior is claimed, the plan must specify Playwright specs or actual browser verification on `http://localhost:3000` at standard viewports (Desktop 1280x800, Mobile 390x844).

---

### Gate 6: Documentation & Registry Synchronization Gate

When production code changes, the plan must include steps to update all corresponding registries:

| If the plan touches: | The plan must also update: |
|---|---|
| Routes or SEO metadata | `site/features/site/data/siteSeoContract.ts`, `DOC-MAP.md`, `CONTENTS.md`, `docs/architecture/routes.md` |
| Scripts | `docs/architecture/scripts.csv`, `scripts/general/README.md` |
| Database schema | `tech-docs-generator/src/pages/Database.tsx` (Mermaid), `docs/architecture/stack.md` |
| Navigation or branding | `site/lib/navigation/`, `site/i18n/messages/{en,hi}.json` |
| Blockers | `Failures.md` (only by row deletion after clean run) |

---

## 3. Thermonuclear Review Scorecard & Verdict

When conducting a plan review, output the formal evaluation using this rubric:

```markdown
# Thermonuclear Plan Review: [Plan Title]

## Gate Evaluation Matrix
- [x] Gate 1: Reality Check & Anti-Toy Invariant (No stale frameworks, no code in plans/)
- [x] Gate 2: Architectural Invariants (Fork isolation, read-only prod, FOCSS, mobile chrome)
- [x] Gate 3: Blast Radius & Scope Containment (Target file manifest, unrelated work protected)
- [x] Gate 4: Persistence & Migration Safety (Rollback SQL, dry-run preflight, RLS)
- [x] Gate 5: Automated Verification Rigor (Concrete commands, expected outputs, zero hand-waving)
- [x] Gate 6: Documentation & Registry Sync (DOC-MAP, routes, scripts.csv, Database.tsx)

## Findings & Flaws Identified
1. [Finding 1: Specific line or architectural violation]
2. [Finding 2: Missing verification command or ambiguous scope]

## Verdict
[ PASS | REVISE | HARD REJECT ]
- PASS: Plan meets all thermonuclear criteria. Approved for execution.
- REVISE: Specific identified gaps must be resolved before any code is modified.
- HARD REJECT: Fundamental architectural violation, stale toy audit, circular proof, or quarantine leak.
```

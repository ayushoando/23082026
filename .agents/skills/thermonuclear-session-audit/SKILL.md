---
name: thermonuclear-session-audit
description: "Execute a scorched-earth, forensic session and worktree audit. Detects hallucinated verifications, hollow/fake tests, boundary leaks, secret exposure, quarantined folder violations, session regression, and architectural drift with zero tolerance."
---

# Thermonuclear Session Audit — Scorched-Earth Forensic Quality Gate

Use this skill to conduct an uncompromising, forensic investigation of worktree state, agent actions, test integrity, session continuity, and architecture adherence. This audit operates under **zero-trust assumptions**: every assertion must be backed by live, verifiable disk or command evidence. **An unobserved command is unrun.**

---

## 1. The Scorched-Earth Truth Floor

Under `AGENTS.md` Rule 1, truth is non-negotiable:
- **Never Invent Verification:** If a test, build, browser check, or deployment was not explicitly executed and observed with a zero exit code in the current session, it **did not happen**.
- **No Circular Meta-Audits:** Tests that only test the audit framework itself, mock datasets, or reconciliation checkpoints are flagged as **stale toys** and rejected.
- **No Regressive Recovery Loops:** Audits must drive forward progress to release quality. Passive recovery reports and circular worktree audits are forbidden.
- **No Hand-Waving or Deferred Quality:** "Will be addressed in Phase B" or "minor styling deviation" are treated as unresolved defects.
- **Scope Discipline:** Do exactly the stated task. Do not expand scope, refactor adjacent code, or make opportunistic improvements. Make the smallest reversible change that achieves the requested outcome. If scope is exceeded, stop and report it.

---

## 2. The Eight Pillars of Forensic Inspection

```
┌─────────────────────────────────────────────────────────────────────────┐
│              THE 8 PILLARS OF THERMONUCLEAR FORENSIC INSPECTION         │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. CLAIMED VS. PHYSICAL EVIDENCE RECONCILIATION                         │
│ 2. GIT WORKTREE PURITY & COLLATERAL DAMAGE PREVENTION                   │
│ 3. ABSOLUTE QUARANTINE ENFORCEMENT (docs/protected-folder/)            │
│ 4. ARCHITECTURAL BOUNDARIES & PERSISTENCE GUARDRAILS                    │
│ 5. TEST SUBSYSTEM INTEGRITY & ANTI-CHEAT GATES                          │
│ 6. SECURITY, SECRETS & CLOUD INFRASTRUCTURE                             │
│ 7. FAILURES.MD STRICT KEYWORD & CLEARANCE GOVERNANCE                    │
│ 8. SESSION REGRESSION, ANTI-LOOP & RESURRECTION PREVENTION              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Pillar 1: Claimed vs. Physical Verification
- Check session transcripts, reports, and git logs for claims of "all tests pass" or "gate green".
- Correlate claims against actual JSON test artifacts:
  - `results/tests/summary.json` (must record `failed: 0` across both `default` and `tech-docs` lanes).
  - `results/tests/vitest-results.json` and `results/tests/vitest-tech-docs-results.json`.
- Any mismatch between claimed success and on-disk test output triggers an immediate **FALSIFICATION VIOLATION**.

### Pillar 2: Git Worktree & Mutation Purity
- Run `git status --porcelain` to inspect the exact diff.
- Verify that **no collateral damage** occurred:
  - Unrelated, messy, or pre-existing uncommitted work must be 100% preserved.
  - Zero unauthorized changes to package lockfiles (`pnpm-lock.yaml`).
  - Zero forbidden directories created: `site/results`, `site/node_modules`, `site/data`, `.claude`, `site/.claude`, `.tmp`.
  - Zero handwritten markdown reports committed to `results/` (violates Trap #6 in `AGENTS.md`).

### Pillar 3: Absolute Quarantine Enforcement
- Verify that `docs/protected-folder/` (and any path matching `*protected-folder*`) was **never accessed, read, listed, searched, or imported**.
- Any command or agent interaction referencing the quarantined directory constitutes an immediate **CRITICAL SECURITY BREACH**.

### Pillar 4: Architectural Boundaries & Persistence Guardrails
- **Fork Boundary Isolation (`pnpm run scan:boundaries`):**
  - Verify zero cross-imports between `site/**/Planner` and `site/**/Studio`.
  - Verify FOCSS zone isolation (`site/focss/planner/entry.css` must never import `base/scan.css`).
- **Persistence Mode & EROFS Prevention:**
  - Production filesystem is read-only. Verify that no runtime route attempts raw disk writes (`fs.writeFileSync`).
  - Verify mode-aware persistence wrappers are used (`plannerPersistenceMode.ts`, `furnitureCatalogMode.ts`).
  - Verify that `DEV_AUTH_BYPASS=1` is strictly restricted to non-production environments.
- **Dual-Database Partitioning:**
  - Admin DB (`rxzpznmxbaoxpikowmfc`): Plans, profiles, furniture, descriptors, handoffs.
  - Products DB (`erpweaiypimorcunaimz`): Marketing catalog, configurator, themes, flags.
  - Zero dual-writing permitted.

### Pillar 5: Test Subsystem Truth & Anti-Cheat Audits
- **Hollow Tests (`pnpm run test:audit`):**
  - Rejects `expect(true).toBe(true)`, sole `toBeTruthy()`, sole `toBeDefined()`, empty `catch {}` blocks, or zero-assertion `it()` blocks.
- **Fake Tests (`pnpm run test:audit:fake-test`):**
  - Rejects tests mocking the unit under test (`vi.mock` + `extract[A-Z]`).
  - Asserts expectCount ≥ itCount.
- **Gate Skips (`pnpm run test:audit`):**
  - Scans for unauthorized `test.skip`, `it.skip`, `describe.skip`, `.only`, `istanbul ignore`, `v8 ignore`.
  - Any skips must match active, unexpired entries in `tests/manifests/skip-exceptions.json`.
- **ESLint Suppressions (`pnpm run test:audit`):**
  - Exactly **5 permitted files** across the entire repository for `react-hooks/exhaustive-deps`:
    1. `site/hooks/Studio/useStudioFabric.ts`
    2. `site/hooks/Planner/usePlannerFabric.ts`
    3. `site/hooks/Studio/useStudioKeyboardShortcuts.ts`
    4. `site/hooks/Planner/usePlannerKeyboardShortcuts.ts`
    5. `site/hooks/Planner/usePlannerSessionWarning.ts`
  - Any additional `eslint-disable` comment is an automatic failure.

### Pillar 6: Security, Secrets & Cloud Infrastructure
- **Secret Scanning (`pnpm run scan:secrets`):**
  - Scans for exposed API keys, private tokens, or credentials in tracked files.
- **Service-Role Key Isolation (Finding 9.3):**
  - Asserts that `SUPABASE_ADMIN_SERVICE_ROLE_KEY` is never exposed to client-side `NEXT_PUBLIC_` variables via `assertNotServiceRoleKey`.
- **RFC 9116 `security.txt`:**
  - Verified served directly from edge proxy cache without origin leakage.

### Pillar 7: `Failures.md` Governance Floor
- Governed by `pnpm run check:failures`.
- **Forbidden Terms:** Any line in `Failures.md` containing `resolved`, `closed`, `pass`, `passed`, `truth snapshot`, `history`, `historical`, or `[x]` triggers an immediate hard CI failure.
- **The Only Valid Clearance:** A blocker is resolved **strictly by deleting its entire row** after fresh, authorized command output confirms the fix.

### Pillar 8: Session Regression, Anti-Loop & Resurrection Prevention
- **Silent Reversion Detection:** Compare the current branch against upstream/baseline commits to verify that previous sound fixes (e.g. brand string standardization, mobile tap target expansion, i18n key additions) were not silently reverted or lost during merge/session recovery.
- **Dead Code Resurrection Guard:** Actively verify that deleted obsolete frameworks (such as stale meta-audit toys under `plans/`, circular test shims, or dead scripts) have not been re-created or re-imported.
- **Context Summarization Truth:** Handover notes and session summaries must never claim verification or completion for tasks that degraded adjacent routes. Cross-check claims against fresh vitest and layout checker runs.
- **Anti-Looping Invariant:** Detect when an agent or session is trapped in circular edits (modifying the same files back and forth between turns). If circular edits are detected, halt immediately and state the conflict plainly.

---

## 3. Forensic Audit Execution Runbook

When running a Thermonuclear Session Audit, execute the following battery of verification commands in sequence:

```powershell
# 1. Inspect repository layout and forbidden directories
pnpm run check:layout

# 2. Verify strict fork boundary isolation
pnpm run scan:boundaries

# 3. Check Failures.md governance purity
pnpm run check:failures

# 4. Check governance debt ratchet (all 6 metrics must be 0)
pnpm run check:governance

# 5. Check style token debt ratchet (must match baseline exactly)
pnpm run check:style-tokens

# 6. Execute all static test integrity audits
pnpm run test:audit
pnpm run test:audit:fake-test

# 7. Scan repository for secret leaks
pnpm run scan:secrets

# 8. Verify root markdown documentation links
pnpm run check:docs-all

# 9. Verify full TypeScript compilation across tests and site
pnpm run typecheck
pnpm run typecheck:tests

# 10. Verify site UI contracts and i18n parity
pnpm run check:site-ui
```

---

## 4. Thermonuclear Audit Output Template

Every audit executed under this skill must generate a forensic report adhering strictly to this schema:

```markdown
# Thermonuclear Session Audit Report

**Audit Timestamp:** [ISO 8601 UTC]  
**Session / Worktree Status:** [CLEAN | DIRTY | COMPROMISED]  
**Overall Verdict:** [🔥 THERMONUCLEAR FAIL | ⚠️ CONDITIONAL PASS | 🛡️ CLEAN PASS]  

---

## 1. Truth & Evidence Reconciliation
| Claimed Action / Verification | Live Physical Evidence | Status |
|------------------------------|------------------------|:------:|
| [e.g. "Full vitest suite passed"] | results/tests/summary.json (4484 passed, 0 failed) | ✅ VERIFIED / ❌ FALSIFIED |

---

## 2. Eight-Pillar Compliance Matrix
| Pillar | Scope | Result | Findings / Notes |
|---|---|:---:|---|
| **1. Execution Truth** | Claimed vs observed command logs | [PASS/FAIL] | ... |
| **2. Worktree Purity** | Uncommitted files, layout, locks | [PASS/FAIL] | ... |
| **3. Quarantine** | docs/protected-folder/ isolation | [PASS/FAIL] | ... |
| **4. Boundaries** | Studio ↔ Planner, FS read-only, DB split | [PASS/FAIL] | ... |
| **5. Test Integrity** | Hollow, fake, skips, eslint-disable | [PASS/FAIL] | ... |
| **6. Security** | Leaked secrets, service role isolation | [PASS/FAIL] | ... |
| **7. Failures.md** | Blocker row accounting, forbidden words | [PASS/FAIL] | ... |
| **8. Anti-Regression** | Reversion checks, dead code resurrection | [PASS/FAIL] | ... |

---

## 3. Discovered Anomalies & Forensic Violations
[List exact file paths, line numbers, and architectural breaches. If clean, explicitly state "Zero violations observed".]

---

## 4. Mandatory Remediation Directives
[Step-by-step non-negotiable fixes required before release clearance.]
```

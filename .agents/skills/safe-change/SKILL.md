---
name: safe-change
description: "Execute user-authorized repository changes with strict scope containment, preflight invariant checks, and zero regression. Eliminates destructive git actions and collateral drift."
---

# Safe Change — Zero-Regression Execution Standard

Use this skill whenever executing code, configuration, or documentation changes across the repository. This skill guarantees that every edit is **forward-moving**, **contained**, and **verified against regressions**, preventing accidental overwrites, destructive git commands, or collateral damage to unrelated work.

---

## 1. The Core Safe Change Invariants

Under `AGENTS.md` and `Agents/01-standard.md`:
$$\text{User Instruction} > \text{Live Code / Fresh Command Output} > \text{AGENTS.md} > \text{Agents/} > \text{docs/}$$

1. **Smallest Sound Change:** Solve the exact stated task with minimal line alterations. No opportunistic refactoring, mass formatting, or stylistic cleanups of adjacent files.
2. **Preserve Unrelated Work:** Pre-existing, messy, or uncommitted work in the tree belongs to the user and must be 100% preserved.
3. **Ban on Destructive Git Operations:** `git reset --hard`, `git checkout .`, `git clean -fd`, and blanket file restorations are strictly prohibited.
4. **Targeted Reversibility:** If an edit fails verification, roll back **only the specific file** touched: `git checkout HEAD -- path/to/failed-file.ts`. Never roll back the entire repository.
5. **No Handwritten `any`:** Strict TypeScript typing must be preserved across all edits.

---

## 2. The 5-Step Safe Change Protocol

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE 5-STEP SAFE CHANGE PROTOCOL                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. PREFLIGHT BASELINE CAPTURE                                          │
│    • Run git status -s to snapshot pre-existing uncommitted work       │
│    • Note existing modified files and protect them from collateral edit│
├────────────────────────────────────────────────────────────────────────┤
│ 2. EXPLICIT SCOPE DECLARATION                                          │
│    • State one-sentence understanding of the requested outcome         │
│    • Enumerate exact target files to touch before making any edit      │
├────────────────────────────────────────────────────────────────────────┤
│ 3. ATOMIC & CONFINED EDIT                                              │
│    • Use precise, targeted search/replace or file write operations     │
│    • Adhere to repository invariants (FOCSS tokens, i18n keys, etc.)   │
├────────────────────────────────────────────────────────────────────────┤
│ 4. POST-CHANGE DIFF & ANTI-REGRESSION INSPECTION                       │
│    • Inspect git diff --stat to verify ONLY target files changed       │
│    • Verify zero modifications to unrelated files or lockfiles         │
├────────────────────────────────────────────────────────────────────────┤
│ 5. TARGETED VERIFICATION & EVIDENCE RECORDING                          │
│    • Run targeted unit tests and static checkers                       │
│    • Report exact changes, verification results, and unperformed work  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Pre-Flight & Post-Flight Runbook

Execute this sequence to safeguard changes against regression:

```powershell
# 1. Preflight: snapshot worktree state
git status -s

# [Perform authorized, minimal edits on target files]

# 2. Post-Flight: verify diff strictly matches planned files
git status -s
git diff --stat

# 3. Verify repository integrity remains green
node scripts/general/check-failures.mjs
node scripts/general/check-root-markdown-links.mjs

# 4. If UI or routes were touched, verify site UI contract
pnpm run check:site-ui
```

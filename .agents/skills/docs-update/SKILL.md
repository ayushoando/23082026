---
name: docs-update
description: "Execute precision documentation updates under the thermonuclear standard. Enforces zero documentation drift, strict ground-truth verification, absolute link integrity, root surface purity, KaTeX dollar escaping, and zero quarantine leaks."
---

# Docs Update — Thermonuclear Documentation Maintenance Standard

Use this skill when creating, updating, or refactoring documentation across the Oando platform (`d:/23082026`). Documentation in this repository is treated as **production code**: every statement, link, path, and metric must reflect **mathematical truth** against the live codebase. There is zero tolerance for wishful thinking, obsolete claims, broken links, or syntax corruption.

---

## 1. The Thermonuclear Truth Floor for Docs

Under `AGENTS.md` Rule 1, authority flows strictly from live code:
$$\text{User Instruction} > \text{Live Code / Fresh Command Output} > \text{AGENTS.md} > \text{Agents/} > \text{docs/}$$

- **No Aspirational Documentation:** Never document an intended feature or future state as current truth. If code is pending or mock, explicitly label it as such.
- **Evidence-Backed Metrics:** Never write numbers from memory.
  - Test counts must match `results/tests/summary.json`.
  - Style token findings must match `node scripts/general/check-style-tokens.mjs`.
  - Script counts must match physical filesystem inventory (`scripts/`).
- **No Circular Meta-Documentation:** Do not create documentation for temporary audit frameworks or internal agent scaffolding that distract from production architecture.
- **Preserve Unrelated Work:** Maintain existing comments, frontmatter, and unrelated markdown sections intact.

---

## 2. The Nine Non-Negotiable Documentation Laws

### Law 1: Absolute Quarantine Isolation
- The directory `docs/protected-folder/` is strictly quarantined.
- **NEVER** mention, link to, quote, list, or reference `docs/protected-folder/` in any public or internal documentation. Treat it as completely nonexistent.

### Law 2: 100% Markdown Link Integrity
- Every markdown link (`[label](path/to/file.md)`) must resolve to a valid file on disk.
- Enforced by `node scripts/general/check-root-markdown-links.mjs`.
- **Linux CI Case Sensitivity:** Linux filesystems are case-sensitive. Always write exact filenames (e.g. `README.md`, `Failures.md`, `CONTENTS.md`, never `Readme.md` or `failures.md`).
- Anchors (`#heading-id`) must correspond to actual markdown headings in the target file.

### Law 3: Root Surface Purity & Document Cap
- Enforced by `scripts/general/check-repo-layout.mjs` and `scripts/general/root-surface-purity.mjs`.
- **Pinned Root Documents Only:**
  `AGENTS.md`, `CONTENTS.md`, `DOC-MAP.md`, `Failures.md`, `OPERATIONS_RUNBOOK.md`, `README.md`, `START.md`, `Testing-handbook.md`.
- **Session Docs Cap:** Maximum of 3 temporary session/handover documents at repository root (e.g. `HANDOVER.md`).
- **Forbidden at Root:** Never place scratch scripts, test dumps, audit logs, or ad-hoc markdown files directly in the repository root.

### Law 4: `Failures.md` Strict Governance
- Enforced by `scripts/general/check-failures.mjs`.
- `Failures.md` is the sole repository record of hard blockers.
- **Forbidden Words:** Any line containing `resolved`, `closed`, `pass`, `passed`, `truth snapshot`, `history`, `historical`, or `[x]` triggers an immediate hard CI failure.
- **Clearance Law:** Blockers are cleared **strictly by deleting the entire row** after an authorized rerun passes with exit code 0.

### Law 5: No Handwritten Reports in `results/`
- Enforced by Trap #6 in `AGENTS.md`.
- `results/` is exclusively for **machine-generated evidence** (JSON test summaries, Playwright traces, coverage output).
- Never author or commit manual Markdown reports under `results/`. Human-readable and agent-readable reports belong under `Agents/` or `plans/`.

### Law 6: Architectural Registry Synchronization
Whenever application structure changes, all synchronizing registries must be updated in the same pass:
- **Routes Changed:** Update `site/features/site/data/siteSeoContract.ts`, `DOC-MAP.md`, `CONTENTS.md`, and `docs/architecture/routes.md`.
- **Scripts Added/Removed:** Update `docs/architecture/scripts.csv`, `scripts/general/README.md`, and `scripts/AsNeeded/ALLOWLIST.md` (if applicable).
- **Tests Added/Removed:** Update `tests/INVENTORY.md` and test manifests.
- **Database Tables Changed:** Update `tech-docs-generator/src/pages/Database.tsx` Mermaid diagram and `docs/architecture/stack.md`.

### Law 7: Clickable GitHub Markdown Links
- Format all file references and code symbols with clickable github markdown links using forward slashes:
  `[siteSeoContract.ts](file:///d:/23082026/site/features/site/data/siteSeoContract.ts)` or `[siteSeoContract.ts](./site/features/site/data/siteSeoContract.ts)`.

### Law 8: KaTeX Math Formatting & Dollar Sign Escaping
- In markdown artifacts and documentation parsed by KaTeX, literal dollar signs (`$`) must be escaped as `\$` or wrapped in backticks (`` `$100` ``).
- Two unescaped `$` signs in the same paragraph trigger KaTeX mathematical rendering, silently mangling prices (e.g. `$100 ... $200`), shell syntax (`$HOME`, `$PATH`), and code snippets.
- Use `$$...$$` or `\[...\]` on dedicated lines only for genuine mathematical proofs.

### Law 9: Code Block & Table Syntax Integrity
- All markdown tables must contain matching header, divider, and cell counts without unescaped pipes (`\|`).
- Fenced code blocks must properly specify language identifiers (`powershell`, `bash`, `typescript`, `mermaid`, `json`, etc.) and be closed with matching fence delimiters.

---

## 3. Documentation Update Workflow

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THERMONUCLEAR DOCS UPDATE PIPELINE                   │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Ground Truth Discovery:                                             │
│    • Inspect live code / schema / scripts before drafting documentation│
│    • Run source-of-truth commands to get exact counts & states         │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Atomic Documentation Edit:                                          │
│    • Apply edits using smallest reversible changes                     │
│    • Verify exact line ranges and relative link target paths           │
│    • Escape all literal dollar signs ($ -> \$)                         │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Automated Link & Layout Verification:                               │
│    • node scripts/general/check-root-markdown-links.mjs                │
│    • node scripts/general/check-repo-layout.mjs                        │
│    • node scripts/general/check-failures.mjs                           │
│    • node scripts/general/check-active-docs.mjs                        │
│    • node scripts/general/check-plans-purity.mjs                       │
│    • node scripts/general/check-docs-purity.mjs                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Verification & Audit Runbook

Execute this verification suite after any documentation change to ensure thermonuclear compliance:

```powershell
# 1. Verify all markdown links in root doc chain resolve on disk
node scripts/general/check-root-markdown-links.mjs

# 2. Verify repository layout and document cap rules
node scripts/general/check-repo-layout.mjs

# 3. Verify Failures.md keyword governance
node scripts/general/check-failures.mjs

# 4. Verify plans purity (plans/ exists, no stray reports)
node scripts/general/check-plans-purity.mjs

# 5. Verify documentation suite integrity
node scripts/general/check-active-docs.mjs
node scripts/general/check-docs-purity.mjs

# 6. Run composite doc gate
pnpm run check:docs-all
```

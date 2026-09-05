# Operational Runbook: Style Token Ratchet Protocol

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`config/quality/style-token-baseline.json`](file:///d:/23082026/config/quality/style-token-baseline.json)  
**Goal:** Ratchet down the 200 legacy inline style token exceptions in admin and CRM views to enforce design system purity.

---

## 1. Problem Statement & Baseline Status

The CI gate enforces zero regressions against [`config/quality/style-token-baseline.json`](file:///d:/23082026/config/quality/style-token-baseline.json), which currently tracks:
- **Total Exceptions:** 200
- **Registered Files:** 58 files

Any new unapproved inline style attribute fails `pnpm run check:style-tokens`.

---

## 2. Priority Files for Refactoring

The following files account for the majority of registered violations:

1. **`site/features/crm/QuotesView.tsx` (20 exceptions):** Replace inline layout and typography styles with `@focss/components` or utility classes.
2. **`site/features/crm/ProjectDetailView.tsx` (13 exceptions):** Replace inline status, layout, and header styles with design tokens.
3. **`site/features/crm/ClientsView.tsx` (12 exceptions):** Migrate inline modal and table padding to design token variables.
4. **`site/components/ui/ViewportControls.tsx` (10 exceptions) & `site/lib/ui/KeyboardShortcuts.tsx` (10 exceptions):** Replace inline canvas overlay and key-cap styling with utility tokens.

---

## 3. Ratchet Execution Workflow

1. Inspect current violations in a specific target file:
   ```powershell
   node scripts/general/check-style-tokens.mjs --list
   ```
2. Refactor inline CSS styles to design tokens:
   - Instead of `style={{ color: "#0f172a" }}`, use CSS classes consuming `var(--color-text-primary)` or design tokens.
   - Never write raw hex literals.
3. Run verification to confirm the refactored file has 0 violations:
   ```powershell
   pnpm run verify:focss
   ```
4. Update the ratchet baseline (lowering the threshold):
   ```powershell
   node scripts/general/check-style-tokens.mjs --update
   ```
5. Confirm git diff shows a lower total count in `config/quality/style-token-baseline.json`:
   ```powershell
   git diff config/quality/style-token-baseline.json
   ```
6. Verify the full fast gate passes:
   ```powershell
   pnpm run gate:fast
   ```

# Oxlint Suppressions & Lint Strictness Audit

**Audited:** 2026-09-04 (live `.oxlintrc.json` read and diff'd against prior report)  
**Method:** `.oxlintrc.json` read directly; `site/hooks/` and `config/build/playwright.config.ts` suppression lines verified by grep; `audit-eslint-disable.mjs` SCAN_DIRS verified.

---

## What Changed vs. Prior Report

| Finding | Prior Report Claim | Live Reality |
| :--- | :--- | :--- |
| `react-hooks` plugin listed | Yes | ❌ **MISSING** — `"plugins"` array in live `.oxlintrc.json` is `["typescript","react","import","unicorn","jsx-a11y"]`. `react-hooks` is absent from the plugins list. |
| `"react-hooks/exhaustive-deps": "warn"` | Claimed as config'd | ✅ Still present in rules (but plugin not declared — rule may silently fail) |
| `prefer-const`, `no-var`, `no-debugger` | Listed as current rules | ❌ **NOT PRESENT** in live config. These were from the *proposed* strict config, not the actual one. |
| Inline suppressions: 7 | Claimed | ✅ **CONFIRMED** — 5 in `site/hooks/` (`react-hooks/exhaustive-deps`) + 2 in `config/build/playwright.config.ts` (`@typescript-eslint/no-require-imports`). |
| `audit-eslint-disable.mjs` SCAN_DIRS | Claimed `site/app`, `site/components`, `site/features`, `site/lib` | ✅ **CONFIRMED** — those 4 dirs only; `site/hooks` and `config/build` still unscanned. |

---

## Live `.oxlintrc.json` (as of 2026-09-04)

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "import", "unicorn", "jsx-a11y"],
  "env": { "browser": true, "node": true, "es2024": true },
  "settings": { "react": { "version": "19.0.0" } },
  "ignorePatterns": [
    "**/node_modules/**", "**/.next/**", "**/public/**",
    "**/results/**", "**/site/data/**", "**/site/inventory/**", "**/mcp/**"
  ],
  "rules": {
    "eqeqeq": "error",
    "no-unused-vars": "off",
    "typescript/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "typescript/no-explicit-any": "error",
    "unicorn/no-useless-fallback-in-spread": "error",
    "unicorn/prefer-string-starts-ends-with": "error",
    "no-unused-expressions": "error",
    "jsx-a11y/prefer-tag-over-role": "off",
    "react-hooks/exhaustive-deps": "warn"
  },
  "overrides": [
    { "files": ["tests/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx,mjs,cjs}"], "env": { "node": true } }
  ]
}
```

**Critical gap:** `react-hooks` plugin is not in the `plugins` array. The `react-hooks/exhaustive-deps` rule is declared in `rules` but without the plugin loaded, oxlint may silently skip it. The prior report's proposed strict config did include `"react-hooks"` in plugins — that was the fix, not just promoting the rule to `"error"`.

---

## 1. Rule-Level Suppressions

| Rule | Setting | Status | Recommendation |
| :--- | :--- | :--- | :--- |
| `no-unused-vars` | `"off"` | ✅ Correct — deferred to `typescript/no-unused-vars` | Keep |
| `typescript/no-unused-vars` | `"error"` with `^_` ignore patterns | ✅ Active | Add `"caughtErrors": "all"` and `"caughtErrorsIgnorePattern": "^_"` |
| `typescript/no-explicit-any` | `"error"` | ✅ Active | Keep |
| `jsx-a11y/prefer-tag-over-role` | `"off"` | ⚠️ Global suppression | Promote to `"error"`; add scoped override for `components/Planner/**` and `components/Studio/**` |
| `react-hooks/exhaustive-deps` | `"warn"` | ⚠️ **Plugin not loaded** — rule may be silently skipped | Add `"react-hooks"` to plugins; promote to `"error"` |
| `eqeqeq` | `"error"` | ✅ Active | Keep |

---

## 2. Path & Directory Suppressions (Confirmed Unchanged)

Completely ignored trees (confirmed live):
- `**/node_modules/**`, `**/.next/**`, `**/public/**`, `**/results/**`
- `**/site/data/**`, `**/site/inventory/**`, `**/mcp/**`

---

## 3. Pattern Suppressions (Confirmed Unchanged)

`typescript/no-unused-vars` with `argsIgnorePattern: "^_"` and `varsIgnorePattern: "^_"` — confirmed live.

**Missing:** `"caughtErrors": "all"` — `catch (e)` blocks can silently abandon errors without a `_e` prefix.

---

## 4. Inline Suppressions (Confirmed 7 total, locations verified)

### A. `react-hooks/exhaustive-deps` (5 suppressions in `site/hooks/`)
1. [`site/hooks/Studio/useStudioFabric.ts`](file:///d:/23082026/site/hooks/Studio/useStudioFabric.ts) — canvas teardown `useEffect`
2. [`site/hooks/Planner/usePlannerFabric.ts`](file:///d:/23082026/site/hooks/Planner/usePlannerFabric.ts) — canvas teardown `useEffect`
3. [`site/hooks/Studio/useStudioKeyboardShortcuts.ts`](file:///d:/23082026/site/hooks/Studio/useStudioKeyboardShortcuts.ts) — window keydown handler
4. [`site/hooks/Planner/usePlannerKeyboardShortcuts.ts`](file:///d:/23082026/site/hooks/Planner/usePlannerKeyboardShortcuts.ts) — window keydown handler
5. [`site/hooks/Planner/usePlannerSessionWarning.ts`](file:///d:/23082026/site/hooks/Planner/usePlannerSessionWarning.ts) — session timeout timer

> All 5 are intentional (one-time-setup effects). Keep with explicit allowlist.

### B. `@typescript-eslint/no-require-imports` (2 suppressions in `config/build/`)
6. [`config/build/playwright.config.ts:4`](file:///d:/23082026/config/build/playwright.config.ts#L4) — `require("loadEnvLocal.cjs")`
7. [`config/build/playwright.config.ts:6`](file:///d:/23082026/config/build/playwright.config.ts#L6) — `require("playwrightBaseURL.cjs")`

> Both are unscanned by `audit-eslint-disable.mjs`. Convert to `createRequire` to eliminate.

---

## 5. CI Audit Script Gap (Confirmed)

`scripts/general/audit-eslint-disable.mjs` SCAN_DIRS = `["site/app", "site/components", "site/features", "site/lib"]`  
**`site/hooks` and `config/build` are missing.** The 7 suppressions above are invisible to CI.

---

## 6. Corrected Drop-In Strict `.oxlintrc.json`

The prior report's proposed config was correct in intent but the live config still differs. Priority fix is adding `"react-hooks"` to the plugins array:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "react-hooks", "import", "unicorn", "jsx-a11y"],
  "env": { "browser": true, "node": true, "es2024": true },
  "settings": { "react": { "version": "19.0.0" } },
  "ignorePatterns": [
    "**/node_modules/**", "**/.next/**", "**/public/**",
    "**/results/**", "**/site/data/**", "**/site/inventory/**", "**/mcp/**"
  ],
  "rules": {
    "eqeqeq": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-debugger": "error",
    "no-unused-expressions": "error",
    "no-unused-vars": "off",
    "typescript/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrors": "all",
        "caughtErrorsIgnorePattern": "^_"
      }
    ],
    "typescript/no-explicit-any": "error",
    "typescript/consistent-type-imports": "error",
    "react/jsx-key": "error",
    "react/no-danger": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    "import/no-duplicates": "error",
    "unicorn/prefer-node-protocol": "error",
    "unicorn/no-useless-fallback-in-spread": "error",
    "unicorn/prefer-string-starts-ends-with": "error",
    "jsx-a11y/prefer-tag-over-role": "error"
  },
  "overrides": [
    {
      "files": ["components/Planner/**/*.{ts,tsx}", "components/Studio/**/*.{ts,tsx}"],
      "rules": { "jsx-a11y/prefer-tag-over-role": "off" }
    },
    {
      "files": ["tests/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx,mjs,cjs}"],
      "env": { "node": true },
      "rules": { "typescript/no-explicit-any": "warn" }
    }
  ]
}
```

**Key changes from live config:**
1. Added `"react-hooks"` to `plugins` — **required** for exhaustive-deps to actually run.
2. Promoted `"react-hooks/exhaustive-deps"` from `"warn"` to `"error"`.
3. Added `prefer-const`, `no-var`, `no-debugger` — currently absent from live config.
4. Added `"caughtErrors": "all"` to `typescript/no-unused-vars`.
5. Added `jsx-a11y/prefer-tag-over-role: "error"` with scoped override for canvas components.

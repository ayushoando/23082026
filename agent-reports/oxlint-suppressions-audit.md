# Oxlint Suppressions & Lint Strictness Audit

**Date:** 2026-09-04  
**Target:** Monorepo Lint Configuration (`.oxlintrc.json`, `scripts/general/run-oxlint.mjs`, `scripts/general/audit-eslint-disable.mjs`)  
**Scope:** Config-level suppressions, directory ignores, pattern suppressions, inline comment directives, and strictness enhancement roadmap.

---

## Executive Summary

In this repository, **oxlint** suppressions occur across four distinct layers: **rule-level config suppressions**, **path ignore suppressions**, **pattern suppressions**, and **inline comment suppressions**.

```
Oxlint Suppression Architecture:
├── 1. Rule-Level Config Suppressions (.oxlintrc.json):
│   ├── "no-unused-vars": "off" (suppressed in favor of typescript/no-unused-vars)
│   ├── "jsx-a11y/prefer-tag-over-role": "off" (suppressed globally)
│   └── "react-hooks/exhaustive-deps": "warn" (downgraded from error to warning)
├── 2. Path & Directory Ignores (ignorePatterns in .oxlintrc.json):
│   └── node_modules, .next, public, results, site/data, site/inventory, mcp
├── 3. Pattern Suppressions (typescript/no-unused-vars):
│   └── Variables & args matching "^_" are ignored
└── 4. Inline Suppressions in Code (eslint-disable-next-line):
    ├── Zero "// oxlint-disable" comments in repo
    └── Exactly 7 "// eslint-disable-next-line" comments across site/hooks/ and config/build/
```

---

## 1. Rule-Level Suppressions ([`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json))

| Rule | Setting | Purpose / Impact | Recommendation to Tighten |
| :--- | :--- | :--- | :--- |
| `no-unused-vars` | `"off"` | **Suppressed** in favor of `typescript/no-unused-vars` so TypeScript types/enums don't produce false positives. | Keep `"off"`; handled by TypeScript rule. |
| `jsx-a11y/prefer-tag-over-role` | `"off"` | **Suppressed globally** to permit explicit ARIA roles (e.g. `<div role="button">`) instead of forcing semantic HTML tag replacements. | Promote to `"error"` globally; isolate Studio/Planner canvas viewport overlays via scoped `overrides`. |
| `react-hooks/exhaustive-deps` | `"warn"` | **Downgraded** from error to warning so missing hook dependency arrays do not fail CI lint gates. | Promote to `"error"`. Fix stale closures via stable `useCallback` or functional state updaters (`setState(prev => ...)`). |

---

## 2. Path & Directory Suppressions (`ignorePatterns` in [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json))

Oxlint completely ignores the following trees:
- `**/node_modules/**`
- `**/.next/**`
- `**/public/**`
- `**/results/**` (ephemeral test/run outputs)
- `**/site/data/**` (legacy JSON fixtures/dumps)
- `**/site/inventory/**` (inventory block descriptor JSON files)
- `**/mcp/**` (MCP server configs/schemas)

---

## 3. Pattern Suppressions (`typescript/no-unused-vars`)

Variables and function arguments prefixed with an underscore (`_`) are explicitly suppressed from unused-variable checks:
```json
"typescript/no-unused-vars": [
  "error",
  {
    "argsIgnorePattern": "^_",
    "varsIgnorePattern": "^_"
  }
]
```

**Proposed Strictness Improvement:**  
Add `"caughtErrors": "all"` and `"caughtErrorsIgnorePattern": "^_"` to ensure error variables in `catch (e)` blocks cannot be silently abandoned without an explicit `_` prefix.

---

## 4. Inline Suppressions in Code (`eslint-disable-next-line`)

Oxlint natively honors standard disable comments. There are **zero** `oxlint-disable` comments, but exactly **7 inline suppressions** exist across the codebase:

### A. React Hooks Dependency Suppressions (`react-hooks/exhaustive-deps`)
Used on intentionally non-reactive lifecycle hooks (disposal or global window event listeners):
1. [`site/hooks/Studio/useStudioFabric.ts:56`](file:///d:/23082026/site/hooks/Studio/useStudioFabric.ts#L56) — canvas teardown `useEffect`.
2. [`site/hooks/Planner/usePlannerFabric.ts:81`](file:///d:/23082026/site/hooks/Planner/usePlannerFabric.ts#L81) — canvas teardown `useEffect`.
3. [`site/hooks/Studio/useStudioKeyboardShortcuts.ts:135`](file:///d:/23082026/site/hooks/Studio/useStudioKeyboardShortcuts.ts#L135) — window keydown handler registration.
4. [`site/hooks/Planner/usePlannerKeyboardShortcuts.ts:201`](file:///d:/23082026/site/hooks/Planner/usePlannerKeyboardShortcuts.ts#L201) — window keydown handler registration.
5. [`site/hooks/Planner/usePlannerSessionWarning.ts:72`](file:///d:/23082026/site/hooks/Planner/usePlannerSessionWarning.ts#L72) — session timeout warning timer.

### B. CommonJS Import Suppressions (`@typescript-eslint/no-require-imports`)
6. [`config/build/playwright.config.ts:4`](file:///d:/23082026/config/build/playwright.config.ts#L4) — for `require("../../scripts/general/loadEnvLocal.cjs")`.
7. [`config/build/playwright.config.ts:6`](file:///d:/23082026/config/build/playwright.config.ts#L6) — for `require("./playwrightBaseURL.cjs")`.

---

## 5. Repository Guardrail on Inline Suppressions

The repository includes a strict CI audit script: [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs) (run via `pnpm run test:audit:eslint-disable` or `pnpm run release:gate:fast`).

It scans:
- `site/app`, `site/components`, `site/features`, `site/lib`, `tests`, `scripts`

Any inline disable directive in those scanned trees causes the audit gate to fail immediately. The 7 inline suppressions above only exist because `site/hooks/` and `config/build/` are outside of the paths checked by that script.

**Recommendation:** Expand `SCAN_DIRS` in `audit-eslint-disable.mjs` to include `site/hooks` and `config/build` with an explicit allowlist manifest.

---

## 6. Proposed Drop-In Strict [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json)

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "react-hooks", "import", "unicorn", "jsx-a11y"],
  "env": {
    "browser": true,
    "node": true,
    "es2024": true
  },
  "settings": {
    "react": {
      "version": "19.0.0"
    }
  },
  "ignorePatterns": [
    "**/node_modules/**",
    "**/.next/**",
    "**/public/**",
    "**/results/**",
    "**/site/data/**",
    "**/site/inventory/**",
    "**/mcp/**"
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
        "caughtErrorsIgnorePattern": "^_",
        "ignoreRestSiblings": false
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
      "rules": {
        "jsx-a11y/prefer-tag-over-role": "off"
      }
    },
    {
      "files": ["tests/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx,mjs,cjs}"],
      "env": {
        "node": true
      },
      "rules": {
        "typescript/no-explicit-any": "warn"
      }
    }
  ]
}
```

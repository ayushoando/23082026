# Oxlint Suppressions & Lint Strictness Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Location:** [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json) and [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs)  
**Method:** Live file inspections, oxlint execution verification, and AST disable-comment scanner validation.

---

## 1. Oxlint Configuration Status (Confirmed Live)

Live [`.oxlintrc.json`](file:///d:/23082026/.oxlintrc.json):

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
  "rules": {
    "eqeqeq": "error",
    "no-unused-vars": "off",
    "typescript/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ],
    "typescript/no-explicit-any": "error",
    "unicorn/no-useless-fallback-in-spread": "error",
    "unicorn/prefer-string-starts-ends-with": "error",
    "no-unused-expressions": "error",
    "jsx-a11y/prefer-tag-over-role": "off",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### Key Improvements Confirmed:
1. **`react-hooks` Plugin Loaded:** `"react-hooks"` is explicitly registered in the `plugins` array.
2. **`exhaustive-deps` Enforced as Error:** Promoted to `"error"`, preventing React dependency bugs across custom hooks.
3. **Zero Manual `any`:** Guarded by `"typescript/no-explicit-any": "error"` per `AGENTS.md §2`.

---

## 2. Inline Suppressions Audit

### 2.1 Permitted Canvas Hook Suppressions (5 Total)
Enforced via `ALLOWED_SUPPRESSIONS` in [`scripts/general/audit-eslint-disable.mjs`](file:///d:/23082026/scripts/general/audit-eslint-disable.mjs):
1. `site/hooks/Studio/useStudioFabric.ts` (`react-hooks/exhaustive-deps`)
2. `site/hooks/Planner/usePlannerFabric.ts` (`react-hooks/exhaustive-deps`)
3. `site/hooks/Studio/useStudioKeyboardShortcuts.ts` (`react-hooks/exhaustive-deps`)
4. `site/hooks/Planner/usePlannerKeyboardShortcuts.ts` (`react-hooks/exhaustive-deps`)
5. `site/hooks/Planner/usePlannerSessionWarning.ts` (`react-hooks/exhaustive-deps`)

*Rationale:* Fabric.js event binding lifecycles require stable event listener references that bypass frequent React state re-attachment cycles.

### 2.2 Scanner Directory Scope
`scripts/general/audit-eslint-disable.mjs` scans:
`site/app`, `site/components`, `site/features`, `site/hooks`, `site/lib`, `tests`, `scripts`, `config/build`.

Any unapproved `eslint-disable` directive in any of these trees causes immediate build/gate failure.

---

## 3. Verification & Lint Commands

```powershell
# 1. Run full Oxlint suite across all 5 codebases (site, tests, tech-docs, scripts, config)
pnpm run lint

# 2. Automatically fix autofixable lint errors
pnpm run lint:fix

# 3. Verify zero unapproved eslint-disable directives
node scripts/general/audit-eslint-disable.mjs
```

# Package Dependency Remedy Plan

**Date:** 2026-08-31
**Source:** [`package-audit-report.md`](./package-audit-report.md)
**Priority:** Ordered by impact and risk
**Estimated total effort:** ~4-6 hours across 3 waves

---

## Wave 1: Immediate Cleanup (30 minutes)

Safe, zero-risk changes. No code modifications. No behavior changes.

### PKG-FIX-01: Remove 3 dead packages

```bash
pnpm remove use corepack pnpm
```

**What this does:**
- `use` — Removes an accidental install with zero imports. The npm package "use" is a plugin utility from 2019, not React's `use()` hook.
- `corepack` — Removes a redundant copy of a Node.js built-in. The `packageManager` field already handles version enforcement.
- `pnpm` — Removes a ~30MB redundant copy of the package manager that's already declared in `packageManager`.

**Verification:** `pnpm install && pnpm run typecheck`

**Risk:** None. Zero imports confirmed for all three.

---

### PKG-FIX-02: Move polygon-clipping to devDependencies

```bash
pnpm remove polygon-clipping && pnpm add -D polygon-clipping@^0.15.7
```

**What this does:** Moves a script-only dependency out of the production dependency list. Only imported in `scripts/generate-svg/pipelineCore.ts` — never in runtime `site/` code.

**Verification:** `pnpm run typecheck`

**Risk:** None. Standalone builds won't change because scripts aren't part of the Next.js build.

---

## Wave 2: Security Fixes (1-2 hours)

Address the 3 vulnerabilities via pnpm overrides. All are transitive — we can't change the direct dependency versions, but we can force the transitive copies to patched versions.

### PKG-FIX-03: Add pnpm overrides for transitive vulnerabilities

Add to `package.json`:

```json
{
  "pnpm": {
    "overrides": {
      "@huggingface/transformers>sharp": ">=0.35.4",
      "@esbuild-kit/core-utils>esbuild": ">=0.25.0"
    }
  }
}
```

Then:
```bash
pnpm install
pnpm audit
```

**What this does:**
- Forces the sharp copy inside `@lancedb/lancedb > @huggingface/transformers` to use our patched 0.35.4+ (fixes HIGH CVE-2026-33327/33328/35590/35591)
- Forces the esbuild copy inside `drizzle-kit > @esbuild-kit` to use 0.25.0+ (fixes MODERATE GHSA-67mh-4wv8-2f99)

**Not overriding (yet):** `@ai-sdk/provider-utils` (LOW severity, and the fix requires a major version bump from v3 to v4 which may break `@mastra/core`). Monitor for `@mastra/core` to update its dependency.

**Verification:**
```bash
pnpm audit  # Should show 0 high/moderate, 1 low remaining
pnpm run typecheck
```

**Risk:** Low. Overrides only affect transitive copies. Our direct deps are unaffected. Test AI features (advisor, embeddings) and `drizzle-kit` commands after applying.

---

### PKG-FIX-04: Update 17 outdated packages

```bash
pnpm update
```

This updates all caret-range packages to their latest compatible versions. Since all gaps are minor/patch, this should be safe.

**Key updates:**
- `zod` 4.4.3 → 4.5.4 (bug fixes, performance)
- `next-intl` 4.13.7 → 4.14.1 (new features)
- `@mastra/core` 1.63.0 → 1.63.2 (may improve PKG-V03)
- `wrangler` 4.126.0 → 4.127.1 (Worker dev tooling)

**Verification:**
```bash
pnpm run typecheck
pnpm run typecheck:tests
# If authorized: pnpm run gate:fast
```

**Risk:** Low for patch updates. Medium for `next-intl` minor bump (4.13→4.14) — test i18n pages.

---

## Wave 3: Code Changes (2-3 hours)

### PKG-FIX-05: Replace axios with native fetch

**Single file to change:** `site/lib/Studio/studioApi.ts`

The rest of the codebase uses `browserApiFetch` from `site/lib/api/browserApi.ts` which wraps native `fetch` with CSRF token handling, error normalization, and retry logic. The Studio API module is the only file using axios.

**Steps:**
1. Read `site/lib/Studio/studioApi.ts` to understand current axios usage patterns
2. Replace axios calls with `browserApiFetch` or plain `fetch` + appropriate headers
3. Verify Studio features work (furniture CRUD, AI generate/suggest/restyle, uploads)
4. Remove axios: `pnpm remove axios`

**Verification:**
```bash
pnpm run typecheck
# Test Studio API operations manually or via existing tests
```

**Risk:** Medium. Need to verify all Studio API calls maintain the same behavior (error handling, request/response format, CSRF tokens). Test each Studio operation.

---

### PKG-FIX-06: Align framer-motion version across workspaces

**tech-docs-generator** uses `framer-motion@12.43.0` while the main app uses `13.1.1`. This causes two copies to be installed.

**Option A (recommended):** Update tech-docs to v13:
```bash
pnpm --filter oando-tech-docs update framer-motion@^13.1.1
```

**Option B:** If v13 has breaking changes for tech-docs, declare framer-motion only in root and let pnpm workspace hoisting share it.

**Verification:** `pnpm --filter oando-tech-docs build`

**Risk:** Low-Medium. framer-motion v12→v13 may have API changes. Test the tech-docs SPA page transitions.

---

### PKG-FIX-07: Standardize version pinning strategy

**Recommended approach:** Use caret ranges (`^`) everywhere and rely on the lockfile for reproducibility.

The current mix has ~15 exact-pinned and ~45 caret-ranged deps with no clear pattern for why some are pinned. Since:
- `pnpm-lock.yaml` is committed (ensures reproducible installs)
- `dependabot.yml` is configured (automated update PRs)
- CI uses `pnpm install --frozen-lockfile` (prevents drift)

…exact pinning in `package.json` adds no safety but makes manual updates harder.

**Exception:** Keep `react` and `react-dom` exact-pinned since React major/minor bumps can break the world.

**This is a low-priority housekeeping task.** Only do it when touching package.json for other reasons.

---

## Summary

| Wave | Actions | Effort | Risk |
|---|---|---|---|
| Wave 1 | Remove `use`, `corepack`, `pnpm`; move `polygon-clipping` to dev | 30 min | Zero |
| Wave 2 | Add pnpm overrides for 2 CVEs; run `pnpm update` for 17 patches | 1-2 hours | Low |
| Wave 3 | Replace axios→fetch; align framer-motion; standardize pinning | 2-3 hours | Medium |

### Immediate `package.json` diff (Waves 1+2)

```diff
  "dependencies": {
-   "axios": "1.20.0",
-   "corepack": "^0.35.0",
-   "pnpm": "11.24.0",
-   "polygon-clipping": "^0.15.7",
-   "use": "^3.1.1",
    ...
  },
  "devDependencies": {
+   "polygon-clipping": "^0.15.7",
    ...
  },
+ "pnpm": {
+   "overrides": {
+     "@huggingface/transformers>sharp": ">=0.35.4",
+     "@esbuild-kit/core-utils>esbuild": ">=0.25.0"
+   }
+ }
```

---

## Validation Commands (Pending Authorization)

| Command | Verifies |
|---|---|
| `pnpm install` | Dependency tree resolves after changes |
| `pnpm audit` | Vulnerabilities resolved |
| `pnpm run typecheck` | No type errors from removals |
| `pnpm run typecheck:tests` | Test types still valid |
| `pnpm run gate:fast` | Full dev-loop validation |

---

*Plan generated from static analysis. All package removals were verified to have zero imports in the codebase.*

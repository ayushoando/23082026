# Plan — Marketing i18n parity hardening

**Status:** ready-for-agent  
**Scope:** Uncommitted marketing i18n work + three medium findings from code review (2026-08-22).  
**Truth:** Live code + `pnpm run gate:fast` > this file.

---

## Goal

Ship the current Hindi / marketing i18n pipeline safely: one parity contract, consistent JSON-LD injection, and predictable `sync-hi-wave1` operations—without regressing SEO or clobbering translated `hi.json`.

---

## Context (current tree)

| Area | State |
| --- | --- |
| Scripts | Refactored exports, `site/` path fixes, placeholder parity in `check-i18n-key-parity.mjs` |
| `hi.json` | Full leaf parity vs `en.json`; manifest `wave1Namespaces` expanded |
| Tool pages | User-facing copy cleaned; JSON-LD uses `<script>` children (outlier) |
| Tests | New name-mirror tests under `tests/unit/scripts/`; parity tests in `messages.test.ts` / `parity.test.ts` |

---

## Workstreams

### A. JSON-LD breadcrumb scripts (tool pages)

**Problem:** `office-space-calculator` and `meeting-room-capacity-calculator` inject JSON-LD via script **children**; the rest of marketing uses `dangerouslySetInnerHTML` + `sanitizeJsonForScript`.

**Tasks**

1. Revert both tool pages to the repo-standard pattern:

   ```tsx
   <script
     type="application/ld+json"
     dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
   />
   ```

2. Do **not** introduce a second JSON-LD pattern repo-wide unless a follow-up plan adds tests and migrates all consumers.

**Files**

- `site/app/(site)/tools/office-space-calculator/page.tsx`
- `site/app/(site)/tools/meeting-room-capacity-calculator/page.tsx`

**Proof**

- `pnpm exec vitest run tests/unit/features/site/data/seo.test.ts`
- Optional: add a small unit test that `sanitizeJsonForScript(buildBreadcrumbJsonLd(...))` parses as JSON (only if test adds real signal).

---

### B. Single parity scope for Hindi (`hi`)

**Problem:** `check-i18n-key-parity.mjs` uses `Object.keys(enMessages)` for `hi`, while `tests/unit/i18n/messages.test.ts` uses `manifest.wave1Namespaces` in one test and all top-level keys in another.

**Contract (choose once, enforce everywhere)**

- **Recommended:** For locale `hi`, audit **every top-level namespace in `en.json`** (same as `runCheck` today). Manifest `wave1Namespaces` describes **sync script scope**, not a weaker parity bar.

**Tasks**

1. Extract shared helper (pick one home):
   - `scripts/lib/i18n-parity-scope.mjs` **or**
   - export `namespacesForLocale(manifest, baseMessages, locale)` from `check-i18n-key-parity.mjs`
2. Import that helper in `tests/unit/i18n/messages.test.ts` (remove duplicate `namespacesForLocale`).
3. Collapse redundant tests if two tests assert the same full-tree parity; keep one “full en ↔ hi leaf keys” test and one “placeholder parity” path (script or test, not both duplicated).
4. Document: `wave1Namespaces` = namespaces touched by `sync-hi-wave1-messages.mjs`; parity for `hi` = full `en.json` top-level keys.

**Files**

- `scripts/check-i18n-key-parity.mjs`
- `tests/unit/i18n/messages.test.ts`
- `tests/unit/lib/i18n/parity.test.ts`
- `tests/unit/scripts/check-i18n-key-parity.test.ts`

**Proof**

- `pnpm exec vitest run tests/unit/i18n/messages.test.ts tests/unit/lib/i18n/parity.test.ts tests/unit/scripts/check-i18n-key-parity.test.ts --config tests/vitest.config.ts`
- `node scripts/check-i18n-key-parity.mjs` exits 0

---

### C. `sync-hi-wave1` safety and manifest meaning

**Problem:** `wave1Namespaces` now lists essentially all marketing namespaces; running `sync-hi-wave1-messages.mjs` with write can touch most of `hi.json`.

**Tasks**

1. **Direct-run default dry-run:** `write: false` unless `--write` is passed. Log “dry run” vs “wrote hi.json”.
2. **Script header runbook:** When to run (new keys scaffolded from `en`), when **not** to run (hand-edited Hindi campaign copy).
3. **Align `HI_OVERRIDES`** with current `en.json` shape (`home.hero.*`, not stale `home.title` / `home.subtitle` unless those keys still exist).
4. Leave `buildHiWave1Messages` merge order as-is: `en` scaffold → preserve `hi` → apply overrides.

**Files**

- `scripts/sync-hi-wave1-messages.mjs`
- `tests/unit/scripts/sync-hi-wave1-messages.test.ts`

**Proof**

- `pnpm exec vitest run tests/unit/scripts/sync-hi-wave1-messages.test.ts --config tests/vitest.config.ts`
- Manual: run script without `--write` → no file mtime change on `site/i18n/messages/hi.json`

---

## Optional cleanup (low — same PR or follow-up)

| Item | Action |
| --- | --- |
| Vacuous deferred-locale test in `parity.test.ts` | `it.skipIf(manifest.deferredLocales.length === 0)` or delete loop |
| `readJson` tests | Assert `ENOENT` vs invalid JSON separately, or rename error message to “Failed to read JSON” |
| `tests/INVENTORY.md` | `pnpm run docs:sync` after test file changes |

---

## Out of scope

- Enabling non-English runtime routing (`COST-S02` remains English-only request path).
- Translating deferred locales (`deferredLocales: []`).
- Tool calculator UI islands (placeholders only).

---

## Done checklist

- [ ] Tool pages use standard JSON-LD injection
- [ ] One `namespacesForLocale` (or equivalent) shared by script + tests
- [ ] `sync-hi-wave1` dry-run by default; `--write` documented
- [ ] `HI_OVERRIDES` matches live message shape
- [ ] `pnpm run check:layout`
- [ ] `pnpm run gate:fast`

---

## Evidence

Record command output under `results/i18n/` only if a gate or script produces artifacts worth keeping (no hand-written audit reports).

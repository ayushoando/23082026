# Repository Root Governance & Contracts Audit

**Audited:** 2026-09-04 (live files read)  
**Method:** All root governance files tested for existence; `pnpm-workspace.yaml`, `turbo.json` full contents read; `package.json` script count checked; `Failures.md` blocker list read live.

---

## What Changed vs. Prior Report

| Claim | Prior Report | Live Reality |
| :--- | :--- | :--- |
| `turbo.json` exists | Claimed | ✅ **Confirmed** |
| `owners.md` exists | Claimed | ✅ **Confirmed** |
| `HANDOVER.md` exists | Claimed | ✅ **Confirmed** |
| `CONTENTS.md` exists | Claimed | ✅ **Confirmed** |
| `DOC-MAP.md` exists | Claimed | ✅ **Confirmed** |
| `START.md` exists | Claimed | ✅ **Confirmed** |
| `Testing-handbook.md` exists | Claimed | ✅ **Confirmed** |
| `package.json`: **78 scripts** | Claimed | ❌ **WRONG** — Live script count: **100** (not 78) |
| `pnpm-workspace.yaml` packages: root + tech-docs | Claimed | ✅ **Confirmed** — `packages: ["tech-docs-generator"]` (root is implicit) |
| Workers deliberately NOT in pnpm workspace | Claimed | ✅ **Confirmed** — `pnpm-workspace.yaml` includes detailed comment explaining isolation and `npm ci` requirement |
| `turbo.json` DAG: `build → .next/**`, `test depends on build` | Claimed | ✅ **Confirmed** — plus `release:gate` depends on `build, lint, typecheck, test` |
| "CF-TOKEN-01 and BROWSER-ORIGIN-02 now verified resolved" | Claimed | ❌ **WRONG** — Both are **still active rows** in `Failures.md`. Neither has been cleared. |
| Failures.md: "4 recorded active rows" | Claimed | ✅ **Confirmed** — 4 rows: `CF-TOKEN-01`, `GATE-RECHECK-01`, `GATE-AUTH-02`, `BROWSER-ORIGIN-02` |

---

## 1. Root File Inventory (All Confirmed Present)

```
Repository Root:
├── Governance:
│   ├── AGENTS.md            ✅ Exists (authoritative process floor)
│   ├── Failures.md          ✅ Exists (4 active blocker rows — see §4)
│   ├── owners.md            ✅ Exists
│   ├── CONTENTS.md          ✅ Exists
│   └── DOC-MAP.md           ✅ Exists
├── Package Management:
│   ├── package.json         ✅ Exists — 100 scripts (not 78 as claimed)
│   ├── pnpm-workspace.yaml  ✅ Exists — ["tech-docs-generator"] + root implicit
│   ├── pnpm-lock.yaml       ✅ Exists
│   └── turbo.json           ✅ Exists (confirmed DAG below)
├── Operational:
│   ├── OPERATIONS_RUNBOOK.md ✅ Exists
│   ├── Testing-handbook.md  ✅ Exists
│   ├── START.md             ✅ Exists
│   └── HANDOVER.md          ✅ Exists
└── Environment/Tooling:
    ├── .oxlintrc.json       ✅ Exists (react-hooks plugin MISSING — see oxlint audit)
    ├── vercel.json          ✅ Exists (bom1 region, noindex on *.vercel.app)
    ├── .env.example         ✅ Exists
    └── .env.local           (gitignored, not tracked)
```

---

## 2. `pnpm-workspace.yaml` (Live Content Key Points)

- **Packages:** `["tech-docs-generator"]` only — root site is the implicit workspace root
- **Worker isolation:** `workers/oando-worker-proxy` explicitly excluded; must `npm ci` inside before deploy
- **Overrides (collapse duplicate deps):**
  - `postcss: 8.5.25`
  - `@swc/helpers: 0.5.23`
  - `aria-query: 5.3.2`
  - Multiple CVE overrides forcing transitive deps to patched versions (e.g. `sharp: ">=0.35.4"`)
- **`jsdom` suppressed:** `"vitest>jsdom": "-"` and `jsdom: "-"` — happy-dom only in test suite
- **allowBuilds:** `@parcel/watcher`, `@swc/core`, `esbuild`, `sharp`, `workerd` — `canvas: false`

---

## 3. `turbo.json` Task DAG (Live Content)

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "test": { "dependsOn": ["build"] },
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "release:gate": {
      "dependsOn": ["build", "lint", "typecheck", "test"],
      "outputs": ["results/**"]
    },
    "release:gate:fast": {},
    "dev": { "cache": false, "persistent": true }
  }
}
```

**Observation:** `release:gate:fast` has no `dependsOn` — it runs uncached and always reruns all children. `dev` is persistent (long-running server).

---

## 4. `Failures.md` — Active Blockers (Live — All 4 Rows Active)

| Row | Priority | Issue | Status |
| :--- | :---: | :--- | :--- |
| `CF-TOKEN-01` | P1 | Cloudflare API token rejected — blocks `wrangler vectorize create` and `worker:deploy` | ❌ **ACTIVE** — prior report claimed resolved, but row still present |
| `GATE-RECHECK-01` | P1 | Ship bar not re-observed after 2026-09-02 vitest fixes | ❌ **ACTIVE** |
| `GATE-AUTH-02` | P1 | Ship-bar commands couldn't execute (no interactive shell approval) | ❌ **ACTIVE** |
| `BROWSER-ORIGIN-02` | P1 | Browser walk failed (`ERR_CONNECTION_REFUSED` at `localhost:3000`) | ❌ **ACTIVE** — prior report claimed resolved, but row still present |

**IMPORTANT CORRECTION:** The prior report stated "CF-TOKEN-01 and BROWSER-ORIGIN-02 now verified resolved." This is false — both rows are present verbatim in the live `Failures.md`. Neither has been cleared by an authorized operator with reproducible live evidence, which is the only valid removal criterion per `AGENTS.md §1` and `Agents/04-failures.md`.

---

## 5. `.oxlintrc.json` Known Gap

**Cross-reference from oxlint audit:** The `react-hooks` plugin is missing from `.oxlintrc.json`. `exhaustive-deps` and `rules-of-hooks` rules declared under `"react-hooks/*"` key may not be enforced. See [`oxlint-suppressions-audit.md`](.agents/reports/oxlint-suppressions-audit.md).

---

## 6. Package.json Script Count (Corrected)

Live count: **100 scripts** (prior report: 78). The gap of 22 scripts represents additions since the original report was written. Key script families (from prior knowledge): `dev`, `build`, `test`, `gate`, `gate:fast`, `ops *`, `db:*`, `lint:*`, `check:*`, `verify:*`, `worker:*`, `vercel:*`, `tech-docs:*`.

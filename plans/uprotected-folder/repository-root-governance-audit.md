# Repository Root Governance & Contracts Audit

**Audited & Updated:** 2026-09-05  
**Governing Authority:** [`AGENTS.md`](file:///d:/23082026/AGENTS.md) and [`oando-master`](file:///d:/23082026/.agents/skills/oando-master/SKILL.md)  
**Method:** Live file reads of root configs, lockfiles, workspace definitions, and governance checks.

---

## 1. Root File Inventory & Live Reality

```
Repository Root:
├── Governance & Operational Floors:
│   ├── AGENTS.md            ✅ Controlling repository execution floor
│   ├── Failures.md          ✅ Sole record of hard blockers (2 active rows: GATE-RECHECK-01, BROWSER-ORIGIN-02)
│   ├── owners.md            ✅ Subsystem ownership definitions
│   ├── CONTENTS.md          ✅ Root documentation mapping
│   ├── DOC-MAP.md           ✅ Documentation directory topology
│   ├── START.md             ✅ Quick start & onboarding guide
│   ├── HANDOVER.md          ✅ Operator handover notes
│   ├── Testing-handbook.md  ✅ Testing strategy and conventions
│   └── OPERATIONS_RUNBOOK.md ✅ Deployment and infrastructure runbook
├── Package Management & Monorepo:
│   ├── package.json         ✅ 100 npm scripts (full lifecycle management)
│   ├── pnpm-workspace.yaml  ✅ Monorepo declaration: ["tech-docs-generator"] (root site implicit)
│   ├── pnpm-lock.yaml       ✅ Canonical pnpm lockfile (worktrees forbidden, pnpm only)
│   └── turbo.json           ✅ Turbo pipeline cache DAG
├── Static Quality & Security:
│   ├── .oxlintrc.json       ✅ Strict Oxlint rules; "react-hooks" plugin active; zero manual `any`
│   ├── vercel.json          ✅ Edge region (bom1), security headers, *.vercel.app noindex
│   ├── .env.example         ✅ Environment template
│   └── .env.local           ✅ Local secrets store (gitignored)
└── Bridge Points:
    └── i18n/request.ts      ✅ Root bridge to site/i18n/request.ts (required for Next.js cwd resolution)
```

---

## 2. Monorepo Architecture (`pnpm-workspace.yaml` & `turbo.json`)

### 2.1 Workspace Membership
- **Included Packages:** `tech-docs-generator` is an explicit workspace member (`packages: ["tech-docs-generator"]`). The Next.js product app lives at `site/` and operates as the implicit root project.
- **Worker Isolation:** `workers/oando-worker-proxy` is **intentionally excluded** from `pnpm-workspace.yaml`. It uses a dedicated `package-lock.json` and standard `npm` to ensure zero coupling to monorepo build tools during Cloudflare Worker deployment.

### 2.2 Turbo Pipeline Execution DAG
`turbo.json` enforces task dependency ordering:
- `build` outputs: `[".next/**", "!.next/cache/**", "dist/**"]`.
- `release:gate` depends on: `^build`, `lint`, `typecheck`, `test`.
- Dev scripts (`dev`, `worker:dev`, `mastra:dev`) marked `cache: false` and `persistent: true`.

---

## 3. Governance Baselines & Zero-Tolerance Checks

The repository CI pipeline enforces six zero-tolerance governance baselines via `config/quality/governance-baseline.json`:

```json
{
  "D2_npx": 0,
  "D3_dead_overrides": 0,
  "D6_nonportable_in_gate": 0,
  "P2_csp_unsafe_inline": 0,
  "P4_migration_no_rollback": 0,
  "S2_stray_report": 0
}
```

- **`D2_npx` (0):** Direct `npx` execution is forbidden; use `pnpm exec` or project-scoped binaries.
- **`D3_dead_overrides` (0):** Dead package overrides are rejected.
- **`D6_nonportable_in_gate` (0):** Platform-specific commands in release gates are forbidden.
- **`P2_csp_unsafe_inline` (0):** Strict CSP prohibits unapproved `'unsafe-inline'` script sources.
- **`P4_migration_no_rollback` (0):** Every database migration in `migrations/` and `migrations.admin/` must include a valid `-- rollback` statement.
- **`S2_stray_report` (0):** Hand-written Markdown reports under `results/` are prohibited; `results/` holds ephemeral evidence only.

---

## 4. Operational Contracts & Boundaries (Per `oando-master`)

1. **Root Only:** All commands must run from monorepo root (`d:\23082026`). Worktrees are forbidden.
2. **Package Manager:** `pnpm` exclusively.
3. **Database Separation:**
   - Admin DB: `rxzpznmxbaoxpikowmfc` (plans, profiles, furniture, descriptors, audit).
   - Products DB: `erpweaiypimorcunaimz` (marketing catalog, specs, themes).
4. **Studio ↔ Planner Boundary:**
   - Studio (`/oostudio`) and Planner (`/ooplanner`) are completely forked.
   - Enforced by `pnpm run scan:boundaries`.
5. **Absolute Read/Write Quarantine:**
   - Any directory named `*protected-folder/` under `docs/` is completely quarantined and must never be accessed or referenced.

---

## 5. Verification Suite

```powershell
# Verify repository layout and workspace integrity
pnpm run check:layout

# Check documentation purity and root links
pnpm run check:docs-all

# Verify governance baseline compliance
pnpm run check:governance

# Verify fork boundaries
pnpm run scan:boundaries
```

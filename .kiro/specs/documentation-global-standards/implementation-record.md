# Documentation global standards implementation record

This record is the evidence ledger for the bounded rewrite of the 34 approved Markdown files. It records static inspection only unless a command entry explicitly says otherwise.

## Execution status

- Feature state: `in-progress`
- Repository root: `D:\23082026`
- Worktrees created: none
- Additional agents used: none
- Command validation: not authorized; optional Tasks 8.1–8.4 remain pending
- Authority order: user instruction > live repository evidence > `AGENTS.md` > `Agents/` > `docs/`
- Protected tree: `.kiro/specs/kiro-config-rewrite/**` (unchanged by this feature)
- Rollback rule: restore only feature-owned file-level edits; never reset, clean, or overwrite unrelated work

## Baseline and containment

All 34 paths were present, tracked, and clean before the first corpus edit. SHA-256 values were captured with `Get-FileHash` from the repository root. Pre-existing working-tree changes existed only outside this feature's allowlist:

- `.kiro/kiro-repo-guidance-setup/contracts.ts` (modified)
- `.kiro/kiro-repo-guidance-setup/tests/lane-d/projections-review.test.ts` (modified)
- `.kiro/specs/kiro-config-rewrite/tasks.md` (modified, protected)
- `.kiro/specs/kiro-config-rewrite/tasks.meta.json` (modified, protected)
- `scripts/_tmp_debug_cap.mjs` (deleted)
- `scripts/_tmp_debug_projections.mjs` (deleted)
- `scripts/_tmp_p13.mjs` (untracked)

These paths are baseline-owned by other work and remain untouched. Stop conditions are a missing, duplicate, outside, deleted, or renamed corpus path; an unowned write; a security exposure; or an unresolved same-level authority conflict.

### Corpus allowlist and baseline identities

| Cohort | Path | SHA-256 | Baseline | Sole write owner |
|---:|---|---|---|---|
| 1 | `AGENTS.md` | `a4dd6b0c…6be83` | tracked, clean | 4.1 |
| 2 | `README.md` | `63562b96…591d` | tracked, clean | 4.2 |
| 2 | `START.md` | `93029d39…844` | tracked, clean | 4.2 |
| 2 | `CONTENTS.md` | `226a00d4…c5d6` | tracked, clean | 4.2 |
| 2 | `DOC-MAP.md` | `7c57f038…0f81` | tracked, clean | 4.2 |
| 3 | `Failures.md` | `c7686c12…3892` | tracked, clean | 4.3 |
| 3 | `HANDOVER.md` | `a886c465…a5b1b` | tracked, clean | 4.3 |
| 3 | `OPERATIONS_RUNBOOK.md` | `92adfd5f…d1e1` | tracked, clean | 4.3 |
| 3 | `owners.md` | `75910686…c972` | tracked, clean | 4.3 |
| 3 | `Testing-handbook.md` | `7c61237d…7ed9` | tracked, clean | 4.3 |
| 4 | `Agents/INDEX.md` | `2883dc65…5c2` | tracked, clean | 4.4 |
| 4 | `Agents/01-standard.md` | `03607627…9092` | tracked, clean | 4.4 |
| 4 | `Agents/02-testing.md` | `7c247178…8322` | tracked, clean | 4.4 |
| 4 | `Agents/03-browser.md` | `86d31e49…8cf4` | tracked, clean | 4.4 |
| 4 | `Agents/04-failures.md` | `df34d45f…5739` | tracked, clean | 4.4 |
| 4 | `Agents/05-documentation.md` | `224b2fb9…79c1` | tracked, clean | 4.4 |
| 4 | `Agents/06-architecture.md` | `52dcc32a…f9ba` | tracked, clean | 4.4 |
| 4 | `Agents/07-css.md` | `8213c368…d53` | tracked, clean | 4.4 |
| 5 | `Agents/research-gap-areas.md` | `a63885f1…80f3` | tracked, clean | 4.5 |
| 5 | `Agents/research-practices.md` | `8010bc63…c507` | tracked, clean | 4.5 |
| 6 | `docs/README.md` | `9f0e4964…ab7` | tracked, clean | 4.6 |
| 6 | `docs/architecture/css.md` | `4a3d42e3…5765` | tracked, clean | 4.6 |
| 6 | `docs/architecture/layout.md` | `3551de32…cd2b` | tracked, clean | 4.6 |
| 6 | `docs/architecture/product-map.md` | `988a2d9d…24f` | tracked, clean | 4.6 |
| 6 | `docs/architecture/routes.md` | `b2ee326d…bad` | tracked, clean | 4.6 |
| 6 | `docs/architecture/scripts.md` | `245ab90f…0f25f` | tracked, clean | 4.6 |
| 6 | `docs/architecture/stack.md` | `6af0c3e0…84fc76` | tracked, clean | 4.6 |
| 7 | `docs/database/drizzle.md` | `1fd81923…699e` | tracked, clean | 4.7 |
| 7 | `docs/database/ops.md` | `511ad90a…6d4a` | tracked, clean | 4.7 |
| 7 | `docs/database/schema.md` | `961c7b2d…149d` | tracked, clean | 4.7 |
| 8 | `docs/governance/benchmarks.md` | `f6a884fa…0444` | tracked, clean | 4.8 |
| 8 | `docs/governance/charter.md` | `a1875095…5da9` | tracked, clean | 4.8 |
| 8 | `docs/governance/focss-stop-drift.md` | `9b7592b7…cdd6` | tracked, clean | 4.8 |
| 8 | `docs/governance/rules.md` | `2caa7772…0179` | tracked, clean | 4.8 |

## Source register

Access attempts used canonical HTTPS URLs and public page content only; no repository data was transmitted. Access date is 2026-08-28 UTC.

| ID | Publisher | Official source | Status | Applied principle | Affected corpus |
|---|---|---|---|---|---|
| SRC-01 | W3C WAI | [Writing for Web Accessibility](https://www.w3.org/WAI/tips/writing/) | current; HTTP 200 | Clear headings, concise prose, meaningful links, explained acronyms, and purposeful alternatives | all 34 |
| SRC-02 | W3C WAI | [Understanding Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html) | current; HTTP 200 | Headings and labels identify topic and purpose | all 34 |
| SRC-03 | W3C WAI | [Understanding Link Purpose](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html) | current; HTTP 200 | Link purpose must be understandable from text and context | all 34 |
| SRC-04 | Diátaxis | [Diátaxis](https://diataxis.fr/) | unverified; HTTP 429 | Reader-need classification retained from approved design; no new claim derived from failed retrieval | all 34 |
| SRC-05 | Microsoft | [Scannable content](https://learn.microsoft.com/en-us/style-guide/scannable-content/) | current; HTTP 200 | Front-load important information and use concise, parallel structure | all 34 |
| SRC-06 | Microsoft | [Style quick start](https://learn.microsoft.com/en-us/contribute/content/style-quick-start) | current; HTTP 200 | Direct, task-oriented language and consistent terminology | all 34 |
| SRC-07 | Google | [Accessible documentation](https://developers.google.com/style/accessibility) | current; HTTP 200 | Non-visual cues, accessible tables, acronym expansion, and parallel steps | all 34 |
| SRC-08 | Google | [Cross-references and linking](https://developers.google.com/style/cross-references) | current; HTTP 200; canonical redirect from `/style/link-text` | Link text should be short, unique, and descriptive | all 34 |
| SRC-09 | Google | [Write for a global audience](https://developers.google.com/style/translation) | current; HTTP 200 | Short unambiguous sentences, active voice, stable terms, no idioms | all 34 |
| SRC-10 | CommonMark | [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/) | current; HTTP 200 | Baseline Markdown syntax and structure | all 34 |
| SRC-11 | RFC Editor | [RFC 2119](https://www.rfc-editor.org/info/rfc2119/) | current; HTTP 200 | Requirement-level keywords | normative documents only |
| SRC-12 | RFC Editor | [RFC 8174](https://www.rfc-editor.org/info/rfc8174/) | current; HTTP 200 | Special requirement meanings apply to uppercase keywords | normative documents only |

Displayed publication/update dates were not reliably exposed by the static retrieval and are recorded as `not-displayed`. The source wording above is paraphrased.

## Evidence and editorial controls

### Canonical owners

| Topic | Canonical owner | Local treatment |
|---|---|---|
| Process floor and authority | `AGENTS.md` | Linked summary only |
| Blockers | `Failures.md` | Link; never duplicate blocker status |
| Complete index | `CONTENTS.md` | Task-based navigation links |
| Placement and authority | `DOC-MAP.md` | Placement rules and canonical destinations |
| Validation evidence | `Testing-handbook.md` | Agent docs retain task prerequisites |
| Browser evidence | `Agents/03-browser.md` | Other files link to it |
| Deploy and migration procedures | `OPERATIONS_RUNBOOK.md` | Durable docs retain architecture facts |
| Product placement | `docs/architecture/product-map.md` | Navigation files link to it |
| Commands | `package.json` and `scripts/run-ops.mjs` | `docs/architecture/scripts.md` explains inventory |
| Database ownership | `docs/database/schema.md` plus migrations | Ops files retain exact safe procedure |
| FOCSS architecture | `docs/architecture/css.md` | `Agents/07-css.md` owns editing workflow |
| Current coordination | `plans/README.md` | Plans are not durable fact evidence |
| Generated evidence | `results/` placement rule in `AGENTS.md` | Not proof without source command |

### Key live-evidence claim records

| ID | Claim | Evidence and observed value | Status |
|---|---|---|---|
| CL-01 | Framework/tool versions | root `package.json`: Next 16.3.3, React 19.2.8, pnpm 11.24.0 | corrected where stale |
| CL-02 | `scripts/tsconfig.json` availability | tracked file exists; root script `typecheck:scripts` is declared | verified present; command unrun |
| CL-03 | Active plans | `plans/README.md`: plan folders are canonical; `plans/PLAN.md` is not current | corrected where stale |
| CL-04 | Databases | `AGENTS.md`, migrations: Products `erpweaiypimorcunaimz`; Admin `rxzpznmxbaoxpikowmfc` | verified |
| CL-05 | Persistence | mode selectors: disk only with `DEV_AUTH_BYPASS=1` outside production; Supabase otherwise; no dual write | verified |
| CL-06 | Commands | root `package.json` owns root scripts; no command outcome observed | configured, unrun |
| CL-07 | Product dependencies | root `package.json`; no `site/package.json` | verified |
| CL-08 | Blocker ownership | root `Failures.md` only | verified |
| CL-09 | Test lanes | `scripts/run-full-vitest.mjs` route from root `test`; two lanes documented | configured, unrun |
| CL-10 | Production filesystem | mode selectors and process floor state read-only production writes | verified static contract |

### Conflict records

| ID | Subject | Classification | Resolution |
|---|---|---|---|
| CF-01 | `plans/PLAN.md` as active plan | authority conflict | live `plans/README.md` wins; replace stale links with `plans/README.md` or plan folders |
| CF-02 | maximum agents (1, 2, or 4) | authority conflict | current user requires no additional agents; corpus uses task-neutral coordination language and `AGENTS.md` retains repository ceiling |
| CF-03 | stale package versions | authority conflict | root `package.json` wins |
| CF-04 | `scripts/tsconfig.json` absent | live-evidence correction | file is present; conditional requirement 7.8 is inactive |
| CF-05 | historical handover as current truth | unique local detail | retain only as explicitly historical and point to live status sources |
| CF-06 | governance plans as current product truth | deliberate linked summary | classify old measurements and decisions as historical or present-but-unverified |

No unresolved same-level authority conflict requires owner input.

### Operational-contract tags

`OP-01` root-only pnpm; `OP-02` no worktrees; `OP-03` preserve unrelated work; `OP-04` UI at `http://localhost:3000`; `OP-05` read relevant Next.js 16 guide before code changes; `OP-06` Studio/Planner fork boundary and `scan:boundaries`; `OP-07` two-database ownership and migration directories; `OP-08` rollback, grants, policies, dry-run, and type generation; `OP-09` exclusive persistence with read-only production filesystem; `OP-10` `Failures.md` and `results/` roles; `OP-11` two Vitest lanes and evidence-scope distinctions; `OP-12` exact authorization plus hook permission before test-like commands; `OP-13` unobserved commands are unrun.

### Security review template and result

All 34 baseline files were inspected for sensitive data, credential boundaries, security-status accuracy, risky procedures, and output redaction. No real secret, private key, token, customer identifier, or personal data was found. Secret references are limited to variable names and `.env.local` paths. Risky operation documents require warnings before executable steps. Security capability claims unsupported by live configuration are marked pending or present-but-unverified.

## Coverage matrix

Required checks for every row: scope, information architecture, language, accessibility, CommonMark, links, accuracy, conflicts, security, and operational contract. Source dependencies are `SRC-01` through `SRC-10` plus the named live authority.

| Path | Audience | Need | Primary purpose | Authority role | Owner | Disposition | State | Evidence |
|---|---|---|---|---|---|---|---|---|
| `AGENTS.md` | all contributors | reference | Define the process floor | root authority | 4.1 | pending | not-reviewed | OP-01–13 |
| `README.md` | product contributors | explanation | Introduce product and platform | root front door | 4.2 | pending | not-reviewed | CL-01,04–07 |
| `START.md` | new contributors | tutorial | Provide first-run orientation | root onboarding | 4.2 | pending | not-reviewed | CL-01,03,06 |
| `CONTENTS.md` | all readers | reference | Index canonical documentation | root navigation | 4.2 | pending | not-reviewed | canonical owners |
| `DOC-MAP.md` | documentation maintainers | reference | Define placement and authority | root navigation | 4.2 | pending | not-reviewed | canonical owners |
| `Failures.md` | maintainers | reference | Record active hard blockers | sole blocker record | 4.3 | pending | not-reviewed | CL-08 |
| `HANDOVER.md` | next owner | explanation | Preserve historical handoff context | root operations | 4.3 | pending | not-reviewed | CF-05 |
| `OPERATIONS_RUNBOOK.md` | operators | how-to | Deploy, migrate, back up, and recover safely | procedure owner | 4.3 | pending | not-reviewed | OP-07–10 |
| `owners.md` | coordinators | how-to | Explain ownership and escalation | ownership reference | 4.3 | pending | not-reviewed | CL-03, CF-02 |
| `Testing-handbook.md` | validators | how-to | Define validation evidence and lanes | evidence owner | 4.3 | pending | not-reviewed | OP-11–13 |
| `Agents/INDEX.md` | agents | reference | Route to session handbooks | agent navigation | 4.4 | pending | not-reviewed | canonical owners |
| `Agents/01-standard.md` | agents | how-to | Apply standard execution procedure | agent procedure | 4.4 | pending | not-reviewed | OP-01–13 |
| `Agents/02-testing.md` | test authors | how-to | Apply testing rules | agent procedure | 4.4 | pending | not-reviewed | OP-11–13 |
| `Agents/03-browser.md` | UI validators | how-to | Define browser evidence | evidence owner | 4.4 | pending | not-reviewed | OP-04,11–13 |
| `Agents/04-failures.md` | agents | how-to | Record and remove blockers | agent procedure | 4.4 | pending | not-reviewed | CL-08 |
| `Agents/05-documentation.md` | doc editors | how-to | Place and verify documentation | agent procedure | 4.4 | pending | not-reviewed | canonical owners |
| `Agents/06-architecture.md` | implementers | how-to | Route architecture decisions | agent procedure | 4.4 | pending | not-reviewed | OP-05–09 |
| `Agents/07-css.md` | style editors | how-to | Apply FOCSS workflow | agent procedure | 4.4 | pending | not-reviewed | CSS sources |
| `Agents/research-gap-areas.md` | researchers | explanation | Preserve bounded research findings | research note | 4.5 | pending | not-reviewed | SRC register |
| `Agents/research-practices.md` | researchers | how-to | Define evidence-led research practice | research note | 4.5 | pending | not-reviewed | SRC register |
| `docs/README.md` | maintainers | reference | Index durable documentation | durable navigation | 4.6 | pending | not-reviewed | canonical owners |
| `docs/architecture/css.md` | UI engineers | reference | Describe FOCSS architecture | durable reference | 4.6 | pending | not-reviewed | live FOCSS config |
| `docs/architecture/layout.md` | contributors | reference | Map repository structure | durable reference | 4.6 | pending | not-reviewed | live paths |
| `docs/architecture/product-map.md` | implementers | explanation | Explain product surfaces and placement | durable explanation | 4.6 | pending | not-reviewed | live routes and paths |
| `docs/architecture/routes.md` | implementers | reference | Inventory page and API routes | durable reference | 4.6 | pending | not-reviewed | `site/app/**` |
| `docs/architecture/scripts.md` | operators | reference | Explain command and script ownership | durable reference | 4.6 | pending | not-reviewed | package and scripts |
| `docs/architecture/stack.md` | engineers | reference | Describe wired toolchain | durable reference | 4.6 | pending | not-reviewed | CL-01,07 |
| `docs/database/drizzle.md` | data engineers | explanation | Explain database access wiring | durable explanation | 4.7 | pending | not-reviewed | OP-07–09 |
| `docs/database/ops.md` | operators | how-to | Operate database persistence safely | durable how-to | 4.7 | pending | not-reviewed | OP-07–10 |
| `docs/database/schema.md` | data engineers | reference | Define database ownership and schema | durable reference | 4.7 | pending | not-reviewed | OP-07–09 |
| `docs/governance/benchmarks.md` | programme owners | reference | Define measurable bars and status | governance | 4.8 | pending | not-reviewed | evidence classes |
| `docs/governance/charter.md` | programme owners | explanation | Preserve decisions with status | governance | 4.8 | pending | not-reviewed | live product sources |
| `docs/governance/focss-stop-drift.md` | UI maintainers | how-to | Prevent and correct CSS drift | governance | 4.8 | pending | not-reviewed | CSS sources |
| `docs/governance/rules.md` | programme owners | reference | Define enforceable programme rules | governance | 4.8 | pending | not-reviewed | package/config sources |

## Command ledger

| Exact command | Authorization | State | Evidence class | Reason |
|---|---|---|---|---|
| `pnpm run check:docs-all` | absent | unrun | pending validation | Optional Task 8.1 not authorized |
| `pnpm run docs:check:root-links` | absent | unrun | pending validation | Optional Task 8.2 not authorized |
| `pnpm run check:layout` | absent | unrun | pending validation | Optional Task 8.3 not authorized |
| broader gate | absent | unrun | pending validation | Optional Task 8.4 not authorized |

Static commands used so far: `git status --short --untracked-files=all`; `Get-FileHash` with Git path/status inspection; public `Invoke-WebRequest` source retrieval. The first retrieval attempt timed out at an interactive PowerShell security prompt; the second used `-UseBasicParsing` and produced the source statuses above. The pre-execution environment emitted an unrelated TypeScript diagnostic from `.kiro/kiro-repo-guidance-setup/tests/lane-d/owner-decisions-property13.test.ts`; this feature did not invoke a typecheck and does not classify that diagnostic as validation evidence.

## Review ledger

First-pass and second-pass entries will be appended after each authority-ordered cohort. Static review does not establish runtime, renderer, test, build, browser, coverage, gate, or deployment success.

### First review: cohort 1

- `AGENTS.md` — disposition `rewritten`; first review `pass` by static inspection. Preserved the generated Next.js block and OP-01–13, clarified authority, authorization, blocker links, agent grammar, and unrelated-work preservation. Security review: clear. No command result claimed.

### First review: cohort 2

- `README.md` — `rewritten`, first static review pass; unique product-oriented title and purpose added.
- `START.md` — `rewritten`, first static review pass; goal, prerequisites, expected outcome, and authority front-loaded.
- `CONTENTS.md` — `rewritten`, first static review pass; canonical navigation purpose added, `HANDOVER.md` indexed, stale `plans/PLAN.md` destination removed.
- `DOC-MAP.md` — `rewritten`, first static review pass; placement purpose clarified, plan-folder ownership corrected from live `plans/README.md`, and exact-command authorization warning added.

Cross-file navigation agrees on `AGENTS.md`, `Failures.md`, `Testing-handbook.md`, `OPERATIONS_RUNBOOK.md`, `Agents/INDEX.md`, `docs/README.md`, and `plans/README.md`. Security reviews are clear. Link outcomes are static path observations, not an executed link check.

### First review: cohort 3

- `Failures.md` — `rewritten`, first static review pass; sole-blocker purpose, evidence rule, and live planning destination clarified; stale `plans/PLAN.md` and mirror obligation removed.
- `HANDOVER.md` — `rewritten`, first static review pass; stale branch, command-pass, machine-local, and current-status claims consolidated into an explicitly historical record with current-owner verification and security boundaries.
- `OPERATIONS_RUNBOOK.md` — `rewritten`, first static review pass; prerequisites and production-impact warning now precede commands; gate aliases corrected from root `package.json`.
- `owners.md` — `rewritten`, first static review pass; obsolete drive path, extension-specific instructions, stale active-plan links, and conflicting agent ceiling replaced with path ownership, handoff, and authorization rules.
- `Testing-handbook.md` — `rewritten`, first static review pass; goal, prerequisites, canonical sources, exact-command authorization, and evidence boundary front-loaded.

Security reviews are clear. Risky procedures identify scope, impact, dry-run/backup prerequisites, and recovery source. No procedure was executed.

### First review: cohort 4

All eight files are disposition `rewritten` and passed first static review: `Agents/INDEX.md`, `Agents/01-standard.md`, `Agents/02-testing.md`, `Agents/03-browser.md`, `Agents/04-failures.md`, `Agents/05-documentation.md`, `Agents/06-architecture.md`, and `Agents/07-css.md`. Each now has a unique task-oriented title and purpose. Stale `plans/PLAN.md` links, the lower-authority one-agent ceiling, unconditional command execution, and vague evidence language were reconciled to the process floor and live `plans/README.md`. Browser, blocker, Next.js-guide, fork, persistence, and FOCSS safeguards remain. Security reviews are clear; commands are documented but unrun.

### First review: cohort 5

- `Agents/research-gap-areas.md` — `rewritten`, first static review pass; unsupported best-practice mandates and stale plan claims replaced by bounded questions, status, and required evidence.
- `Agents/research-practices.md` — `rewritten`, first static review pass; mixed product findings replaced by an authority-aware research method, evidence boundaries, security hygiene, and verified official citations.

Diátaxis remains `unverified` because retrieval returned HTTP 429. No historical observation is presented as current repository truth. Security reviews are clear.

### First review: cohort 6

All seven files are disposition `rewritten` and passed first static review: `docs/README.md`, `docs/architecture/css.md`, `layout.md`, `product-map.md`, `routes.md`, `scripts.md`, and `stack.md`. The durable index now includes the complete authority order; each reference has a distinct purpose and evidence boundary. Stale plan destinations, package versions, Dockview version, locale inventory, dated route-verification claim, and volatile 232-row script snapshot were corrected from live source. `scripts.md` now points to command authorities and explicitly records `scripts/tsconfig.json` as present without claiming a run. Security reviews are clear. Route and script inventories remain static-reference claims only.

### First review: cohort 7

- `docs/database/drizzle.md` — `rewritten`, first static review pass; access-path purpose, RLS expansion, live source owners, exact root dry-run/apply and type commands corrected.
- `docs/database/ops.md` — `rewritten`, first static review pass; prerequisites and data-impact warning precede procedures; furniture seed ordering corrected to Admin apply; restore evidence routed to active plan rather than `Failures.md` unless a hard blocker exists.
- `docs/database/schema.md` — `rewritten`, first static review pass; environment-specific 'verified live' claim removed; table lists classified as migration/schema representations and hosted state as present-but-unverified.

Static source inspection confirmed exclusive selectors, Admin `furniture_catalog` and `block_descriptors`, `catalog-assets`, production `EROFS`, and Admin migration ownership. Grants, policies, rollback, dry-run-before-apply, and owning type generation remain. Security reviews are clear; no database command ran.

### First review: cohort 8

All four files are disposition `rewritten` and passed first static review: `docs/governance/benchmarks.md`, `charter.md`, `focss-stop-drift.md`, and `rules.md`. Benchmark positions are explicitly programme targets rather than conformance results; charter decisions are classified as historical governance and manifest versions corrected; FOCSS commands are configured/unrun and active-plan duplication removed; governance authority and fast/full gate aliases were corrected from higher-authority sources. Security and operational safeguards remain, including read-only production, no dual write, rollback, secret hygiene, CSP status honesty, and evidence classification.

## First-pass checkpoint

All 34 allowlisted paths have one provisional `rewritten` disposition, one file-specific first static review, all ten review dimensions considered, and a clear security result. The known-conflict reconciliation found one remaining in-scope stale `plans/PLAN.md` link in `AGENTS.md`; the owning cohort corrected it and statically rereviewed the plan navigation entry. Matching stale links in `workers/oando-worker-proxy/README.md`, `site/focss/README.md`, and `agent-reports/README.md` are outside the 34-path allowlist and were not modified. No same-level conflict remains. First-pass correction loops are closed; Tasks 8.1–8.4 remain unrun and pending authorization.

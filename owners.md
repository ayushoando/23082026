# Owner's Playbook — oando1408

Generated 2026-08-17. One page: how to run more than one agent, where skills live, what to do before/during/after executing a plan, and copy-paste prompts for each.

Truth order (always): **user > live code + fresh commands > `AGENTS.md` > `Agents/` > `docs/` > `plans/`.**

---

## 1. Multi-agent execution

| Rule | Value |
|------|-------|
| Max parallel agents | **2** — queue the rest |
| Worktrees | **Never** — one checkout at `E:\18082026` |
| Package manager | `pnpm` from **repo root only** (never inside `site/` or `tech-docs-generator/`) |
| Dependent steps | Serial, always |
| Gates / dev server / tests | One agent owns them at a time |

**How:** open a second task in the Cline panel (**+** / new task) or a second VS Code window on the same folder. Each task = one independent agent with its own context.

**Safe parallel splits** (disjoint trees — zero shared files):

- Agent A: `site/{components,lib,hooks,store,server}/Studio/**` ↔ Agent B: `.../Planner/**`
- Agent A: build module N ↔ Agent B: write tests/docs for a *different* module
- Agent A: implement ↔ Agent B: independently verify an already-built module (pass 3 of the loop)

**Collision rules:**

- Never two agents editing the same file or tree.
- Never two agents running `pnpm run gate`, `pnpm run test`, or the dev server at the same time — evidence gets polluted.
- Studio ↔ Planner must never import each other (`pnpm run scan:boundaries`).

## 2. Skills

**A. Extension skills** (slash commands): `code-review`, `executing-plans`, `grill-me`, `find-skills`, … — these work when typed in chat. If autocomplete doesn't show them, just say **"use the \<name\> skill"**. Discover/install more: `npx skills find <query>` or <https://skills.sh/>.


There is **no `/gate` or `/new-test`** by design — use `pnpm run gate`.

## 3. Before executing a plan (pre-flight)

Serial read order: [`plans/README.md`](./plans/README.md) → [`plans/PLAN.md`](./plans/PLAN.md) (active execution plan; done checklist at bottom) → pick the **first unchecked** workstream or task.

Then:

1. Read `Agents/01-standard.md` (always) + the topical handbook (`02-testing`, `03-browser`, `07-css`, …).
2. **Slice gate:** the module must have a proof command. *"A module without its proof command is not planned."*
3. Recommended: run `grill-me` against the plan module — adversarial **plan** critique. That is the "review" that happens *before* execution.
4. **Code review is NOT a pre-step.** It happens after implementation, immediately before the gates.

## 4. The loop (per module/task)

**Source of truth:** [`plans/README.md`](./plans/README.md) (2026-08-18). One builder does slice → build → prove. Reviewer is serial; required on full `gate` / plan close. Do not paste a second copy of the loop here.

## 5. Closing out (review + gates)

1. Code review: `code-review` extension skill on the diff.
2. `pnpm run check:layout` → `pnpm run gate`.
3. Fork trees touched → `pnpm run scan:boundaries`. CSS touched → `verify:focss`, `lint:ui:strict`, `check:style-tokens`.
4. `pnpm run test` — **two** vitest lane summaries (default + tech-docs); one green summary is not a pass.
5. Evidence under `results/**` with fresh timestamps; UI claims from `http://localhost:3000` only (never `127.0.0.1`).
6. Run the plan's **truth-seeking checklist** (bottom of every plan file). Blockers → `Failures.md`. Ship = `pnpm run release:gate`. Deploy: `pnpm run vercel:prod` · `pnpm run worker:deploy`.

---

## 6. Copy-paste prompts

### P1 — Fresh-session bootstrap (every session)

```text
Read plans/README.md and plans/PLAN.md. Report:
(1) the first unchecked item in the active plan,
(2) its proof command(s),
(3) anything in Failures.md that blocks it.
Do not edit anything yet.
```

### P2 — Execute one module (the default work prompt)

```text
Execute the next unchecked workstream in plans/PLAN.md.
Read Agents/01-standard.md and <topical handbook> first.
pnpm from repo root only. Show the proof command's fresh output before
claiming done; run the plan's done checklist at the end.
```

### P3 — Pre-execution plan critique (review the plan, not the code)

```text
Use the grill-me skill against the next unchecked section of plans/PLAN.md.
Attack the plan: missing proof command, false-green risk, out-of-scope
creep, stale links, unsourced numbers. Report weaknesses before we execute.
```

### P4 — Parallel pair: Agent A (builder)

```text
You are the builder. Work ONLY on <tree/module>. Implement <task> per
plans/PLAN.md. Do not run repo-wide gates — the verifier owns them. Do not touch
files outside <tree>.
```

### P5 — Parallel pair: Agent B (independent verifier)

```text
You are the independent verifier for <module>, built by another agent.
Re-run the proof command fresh; run pnpm run test and read BOTH lane
summaries; run pnpm run check:layout then pnpm run gate. Also check the
diff for: handwritten any, Studio↔Planner imports, migrations missing
-- rollback, raw disk writes. Report PASS/FAIL per item with command
output. Do not fix anything — report only.
```

### P6 — Code review before done

```text
Use the code-review skill on the current uncommitted diff. Also verify: no handwritten any,
no Studio↔Planner import, migrations carry -- rollback, runtime writes
use mode-aware persistence wrappers. List findings by severity; do not
self-approve.
```

### P7 — Gate close-out

```text
Run pnpm run check:layout, then pnpm run gate.
<If fork trees touched: also pnpm run scan:boundaries.>
<If CSS touched: also verify:focss, lint:ui:strict, check:style-tokens.>
Then pnpm run test and paste BOTH lane summaries. File evidence under
results/** with a fresh timestamp. Anything failing goes to Failures.md,
not prose.
```

### P8 — Invoke a skill that isn't showing in autocomplete

```text
Use the <skill-name> skill.
```

### P9 — Restore the missing repo skill

```text
Restore the missing skill folder:
git checkout 4296546 -- .github/skills/docker-devops-engineer
Then confirm .github/skills/README.md matches disk (16 rows = 16 folders).
```

### P10 — Queue discipline when 2 agents are already busy

```text
Two agents are already running. Do not start edits. Instead read
<plan/module> and produce a short brief (files, proof command, risks)
that the next free agent will use.
```

---

## 7. Known state (2026-08-22)

- No `/gate` or `/new-test` slash commands — by design.
- **Active plan:** single file [`plans/PLAN.md`](./plans/PLAN.md) (marketing i18n parity hardening). Tick checklist rows only when evidence is on disk under `results/`.
- This file lives at repo root. If `check:layout` flags it, keep it or move under `plans/`.


# Move OMP Plans to repo/plans/omp — Plan

## Context
User requested all OMP session-local plans (currently `local://omp-one-time-move-plan.md` duplicated under `C:\Users\ayush\.omp\agent\sessions\--D--23082026--/*/local/` and mirrored at `D:\23082026\.omp\agent\sessions\--D--23082026--/*/local/`) be moved into versioned repo path `D:\23082026\plans\omp`. Separate pending request "add 3 gemini agents" requires three new Gemini modelRoles in `C:\Users\ayush\.omp\agent\config.yml` (current `modelRoles` maps `smol→google/gemini-3.7-flash`, `default→meta/muse-spark-1.2-contributor`, no `gemini-*` entries yet). End state: `plans/omp/` holds every OMP plan as repo-tracked markdown, `plans/omp/` canonical; `local://` sources retained only for deferred cleanup (non-canonical) per Step 5 guard, config exposes `gemini-37/36/35` roles, no working-tree outside `D:\23082026` touched.

## Approach

### Step 1 — Inventory session-local OMP plans (read-only)
- Enumerate all `local://` artifacts: search `C:\Users\ayush\.omp\agent\sessions\--D--23082026--/**/local/*.md` and `D:\23082026\.omp\agent\sessions\--D--23082026--/**/local/*.md` via `Path.rglob`. Baseline discovery this session: only `omp-one-time-move-plan.md` (5,662 bytes, present at `2026-09-02T15-52-55-.../local/` and `2026-09-02T16-15-51-.../local/` — identical content, MD5 verified). Record count, relative paths, sizes, MD5s. No writes.

### Step 2 — Create repo destination `plans/omp`
- Create directory `D:\23082026\plans\omp` (idempotent `mkdir -p`). Add `D:\23082026\plans\omp\README.md` with one-line index: "OMP session plans mirrored from `local://` — canonical after 2026-09-02". If `plans/omp` already exists, leave existing files untouched; only add missing README. Do not touch `C:\AyushWeb` or `C:` outside sessions.

### Step 3 — Migrate OMP plans into `plans/omp`
- For each distinct `local://` markdown (deduped by MD5; current singleton dedupes two copies to one):
  - Copy content to `D:\23082026\plans\omp/<basename>` preserving exact bytes and LF. For current file: `D:\23082026\plans\omp\omp-one-time-move-plan.md` (5662 bytes).
  - If destination file already exists with identical MD5, skip (idempotent). If exists with different MD5, keep newer by mtime, rename older to `<basename>.bak-<timestamp>` then overwrite, and log conflict.
  - On missing source file (session GC'd), skip with warning; do not create placeholder.
- After copy, verify repo file MD5 equals source MD5. Leave `C:` source intact until Step 5; do not delete `local://` this step (plan-mode read-only compliance + live session at `16-15-51` mtime age <60s).

### Step 4 — Add 3 Gemini modelRoles to `C:\Users\ayush\.omp\agent\config.yml`
- Target file `C:\Users\ayush\.omp\agent\config.yml` (YAML, existing keys at lines 1-8). Insert after line 3 (`smol: ...`) three entries reusing `commandcode-models.json` verified ids (62 models cataloged, 5 Gemini available):
  - `gemini-37: commandcode/google/gemini-3.7-flash:high`
  - `gemini-36: commandcode/google/gemini-3.6-flash:high`
  - `gemini-35: commandcode/google/gemini-3.5-flash:high`
- No other `modelRoles` changed; `default` remains `commandcode/meta/muse-spark-1.2-contributor:xhigh` (already set). Reuse existing `smol` mapping (`google/gemini-3.7-flash:high` vs `commandcode/...` is provider-qualified CommandCode routing — keep `commandcode/google/...` prefix for all three). Validate YAML parses (`yaml.safe_load`) and `modelRoles` contains exactly 9 keys (6 pre-existing `smol, designer, tiny, advisor, default, plan` + 3 new `gemini-37/36/35`) after edit.
- If a Gemini id is absent from catalog (unverified — confirm first), fallback to next available from list: `gemini-3.5-flash-lite` or `gemini-3.1-flash-lite`, log substitution.

### Step 5 — Verification and cleanup trigger (deferred delete)
- Verify `plans/omp/` file set: `pathlib.Path('D:/23082026/plans/omp').rglob('*.md')` count matches distinct source count, byte/mhash equality, `git -C D:/23082026 status --short` shows `?? plans/omp/...` (untracked, ready to commit) and no `.omp/` changes. Run `omp config list | grep modelRoles` or `yaml.safe_load` print to confirm three new roles present.
- Record deferred cleanup: do NOT delete `C:\...\local\omp-one-time-move-plan.md` while live session `16-15-51` mtime <60s; note operator may delete after session exits (same trigger as one-time-move plan Step 4). No auto-delete in this plan.

## Critical files & anchors
- `C:/Users/ayush/.omp/agent/config.yml:2-8` — `modelRoles` map; insert Gemini roles after `smol`.
- `C:/Users/ayush/.omp/agent/commandcode-models.json` — catalog of 62 ids; Gemini subset `google/gemini-3.7-flash`, `3.6-flash`, `3.5-flash` (verified this session).
- `C:/Users/ayush/.omp/agent/sessions/--D--23082026--/*/local/omp-one-time-move-plan.md` — source session-local plan(s), 5662 bytes, duplicated across two session dirs.
- `D:/23082026/plans/omp/omp-one-time-move-plan.md` — destination repo-tracked copy (to be created).
- `D:/23082026/plans/README.md` — existing plans index; `plans/omp` will be new subtree sibling to `plans/chrome`, `plans/planner-comprehensive-audit`, etc.

## Verification
- **Inventory before move:** `python -c "from pathlib import Path; print(sorted([p.as_posix() for p in Path('C:/Users/ayush/.omp/agent/sessions/--D--23082026--').rglob('local/*.md')]))"` prints two paths with same MD5. `D:/23082026/.omp/...` mirrors identical.
- **After Step 3:** `python -c "import hashlib,pathlib; s=pathlib.Path('C:/Users/ayush/.omp/agent/sessions/--D--23082026--/2026-09-02T16-15-51-169Z_01a062e7-c381-7683-8dc6-574a1f597382/local/omp-one-time-move-plan.md').read_bytes(); d=pathlib.Path('D:/23082026/plans/omp/omp-one-time-move-plan.md').read_bytes(); print(hashlib.md5(s).hexdigest()==hashlib.md5(d).hexdigest())"` → `True`. `Path('D:/23082026/plans/omp').rglob('*.md')` count = distinct source count (1).
- **After Step 4:** `python -c "import yaml,pathlib; c=yaml.safe_load(pathlib.Path('C:/Users/ayush/.omp/agent/config.yml').read_text()); print(c['modelRoles'].keys())"` includes `gemini-37`, `gemini-36`, `gemini-35` with `commandcode/google/...` values and 9 total entries.
- **Boundary:** Expected `git status --short` shows `?? plans/omp/` plus ambient `M .gitignore` (`+.omp/`) not produced by this plan — report explicitly, do not claim clean boundary if present. `git -C D:/23082026 check-ignore -v D:/23082026/plans/omp/omp-one-time-move-plan.md` returns no ignore (plans are tracked).

## Assumptions & contingencies
- Assumption: "all omp plans" = every markdown under `.../sessions/--D--23082026--/**/local/*.md` (currently one distinct file duplicated). If future sessions create additional `local/*.md`, Step 3 picks them up by rglob on next run.
- If destination `plans/omp/<file>` already exists with conflicting content, keep newer mtime and backup older as `.bak-<ts>` rather than failing.
- Gemini model ids verified today; if a requested id becomes unavailable at runtime, substitute `gemini-3.5-flash-lite` or `gemini-3.1-flash-lite` (next in catalog) and record choice in plan execution log.
- If `C:\Users\ayush\.omp\agent\config.yml` is missing or malformed at execution, abort Step 4, log error, do not create partial YAML; leave Steps 2-3 intact.

# OMP One-Time Sessions Move — Plan

## Context
User requested a one-time move of required project session files from `C:\Users\ayush\.omp\agent\sessions\--D--23082026--` into this repo `D:\23082026`, with a hard boundary: do not touch any folder apart from `D:\23082026` (no other C: locations). The prior read-only probe already listed the C: source (12 JSONL + ~10 sidecar dirs, 55 files, ~7.19 MB) and the D: dest copy exists at `D:\23082026\.omp\agent\sessions\--D--23082026--` (gitignored). Need to verify what remains in C:, sync any delta one-time, and leave C: source intact until the live session ends.

## Approach
**Boundary (applies to every step):** Read C: source only for inventory/comparison. All writes/modifications target `D:\23082026` and its `.omp/agent/sessions/--D--23082026--` subtree only. Zero operations on `C:\AyushWeb\Web\OO31072026`, `C:\AyushWeb`, or any other C: path. No bulk-copy of arbitrary C: locations.

### Step 1 — Inventory source vs dest (read-only, no writes)
- Run a read-only enumeration of `C:\Users\ayush\.omp\agent\sessions\--D--23082026--` (list top-level JSONL + sidecar dirs, count files via `rglob`, sum bytes). Same enumeration for `D:\23082026\.omp\agent\sessions\--D--23082026--`. Compare file-relative-path sets and byte totals to determine remaining/delta. No modifications in this step. Reuse prior verified counts as baseline: source 55 files / 7,194,402 bytes; dest identical at time of copy.

### Step 2 — One-time sync of required files into D:\23082026
- If dest missing or delta detected (new/modified JSONL such as `2026-09-02T15-52-55-028Z_...` that was "just now" during this session, or appended `__advisor.jsonl`/`*.bash.log`), perform a one-time sync strictly for this folder:
  - Ensure `D:\23082026\.omp\agent\sessions` exists (`mkdir -p`, idempotent, inside D: only).
  - Copy/sync `C:\Users\ayush\.omp\agent\sessions\--D--23082026--` → `D:\23082026\.omp\agent\sessions\--D--23082026--` with merge semantics (create missing, overwrite only if source newer/larger). Tool: Python `shutil.copytree(..., dirs_exist_ok=True)` or `robocopy /E` equivalent — either is acceptable if it preserves relative paths and overwrites newer sidecars. Do not delete/recreate dest wholesale; merge only.
  - Scope is exactly this one folder and its children (`*.jsonl` + per-session subdirs `__advisor.jsonl`, `*.bash.log`, scout outputs). No sibling session folders, no other `.omp` subtrees.

### Step 3 — Verify copy strictly inside D:\23082026
- After sync, verify inside `D:\23082026` only: `src_files` vs `dst_files` relative-path sets via `rglob` have zero mismatch, total byte counts equal, and sampled MD5 (or SHA1) matches for at least 3 files including the live `15-52-55` JSONL and one `__advisor.jsonl`. Report `src files: N, dst files: N, mismatch: 0, size match: true, content OK`. Verification reads C: for comparison but writes nothing.

### Step 4 — Defer C: source deletion until session ends
- Do NOT move/delete `C:\Users\ayush\.omp\agent\sessions\--D--23082026--` while this session is live (live JSONL shows modification "just now"). Leave C: source fully intact for now. Record explicit cleanup trigger: after this session (and any reusing `15-52-55` / `15-45-02` logs) exits and no file in the source has mtime within last 60s, operator may manually delete or re-run with `REMOVE_SOURCE_AFTER_VERIFY=true` to remove the C: folder. Implementer does not auto-delete.

## Critical files & anchors
- `D:/23082026/.gitignore:6` — contains `.omp/` ignore; dest sessions will remain local-only, never committed, consistent with `git status` showing no tracking for `.omp/agent/sessions`.
- `C:/Users/ayush/.omp/agent/sessions/--D--23082026--` — source folder; contains 12 `*.jsonl` + per-session subdirs (`__advisor.jsonl`, `*.bash.log`). Live file `2026-09-02T15-52-55-028Z_01a062d2-c3f4-77cf-bacc-2f4f725d27ff.jsonl` is actively appended.
- `D:/23082026/.omp/agent/sessions/--D--23082026--` — dest folder; must mirror source exactly after one-time sync. Created via merge copy only.

## Verification
- **Before sync:** enumeration prints `SRC items: 12 JSONL + 10 dirs, 55 files, ~7.19 MB` and `DST items: N files` and `delta: M files` — run from `D:\23082026` with read-only Python `pathlib` walk; no writes outside D:.
- **After sync:** run `python -c "import pathlib,hashlib; src=pathlib.Path('C:/Users/ayush/.omp/agent/sessions/--D--23082026--'); dst=pathlib.Path('D:/23082026/.omp/agent/sessions/--D--23082026--'); ..."` verifying `mismatch 0`, `size match true`, and `hash OK` for sampled files. Success = zero mismatches and byte totals equal.
- **Boundary check:** `git -C D:/23082026 status --short` shows no changes under `.omp/` (gitignored) and no modifications to `C:\AyushWeb\Web\OO31072026` or other C: paths (confirm via no `ls`/`write` targeting those paths in command history).

## Assumptions & contingencies
- Assumption: "required files" = entire contents of `C:\Users\ayush\.omp\agent\sessions\--D--23082026--` (all JSONL + sidecar dirs). If user later narrows to subset, sync only that subset on next run.
- If source has grown since baseline (live JSONL appended), sync picks up delta via `dirs_exist_ok` overwrite; if source shrinks (should not happen), do not delete dest files to avoid data loss — log discrepancy and keep dest as superset.
- If dest parent `D:\23082026\.omp\agent\sessions` is missing (clean checkout), recreate it inside D: only; do not create anything on C:.
- If verification fails (hash mismatch or byte count differs), do not proceed to any deletion; re-run copy for mismatched relative paths only and re-verify.

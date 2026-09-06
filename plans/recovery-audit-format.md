# Recovery Audit Format

Use one copy of this format for one bounded system, route, or incident. It is
an evidence log and decision record, not proof that a fix is complete.

## 1. Audit header

| Field | Record |
| --- | --- |
| Audit name | |
| Owner | |
| Started / last updated | |
| System or route | |
| Requested outcome | |
| In scope | |
| Explicitly out of scope | |
| Change authority | |
| Production access | None / read-only / approved change |

## 2. Current state

State only what is observed. Separate facts from assumptions.

| Item | Expected | Actual | Evidence | Status |
| --- | --- | --- | --- | --- |
| Runtime path | | | command, route, or source location | Unknown / working / failing |
| Configuration | | | redacted key presence or config path | Unknown / working / failing |
| User-visible behaviour | | | browser viewport, console, network | Unknown / working / failing |
| Telemetry or external result | | | query, dashboard, or endpoint | Unknown / working / failing |

## 3. Findings

One finding per row. A finding is not a proposed fix.

| ID | Severity | Observation | Reproduction | Likely owner | Scope boundary |
| --- | --- | --- | --- | --- |
| AUD-001 | | | | | |

### Evidence notes

- Record command names, exit codes, endpoint status, browser viewport, and
  relevant console or network outcome.
- Never paste secrets, tokens, request payloads, authorization headers, or
  personal data. Record only presence, type, and redacted identifiers.
- Label an unrun check as **not run**; do not infer a pass from code review.

## 4. Change proposal

Do not edit until this section is complete and authorized.

| File or external system | Smallest intended change | Why it addresses the finding | Reversible by |
| --- | --- | --- | --- |
| | | | |

**Commands or actions requested for authorization:**

1. 
2. 

**No-change alternative and trade-off:**

## 5. Implementation record

Complete only after the approved work is done.

| Item | Record |
| --- | --- |
| Files changed | |
| External changes | |
| Keys or secrets changed | None, unless explicitly authorized |
| Commands run and exit codes | |
| Rollback path | |

## 6. Verification matrix

| Check | Expected | Observed result | Evidence location | Status |
| --- | --- | --- | --- | --- |
| Direct endpoint | | | | Not run / pass / fail |
| Server logs | No relevant errors | | | Not run / pass / fail |
| Browser console | No relevant errors | | | Not run / pass / fail |
| Browser network | Required request succeeds; no prohibited request | | | Not run / pass / fail |
| Required viewport matrix | No regression | | | Not run / pass / fail |
| External telemetry | Expected signal visible | | | Not run / pass / fail |

For UI work, record all required viewports and the actual scrolling owner;
for observability work, record the exact query or dashboard view without
including credentials or payload data.

## 7. Decision and handoff

| Field | Record |
| --- | --- |
| Result | Complete / partial / blocked |
| Verified facts | |
| Remaining gaps | |
| Intentionally not done | |
| Next smallest action | |
| Needs owner decision? | Yes / no — state the single decision |

Hard blockers belong in `Failures.md` with a minimal, reproducible failure.

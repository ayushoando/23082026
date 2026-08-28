# Governance Reconciliation Ledger

## Scope and method

This ledger records Tasks 4.2 and 4.3 for `.kiro/kiro-repo-guidance-setup/` (canonical) and `scripts/kiro-repo-guidance-setup/` (the abandoned relocation). The review used the common tracked baseline, the staged outside-tree edits, a recursive live relative-path and SHA-256 comparison, and textual diffs. No tests, typechecks, gates, builds, browser checks, coverage, or services were run.

The common tracked baseline contained the same 68 governance files in both roots: 25 top-level TypeScript modules and 43 TypeScript tests. Task 4.2 identified exactly 22 outside-tree files changed by the abandoned relocation. Task 4.3 reviewed all 22: relocation-independent sibling-import fixes were accepted into canonical files, while embedded roots, fixtures, comments, contracts, and manifest values that made `scripts/kiro-repo-guidance-setup/` operational were rejected or restored to `.kiro/kiro-repo-guidance-setup/**`.

After reconciliation, the 68 implementation/test relative paths still match exactly. Fifty-one pairs are byte-identical and 17 pairs intentionally differ because the outside copy retains rejected relocation-only text. The canonical tree additionally contains `README.md` and this ledger. The outside duplicate remains present only because deletion is reserved for Task 4.8.

## Complete 22-file decision ledger

“Accept” means copy the valid relocation-independent change into the canonical counterpart. “Reject” means keep or restore canonical `.kiro/**` semantics instead of the outside text. A mixed decision records both outcomes within one file.

| # | Relative path | Decision and chosen canonical content | Rationale |
|---:|---|---|---|
| 1 | `contract-freeze.ts` | **Reject.** Keep `.kiro/kiro-repo-guidance-setup/contracts.ts` and `ownership.ts` in the frozen contract paths. | The outside edit only rewrote semantic roots to the abandoned `scripts/**` destination. |
| 2 | `contracts.ts` | **Reject.** Keep all five `FEATURE_IMPLEMENTATION_PATHS` under `.kiro/kiro-repo-guidance-setup/`. | The outside edit was destination-only path churn, not a behavior fix. |
| 3 | `pipeline.ts` | **Accept.** Use the sibling import `./reviewers`. | The old cross-root import escaped the package and coupled canonical code to the duplicate; the sibling import is relocation-independent. |
| 4 | `tests/integration/enablement.test.ts` | **Accept.** Use sibling imports from `../../enablement.ts`, `../../contracts.ts`, and `../../reviewers.ts`. | Tests should resolve modules within their own governance root, independent of its repository location. |
| 5 | `tests/integration/integration-gate.test.ts` | **Mixed.** Accept all `../../*.ts` sibling imports; keep the integration-owned fixture rooted at `.kiro/kiro-repo-guidance-setup/tests/integration/generated.ts`. | Sibling imports are valid; the outside/legacy fixture root would identify a noncanonical test surface. |
| 6 | `tests/integration/local-surface-e2e.test.ts` | **Accept.** Use sibling imports for enablement, contracts, freeze, reservations, pipeline, reviewers, and ownership. | The imports now resolve within the canonical tree without an operational `scripts/**` route. |
| 7 | `tests/integration/reviewer-contract.test.ts` | **Accept.** Use sibling imports for contracts, freeze, ownership, reviewers, reservations, and pipeline. | The change removes cross-root coupling and is valid in either location. |
| 8 | `tests/lane-d/contract-freeze.test.ts` | **Mixed.** Accept sibling imports; keep the expected frozen contract path `.kiro/kiro-repo-guidance-setup/contracts.ts`. | Import cleanup is relocation-independent, but the contract identity must remain canonical. |
| 9 | `tests/lane-d/contracts-validation.test.ts` | **Mixed.** Accept sibling imports; keep the validation scope under `.kiro/kiro-repo-guidance-setup/tests/lane-d/`. | The test may import locally, but its semantic scope must identify the canonical test root. |
| 10 | `tests/lane-d/controlled-rollback.test.ts` | **Accept.** Use the sibling import `../../rollback.ts`. | This is a valid local-module resolution fix with no embedded destination claim. |
| 11 | `tests/lane-d/enablement-property6.test.ts` | **Mixed.** Accept sibling imports; keep implementation and scope fixtures under `.kiro/kiro-repo-guidance-setup/**`. | Import cleanup is valid; four outside-root fixture rewrites are relocation-dependent and rejected. |
| 12 | `tests/lane-d/handover-property14.test.ts` | **Mixed.** Accept sibling imports; keep the canonical `.kiro/**/tests/**` root in the explanatory contract text. | The import fix is valid, while documentation inside the test must not advertise the abandoned root. |
| 13 | `tests/lane-d/handover.test.ts` | **Accept.** Use sibling imports for contracts and handover. | The change is purely local resolution and removes an unnecessary cross-root dependency. |
| 14 | `tests/lane-d/owner-decisions-property13.test.ts` | **Mixed.** Accept sibling imports; keep comments and fixture paths rooted in canonical `.kiro/**`. | Local imports are valid, but the outside test/source roots are not canonical semantics. |
| 15 | `tests/lane-d/policy-property15.test.ts` | **Mixed.** Accept sibling imports; keep the canonical `.kiro/**/tests/**` root in test documentation. | The import changes are reusable; the abandoned root reference is not. |
| 16 | `tests/lane-d/projections-review.test.ts` | **Mixed.** Accept sibling imports; keep both canonical-source fixtures under `.kiro/kiro-repo-guidance-setup/**`. | Source identity is part of the reviewed evidence and cannot point at the duplicate. |
| 17 | `tests/lane-d/reservations-wave-guard.test.ts` | **Mixed.** Accept sibling imports; keep reservation targets under `.kiro/kiro-repo-guidance-setup/**`. | Local import resolution is sound; an outside reservation target would reactivate the abandoned root. |
| 18 | `tests/lane-d/reviewers.test.ts` | **Mixed.** Accept sibling imports; keep rollback target fixtures under `.kiro/kiro-repo-guidance-setup/**`. | The imports are valid, while the rollback evidence must identify canonical files. |
| 19 | `tests/lane-d/rollback.test.ts` | **Accept.** Use the sibling import `../../rollback.ts`. | This is a relocation-independent local import fix. |
| 20 | `tests/lane-d/validation.test.ts` | **Mixed.** Accept sibling imports; keep implementation scope, command path, and expected scope under `.kiro/kiro-repo-guidance-setup/**`. | Import cleanup is valid; operational command/scope text targeting the duplicate is rejected. |
| 21 | `tests/lane-d/wave-property16.test.ts` | **Accept.** Use sibling imports for contracts, freeze, ownership, reservations, and wave guard. | The change is local module resolution only and introduces no outside semantic root. |
| 22 | `wave-manifest.ts` | **Reject.** Keep implementation, lane-test, integration-test, and integration-owned paths under `.kiro/kiro-repo-guidance-setup/**`. | Every outside edit encoded the abandoned destination in the canonical manifest contract. |

## Supplementary canonical corrections

Reconciliation also exposed stale canonical-only text not represented by the 22 outside relocation edits. These corrections are retained because they enforce the selected root:

- `ownership.ts` uses `.kiro/kiro-repo-guidance-setup/tests/**` for the feature test read path.
- The two lane-C property-test comments identify `.kiro/kiro-repo-guidance-setup/{hooks,capabilities,continuity}.ts` rather than `scripts/**`.
- Mixed-decision fixtures and comments listed above identify the canonical `.kiro/**` implementation and test roots.

## Static post-reconciliation evidence

The deletion precondition is evaluated against the canonical tree, not by demanding byte equality with rejected outside destination text. Task 4.7 observed:

- **25** top-level `.ts` modules in the canonical root.
- **43** recursive `*.test.ts`/`*.test.tsx` files under canonical `tests/`.
- **22** numbered decision rows in this ledger.
- `wave-manifest.ts`, `contract-freeze.ts`, `contracts.ts`, and `ownership.ts` identify implementation, test, contract, ownership, and integration-owned paths under `.kiro/kiro-repo-guidance-setup/**`; generated evidence remains under `results/kiro-repo-guidance-setup/` as a referenced repository asset.
- Canonical source and tests resolve the reviewed governance imports through siblings; a scan for imports through `scripts/kiro-repo-guidance-setup/**` returned no matches.
- A scan of canonical `.ts`/`.tsx` files for operational `scripts/kiro-repo-guidance-setup` references returned no matches. Historical mentions remain only in documentation/ledger/spec contexts.
- `scripts/kiro-repo-guidance-setup/` still exists, confirming Task 4.8 deletion was not performed.

Task 4.7 records the decisions and static checks only. It does not delete `scripts/kiro-repo-guidance-setup/`; that action remains Task 4.8.

## MCP schema source inventory

Only paths returned by `git ls-files -- mcp/<name>` are eligible for consolidation. Preflight found no `.kiro/mcp/<name>` destination for any approved tree and no untracked files inside any source tree.

| Tree | Tracked files | Source manifest SHA-256 |
|---|---:|---|
| `chrome-devtools` | 29 | `BC85A355D5028B64938A3F006C4B1F3D186F4B458C42CE06275BC061CAA939B1` |
| `cloudflare-docs` | 2 | `917DC5423971F0E82AE3A5615B8D36FBFF53B20B50A1E85ADB2247602768BBA0` |
| `github` | 91 | `3D3C68A12CEFF94CD63C3D67E415C86DD8913334C6754564E1C514E3A29C68BE` |
| `tasks` | 6 | `1DDD7EACADDFA5D5C750ED15C65F9D050552FB4E982D178C357D0BCFC099D420` |

A manifest digest is SHA-256 over UTF-8 bytes of sorted `relative-path|file-sha256` rows joined by LF. Destination parity must be re-computed after copy. Root-copy deletion remains held for its assigned task even when parity succeeds. Schema presence proves neither workspace MCP configuration nor runtime installation.

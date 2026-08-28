# Governance Reconciliation Ledger

## Scope and method

This ledger records the live, byte-level reconciliation of `.kiro/kiro-repo-guidance-setup/` (canonical) against `scripts/kiro-repo-guidance-setup/` (abandoned relocation). Relative-path sets were enumerated recursively and SHA-256 was computed from each file's live bytes. Every differing pair was inspected with a textual diff. No behavioral validation was run.

Observed inventory before MCP consolidation:

- Canonical: 69 files, comprising 25 top-level TypeScript modules, 43 TypeScript tests, and `README.md`.
- Outside duplicate: 68 files, comprising the same 25 top-level TypeScript modules and 43 TypeScript tests.
- Relative-path set difference: `README.md` exists only in canonical; the 68 implementation/test relative paths otherwise match exactly.
- Common-file manifest SHA-256 (sorted `relative-path|file-sha256` rows): canonical `38ECCF39614316D02982201D51F48E05F1165A594CC7A498D6B48D05F4578F82`; outside `1B1C655E6F0722FC646E01F7333A725E579E65C18FBA4ADB976AB7BA4931AFBF`.

## Differing-pair decisions

All 17 differing pairs contain only path text introduced for the abandoned `scripts/` destination. Those changes are relocation-dependent and are rejected. The canonical `.kiro/kiro-repo-guidance-setup/**` counterpart is retained in every case; there is no valid outside-only implementation fix to merge.

| Relative path | Canonical SHA-256 | Outside SHA-256 | Decision |
|---|---|---|---|
| `contract-freeze.ts` | `42920CCE6B641311F2EB1E4C462653A2335CE8F86DE53A67B00AE97EEEEA9B0F` | `65063FD9A0F2BA099ACCC030D150B8ECD51AB97D48E7DA9618AC5FAC357F2A7E` | Reject outside rewrites of shared-contract and ownership-manifest roots to `scripts/**`; retain canonical `.kiro/**` paths. |
| `contracts.ts` | `5A01F2B9A9761EA741DA6AEBB7D3B85C2BBFF403B9CB3D622D9A6EC4B5290D09` | `1FEFBE406313741EDDB6894A8BE35FD78F5E432E4B8CC7BCFEB631FBE0DA88E3` | Reject outside feature implementation path rewrites to `scripts/**`; retain canonical `.kiro/**` paths. |
| `ownership.ts` | `18C97230FFB94061CF5115F404B4F8959309A89971D6E20075815C082E85C43F` | `BB88D87C89E28A07A692180FE0980127E678EA60CA96CCB8B65BDF9C4A506EB4` | Reject abandoned `tests/kiro-repo-guidance-setup/**` fixture root; retain canonical `.kiro/**/tests/**`. |
| `tests/integration/integration-gate.test.ts` | `DD3C3A7C6E44A65AF8D29C2DD0D4BB21B1BE821A6E00FC67BA842FB60F869182` | `1559E0DECDB0E32FC02C6CE8D1A0A5F5075B6D742C58DCCA60389B246A83FDF9` | Reject abandoned test fixture path; retain canonical `.kiro/**` fixture. |
| `tests/lane-c/approved-hooks-satisfy-schema-and-safety-bounds.property.test.ts` | `3E0907B5AC499CE989DB425C530A15BE8D0D3527CEEC2F989E8A2FA50FBEFAA0` | `FAE77FD4035909B8DCD363A4B98062E0D6BD8EE0ADA61623233FFF1FBE37B204` | Reject comment-only `scripts/**` source reference; retain canonical reference. |
| `tests/lane-c/extension-routing-and-execution-plans-are-bounded.property.test.ts` | `6D37FD466A425F7BFEFF4F01DA21620E3C54E8945A53B0FD32833B35716C8300` | `E2300D73EDFDC9ADA78076C6DEEDD56690119D65637F11DDC2F5B693467F5761` | Reject comment-only `scripts/**` source references; retain canonical references. |
| `tests/lane-d/contract-freeze.test.ts` | `AACF68C5D2A9D146BFC7A67F32F8A9783F48138D6CA84F21A0EA64D573E75038` | `7C298424EC2C39A7D3C26E4AA0521DBB3457E0CE7F70C358582025621E779FB3` | Reject `scripts/**` expected contract path; retain canonical expected path. |
| `tests/lane-d/contracts-validation.test.ts` | `00A91E2905F3594342D75CD6E9D56CE12862E4D89952BBE10609B1F3C855AAAC` | `6F613EFC17B382C568A5016938D072FBA111592DA730EA08370DAE4BA69FEF29` | Reject abandoned test scope; retain canonical `.kiro/**` scope. |
| `tests/lane-d/enablement-property6.test.ts` | `956819872CDBAAD99E7C1200857A40E244057A9B761F68AB589FB395F4CD2821` | `79F67176B968935979613E3601286FF8EDD501353968DC559C70141A2C43DD74` | Reject four `scripts/**` implementation/scope fixture rewrites; retain canonical paths. |
| `tests/lane-d/handover-property14.test.ts` | `389386369375EBA3CB5401BEE51ECC0667179581D3E6A5E3E19D0AC19EFA7700` | `2D0FFC2E10BE07B1EE1A09C08D38DC28FFEBA2DEFF157054E968E1561C1C9FD7` | Reject comment-only abandoned test-root reference; retain canonical root. |
| `tests/lane-d/owner-decisions-property13.test.ts` | `D097311107C52707167D142020813422E9A0326EB1EEB81EB93D653804084B11` | `69725399FDCCFEB3E1BDCDDD9872E0C82A1EFEC72A7AE9A0209D0FABFF11F417` | Reject comment and fixture rewrites to abandoned roots; retain canonical paths. |
| `tests/lane-d/policy-property15.test.ts` | `165451EAAF658A7A4CFA6B78A6D9C7149C241C92440D6696EB305D391B804DDD` | `8114AAB8CF509CB6BD8618C0F02F234F5101A542EC442D74077CF67D6A85D970` | Reject comment-only abandoned test-root reference; retain canonical root. |
| `tests/lane-d/projections-review.test.ts` | `43C0C59C2893CB10491D85E49CE49568FFC3487B344D16A6D5FE323E7E160BB4` | `525993C6C0D9194483ABC90DB21B38FF29A9829DBD66B8D1A35E34079362F4FD` | Reject two `scripts/**` canonical-source fixtures; retain canonical `.kiro/**` sources. |
| `tests/lane-d/reservations-wave-guard.test.ts` | `FB03FA8A473081FF305D09BE3E6F3D257DDE7491B333C38E049280EF1FC48BA6` | `394D88DF2B3BCE7FEB4B06BD9D5E249EE9A8BA6285956B8E6B0E989B81F77090` | Reject `scripts/**` reservation target; retain canonical target. |
| `tests/lane-d/reviewers.test.ts` | `11B788AE6161215571E28C51154428D375E253C659C671A101072C416C47A185` | `05A515BA97D01A79C36C24AE3924B91B950BFBA6A7A07720EB32152515D9B2EB` | Reject `scripts/**` rollback target fixture; retain canonical target. |
| `tests/lane-d/validation.test.ts` | `630C3E22CF17F6E9237DA3E239A6979D253EBC1073236CBCC10D44E4F0245CFE` | `4A61FABB81139B8231741B268DB51A633715BD4C715450073C67209742FDC528` | Reject abandoned implementation scope, test command path, and expected scope; retain canonical paths. |
| `wave-manifest.ts` | `D0CA219EAB8242732E0F02CFC74AB86F74636289F250779D8B87EFBFE537CA22` | `E71511BB3A877A3C500E90D24715CFC36D2E33C661C5180E74BBA840B792C440` | Reject all `scripts/**` implementation, lane-test, integration-test, and owned-path roots; retain canonical `.kiro/**` manifest roots. |

The other 51 shared relative paths are byte-identical. Therefore every outside file has been reviewed either as an inspected differing pair or as an exact byte match. The outside tree is reconciliation-ready for deletion, but deletion is intentionally held for explicit owner confirmation.

## MCP schema source inventory

Only paths returned by `git ls-files -- mcp/<name>` are eligible for consolidation. Preflight found no `.kiro/mcp/<name>` destination for any approved tree and no untracked files inside any source tree.

| Tree | Tracked source files | Destination files | Source/destination manifest SHA-256 | Relative-path differences | Hash mismatches | Deletion readiness |
|---|---:|---:|---|---:|---:|---|
| `chrome-devtools` | 29 | 29 | `BC85A355D5028B64938A3F006C4B1F3D186F4B458C42CE06275BC061CAA939B1` | 0 | 0 | Parity gate passed; deletion held for explicit owner confirmation. |
| `cloudflare-docs` | 2 | 2 | `917DC5423971F0E82AE3A5615B8D36FBFF53B20B50A1E85ADB2247602768BBA0` | 0 | 0 | Parity gate passed; deletion held for explicit owner confirmation. |
| `github` | 91 | 91 | `3D3C68A12CEFF94CD63C3D67E415C86DD8913334C6754564E1C514E3A29C68BE` | 0 | 0 | Parity gate passed; deletion held for explicit owner confirmation. |
| `tasks` | 6 | 6 | `1DDD7EACADDFA5D5C750ED15C65F9D050552FB4E982D178C357D0BCFC099D420` | 0 | 0 | Parity gate passed; deletion held for explicit owner confirmation. |

A manifest digest is SHA-256 over UTF-8 bytes of sorted `relative-path|file-sha256` rows joined by LF. Post-copy comparison proved an exact relative-path set and per-file SHA-256 match independently for each tree. Root-copy deletion remains held for explicit owner confirmation. Schema presence proves neither workspace MCP configuration nor runtime installation.

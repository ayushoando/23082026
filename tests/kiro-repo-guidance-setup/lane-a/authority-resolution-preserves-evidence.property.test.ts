// @vitest-environment node
//
// Feature: kiro-repo-guidance-setup, Property 2: Authority resolution preserves evidence
//
// **Validates: Requirements 2.3, 3.3, 3.6, 14.6, 14.7; Design: Correctness Property 2**
//
// Property 2 (design.md): "For all claim sets from the repository authority
// ranks, the highest-ranked applicable claim is selected according to
// `user > live code and fresh commands > AGENTS.md > Agents/* > canonical docs/*`,
// while every losing claim, provenance record, rationale, and unresolved impact
// remains available as contextual evidence; an unconfirmed rule is `Unverified`."
//
// This exercises the Lane A `AuthorityResolver` (provenance.ts) over randomized
// claim sets. It proves the resolver never drops evidence: the resolved output
// retains every input claim (winner + losers) in insertion order, records every
// non-selected claim as a losing reference, preserves each claim's provenance
// reference as an evidence ref, keeps a non-empty rationale, surfaces an
// unresolved impact when any claim carries one, and never upgrades an
// Unverified selected claim.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { authorityResolver } from "../../../scripts/kiro-repo-guidance-setup/provenance.ts";
import type {
  AuthorityClaim,
  AuthorityRank,
  EvidenceState,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

// Mirror of the authority order the resolver applies (provenance.ts AUTHORITY_ORDER).
// Lower index = higher authority. Kept local so the test asserts the intended
// behavior independently of the module's private constant.
const AUTHORITY_ORDER = [
  "user",
  "live_code_or_fresh_command",
  "AGENTS.md",
  "Agents/*",
  "canonical_docs/*",
  "official_documentation",
  "active_plan",
  "handover_note",
  "historical_evidence",
] as const satisfies readonly AuthorityRank[];

const EVIDENCE_STATES = [
  "Documented",
  "Observed",
  "Unverified",
  "Owner_Decision",
  "Approval_Boundary",
  "Validated",
] as const satisfies readonly EvidenceState[];

function authorityIndex(rank: AuthorityRank): number {
  const index = AUTHORITY_ORDER.indexOf(rank);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

const rankArb = fc.constantFrom<AuthorityRank>(...AUTHORITY_ORDER);
const evidenceArb = fc.constantFrom<EvidenceState>(...EVIDENCE_STATES);

// A valid, complete claim: the resolver requires non-empty claimId, sourceRef,
// claim text, and provenanceRef. Optional fields (surface/version/rationale/
// unresolvedImpact) are randomized independently.
function claimArb(index: number): fc.Arbitrary<AuthorityClaim> {
  return fc.record({
    rank: rankArb,
    evidenceState: evidenceArb,
    text: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
    hasUnresolved: fc.boolean(),
    unresolved: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
  }).map(({ rank, evidenceState, text, hasUnresolved, unresolved }) => {
    const base: AuthorityClaim = {
      claimId: `claim:${index}`,
      sourceRef: `source:${index}`,
      sourceRank: rank,
      claim: text,
      evidenceState,
      provenanceRef: `provenance:${index}`,
    };
    return hasUnresolved ? { ...base, unresolvedImpact: unresolved } : base;
  });
}

// A non-empty set of claims with unique identifiers.
const claimSetArb = fc
  .integer({ min: 1, max: 12 })
  .chain((count) => fc.tuple(...Array.from({ length: count }, (_, i) => claimArb(i))));

describe("Property 2: Authority resolution preserves evidence", () => {
  it("selects the highest authority claim while retaining all evidence as context", () => {
    fc.assert(
      fc.property(claimSetArb, (claims) => {
        const before = JSON.stringify(claims);
        const result = authorityResolver.resolve({
          resolutionId: "resolution:property2",
          claims,
        });

        // A complete, non-empty claim set always resolves.
        expect(result.status).toBe("pass");
        const output = result.output;
        expect(output).toBeDefined();
        if (!output) return;

        // 1. The selected claim is one that ties for the best (lowest-index)
        //    authority rank. Ties are broken by insertion order (stable sort),
        //    so the winner is the first claim at the minimum authority index.
        const minIndex = Math.min(...claims.map((c) => authorityIndex(c.sourceRank)));
        const expectedWinner = claims.find((c) => authorityIndex(c.sourceRank) === minIndex);
        expect(expectedWinner).toBeDefined();
        expect(output.selectedClaimRef).toBe(expectedWinner?.claimId);

        // 2. No evidence is dropped: every input claim is retained, in order.
        expect(output.claims).toEqual(claims);

        // 3. Every non-selected claim is recorded as a losing reference, and
        //    the losing set is exactly the complement of the winner. Order of
        //    losingClaimRefs is not part of the contract (the resolver reports
        //    them by authority rank), so compare as sets.
        const expectedLosers = claims
          .filter((c) => c.claimId !== output.selectedClaimRef)
          .map((c) => c.claimId);
        expect([...output.losingClaimRefs].sort()).toEqual([...expectedLosers].sort());
        expect(output.losingClaimRefs).toHaveLength(expectedLosers.length);
        expect(output.losingClaimRefs).not.toContain(output.selectedClaimRef);

        // 4. Every claim's provenance chain is preserved as an evidence ref,
        //    for winners and losers alike.
        expect([...result.evidenceRefs]).toEqual(claims.map((c) => c.provenanceRef));

        // 5. A non-empty rationale always accompanies the resolution.
        expect(output.rationale.trim().length).toBeGreaterThan(0);

        // 6. An unresolved impact from any claim remains available as context.
        const anyUnresolved = claims.some(
          (c) => typeof c.unresolvedImpact === "string" && c.unresolvedImpact.trim().length > 0,
        );
        if (anyUnresolved) {
          expect(typeof output.unresolvedImpact).toBe("string");
          expect((output.unresolvedImpact ?? "").trim().length).toBeGreaterThan(0);
        }

        // 7. An unconfirmed (Unverified) selected claim is never silently
        //    upgraded: the rationale records that it stays Unverified.
        if (expectedWinner?.evidenceState === "Unverified") {
          expect(output.rationale).toContain("Unverified");
        }

        // 8. Resolution is read-only over its input.
        expect(JSON.stringify(claims)).toBe(before);
      }),
      { numRuns: 200 },
    );
  });

  it("keeps every losing rank as context even when the winner is the sole highest authority", () => {
    // Winner is unique highest authority; all remaining claims are strictly
    // lower and must survive as contextual losing evidence.
    const lowerRanks = AUTHORITY_ORDER.slice(1);
    const loserArb = fc.array(
      fc.constantFrom<AuthorityRank>(...lowerRanks),
      { minLength: 1, maxLength: 8 },
    );

    fc.assert(
      fc.property(loserArb, (loserRanks) => {
        const winner: AuthorityClaim = {
          claimId: "claim:winner",
          sourceRef: "source:winner",
          sourceRank: "user",
          claim: "authoritative user instruction",
          evidenceState: "Observed",
          provenanceRef: "provenance:winner",
        };
        const losers: AuthorityClaim[] = loserRanks.map((rank, i) => ({
          claimId: `claim:loser:${i}`,
          sourceRef: `source:loser:${i}`,
          sourceRank: rank,
          claim: `lower authority claim ${i}`,
          evidenceState: "Documented",
          provenanceRef: `provenance:loser:${i}`,
        }));

        // Place losers before the winner to prove selection is by authority,
        // not by position.
        const claims = [...losers, winner];
        const result = authorityResolver.resolve({
          resolutionId: "resolution:sole-winner",
          claims,
        });

        expect(result.status).toBe("pass");
        expect(result.output?.selectedClaimRef).toBe("claim:winner");
        // Losers are preserved as a set (order follows authority rank, not input order).
        expect([...(result.output?.losingClaimRefs ?? [])].sort()).toEqual(
          losers.map((c) => c.claimId).sort(),
        );
        // Every loser's provenance chain is still available.
        for (const loser of losers) {
          expect(result.evidenceRefs).toContain(loser.provenanceRef);
        }
        expect(result.output?.claims).toEqual(claims);
      }),
      { numRuns: 200 },
    );
  });
});

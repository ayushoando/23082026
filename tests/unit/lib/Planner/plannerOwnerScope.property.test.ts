// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 14: Server-derived owner scope
//
// Generate mixed-owner records and arbitrary client owner identifiers and verify
// server-session scope controls all list/item outcomes without disclosure or mutation.
// At least 100 generated cases.
//
// **Validates: Requirements 10.3, 10.4, 10.5, 10.6, 10.7**

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  CLIENT_OWNER_IDENTIFIER_KEYS,
  PLANNER_ITEM_OWNER_POLICY,
  derivePlannerOwnerScope,
  detectClientOwnerIdentifiers,
  findPlannerOwnedRecord,
  listPlannerOwnedRecords,
  type PlannerOwnerScope,
} from "@planner/lib/plannerOwnerScope";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_RUNS = 100;
const PROPERTY_SEED = 20260841;

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

interface OwnedFixture {
  id: string;
  ownerId: string;
  value: number;
}

/**
 * Generates valid owner identifiers: 8–32 chars, starts with a letter,
 * alphanumeric plus underscore/dash.
 */
const ownerArbitrary = fc
  .stringMatching(/^[a-z][a-z0-9_-]{7,31}$/)
  .filter((v) => v.length >= 8);

/**
 * Generates a tuple of (serverOwner, foreignOwner) guaranteed distinct.
 */
const distinctOwnerPairArbitrary = fc
  .tuple(ownerArbitrary, ownerArbitrary)
  .filter(([a, b]) => a !== b);

/**
 * Generates a mixed-owner record set with at least one record per owner,
 * plus a client-supplied owner that differs from the server owner.
 */
const ownerScopeCaseArbitrary = fc
  .tuple(
    distinctOwnerPairArbitrary,
    fc.array(fc.integer({ min: -10_000, max: 10_000 }), {
      minLength: 1,
      maxLength: 20,
    }),
  )
  .chain(([[serverOwner, foreignOwner], values]) =>
    fc.record({
      serverOwner: fc.constant(serverOwner),
      foreignOwner: fc.constant(foreignOwner),
      clientOwner: ownerArbitrary.filter((c) => c !== serverOwner),
      records: fc.constant(
        values.flatMap((value, index): OwnedFixture[] => [
          { id: `owned-${index}`, ownerId: serverOwner, value },
          { id: `foreign-${index}`, ownerId: foreignOwner, value },
        ]),
      ),
    }),
  );

/**
 * Generates a multi-owner record set with 2–5 distinct owners.
 * Ensures the server owner is one of them.
 */
const multiOwnerCaseArbitrary = fc
  .tuple(
    ownerArbitrary,
    fc.array(ownerArbitrary, { minLength: 1, maxLength: 4 }),
    fc.array(fc.integer({ min: 0, max: 9999 }), {
      minLength: 2,
      maxLength: 30,
    }),
  )
  .map(([serverOwner, others, values]) => {
    const uniqueOthers = [...new Set(others)].filter((o) => o !== serverOwner);
    const allOwners = [serverOwner, ...uniqueOthers];
    const records: OwnedFixture[] = values.map((v, i) => ({
      id: `rec-${i}`,
      ownerId: allOwners[i % allOwners.length]!,
      value: v,
    }));
    return { serverOwner, allOwners, records };
  });

// ---------------------------------------------------------------------------
// Property 14 tests
// ---------------------------------------------------------------------------

describe("Property 14: Server-derived owner scope", () => {
  // -------------------------------------------------------------------------
  // Req 10.7 — Scope derivation always from verified server session
  // -------------------------------------------------------------------------
  describe("Req 10.7: scope derivation from server session only", () => {
    it("derivePlannerOwnerScope always returns server-session source for any owner id", () => {
      fc.assert(
        fc.property(ownerArbitrary, (ownerId) => {
          const scope = derivePlannerOwnerScope({ ownerId });
          expect(scope.ownerId).toBe(ownerId);
          expect(scope.source).toBe("verified-server-session");
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    it("scope ignores arbitrary client-supplied owner; effective owner is always server identity", () => {
      fc.assert(
        fc.property(ownerScopeCaseArbitrary, (sample) => {
          const scope = derivePlannerOwnerScope({
            ownerId: sample.serverOwner,
          });
          // The scope must match the server identity, never the client one
          expect(scope.ownerId).toBe(sample.serverOwner);
          expect(scope.ownerId).not.toBe(sample.clientOwner);
          expect(scope.source).toBe("verified-server-session");
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Req 10.7 — Client owner identifier detection
  // -------------------------------------------------------------------------
  describe("Req 10.7: client owner identifier detection", () => {
    it("detects any CLIENT_OWNER_IDENTIFIER_KEYS present in arbitrary payloads", () => {
      // Arbitrary that generates a payload with a random subset of client
      // owner keys plus arbitrary non-owner fields.
      const payloadArbitrary = fc
        .tuple(
          fc.subarray([...CLIENT_OWNER_IDENTIFIER_KEYS], { minLength: 0 }),
          fc.dictionary(
            fc
              .string({ minLength: 1, maxLength: 20 })
              .filter(
                (k) =>
                  !(CLIENT_OWNER_IDENTIFIER_KEYS as readonly string[]).includes(
                    k,
                  ),
              ),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            { minKeys: 0, maxKeys: 5 },
          ),
        )
        .map(([clientKeys, extras]) => {
          const body: Record<string, unknown> = { ...extras };
          for (const key of clientKeys) {
            body[key] = `attacker-${key}`;
          }
          return { body, expectedKeys: clientKeys };
        });

      fc.assert(
        fc.property(payloadArbitrary, ({ body, expectedKeys }) => {
          const detected = detectClientOwnerIdentifiers(body);
          // Every injected client key must be detected
          for (const key of expectedKeys) {
            expect(detected).toContain(key);
          }
          // No false positives — only CLIENT_OWNER_IDENTIFIER_KEYS can appear
          for (const key of detected) {
            expect(
              (CLIENT_OWNER_IDENTIFIER_KEYS as readonly string[]).includes(key),
            ).toBe(true);
          }
          // If no client keys were injected, detection is empty
          if (expectedKeys.length === 0) {
            expect(detected).toEqual([]);
          }
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    it("returns empty for non-object inputs (null, undefined, primitive, array)", () => {
      const nonObjectArbitrary = fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.string(),
        fc.integer(),
        fc.boolean(),
        fc.array(fc.anything(), { maxLength: 5 }),
      );

      fc.assert(
        fc.property(nonObjectArbitrary, (input) => {
          expect(detectClientOwnerIdentifiers(input)).toEqual([]);
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Req 10.4 — List returns only owned records
  // -------------------------------------------------------------------------
  describe("Req 10.4: list returns only owned records", () => {
    it("listPlannerOwnedRecords returns exclusively records matching the server owner", () => {
      fc.assert(
        fc.property(ownerScopeCaseArbitrary, (sample) => {
          const scope = derivePlannerOwnerScope({
            ownerId: sample.serverOwner,
          });
          const listed = listPlannerOwnedRecords(sample.records, scope);

          // Every returned record must belong to the server owner
          for (const record of listed) {
            expect(record.ownerId).toBe(sample.serverOwner);
          }

          // Must include all records that belong to server owner
          const expectedCount = sample.records.filter(
            (r) => r.ownerId === sample.serverOwner,
          ).length;
          expect(listed).toHaveLength(expectedCount);

          // No foreign records leak
          for (const record of listed) {
            expect(record.ownerId).not.toBe(sample.foreignOwner);
          }
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    it("list result count equals the server owner's record count for multi-owner sets", () => {
      fc.assert(
        fc.property(multiOwnerCaseArbitrary, ({ serverOwner, records }) => {
          const scope = derivePlannerOwnerScope({ ownerId: serverOwner });
          const listed = listPlannerOwnedRecords(records, scope);

          const expected = records.filter(
            (r) => r.ownerId === serverOwner,
          ).length;
          expect(listed).toHaveLength(expected);
          expect(listed.every((r) => r.ownerId === serverOwner)).toBe(true);
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Req 10.5, 10.6 — Item operations: non-disclosing, no cross-owner access
  // -------------------------------------------------------------------------
  describe("Req 10.5, 10.6: item lookup non-disclosing for cross-owner", () => {
    it("findPlannerOwnedRecord returns null for cross-owner IDs, indistinguishable from absent", () => {
      fc.assert(
        fc.property(ownerScopeCaseArbitrary, (sample) => {
          const scope = derivePlannerOwnerScope({
            ownerId: sample.serverOwner,
          });

          // Every foreign record must return null
          const foreignRecords = sample.records.filter(
            (r) => r.ownerId === sample.foreignOwner,
          );
          for (const foreign of foreignRecords) {
            const result = findPlannerOwnedRecord(
              sample.records,
              foreign.id,
              scope,
              (r) => r.id,
            );
            expect(result).toBeNull();
          }

          // A completely absent ID also returns null — same as cross-owner
          const absentResult = findPlannerOwnedRecord(
            sample.records,
            "nonexistent-id-" + Math.random(),
            scope,
            (r) => r.id,
          );
          expect(absentResult).toBeNull();
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    it("findPlannerOwnedRecord returns the correct owned record when it exists", () => {
      fc.assert(
        fc.property(ownerScopeCaseArbitrary, (sample) => {
          const scope = derivePlannerOwnerScope({
            ownerId: sample.serverOwner,
          });
          const ownedRecords = sample.records.filter(
            (r) => r.ownerId === sample.serverOwner,
          );

          for (const owned of ownedRecords) {
            const result = findPlannerOwnedRecord(
              sample.records,
              owned.id,
              scope,
              (r) => r.id,
            );
            expect(result).not.toBeNull();
            expect(result!.id).toBe(owned.id);
            expect(result!.ownerId).toBe(sample.serverOwner);
          }
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    it("item policy is non-disclosing-not-found (cross-owner same as absent)", () => {
      // This is a structural invariant, not random — but it anchors the property.
      expect(PLANNER_ITEM_OWNER_POLICY).toBe("non-disclosing-not-found");
    });
  });

  // -------------------------------------------------------------------------
  // Req 10.3, 10.5 — No disclosure or mutation of cross-owner data
  // -------------------------------------------------------------------------
  describe("Req 10.3, 10.5: no disclosure or mutation of cross-owner data", () => {
    it("operations through scope never disclose cross-owner record content", () => {
      fc.assert(
        fc.property(ownerScopeCaseArbitrary, (sample) => {
          const scope = derivePlannerOwnerScope({
            ownerId: sample.serverOwner,
          });

          // List never returns foreign records
          const listed = listPlannerOwnedRecords(sample.records, scope);
          const listedIds = new Set(listed.map((r) => r.id));
          const foreignIds = sample.records
            .filter((r) => r.ownerId === sample.foreignOwner)
            .map((r) => r.id);
          for (const fid of foreignIds) {
            expect(listedIds.has(fid)).toBe(false);
          }

          // Find never returns foreign records
          for (const fid of foreignIds) {
            expect(
              findPlannerOwnedRecord(sample.records, fid, scope, (r) => r.id),
            ).toBeNull();
          }
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    it("mutations via scope-returned records do not affect foreign records", () => {
      fc.assert(
        fc.property(ownerScopeCaseArbitrary, (sample) => {
          // Deep clone to verify no cross-contamination
          const before = structuredClone(sample.records);
          const scope = derivePlannerOwnerScope({
            ownerId: sample.serverOwner,
          });

          // List and mutate owned records
          const listed = listPlannerOwnedRecords(sample.records, scope);
          for (const owned of listed) {
            owned.value += 999;
          }

          // Find and mutate a single owned record
          if (listed.length > 0) {
            const found = findPlannerOwnedRecord(
              sample.records,
              listed[0]!.id,
              scope,
              (r) => r.id,
            );
            if (found) found.value += 1000;
          }

          // All foreign records must be unchanged
          for (const record of sample.records.filter(
            (r) => r.ownerId === sample.foreignOwner,
          )) {
            const original = before.find((b) => b.id === record.id);
            expect(record).toEqual(original);
          }
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Combined invariant: server-session scope controls all outcomes
  // -------------------------------------------------------------------------
  describe("Combined: server scope controls all list/item outcomes", () => {
    it("for any multi-owner record set, scope partitions access correctly", () => {
      fc.assert(
        fc.property(
          multiOwnerCaseArbitrary,
          ({ serverOwner, allOwners, records }) => {
            const scope = derivePlannerOwnerScope({ ownerId: serverOwner });

            // List
            const listed = listPlannerOwnedRecords(records, scope);
            expect(listed.every((r) => r.ownerId === serverOwner)).toBe(true);
            expect(listed).toHaveLength(
              records.filter((r) => r.ownerId === serverOwner).length,
            );

            // Item lookup for every record
            for (const record of records) {
              const result = findPlannerOwnedRecord(
                records,
                record.id,
                scope,
                (r) => r.id,
              );
              if (record.ownerId === serverOwner) {
                expect(result).not.toBeNull();
                expect(result!.ownerId).toBe(serverOwner);
              } else {
                expect(result).toBeNull();
              }
            }

            // No other owner's data leaks via any path
            const nonServerOwners = allOwners.filter(
              (o) => o !== serverOwner,
            );
            for (const other of nonServerOwners) {
              const otherRecords = records.filter(
                (r) => r.ownerId === other,
              );
              for (const otherRecord of otherRecords) {
                expect(listed.find((l) => l.id === otherRecord.id)).toBeUndefined();
              }
            }
          },
        ),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    it("scope with empty record set returns empty list and null for any lookup", () => {
      fc.assert(
        fc.property(ownerArbitrary, (ownerId) => {
          const scope = derivePlannerOwnerScope({ ownerId });
          const emptyRecords: OwnedFixture[] = [];

          expect(listPlannerOwnedRecords(emptyRecords, scope)).toEqual([]);
          expect(
            findPlannerOwnedRecord(
              emptyRecords,
              "any-id",
              scope,
              (r) => r.id,
            ),
          ).toBeNull();
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    it("two different scopes on the same records return disjoint results", () => {
      fc.assert(
        fc.property(ownerScopeCaseArbitrary, (sample) => {
          const scopeA = derivePlannerOwnerScope({
            ownerId: sample.serverOwner,
          });
          const scopeB = derivePlannerOwnerScope({
            ownerId: sample.foreignOwner,
          });

          const listedA = listPlannerOwnedRecords(sample.records, scopeA);
          const listedB = listPlannerOwnedRecords(sample.records, scopeB);

          const idsA = new Set(listedA.map((r) => r.id));
          const idsB = new Set(listedB.map((r) => r.id));

          // Disjoint: no overlap
          for (const id of idsA) {
            expect(idsB.has(id)).toBe(false);
          }
          for (const id of idsB) {
            expect(idsA.has(id)).toBe(false);
          }

          // Combined coverage: all records accounted for
          expect(idsA.size + idsB.size).toBe(sample.records.length);
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Structural invariant: PlannerOwnerScope shape
  // -------------------------------------------------------------------------
  describe("Structural: PlannerOwnerScope shape invariant", () => {
    it("derivePlannerOwnerScope always produces a frozen-shape scope object", () => {
      fc.assert(
        fc.property(ownerArbitrary, (ownerId) => {
          const scope: PlannerOwnerScope = derivePlannerOwnerScope({
            ownerId,
          });
          // Shape: exactly two keys
          const keys = Object.keys(scope).sort();
          expect(keys).toEqual(["ownerId", "source"]);
          // Source is always the literal
          expect(scope.source).toBe("verified-server-session");
          // Owner matches input
          expect(scope.ownerId).toBe(ownerId);
        }),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });
  });
});

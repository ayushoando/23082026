// @vitest-environment node
// Feature: site-ui-content-links-audit, Property W3: Wave 3 static partition isolation and closure

/**
 * Property-based test for the Wave 3 (Task 4.1) static partition generator.
 *
 * **Validates: Requirements 3.4-3.9, 4.2-4.6, 12.1-12.8, 16.1-16.7,
 * 19.1-19.8, 23.3-23.7**
 *
 * Sub-properties verified here:
 *
 * 1. **Disjoint exact coverage** — every Wave 3 in-scope occurrence is
 *    assigned to exactly one partition; the partition matrix rows sum to the
 *    scoped occurrence count with no duplication or loss.
 * 2. **Fork ownership isolation** — the Planner partition contains only
 *    Planner-surface records and never references the Studio fork (and vice
 *    versa), even for equivalent cross-fork symptoms.
 * 3. **Terminal static closure** — `validateAuditPartition` closes every
 *    partition: zero pending rows and zero quarantined records.
 * 4. **Protected non-escalation** — applicable protected/admin, Planner,
 *    Studio, and specialized-state occurrences terminate as `not-run` with an
 *    exact pending operation; guest/inapplicable tuples terminate as
 *    `not-applicable`; no guest or public evidence closes a protected row.
 * 5. **Manifest schema closure** — partition manifest entries validate
 *    against `PartitionManifestSchema`.
 *
 * All generated inputs are abstract occurrence/profile records — not product
 * fixtures and not claims about rendered application behavior.  No `site/**`
 * import, network, dev server, or product command is used.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import type {
  AccessProfile,
  BrowserProfile,
  DiscoveredDynamicInstance,
  DiscoveredRoute,
  LanguageProfile,
  OccurrenceRecord,
  StateVariant,
  ViewportProfile,
} from "../../scripts/site-ui-content-links-audit";
import {
  ACCESS_PROFILES,
  BROWSER_PROFILES,
  LANGUAGE_PROFILES,
  PartitionManifestSchema,
  STATE_VARIANTS,
  VIEWPORT_PROFILES,
  assignWave3Partition,
  buildWave3PartitionManifests,
  buildWave3PartitionRecords,
  expandToOccurrences,
  validateAuditPartition,
} from "../../scripts/site-ui-content-links-audit";

const CREATED_AT = "2026-08-31T12:00:00.000Z";

const PROVENANCE_REF = Object.freeze({
  sourceId: "source.app-router",
  sourceKind: "source" as const,
  location: "site/app/wave3-test/page.tsx",
  discoveredAt: CREATED_AT,
  authorityRank: 100,
});

const WAVE3_SURFACES = [
  "marketing",
  "catalog-configurator",
  "portal-dashboard",
  "authentication",
  "administration",
  "planner",
  "studio",
  "offline",
  "shared-shell",
] as const;

function nonEmptySubset<T>(arr: readonly T[], maxSize: number): fc.Arbitrary<readonly T[]> {
  const cap = Math.min(maxSize, arr.length);
  return fc
    .uniqueArray(fc.integer({ min: 0, max: arr.length - 1 }), {
      minLength: 1,
      maxLength: cap,
    })
    .map((indices) => indices.sort((a, b) => a - b).map((i) => arr[i]!));
}

const arbViewports: fc.Arbitrary<readonly ViewportProfile[]> = nonEmptySubset(
  VIEWPORT_PROFILES,
  1,
);
const arbBrowsers: fc.Arbitrary<readonly BrowserProfile[]> = nonEmptySubset(
  BROWSER_PROFILES,
  1,
);
const arbAccessContexts: fc.Arbitrary<readonly AccessProfile[]> =
  nonEmptySubset(ACCESS_PROFILES, 5);
const arbLanguages: fc.Arbitrary<readonly LanguageProfile[]> = nonEmptySubset(
  LANGUAGE_PROFILES,
  2,
);
const arbStates: fc.Arbitrary<readonly StateVariant[]> = nonEmptySubset(
  STATE_VARIANTS,
  3,
);

function buildRoutes(seed: number, surfaces: readonly string[]): DiscoveredRoute[] {
  return surfaces.map((surface, index) => ({
    routeId: `route-w3-${seed}-${index}`,
    pattern: `/w3-${seed}-${index}`,
    routeKind: "static" as const,
    productSurface: surface as DiscoveredRoute["productSurface"],
    status: "active" as const,
    sourcePath: `site/app/w3-${seed}-${index}/page.tsx`,
    provenance: [PROVENANCE_REF],
    conflictIds: [],
    coverageGapIds: [],
  }));
}

interface Wave3Input {
  readonly routes: readonly DiscoveredRoute[];
  readonly instances: readonly DiscoveredDynamicInstance[];
  readonly profiles: {
    readonly viewports: readonly ViewportProfile[];
    readonly browsers: readonly BrowserProfile[];
    readonly accessContexts: readonly AccessProfile[];
    readonly languages: readonly LanguageProfile[];
    readonly states: readonly StateVariant[];
  };
}

const arbWave3Input: fc.Arbitrary<Wave3Input> = fc
  .tuple(
    fc.uniqueArray(fc.constantFrom(...WAVE3_SURFACES), { minLength: 2, maxLength: 6 }),
    fc.integer({ min: 0, max: 2 }),
    fc.integer({ min: 0, max: 999 }),
    arbViewports,
    arbBrowsers,
    arbAccessContexts,
    arbLanguages,
    arbStates,
  )
  .map(
    ([surfaces, instanceCount, seed, viewports, browsers, accessContexts, languages, states]) => {
      const routes = buildRoutes(seed, surfaces);
      const instances: DiscoveredDynamicInstance[] = Array.from(
        { length: instanceCount },
        (_, index) => ({
          instanceId: `instance-w3-${seed}-${index}`,
          routeId: routes[index % routes.length]!.routeId,
          concreteUrl: `/w3-${seed}/instance-${index}`,
          normalizedUrl: `/w3-${seed}/instance-${index}/`,
          parameterValues: { slug: `w3-${seed}-${index}` },
          discoverySources: [PROVENANCE_REF],
          discoveredAt: CREATED_AT,
          productSurface: routes[index % routes.length]!.productSurface,
          status: "active" as const,
          coverageGapIds: [],
        }),
      );
      return {
        routes,
        instances,
        profiles: { viewports, browsers, accessContexts, languages, states },
      };
    },
  );

function occurrencesOf(input: Wave3Input): readonly OccurrenceRecord[] {
  return expandToOccurrences(input.routes, input.instances, [], input.profiles);
}

describe(
  "Feature: site-ui-content-links-audit, Property W3: Wave 3 static partition isolation and closure",
  () => {
    it(
      "Feature: site-ui-content-links-audit, Property W3: Wave 3 static partition isolation and closure — disjoint exact coverage and terminal closure per partition (Req 3.4-3.9, 12.1)",
      () => {
        fc.assert(
          fc.property(arbWave3Input, (input) => {
            const occurrences = occurrencesOf(input);
            const built = buildWave3PartitionRecords(occurrences, CREATED_AT);

            const scoped = occurrences.filter(
              (occurrence) => assignWave3Partition(occurrence) !== undefined,
            );
            expect(built.scopedOccurrenceCount).toBe(scoped.length);
            expect(built.partitionByOccurrenceId.size).toBe(scoped.length);

            let rowCount = 0;
            const seenRows = new Set<string>();
            for (const name of ["protected-admin", "planner", "studio", "specialized-states"] as const) {
              const partition = built.partitions[name];
              rowCount += partition.matrixRows.length;
              for (const row of partition.matrixRows) {
                expect(seenRows.has(row.occurrenceId)).toBe(false);
                seenRows.add(row.occurrenceId);
                expect(built.partitionByOccurrenceId.get(row.occurrenceId)).toBe(name);
              }
              // Terminal static closure (Req 12.1, 22.x): no pending, no quarantine.
              expect(partition.validation.canClose).toBe(true);
              expect(partition.validation.quarantined).toHaveLength(0);
              expect(partition.validation.pendingOccurrenceIds).toHaveLength(0);
              for (const row of partition.matrixRows) {
                expect(row.status).not.toBe("pending");
                expect(row.waveId).toBe("3");
              }
              // Every finding references the matching occurrence and evidence.
              for (const finding of partition.findings) {
                expect(finding.evidenceIds.length).toBeGreaterThan(0);
                const evidenceIds = new Set(
                  partition.evidenceRecords.map((record) => record.evidenceId),
                );
                for (const evidenceId of finding.evidenceIds) {
                  expect(evidenceIds.has(evidenceId)).toBe(true);
                }
              }
            }
            expect(rowCount).toBe(scoped.length);
            for (const occurrence of scoped) {
              expect(seenRows.has(occurrence.occurrenceId)).toBe(true);
            }
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "Feature: site-ui-content-links-audit, Property W3: Wave 3 static partition isolation and closure — Planner/Studio fork isolation and protected non-escalation (Req 4.2-4.6, 19.1-19.8, 23.3-23.7)",
      () => {
        fc.assert(
          fc.property(arbWave3Input, (input) => {
            const built = buildWave3PartitionRecords(
              occurrencesOf(input),
              CREATED_AT,
            );

            // Fork isolation: planner-only and studio-only surfaces, tokens.
            const planner = built.partitions.planner;
            const studio = built.partitions.studio;
            for (const row of planner.matrixRows) {
              expect(row.productSurface).toBe("planner");
            }
            for (const row of studio.matrixRows) {
              expect(row.productSurface).toBe("studio");
            }
            for (const record of [...planner.inventories, ...planner.evidenceRecords]) {
              expect(JSON.stringify(record)).not.toContain("/Studio/");
            }
            for (const record of [...studio.inventories, ...studio.evidenceRecords]) {
              expect(JSON.stringify(record)).not.toContain("/Planner/");
            }

            // Protected non-escalation: applicable protected-context rows are
            // never closed with a conforming or guest-derived result.
            for (const name of ["protected-admin", "planner", "studio", "specialized-states"] as const) {
              for (const row of built.partitions[name].matrixRows) {
                if (row.status === "not-applicable") {
                  expect(row.notApplicableRationale).toBeTruthy();
                  continue;
                }
                expect(row.status).toBe("not-run");
                expect(row.blockers ?? []).not.toHaveLength(0);
                for (const blocker of row.blockers ?? []) {
                  expect(blocker.pendingOperation.length).toBeGreaterThan(0);
                }
                const finding = built.partitions[name].findings.find(
                  (candidate) => candidate.findingId === row.findingId,
                );
                expect(finding).toBeDefined();
                expect(finding?.resultClassification).toBe("not-run");
              }
              for (const operation of built.partitions[name].pendingOperations) {
                expect(operation.requiredAuthorization.length).toBeGreaterThan(0);
                expect(operation.credentialOrFixtureNeeds.length).toBeGreaterThan(0);
              }
            }
          }),
          { numRuns: 100 },
        );
      },
    );

    it(
      "Feature: site-ui-content-links-audit, Property W3: Wave 3 static partition isolation and closure — partition manifest entries satisfy PartitionManifestSchema and partitions validate (Req 22.7-22.9, 26.12)",
      () => {
        fc.assert(
          fc.property(
            arbWave3Input,
            fc.stringMatching(/^[a-f0-9]{16,64}$/),
            (input, hashHex) => {
              const occurrences = occurrencesOf(input);
              const built = buildWave3PartitionRecords(occurrences, CREATED_AT);

              const manifests = buildWave3PartitionManifests(
                (["protected-admin", "planner", "studio", "specialized-states"] as const).map(
                  (name) => ({
                    partitionId: `wave-3/${name}/matrices`,
                    path: `results/site-ui-content-links-audit/${built.scopedOccurrenceCount}/${name}/rows.ndjson`,
                    contentHash: hashHex,
                    recordCount: built.partitions[name].matrixRows.length,
                    inputFingerprint: hashHex,
                  }),
                ),
              );
              expect(manifests).toHaveLength(4);
              for (const manifest of manifests) {
                expect(PartitionManifestSchema.safeParse(manifest).success).toBe(true);
                expect(manifest.status).toBe("complete");
              }

              // The partition record lists themselves re-validate through the
              // shared partition validator.
              for (const name of ["protected-admin", "planner", "studio", "specialized-states"] as const) {
                const validation = validateAuditPartition(built.partitions[name].records);
                expect(validation.canClose).toBe(true);
              }
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  },
);

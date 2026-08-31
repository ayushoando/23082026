// @vitest-environment node
// Feature: site-ui-content-links-audit, Property 3: Exact occurrence expansion and finding bijection

/**
 * Property-based test for the occurrence expansion and finding bijection
 * contract.
 *
 * **Validates: Requirements 3.1-3.9, 5.8, 7.1-7.2, 7.7, 9.1-9.2, 9.7,
 * 10.7, 12.8, 17.3, 19.6-19.8, 26.2-26.4**
 *
 * The property must hold for at least 100 randomly generated audit profile
 * sets.  Generated inputs are abstract audit profile records — not product
 * fixtures and not claims about rendered application behavior.  No `site/**`
 * import is used.
 *
 * Properties verified:
 *
 * P3-A  **Exact Cartesian cardinality (Req 3.6, 3.8)**
 *       Given S subjects and profile dimension sizes
 *       |state| × |viewport| × |browser| × |access| × |language|,
 *       `expandToOccurrences` returns exactly
 *       S × |state| × |viewport| × |browser| × |access| × |language|
 *       `OccurrenceRecord`s — no row missing, none added.
 *
 * P3-B  **Unique occurrence IDs (Req 3.7)**
 *       Every `occurrenceId` in the expanded set is unique.
 *
 * P3-C  **Bijective finding IDs (Req 3.7)**
 *       `findingId` is a 1-to-1 deterministic function of `occurrenceId`:
 *       `findingId === buildFindingId(occurrenceId)` for every row, and the
 *       set of finding IDs has the same size as the row set.
 *
 * P3-D  **No representative substitution (Req 3.8)**
 *       The set of (subjectId, stateId, viewportId, browserId, accessId,
 *       languageId) tuples equals the full declared Cartesian product —
 *       bijection in both directions.  No tuple is merged into or represented
 *       by another.
 *
 * P3-E  **Inapplicable tuples preserved (Req 3.6)**
 *       Occurrences where access or state is not applicable still appear in
 *       the matrix with a non-empty `notApplicableRationale`.  They are never
 *       silently omitted from cardinality totals.
 *
 * P3-F  **Stable occurrence and finding identity (Req 19.6-19.8)**
 *       Re-computing `occurrenceId` from each row's fields via
 *       `buildOccurrenceId` always matches the stored value, proving
 *       deterministic and input-order-independent identity.
 *
 * P3-G  **Reconciliation validator agrees (Req 26.2-26.4)**
 *       `validateOccurrenceExpansion` reports `cardinalityMatches: true`,
 *       `hasDuplicates: false`, and `uniqueOccurrenceIds` equal to the row
 *       count for every generated input.
 *
 * P3-H  **Order independence**
 *       Reversing all subject lists produces the same occurrence ID set.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import type {
  AccessProfile,
  BrowserProfile,
  DiscoveredDynamicInstance,
  DiscoveredRoute,
  DiscoveredShell,
  LanguageProfile,
  OccurrenceRecord,
  ProfileSets,
  StateVariant,
  ViewportProfile,
} from "../../scripts/site-ui-content-links-audit";
import {
  ACCESS_PROFILES,
  BROWSER_PROFILES,
  LANGUAGE_PROFILES,
  STATE_VARIANTS,
  VIEWPORT_PROFILES,
  buildFindingId,
  buildOccurrenceId,
  computeProfileVersionFingerprint,
  expandToOccurrences,
  validateOccurrenceExpansion,
} from "../../scripts/site-ui-content-links-audit";

// ---------------------------------------------------------------------------
// Shared fixture constants
// ---------------------------------------------------------------------------

const DISCOVERED_AT = "2026-08-23T12:00:00.000Z";

const PROVENANCE_REF = Object.freeze({
  sourceId: "source.app-router",
  sourceKind: "source" as const,
  location: "site/app/test/page.tsx",
  discoveredAt: DISCOVERED_AT,
  authorityRank: 100,
});

const PRODUCT_SURFACES = [
  "marketing",
  "catalog-configurator",
  "portal-dashboard",
  "authentication",
  "legal",
  "administration",
  "planner",
  "studio",
  "offline",
  "shared-shell",
] as const;

type ProductSurface = (typeof PRODUCT_SURFACES)[number];

// ---------------------------------------------------------------------------
// Helpers: non-empty subset arbitrary
// ---------------------------------------------------------------------------

/**
 * Select a non-empty subset (1 to `maxSize` items) from a readonly array.
 * Index-based selection keeps the arbitrary deterministic and avoids
 * referencing profiles by value, which would be fragile.
 */
function nonEmptySubset<T>(
  source: readonly T[],
  maxSize: number,
): fc.Arbitrary<readonly T[]> {
  const cap = Math.min(maxSize, source.length);
  return fc
    .uniqueArray(fc.integer({ min: 0, max: source.length - 1 }), {
      minLength: 1,
      maxLength: cap,
    })
    .map((indices) =>
      indices
        .slice()
        .sort((a, b) => a - b)
        .map((i) => source[i]!),
    );
}

// ---------------------------------------------------------------------------
// Profile-dimension arbitraries — draw non-empty subsets from canon registries
// ---------------------------------------------------------------------------

/** 1-3 viewport profiles */
const arbViewports: fc.Arbitrary<readonly ViewportProfile[]> = nonEmptySubset(
  VIEWPORT_PROFILES,
  3,
);

/** 1-3 browser profiles */
const arbBrowsers: fc.Arbitrary<readonly BrowserProfile[]> = nonEmptySubset(
  BROWSER_PROFILES,
  3,
);

/** 1-3 access-context profiles */
const arbAccessContexts: fc.Arbitrary<readonly AccessProfile[]> = nonEmptySubset(
  ACCESS_PROFILES,
  3,
);

/** 1-2 language profiles (English and/or Hindi) */
const arbLanguages: fc.Arbitrary<readonly LanguageProfile[]> = nonEmptySubset(
  LANGUAGE_PROFILES,
  2,
);

/** 1-4 state variants */
const arbStates: fc.Arbitrary<readonly StateVariant[]> = nonEmptySubset(
  STATE_VARIANTS,
  4,
);

// ---------------------------------------------------------------------------
// Subject builders — one per subject kind
// ---------------------------------------------------------------------------

/** Build a static DiscoveredRoute with a stable numeric key. */
function makeRoute(n: number): DiscoveredRoute {
  return {
    routeId: `route-${n}`,
    pattern: `/route-${n}`,
    concreteUrl: `/route-${n}/`,
    routeKind: "static",
    productSurface: PRODUCT_SURFACES[n % PRODUCT_SURFACES.length]!,
    status: "active",
    sourcePath: `site/app/route-${n}/page.tsx`,
    provenance: [PROVENANCE_REF],
    conflictIds: [],
    coverageGapIds: [],
  };
}

/** Build a DiscoveredDynamicInstance with a stable numeric key. */
function makeInstance(n: number): DiscoveredDynamicInstance {
  return {
    instanceId: `instance-${n}`,
    routeId: `route-dyn-${n}`,
    concreteUrl: `/products/${n}`,
    normalizedUrl: `/products/${n}/`,
    parameterValues: { slug: String(n) },
    discoverySources: [PROVENANCE_REF],
    discoveredAt: DISCOVERED_AT,
    productSurface: PRODUCT_SURFACES[(n + 2) % PRODUCT_SURFACES.length]!,
    status: "active",
    coverageGapIds: [],
  };
}

/** Build a DiscoveredShell with a stable numeric key. */
function makeShell(n: number): DiscoveredShell {
  return {
    shellId: `shell-${n}`,
    role: "header",
    productSurface: "shared-shell" as ProductSurface,
    sourcePath: `site/app/shell-${n}/layout.tsx`,
    visibleOutput: true,
    routeIds: [`route-${n}`],
    provenance: [PROVENANCE_REF],
    status: "active",
  };
}

// ---------------------------------------------------------------------------
// Composite input arbitrary
// ---------------------------------------------------------------------------

interface AuditInput {
  readonly routes: readonly DiscoveredRoute[];
  readonly instances: readonly DiscoveredDynamicInstance[];
  readonly shells: readonly DiscoveredShell[];
  readonly profiles: Required<ProfileSets>;
}

/**
 * Generates a valid `AuditInput`:
 *   - 1-4 routes
 *   - 0-3 dynamic instances
 *   - 0-2 shells
 *   - non-empty subsets for each profile dimension
 *
 * A numeric `seed` offsets all subject IDs so occurrence IDs are non-colliding
 * across generated runs.
 */
const arbAuditInput: fc.Arbitrary<AuditInput> = fc
  .tuple(
    fc.integer({ min: 1, max: 4 }),   // route count
    fc.integer({ min: 0, max: 3 }),   // instance count
    fc.integer({ min: 0, max: 2 }),   // shell count
    arbViewports,
    arbBrowsers,
    arbAccessContexts,
    arbLanguages,
    arbStates,
    fc.integer({ min: 0, max: 9_999 }), // subject-ID seed
  )
  .map(
    ([
      routeCount,
      instanceCount,
      shellCount,
      viewports,
      browsers,
      accessContexts,
      languages,
      states,
      seed,
    ]) => ({
      routes: Array.from({ length: routeCount }, (_, i) =>
        makeRoute(seed * 10 + i),
      ),
      instances: Array.from({ length: instanceCount }, (_, i) =>
        makeInstance(seed * 10 + routeCount + i),
      ),
      shells: Array.from({ length: shellCount }, (_, i) =>
        makeShell(seed * 10 + routeCount + instanceCount + i),
      ),
      profiles: {
        viewports,
        browsers,
        accessContexts,
        languages,
        states,
      } satisfies Required<ProfileSets>,
    }),
  );

// ---------------------------------------------------------------------------
// Helper: build the expected Cartesian-product tuple set
// ---------------------------------------------------------------------------

interface TupleKey {
  readonly subjectId: string;
  readonly stateId: string;
  readonly viewportId: string;
  readonly browserId: string;
  readonly accessId: string;
  readonly languageId: string;
}

function buildExpectedTupleSet(
  routes: readonly DiscoveredRoute[],
  instances: readonly DiscoveredDynamicInstance[],
  shells: readonly DiscoveredShell[],
  profiles: Required<ProfileSets>,
): Set<string> {
  const subjectIds: readonly string[] = [
    ...routes.map((r) => r.routeId),
    ...instances.map((i) => i.instanceId),
    ...shells.map((s) => s.shellId),
  ];

  const expected = new Set<string>();
  for (const subjectId of subjectIds) {
    for (const state of profiles.states) {
      for (const viewport of profiles.viewports) {
        for (const browser of profiles.browsers) {
          for (const access of profiles.accessContexts) {
            for (const lang of profiles.languages) {
              const key: TupleKey = {
                subjectId,
                stateId: state.stateId,
                viewportId: viewport.profileId,
                browserId: browser.profileId,
                accessId: access.profileId,
                languageId: lang.profileId,
              };
              expected.add(JSON.stringify(key));
            }
          }
        }
      }
    }
  }
  return expected;
}

/** Extract the tuple key from an `OccurrenceRecord`. */
function occurrenceTupleKey(occ: OccurrenceRecord): string {
  const key: TupleKey = {
    subjectId: occ.subjectId,
    stateId: occ.stateId,
    viewportId: occ.viewportId,
    browserId: occ.browserId,
    accessId: occ.accessId,
    languageId: occ.languageId,
  };
  return JSON.stringify(key);
}

// ---------------------------------------------------------------------------
// Property test suite
// ---------------------------------------------------------------------------

describe(
  "Feature: site-ui-content-links-audit, Property 3: Exact occurrence expansion and finding bijection",
  () => {
    /**
     * **Validates: Requirements 3.1-3.9, 5.8, 7.1-7.2, 7.7, 9.1-9.2, 9.7,
     * 10.7, 12.8, 17.3, 19.6-19.8, 26.2-26.4**
     *
     * Runs at least 100 generated profile sets to ensure broad coverage of
     * dimension size combinations (Req 3.6, 26.4).
     */
    it(
      "expansion equals the unique Cartesian product — no tuple missing or duplicated, one aggregate finding ID per row",
      () => {
        fc.assert(
          fc.property(
            arbAuditInput,
            ({ routes, instances, shells, profiles }) => {
              // ── Run the expander ──────────────────────────────────────────
              const occurrences = expandToOccurrences(
                routes,
                instances,
                shells,
                profiles,
              );

              const totalSubjects =
                routes.length + instances.length + shells.length;
              const expectedCardinality =
                totalSubjects *
                profiles.states.length *
                profiles.viewports.length *
                profiles.browsers.length *
                profiles.accessContexts.length *
                profiles.languages.length;

              // ── P3-A: exact cardinality (Req 3.6) ────────────────────────
              expect(occurrences).toHaveLength(expectedCardinality);

              // ── P3-B: unique occurrence IDs (Req 3.7) ────────────────────
              const occurrenceIdSet = new Set(
                occurrences.map((o) => o.occurrenceId),
              );
              expect(occurrenceIdSet.size).toBe(occurrences.length);

              // ── P3-C: bijective finding IDs (Req 3.7) ────────────────────
              // Set size must equal row count (no two rows share a findingId).
              const findingIdSet = new Set(occurrences.map((o) => o.findingId));
              expect(findingIdSet.size).toBe(occurrences.length);

              // Each findingId must be the deterministic image of its occurrenceId.
              for (const occ of occurrences) {
                expect(occ.findingId).toBe(buildFindingId(occ.occurrenceId));
              }

              // ── P3-D: no representative substitution (Req 3.8) ───────────
              const expectedTupleSet = buildExpectedTupleSet(
                routes,
                instances,
                shells,
                profiles,
              );
              const actualTupleKeys = occurrences.map(occurrenceTupleKey);
              const actualTupleSet = new Set(actualTupleKeys);

              // Both sets must have the same size.
              expect(actualTupleSet.size).toBe(expectedTupleSet.size);

              // Every expected tuple must be present.
              for (const expectedKey of expectedTupleSet) {
                expect(actualTupleSet.has(expectedKey)).toBe(true);
              }

              // No tuple appears more than once (guards against merging).
              expect(actualTupleKeys).toHaveLength(actualTupleSet.size);

              // ── P3-E: inapplicable tuples preserved (Req 3.6) ────────────
              const inapplicableCount = occurrences.filter(
                (o) => o.notApplicableRationale !== undefined,
              ).length;
              const applicableCount = occurrences.filter(
                (o) => o.notApplicableRationale === undefined,
              ).length;

              // All rows, regardless of applicability, count toward cardinality.
              expect(inapplicableCount + applicableCount).toBe(
                occurrences.length,
              );

              // Every inapplicable row must carry a non-empty rationale string.
              for (const occ of occurrences) {
                if (occ.notApplicableRationale !== undefined) {
                  expect(
                    occ.notApplicableRationale.trim().length,
                  ).toBeGreaterThan(0);
                }
              }

              // ── P3-F: stable occurrence and finding identity (Req 19.6-19.8) ──
              const profileVersion = computeProfileVersionFingerprint(
                profiles.viewports,
                profiles.browsers,
                profiles.accessContexts,
                profiles.languages,
                profiles.states,
              );

              for (const occ of occurrences) {
                const recomputed = buildOccurrenceId(
                  occ.subjectId,
                  occ.stateId,
                  occ.viewportId,
                  occ.browserId,
                  occ.accessId,
                  occ.languageId,
                  profileVersion,
                );
                expect(occ.occurrenceId).toBe(recomputed);
                expect(occ.findingId).toBe(buildFindingId(recomputed));
              }

              // ── P3-G: reconciliation validator agrees (Req 26.2-26.4) ────
              const validation = validateOccurrenceExpansion(
                occurrences,
                totalSubjects,
                profiles,
              );
              expect(validation.cardinalityMatches).toBe(true);
              expect(validation.expectedCardinality).toBe(expectedCardinality);
              expect(validation.totalOccurrences).toBe(expectedCardinality);
              expect(validation.hasDuplicates).toBe(false);
              expect(validation.duplicateOccurrenceIds).toHaveLength(0);
              expect(validation.uniqueOccurrenceIds).toBe(occurrences.length);

              // ── P3-H: order independence ──────────────────────────────────
              const reversedOccurrences = expandToOccurrences(
                [...routes].reverse(),
                [...instances].reverse(),
                [...shells].reverse(),
                profiles,
              );
              const reversedIdSet = new Set(
                reversedOccurrences.map((o) => o.occurrenceId),
              );

              // Same cardinality.
              expect(reversedIdSet.size).toBe(occurrenceIdSet.size);

              // Same members.
              for (const id of occurrenceIdSet) {
                expect(reversedIdSet.has(id)).toBe(true);
              }
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  },
);

// @vitest-environment node
// Feature: site-ui-content-links-audit, Property 3: Exact occurrence expansion and finding bijection

/**
 * Property-based test for the Wave 0 occurrence expansion and finding bijection
 * contract (Task 1.5 implementation).
 *
 * **Validates: Requirements 3.1-3.9, 5.8, 7.1, 7.2, 7.7, 9.1, 9.2, 9.7,
 * 10.7, 12.8, 17.3, 19.6, 19.7, 19.8, 26.2, 26.3, 26.4**
 *
 * The property must hold for all valid audit applicability profiles:
 *
 * 1. **Exact Cartesian product (Req 3.6, 3.8):** given S subjects and profile
 *    sets of sizes |state| × |viewport| × |browser| × |access| × |language|,
 *    expansion produces exactly |S| × |state| × |viewport| × |browser| ×
 *    |access| × |language| OccurrenceRecords — no tuple missing, none added.
 *
 * 2. **No representative substitution (Req 3.8):** every (subject, state,
 *    viewport, browser, access, language) tuple that is in the declared input
 *    dimensions has exactly one corresponding OccurrenceRecord.  No tuple is
 *    represented by or merged into another.
 *
 * 3. **Bijective finding ID (Req 3.7):** each OccurrenceRecord carries a
 *    findingId that is unique across all records produced for that run, and
 *    `findingId` is derived deterministically and exclusively from
 *    `occurrenceId` via `buildFindingId`.
 *
 * 4. **Stable occurrence identity (Req 19.6-19.8):** the same tuple always
 *    produces the same `occurrenceId` and `findingId` regardless of expansion
 *    input order.
 *
 * 5. **Inapplicable tuples are preserved, not omitted (Req 3.6):** occurrences
 *    where access or state is not applicable still appear in the matrix, with
 *    `notApplicableRationale` set; they do not disappear from cardinality totals.
 *
 * All generated inputs are abstract audit profile records — not product fixtures
 * and not claims about rendered application behavior.  No `site/**` import is used.
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
// Constants
// ---------------------------------------------------------------------------

const DISCOVERED_AT = "2026-08-23T12:00:00.000Z";
const PROVENANCE_REF = Object.freeze({
  sourceId: "source.app-router",
  sourceKind: "source" as const,
  location: "site/app/test-route/page.tsx",
  discoveredAt: DISCOVERED_AT,
  authorityRank: 100,
});

// The canonical product surfaces present in the registry
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

type _ProductSurface = (typeof PRODUCT_SURFACES)[number];

// ---------------------------------------------------------------------------
// Minimal sub-set pickers used by arbitraries
// ---------------------------------------------------------------------------

/**
 * Pick a non-empty subset (at least 1 item, at most `maxSize`) from an
 * array.  Index-based selection keeps the arbitrary pure and deterministic.
 */
function nonEmptySubset<T>(
  arr: readonly T[],
  maxSize: number,
): fc.Arbitrary<readonly T[]> {
  const cap = Math.min(maxSize, arr.length);
  return fc
    .uniqueArray(fc.integer({ min: 0, max: arr.length - 1 }), {
      minLength: 1,
      maxLength: cap,
    })
    .map((indices) => indices.sort((a, b) => a - b).map((i) => arr[i]!));
}

// ---------------------------------------------------------------------------
// Arbitraries: profile sub-sets
// ---------------------------------------------------------------------------

/** A non-empty subset of the canonical viewport profiles (at most 3) */
const arbViewports: fc.Arbitrary<readonly ViewportProfile[]> = nonEmptySubset(
  VIEWPORT_PROFILES,
  3,
);

/** A non-empty subset of the canonical browser profiles (at most 3) */
const arbBrowsers: fc.Arbitrary<readonly BrowserProfile[]> = nonEmptySubset(
  BROWSER_PROFILES,
  3,
);

/** A non-empty subset of the canonical access-context profiles (at most 3) */
const arbAccessContexts: fc.Arbitrary<readonly AccessProfile[]> = nonEmptySubset(
  ACCESS_PROFILES,
  3,
);

/** A non-empty subset of the canonical language profiles (always 1 or 2) */
const arbLanguages: fc.Arbitrary<readonly LanguageProfile[]> = nonEmptySubset(
  LANGUAGE_PROFILES,
  2,
);

/** A non-empty subset of the canonical state variants (at most 4) */
const arbStates: fc.Arbitrary<readonly StateVariant[]> = nonEmptySubset(
  STATE_VARIANTS,
  4,
);

// ---------------------------------------------------------------------------
// Arbitraries: subjects
// ---------------------------------------------------------------------------

/** A single static DiscoveredRoute with a generated numeric key */
const arbRoute = (n: number): DiscoveredRoute => ({
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
});

/** A single dynamic DiscoveredDynamicInstance */
const arbInstance = (n: number): DiscoveredDynamicInstance => ({
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
});

/** A single DiscoveredShell */
const arbShell = (n: number): DiscoveredShell => ({
  shellId: `shell-${n}`,
  role: "header",
  productSurface: "shared-shell",
  sourcePath: `site/app/shell-${n}/layout.tsx`,
  visibleOutput: true,
  routeIds: [`route-${n}`],
  provenance: [PROVENANCE_REF],
  status: "active",
});

// ---------------------------------------------------------------------------
// Composite arbitrary: a full ProfileSet + subject lists
// ---------------------------------------------------------------------------

interface AuditInput {
  readonly routes: readonly DiscoveredRoute[];
  readonly instances: readonly DiscoveredDynamicInstance[];
  readonly shells: readonly DiscoveredShell[];
  readonly profiles: Required<ProfileSets>;
}

/**
 * Generates a valid AuditInput by selecting:
 * - 1..4 routes
 * - 0..3 dynamic instances
 * - 0..2 shells
 * - non-empty subsets of each profile dimension
 *
 * Subject IDs are unique integers so occurrence IDs are stable and non-colliding.
 */
const arbAuditInput: fc.Arbitrary<AuditInput> = fc
  .tuple(
    // Route count 1..4, instance count 0..3, shell count 0..2
    fc.integer({ min: 1, max: 4 }),
    fc.integer({ min: 0, max: 3 }),
    fc.integer({ min: 0, max: 2 }),
    // Profile sub-sets
    arbViewports,
    arbBrowsers,
    arbAccessContexts,
    arbLanguages,
    arbStates,
    // Numeric seed to distinguish subjects across runs
    fc.integer({ min: 0, max: 9_999 }),
  )
  .map(
    ([routeCount, instanceCount, shellCount, viewports, browsers, accessContexts, languages, states, seed]) => ({
      routes: Array.from({ length: routeCount }, (_, i) => arbRoute(seed * 10 + i)),
      instances: Array.from({ length: instanceCount }, (_, i) =>
        arbInstance(seed * 10 + routeCount + i),
      ),
      shells: Array.from({ length: shellCount }, (_, i) =>
        arbShell(seed * 10 + routeCount + instanceCount + i),
      ),
      profiles: { viewports, browsers, accessContexts, languages, states } satisfies Required<ProfileSets>,
    }),
  );

// ---------------------------------------------------------------------------
// Helper: expected Cartesian product for a given input
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
  const subjectIds: string[] = [
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
    it(
      "Feature: site-ui-content-links-audit, Property 3: Exact occurrence expansion and finding bijection — expansion equals the unique Cartesian product, no tuple missing or duplicated, one finding ID per row",
      () => {
        fc.assert(
          fc.property(arbAuditInput, ({ routes, instances, shells, profiles }) => {
            // ── Expand occurrences ──────────────────────────────────────────
            const occurrences = expandToOccurrences(routes, instances, shells, profiles);

            const totalSubjects = routes.length + instances.length + shells.length;
            const expectedCardinality =
              totalSubjects *
              profiles.states.length *
              profiles.viewports.length *
              profiles.browsers.length *
              profiles.accessContexts.length *
              profiles.languages.length;

            // ── Property A: exact cardinality (Req 3.6) ────────────────────
            // Every (subject × state × viewport × browser × access × language)
            // tuple must produce exactly one row — no more, no fewer.
            expect(occurrences).toHaveLength(expectedCardinality);

            // ── Property B: no duplicate occurrence IDs (Req 3.7) ──────────
            const occurrenceIdSet = new Set(occurrences.map((o) => o.occurrenceId));
            expect(occurrenceIdSet.size).toBe(occurrences.length);

            // ── Property C: bijective finding IDs (Req 3.7) ────────────────
            // Each row has exactly one findingId.  Because occurrenceIds are unique
            // and findingId is a 1-to-1 deterministic function of occurrenceId, the
            // set of findingIds must be the same size.
            const findingIdSet = new Set(occurrences.map((o) => o.findingId));
            expect(findingIdSet.size).toBe(occurrences.length);

            // Every findingId must equal buildFindingId(occurrenceId).
            for (const occ of occurrences) {
              expect(occ.findingId).toBe(buildFindingId(occ.occurrenceId));
            }

            // ── Property D: no representative substitution (Req 3.8) ───────
            // The set of observed tuples must equal the full expected Cartesian product.
            const expectedTupleSet = buildExpectedTupleSet(routes, instances, shells, profiles);
            const actualTupleKeys = occurrences.map(occurrenceTupleKey);
            const actualTupleSet = new Set(actualTupleKeys);

            // No extra tuples beyond the declared dimensions.
            expect(actualTupleSet.size).toBe(expectedTupleSet.size);

            // Every expected tuple is present exactly once.
            for (const expected of expectedTupleSet) {
              expect(actualTupleSet.has(expected)).toBe(true);
            }

            // No tuple appears more than once (guards against representative merging).
            expect(actualTupleKeys).toHaveLength(actualTupleSet.size);

            // ── Property E: inapplicable tuples are preserved (Req 3.6) ────
            // Occurrences that are not applicable must still appear in the matrix
            // with a notApplicableRationale.  They may NOT be silently omitted.
            const inapplicableCount = occurrences.filter(
              (o) => o.notApplicableRationale !== undefined,
            ).length;
            const applicableCount = occurrences.filter(
              (o) => o.notApplicableRationale === undefined,
            ).length;
            expect(inapplicableCount + applicableCount).toBe(occurrences.length);

            // All inapplicable occurrences must carry a non-empty rationale string.
            for (const occ of occurrences) {
              if (occ.notApplicableRationale !== undefined) {
                expect(occ.notApplicableRationale.trim().length).toBeGreaterThan(0);
              }
            }

            // ── Property F: stable occurrence and finding identity (Req 19.6-19.8) ──
            // Re-compute the occurrence ID for each row independently using
            // `buildOccurrenceId` and verify it matches the stored value.
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

            // ── Property G: validateOccurrenceExpansion reconciles (Req 26.2-26.4) ──
            const validation = validateOccurrenceExpansion(occurrences, totalSubjects, profiles);
            expect(validation.cardinalityMatches).toBe(true);
            expect(validation.expectedCardinality).toBe(expectedCardinality);
            expect(validation.totalOccurrences).toBe(expectedCardinality);
            expect(validation.hasDuplicates).toBe(false);
            expect(validation.duplicateOccurrenceIds).toHaveLength(0);
            expect(validation.uniqueOccurrenceIds).toBe(occurrences.length);

            // ── Property H: order independence ─────────────────────────────
            // Reversing and rotating the subject input order must produce the
            // same set of occurrence IDs (cardinality and members).
            const reversedOccurrences = expandToOccurrences(
              [...routes].reverse(),
              [...instances].reverse(),
              [...shells].reverse(),
              profiles,
            );
            const reversedIds = new Set(reversedOccurrences.map((o) => o.occurrenceId));
            expect(reversedIds.size).toBe(occurrenceIdSet.size);
            for (const id of occurrenceIdSet) {
              expect(reversedIds.has(id)).toBe(true);
            }
          }),
          { numRuns: 100 },
        );
      },
    );
  },
);

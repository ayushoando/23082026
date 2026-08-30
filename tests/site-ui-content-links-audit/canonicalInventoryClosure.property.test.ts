// @vitest-environment node
// Feature: site-ui-content-links-audit, Property 1: Canonical inventory closure

/**
 * Property-based test for the Wave 0 canonical inventory closure contract.
 *
 * Validates: Requirements 1.1-1.8, 2.1, 2.4, 2.6, 19.1-19.4, 26.1
 *
 * A candidate is closed by exactly one classification:
 * - canonical: a valid status with no explicit exception link;
 * - exclusion: an exclusion reference resolves to an Exclusion Record;
 * - gap: every coverage-gap reference resolves to a Coverage Gap;
 * - conflict: every conflict reference resolves to a conflict record.
 *
 * Explicit exception links prevent a candidate from also being counted as
 * canonical. Dangling references and duplicate candidate identities therefore
 * remain visible instead of being silently treated as closed.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import type {
  CanonicalDiscoveryResult,
  DiscoveredDynamicInstance,
  DiscoveredRoute,
  DiscoveredShell,
  DiscoveryConflict,
  DiscoveryCoverageGap,
  DiscoveryExclusion,
  ProductSurface,
  ProvenanceReference,
  RouteKind,
  RouteStatus,
  ShellRole,
} from "../../scripts/site-ui-content-links-audit";

const DISCOVERED_AT = "2026-08-23T12:00:00.000Z";

const ROUTE_STATUSES: readonly RouteStatus[] = [
  "active",
  "redirected",
  "absent",
  "legacy",
  "local-only",
  "protected",
  "unreachable",
];

const DYNAMIC_INSTANCE_STATUSES: readonly DiscoveredDynamicInstance["status"][] = [
  "active",
  "protected",
  "unreachable",
];

const SHELL_STATUSES: readonly DiscoveredShell["status"][] = [
  "active",
  "legacy",
  "local-only",
  "unreachable",
];

const PRODUCT_SURFACES: readonly ProductSurface[] = [
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
];

const SHELL_ROLES: readonly ShellRole[] = [
  "layout",
  "header",
  "footer",
  "banner",
  "dialog",
  "consent",
  "error-boundary",
  "loading-boundary",
  "not-found-boundary",
  "provider-output",
  "offline-shell",
];

type Classification = "canonical" | "exclusion" | "gap" | "conflict";
type RouteClassification = Classification;
type DynamicClassification = "canonical" | "gap";

const ROUTE_CLASSIFICATIONS: readonly RouteClassification[] = [
  "canonical",
  "exclusion",
  "gap",
  "conflict",
];

const DYNAMIC_CLASSIFICATIONS: readonly DynamicClassification[] = [
  "canonical",
  "gap",
];

interface ClassificationResult {
  readonly classifications: readonly Classification[];
  readonly unresolvedReferences: readonly string[];
}

interface ClassifiedCandidate {
  readonly key: string;
  readonly classifications: readonly Classification[];
  readonly unresolvedReferences: readonly string[];
}

interface GeneratedCandidateSet {
  readonly result: CanonicalDiscoveryResult;
}

function uniqueNumbers(
  minLength: number,
  maxLength: number,
): fc.Arbitrary<number[]> {
  return fc.uniqueArray(fc.integer({ min: 0, max: 99_999 }), {
    minLength,
    maxLength,
  });
}

function fixedArray<T>(
  arbitrary: fc.Arbitrary<T>,
  length: number,
): fc.Arbitrary<T[]> {
  return fc.array(arbitrary, { minLength: length, maxLength: length });
}

function provenance(location: string): ProvenanceReference {
  return {
    sourceId: "source.app-router",
    sourceKind: "source",
    location,
    discoveredAt: DISCOVERED_AT,
    authorityRank: 100,
  };
}

function routeClassificationModes(
  routeCount: number,
): fc.Arbitrary<RouteClassification[]> {
  const extraCount = routeCount - ROUTE_CLASSIFICATIONS.length;
  return fixedArray(
    fc.constantFrom<RouteClassification>(
      "canonical",
      "exclusion",
      "gap",
      "conflict",
    ),
    extraCount,
  ).map((extra) => [...ROUTE_CLASSIFICATIONS, ...extra]);
}

function dynamicClassificationModes(
  instanceCount: number,
): fc.Arbitrary<DynamicClassification[]> {
  const extraCount = instanceCount - DYNAMIC_CLASSIFICATIONS.length;
  return fixedArray(
    fc.constantFrom<DynamicClassification>("canonical", "gap"),
    extraCount,
  ).map((extra) => [...DYNAMIC_CLASSIFICATIONS, ...extra]);
}

function makeConflict(conflictId: string, subjectKey: string): DiscoveryConflict {
  return {
    conflictId,
    subjectKey,
    claimField: "productSurface",
    claims: [
      {
        sourceId: "source.app-router",
        authorityRank: 100,
        value: "marketing",
      },
      {
        sourceId: "source.route-contract",
        authorityRank: 40,
        value: "catalog-configurator",
      },
    ],
    resolution: "higher-authority-selected",
    selectedSourceId: "source.app-router",
  };
}

function makeCoverageGap(gapId: string, routeId: string): DiscoveryCoverageGap {
  return {
    gapId,
    routeId,
    parameterDomain: "[id]",
    reason: "The parameter source is unavailable to static inspection.",
    proposedResolution: "Provide the approved read-only parameter source.",
  };
}

function makeExclusion(exclusionId: string, routeId: string): DiscoveryExclusion {
  return {
    exclusionId,
    routeId,
    reason: "The candidate is outside the current audit scope.",
    reconsiderationTrigger: "The audit scope or route ownership changes.",
  };
}

function buildCandidateSet(
  routeNumbers: readonly number[],
  instanceNumbers: readonly number[],
  shellNumbers: readonly number[],
  routeModes: readonly RouteClassification[],
  dynamicModes: readonly DynamicClassification[],
  shellStatuses: readonly DiscoveredShell["status"][],
): GeneratedCandidateSet {
  const exclusions: DiscoveryExclusion[] = [];
  const coverageGaps: DiscoveryCoverageGap[] = [];
  const conflicts: DiscoveryConflict[] = [];

  const routes: DiscoveredRoute[] = routeNumbers.map((number, index) => {
    const routeId = `route-${number}`;
    const mode = routeModes[index]!;
    const routeKind: RouteKind = index % 2 === 0 ? "static" : "dynamic";
    const exclusionId = mode === "exclusion" ? `exclusion-${routeId}` : undefined;
    const gapId = mode === "gap" ? `gap-${routeId}` : undefined;
    const conflictId = mode === "conflict" ? `conflict-${routeId}` : undefined;

    if (exclusionId) exclusions.push(makeExclusion(exclusionId, routeId));
    if (gapId) coverageGaps.push(makeCoverageGap(gapId, routeId));
    if (conflictId) conflicts.push(makeConflict(conflictId, routeId));

    return {
      routeId,
      pattern: `/${routeId}`,
      ...(routeKind === "static" ? { concreteUrl: `/${routeId}/` } : {}),
      routeKind,
      productSurface: PRODUCT_SURFACES[index % PRODUCT_SURFACES.length]!,
      status: ROUTE_STATUSES[index % ROUTE_STATUSES.length]!,
      sourcePath: `site/app/${routeId}/page.tsx`,
      provenance: [provenance(`site/app/${routeId}/page.tsx`)],
      conflictIds: conflictId ? [conflictId] : [],
      ...(exclusionId ? { exclusionId } : {}),
      coverageGapIds: gapId ? [gapId] : [],
    };
  });

  const dynamicInstances: DiscoveredDynamicInstance[] = instanceNumbers.map(
    (number, index) => {
      const instanceId = `instance-${number}`;
      const routeId = routes[index % routes.length]!.routeId;
      const mode = dynamicModes[index]!;
      const gapId = mode === "gap" ? `gap-${instanceId}` : undefined;

      if (gapId) coverageGaps.push(makeCoverageGap(gapId, routeId));

      return {
        instanceId,
        routeId,
        concreteUrl: `/${routeId}/${number}`,
        normalizedUrl: `/${routeId}/${number}/`,
        parameterValues: { id: String(number) },
        discoverySources: [provenance(`site/app/${routeId}/page.tsx#static-params`)],
        discoveredAt: DISCOVERED_AT,
        productSurface: PRODUCT_SURFACES[index % PRODUCT_SURFACES.length]!,
        status:
          mode === "gap"
            ? "gapped"
            : DYNAMIC_INSTANCE_STATUSES[index % DYNAMIC_INSTANCE_STATUSES.length]!,
        coverageGapIds: gapId ? [gapId] : [],
      };
    },
  );

  const shells: DiscoveredShell[] = shellNumbers.map((number, index) => ({
    shellId: `shell-${number}`,
    role: SHELL_ROLES[index % SHELL_ROLES.length]!,
    productSurface: "shared-shell",
    sourcePath: `site/app/shell-${number}/layout.tsx`,
    visibleOutput: true,
    routeIds: [routes[index % routes.length]!.routeId],
    provenance: [provenance(`site/app/shell-${number}/layout.tsx`)],
    status: shellStatuses[index]!,
  }));

  return {
    result: {
      routes,
      dynamicInstances,
      shells,
      conflicts,
      coverageGaps,
      exclusions,
      discoveredAt: DISCOVERED_AT,
    },
  };
}

const arbGeneratedCandidateSet: fc.Arbitrary<GeneratedCandidateSet> = uniqueNumbers(
  ROUTE_CLASSIFICATIONS.length,
  8,
)
  .chain((routeNumbers) =>
    uniqueNumbers(DYNAMIC_CLASSIFICATIONS.length, 6).chain((instanceNumbers) =>
      uniqueNumbers(1, 4).chain((shellNumbers) =>
        fc
          .tuple(
            routeClassificationModes(routeNumbers.length),
            dynamicClassificationModes(instanceNumbers.length),
            fixedArray(
              fc.constantFrom<DiscoveredShell["status"]>(
                "active",
                "legacy",
                "local-only",
                "unreachable",
              ),
              shellNumbers.length,
            ),
          )
          .map(([routeModes, dynamicModes, shellStatuses]) =>
            buildCandidateSet(
              routeNumbers,
              instanceNumbers,
              shellNumbers,
              routeModes,
              dynamicModes,
              shellStatuses,
            ),
          ),
      ),
    ),
  );

const VALID_ROUTE_STATUSES = new Set<RouteStatus>(ROUTE_STATUSES);
const VALID_DYNAMIC_STATUSES = new Set<DiscoveredDynamicInstance["status"]>([
  "active",
  "protected",
  "unreachable",
  "gapped",
]);
const VALID_SHELL_STATUSES = new Set<DiscoveredShell["status"]>(SHELL_STATUSES);

function classifyRoute(
  route: DiscoveredRoute,
  result: CanonicalDiscoveryResult,
): ClassificationResult {
  const classifications: Classification[] = [];
  const unresolvedReferences: string[] = [];
  const exclusionIds = new Set(result.exclusions.map(({ exclusionId }) => exclusionId));
  const gapIds = new Set(result.coverageGaps.map(({ gapId }) => gapId));
  const conflictIds = new Set(result.conflicts.map(({ conflictId }) => conflictId));
  const hasExplicitReference =
    route.exclusionId !== undefined ||
    route.coverageGapIds.length > 0 ||
    route.conflictIds.length > 0;

  if (route.exclusionId !== undefined) {
    if (exclusionIds.has(route.exclusionId)) {
      classifications.push("exclusion");
    } else {
      unresolvedReferences.push(`exclusion:${route.exclusionId}`);
    }
  }

  if (route.coverageGapIds.length > 0) {
    if (route.coverageGapIds.every((gapId) => gapIds.has(gapId))) {
      classifications.push("gap");
    } else {
      unresolvedReferences.push(
        ...route.coverageGapIds
          .filter((gapId) => !gapIds.has(gapId))
          .map((gapId) => `gap:${gapId}`),
      );
    }
  }

  if (route.conflictIds.length > 0) {
    if (route.conflictIds.every((conflictId) => conflictIds.has(conflictId))) {
      classifications.push("conflict");
    } else {
      unresolvedReferences.push(
        ...route.conflictIds
          .filter((conflictId) => !conflictIds.has(conflictId))
          .map((conflictId) => `conflict:${conflictId}`),
      );
    }
  }

  if (!hasExplicitReference && VALID_ROUTE_STATUSES.has(route.status)) {
    classifications.push("canonical");
  }

  return { classifications, unresolvedReferences };
}

function classifyDynamicInstance(
  instance: DiscoveredDynamicInstance,
  result: CanonicalDiscoveryResult,
): ClassificationResult {
  const classifications: Classification[] = [];
  const unresolvedReferences: string[] = [];
  const gapIds = new Set(result.coverageGaps.map(({ gapId }) => gapId));

  if (instance.coverageGapIds.length > 0) {
    if (instance.coverageGapIds.every((gapId) => gapIds.has(gapId))) {
      classifications.push("gap");
    } else {
      unresolvedReferences.push(
        ...instance.coverageGapIds
          .filter((gapId) => !gapIds.has(gapId))
          .map((gapId) => `gap:${gapId}`),
      );
    }
  } else if (
    instance.status !== "gapped" &&
    VALID_DYNAMIC_STATUSES.has(instance.status)
  ) {
    classifications.push("canonical");
  }

  return { classifications, unresolvedReferences };
}

function classifyShell(shell: DiscoveredShell): ClassificationResult {
  return {
    classifications: VALID_SHELL_STATUSES.has(shell.status) ? ["canonical"] : [],
    unresolvedReferences: [],
  };
}

function classifyCandidates(
  result: CanonicalDiscoveryResult,
): readonly ClassifiedCandidate[] {
  return [
    ...result.routes.map((route) => ({
      key: `route:${route.routeId}`,
      ...classifyRoute(route, result),
    })),
    ...result.dynamicInstances.map((instance) => ({
      key: `instance:${instance.instanceId}`,
      ...classifyDynamicInstance(instance, result),
    })),
    ...result.shells.map((shell) => ({
      key: `shell:${shell.shellId}`,
      ...classifyShell(shell),
    })),
  ];
}

describe(
  "Feature: site-ui-content-links-audit, Property 1: Canonical inventory closure",
  () => {
    it(
      "Feature: site-ui-content-links-audit, Property 1: Canonical inventory closure — every candidate has exactly one linked classification",
      () => {
        fc.assert(
          fc.property(arbGeneratedCandidateSet, ({ result }) => {
            const candidates = classifyCandidates(result);
            const candidateKeys = candidates.map(({ key }) => key);
            const uniqueCandidateKeys = new Set(candidateKeys);

            expect(uniqueCandidateKeys.size).toBe(candidateKeys.length);
            expect(candidates.length).toBe(
              result.routes.length +
                result.dynamicInstances.length +
                result.shells.length,
            );

            const unclassifiedCandidates = candidates.filter(
              ({ classifications, unresolvedReferences }) =>
                classifications.length !== 1 || unresolvedReferences.length > 0,
            );

            expect(unclassifiedCandidates).toHaveLength(0);

            for (const candidate of candidates) {
              expect(candidate.classifications).toHaveLength(1);
              expect(candidate.unresolvedReferences).toHaveLength(0);
              expect([
                "canonical",
                "exclusion",
                "gap",
                "conflict",
              ]).toContain(candidate.classifications[0]);
            }

            const routeClassifications = candidates
              .filter(({ key }) => key.startsWith("route:"))
              .map(({ classifications }) => classifications[0]);
            expect(new Set(routeClassifications)).toEqual(
              new Set(ROUTE_CLASSIFICATIONS),
            );

            const dynamicClassifications = candidates
              .filter(({ key }) => key.startsWith("instance:"))
              .map(({ classifications }) => classifications[0]);
            expect(new Set(dynamicClassifications)).toEqual(
              new Set(DYNAMIC_CLASSIFICATIONS),
            );
          }),
          { numRuns: 100 },
        );
      },
    );
  },
);

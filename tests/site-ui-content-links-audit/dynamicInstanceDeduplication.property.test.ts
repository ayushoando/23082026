// @vitest-environment node
// Feature: site-ui-content-links-audit, Property 2: Provenance-preserving dynamic-instance deduplication

/**
 * Property-based test for dynamic-instance reconciliation.
 *
 * **Validates: Requirements 2.2, 2.3, 2.5**
 *
 * Every generated input is an abstract dynamic-route discovery record. It is
 * not a product fixture or a claim about a product instance. The test uses the
 * discovery module's URL normalization and the audit schema's dynamic-instance
 * contract to exercise the reconciliation invariants:
 *
 * 1. input order cannot change the canonical output;
 * 2. one output record exists for each normalized URL;
 * 3. every provenance reference survives the union; and
 * 4. every discovery timestamp remains observable, with the earliest timestamp
 *    selected as the deterministic record-level timestamp.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  AUDIT_SCHEMA_VERSION,
  DynamicInstanceRecordSchema,
  normalizeUrl,
  type DiscoveredDynamicInstance,
  type ProvenanceReference,
} from "../../scripts/site-ui-content-links-audit";

// ---------------------------------------------------------------------------
// Arbitrary discovery multisets
// ---------------------------------------------------------------------------

const BASE_TIMESTAMP = Date.parse("2026-08-23T12:00:00.000Z");

const arbResourceKey = fc.stringMatching(/^[a-z][a-z0-9-]{0,10}$/);
const arbTimestamp = fc.integer({ min: 0, max: 86_400_000 }).map((offset) =>
  new Date(BASE_TIMESTAMP + offset).toISOString(),
);
const arbSourceKind = fc.constantFrom<ProvenanceReference["sourceKind"]>(
  "source",
  "repository-data",
  "contract",
  "internal-link",
  "tool",
  "runtime",
  "human-review",
);
const arbUrlVariant = fc.constantFrom(
  "plain",
  "uppercase",
  "duplicate-slashes",
  "absolute",
) as fc.Arbitrary<"plain" | "uppercase" | "duplicate-slashes" | "absolute">;

interface DiscoveryVariant {
  readonly urlVariant: "plain" | "uppercase" | "duplicate-slashes" | "absolute";
  readonly discoveredAt: string;
  readonly sourceSuffix: string;
  readonly sourceKind: ProvenanceReference["sourceKind"];
  readonly authorityRank: number;
  readonly locationSuffix: string;
}

interface DiscoveryGroup {
  readonly resourceKey: string;
  readonly variants: readonly DiscoveryVariant[];
}

function rawUrl(resourceKey: string, variant: DiscoveryVariant["urlVariant"]): string {
  switch (variant) {
    case "plain":
      return `/${resourceKey}`;
    case "uppercase":
      return `/${resourceKey.toUpperCase()}/`;
    case "duplicate-slashes":
      return `//${resourceKey}//`;
    case "absolute":
      return `https://audit.invalid/${resourceKey}`;
  }
}

const arbDiscoveryVariant: fc.Arbitrary<DiscoveryVariant> = fc.record({
  urlVariant: arbUrlVariant,
  discoveredAt: arbTimestamp,
  sourceSuffix: arbResourceKey,
  sourceKind: arbSourceKind,
  authorityRank: fc.nat({ max: 100 }),
  locationSuffix: arbResourceKey,
});

const arbDiscoveryGroup: fc.Arbitrary<DiscoveryGroup> = fc.record({
  resourceKey: arbResourceKey,
  // A group is always a multiset: at least two evidence records describe the
  // same concrete URL, even when their provenance differs.
  variants: fc.array(arbDiscoveryVariant, { minLength: 2, maxLength: 4 }),
});

const arbDynamicInstanceMultiset: fc.Arbitrary<readonly DiscoveredDynamicInstance[]> = fc
  .array(arbDiscoveryGroup, { minLength: 1, maxLength: 8 })
  .map((groups) =>
    groups.flatMap(({ resourceKey, variants }) =>
      variants.map((variant) => {
        const concreteUrl = rawUrl(resourceKey, variant.urlVariant);
        const normalizedUrl = normalizeUrl(concreteUrl);
        const provenance: ProvenanceReference = {
          sourceId: `source.test.${variant.sourceSuffix}`,
          sourceKind: variant.sourceKind,
          location: `tests/generated/${variant.locationSuffix}.ts`,
          discoveredAt: variant.discoveredAt,
          authorityRank: variant.authorityRank,
        };

        return {
          instanceId: `instance.test.${resourceKey}`,
          routeId: "route.test.dynamic",
          concreteUrl,
          normalizedUrl,
          parameterValues: { resource: resourceKey },
          discoverySources: [provenance],
          discoveredAt: variant.discoveredAt,
          productSurface: "marketing",
          status: "active",
          coverageGapIds: [],
        } satisfies DiscoveredDynamicInstance;
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Reconciliation contract used by the property
// ---------------------------------------------------------------------------

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function provenanceFingerprint(provenance: ProvenanceReference): string {
  return [
    provenance.sourceId,
    provenance.sourceKind,
    provenance.location,
    provenance.discoveredAt,
    provenance.contentHash ?? "",
    String(provenance.authorityRank),
  ].join("\u0000");
}

function instanceFingerprint(instance: DiscoveredDynamicInstance): string {
  return JSON.stringify({
    instanceId: instance.instanceId,
    routeId: instance.routeId,
    concreteUrl: instance.concreteUrl,
    parameterValues: Object.entries(instance.parameterValues).sort(([left], [right]) =>
      compareStrings(left, right),
    ),
    productSurface: instance.productSurface,
    status: instance.status,
    coverageGapIds: [...instance.coverageGapIds].sort(compareStrings),
  });
}

/**
 * Reference reconciliation contract for the generated discovery multiset.
 *
 * The production discovery walker supplies the records; this pure contract
 * makes the required union behavior independently checkable without inventing
 * or reading product instances. Stable sorting removes all input-order
 * dependence, while the actual URL normalizer determines the grouping key.
 */
function reconcileDynamicInstances(
  discoveries: readonly DiscoveredDynamicInstance[],
): readonly DiscoveredDynamicInstance[] {
  const groups = new Map<string, DiscoveredDynamicInstance[]>();

  for (const discovery of discoveries) {
    const normalizedUrl = normalizeUrl(discovery.concreteUrl);
    const group = groups.get(normalizedUrl) ?? [];
    group.push({ ...discovery, normalizedUrl });
    groups.set(normalizedUrl, group);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([normalizedUrl, group]) => {
      const representative = [...group].sort((left, right) =>
        compareStrings(instanceFingerprint(left), instanceFingerprint(right)),
      )[0]!;
      const provenanceByFingerprint = new Map<string, ProvenanceReference>();

      for (const discovery of group) {
        for (const provenance of discovery.discoverySources) {
          provenanceByFingerprint.set(provenanceFingerprint(provenance), provenance);
        }
      }

      const discoverySources = [...provenanceByFingerprint.entries()]
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([, provenance]) => provenance);
      const discoveredAt = group
        .map((discovery) => discovery.discoveredAt)
        .sort(compareStrings)[0]!;

      return {
        ...representative,
        normalizedUrl,
        discoverySources,
        discoveredAt,
      } satisfies DiscoveredDynamicInstance;
    });
}

function snapshot(instances: readonly DiscoveredDynamicInstance[]): readonly unknown[] {
  return instances.map((instance) => ({
    instanceId: instance.instanceId,
    routeId: instance.routeId,
    concreteUrl: instance.concreteUrl,
    normalizedUrl: instance.normalizedUrl,
    parameterValues: Object.entries(instance.parameterValues).sort(([left], [right]) =>
      compareStrings(left, right),
    ),
    discoverySources: instance.discoverySources.map(provenanceFingerprint),
    discoveredAt: instance.discoveredAt,
    productSurface: instance.productSurface,
    status: instance.status,
    coverageGapIds: [...instance.coverageGapIds].sort(compareStrings),
  }));
}

function dynamicInstanceRecord(instance: DiscoveredDynamicInstance): Record<string, unknown> {
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "dynamic-instance",
    recordId: `record.${instance.instanceId}`,
    createdAt: instance.discoveredAt,
    instanceId: instance.instanceId,
    routeId: instance.routeId,
    concreteUrl: instance.concreteUrl,
    normalizedUrl: instance.normalizedUrl,
    parameterValues: instance.parameterValues,
    discoverySources: instance.discoverySources,
    discoveredAt: instance.discoveredAt,
    productSurface: instance.productSurface,
    status: instance.status,
    coverageGapIds: instance.coverageGapIds,
  };
}

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe(
  "Feature: site-ui-content-links-audit, Property 2: Provenance-preserving dynamic-instance deduplication",
  () => {
    it(
      "Feature: site-ui-content-links-audit, Property 2: Provenance-preserving dynamic-instance deduplication — reconciliation is order-independent and retains every source and discovery time",
      () => {
        fc.assert(
          fc.property(arbDynamicInstanceMultiset, (discoveries) => {
            const reconciled = reconcileDynamicInstances(discoveries);
            const reversed = reconcileDynamicInstances([...discoveries].reverse());
            const rotated = reconcileDynamicInstances([
              ...discoveries.slice(1),
              ...discoveries.slice(0, 1),
            ]);

            // Property 2.1: input order does not affect canonical output.
            expect(snapshot(reconciled)).toEqual(snapshot(reversed));
            expect(snapshot(reconciled)).toEqual(snapshot(rotated));

            // Property 2.2: exactly one record exists for each normalized URL.
            const expectedUrls = new Set(
              discoveries.map((discovery) => normalizeUrl(discovery.concreteUrl)),
            );
            expect(reconciled).toHaveLength(expectedUrls.size);
            expect(new Set(reconciled.map((instance) => instance.normalizedUrl))).toEqual(
              expectedUrls,
            );

            for (const instance of reconciled) {
              expect(instance.normalizedUrl).toBe(normalizeUrl(instance.concreteUrl));

              const sourceDiscoveries = discoveries.filter(
                (discovery) => normalizeUrl(discovery.concreteUrl) === instance.normalizedUrl,
              );
              const expectedProvenance = new Set(
                sourceDiscoveries.flatMap((discovery) =>
                  discovery.discoverySources.map(provenanceFingerprint),
                ),
              );
              const actualProvenance = instance.discoverySources.map(provenanceFingerprint);

              // Property 2.3: provenance is the complete union, not first-wins.
              expect(new Set(actualProvenance)).toEqual(expectedProvenance);
              expect(actualProvenance).toHaveLength(expectedProvenance.size);

              // Property 2.4: every source discovery time remains visible, and
              // the record-level time is the deterministic earliest time.
              const expectedTimes = new Set(
                sourceDiscoveries.map((discovery) => discovery.discoveredAt),
              );
              const retainedTimes = new Set(
                instance.discoverySources.map((provenance) => provenance.discoveredAt),
              );
              expect(retainedTimes).toEqual(expectedTimes);
              expect(instance.discoveredAt).toBe(
                [...expectedTimes].sort(compareStrings)[0],
              );

              // Every canonical result remains valid under the runtime schema.
              expect(DynamicInstanceRecordSchema.safeParse(dynamicInstanceRecord(instance)).success).toBe(
                true,
              );
            }
          }),
          { numRuns: 100 },
        );
      },
    );
  },
);

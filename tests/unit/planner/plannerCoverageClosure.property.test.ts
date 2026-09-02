// @vitest-environment node
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import fc from "fast-check";
import { afterEach, describe, expect, it } from "vitest";

import {
  WORKFLOW_STAGE_ORDER,
  type CoverageDimensions,
  type CoverageItem,
  type PlannerAuditDataset,
  type RequirementRef,
} from "../../../plans/planner-comprehensive-audit/auditModel";
import { validateAuditDataset } from "../../../plans/planner-comprehensive-audit/auditValidators";
import {
  collectPlannerCoverage,
  type PlannerCoverageInventory,
} from "../../../plans/planner-comprehensive-audit/coverageCollector";

const PROPERTY_REQUIREMENTS = [
  "1.1",
  "1.2",
  "1.3",
  "1.4",
] as const satisfies readonly RequirementRef[];
const PROPERTY_SEED = 20260823;
const PROPERTY_RUNS = 40;
const WORKFLOW_ID = "workflow:generated-coverage-closure";
const FINDING_ID = "finding:generated-coverage-closure";
const VALIDATION_ID = "validation:generated-coverage-closure";

const temporaryRoots: string[] = [];

interface GeneratedCoverageTree {
  routeSegments: string[];
  reachableNames: string[];
  unreachableNames: string[];
}

const dimensions: CoverageDimensions = {
  viewportClasses: ["desktop", "tablet", "phone"],
  inputMethods: ["pointer", "touch", "keyboard"],
  stateIds: ["default", "loading", "success", "server-error"],
  securityControlIds: ["authentication", "request-validation"],
  persistenceModes: ["disk", "supabase"],
};

const safeName = fc.stringMatching(/^[a-z][a-z0-9]{0,7}$/);
const coverageTreeArbitrary: fc.Arbitrary<GeneratedCoverageTree> = fc.record({
  routeSegments: fc.uniqueArray(safeName, { maxLength: 3 }),
  reachableNames: fc.uniqueArray(safeName, { minLength: 1, maxLength: 5 }),
  unreachableNames: fc.uniqueArray(safeName, { maxLength: 3 }),
});

function writeFixture(
  repositoryRoot: string,
  repositoryPath: string,
  source: string,
): void {
  const absolutePath = path.join(repositoryRoot, ...repositoryPath.split("/"));
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, source, "utf8");
}

function createGeneratedRepository(tree: GeneratedCoverageTree): {
  repositoryRoot: string;
  expectedPaths: string[];
} {
  const repositoryRoot = mkdtempSync(
    path.join(tmpdir(), "planner-coverage-closure-"),
  );
  temporaryRoots.push(repositoryRoot);

  const routePaths = [
    "site/app/ooplanner/page.tsx",
    ...tree.routeSegments.map(
      (segment) => `site/app/ooplanner/${segment}/page.tsx`,
    ),
  ];
  for (const routePath of routePaths) {
    writeFixture(
      repositoryRoot,
      routePath,
      'export { rootValue } from "@/features/Planner/RootView";\n',
    );
  }

  const reachablePaths = tree.reachableNames.map(
    (name) => `site/features/Planner/nodes/${name}.ts`,
  );
  writeFixture(
    repositoryRoot,
    "site/features/Planner/RootView.ts",
    `export { value as rootValue } from "./nodes/${tree.reachableNames[0]}";\n`,
  );
  reachablePaths.forEach((reachablePath, index) => {
    const nextName = tree.reachableNames[index + 1];
    writeFixture(
      repositoryRoot,
      reachablePath,
      nextName
        ? `export { value } from "./${nextName}";\n`
        : "export const value = true;\n",
    );
  });

  const unreachablePaths = tree.unreachableNames.map(
    (name) => `site/components/Planner/${name}Panel.tsx`,
  );
  for (const unreachablePath of unreachablePaths) {
    writeFixture(
      repositoryRoot,
      unreachablePath,
      "export function Panel(): null { return null; }\n",
    );
  }

  const classifiedPaths = [
    "site/lib/Planner/legacy/oldPlanner.ts",
    "site/lib/Planner/generated/plannerCache.ts",
    "site/platform/Planner/data/projects/local.json",
  ];
  writeFixture(
    repositoryRoot,
    classifiedPaths[0],
    "export const oldPlannerValue = true;\n",
  );
  writeFixture(
    repositoryRoot,
    classifiedPaths[1],
    "export const generatedPlannerValue = true;\n",
  );
  writeFixture(repositoryRoot, classifiedPaths[2], "{}\n");

  return {
    repositoryRoot,
    expectedPaths: [
      ...routePaths,
      "site/features/Planner/RootView.ts",
      ...reachablePaths,
      ...unreachablePaths,
      ...classifiedPaths,
    ].sort(),
  };
}

function buildCoverageClosureDataset(
  inventory: PlannerCoverageInventory,
): PlannerAuditDataset {
  const routeIds = inventory.coverageItems
    .filter((item) => item.kind === "route")
    .map((item) => item.id);
  const firstRoutePath = inventory.coverageItems.find(
    (item) => item.kind === "route",
  )?.path;
  if (!firstRoutePath || routeIds.length === 0) {
    throw new Error("Generated coverage tree must contain a Planner route.");
  }

  const sourcePaths = inventory.coverageItems.map((item) => item.path);
  return {
    coverageItems: inventory.coverageItems,
    coverageLinks: inventory.coverageItems.map((item) => ({
      itemId: item.id,
      routeIds,
      workflowIds: [WORKFLOW_ID],
      ...structuredClone(dimensions),
      requirementRefs: [...PROPERTY_REQUIREMENTS],
      findingIds: [FINDING_ID],
      verificationRefs: [VALIDATION_ID],
      evidenceRefs: [...item.evidenceRefs],
    })),
    workflowTraces: [
      {
        id: WORKFLOW_ID,
        name: "Generated Planner route-to-result workflow",
        routeIds,
        stages: WORKFLOW_STAGE_ORDER.map((kind, index) => ({
          id: `${WORKFLOW_ID}:stage:${String(index + 1).padStart(2, "0")}`,
          kind,
          sourcePath: firstRoutePath,
          summary:
            kind === "user-visible-result"
              ? "The generated workflow reaches a user-visible Planner result."
              : `The generated workflow covers ${kind}.`,
          evidenceRefs: [...inventory.coverageItems[0].evidenceRefs],
        })),
        coverage: structuredClone(dimensions),
        requirementRefs: [...PROPERTY_REQUIREMENTS],
        findingIds: [FINDING_ID],
        verificationRefs: [VALIDATION_ID],
        evidenceRefs: [...inventory.coverageItems[0].evidenceRefs],
      },
    ],
    evidence: inventory.evidence,
    validations: [
      {
        id: VALIDATION_ID,
        state: "pending",
        findingIds: [FINDING_ID],
        kind: "unit",
        target: "repository",
        repositoryRoot: ".",
        requirementRefs: [...PROPERTY_REQUIREMENTS],
        verifies: "Coverage closure for generated Planner route/import trees.",
        limitation: "The property test is authored but execution is deferred.",
        exactCommand:
          "pnpm exec vitest --run tests/unit/planner/plannerCoverageClosure.property.test.ts",
        pendingOwnerAction: null,
        userAuthorization: "not-authorized",
        hookPermission: "not-observed",
        exitStatus: null,
        outcome: null,
        evidenceRefs: [],
      },
    ],
    findings: [
      {
        id: FINDING_ID,
        title: "Generated Planner coverage closes to a visible workflow result",
        severity: "note",
        state: "candidate",
        routeIds,
        workflowIds: [WORKFLOW_ID],
        adjacentWorkflowIds: [],
        sourcePaths,
        requirementRefs: [...PROPERTY_REQUIREMENTS],
        reproductionEvidenceRefs: [],
        completionEvidenceRefs: [],
        expected: "Every generated route and reachable area closes exactly once.",
        observed: "",
        affectedScope: ["planner-comprehensive-audit"],
        remediationPaths: [],
        validationIds: [VALIDATION_ID],
      },
    ],
  };
}

function itemsAtPath(
  items: readonly CoverageItem[],
  repositoryPath: string,
): CoverageItem[] {
  return items.filter((item) => item.path === repositoryPath);
}

afterEach(() => {
  for (const repositoryRoot of temporaryRoots.splice(0)) {
    rmSync(repositoryRoot, { recursive: true, force: true });
  }
});

describe("Planner Property 1: coverage closure", () => {
  it("closes generated route/import trees through unique evidence-backed inventory and a user-visible workflow", () => {
    fc.assert(
      fc.property(coverageTreeArbitrary, (tree) => {
        const { repositoryRoot, expectedPaths } = createGeneratedRepository(tree);
        const inventory = collectPlannerCoverage({ repositoryRoot });
        const dataset = buildCoverageClosureDataset(inventory);
        const evidenceIds = new Set(inventory.evidence.map((record) => record.id));

        expect(inventory.coverageItems.map((item) => item.path).sort()).toEqual(
          expectedPaths,
        );
        for (const expectedPath of expectedPaths) {
          expect(itemsAtPath(inventory.coverageItems, expectedPath)).toHaveLength(1);
        }
        expect(new Set(inventory.coverageItems.map((item) => item.id)).size).toBe(
          inventory.coverageItems.length,
        );

        for (const item of inventory.coverageItems) {
          expect(item.evidenceRefs).not.toHaveLength(0);
          expect(
            item.evidenceRefs.every((evidenceRef) => evidenceIds.has(evidenceRef)),
          ).toBe(true);
          if (item.status !== "wired") {
            expect(item.statusNote?.trim()).toBeTruthy();
          }
        }
        for (const root of inventory.roots) {
          expect(root.evidenceRefs).not.toHaveLength(0);
          expect(
            root.evidenceRefs.every((evidenceRef) => evidenceIds.has(evidenceRef)),
          ).toBe(true);
          expect(root.statusNote.trim()).not.toBe("");
        }

        expect(
          itemsAtPath(
            inventory.coverageItems,
            "site/features/Planner/RootView.ts",
          )[0]?.status,
        ).toBe("wired");
        for (const name of tree.unreachableNames) {
          expect(
            itemsAtPath(
              inventory.coverageItems,
              `site/components/Planner/${name}Panel.tsx`,
            )[0]?.status,
          ).toBe("unreachable");
        }
        expect(
          itemsAtPath(
            inventory.coverageItems,
            "site/lib/Planner/legacy/oldPlanner.ts",
          )[0]?.status,
        ).toBe("legacy");
        expect(
          itemsAtPath(
            inventory.coverageItems,
            "site/lib/Planner/generated/plannerCache.ts",
          )[0]?.status,
        ).toBe("generated");
        expect(
          itemsAtPath(
            inventory.coverageItems,
            "site/platform/Planner/data/projects/local.json",
          )[0]?.status,
        ).toBe("demo/local-only");

        expect(dataset.coverageLinks).toHaveLength(dataset.coverageItems.length);
        expect(new Set(dataset.coverageLinks.map((link) => link.itemId)).size).toBe(
          dataset.coverageItems.length,
        );
        expect(dataset.workflowTraces[0].stages.map((stage) => stage.kind)).toEqual(
          WORKFLOW_STAGE_ORDER,
        );
        expect(dataset.workflowTraces[0].stages.at(-1)?.kind).toBe(
          "user-visible-result",
        );
        expect(
          validateAuditDataset(dataset, {
            requiredRequirementRefs: [...PROPERTY_REQUIREMENTS],
          }),
        ).toEqual({ valid: true, issues: [] });
      }),
      {
        seed: PROPERTY_SEED,
        numRuns: PROPERTY_RUNS,
        endOnFailure: true,
      },
    );
  });
});

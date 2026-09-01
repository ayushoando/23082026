// @vitest-environment node
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type {
  ApiCoverageItem,
  RouteCoverageItem,
} from "../../../plans/audit/28-canvas-features-logic/auditModel";
import {
  collectPlannerCoverage,
  type PlannerCoverageInventory,
} from "../../../plans/audit/28-canvas-features-logic/coverageCollector";
import { initialPlannerInventory } from "../../../plans/audit/28-canvas-features-logic/initialInventory";

const temporaryRoots: string[] = [];

function writeFixture(
  repositoryRoot: string,
  repositoryPath: string,
  source: string,
): void {
  const absolutePath = path.join(
    repositoryRoot,
    ...repositoryPath.split("/"),
  );
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, source, "utf8");
}

function createCollectorFixture(): string {
  const repositoryRoot = mkdtempSync(
    path.join(tmpdir(), "planner-coverage-collector-"),
  );
  temporaryRoots.push(repositoryRoot);

  writeFixture(
    repositoryRoot,
    "site/app/ooplanner/layout.tsx",
    'export { default } from "@/features/Planner/layout";\n',
  );
  writeFixture(
    repositoryRoot,
    "site/app/ooplanner/page.tsx",
    'export { default } from "@/features/Planner/page";\n',
  );
  writeFixture(
    repositoryRoot,
    "site/app/ooplanner/projects/page.tsx",
    'export { default } from "@/features/Planner/projects/page";\n',
  );
  writeFixture(
    repositoryRoot,
    "site/app/api/Planner/projects/route.ts",
    [
      'import { withAuth } from "@/features/shared/api/withAuth";',
      "export const GET = withAuth(async () => new Response());",
      "export async function POST(): Promise<Response> { return new Response(); }",
    ].join("\n"),
  );
  writeFixture(
    repositoryRoot,
    "site/features/Planner/layout.tsx",
    [
      'import "@focss/planner/entry.css";',
      'import Planner from "@planner/components/Planner";',
      "export default Planner;",
    ].join("\n"),
  );
  writeFixture(
    repositoryRoot,
    "site/features/Planner/page.tsx",
    'export { default } from "@planner/components/Planner";\n',
  );
  writeFixture(
    repositoryRoot,
    "site/features/Planner/projects/page.tsx",
    'export { default } from "@planner/components/Planner";\n',
  );
  writeFixture(
    repositoryRoot,
    "site/components/Planner/Planner.tsx",
    [
      'import { plannerValue } from "@planner/lib/plannerValue";',
      'import { withAuth } from "@/features/shared/api/withAuth";',
      "void withAuth;",
      "void plannerValue;",
      "export default function Planner(): null { return null; }",
    ].join("\n"),
  );
  writeFixture(
    repositoryRoot,
    "site/components/Planner/UnreachablePanel.tsx",
    "export function UnreachablePanel(): null { return null; }\n",
  );
  writeFixture(
    repositoryRoot,
    "site/lib/Planner/plannerValue.ts",
    "export const plannerValue = 1;\n",
  );
  writeFixture(
    repositoryRoot,
    "site/lib/Planner/legacy/old.ts",
    "export const oldPlannerValue = true;\n",
  );
  writeFixture(
    repositoryRoot,
    "site/lib/Planner/generated/cache.ts",
    "export const generatedPlannerValue = true;\n",
  );
  writeFixture(
    repositoryRoot,
    "site/hooks/Planner/useFixture.ts",
    "export function useFixture(): null { return null; }\n",
  );
  writeFixture(
    repositoryRoot,
    "site/store/Planner/fixtureStore.ts",
    "export const fixtureStore = {};\n",
  );
  writeFixture(
    repositoryRoot,
    "site/platform/Planner/data/projects/local.json",
    "{}\n",
  );
  writeFixture(
    repositoryRoot,
    "site/focss/planner/entry.css",
    '@import "./base/layout.css";\n',
  );
  writeFixture(
    repositoryRoot,
    "site/focss/planner/base/layout.css",
    ".planner { display: block; }\n",
  );
  writeFixture(
    repositoryRoot,
    "site/features/shared/api/withAuth.ts",
    [
      'import { policy } from "@/lib/security/policy";',
      "export const withAuth = <T>(handler: T): T => { void policy; return handler; };",
    ].join("\n"),
  );
  writeFixture(
    repositoryRoot,
    "site/lib/security/policy.ts",
    'export const policy = "fixture";\n',
  );
  writeFixture(
    repositoryRoot,
    "tests/unit/planner/plannerFixture.test.ts",
    'import Planner from "@planner/components/Planner";\nvoid Planner;\n',
  );
  writeFixture(
    repositoryRoot,
    "tests/vitest.config.ts",
    'export const include = ["components/Planner/**/*.{ts,tsx}"];\n',
  );
  writeFixture(
    repositoryRoot,
    "config/build/playwright-gate-specs.json",
    '{"include":["/ooplanner"]}\n',
  );
  writeFixture(
    repositoryRoot,
    "site/tsconfig.json",
    '{"compilerOptions":{"paths":{"@planner/*":["Planner/*"]}}}\n',
  );
  writeFixture(
    repositoryRoot,
    "docs/architecture/routes.md",
    [
      "- `/ooplanner` → live entry",
      "- `/ooplanner/removed` → stale documentation",
    ].join("\n"),
  );

  return repositoryRoot;
}

function itemByPath(
  inventory: PlannerCoverageInventory,
  repositoryPath: string,
) {
  return inventory.coverageItems.find((item) => item.path === repositoryPath);
}

afterEach(() => {
  for (const repositoryRoot of temporaryRoots.splice(0)) {
    rmSync(repositoryRoot, { recursive: true, force: true });
  }
});

describe("Planner live coverage collector", () => {
  it("produces the initial inventory from live Planner roots with evidence-backed statuses", () => {
    const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
    const collected = collectPlannerCoverage({ repositoryRoot });
    const routePaths = collected.coverageItems
      .filter(
        (item): item is RouteCoverageItem =>
          item.kind === "route" && item.routeFileKind === "page",
      )
      .map((item) => item.routePath);
    const endpoints = collected.coverageItems
      .filter((item): item is ApiCoverageItem => item.kind === "api")
      .map((item) => item.endpointPath);

    expect(routePaths).toEqual(
      expect.arrayContaining([
        "/ooplanner",
        "/ooplanner/projects/[id]",
        "/ooplanner/projects",
      ]),
    );
    expect(endpoints).toEqual(
      expect.arrayContaining([
        "/api/Planner/catalog",
        "/api/Planner/catalog/upload",
        "/api/Planner/handoff",
        "/api/Planner/projects/[id]",
        "/api/Planner/projects",
        "/api/Planner/sketch-to-plan",
      ]),
    );
    expect(collected).toEqual(initialPlannerInventory);
    expect(
      itemByPath(collected, "site/lib/rateLimit.ts"),
    ).toEqual(
      expect.objectContaining({
        kind: "reachable-shared-source",
        status: "wired",
      }),
    );
    expect(collected.roots).toContainEqual(
      expect.objectContaining({
        path: "site/platform/Planner",
        status: "demo/local-only",
      }),
    );
    expect(
      collected.coverageItems.every(
        (item) =>
          item.evidenceRefs.length > 0 &&
          (item.status === "wired" || Boolean(item.statusNote?.trim())),
      ),
    ).toBe(true);
  });

  it("is deterministic and resolves source-over-document conflicts in favor of live source", () => {
    const repositoryRoot = createCollectorFixture();
    const first = collectPlannerCoverage({ repositoryRoot });
    const second = collectPlannerCoverage({ repositoryRoot });

    expect(first).toEqual(second);
    expect(itemByPath(first, "site/components/Planner/Planner.tsx")).toEqual(
      expect.objectContaining({ status: "wired" }),
    );
    expect(
      itemByPath(first, "site/components/Planner/UnreachablePanel.tsx"),
    ).toEqual(expect.objectContaining({ status: "unreachable" }));
    expect(itemByPath(first, "site/lib/Planner/generated/cache.ts")).toEqual(
      expect.objectContaining({ status: "generated" }),
    );
    expect(itemByPath(first, "site/lib/Planner/legacy/old.ts")).toEqual(
      expect.objectContaining({ status: "legacy" }),
    );
    expect(
      itemByPath(first, "site/platform/Planner/data/projects/local.json"),
    ).toEqual(expect.objectContaining({ status: "demo/local-only" }));
    expect(itemByPath(first, "site/lib/security/policy.ts")).toEqual(
      expect.objectContaining({
        kind: "reachable-shared-source",
        status: "wired",
      }),
    );
    expect(first.roots).toContainEqual(
      expect.objectContaining({
        path: "site/server/Planner",
        status: "unwired/absent",
      }),
    );
    expect(first.documentationConflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surfacePath: "/ooplanner/removed",
          conflictKind: "documented-only",
          status: "unwired/absent",
          resolution: "live-source",
        }),
        expect.objectContaining({
          surfacePath: "/ooplanner/projects",
          conflictKind: "live-only",
          status: "wired",
          resolution: "live-source",
        }),
        expect.objectContaining({
          surfacePath: "/api/Planner/projects",
          conflictKind: "live-only",
          status: "wired",
          resolution: "live-source",
        }),
      ]),
    );
  });
});

// @vitest-environment node

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import {
  collectDiscovery,
  discoveryCollector,
  OFFICIAL_DISCOVERY_METHOD,
} from "../../../scripts/kiro-repo-guidance-setup/discovery.ts";
import type { DiscoveryRequest } from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

const temporaryRoots: string[] = [];

function createFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "kiro-discovery-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, ".kiro", "hooks"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "AGENTS.md"), "# Local rules\n", "utf8");
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify(
      {
        scripts: {
          "graph-check": "node scripts/graph-impact.mjs && node scripts/missing.mjs",
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  writeFileSync(join(root, "scripts", "graph-impact.mjs"), "export {};\n", "utf8");
  writeFileSync(
    join(root, ".kiro", "hooks", "visible.json"),
    JSON.stringify({
      version: "v1",
      hooks: [
        {
          event: "SessionStart",
          action: { type: "command", command: "node scripts/graph-impact.mjs" },
        },
      ],
    }),
    "utf8",
  );
  return root;
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

function request(repositoryRoot: string, overrides: Partial<DiscoveryRequest> = {}): DiscoveryRequest {
  return {
    repositoryRoot,
    reviewDateUtc: "2026-08-25",
    activeSurfaces: ["IDE", "Local_Repository_Surface"],
    officialDiscoveryApproved: false,
    ...overrides,
  };
}

describe("DiscoveryCollector", () => {
  it("records discovery method, active surfaces, repository sources, and blocked official candidates", () => {
    const root = createFixture();
    const result = discoveryCollector.discover(request(root));

    expect(result.status).toBe("partial");
    expect(result.output?.sourceInventory.discoveryMethod).toBe(OFFICIAL_DISCOVERY_METHOD);
    expect(result.output?.sourceInventory.reviewDateUtc).toBe("2026-08-25");
    expect(result.output?.sourceInventory.activeSurfaces).toEqual(["IDE", "Local_Repository_Surface"]);
    expect(result.output?.errors).toContain("official sitemap/search retrieval is unapproved and was blocked");

    const records = result.output?.sourceInventory.records ?? [];
    const skills = records.find((record) => record.sourceId === "source:official:candidate:skills");
    expect(skills?.locator).toBe("https://kiro.dev/docs/skills/");
    expect(skills?.retrievalMethod).toBe("official_sitemap");
    expect(skills?.availability).toBe("inaccessible");
    expect(skills?.evidenceState).toBe("Unverified");
    expect(skills?.provenance.result).toContain("unapproved");

    expect(records.some((record) => record.locator === "AGENTS.md" && record.availability === "available")).toBe(true);
    expect(records.some((record) => record.locator === ".kiro/hooks/visible.json")).toBe(true);
    expect(records.some((record) => record.locator === "scripts/graph-impact.mjs")).toBe(true);
    expect(records.some((record) => record.locator === "scripts/missing.mjs" && record.availability !== "available")).toBe(true);

    const unavailable = result.output?.unavailable ?? [];
    expect(unavailable.some((finding) => finding.sourceRef === skills?.sourceId && finding.surface === "IDE")).toBe(true);
    expect(unavailable.every((finding) => finding.evidenceState === "Unverified")).toBe(true);
    expect(unavailable.every((finding) => finding.nextValidationRun.length > 0)).toBe(true);
  });

  it("keeps official retrieval blocked even when a caller marks it approved", () => {
    const root = createFixture();
    const result = collectDiscovery(
      request(root, { officialDiscoveryApproved: true, activeSurfaces: ["CLI 3.x"] }),
    );

    expect(result.status).toBe("partial");
    expect(result.output?.errors).toContain(
      "official sitemap/search retrieval was not performed by the read-only collector",
    );
    expect(
      (result.output?.sourceInventory.records ?? [])
        .filter((record) => record.kind === "official_url")
        .every((record) => record.availability !== "available" && record.evidenceState === "Unverified"),
    ).toBe(true);
    expect(
      (result.output?.unavailable ?? [])
        .filter((finding) => finding.sourceRef.startsWith("source:official:"))
        .every((finding) => finding.surface === "CLI 3.x"),
    ).toBe(true);
  });

  it("records absent referenced paths as unavailable without persisting command content", () => {
    const root = createFixture();
    const packagePath = join(root, "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as { scripts: Record<string, string> };
    packageJson.scripts["secret-check"] = "node scripts/missing-secret.mjs --token=super-secret-value";
    writeFileSync(packagePath, JSON.stringify(packageJson), "utf8");

    const result = collectDiscovery(request(root));
    const records = result.output?.sourceInventory.records ?? [];
    const missing = records.find((record) => record.locator === "scripts/missing-secret.mjs");
    expect(missing?.availability).toBe("impossible_to_match");
    expect(missing?.evidenceState).toBe("Unverified");
    expect(JSON.stringify(result.output)).not.toContain("super-secret-value");
  });

  it("fails closed when the request has no selected Active_Surface or an invalid review date", () => {
    const root = createFixture();
    const result = collectDiscovery(
      request(root, { activeSurfaces: [], reviewDateUtc: "not-a-date" }),
    );

    expect(result.status).toBe("blocked");
    expect(result.output).toBeUndefined();
    expect(result.blockers).toEqual([
      "reviewDateUtc must be an ISO date or ISO UTC timestamp",
      "at least one Active_Surface is required",
    ]);
  });
});

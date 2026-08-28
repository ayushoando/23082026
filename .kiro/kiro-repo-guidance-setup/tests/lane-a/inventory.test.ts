// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  INITIAL_SKILL_CANDIDATES,
  type InventoryRequest,
} from "../../contracts.ts";
import {
  REQUIRED_CANONICAL_GUIDANCE_PATHS,
  repositoryInventory,
} from "../../inventory.ts";

const temporaryRoots: string[] = [];

function write(root: string, path: string, contents = "fixture\n"): void {
  const target = join(root, ...path.split("/"));
  mkdirSync(join(target, ".."), { recursive: true });
  writeFileSync(target, contents, "utf8");
}

function createFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "kiro-inventory-"));
  temporaryRoots.push(root);

  write(root, "AGENTS.md");
  write(root, "START.md");
  write(root, "Agents/01-standard.md");
  write(root, "docs/architecture/layout.md");
  write(root, "plans/PLAN.md");
  write(root, ".kiro/skills/repo-map/SKILL.md");
  write(root, ".kiro/steering/project.md");
  write(root, ".kiro/hooks/local.json", '{"version":"v1"}');
  write(root, ".kiro/powers/local/POWER.md");
  write(root, ".kiro/agents/reviewer.json", "{}");
  write(root, ".kiro/settings/mcp.json", "{}");
  write(root, ".kiro/settings/permissions.yaml", "permissions: {}\n");
  write(root, ".kiro/settings/config.json", "{}");
  write(root, ".kiro/specs/example/requirements.md");
  write(root, ".kiroignore", "*.secret\n");
  return root;
}

function request(repositoryRoot: string, paths: readonly string[] = []): InventoryRequest {
  return { repositoryRoot, reviewDateUtc: "2026-08-25", paths };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("RepositoryInventory", () => {
  // Validates: Requirements 2.1, 2.2, 2.4–2.6, 11.1–11.2
  it("inventories canonical guidance and every visible Kiro artifact with complete metadata", () => {
    const result = repositoryInventory.scan(request(createFixture()));

    expect(result.status).toBe("pass");
    const output = result.output;
    expect(output).toBeDefined();

    for (const requiredPath of REQUIRED_CANONICAL_GUIDANCE_PATHS) {
      expect(output?.canonicalSources.some((record) => record.path === requiredPath)).toBe(true);
    }
    expect(output?.canonicalSources.find((record) => record.path === "HANDOVER.md")?.inventoryStatus).toBe("absent");
    expect(output?.canonicalSources.find((record) => record.path === "Agents/01-standard.md")?.inventoryStatus).toBe("present and readable");
    expect(output?.canonicalSources.find((record) => record.path === "docs/architecture/layout.md")?.canonicalSource).toBe("docs/*");

    const artifacts = output?.kiroArtifacts ?? [];
    expect(artifacts.find((record) => record.path === ".kiro/hooks/local.json")?.kind).toBe("Hook_Manifest");
    expect(artifacts.find((record) => record.path === ".kiro/powers/local")?.kind).toBe("Kiro_Power");
    expect(artifacts.find((record) => record.path === ".kiro/agents/reviewer.json")?.kind).toBe("Custom_Agent");
    expect(artifacts.find((record) => record.path === ".kiro/settings/agents.json")?.kind).toBe("Custom_Agent");
    expect(artifacts.find((record) => record.path === ".kiro/settings/mcp.json")?.kind).toBe("MCP_Service");
    expect(artifacts.find((record) => record.path === ".kiro/settings/permissions.yaml")?.kind).toBe("Permission_Configuration");
    expect(artifacts.find((record) => record.path === ".kiro/specs/example/requirements.md")?.kind).toBe("Specification");
    expect(artifacts.find((record) => record.path === ".kiroignore")?.kind).toBe("Ignore_Configuration");

    for (const record of [...(output?.canonicalSources ?? []), ...artifacts]) {
      expect(record.owner).not.toBe("");
      expect(record.configurationScope).not.toBe("");
      expect(record.activationCondition).not.toBe("");
      expect(record.canonicalSource).not.toBe("");
      expect(record.evidenceRefs).toHaveLength(1);
      expect(["low", "medium", "high", "unknown with reason"]).toContain(record.maintenanceRisk);
    }
  });

  // Validates: Requirements 2.1, 2.6, 2.7, 10.1–10.3, 10.5–10.9, 14.1–14.2
  it("uses exactly the initial skill candidates and safely records absent or unsafe paths", () => {
    const root = createFixture();
    const result = repositoryInventory.scan(request(root, ["missing.md", "../../outside-repository"]));
    const output = result.output;

    expect(result.status).toBe("pass");
    const skills = (output?.kiroArtifacts ?? []).filter((record) =>
      INITIAL_SKILL_CANDIDATES.some((skill) => record.path === `.kiro/skills/${skill}`),
    );
    expect(skills.map((record) => record.path).sort()).toEqual(
      INITIAL_SKILL_CANDIDATES.map((skill) => `.kiro/skills/${skill}`).sort(),
    );
    expect(skills.find((record) => record.path === ".kiro/skills/repo-map")?.inventoryStatus).toBe("present and readable");
    expect(skills.filter((record) => record.path !== ".kiro/skills/repo-map").every((record) => record.inventoryStatus === "absent")).toBe(true);

    expect(output?.missingPaths).toContain("missing.md");
    expect(output?.missingPaths).toContain("../../outside-repository");
    expect(output?.kiroArtifacts.find((record) => record.path === ".kiro/settings/installed.json")?.inventoryStatus).toBe("absent");
    expect(output?.conflicts).toEqual([]);
  });
});

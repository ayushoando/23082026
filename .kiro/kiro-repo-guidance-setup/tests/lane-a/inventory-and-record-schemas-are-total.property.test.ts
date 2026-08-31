// @vitest-environment node
//
// Feature: kiro-repo-guidance-setup, Property 3: Inventory and record schemas are total
//
// **Validates: Requirements 2.1, 2.4, 3.1, 3.4, 6.1, 7.1, 8.4, 11.2, 12.2, 13.5, 13.6, 14.3; Design: Correctness Property 3**
//
// Property 3 (design.md): "For all valid inspected artifacts, the resulting
// record has exactly one inventory status, non-empty owner/scope/evidence/
// disposition fields, an allowed maintenance-risk value, and all type-specific
// provenance, validation, and rollback fields required for that artifact kind;
// no secret value is persisted in the record."
//
// This exercises the Lane A `RepositoryInventory` (inventory.ts) over
// randomized repositories. Each generated run materializes a temporary
// repository root populated with a random selection of `.kiro/**` and canonical
// guidance artifacts. Artifacts are seeded in every relevant shape the schema
// must survive:
//   - present-and-readable files and directories (including secret-bearing
//     contents), covering every ArtifactKind the collector classifies,
//   - absent paths (requested but never created),
//   - unsafe path strings (traversal, empty, backslash, whitespace) fed through
//     the request `paths` list.
// The scan is then asserted to produce a *total* record for every canonical
// source and every visible Kiro artifact: exactly one inventory status, a
// non-empty owner/scope/activation/canonical-source/disposition, an allowed
// maintenance-risk, a valid evidence state, present validation/rollback fields,
// and no persisted secret value anywhere in the serialized record.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import fc from "fast-check";
import { afterEach, describe, expect, it } from "vitest";

import { repositoryInventory } from "../../inventory.ts";
import {
  CAPABILITY_DISPOSITIONS,
  EVIDENCE_STATES,
  INVENTORY_STATUSES,
  type ArtifactInventoryRecord,
  type InventoryRequest,
} from "../../contracts.ts";

const ALLOWED_MAINTENANCE_RISK = ["low", "medium", "high", "unknown with reason"] as const;

// Secret markers seeded into a subset of artifact file contents. If any of
// these literal values ends up serialized inside a produced record, the record
// has persisted a secret and Property 3 is violated. The inventory records file
// metadata only (never contents), so none of these should ever appear.
const SECRET_MARKERS = [
  "SUPER_SECRET_TOKEN_VALUE_9f2b7c",
  "password=hunter2plaintext",
  "api_key=sk-live-DO-NOT-PERSIST-4242",
  "Bearer eyJhbGciOiJIdcredentialXYZ",
] as const;

// Candidate artifact seed shapes. Each seeded entry is written under the temp
// root; together they cover the ArtifactKind space the collector classifies
// (skill, steering, hook, power, agent, mcp, permission, ignore, spec,
// relevant setting) plus canonical guidance files and directories.
interface SeedSpec {
  readonly relPath: string;
  readonly isDir: boolean;
  readonly withSecret: boolean;
}

const SEED_CANDIDATES: readonly SeedSpec[] = [
  { relPath: "AGENTS.md", isDir: false, withSecret: true },
  { relPath: "README.md", isDir: false, withSecret: false },
  { relPath: "Agents/01-standard.md", isDir: false, withSecret: false },
  { relPath: "docs/architecture/layout.md", isDir: false, withSecret: true },
  { relPath: "plans/PLAN.md", isDir: false, withSecret: false },
  { relPath: ".kiro/skills/repo-map/SKILL.md", isDir: false, withSecret: false },
  { relPath: ".kiro/skills/graph-impact/SKILL.md", isDir: false, withSecret: false },
  { relPath: ".kiro/steering/project.md", isDir: false, withSecret: true },
  { relPath: ".kiro/hooks/local.json", isDir: false, withSecret: true },
  { relPath: ".kiro/hooks/domain-fast-check.json", isDir: false, withSecret: false },
  { relPath: ".kiro/powers/oando-workflow/POWER.md", isDir: false, withSecret: false },
  { relPath: ".kiro/agents/reviewer.json", isDir: false, withSecret: true },
  { relPath: ".kiro/settings/mcp.json", isDir: false, withSecret: true },
  { relPath: ".kiro/settings/permissions.yaml", isDir: false, withSecret: true },
  { relPath: ".kiro/settings/agents.json", isDir: false, withSecret: false },
  { relPath: ".kiro/settings/config.json", isDir: false, withSecret: false },
  { relPath: ".kiro/specs/example/requirements.md", isDir: false, withSecret: false },
  { relPath: ".kiroignore", isDir: false, withSecret: false },
] as const;

// Unsafe / degenerate request paths. The collector must still emit a total
// record (typically an `absent`/`unknown` status) for each without throwing.
const UNSAFE_PATH_POOL = [
  "../../outside-repository",
  "..",
  "missing-artifact.md",
  ".kiro/skills/missing-skill/SKILL.md",
  "   ",
  "weird\\backslash\\path.json",
  "spaced path/with space.md",
] as const;

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function materialize(root: string, seeds: readonly SeedSpec[]): void {
  for (const seed of seeds) {
    const target = join(root, ...seed.relPath.split("/"));
    if (seed.isDir) {
      mkdirSync(target, { recursive: true });
      continue;
    }
    mkdirSync(join(target, ".."), { recursive: true });
    const secret = seed.withSecret ? SECRET_MARKERS[seeds.indexOf(seed) % SECRET_MARKERS.length] : "";
    writeFileSync(target, `fixture contents\n${secret}\n`, "utf8");
  }
}

function assertTotalRecord(record: ArtifactInventoryRecord): void {
  // Exactly one inventory status, drawn from the closed enum.
  expect(INVENTORY_STATUSES).toContain(record.inventoryStatus);

  // Non-empty required scalar fields.
  expect(record.artifactId.trim().length).toBeGreaterThan(0);
  expect(record.path).toBeDefined();
  expect(record.owner.trim().length).toBeGreaterThan(0);
  expect(String(record.configurationScope).trim().length).toBeGreaterThan(0);
  expect(record.activationCondition.trim().length).toBeGreaterThan(0);
  expect(record.canonicalSource.trim().length).toBeGreaterThan(0);

  // Closed enums for evidence state, disposition, and maintenance risk.
  expect(EVIDENCE_STATES).toContain(record.evidenceState);
  expect(CAPABILITY_DISPOSITIONS).toContain(record.disposition);
  expect(ALLOWED_MAINTENANCE_RISK).toContain(record.maintenanceRisk);

  // Provenance / validation / rollback fields are present and well-typed.
  expect(Array.isArray(record.evidenceRefs)).toBe(true);
  expect(record.evidenceRefs.length).toBeGreaterThan(0);
  for (const ref of record.evidenceRefs) expect(ref.trim().length).toBeGreaterThan(0);
  expect(Array.isArray(record.validationRunRefs)).toBe(true);
  expect(typeof record.rollbackPath).toBe("string");
  expect(record.rollbackPath.trim().length).toBeGreaterThan(0);

  // No secret value is persisted anywhere in the serialized record.
  const serialized = JSON.stringify(record);
  for (const marker of SECRET_MARKERS) {
    expect(serialized).not.toContain(marker);
  }
}

describe("Property 3: Inventory and record schemas are total", () => {
  it("emits a total record for every canonical source and visible Kiro artifact", () => {
    fc.assert(
      fc.property(
        // A random subset of artifact seeds (may be empty: absent everything).
        fc.subarray([...SEED_CANDIDATES], { minLength: 0, maxLength: SEED_CANDIDATES.length }),
        // A random subset of unsafe/degenerate request paths.
        fc.subarray([...UNSAFE_PATH_POOL], { minLength: 0, maxLength: UNSAFE_PATH_POOL.length }),
        // A random ISO review date string (always non-empty).
        fc.date({ min: new Date("2024-01-01T00:00:00Z"), max: new Date("2030-12-31T00:00:00Z") }),
        (seeds, unsafePaths, reviewDate) => {
          const root = mkdtempSync(join(tmpdir(), "kiro-prop3-"));
          temporaryRoots.push(root);
          materialize(root, seeds);

          const request: InventoryRequest = {
            repositoryRoot: root,
            reviewDateUtc: reviewDate.toISOString().slice(0, 10),
            paths: unsafePaths,
          };

          const result = repositoryInventory.scan(request);

          // A well-formed request always resolves (never blocked).
          expect(result.status).toBe("pass");
          const output = result.output;
          expect(output).toBeDefined();
          if (!output) return;

          const allRecords = [...output.canonicalSources, ...output.kiroArtifacts];
          // Every visible artifact yields a record: the required canonical +
          // Kiro baseline is always inventoried, so the set is never empty.
          expect(allRecords.length).toBeGreaterThan(0);

          for (const record of allRecords) {
            assertTotalRecord(record);
          }

          // No partial/undefined records escape: each record round-trips to a
          // defined object with a defined status.
          for (const record of allRecords) {
            expect(record).toBeTypeOf("object");
            expect(record.inventoryStatus).toBeDefined();
          }
        },
      ),
      { numRuns: 120 },
    );
  });
});

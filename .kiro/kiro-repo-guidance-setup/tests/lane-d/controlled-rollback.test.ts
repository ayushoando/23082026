import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createRollbackManager,
  type ExecutableRollbackRequest,
} from "../../rollback.ts";

const temporaryDirectories: string[] = [];

function createTarget(initialBytes: string): string {
  const directory = mkdtempSync(join(tmpdir(), "kiro-controlled-rollback-"));
  temporaryDirectories.push(directory);
  const target = join(directory, "artifact.json");
  writeFileSync(target, initialBytes);
  return target;
}

function rollbackRequest(
  targetArtifactOrScope: string,
  preChangeStateRef: string,
  overrides: Partial<ExecutableRollbackRequest> = {},
): ExecutableRollbackRequest {
  return {
    rollbackId: "rollback-controlled-test",
    targetArtifactOrScope,
    preChangeStateRef,
    rollbackAction: "restore captured pre-change bytes",
    expectedSuccessSignal: "captured bytes are restored",
    owner: "repository owner",
    mode: "restore",
    ...overrides,
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("RollbackManagerService controlled failures", () => {
  it("keeps later enablement blocked when the controlled restore write cannot complete", () => {
    const target = createTarget("original-content");
    const manager = createRollbackManager();
    const snapshot = manager.captureSnapshot({
      snapshotId: "snapshot-controlled-write-failure",
      targetPath: target,
      expectedSuccessSignal: "captured bytes are restored",
    });
    writeFileSync(target, "changed-content");

    // Turning the target into a directory makes the restore write fail
    // deterministically. The directory and its unrelated child remain intact;
    // the manager must not claim a verified rollback after this failure.
    rmSync(target);
    mkdirSync(target);
    writeFileSync(join(target, "unrelated.txt"), "must-remain");

    const result = manager.restore(
      rollbackRequest(target, snapshot.snapshotId),
    );

    expect(result.status).toBe("fail");
    expect(result.output?.result).toBe("fail");
    expect(result.output?.observedEvidence).toContain("rollback write failed");
    expect(result.output?.limitation).toContain("rollback failed");
    expect(readFileSync(join(target, "unrelated.txt"), "utf8")).toBe("must-remain");
    expect(manager.assessReadiness(result)).toMatchObject({
      restoredBytesVerified: false,
      laterEnablementBlocked: true,
    });
  });

  it("keeps a controlled no-change rollback record non-mutating and explicitly non-applicable", () => {
    const target = createTarget("unchanged-content");
    const manager = createRollbackManager();
    const before = readFileSync(target, "utf8");

    const result = manager.restore(
      rollbackRequest(target, "no-snapshot-required", {
        mode: "no_change",
        rollbackAction: "no rollback applies",
        expectedSuccessSignal: "no artifact mutation",
      }),
    );

    expect(result.status).toBe("pass");
    expect(result.output).toMatchObject({
      result: "pass",
      limitation: "no rollback applies",
      observedEvidence: "no-change disposition recorded; no artifact mutation was required",
    });
    expect(readFileSync(target, "utf8")).toBe(before);
  });
});

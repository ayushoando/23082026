import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createRollbackManager,
  type ExecutableRollbackRequest,
} from "../../../scripts/kiro-repo-guidance-setup/rollback.ts";

const temporaryDirectories: string[] = [];

function createTarget(initialBytes = "before-change"): string {
  const directory = mkdtempSync(join(tmpdir(), "kiro-rollback-"));
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
    rollbackId: "rollback-lane-d-test",
    targetArtifactOrScope,
    preChangeStateRef,
    rollbackAction: "restore captured pre-change state",
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

describe("RollbackManagerService", () => {
  it("captures pre-change bytes first and restores only the captured target with hash verification", () => {
    const target = createTarget("original-content");
    const unrelated = join(temporaryDirectories[0], "unrelated.txt");
    writeFileSync(unrelated, "must-remain");
    const manager = createRollbackManager();

    const snapshot = manager.captureSnapshot({ snapshotId: "snapshot-original", targetPath: target });
    writeFileSync(target, "changed-content");

    const result = manager.restore(rollbackRequest(target, snapshot.snapshotId));

    expect(result.status).toBe("pass");
    expect(result.output?.result).toBe("pass");
    expect(result.output?.observedEvidence).toContain("restored bytes verified by sha256:");
    expect(readFileSync(target, "utf8")).toBe("original-content");
    expect(readFileSync(unrelated, "utf8")).toBe("must-remain");
    expect(manager.assessReadiness(result)).toMatchObject({
      restoredBytesVerified: true,
      laterEnablementBlocked: false,
    });
  });

  it("writes and verifies an explicit disabled state without deleting the artifact", () => {
    const target = createTarget('{"enabled":true}');
    const manager = createRollbackManager();
    const snapshot = manager.captureSnapshot({ snapshotId: "snapshot-disable", targetPath: target });
    const disabledBytes = Buffer.from('{"enabled":false}');

    const result = manager.restore(rollbackRequest(target, snapshot.snapshotId, {
      mode: "disable",
      rollbackAction: "write disabled manifest bytes",
      expectedSuccessSignal: "artifact contains disabled manifest bytes",
      disableBytes: disabledBytes,
    }));

    expect(result.status).toBe("pass");
    expect(readFileSync(target, "utf8")).toBe('{"enabled":false}');
    expect(result.output?.observedEvidence).toBe("disabled bytes verified");
  });

  it("removes only a target created after a snapshot that recorded no prior artifact", () => {
    const directory = mkdtempSync(join(tmpdir(), "kiro-rollback-"));
    temporaryDirectories.push(directory);
    const target = join(directory, "new-artifact.json");
    const unrelated = join(directory, "unrelated.txt");
    writeFileSync(unrelated, "must-remain");
    const manager = createRollbackManager();
    const snapshot = manager.captureSnapshot({ snapshotId: "snapshot-absent", targetPath: target });
    writeFileSync(target, "created-after-snapshot");

    const result = manager.restore(rollbackRequest(target, snapshot.snapshotId));

    expect(result.status).toBe("pass");
    expect(() => readFileSync(target)).toThrow();
    expect(readFileSync(unrelated, "utf8")).toBe("must-remain");
  });

  it("preserves captured bytes when a caller mutates its returned snapshot", () => {
    const target = createTarget("original-content");
    const manager = createRollbackManager();
    const snapshot = manager.captureSnapshot({ snapshotId: "snapshot-immutable", targetPath: target });

    snapshot.bytes?.fill(0);
    writeFileSync(target, "changed-content");

    const result = manager.restore(rollbackRequest(target, snapshot.snapshotId));

    expect(result.status).toBe("pass");
    expect(readFileSync(target, "utf8")).toBe("original-content");
  });

  it("fails closed and blocks later enablement when snapshot evidence is unavailable", () => {
    const target = createTarget();
    const manager = createRollbackManager();

    const result = manager.restore(rollbackRequest(target, "missing-snapshot"));

    expect(result.status).toBe("fail");
    expect(result.output?.result).toBe("fail");
    expect(result.blockers[0]).toContain("pre-change snapshot is missing");
    expect(manager.assessReadiness(result)).toMatchObject({
      restoredBytesVerified: false,
      laterEnablementBlocked: true,
    });
  });

  it("fails closed without mutation when the snapshot belongs to another target", () => {
    const target = createTarget("changed-target");
    const otherTarget = join(temporaryDirectories[0], "other-artifact.json");
    writeFileSync(otherTarget, "other-original");
    const manager = createRollbackManager();
    const snapshot = manager.captureSnapshot({ snapshotId: "snapshot-other-target", targetPath: otherTarget });

    const result = manager.restore(rollbackRequest(target, snapshot.snapshotId));

    expect(result.status).toBe("fail");
    expect(result.blockers[0]).toContain("snapshot does not belong");
    expect(readFileSync(target, "utf8")).toBe("changed-target");
    expect(readFileSync(otherTarget, "utf8")).toBe("other-original");
    expect(manager.assessReadiness(result).laterEnablementBlocked).toBe(true);
  });

  it("fails closed when disabling lacks explicit disabled bytes", () => {
    const target = createTarget('{"enabled":true}');
    const manager = createRollbackManager();
    const snapshot = manager.captureSnapshot({ snapshotId: "snapshot-no-disabled-bytes", targetPath: target });

    const result = manager.restore(rollbackRequest(target, snapshot.snapshotId, { mode: "disable" }));

    expect(result.status).toBe("fail");
    expect(result.blockers[0]).toContain("later enablement must remain blocked");
    expect(readFileSync(target, "utf8")).toBe('{"enabled":true}');
    expect(manager.assessReadiness(result).laterEnablementBlocked).toBe(true);
  });

  it("rejects a rollback when the expected success signal differs from the captured snapshot", () => {
    const target = createTarget("original-content");
    const manager = createRollbackManager();
    const snapshot = manager.captureSnapshot({
      snapshotId: "snapshot-signal-mismatch",
      targetPath: target,
      expectedSuccessSignal: "captured bytes are restored",
    });
    writeFileSync(target, "changed-content");

    const result = manager.restore(rollbackRequest(target, snapshot.snapshotId, {
      expectedSuccessSignal: "different success signal",
    }));

    expect(result.status).toBe("fail");
    expect(result.blockers[0]).toContain("snapshot cannot be trusted");
    expect(readFileSync(target, "utf8")).toBe("changed-content");
    expect(manager.assessReadiness(result).laterEnablementBlocked).toBe(true);
  });

  it("records a no-change disposition without requiring a snapshot or mutating the target", () => {
    const target = createTarget("unchanged");
    const manager = createRollbackManager();

    const result = manager.restore(rollbackRequest(target, "no-snapshot-required", {
      mode: "no_change",
      rollbackAction: "no rollback applies",
      expectedSuccessSignal: "no artifact mutation",
    }));

    expect(result.status).toBe("pass");
    expect(result.output?.limitation).toBe("no rollback applies");
    expect(readFileSync(target, "utf8")).toBe("unchanged");
  });
});

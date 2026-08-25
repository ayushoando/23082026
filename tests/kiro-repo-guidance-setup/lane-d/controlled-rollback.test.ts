import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExecutableRollbackRequest } from "../../../scripts/kiro-repo-guidance-setup/rollback.ts";

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

async function loadRollbackModuleWithMockedReads() {
  vi.resetModules();
  vi.doMock("node:fs", async (importOriginal) => {
    const actual = await importOriginal<typeof import("node:fs")>();
    return { ...actual, readFileSync: vi.fn(actual.readFileSync) };
  });

  const rollback = await import("../../../scripts/kiro-repo-guidance-setup/rollback.ts");
  const mockedFs = await import("node:fs");
  return {
    createRollbackManager: rollback.createRollbackManager,
    readFileSync: vi.mocked(mockedFs.readFileSync),
  };
}

afterEach(() => {
  vi.doUnmock("node:fs");
  vi.restoreAllMocks();
  vi.resetModules();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("RollbackManagerService controlled verification failures", () => {
  it("captures the snapshot first, restores the target, then blocks when verification observes different bytes", () => {
    const target = createTarget("original-content");
    const manager = createRollbackManager();
    const snapshot = manager.captureSnapshot({
      snapshotId: "snapshot-controlled-verification",
      targetPath: target,
      expectedSuccessSignal: "captured bytes are restored",
    });
    writeFileSync(target, "changed-content");

    // The first read happened during capture. The next read is the controlled
    // verification observation and deliberately differs from the bytes that
    // restoreSnapshot wrote. The real write still occurs, so this proves that a
    // verification failure does not erase the restored artifact or become a
    // successful enablement signal.
    vi.spyOn(fs, "readFileSync").mockReturnValueOnce(Buffer.from("verification-mismatch"));

    const result = manager.restore(
      rollbackRequest(target, snapshot.snapshotId),
    );

    expect(result.status).toBe("fail");
    expect(result.output?.result).toBe("fail");
    expect(result.output?.observedEvidence).toContain("restored bytes did not match captured hash");
    expect(result.output?.limitation).toContain("verification is unverified");
    expect(readFileSync(target, "utf8")).toBe("original-content");
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

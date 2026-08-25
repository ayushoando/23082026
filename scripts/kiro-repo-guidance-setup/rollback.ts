import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type {
  Identifier,
  RollbackManager as RollbackManagerContract,
  RollbackRecord,
  RollbackRequest,
  StageResult,
} from "./contracts";

export type RollbackMode = "restore" | "disable" | "no_change";

export interface PreChangeSnapshot {
  readonly snapshotId: Identifier;
  readonly targetPath: string;
  readonly existedBeforeChange: boolean;
  readonly bytes?: Uint8Array;
  readonly contentHash?: string;
  readonly expectedSuccessSignal?: string;
}

export interface SnapshotCaptureRequest {
  readonly snapshotId: Identifier;
  readonly targetPath: string;
  readonly expectedSuccessSignal?: string;
}

export interface ExecutableRollbackRequest extends RollbackRequest {
  readonly mode: RollbackMode;
  readonly disableBytes?: Uint8Array;
}

export interface RollbackExecutionResult {
  readonly rollback: RollbackRecord;
  readonly restoredBytesVerified: boolean;
  readonly laterEnablementBlocked: boolean;
}

function contentHash(bytes: Uint8Array): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function evidenceRef(rollbackId: Identifier): Identifier {
  return `rollback:${rollbackId}`;
}

function copySnapshot(snapshot: PreChangeSnapshot): PreChangeSnapshot {
  const bytes = snapshot.bytes === undefined ? undefined : new Uint8Array(snapshot.bytes);
  return {
    ...snapshot,
    ...(bytes === undefined ? {} : { bytes }),
  };
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isByteSequence(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

function failureResult(
  input: RollbackRequest,
  observedEvidence: string,
  limitation: string,
): StageResult<RollbackRecord> {
  const rollback: RollbackRecord = {
    rollbackId: input.rollbackId,
    targetArtifactOrScope: input.targetArtifactOrScope,
    preChangeStateRef: input.preChangeStateRef,
    rollbackAction: input.rollbackAction,
    expectedSuccessSignal: input.expectedSuccessSignal,
    observedEvidence,
    result: "fail",
    verificationRunRef: evidenceRef(input.rollbackId),
    owner: input.owner,
    limitation,
  };

  return {
    status: "fail",
    output: rollback,
    blockers: [limitation],
    evidenceRefs: [rollback.verificationRunRef],
  };
}

function requestBlockers(
  input: RollbackRequest,
  executable: ExecutableRollbackRequest,
): string[] {
  const blockers: string[] = [];

  if (!nonEmpty(input.rollbackId)) blockers.push("rollback ID is required");
  if (!nonEmpty(input.targetArtifactOrScope)) blockers.push("rollback target is required");
  if (!nonEmpty(input.preChangeStateRef)) blockers.push("pre-change state reference is required");
  if (!nonEmpty(input.rollbackAction)) blockers.push("rollback action is required");
  if (!nonEmpty(input.expectedSuccessSignal)) blockers.push("expected rollback success signal is required");
  if (!nonEmpty(input.owner)) blockers.push("rollback owner is required");

  if (executable.mode === "disable" && !isByteSequence(executable.disableBytes)) {
    blockers.push("disable rollback requires explicit disabled bytes");
  }

  return blockers;
}

function snapshotBlockers(
  snapshot: PreChangeSnapshot,
  executable: ExecutableRollbackRequest,
): string[] {
  const blockers: string[] = [];

  if (snapshot.existedBeforeChange) {
    if (snapshot.bytes === undefined || !nonEmpty(snapshot.contentHash)) {
      blockers.push("pre-change snapshot is missing captured bytes or its content hash");
    } else if (contentHash(snapshot.bytes) !== snapshot.contentHash) {
      blockers.push("pre-change snapshot bytes do not match the captured content hash");
    }
  } else if (snapshot.bytes !== undefined || snapshot.contentHash !== undefined) {
    blockers.push("pre-change snapshot records bytes for a target that was absent");
  }

  if (
    snapshot.expectedSuccessSignal !== undefined &&
    snapshot.expectedSuccessSignal !== executable.expectedSuccessSignal
  ) {
    blockers.push("rollback success signal differs from the snapshot's expected signal");
  }

  return blockers;
}

/**
 * Stores pre-change bytes before a controlled configuration mutation and restores
 * only the captured target. All restore outcomes are byte/hash-verified.
 */
export class RollbackManagerService implements RollbackManagerContract {
  private readonly snapshots = new Map<Identifier, PreChangeSnapshot>();

  public captureSnapshot(input: SnapshotCaptureRequest): PreChangeSnapshot {
    if (!nonEmpty(input.snapshotId)) {
      throw new Error("a pre-change snapshot ID is required");
    }
    if (!nonEmpty(input.targetPath)) {
      throw new Error("a pre-change snapshot target path is required");
    }
    if (input.expectedSuccessSignal !== undefined && !nonEmpty(input.expectedSuccessSignal)) {
      throw new Error("a supplied expected rollback success signal must be non-empty");
    }
    if (this.snapshots.has(input.snapshotId)) {
      throw new Error(`a pre-change snapshot already exists for ${input.snapshotId}`);
    }

    const existedBeforeChange = existsSync(input.targetPath);
    const bytes = existedBeforeChange
      ? new Uint8Array(readFileSync(input.targetPath))
      : undefined;
    const snapshot: PreChangeSnapshot = {
      snapshotId: input.snapshotId,
      targetPath: input.targetPath,
      existedBeforeChange,
      ...(bytes === undefined
        ? {}
        : { bytes, contentHash: contentHash(bytes) }),
      ...(input.expectedSuccessSignal === undefined
        ? {}
        : { expectedSuccessSignal: input.expectedSuccessSignal }),
    };

    this.snapshots.set(snapshot.snapshotId, snapshot);
    return copySnapshot(snapshot);
  }

  public getSnapshot(snapshotId: Identifier): PreChangeSnapshot | undefined {
    const snapshot = this.snapshots.get(snapshotId);
    return snapshot ? copySnapshot(snapshot) : undefined;
  }

  public restore(input: RollbackRequest): StageResult<RollbackRecord> {
    const executable = input as ExecutableRollbackRequest;
    if (!this.isExecutableRequest(executable)) {
      return failureResult(
        input,
        "rollback did not execute because mode was not specified",
        "rollback readiness is unverified because the rollback mode is missing; later enablement must remain blocked",
      );
    }

    const inputBlockers = requestBlockers(input, executable);
    if (inputBlockers.length > 0) {
      return failureResult(
        input,
        `rollback request was rejected before mutation: ${inputBlockers.join("; ")}`,
        "rollback readiness is unverified because the rollback request is incomplete; later enablement must remain blocked",
      );
    }

    if (executable.mode === "no_change") {
      return this.recordNoChange(input);
    }

    const snapshot = this.snapshots.get(input.preChangeStateRef);
    if (!snapshot) {
      return failureResult(
        input,
        "rollback did not execute because the pre-change snapshot is unavailable",
        "rollback readiness is unverified because the required pre-change snapshot is missing; later enablement must remain blocked",
      );
    }

    if (snapshot.targetPath !== input.targetArtifactOrScope) {
      return failureResult(
        input,
        "rollback did not execute because the snapshot target differs from the requested target",
        "rollback readiness is unverified because the snapshot does not belong to the requested target; later enablement must remain blocked",
      );
    }

    const snapshotValidationBlockers = snapshotBlockers(snapshot, executable);
    if (snapshotValidationBlockers.length > 0) {
      return failureResult(
        input,
        `rollback did not execute because snapshot evidence is invalid: ${snapshotValidationBlockers.join("; ")}`,
        "rollback readiness is unverified because the pre-change snapshot cannot be trusted; later enablement must remain blocked",
      );
    }

    try {
      if (executable.mode === "restore") {
        this.restoreSnapshot(snapshot);
      } else {
        this.disableTarget(snapshot.targetPath, executable.disableBytes);
      }
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "unknown filesystem failure";
      return failureResult(
        input,
        `rollback write failed: ${detail}`,
        "rollback failed; later enablement must remain blocked",
      );
    }

    let verification: { readonly verified: boolean; readonly observedEvidence: string };
    try {
      verification = this.verify(snapshot, executable);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "unknown verification failure";
      return failureResult(
        input,
        `rollback verification failed: ${detail}`,
        "rollback verification is unverified; later enablement must remain blocked",
      );
    }

    if (!verification.verified) {
      return failureResult(
        input,
        verification.observedEvidence,
        "rollback verification failed; later enablement must remain blocked",
      );
    }

    const rollback: RollbackRecord = {
      rollbackId: input.rollbackId,
      targetArtifactOrScope: input.targetArtifactOrScope,
      preChangeStateRef: input.preChangeStateRef,
      rollbackAction: input.rollbackAction,
      expectedSuccessSignal: input.expectedSuccessSignal,
      observedEvidence: verification.observedEvidence,
      result: "pass",
      verificationRunRef: evidenceRef(input.rollbackId),
      owner: input.owner,
    };
    return {
      status: "pass",
      output: rollback,
      blockers: [],
      evidenceRefs: [rollback.verificationRunRef],
    };
  }

  public assessReadiness(result: StageResult<RollbackRecord>): RollbackExecutionResult {
    const rollback = result.output ?? {
      rollbackId: "rollback-unavailable",
      targetArtifactOrScope: "unavailable",
      preChangeStateRef: "unavailable",
      rollbackAction: "unavailable",
      expectedSuccessSignal: "unavailable",
      observedEvidence: "rollback result was unavailable",
      result: "blocked" as const,
      verificationRunRef: "rollback:unavailable",
      owner: "unavailable",
      limitation: "rollback readiness is unverified",
    };
    const readinessEvidenceIsComplete = [
      rollback.rollbackId,
      rollback.targetArtifactOrScope,
      rollback.preChangeStateRef,
      rollback.rollbackAction,
      rollback.expectedSuccessSignal,
      rollback.observedEvidence,
      rollback.verificationRunRef,
      rollback.owner,
    ].every(nonEmpty);
    const restoredBytesVerified =
      result.status === "pass" &&
      rollback.result === "pass" &&
      readinessEvidenceIsComplete;
    return {
      rollback,
      restoredBytesVerified,
      laterEnablementBlocked: !restoredBytesVerified,
    };
  }

  private isExecutableRequest(input: ExecutableRollbackRequest): boolean {
    return (
      input !== null &&
      typeof input === "object" &&
      (input.mode === "restore" || input.mode === "disable" || input.mode === "no_change")
    );
  }

  private restoreSnapshot(snapshot: PreChangeSnapshot): void {
    if (!snapshot.existedBeforeChange) {
      if (existsSync(snapshot.targetPath)) {
        // Never recurse: a path created after the snapshot may now be a
        // directory containing unrelated work, which must remain untouched.
        rmSync(snapshot.targetPath, { force: true, recursive: false });
      }
      return;
    }

    if (snapshot.bytes === undefined || snapshot.contentHash === undefined) {
      throw new Error("pre-change snapshot has no trusted bytes for an existing target");
    }
    mkdirSync(dirname(snapshot.targetPath), { recursive: true });
    writeFileSync(snapshot.targetPath, snapshot.bytes);
  }

  private disableTarget(targetPath: string, disableBytes: Uint8Array | undefined): void {
    if (!isByteSequence(disableBytes)) {
      throw new Error("disable rollback requires explicit disabled bytes");
    }
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, disableBytes);
  }

  private verify(
    snapshot: PreChangeSnapshot,
    request: ExecutableRollbackRequest,
  ): { readonly verified: boolean; readonly observedEvidence: string } {
    if (request.mode === "restore") {
      if (!snapshot.existedBeforeChange) {
        const verified = !existsSync(snapshot.targetPath);
        return {
          verified,
          observedEvidence: verified
            ? "target was absent before change and is absent after restore"
            : "target was absent before change but remains after restore",
        };
      }

      const currentBytes = existsSync(snapshot.targetPath)
        ? new Uint8Array(readFileSync(snapshot.targetPath))
        : undefined;
      const currentHash = currentBytes === undefined ? undefined : contentHash(currentBytes);
      const verified = currentHash === snapshot.contentHash;
      return {
        verified,
        observedEvidence: verified
          ? `restored bytes verified by ${currentHash}`
          : `restored bytes did not match captured hash ${snapshot.contentHash ?? "unavailable"}`,
      };
    }

    if (request.mode === "disable") {
      const currentBytes = existsSync(snapshot.targetPath)
        ? new Uint8Array(readFileSync(snapshot.targetPath))
        : undefined;
      const verified =
        currentBytes !== undefined &&
        request.disableBytes !== undefined &&
        Buffer.compare(currentBytes, Buffer.from(request.disableBytes)) === 0;
      return {
        verified,
        observedEvidence: verified
          ? "disabled bytes verified"
          : "disabled bytes did not match the requested disabled state",
      };
    }

    return {
      verified: true,
      observedEvidence: "no-change disposition recorded; no artifact mutation was required",
    };
  }

  private recordNoChange(input: RollbackRequest): StageResult<RollbackRecord> {
    const rollback: RollbackRecord = {
      rollbackId: input.rollbackId,
      targetArtifactOrScope: input.targetArtifactOrScope,
      preChangeStateRef: input.preChangeStateRef,
      rollbackAction: input.rollbackAction,
      expectedSuccessSignal: input.expectedSuccessSignal,
      observedEvidence: "no-change disposition recorded; no artifact mutation was required",
      result: "pass",
      verificationRunRef: evidenceRef(input.rollbackId),
      owner: input.owner,
      limitation: "no rollback applies",
    };
    return { status: "pass", output: rollback, blockers: [], evidenceRefs: [rollback.verificationRunRef] };
  }
}

export function createRollbackManager(): RollbackManagerService {
  return new RollbackManagerService();
}

import {
  createGeneratedArtifactPath,
  resolveApprovedArtifactPath,
} from "./artifactPaths";
import type {
  AuditRunConfiguration,
  AuditWaveConfiguration,
} from "./config";
import type { ImmutableRunInputs } from "./runIdentity";

export interface PreparedWaveExecution {
  readonly mode: "source-inspection-plan";
  readonly wave: AuditWaveConfiguration;
  readonly immutableRunInputs: ImmutableRunInputs;
  readonly ownedOutputPaths: readonly string[];
}

export function prepareWaveExecution(
  repositoryRoot: string,
  waveId: number,
  config: AuditRunConfiguration,
  immutableRunInputs: ImmutableRunInputs,
): PreparedWaveExecution {
  const wave = config.waves.find((candidate) => candidate.id === waveId);
  if (!wave) {
    throw new Error(`Unknown audit wave: ${waveId}`);
  }

  const ownedOutputPaths = wave.ownedOutputs.map((purpose) => {
    const relativePath = createGeneratedArtifactPath(
      immutableRunInputs.runId,
      purpose,
      `wave-${wave.id}/manifest.json`,
      config,
    );
    return resolveApprovedArtifactPath(
      repositoryRoot,
      relativePath,
      config,
      immutableRunInputs.runId,
    ).relativePath;
  });

  return Object.freeze({
    mode: "source-inspection-plan" as const,
    wave,
    immutableRunInputs,
    ownedOutputPaths: Object.freeze(ownedOutputPaths),
  });
}

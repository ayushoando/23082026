import { execFileSync } from "node:child_process";

import type { LoadedAuditConfiguration } from "./config";

export interface RepositoryRevision {
  readonly commit: string;
  readonly committedAt: string;
}

export interface ImmutableRunInputs {
  readonly runId: string;
  readonly auditId: string;
  readonly schemaVersion: string;
  readonly specId: string;
  readonly specConfigPath: string;
  readonly configPath: string;
  readonly configurationHash: string;
  readonly repositoryRevision: string;
  readonly revisionTimestamp: string;
}

export class AuditRunIdentityError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AuditRunIdentityError";
  }
}

function executeGit(repositoryRoot: string, args: readonly string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    throw new AuditRunIdentityError(
      `Unable to record repository revision: ${String(error)}`,
    );
  }
}

export function readRepositoryRevision(
  repositoryRoot: string,
): RepositoryRevision {
  const commit = executeGit(repositoryRoot, ["rev-parse", "HEAD"]);
  const committedAt = executeGit(repositoryRoot, [
    "show",
    "-s",
    "--format=%cI",
    "HEAD",
  ]);
  if (!/^[a-f0-9]{40}$/.test(commit)) {
    throw new AuditRunIdentityError(
      `Repository revision is not a full commit hash: ${commit}`,
    );
  }
  if (!Number.isFinite(Date.parse(committedAt))) {
    throw new AuditRunIdentityError(
      `Repository revision timestamp is invalid: ${committedAt}`,
    );
  }
  return Object.freeze({ commit, committedAt });
}

function compactTimestamp(timestamp: string): string {
  return new Date(timestamp)
    .toISOString()
    .replace(/[-:.]/g, "")
    .replace("Z", "Z");
}

export function createImmutableRunInputs(
  loaded: LoadedAuditConfiguration,
  revision: RepositoryRevision,
): ImmutableRunInputs {
  const runId = `${compactTimestamp(revision.committedAt)}-${revision.commit.slice(0, 12)}-${loaded.configurationHash.slice(0, 12)}`;
  const inputs: ImmutableRunInputs = {
    runId,
    auditId: loaded.config.auditId,
    schemaVersion: loaded.config.schemaVersion,
    specId: loaded.config.specId,
    specConfigPath: loaded.config.specConfigPath,
    configPath: loaded.configPath,
    configurationHash: loaded.configurationHash,
    repositoryRevision: revision.commit,
    revisionTimestamp: revision.committedAt,
  };
  return Object.freeze(inputs);
}

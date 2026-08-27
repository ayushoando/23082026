/**
 * Frozen implementation-wave roots and execution constraints for
 * kiro-repo-guidance-setup.
 *
 * This manifest selects the repository-local paths for the feature wave. It
 * does not grant enablement, replace AGENTS.md, or complete the later shared
 * contract freeze and validation stages.
 */

export type WaveManifest = {
  readonly featureName: "kiro-repo-guidance-setup";
  readonly repositoryRoot: "D:\\23082026";
  readonly roots: {
    readonly implementation: "scripts/kiro-repo-guidance-setup/";
    readonly laneTests: {
      readonly laneA: "tests/kiro-repo-guidance-setup/lane-a/";
      readonly laneB: "tests/kiro-repo-guidance-setup/lane-b/";
      readonly laneC: "tests/kiro-repo-guidance-setup/lane-c/";
      readonly laneD: "tests/kiro-repo-guidance-setup/lane-d/";
    };
    readonly integrationTests: "tests/kiro-repo-guidance-setup/integration/";
    readonly generatedEvidence: "results/kiro-repo-guidance-setup/";
  };
  readonly rootExecution: {
    readonly workingDirectory: "D:\\23082026";
    readonly packageManager: "pnpm";
    readonly packageManagerScope: "repository-root-only";
    readonly worktrees: "prohibited";
    readonly hiddenSpawning: "prohibited";
    readonly automaticRetries: "prohibited";
    readonly automaticReplans: "prohibited";
  };
  readonly concurrency: {
    readonly defaultRepositoryMaximumActiveAgents: 1;
    readonly featureWaveMaximumActiveAgents: 4;
    readonly featureWaveScope: "feature-only";
    readonly disjointFileOwnershipRequired: true;
    readonly sharedContractFreezeRequiredBeforeDependentWork: true;
    readonly reservationRequiredBeforeEveryMutation: true;
  };
  readonly generatedOutputOwnership: {
    readonly laneSharedGeneratedOutputOwnership: "none";
    readonly integrationOwner: "post-wave-integration-validation-gate";
    readonly integrationOwnedPaths: readonly [
      "scripts/kiro-repo-guidance-setup/integration-gate.ts",
      "scripts/kiro-repo-guidance-setup/pipeline.ts",
      "scripts/kiro-repo-guidance-setup/enablement.ts",
      "tests/kiro-repo-guidance-setup/integration/",
      "results/kiro-repo-guidance-setup/"
    ];
    readonly laneRestriction: "lanes-must-not-write-shared-generated-output";
  };
  readonly od04: {
    readonly decisionId: "OD-04";
    readonly approvalStatus: "owner-approved-conditional";
    readonly scope: "kiro-repo-guidance-setup-only";
    readonly maximumActiveAgents: 4;
    readonly requiredControls: readonly [
      "disjoint-declared-file-ownership",
      "explicit-read-write-scopes",
      "file-ownership-reservation-before-mutation",
      "shared-contract-freeze-before-dependent-work",
      "named-approval-boundaries",
      "single-post-wave-integration-validation-gate",
      "sequential-read-only-reviewers"
    ];
    readonly prohibitedControls: readonly [
      "worktrees",
      "hidden-spawning",
      "automatic-retries",
      "automatic-replans",
      "shared-generated-output-writes",
      "crew-execution",
      "general-repository-policy-change"
    ];
    readonly conflictPolicy: "stop-affected-agent-or-wave-fail-closed";
    readonly statusBeforeLaterValidation: "pending";
  };
  readonly postWave: {
    readonly integrationGateCount: 1;
    readonly reviewerOrder: readonly [
      "EvidenceCompatibilityReviewer",
      "SafetyRollbackReviewer"
    ];
    readonly reviewerMaximumConcurrency: 1;
    readonly reviewerIterationCeiling: 3;
    readonly reviewersReadOnly: true;
    readonly enablementRequiresBothReviewerResults: true;
  };
  readonly status: "roots-frozen-manifest-selected";
};

export const waveManifest = {
  featureName: "kiro-repo-guidance-setup",
  repositoryRoot: "D:\\23082026",
  roots: {
    implementation: "scripts/kiro-repo-guidance-setup/",
    laneTests: {
      laneA: "tests/kiro-repo-guidance-setup/lane-a/",
      laneB: "tests/kiro-repo-guidance-setup/lane-b/",
      laneC: "tests/kiro-repo-guidance-setup/lane-c/",
      laneD: "tests/kiro-repo-guidance-setup/lane-d/"
    },
    integrationTests: "tests/kiro-repo-guidance-setup/integration/",
    generatedEvidence: "results/kiro-repo-guidance-setup/"
  },
  rootExecution: {
    workingDirectory: "D:\\23082026",
    packageManager: "pnpm",
    packageManagerScope: "repository-root-only",
    worktrees: "prohibited",
    hiddenSpawning: "prohibited",
    automaticRetries: "prohibited",
    automaticReplans: "prohibited"
  },
  concurrency: {
    defaultRepositoryMaximumActiveAgents: 1,
    featureWaveMaximumActiveAgents: 4,
    featureWaveScope: "feature-only",
    disjointFileOwnershipRequired: true,
    sharedContractFreezeRequiredBeforeDependentWork: true,
    reservationRequiredBeforeEveryMutation: true
  },
  generatedOutputOwnership: {
    laneSharedGeneratedOutputOwnership: "none",
    integrationOwner: "post-wave-integration-validation-gate",
    integrationOwnedPaths: [
      "scripts/kiro-repo-guidance-setup/integration-gate.ts",
      "scripts/kiro-repo-guidance-setup/pipeline.ts",
      "scripts/kiro-repo-guidance-setup/enablement.ts",
      "tests/kiro-repo-guidance-setup/integration/",
      "results/kiro-repo-guidance-setup/"
    ],
    laneRestriction: "lanes-must-not-write-shared-generated-output"
  },
  od04: {
    decisionId: "OD-04",
    approvalStatus: "owner-approved-conditional",
    scope: "kiro-repo-guidance-setup-only",
    maximumActiveAgents: 4,
    requiredControls: [
      "disjoint-declared-file-ownership",
      "explicit-read-write-scopes",
      "file-ownership-reservation-before-mutation",
      "shared-contract-freeze-before-dependent-work",
      "named-approval-boundaries",
      "single-post-wave-integration-validation-gate",
      "sequential-read-only-reviewers"
    ],
    prohibitedControls: [
      "worktrees",
      "hidden-spawning",
      "automatic-retries",
      "automatic-replans",
      "shared-generated-output-writes",
      "crew-execution",
      "general-repository-policy-change"
    ],
    conflictPolicy: "stop-affected-agent-or-wave-fail-closed",
    statusBeforeLaterValidation: "pending"
  },
  postWave: {
    integrationGateCount: 1,
    reviewerOrder: ["EvidenceCompatibilityReviewer", "SafetyRollbackReviewer"],
    reviewerMaximumConcurrency: 1,
    reviewerIterationCeiling: 3,
    reviewersReadOnly: true,
    enablementRequiresBothReviewerResults: true
  },
  status: "roots-frozen-manifest-selected"
} as const satisfies WaveManifest;

export default waveManifest;

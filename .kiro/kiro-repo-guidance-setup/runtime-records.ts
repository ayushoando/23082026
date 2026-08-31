/**
 * Four-slot controlled-task records and runtime-boundary checker.
 *
 * The checker accepts untrusted record data and fails closed. A declared roster
 * is not proof that a Kiro host created or loaded four runtime Agents.
 */

export const ACTIVE_ROLES = [
  "Scout/Map",
  "Planner/Risk",
  "Implementer",
  "Verifier/Reporter",
] as const;

export type ActiveRole = (typeof ACTIVE_ROLES)[number];

export const ACTIVE_AGENT_IDS = ["S/M-01", "P/R-01", "I/C-01", "V/R-01"] as const;
export type ActiveAgentId = (typeof ACTIVE_AGENT_IDS)[number];

export const ACTIVE_ROLE_BY_AGENT: Readonly<Record<ActiveAgentId, ActiveRole>> = {
  "S/M-01": "Scout/Map",
  "P/R-01": "Planner/Risk",
  "I/C-01": "Implementer",
  "V/R-01": "Verifier/Reporter",
};

export const LIFECYCLE_STATUSES = [
  "planned",
  "assigned",
  "ready",
  "in-progress",
  "blocked",
  "denied",
  "handoff-ready",
  "serial-integrated",
  "verified",
  "complete",
  "pending-owner",
  "not-observed",
] as const;

export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export const ACTIONABLE_LIFECYCLE_STATUSES = [
  "assigned",
  "ready",
  "in-progress",
  "handoff-ready",
  "serial-integrated",
] as const satisfies readonly LifecycleStatus[];

export const ENFORCEMENT_STATUSES = [
  "guidance-only",
  "not-observed",
  "partially-enforced",
  "enforced",
  "blocked",
] as const;

export type EnforcementStatus = (typeof ENFORCEMENT_STATUSES)[number];

export type Availability = "available" | "limited" | "unavailable";

export interface ActiveAgentEntry {
  readonly agentId: string;
  readonly role: ActiveRole;
  readonly coordinator: boolean;
  readonly readPermission: boolean;
  readonly writePermission: boolean;
  readonly ownedPaths: readonly string[];
  readonly exclusions: readonly string[];
  readonly availability: Availability;
  readonly status: LifecycleStatus;
  readonly nextOwner: string;
}

export type AgentRosterEntries = readonly [
  ActiveAgentEntry,
  ActiveAgentEntry,
  ActiveAgentEntry,
  ActiveAgentEntry,
];

export interface AgentRoster {
  readonly taskId: string;
  readonly agents: AgentRosterEntries;
  readonly coordinatorAgentId: string;
  readonly conflictStopRule: "attached";
  readonly status: LifecycleStatus;
  readonly runtimeActivation: "observed" | "not-observed";
}

export interface OwnershipMatrixEntry {
  readonly objective: string;
  readonly ownerAgentId: string;
  readonly exactPaths: readonly string[];
  readonly permission: "read-only" | "exclusive-write" | "serial-integration";
  readonly exclusions: readonly string[];
}

export interface RouteRecord {
  readonly taskOutcome: string;
  readonly domain: string;
  readonly candidatePaths: readonly string[];
  readonly selectedSkills: readonly string[];
  readonly rejectedSkills: readonly string[];
  readonly workflowMode: "Vibe" | "Plan" | "Spec" | "Autopilot" | "Supervised";
  readonly operationalRisk: string;
  readonly commandClassification: readonly string[];
  readonly protectedPathLock:
    | "Locked"
    | "explicitly-owner-authorized"
    | "writable"
    | "not-applicable";
  readonly siteWriteGate: "Core Product Write" | "Non-Core Artifact" | "not-applicable";
  readonly nextAction: string;
}

export interface PreActionGateRecord {
  readonly actionId: string;
  readonly action: "read" | "write" | "delete" | "command" | "delegation" | "handoff";
  readonly decision: "allow" | "deny";
  readonly reason: string;
  readonly nextOwnerAction: string;
  readonly recordedAtOrOrder: string;
}

export interface HandoffRecord {
  readonly objective: string;
  readonly roleAndNextOwner: string;
  readonly scope: string;
  readonly pathsRead: readonly string[];
  readonly pathsChanged: readonly string[] | "not-observed";
  readonly routeRecord: string;
  readonly evidence: readonly string[];
  readonly decisions: readonly string[];
  readonly coverageGaps: readonly string[];
  readonly validationCommand: string;
  readonly repositoryRoot: string;
  readonly authorizationState: string;
  readonly hookDecision: string;
  readonly exitStatus: string;
  readonly validationLimitation: string;
  readonly blockers: readonly string[];
  readonly nextAction: string;
  readonly status: LifecycleStatus;
}

export interface CompletionRecord {
  readonly changedFiles: readonly string[];
  readonly changedFileReasons: readonly string[];
  readonly observedEvidence: readonly string[];
  readonly pendingValidation: readonly string[];
  readonly remainingIssues: readonly string[];
  readonly separateApprovalWork: readonly string[];
  readonly trueBlockers: readonly string[];
  readonly finalStatus: LifecycleStatus;
  readonly enforcementStatus: EnforcementStatus;
  readonly runtimeActivation: "observed" | "not-observed";
}

export interface ControlledTaskRecords {
  readonly roster: AgentRoster;
  readonly ownershipMatrix: readonly OwnershipMatrixEntry[];
  readonly routeRecord: RouteRecord;
  readonly preActionGateRecords: readonly PreActionGateRecord[];
  readonly handoffRecords: readonly HandoffRecord[];
  readonly conflictStopRecord: string;
  readonly completionRecord: CompletionRecord;
}

export interface RecordCheck {
  readonly valid: boolean;
  readonly blockers: readonly string[];
  readonly nextOwnerAction: string;
}

export const DECLARED_RUNTIME_ROSTER: AgentRoster = {
  taskId: "oando-master/runtime-four-slot-records",
  agents: [
    {
      agentId: "S/M-01",
      role: "Scout/Map",
      coordinator: false,
      readPermission: true,
      writePermission: false,
      ownedPaths: ["read-only evidence"],
      exclusions: ["writes", "deletes", "commands", "delegation"],
      availability: "available",
      status: "ready",
      nextOwner: "P/R-01",
    },
    {
      agentId: "P/R-01",
      role: "Planner/Risk",
      coordinator: false,
      readPermission: true,
      writePermission: false,
      ownedPaths: ["Route Record", "risk and approval planning"],
      exclusions: ["writes", "deletes", "commands", "implementation"],
      availability: "available",
      status: "ready",
      nextOwner: "I/C-01",
    },
    {
      agentId: "I/C-01",
      role: "Implementer",
      coordinator: true,
      readPermission: true,
      writePermission: true,
      ownedPaths: ["approved exclusive paths", "serial integration"],
      exclusions: ["unowned paths", "protected paths without exact authorization"],
      availability: "available",
      status: "ready",
      nextOwner: "V/R-01",
    },
    {
      agentId: "V/R-01",
      role: "Verifier/Reporter",
      coordinator: false,
      readPermission: true,
      writePermission: false,
      ownedPaths: ["read-only evidence", "Completion Record"],
      exclusions: ["implementation edits", "commands", "evidence promotion"],
      availability: "available",
      status: "ready",
      nextOwner: "Repository Owner",
    },
  ],
  coordinatorAgentId: "I/C-01",
  conflictStopRule: "attached",
  status: "ready",
  runtimeActivation: "not-observed",
};

export function isActiveRole(value: unknown): value is ActiveRole {
  return typeof value === "string" && ACTIVE_ROLES.includes(value as ActiveRole);
}

export function isActiveAgentId(value: unknown): value is ActiveAgentId {
  return typeof value === "string" && ACTIVE_AGENT_IDS.includes(value as ActiveAgentId);
}

export function isLifecycleStatus(value: unknown): value is LifecycleStatus {
  return typeof value === "string" && LIFECYCLE_STATUSES.includes(value as LifecycleStatus);
}

export function isActionableLifecycleStatus(value: unknown): value is LifecycleStatus {
  return (
    typeof value === "string" &&
    ACTIONABLE_LIFECYCLE_STATUSES.includes(value as (typeof ACTIONABLE_LIFECYCLE_STATUSES)[number])
  );
}

export function isEnforcementStatus(value: unknown): value is EnforcementStatus {
  return typeof value === "string" && ENFORCEMENT_STATUSES.includes(value as EnforcementStatus);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(nonEmptyString);
}

function requiredFields(record: Record<string, unknown>, fields: readonly string[]): string[] {
  return fields.filter((field) => !nonEmptyString(record[field]));
}

function validateStringArrayField(
  record: Record<string, unknown>,
  field: string,
  label: string,
  blockers: string[],
  requireNonEmpty = false,
): void {
  const value = record[field];
  if (!stringArray(value) || (requireNonEmpty && value.length === 0)) {
    blockers.push(`${label} must be a string array${requireNonEmpty ? " with at least one entry" : ""}`);
  }
}

function validateOwnershipMatrix(input: unknown): string[] {
  const blockers: string[] = [];
  if (!Array.isArray(input) || input.length === 0) {
    blockers.push("Ownership Matrix must contain at least one exact owner entry");
    return blockers;
  }
  for (const [index, candidate] of input.entries()) {
    if (!isRecord(candidate)) {
      blockers.push(`Ownership Matrix entry ${index + 1} is not an object`);
      continue;
    }
    const missing = requiredFields(candidate, ["objective", "ownerAgentId", "permission"]);
    if (missing.length > 0) blockers.push(`Ownership Matrix entry ${index + 1} is missing ${missing.join(", ")}`);
    if (!isActiveAgentId(candidate.ownerAgentId)) {
      blockers.push(`Ownership Matrix entry ${index + 1} has an unknown ownerAgentId`);
    }
    validateStringArrayField(candidate, "exactPaths", `Ownership Matrix entry ${index + 1}.exactPaths`, blockers, true);
    validateStringArrayField(candidate, "exclusions", `Ownership Matrix entry ${index + 1}.exclusions`, blockers);
    if (!["read-only", "exclusive-write", "serial-integration"].includes(candidate.permission as string)) {
      blockers.push(`Ownership Matrix entry ${index + 1} has an unknown permission`);
    }
  }
  return blockers;
}

function validateRouteRecord(input: unknown): string[] {
  if (!isRecord(input)) return ["Route Record is missing or not an object"];
  const blockers = requiredFields(input, [
    "taskOutcome",
    "domain",
    "workflowMode",
    "operationalRisk",
    "protectedPathLock",
    "siteWriteGate",
    "nextAction",
  ]);
  validateStringArrayField(input, "candidatePaths", "Route Record candidatePaths", blockers);
  validateStringArrayField(input, "selectedSkills", "Route Record selectedSkills", blockers);
  validateStringArrayField(input, "rejectedSkills", "Route Record rejectedSkills", blockers);
  validateStringArrayField(input, "commandClassification", "Route Record commandClassification", blockers);
  if (!["Vibe", "Plan", "Spec", "Autopilot", "Supervised"].includes(input.workflowMode as string)) {
    blockers.push("Route Record workflowMode is outside the closed vocabulary");
  }
  if (!["Locked", "explicitly-owner-authorized", "writable", "not-applicable"].includes(input.protectedPathLock as string)) {
    blockers.push("Route Record protectedPathLock is outside the closed vocabulary");
  }
  if (!["Core Product Write", "Non-Core Artifact", "not-applicable"].includes(input.siteWriteGate as string)) {
    blockers.push("Route Record siteWriteGate is outside the closed vocabulary");
  }
  return blockers;
}

function validatePreActionGateRecords(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return ["Pre-Action Gate Records must be present, even when no action has been observed"];
  }
  const blockers: string[] = [];
  for (const [index, candidate] of input.entries()) {
    if (!isRecord(candidate)) {
      blockers.push(`Pre-Action Gate Record ${index + 1} is not an object`);
      continue;
    }
    const missing = requiredFields(candidate, ["actionId", "action", "decision", "reason", "nextOwnerAction", "recordedAtOrOrder"]);
    if (missing.length > 0) blockers.push(`Pre-Action Gate Record ${index + 1} is missing ${missing.join(", ")}`);
    if (!["read", "write", "delete", "command", "delegation", "handoff"].includes(candidate.action as string)) {
      blockers.push(`Pre-Action Gate Record ${index + 1} has an unknown action`);
    }
    if (!["allow", "deny"].includes(candidate.decision as string)) {
      blockers.push(`Pre-Action Gate Record ${index + 1} has an unknown decision`);
    }
  }
  return blockers;
}

export function validateAgentRoster(input: unknown): RecordCheck {
  if (!isRecord(input)) {
    return {
      valid: false,
      blockers: ["Agent Roster is missing or not an object"],
      nextOwnerAction: "Provide one complete four-entry roster to the Serial Integration Owner.",
    };
  }

  const blockers = requiredFields(input, ["taskId", "coordinatorAgentId", "conflictStopRule", "status"]);
  const agents = input.agents;
  if (!Array.isArray(agents) || agents.length !== 4) {
    blockers.push("Agent Roster must contain exactly four entries");
  }
  if (input.conflictStopRule !== "attached") {
    blockers.push("Conflict Stop Rule must be attached to the roster");
  }
  if (!isActiveAgentId(input.coordinatorAgentId)) {
    blockers.push("coordinatorAgentId must identify one of the four roster entries");
  } else if (input.coordinatorAgentId !== "I/C-01") {
    blockers.push("coordinatorAgentId must be I/C-01, the Implementer/Serial Integration Owner slot");
  }
  if (!isLifecycleStatus(input.status)) {
    blockers.push("roster status is outside the closed lifecycle vocabulary");
  }
  if (input.runtimeActivation !== "observed" && input.runtimeActivation !== "not-observed") {
    blockers.push("runtimeActivation must distinguish observed from not-observed");
  }

  if (Array.isArray(agents) && agents.length === 4) {
    const seenAgentIds = new Set<string>();
    const seenRoles = new Set<string>();
    let coordinatorCount = 0;
    for (const [index, candidate] of agents.entries()) {
      if (!isRecord(candidate)) {
        blockers.push(`roster entry ${index + 1} is not an object`);
        continue;
      }
      const fields = requiredFields(candidate, [
        "agentId",
        "role",
        "ownedPaths",
        "exclusions",
        "availability",
        "nextOwner",
      ]);
      if (fields.length > 0) blockers.push(`roster entry ${index + 1} is missing ${fields.join(", ")}`);
      if (!isActiveAgentId(candidate.agentId)) {
        blockers.push(`roster entry ${index + 1} has an unknown agentId`);
      } else if (seenAgentIds.has(candidate.agentId)) {
        blockers.push(`roster entry ${index + 1} duplicates agentId ${candidate.agentId}`);
      } else {
        seenAgentIds.add(candidate.agentId);
        if (candidate.role !== ACTIVE_ROLE_BY_AGENT[candidate.agentId]) {
          blockers.push(`roster entry ${index + 1} role does not match its agentId`);
        }
      }
      if (!isActiveRole(candidate.role)) {
        blockers.push(`roster entry ${index + 1} has an unknown role`);
      } else if (seenRoles.has(candidate.role)) {
        blockers.push(`roster entry ${index + 1} duplicates role ${candidate.role}`);
      } else {
        seenRoles.add(candidate.role);
      }
      if (typeof candidate.coordinator !== "boolean") {
        blockers.push(`roster entry ${index + 1} must declare coordinator as a boolean`);
      } else if (candidate.coordinator) {
        coordinatorCount += 1;
      }
      if (typeof candidate.readPermission !== "boolean") {
        blockers.push(`roster entry ${index + 1} must declare readPermission`);
      }
      if (typeof candidate.writePermission !== "boolean") {
        blockers.push(`roster entry ${index + 1} must declare writePermission`);
      }
      validateStringArrayField(candidate, "ownedPaths", `roster entry ${index + 1}.ownedPaths`, blockers, true);
      validateStringArrayField(candidate, "exclusions", `roster entry ${index + 1}.exclusions`, blockers);
      if (!["available", "limited", "unavailable"].includes(candidate.availability as string)) {
        blockers.push(`roster entry ${index + 1} has an unknown availability state`);
      }
      if (!isLifecycleStatus(candidate.status)) {
        blockers.push(`roster entry ${index + 1} has an unknown lifecycle status`);
      }
      if (isActiveRole(candidate.role) && candidate.role !== "Implementer" && candidate.writePermission !== false) {
        blockers.push(`${candidate.role} must remain read-only`);
      }
    }
    if (coordinatorCount !== 1) blockers.push("exactly one roster entry must have coordinator=true");
    if (seenAgentIds.size !== 4) blockers.push("all four roster agent IDs must be unique and present");
    if (seenRoles.size !== 4) blockers.push("all four roster roles must be unique and present");
    if (isActiveAgentId(input.coordinatorAgentId)) {
      const coordinator = agents.find(
        (candidate): candidate is Record<string, unknown> =>
          isRecord(candidate) && candidate.agentId === input.coordinatorAgentId,
      );
      if (coordinator?.coordinator !== true) {
        blockers.push("coordinatorAgentId must point to the entry marked coordinator=true");
      }
      if (coordinator?.role !== "Implementer") {
        blockers.push("coordinatorAgentId must point to the Implementer role");
      }
    }
  }

  return {
    valid: blockers.length === 0,
    blockers,
    nextOwnerAction:
      blockers.length === 0
        ? "Roster is structurally valid; runtime loading remains not-observed."
        : "Stop before delegation or mutation, preserve the record, and route blockers to the Repository Owner.",
  };
}

export function validateHandoffRecord(input: unknown): RecordCheck {
  if (!isRecord(input)) {
    return {
      valid: false,
      blockers: ["Handoff Record is missing or not an object"],
      nextOwnerAction: "Return the handoff to its current owner for completion.",
    };
  }

  const blockers = requiredFields(input, [
    "objective",
    "roleAndNextOwner",
    "scope",
    "routeRecord",
    "validationCommand",
    "repositoryRoot",
    "authorizationState",
    "hookDecision",
    "exitStatus",
    "validationLimitation",
    "nextAction",
    "status",
  ]);
  validateStringArrayField(input, "pathsRead", "Handoff Record pathsRead", blockers, true);
  if (input.pathsChanged !== "not-observed") {
    validateStringArrayField(input, "pathsChanged", "Handoff Record pathsChanged", blockers);
  }
  for (const field of ["evidence", "decisions", "coverageGaps", "blockers"]) {
    validateStringArrayField(input, field, `Handoff Record ${field}`, blockers);
  }
  if (!isLifecycleStatus(input.status)) blockers.push("Handoff Record status is outside the closed lifecycle vocabulary");

  return {
    valid: blockers.length === 0,
    blockers,
    nextOwnerAction:
      blockers.length === 0
        ? "Handoff fields are complete; reconcile changed paths serially before acceptance."
        : "Do not accept the handoff or promote its status until every field is present.",
  };
}

export function validateCompletionRecord(input: unknown): RecordCheck {
  if (!isRecord(input)) {
    return {
      valid: false,
      blockers: ["Completion Record is missing or not an object"],
      nextOwnerAction: "Return the record to the Verifier/Reporter for completion.",
    };
  }

  const blockers = requiredFields(input, ["finalStatus", "enforcementStatus", "runtimeActivation"]);
  const arrayFields = [
    "changedFiles",
    "changedFileReasons",
    "observedEvidence",
    "pendingValidation",
    "remainingIssues",
    "separateApprovalWork",
    "trueBlockers",
  ];
  for (const field of arrayFields) {
    validateStringArrayField(input, field, `Completion Record ${field}`, blockers);
  }
  if (Array.isArray(input.changedFiles) && Array.isArray(input.changedFileReasons) && input.changedFiles.length !== input.changedFileReasons.length) {
    blockers.push("Completion Record changedFiles and changedFileReasons must have matching lengths");
  }
  if (!isLifecycleStatus(input.finalStatus)) blockers.push("finalStatus is outside the closed lifecycle vocabulary");
  if (!isEnforcementStatus(input.enforcementStatus)) blockers.push("enforcementStatus is outside the closed vocabulary");
  if (input.runtimeActivation !== "observed" && input.runtimeActivation !== "not-observed") {
    blockers.push("runtimeActivation must distinguish observed from not-observed");
  }
  if (input.finalStatus === "complete" && input.runtimeActivation !== "observed") {
    blockers.push("a runtime-unobserved record cannot claim runtime completion");
  }

  return {
    valid: blockers.length === 0,
    blockers,
    nextOwnerAction:
      blockers.length === 0
        ? "Completion fields are structurally valid; verify scope and evidence before closure."
        : "Keep the task pending-owner, blocked, or not-observed until the missing proof is supplied.",
  };
}

export function validateControlledTaskRecords(input: unknown): RecordCheck {
  if (!isRecord(input)) {
    return {
      valid: false,
      blockers: ["controlled-task record set is missing or not an object"],
      nextOwnerAction: "Provide the complete record set to the Serial Integration Owner.",
    };
  }

  const blockers = validateAgentRoster(input.roster).blockers.slice();
  const handoffs = input.handoffRecords;
  if (!Array.isArray(handoffs) || handoffs.length === 0) {
    blockers.push("Handoff Record Register must contain at least one handoff record");
  } else {
    for (const [index, handoff] of handoffs.entries()) {
      blockers.push(...validateHandoffRecord(handoff).blockers.map((blocker) => `handoff ${index + 1}: ${blocker}`));
    }
  }
  blockers.push(...validateCompletionRecord(input.completionRecord).blockers);
  blockers.push(...validateOwnershipMatrix(input.ownershipMatrix));
  blockers.push(...validateRouteRecord(input.routeRecord));
  blockers.push(...validatePreActionGateRecords(input.preActionGateRecords));
  if (!nonEmptyString(input.conflictStopRecord)) {
    blockers.push("Conflict Stop Record state must be present, including not-observed");
  }

  return {
    valid: blockers.length === 0,
    blockers,
    nextOwnerAction:
      blockers.length === 0
        ? "Record set is structurally valid; host activation and enforcement remain separately evidenced."
        : "Stop closure and preserve every blocker until the record set is reconciled.",
  };
}

/**
 * Fail-closed Pre-Action Enforcement evaluator for the six controlled actions.
 *
 * This is an executable governance boundary, not product runtime code. It
 * evaluates untrusted Action Records and never selects an alternate tool,
 * path, Agent, permission, or inferred approval.
 */

import { REPOSITORY_ROOT } from "./contracts";
import {
  ACTIVE_AGENT_IDS,
  ACTIVE_ROLE_BY_AGENT,
  ACTIVE_ROLES,
  isActionableLifecycleStatus,
  isActiveAgentId,
  isActiveRole,
  type ActiveRole,
} from "./runtime-records";

export const ACTION_KINDS = [
  "read",
  "write",
  "delete",
  "command",
  "delegation",
  "handoff",
] as const;

export type ActionKind = (typeof ACTION_KINDS)[number];
export type GateDecision = "allow" | "deny";
export type OwnershipState = "exclusive" | "serial" | "unowned" | "conflict";
export type AuthorizationState =
  | "explicit-current-session"
  | "absent"
  | "not-required"
  | "not-observed";
export type HookDecision = "permitted" | "denied" | "not-required" | "not-observed";
export type ProtectedPathLock =
  | "Locked"
  | "explicitly-owner-authorized"
  | "writable"
  | "not-applicable";
export type SiteWriteGate = "Core Product Write" | "Non-Core Artifact" | "not-applicable";

export interface ActionRecord {
  readonly taskId: string;
  readonly agentId: string;
  readonly role: ActiveRole;
  readonly action: ActionKind;
  readonly targetPath?: string;
  readonly command?: string;
  readonly repositoryRoot?: string;
  readonly requestedScope: string;
  readonly ownershipState: OwnershipState;
  readonly authorizationState: AuthorizationState;
  readonly hookDecision: HookDecision;
  readonly routeRecordRef: string;
  readonly deliveryConditionRef?: string;
  readonly readPermission: boolean;
  readonly writePermission: boolean;
  readonly currentStatus: string;
  readonly protectedPathLock: ProtectedPathLock;
  readonly siteWriteGate: SiteWriteGate;
  readonly ownerAuthorization: boolean;
  readonly commandClassification?: string;
  readonly deletionScope?: string;
  readonly receiverAgentId?: string;
  readonly receiverRole?: ActiveRole;
  readonly targetPaths?: readonly string[];
  readonly coordinator?: boolean;
  readonly receivingOwner?: string;
  readonly handoffFieldsComplete?: boolean;
  readonly changedPathsOwnershipMatches?: boolean;
  readonly observedValidationState?: string;
}

export interface PreActionDecision {
  readonly action: ActionKind | "unknown";
  readonly decision: GateDecision;
  readonly reason: string;
  readonly nextOwnerAction: string;
  readonly recordedAtOrOrder: "pre-action";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function isProtectedPath(targetPath: string): boolean {
  const normalized = normalizePath(targetPath);
  return (
    !normalized.includes("/") ||
    normalized.startsWith("docs/") ||
    normalized.startsWith("Agents/") ||
    normalized.startsWith(".kiro/agents/")
  );
}

function isSitePath(targetPath: string): boolean {
  const normalized = normalizePath(targetPath);
  return normalized === "site" || normalized.startsWith("site/");
}

function valueAsString(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  return nonEmptyString(value) ? value : null;
}

function valueAsBoolean(record: Record<string, unknown>, field: string): boolean | null {
  const value = record[field];
  return typeof value === "boolean" ? value : null;
}

function arrayOfNonEmptyStrings(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(nonEmptyString);
}

function deny(action: ActionKind | "unknown", reason: string, nextOwnerAction: string): PreActionDecision {
  return {
    action,
    decision: "deny",
    reason,
    nextOwnerAction,
    recordedAtOrOrder: "pre-action",
  };
}

function allow(action: ActionKind): PreActionDecision {
  return {
    action,
    decision: "allow",
    reason: "all action-specific pre-action checks passed",
    nextOwnerAction: "Proceed only with the exact recorded target and scope.",
    recordedAtOrOrder: "pre-action",
  };
}

function commonBlocker(record: Record<string, unknown>): PreActionDecision | null {
  const requiredStrings = [
    "taskId",
    "agentId",
    "role",
    "action",
    "requestedScope",
    "ownershipState",
    "authorizationState",
    "hookDecision",
    "routeRecordRef",
    "currentStatus",
    "protectedPathLock",
    "siteWriteGate",
  ];
  const missing = requiredStrings.filter((field) => !nonEmptyString(record[field]));
  const readPermission = valueAsBoolean(record, "readPermission");
  const writePermission = valueAsBoolean(record, "writePermission");
  if (readPermission === null) missing.push("readPermission");
  if (writePermission === null) missing.push("writePermission");
  if (valueAsBoolean(record, "ownerAuthorization") === null) missing.push("ownerAuthorization");
  if (missing.length > 0) {
    return deny(
      "unknown",
      `Action Record is missing or malformed: ${missing.join(", ")}`,
      "Stop before execution, preserve the record, and ask the Repository Owner for a complete Action Record.",
    );
  }

  const action = record.action;
  if (typeof action !== "string" || !ACTION_KINDS.includes(action as ActionKind)) {
    return deny(
      "unknown",
      "Action Record names an unknown action kind",
      "Stop and route the unsupported action to the Repository Owner; do not select an alternate action.",
    );
  }
  const typedAction = action as ActionKind;
  if (!["exclusive", "serial", "unowned", "conflict"].includes(record.ownershipState as string)) {
    return deny(
      typedAction,
      "ownershipState is outside the closed ownership vocabulary",
      "Stop and reconcile exact ownership before execution.",
    );
  }
  if (["unowned", "conflict"].includes(record.ownershipState as string)) {
    return deny(
      typedAction,
      `Action Record ownership is ${record.ownershipState}`,
      "Invoke the Conflict Stop Rule and route the exact paths to the Repository Owner.",
    );
  }
  if (!["explicit-current-session", "absent", "not-required", "not-observed"].includes(record.authorizationState as string)) {
    return deny(
      typedAction,
      "authorizationState is outside the closed vocabulary",
      "Stop and record an explicit current-session authorization state.",
    );
  }
  if (!["permitted", "denied", "not-required", "not-observed"].includes(record.hookDecision as string)) {
    return deny(
      typedAction,
      "hookDecision is outside the closed vocabulary",
      "Stop and obtain a host hook decision; do not infer permission.",
    );
  }
  if (!["Locked", "explicitly-owner-authorized", "writable", "not-applicable"].includes(record.protectedPathLock as string)) {
    return deny(
      typedAction,
      "protectedPathLock is outside the closed vocabulary",
      "Stop and classify the exact target before execution.",
    );
  }
  if (!["Core Product Write", "Non-Core Artifact", "not-applicable"].includes(record.siteWriteGate as string)) {
    return deny(
      typedAction,
      "siteWriteGate is outside the closed vocabulary",
      "Stop and classify whether the target is a permitted Core Product Write.",
    );
  }

  const agentId = record.agentId;
  const role = record.role;
  if (!isActiveAgentId(agentId) || !isActiveRole(role)) {
    return deny(
      typedAction,
      "Action Record identity or role is outside the four-entry roster",
      "Stop delegation or mutation and reconcile the roster before retrying.",
    );
  }
  if (ACTIVE_ROLE_BY_AGENT[agentId] !== role) {
    return deny(
      typedAction,
      "Action Record agentId and role do not match",
      "Stop and route the identity conflict to the Serial Integration Owner.",
    );
  }
  if (!isActionableLifecycleStatus(record.currentStatus)) {
    return deny(
      typedAction,
      "Action Record status is missing, terminal, blocked, or not-observed",
      "Move the task to an actionable lifecycle state through the owner-controlled handoff; do not infer readiness.",
    );
  }

  return null;
}

function targetBlocker(record: Record<string, unknown>, action: ActionKind): PreActionDecision | null {
  if (!["read", "write", "delete"].includes(action)) return null;
  const targetPath = valueAsString(record, "targetPath");
  if (targetPath === null) {
    return deny(action, "read/write/delete requires one exact targetPath", "Name one exact target and stop; do not infer a neighboring path.");
  }
  const protectedTarget = isProtectedPath(targetPath);
  const lock = record.protectedPathLock;
  if (protectedTarget && lock !== "Locked" && lock !== "explicitly-owner-authorized") {
    return deny(action, "protected target lacks a Protected Path Lock state", "Keep the source unchanged and obtain exact owner authorization for this file.");
  }
  if (action === "read") {
    if (record.readPermission !== true) {
      return deny(action, "read permission is not true", "Stop before reading and route the missing read permission to the owner.");
    }
    return null;
  }
  if (record.writePermission !== true) {
    return deny(action, "write permission is not true", "Stop before mutation and route the missing write permission to the owner.");
  }
  if (!["exclusive", "serial"].includes(record.ownershipState as string)) {
    return deny(action, "write/delete requires exclusive or serial ownership", "Stop and reconcile exact ownership before mutation.");
  }
  if (action === "delete") {
    if (valueAsString(record, "deletionScope") === null) {
      return deny(action, "delete requires an explicit deletion scope", "Name the exact deletion scope and stop; do not infer neighboring files.");
    }
    if (record.ownershipState !== "exclusive") {
      return deny(action, "delete requires exclusive ownership", "Stop and obtain an exclusive owner reservation before deletion.");
    }
    if (record.authorizationState !== "explicit-current-session" || record.ownerAuthorization !== true) {
      return deny(action, "delete requires exact current-session owner authorization", "Preserve the target and ask the owner to authorize this exact deletion.");
    }
  }
  if (protectedTarget) {
    if (lock !== "explicitly-owner-authorized" || record.authorizationState !== "explicit-current-session" || record.ownerAuthorization !== true) {
      return deny(action, "protected write lacks exact current-session owner authorization", "Preserve the protected source and ask the owner to name this exact file.");
    }
  }
  if (isSitePath(targetPath) && record.siteWriteGate !== "Core Product Write") {
    return deny(action, "Site Write Gate does not authorize this target as a Core Product Write", "Redirect Non-Core Artifacts away from site/ before continuing.");
  }
  if (valueAsString(record, "deliveryConditionRef") === null) {
    return deny(action, "write/delete requires a deliveryConditionRef", "Complete the Route Record and delivery condition before mutation.");
  }
  return null;
}

function commandBlocker(record: Record<string, unknown>, action: ActionKind): PreActionDecision | null {
  if (action !== "command") return null;
  const command = valueAsString(record, "command");
  const repositoryRoot = valueAsString(record, "repositoryRoot");
  const commandClassification = valueAsString(record, "commandClassification");
  if (command === null || repositoryRoot === null || commandClassification === null) {
    return deny(action, "command requires command, repositoryRoot, and commandClassification", "Stop before shell execution and complete the command record.");
  }
  if (["unclassified", "unknown", "not-observed"].includes(commandClassification)) {
    return deny(action, "command classification is unavailable or indeterminate", "Classify the exact command before execution; do not infer eligibility.");
  }
  if (repositoryRoot !== REPOSITORY_ROOT) {
    return deny(action, `command must use repository root ${REPOSITORY_ROOT}`, "Stop and reroute the command from the repository root.");
  }
  if (record.authorizationState !== "explicit-current-session") {
    return deny(action, "command lacks explicit current-session authorization", "Keep the command unrun and obtain exact owner authorization.");
  }
  if (record.hookDecision !== "permitted") {
    return deny(action, "command lacks an observed permitted Hook Decision", "Stop and preserve the denied or unobserved hook state.");
  }
  return null;
}

function delegationBlocker(record: Record<string, unknown>, action: ActionKind): PreActionDecision | null {
  if (action !== "delegation") return null;
  if (record.agentId !== "I/C-01" || record.role !== "Implementer" || record.coordinator !== true) {
    return deny(action, "only the I/C-01 Coordinator/Serial Integration Owner may delegate", "Stop and route delegation to the coordinator slot.");
  }
  if (record.authorizationState !== "explicit-current-session" || record.hookDecision !== "permitted") {
    return deny(action, "delegation lacks explicit authorization or an observed permitted Hook Decision", "Stop and preserve the denied or unobserved delegation state.");
  }
  const receiverAgentId = valueAsString(record, "receiverAgentId");
  const receiverRole = record.receiverRole;
  const targetPaths = record.targetPaths;
  if (!isActiveAgentId(receiverAgentId) || !isActiveRole(receiverRole) || ACTIVE_ROLE_BY_AGENT[receiverAgentId] !== receiverRole) {
    return deny(action, "delegation receiver is not one of the four roster entries with a matching role", "Stop; do not create a fifth or unrostered Agent.");
  }
  if (receiverAgentId === record.agentId) {
    return deny(action, "delegation receiver must be a different roster slot", "Route the work to another declared slot or keep it with the coordinator.");
  }
  if (!arrayOfNonEmptyStrings(targetPaths) || targetPaths.length === 0 || new Set(targetPaths).size !== targetPaths.length) {
    return deny(action, "delegation requires unique exact target paths", "Stop and name the receiver's exact non-overlapping scope before delegation.");
  }
  if (valueAsString(record, "deliveryConditionRef") === null || valueAsString(record, "receivingOwner") === null) {
    return deny(action, "delegation requires delivery condition and next owner", "Complete the Route Record and handoff ownership before delegation.");
  }
  return null;
}

function handoffBlocker(record: Record<string, unknown>, action: ActionKind): PreActionDecision | null {
  if (action !== "handoff") return null;
  if (record.handoffFieldsComplete !== true || record.changedPathsOwnershipMatches !== true) {
    return deny(action, "handoff fields or changed-path ownership match is incomplete", "Return the handoff for completion; do not accept missing or unexplained fields.");
  }
  if (valueAsString(record, "receivingOwner") === null || valueAsString(record, "observedValidationState") === null) {
    return deny(action, "handoff requires receiving owner and observed-versus-not-run validation state", "Record every unavailable field as not-observed and route it to the receiver.");
  }
  return null;
}

/** Evaluate one Action Record before the proposed action executes. */
export function evaluatePreAction(record: unknown): PreActionDecision {
  if (!isRecord(record)) {
    return deny("unknown", "Action Record is missing, malformed, or unavailable", "Fail closed before execution and ask the Repository Owner for the next action.");
  }

  const common = commonBlocker(record);
  if (common !== null) return common;
  const action = record.action as ActionKind;
  return (
    targetBlocker(record, action) ??
    commandBlocker(record, action) ??
    delegationBlocker(record, action) ??
    handoffBlocker(record, action) ??
    allow(action)
  );
}

export function rosterHasExactlyFourEntries(): boolean {
  return ACTIVE_AGENT_IDS.length === 4 && ACTIVE_ROLES.length === 4;
}

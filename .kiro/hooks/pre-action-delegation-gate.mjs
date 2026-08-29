import { readFileSync } from "node:fs";

const ROSTER = new Map([
  ["S/M-01", "Scout/Map"],
  ["P/R-01", "Planner/Risk"],
  ["I/C-01", "Implementer"],
  ["V/R-01", "Verifier/Reporter"],
]);

function readPayload() {
  try {
    const raw = readFileSync(0, "utf8");
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function deny(reason) {
  process.stderr.write(`${reason}\n`);
  process.exit(2);
}

const payload = readPayload();
const record = isRecord(payload) && isRecord(payload.actionRecord)
  ? payload.actionRecord
  : undefined;

if (!record) {
  deny(
    "Pre-Action Delegation Gate denied: missing or unavailable Action Record; provide task, coordinator, receiver, exact paths, delivery condition, and next owner.",
  );
}

if (record.action !== "delegation") {
  deny("Pre-Action Delegation Gate denied: host adapter received an unexpected action kind.");
}
if (!text(record.taskId) || !text(record.agentId) || !text(record.role)) {
  deny("Pre-Action Delegation Gate denied: delegator identity, role, or taskId is missing.");
}
if (record.coordinator !== true || record.agentId !== "I/C-01" || record.role !== "Implementer") {
  deny("Pre-Action Delegation Gate denied: only the declared I/C-01 coordinator slot may delegate.");
}
if (!text(record.receiverAgentId) || !ROSTER.has(record.receiverAgentId)) {
  deny("Pre-Action Delegation Gate denied: receiver is not one of the four declared roster entries.");
}
if (record.receiverRole !== ROSTER.get(record.receiverAgentId)) {
  deny("Pre-Action Delegation Gate denied: receiver role does not match the four-slot roster.");
}
if (!Array.isArray(record.targetPaths) || record.targetPaths.length === 0 || !record.targetPaths.every(text)) {
  deny("Pre-Action Delegation Gate denied: exact target paths are missing.");
}
if (!text(record.deliveryConditionRef) || !text(record.receivingOwner)) {
  deny("Pre-Action Delegation Gate denied: delivery condition or next owner is missing.");
}
if (record.ownershipState !== "exclusive" && record.ownershipState !== "serial") {
  deny("Pre-Action Delegation Gate denied: delegation ownership is not exclusive or serial.");
}
if (record.authorizationState !== "explicit-current-session") {
  deny("Pre-Action Delegation Gate denied: explicit current-session authorization is missing.");
}
if (record.hookDecision !== "permitted") {
  deny("Pre-Action Delegation Gate denied: host Hook Decision is not permitted.");
}

process.stdout.write("Pre-Action Delegation Gate allowed: four-slot and exact-scope checks passed.\n");
process.exit(0);

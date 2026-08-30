import type { PlannerHandoffRequest } from "./handoffSchema";

export interface PlannerHandoffDraft {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  inquiryType: PlannerHandoffRequest["inquiryType"];
  consent: boolean;
}

export interface PlannerHandoffConfirmation {
  referenceId: string;
  createdAt: string;
}

export interface PlannerHandoffRecoveryState {
  version: 1;
  draft: PlannerHandoffDraft;
  idempotencyKey: string;
  confirmation: PlannerHandoffConfirmation | null;
}

export const EMPTY_PLANNER_HANDOFF_DRAFT: PlannerHandoffDraft = {
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
  inquiryType: "quote",
  consent: false,
};

const INQUIRY_TYPES = new Set<PlannerHandoffDraft["inquiryType"]>([
  "quote",
  "design-support",
  "product-question",
]);

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseDraft(value: unknown): PlannerHandoffDraft {
  const source = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
  const inquiryType = INQUIRY_TYPES.has(source.inquiryType as PlannerHandoffDraft["inquiryType"])
    ? source.inquiryType as PlannerHandoffDraft["inquiryType"]
    : "quote";

  return {
    name: stringValue(source.name),
    email: stringValue(source.email),
    phone: stringValue(source.phone),
    company: stringValue(source.company),
    notes: stringValue(source.notes),
    inquiryType,
    consent: source.consent === true,
  };
}

function parseConfirmation(value: unknown): PlannerHandoffConfirmation | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const referenceId = stringValue(source.referenceId).trim();
  const createdAt = stringValue(source.createdAt).trim();
  if (!referenceId || !createdAt) return null;
  return { referenceId, createdAt };
}

export function createPlannerHandoffRecoveryState(
  idempotencyKey: string,
): PlannerHandoffRecoveryState {
  return {
    version: 1,
    draft: EMPTY_PLANNER_HANDOFF_DRAFT,
    idempotencyKey,
    confirmation: null,
  };
}

export function parsePlannerHandoffRecoveryState(
  serialized: string | null,
  createIdempotencyKey: () => string,
): PlannerHandoffRecoveryState {
  if (!serialized) return createPlannerHandoffRecoveryState(createIdempotencyKey());

  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return createPlannerHandoffRecoveryState(createIdempotencyKey());
    }
    const source = parsed as Record<string, unknown>;

    // Migrate the original draft-only shape while retaining every valid value.
    if (!("draft" in source)) {
      return {
        version: 1,
        draft: parseDraft(source),
        idempotencyKey: createIdempotencyKey(),
        confirmation: null,
      };
    }

    const idempotencyKey = stringValue(source.idempotencyKey).trim();
    return {
      version: 1,
      draft: parseDraft(source.draft),
      idempotencyKey: idempotencyKey || createIdempotencyKey(),
      confirmation: parseConfirmation(source.confirmation),
    };
  } catch {
    return createPlannerHandoffRecoveryState(createIdempotencyKey());
  }
}

export function serializePlannerHandoffRecoveryState(
  state: PlannerHandoffRecoveryState,
): string {
  return JSON.stringify(state);
}

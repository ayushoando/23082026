import type { ValidationRecord } from "./auditModel";
import { derivePlannerValidationManifest, recordValidationEvidence } from "./validationEvidence";
import {
  TASK_5_8_PENDING_VALIDATION,
  WORKSTREAM_5_VALIDATION_INPUT,
} from "./workstream5Evidence";

/**
 * Change-derived authored manifest for this Workstream 5 handoff. Entries remain
 * pending until their own observation is bound to this derived manifest; the
 * Task 5.6 performance prerequisite failure is recorded separately in
 * workstream5Evidence.ts without promoting it to a performance result.
 */
export const WORKSTREAM_5_VALIDATION_MANIFEST = derivePlannerValidationManifest([
  WORKSTREAM_5_VALIDATION_INPUT,
]);

export const WORKSTREAM_5_PENDING_VALIDATIONS: readonly ValidationRecord[] = [
  ...WORKSTREAM_5_VALIDATION_MANIFEST.map((action) =>
    recordValidationEvidence({
      action,
      userAuthorization: "not-authorized",
      hookPermission: "not-observed",
    }),
  ),
  TASK_5_8_PENDING_VALIDATION,
];

if (
  WORKSTREAM_5_PENDING_VALIDATIONS.some(
    (record) =>
      record.state !== "pending" ||
      record.outcome !== null ||
      record.exitStatus !== null ||
      record.exactCommand?.includes("typecheck:scripts"),
  )
) {
  throw new Error("Authored Workstream 5 validation manifest must remain unexecuted and exclude typecheck:scripts");
}

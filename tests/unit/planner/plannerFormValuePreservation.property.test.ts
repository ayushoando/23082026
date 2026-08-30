// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 9: Form value preservation
//
// **Validates: Requirements 5.4, 8.5, 15.3, 15.4**

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { plannerHandoffRequestSchema } from "@planner/lib/handoff/handoffSchema";
import { projectSetupSchema } from "@planner/lib/projectSetup/projectSetupSchema";

const PROPERTY_RUNS = 120;
const PROPERTY_SEED = 9_202_608;

interface ProjectSetupFormInput {
  projectName: string;
  roomWidthMm: number;
  roomDepthMm: number;
  seatTarget?: number;
  unitSystem: string;
}

type ProjectSetupField = keyof ProjectSetupFormInput;

const PROJECT_SETUP_FIELDS = [
  "projectName",
  "roomWidthMm",
  "roomDepthMm",
  "seatTarget",
  "unitSystem",
] as const satisfies readonly ProjectSetupField[];

const projectNameArbitrary = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,48}$/);

const validProjectSetupArbitrary: fc.Arbitrary<ProjectSetupFormInput> = fc.record({
  projectName: projectNameArbitrary,
  roomWidthMm: fc.integer({ min: 1, max: 200_000 }),
  roomDepthMm: fc.integer({ min: 1, max: 200_000 }),
  seatTarget: fc.option(fc.integer({ min: 1, max: 10_000 }), { nil: undefined }),
  unitSystem: fc.constantFrom("mm", "in"),
});

function applyInvalidProjectField(input: ProjectSetupFormInput, field: ProjectSetupField): void {
  switch (field) {
    case "projectName":
      input.projectName = "   ";
      break;
    case "roomWidthMm":
      input.roomWidthMm = 0;
      break;
    case "roomDepthMm":
      input.roomDepthMm = 0;
      break;
    case "seatTarget":
      input.seatTarget = 0;
      break;
    case "unitSystem":
      input.unitSystem = "yards";
      break;
  }
}

interface HandoffFormInput {
  contact: {
    name: string;
    email: string;
    phone: string;
    company: string;
    notes: string;
  };
  boq: {
    projectId: string;
    projectName: string;
    calculationHash: string;
    lines: Array<Record<string, unknown>>;
    subtotalInr: number;
    gstInr: number;
    totalInr: number;
  };
  consent: boolean;
  inquiryType: string;
  idempotencyKey: string;
  projectNotes: string;
}

type HandoffFieldPath =
  | "contact.name"
  | "contact.email"
  | "contact.phone"
  | "contact.company"
  | "contact.notes"
  | "consent"
  | "inquiryType";

const HANDOFF_FIELD_PATHS = [
  "contact.name",
  "contact.email",
  "contact.phone",
  "contact.company",
  "contact.notes",
  "consent",
  "inquiryType",
] as const satisfies readonly HandoffFieldPath[];

// These ids mirror the controls in PlannerHandoffDialog. Schema issue paths
// must resolve to one of these controls before the form can present an error.
const HANDOFF_CONTROL_IDS: Record<HandoffFieldPath, string> = {
  "contact.name": "planner-handoff-name",
  "contact.email": "planner-handoff-email",
  "contact.phone": "planner-handoff-phone",
  "contact.company": "planner-handoff-company",
  "contact.notes": "planner-handoff-notes",
  consent: "planner-handoff-consent",
  inquiryType: "planner-handoff-inquiry",
};

const validHandoffArbitrary: fc.Arbitrary<HandoffFormInput> = fc.record({
  contact: fc.record({
    name: projectNameArbitrary,
    email: fc.constant("planner@example.test"),
    phone: fc.stringMatching(/^\+?[0-9]{7,15}$/),
    company: projectNameArbitrary,
    notes: fc.string({ maxLength: 120 }),
  }),
  boq: fc.record({
    projectId: fc.stringMatching(/^guest-draft-[a-z0-9]{4,12}$/),
    projectName: projectNameArbitrary,
    calculationHash: fc.stringMatching(/^[a-z0-9]{16,32}$/),
    lines: fc.array(
      fc.dictionary(
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.string({ maxLength: 16 }),
      ),
      { maxLength: 4 },
    ),
    subtotalInr: fc.integer({ min: 0, max: 1_000_000 }),
    gstInr: fc.integer({ min: 0, max: 1_000_000 }),
    totalInr: fc.integer({ min: 0, max: 2_000_000 }),
  }),
  consent: fc.constant(true),
  inquiryType: fc.constantFrom("quote", "design-support", "product-question"),
  idempotencyKey: fc.stringMatching(/^handoff-[a-z0-9]{8,36}$/),
  projectNotes: fc.string({ maxLength: 120 }),
});

function readPath(value: unknown, path: string): unknown {
  let current: unknown = value;
  for (const segment of path.split(".")) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function applyInvalidHandoffField(input: HandoffFormInput, field: HandoffFieldPath): void {
  switch (field) {
    case "contact.name":
      input.contact.name = "";
      break;
    case "contact.email":
      input.contact.email = "not-an-email";
      break;
    case "contact.phone":
      input.contact.phone = "x".repeat(41);
      break;
    case "contact.company":
      input.contact.company = "x".repeat(121);
      break;
    case "contact.notes":
      input.contact.notes = "x".repeat(2_001);
      break;
    case "consent":
      input.consent = false;
      break;
    case "inquiryType":
      input.inquiryType = "other";
      break;
  }
}

function assertExactIssuePaths(
  issuePaths: Set<string>,
  invalidFields: readonly string[],
): void {
  expect([...issuePaths].sort()).toEqual([...invalidFields].sort());
}

function handoffControlId(path: string): string | undefined {
  if (!(path in HANDOFF_CONTROL_IDS)) return undefined;
  return HANDOFF_CONTROL_IDS[path as HandoffFieldPath];
}

describe("Feature: planner-comprehensive-audit, Property 9: Form value preservation", () => {
  it("associates every invalid project field while preserving mixed valid values and preventing submission", () => {
    fc.assert(
      fc.property(
        validProjectSetupArbitrary,
        fc.uniqueArray(fc.constantFrom<ProjectSetupField>(...PROJECT_SETUP_FIELDS), {
          minLength: 1,
          maxLength: PROJECT_SETUP_FIELDS.length - 1,
        }),
        (validSetup, invalidFields) => {
          const input = { ...validSetup };
          for (const field of invalidFields) {
            applyInvalidProjectField(input, field);
          }
          const beforeValidation = structuredClone(input);
          let submissionCount = 0;
          const submit = () => {
            submissionCount += 1;
          };
          const parsed = projectSetupSchema.safeParse(input);
          if (parsed.success) submit();

          expect(parsed.success).toBe(false);
          expect(submissionCount).toBe(0);
          expect(input).toEqual(beforeValidation);
          if (!parsed.success) {
            const issuePaths = new Set(
              parsed.error.issues.map((issue) => issue.path.join(".")),
            );
            assertExactIssuePaths(issuePaths, invalidFields);

            for (const field of PROJECT_SETUP_FIELDS) {
              const isInvalid = invalidFields.includes(field);
              expect(issuePaths.has(field)).toBe(isInvalid);
              if (!isInvalid) {
                expect(input[field]).toEqual(validSetup[field]);
              }
            }
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED, endOnFailure: true },
    );
  });

  it("associates every invalid handoff control while retaining mixed valid draft values and preventing submission", () => {
    fc.assert(
      fc.property(
        validHandoffArbitrary,
        fc.uniqueArray(fc.constantFrom<HandoffFieldPath>(...HANDOFF_FIELD_PATHS), {
          minLength: 1,
          maxLength: HANDOFF_FIELD_PATHS.length - 1,
        }),
        (validHandoff, invalidFields) => {
          const input = structuredClone(validHandoff);
          for (const field of invalidFields) {
            applyInvalidHandoffField(input, field);
          }
          const beforeValidation = structuredClone(input);
          let submissionCount = 0;
          const submit = () => {
            submissionCount += 1;
          };
          const parsed = plannerHandoffRequestSchema.safeParse(input);
          if (parsed.success) submit();

          expect(parsed.success).toBe(false);
          expect(submissionCount).toBe(0);
          expect(input).toEqual(beforeValidation);
          if (!parsed.success) {
            const issuePaths = new Set(
              parsed.error.issues.map((issue) => issue.path.join(".")),
            );
            assertExactIssuePaths(issuePaths, invalidFields);
            for (const issuePath of issuePaths) {
              expect(handoffControlId(issuePath)).toBeDefined();
            }

            for (const field of HANDOFF_FIELD_PATHS) {
              const isInvalid = invalidFields.includes(field);
              expect(issuePaths.has(field)).toBe(isInvalid);
              expect(HANDOFF_CONTROL_IDS[field]).not.toBe("");
              if (!isInvalid) {
                expect(readPath(input, field)).toEqual(readPath(validHandoff, field));
              }
            }
            expect(input.boq).toEqual(validHandoff.boq);
            expect(input.idempotencyKey).toBe(validHandoff.idempotencyKey);
            expect(input.projectNotes).toBe(validHandoff.projectNotes);
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED + 1, endOnFailure: true },
    );
  });
});

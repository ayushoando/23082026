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

const projectNameArbitrary = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,48}$/);
const validProjectSetupArbitrary = fc.record({
  projectName: projectNameArbitrary,
  roomWidthMm: fc.integer({ min: 1, max: 200_000 }),
  roomDepthMm: fc.integer({ min: 1, max: 200_000 }),
  seatTarget: fc.option(fc.integer({ min: 1, max: 10_000 }), { nil: undefined }),
  unitSystem: fc.constantFrom<"mm" | "in">("mm", "in"),
});

const validHandoffArbitrary = fc.record({
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
    lines: fc.array(fc.dictionary(fc.string({ minLength: 1, maxLength: 8 }), fc.string({ maxLength: 16 })), { maxLength: 4 }),
    subtotalInr: fc.integer({ min: 0, max: 1_000_000 }),
    gstInr: fc.integer({ min: 0, max: 1_000_000 }),
    totalInr: fc.integer({ min: 0, max: 2_000_000 }),
  }),
  consent: fc.constant<true>(true),
  inquiryType: fc.constantFrom<"quote" | "design-support" | "product-question">(
    "quote",
    "design-support",
    "product-question",
  ),
  idempotencyKey: fc.stringMatching(/^handoff-[a-z0-9]{8,36}$/),
  projectNotes: fc.string({ maxLength: 120 }),
});

describe("Feature: planner-comprehensive-audit, Property 9: Form value preservation", () => {
  it("identifies every invalid project-setup field without mutating valid entered fields or submitting", () => {
    fc.assert(
      fc.property(
        validProjectSetupArbitrary,
        fc.constantFrom<"projectName" | "roomWidthMm" | "roomDepthMm">(
          "projectName",
          "roomWidthMm",
          "roomDepthMm",
        ),
        (validSetup, invalidField) => {
          const input = {
            ...validSetup,
            [invalidField]: invalidField === "projectName" ? "   " : 0,
          };
          const before = structuredClone(input);
          let submitted = false;
          const parsed = projectSetupSchema.safeParse(input);
          if (parsed.success) submitted = true;

          expect(parsed.success).toBe(false);
          expect(submitted).toBe(false);
          expect(input).toEqual(before);
          if (!parsed.success) {
            expect(parsed.error.issues.some((issue) => issue.path.join(".") === invalidField)).toBe(true);
          }
          for (const [field, value] of Object.entries(validSetup)) {
            if (field !== invalidField) {
              expect(input[field as keyof typeof input]).toEqual(value);
            }
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 9_202_608, endOnFailure: true },
    );
  });

  it("associates invalid handoff fields with their paths while retaining the entire draft", () => {
    fc.assert(
      fc.property(
        validHandoffArbitrary,
        fc.constantFrom<"contact.name" | "contact.email" | "boq.projectName" | "consent" | "idempotencyKey">(
          "contact.name",
          "contact.email",
          "boq.projectName",
          "consent",
          "idempotencyKey",
        ),
        (validHandoff, invalidField) => {
          const input = structuredClone(validHandoff);
          switch (invalidField) {
            case "contact.name":
              input.contact.name = "";
              break;
            case "contact.email":
              input.contact.email = "not-an-email";
              break;
            case "boq.projectName":
              input.boq.projectName = "";
              break;
            case "consent":
              input.consent = false as true;
              break;
            case "idempotencyKey":
              input.idempotencyKey = "";
              break;
          }
          const before = structuredClone(input);
          let submitted = false;
          const parsed = plannerHandoffRequestSchema.safeParse(input);
          if (parsed.success) submitted = true;

          expect(parsed.success).toBe(false);
          expect(submitted).toBe(false);
          expect(input).toEqual(before);
          if (!parsed.success) {
            expect(parsed.error.issues.some((issue) => issue.path.join(".") === invalidField)).toBe(true);
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 9_202_609, endOnFailure: true },
    );
  });
});

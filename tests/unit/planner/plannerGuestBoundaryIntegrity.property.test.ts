// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 23: Guest boundary integrity
//
// **Validates: Requirements 10.1, 10.2, 15.1, 15.2, 15.5, 15.6, 15.7**

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { plannerHandoffRequestSchema } from "@planner/lib/handoff/handoffSchema";
import {
  parsePlannerHandoffRecoveryState,
  serializePlannerHandoffRecoveryState,
  type PlannerHandoffDraft,
  type PlannerHandoffRecoveryState,
} from "@planner/lib/handoff/handoffRecovery";
import { PLANNER_ENDPOINT_DESCRIPTORS } from "@planner/lib/plannerEndpointContract";
import type { FurnitureItem } from "@planner/lib/plannerTypes";
import { toPublicPlannerFurniture } from "@planner/store/plannerCatalogStore";

const PROPERTY_RUNS = 120;
const PUBLIC_CATALOG_FIELDS = [
  "id",
  "name",
  "category",
  "subcategory",
  "tags",
  "dimensions",
  "top_png_url",
  "top_svg_url",
  "thumb_url",
  "thumbnail_url",
  "is_custom",
] as const;

const catalogItemArbitrary = fc.record({
  id: fc.stringMatching(/^catalog-[a-z0-9]{4,16}$/),
  name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,48}$/),
  category: fc.stringMatching(/^[a-z-]{3,16}$/),
  ownerId: fc.stringMatching(/^owner-[a-z0-9]{4,16}$/),
  projectCapability: fc.stringMatching(/^cap-[a-z0-9]{12,24}$/),
});

const validGuestHandoffArbitrary = fc.record({
  name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,48}$/),
  projectId: fc.stringMatching(/^guest-draft-[a-z0-9]{4,16}$/),
  projectName: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,48}$/),
  calculationHash: fc.stringMatching(/^[a-z0-9]{16,32}$/),
  idempotencyKey: fc.stringMatching(/^handoff-[a-z0-9]{8,36}$/),
  ownerId: fc.stringMatching(/^owner-[a-z0-9]{4,16}$/),
});

const handoffDraftArbitrary: fc.Arbitrary<PlannerHandoffDraft> = fc.record({
  name: fc.string({ maxLength: 120 }),
  email: fc.string({ maxLength: 120 }),
  phone: fc.string({ maxLength: 40 }),
  company: fc.string({ maxLength: 120 }),
  notes: fc.string({ maxLength: 2_000 }),
  inquiryType: fc.constantFrom("quote", "design-support", "product-question"),
  consent: fc.boolean(),
});

type HandoffOutcome =
  | { kind: "success"; referenceId: string; createdAt: string }
  | { kind: "failure"; message: string };

const handoffOutcomeArbitrary: fc.Arbitrary<HandoffOutcome> = fc.oneof(
  fc.record({
    kind: fc.constant("success" as const),
    referenceId: fc.stringMatching(/^HANDOFF-[A-Z0-9]{8,24}$/),
    createdAt: fc.date({ min: new Date("2020-01-01T00:00:00.000Z"), max: new Date("2035-12-31T23:59:59.999Z") }).map((date) => date.toISOString()),
  }),
  fc.record({
    kind: fc.constant("failure" as const),
    message: fc.string({ minLength: 1, maxLength: 160 }),
  }),
);

function applyHandoffOutcome(
  state: PlannerHandoffRecoveryState,
  outcome: HandoffOutcome,
): PlannerHandoffRecoveryState {
  if (outcome.kind === "failure") return state;
  return {
    ...state,
    confirmation: {
      referenceId: outcome.referenceId,
      createdAt: outcome.createdAt,
    },
  };
}

describe("Feature: planner-comprehensive-audit, Property 23: Guest boundary integrity", () => {
  it("projects every generated catalog selection to approved public fields only", () => {
    fc.assert(
      fc.property(catalogItemArbitrary, (input) => {
        const item: FurnitureItem = {
          id: input.id,
          name: input.name,
          category: input.category,
          subcategory: "seating",
          tags: ["guest", "public"],
          dimensions: { width_mm: 600, depth_mm: 600, height_mm: 900 },
          thumbnail_url: "/catalog/example.png",
          is_custom: false,
          ownerId: input.ownerId,
          projectCapability: input.projectCapability,
          privateNotes: "must never reach the guest catalog",
        };
        const publicItem = toPublicPlannerFurniture(item);

        expect(Object.keys(publicItem).sort()).toEqual([...PUBLIC_CATALOG_FIELDS].sort());
        expect("ownerId" in publicItem).toBe(false);
        expect("projectCapability" in publicItem).toBe(false);
        expect("privateNotes" in publicItem).toBe(false);
        expect(publicItem.id).toBe(input.id);
        expect(publicItem.name).toBe(input.name);
      }),
      { numRuns: PROPERTY_RUNS, seed: 23_202_608, endOnFailure: true },
    );
  });

  it("preserves a valid guest handoff draft while stripping owner and project-operation capability fields", () => {
    fc.assert(
      fc.property(validGuestHandoffArbitrary, (input) => {
        const request = {
          contact: {
            name: input.name,
            email: "guest@example.test",
            phone: "+911234567890",
            company: "Guest company",
            notes: "Please contact me",
          },
          boq: {
            projectId: input.projectId,
            projectName: input.projectName,
            calculationHash: input.calculationHash,
            lines: [],
            subtotalInr: 0,
            gstInr: 0,
            totalInr: 0,
          },
          consent: true as const,
          inquiryType: "quote" as const,
          idempotencyKey: input.idempotencyKey,
          projectNotes: "Guest draft note",
          ownerId: input.ownerId,
          projectRecord: { id: "private-project" },
          projectOperationCapability: "save-delete-load",
        };
        const before = structuredClone(request);
        const parsed = plannerHandoffRequestSchema.safeParse(request);

        expect(parsed.success).toBe(true);
        expect(request).toEqual(before);
        if (!parsed.success) return;
        expect(parsed.data.contact.name).toBe(input.name.trim());
        expect(parsed.data.boq.projectId).toBe(input.projectId);
        expect("ownerId" in parsed.data).toBe(false);
        expect("projectRecord" in parsed.data).toBe(false);
        expect("projectOperationCapability" in parsed.data).toBe(false);
      }),
      { numRuns: PROPERTY_RUNS, seed: 23_202_609, endOnFailure: true },
    );
  });

  it("preserves generated guest drafts on failure and stable confirmations on success without granting project capability", () => {
    fc.assert(
      fc.property(
        handoffDraftArbitrary,
        fc.stringMatching(/^handoff-[a-z0-9]{8,36}$/),
        handoffOutcomeArbitrary,
        (draft, idempotencyKey, outcome) => {
          const initial: PlannerHandoffRecoveryState = {
            version: 1,
            draft,
            idempotencyKey,
            confirmation: null,
          };
          const resolved = applyHandoffOutcome(initial, outcome);
          const recovered = parsePlannerHandoffRecoveryState(
            serializePlannerHandoffRecoveryState(resolved),
            () => "unexpected-replacement-key",
          );

          expect(recovered.draft).toEqual(draft);
          expect(recovered.idempotencyKey).toBe(idempotencyKey);
          expect("ownerId" in recovered).toBe(false);
          expect("projectRecord" in recovered).toBe(false);
          expect("projectOperationCapability" in recovered).toBe(false);

          if (outcome.kind === "success") {
            expect(recovered.confirmation).toEqual({
              referenceId: outcome.referenceId,
              createdAt: outcome.createdAt,
            });
          } else {
            expect(recovered.confirmation).toBeNull();
          }
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 23_202_610, endOnFailure: true },
    );
  });

  it("never declares a project-record endpoint as guest accessible", () => {
    fc.assert(
      fc.property(fc.constantFrom(...PLANNER_ENDPOINT_DESCRIPTORS), (endpoint) => {
        if (endpoint.security.auth !== "guest") return;
        expect(endpoint.path.includes("/projects")).toBe(false);
        expect(endpoint.security.owner).not.toBe("authenticated-owner-list");
        expect(endpoint.security.owner).not.toBe("authenticated-owner-or-admin-item");
      }),
      { numRuns: PROPERTY_RUNS, seed: 23_202_611, endOnFailure: true },
    );
  });
});

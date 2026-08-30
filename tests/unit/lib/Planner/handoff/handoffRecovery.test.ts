import { describe, expect, it, vi } from "vitest";
import {
  createPlannerHandoffRecoveryState,
  parsePlannerHandoffRecoveryState,
  serializePlannerHandoffRecoveryState,
} from "@planner/lib/handoff/handoffRecovery";

describe("Planner handoff recovery", () => {
  it("preserves the complete valid draft and idempotency identity across reloads", () => {
    const state = createPlannerHandoffRecoveryState("handoff-stable-key");
    state.draft = {
      name: "Ada Lovelace",
      email: "ada@example.test",
      phone: "+919876543210",
      company: "Analytical Offices",
      notes: "Please quote the attached BOQ.",
      inquiryType: "quote",
      consent: true,
    };
    const createKey = vi.fn(() => "handoff-replacement-key");

    const recovered = parsePlannerHandoffRecoveryState(
      serializePlannerHandoffRecoveryState(state),
      createKey,
    );

    expect(recovered).toEqual(state);
    expect(createKey).not.toHaveBeenCalled();
  });

  it("keeps a stable non-secret confirmation available after the dialog reopens", () => {
    const state = createPlannerHandoffRecoveryState("handoff-stable-key");
    state.confirmation = {
      referenceId: "HO-ABC123-XYZ789",
      createdAt: "2026-08-23T10:00:00.000Z",
    };

    const recovered = parsePlannerHandoffRecoveryState(
      serializePlannerHandoffRecoveryState(state),
      () => "unused",
    );

    expect(recovered.confirmation).toEqual(state.confirmation);
    expect(recovered.idempotencyKey).toBe("handoff-stable-key");
  });

  it("migrates the original draft-only storage shape without dropping consent or valid fields", () => {
    const recovered = parsePlannerHandoffRecoveryState(
      JSON.stringify({
        name: "Grace Hopper",
        email: "grace@example.test",
        phone: "",
        company: "Compiler Furniture",
        notes: "Need design support",
        inquiryType: "design-support",
        consent: true,
      }),
      () => "handoff-migrated-key",
    );

    expect(recovered.draft).toEqual({
      name: "Grace Hopper",
      email: "grace@example.test",
      phone: "",
      company: "Compiler Furniture",
      notes: "Need design support",
      inquiryType: "design-support",
      consent: true,
    });
    expect(recovered.idempotencyKey).toBe("handoff-migrated-key");
    expect(recovered.confirmation).toBeNull();
  });

  it("recovers safely from malformed storage with one fresh idempotency identity", () => {
    const createKey = vi.fn(() => "handoff-fresh-key");

    const recovered = parsePlannerHandoffRecoveryState("{broken", createKey);

    expect(recovered.idempotencyKey).toBe("handoff-fresh-key");
    expect(recovered.confirmation).toBeNull();
    expect(createKey).toHaveBeenCalledTimes(1);
  });
});

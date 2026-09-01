// @vitest-environment node
/**
 * 28.12 — defense-in-depth ownership enforcement inside the Supabase
 * projects store (service-role client bypasses RLS, so the store itself
 * must refuse cross-user overwrite/delete even though route-layer auth is
 * the primary check).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Builder = Record<string, ReturnType<typeof vi.fn>>;

function makeBuilder(terminal: { data: unknown; error: unknown }): Builder {
  // Every method chains and the awaited result is `terminal`.
  const b: Builder = {
    select: vi.fn(() => b),
    eq: vi.fn(() => b),
    upsert: vi.fn(() => b),
    delete: vi.fn(() => b),
    order: vi.fn(() => b),
    limit: vi.fn(() => b),
    single: vi.fn(async () => terminal),
    maybeSingle: vi.fn(async () => terminal),
  };
  return b;
}

const profilesBuilder = makeBuilder({ data: null, error: null });
let plansBuilder: Builder;

const from = vi.fn((table: string) => (table === "profiles" ? profilesBuilder : plansBuilder));

vi.mock("@/platform/supabase/auth-admin", () => ({
  createSupabaseAuthAdminClient: () => ({ from }),
}));

import {
  deleteProjectFromSupabase,
  writeProjectToSupabase,
} from "@planner/lib/projectsStore.supabase";

const alice = "user-alice";
const bob = "user-bob";
const projectId = "3f6b0c1e-1111-4222-8333-444455556666";

function planRow(userId: string) {
  return {
    id: projectId,
    user_id: userId,
    name: "Plan",
    engine: "ooplanner",
    payload: {},
    thumbnail_url: null,
    status: "active",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  plansBuilder = makeBuilder({ data: planRow(alice), error: null });
});

describe("writeProjectToSupabase ownership (28.12)", () => {
  it("writes when the existing row belongs to the caller", async () => {
    plansBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, user_id: alice },
      error: null,
    });
    const saved = await writeProjectToSupabase(
      { id: projectId, name: "Mine", canvas_json: { objects: [] } },
      { userId: alice },
    );
    expect(plansBuilder.upsert).toHaveBeenCalled();
    expect(saved).toMatchObject({ id: projectId, user_id: alice });
  });

  it("refuses to overwrite another user's plan (client-supplied foreign id)", async () => {
    plansBuilder.maybeSingle.mockResolvedValue({
      data: { id: projectId, user_id: bob },
      error: null,
    });
    await expect(
      writeProjectToSupabase(
        { id: projectId, name: "Hijack", canvas_json: { objects: [] } },
        { userId: alice },
      ),
    ).rejects.toThrow(/FORBIDDEN: plan ownership mismatch/);
    expect(plansBuilder.upsert).not.toHaveBeenCalled();
  });

  it("allows creating a brand-new plan (no existing row)", async () => {
    plansBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });
    await writeProjectToSupabase(
      { id: projectId, name: "New", canvas_json: { objects: [] } },
      { userId: alice },
    );
    expect(plansBuilder.upsert).toHaveBeenCalled();
  });

  it("propagates the ownership pre-check error", async () => {
    plansBuilder.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "select failed" },
    });
    await expect(
      writeProjectToSupabase({ id: projectId, name: "X" }, { userId: alice }),
    ).rejects.toThrow(/select failed/);
    expect(plansBuilder.upsert).not.toHaveBeenCalled();
  });
});

describe("deleteProjectFromSupabase ownership (28.12)", () => {
  it("scopes the delete to the caller's user_id", async () => {
    plansBuilder.single.mockResolvedValue({ data: [{ id: projectId }], error: null });
    const ok = await deleteProjectFromSupabase(projectId, { userId: alice });
    expect(ok).toBe(true);
    const eqCalls = plansBuilder.eq.mock.calls.map((c) => [c[0], c[1]]);
    expect(eqCalls).toContainEqual(["id", projectId]);
    expect(eqCalls).toContainEqual(["user_id", alice]);
  });

  it("stays unrestricted when no userId is supplied (admin sweep)", async () => {
    plansBuilder.single.mockResolvedValue({ data: [{ id: projectId }], error: null });
    await expect(deleteProjectFromSupabase(projectId)).resolves.toBe(true);
    const eqCalls = plansBuilder.eq.mock.calls.map((c) => [c[0], c[1]]);
    expect(eqCalls).toContainEqual(["id", projectId]);
    expect(eqCalls).not.toContainEqual(["user_id", alice]);
  });

  it("returns false when the scoped delete matched no rows", async () => {
    plansBuilder.single.mockResolvedValue({ data: [], error: null });
    await expect(
      deleteProjectFromSupabase(projectId, { userId: bob }),
    ).resolves.toBe(false);
  });
});

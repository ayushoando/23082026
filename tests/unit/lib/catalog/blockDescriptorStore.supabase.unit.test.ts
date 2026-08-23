import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const maybeSingle = vi.fn();
const upsert = vi.fn();
const updateEq = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const select = vi.fn();
const from = vi.fn();

vi.mock("@/platform/supabase/auth-admin", () => ({
  createSupabaseAuthAdminClient: () => ({ from }),
}));

import {
  persistBlockDescriptorToSupabase,
  setBlockDescriptorLifecycleInSupabase,
} from "@/lib/catalog/blockDescriptorStore.supabase";

beforeEach(() => {
  from.mockReturnValue({ select, upsert, update });
  select.mockReturnValue({ eq });
  eq.mockReturnValue({ maybeSingle });
  maybeSingle.mockResolvedValue({ data: { current_version: 2 }, error: null });
  upsert.mockResolvedValue({ error: null });
  update.mockReturnValue({ eq: updateEq });
  updateEq.mockResolvedValue({ error: null });
});

describe("blockDescriptorStore.supabase (mocked)", () => {
  it("rejects a bad slug", async () => {
    await expect(
      persistBlockDescriptorToSupabase({ slug: "Nope!", descriptor: {} }),
    ).rejects.toThrow(/Invalid descriptor slug/);
  });

  it("bumps version from existing row", async () => {
    const result = await persistBlockDescriptorToSupabase({
      slug: "mesh-chair",
      descriptor: { kind: "chair" },
    });
    expect(result).toEqual({ slug: "mesh-chair", version: 3 });
    expect(upsert).toHaveBeenCalled();
  });

  it("starts at version 1 when missing", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const result = await persistBlockDescriptorToSupabase({
      slug: "new-block",
      descriptor: {},
    });
    expect(result.version).toBe(1);
  });

  it("updates lifecycle", async () => {
    await setBlockDescriptorLifecycleInSupabase("mesh-chair", "live");
    expect(update).toHaveBeenCalled();
  });
});

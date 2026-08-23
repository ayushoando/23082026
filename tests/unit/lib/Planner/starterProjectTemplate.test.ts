import { describe, expect, it } from "vitest";

import { SCALE_PX_PER_MM } from "@planner/lib/plannerPalette";
import { buildStarterProjectPayload } from "@planner/lib/starterProjectTemplate";

describe("starterProjectTemplate", () => {
  it("builds a sample project with six furniture objects at planner 0.05 px/mm", () => {
    const payload = buildStarterProjectPayload();
    expect(payload.name).toBe("Sample small office");
    const canvas = payload.canvas_json as { objects: Array<{ left: number }> };
    expect(canvas.objects).toHaveLength(6);
    expect(payload.sheet?.width_mm).toBe(15000);
    expect(payload.sheet?.scale_px_per_mm).toBe(0.05);
    expect(payload.sheet?.scale_px_per_mm).toBe(SCALE_PX_PER_MM);
    expect(canvas.objects[0]?.left).toBe(2000 * SCALE_PX_PER_MM);
  });
});

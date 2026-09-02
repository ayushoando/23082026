import { describe, it, expect, vi, beforeEach } from "vitest";

// Finding 8.1 (plans/audit/08): user-uploaded SVG is stored verbatim and later
// served back as `image/svg+xml` from /api/files/furniture/[filename] — the
// route must reject SVG payloads that fail the shared sanitizer.

vi.mock("@studio/server/studioStore", () => ({
  ensureStorageDirs: vi.fn(async () => undefined),
  nowIso: vi.fn(() => "2026-09-02T00:00:00.000Z"),
  persistFurnitureUpload: vi.fn(async () => ({
    thumbnail_url: "/api/files/furniture/x_top.svg",
    top_svg_url: "/api/files/furniture/x_top.svg",
    top_png_url: null,
  })),
  shortId: vi.fn(() => "abc123"),
  slugify: vi.fn((v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  writeFurnitureItem: vi.fn(async () => undefined),
}));

vi.mock("@/features/shared/api/withAuth", () => ({
  withAuth: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/catalog/furnitureCatalogMode", () => ({
  getFurnitureCatalogMode: vi.fn(() => "supabase"),
}));

import { POST } from "@/app/api/Studio/furniture/upload/route";
import { persistFurnitureUpload, writeFurnitureItem } from "@studio/server/studioStore";

const SAFE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
const UNSAFE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';

function svgRequest(content: string, name = "furniture.svg"): Request {
  const form = new FormData();
  form.append(
    "file",
    new File([content], name, { type: "image/svg+xml" }),
  );
  form.append("name", "Test Chair");
  form.append("category", "seating");
  return new Request("http://localhost/api/Studio/furniture/upload", {
    method: "POST",
    body: form,
  });
}

describe("Studio furniture upload route (8.1 SVG sanitizer wiring)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores a safe SVG upload (201) through the normal persistence path", async () => {
    const res = await POST(svgRequest(SAFE_SVG));
    expect(res.status).toBe(201);
    expect(persistFurnitureUpload).toHaveBeenCalledTimes(1);
    expect(writeFurnitureItem).toHaveBeenCalledTimes(1);
  });

  it("rejects an SVG containing a <script> element with 422", async () => {
    const res = await POST(svgRequest(UNSAFE_SVG));
    expect(res.status).toBe(422);
    const body = (await res.json()) as { detail?: string; issues?: string[] };
    expect(body.detail).toBe("Unsafe SVG rejected");
    expect(body.issues?.some((issue) => issue.includes("script"))).toBe(true);
    expect(persistFurnitureUpload).not.toHaveBeenCalled();
    expect(writeFurnitureItem).not.toHaveBeenCalled();
  });

  it("rejects an SVG with an event-handler attribute with 422", async () => {
    const res = await POST(
      svgRequest(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" onload="bad()"/></svg>',
      ),
    );
    expect(res.status).toBe(422);
    expect(persistFurnitureUpload).not.toHaveBeenCalled();
  });

  it("does not run the SVG sanitizer on non-SVG uploads", async () => {
    const form = new FormData();
    form.append("file", new File([new Uint8Array([137, 80, 78, 71])], "f.png", { type: "image/png" }));
    form.append("name", "Test PNG");
    const res = await POST(
      new Request("http://localhost/api/Studio/furniture/upload", {
        method: "POST",
        body: form,
      }),
    );
    expect(res.status).toBe(201);
    expect(persistFurnitureUpload).toHaveBeenCalledTimes(1);
  });
});

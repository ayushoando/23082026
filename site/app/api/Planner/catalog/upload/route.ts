/**
 * POST /api/Planner/catalog/upload — Planner-side custom furniture upload.
 *
 * Requests flow through the Planner request-processing pipeline which
 * enforces: correlation → quota → method/validation → origin/CSRF
 * → session → owner scope → revision/idempotency → persistence.
 */

import { getFurnitureCatalogMode } from "@/lib/catalog/furnitureCatalogMode";
import { isOversizedUpload } from "@/lib/security/uploadLimits";
import {
  ensureStorageDirs,
  nowIso,
  persistCatalogUpload,
  shortId,
  slugify,
  writeCatalogEntry,
} from "@planner/server/plannerStore";
import {
  createPlannerHandler,
  createPlannerRejectedMethodHandler,
} from "@planner/server/plannerRouteAdapter";
import type {
  PlannerOperationContext,
  PlannerOperationResult,
} from "@planner/lib/plannerRequestPipeline";

async function uploadCatalogItem(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  if (getFurnitureCatalogMode() === "disk") {
    await ensureStorageDirs();
  }

  const body = context.request.body as Record<string, unknown>;
  const file = body.file;
  const name = String(body.name || "upload");
  const category = String(body.category || "uncategorized");
  const width_mm = Number(body.width_mm || 0);
  const depth_mm = Number(body.depth_mm || 0);
  const height_mm = Number(body.height_mm || 0);
  const subcategory = String(body.subcategory || "") || null;
  const tagsRaw = String(body.tags || "");

  if (!(file instanceof File)) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_REQUEST",
      metadata: {
        issues: [{ path: "body.file", message: "File is required" }],
      },
    };
  }
  if (isOversizedUpload(file)) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_REQUEST",
      metadata: {
        issues: [{ path: "body.file", message: "File too large" }],
      },
    };
  }

  const itemId = `f_${slugify(name)}_${shortId()}`;
  const now = nowIso();
  const raw = Buffer.from(await file.arrayBuffer());
  const isSvg =
    (file.type || "").includes("svg") ||
    file.name.toLowerCase().endsWith(".svg");
  const urls = await persistCatalogUpload({ itemId, bytes: raw, isSvg });

  const item = {
    id: itemId,
    name,
    category,
    subcategory,
    tags: tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    dimensions: { width_mm, depth_mm, height_mm },
    notes: null,
    is_custom: true,
    thumbnail_url: urls.thumbnail_url ?? null,
    top_png_url: urls.top_png_url ?? null,
    top_svg_url: urls.top_svg_url ?? null,
    front_png_url: null,
    side_png_url: null,
    top_fabric_json: null,
    front_fabric_json: null,
    side_fabric_json: null,
    created_at: now,
    updated_at: now,
  };
  await writeCatalogEntry(item);
  return { ok: true, status: 201, data: item };
}

export const POST = createPlannerHandler({
  endpointId: "planner.catalog.upload",
  operation: { invoke: uploadCatalogItem },
});

// Unsupported methods still enter the quota-first request pipeline.
export const GET = createPlannerRejectedMethodHandler(
  "planner.catalog.upload",
);
export const PUT = createPlannerRejectedMethodHandler(
  "planner.catalog.upload",
);
export const DELETE = createPlannerRejectedMethodHandler(
  "planner.catalog.upload",
);
export const PATCH = createPlannerRejectedMethodHandler(
  "planner.catalog.upload",
);

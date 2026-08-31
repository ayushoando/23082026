/**
 * Furniture Studio API client. Talks only to `/api/Studio/*` (plus the neutral
 * `/api/exports`) — never to a Planner route.
 */
import { browserApiFetch, apiPath } from "@/lib/api/browserApi";

async function jsonFetch<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await browserApiFetch(apiPath(url), init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: `Request failed (${res.status})` } }));
    const message =
      (body as { error?: { message?: string }; message?: string }).error?.message ??
      (body as { message?: string }).message ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const listFurniture = (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/api/Studio/furniture?${query}` : "/api/Studio/furniture";
  return jsonFetch(url);
};

export const createFurniture = (payload: unknown) =>
  jsonFetch("/api/Studio/furniture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updateFurniture = (id: string, payload: unknown) =>
  jsonFetch(`/api/Studio/furniture/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deleteFurniture = (id: string) =>
  jsonFetch(`/api/Studio/furniture/${id}`, {
    method: "DELETE",
  });

export const uploadFurniture = async (formData: FormData) => {
  const res = await browserApiFetch(apiPath("/api/Studio/furniture/upload"), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: `Upload failed (${res.status})` } }));
    const message =
      (body as { error?: { message?: string } }).error?.message ??
      `Upload failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
};

export type PublishFurnitureResult = {
  success: true;
  slug: string;
  version: number;
  lifecycle: string;
  furnitureId: string;
};

/** Publish a disk-saved furniture draft into versioned catalog descriptors. */
export async function publishFurniture(
  id: string,
  options: { goLive?: boolean; slug?: string } = {},
): Promise<PublishFurnitureResult> {
  const res = await browserApiFetch(apiPath(`/api/Studio/furniture/${id}/publish`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  const body = (await res.json()) as {
    success?: boolean;
    slug?: string;
    version?: number;
    lifecycle?: string;
    furnitureId?: string;
    error?: { message?: string };
    message?: string;
  };
  if (!res.ok || body.success === false) {
    throw new Error(
      body.error?.message || body.message || `Publish failed (${res.status})`,
    );
  }
  if (
    body.success !== true ||
    typeof body.slug !== "string" ||
    typeof body.version !== "number" ||
    typeof body.lifecycle !== "string" ||
    typeof body.furnitureId !== "string"
  ) {
    throw new Error(body.message || `Publish failed (${res.status})`);
  }
  return {
    success: true,
    slug: body.slug,
    version: body.version,
    lifecycle: body.lifecycle,
    furnitureId: body.furnitureId,
  };
}

export const createExport = (payload: { format?: string; data_url: string; name?: string }) =>
  jsonFetch("/api/exports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const fileUrl = (path: string | null | undefined) => (path ? path : null);

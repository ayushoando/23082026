/**
 * Public catalog URL keys — the path segment Google and users should see.
 * Prefer a human source slug (`crest`) over folder slugs (`oando-tables--crest`)
 * or UUID primary keys.
 */

export type ProductUrlKeyRow = {
  metadata?: unknown;
  slug?: string | null;
};

const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Index/nav leftovers that must never become a public PDP loc. */
const RESERVED_PUBLIC_PRODUCT_URL_KEYS = new Set(["categories"]);

export function isUuidSegment(segment: string): boolean {
  return UUID_SEGMENT.test(segment);
}

function normalizePublicProductUrlKey(segment: string): string {
  return segment.trim().toLowerCase();
}

/** Path segment safe for /products/{category}/{product}/ — no host injection or UUID. */
export function isPublicCatalogUrlSegment(segment: string): boolean {
  return (
    /^[a-zA-Z0-9][a-zA-Z0-9._~-]*$/.test(segment) &&
    !isUuidSegment(segment) &&
    !segment.includes("--")
  );
}

export function isReservedPublicProductUrlKey(segment: string): boolean {
  return RESERVED_PUBLIC_PRODUCT_URL_KEYS.has(normalizePublicProductUrlKey(segment));
}

function getMetadataSourceSlug(row: Pick<ProductUrlKeyRow, "metadata">): string {
  if (!row.metadata || typeof row.metadata !== "object") {
    return "";
  }
  const sourceSlug = (row.metadata as { sourceSlug?: unknown }).sourceSlug;
  return typeof sourceSlug === "string" ? sourceSlug.trim() : "";
}

/** Derive a stable source key from metadata or slug shape (`oando-seating--sway` → `sway`). */
export function deriveSourceSlug(row: Pick<ProductUrlKeyRow, "metadata" | "slug">): string {
  const fromMetadata = getMetadataSourceSlug(row);
  if (fromMetadata) {
    return fromMetadata;
  }

  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  if (!slug) {
    return "";
  }

  const splitIndex = slug.indexOf("--");
  if (splitIndex !== -1) {
    return slug.slice(splitIndex + 2).trim();
  }

  return slug;
}

/**
 * URL key for sitemap, generateStaticParams, and canonical PDPs.
 * Empty when no human-readable segment exists (caller should skip / 404).
 */
export function derivePublicProductUrlKey(
  row: Pick<ProductUrlKeyRow, "metadata" | "slug">,
): string {
  const source = normalizePublicProductUrlKey(deriveSourceSlug(row));
  if (
    source &&
    isPublicCatalogUrlSegment(source) &&
    !isReservedPublicProductUrlKey(source)
  ) {
    return source;
  }

  const slug = normalizePublicProductUrlKey(
    typeof row.slug === "string" ? row.slug : "",
  );
  if (
    slug &&
    isPublicCatalogUrlSegment(slug) &&
    !isReservedPublicProductUrlKey(slug)
  ) {
    return slug;
  }

  return "";
}

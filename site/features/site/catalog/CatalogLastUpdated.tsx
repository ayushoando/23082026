/** Visible catalog freshness line (plan 02 module 8 — driven by real updated_at). */
export function CatalogLastUpdated({ isoDate }: { isoDate: string }) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const formatted = parsed.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <p className="text-sm text-muted" data-testid="catalog-last-updated">
      Last updated {formatted}
    </p>
  );
}

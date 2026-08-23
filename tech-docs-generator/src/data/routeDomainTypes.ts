export type RouteDomainRecord = {
  id: string
  category: string
  label: string
  value: string
  sourcePath: string
  sourceKind: string
  sourcePointer: string
}

export function isRouteDomainRecord(value: unknown): value is RouteDomainRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.category === "string" &&
    typeof row.label === "string" &&
    typeof row.value === "string" &&
    typeof row.sourcePath === "string" &&
    typeof row.sourceKind === "string" &&
    typeof row.sourcePointer === "string"
  );
}


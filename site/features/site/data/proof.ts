import type { ClientBadgeData } from "@/components/ClientBadge";
import { resolveClientLogoSrc } from "@/features/site/data/clientLogos";
import { getCuratedLogoRecords } from "@/lib/clients/clientRegistry";
import type { SectorTabId } from "@/lib/clients/clientTypes";

/**
 * Display KPIs for the canonical /clients proof surface. Keep aligned with
 * SOLUTIONS_PAGE_COPY.stats and conservative floors in fallbacks.ts.
 */
export const TRUSTED_BY_STATS = [
 { value: "14+", label: "Years of experience" },
 { value: "120+", label: "Projects completed" },
 { value: "120+", label: "Selected organisations" },
 { value: "20+", label: "Locations serviced" },
] as const;

const BADGE_SECTOR_BY_TAB: Record<SectorTabId, string> = {
 "financial-services": "Finance",
 "government-public-sector": "Government",
 "education-social-impact": "Education / Social Impact",
 "corporates-multinationals": "Corporate",
};

/**
 * Curated canonical selection for the overview page. This is intentionally not
 * the complete 108-record registry: only selected proof records are surfaced.
 * Records without an exact asset keep ClientBadge's existing monogram fallback.
 */
export const TRUSTED_BY_CLIENTS: ClientBadgeData[] =
 getCuratedLogoRecords().map((record) => ({
  name: record.displayName,
  sector: BADGE_SECTOR_BY_TAB[record.sectorTab],
  location: record.displayName === "Titan" ? "Patna, Bihar" : undefined,
 }));

/** Static inspection helper for unresolved curated logo associations. */
export function trustedByClientsMissingLogos(): string[] {
 return TRUSTED_BY_CLIENTS.filter(
  (client) => !resolveClientLogoSrc(client.name, client.logoSrc),
 ).map((client) => client.name);
}

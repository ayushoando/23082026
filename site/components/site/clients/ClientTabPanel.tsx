"use client";

import { useTranslations } from "next-intl";
import type { ClientRecord, SectorTabMeta } from "@/lib/clients/clientTypes";
import type { UseSectorTabsReturn } from "@/hooks/useSectorTabs";
import { ClientCard } from "./ClientCard";

export interface ClientTabPanelProps {
  tab: SectorTabMeta;
  records: ClientRecord[];
  panelProps: ReturnType<UseSectorTabsReturn["getPanelProps"]>;
}

/**
 * One sector's client grid. All panels stay mounted (the hook controls
 * `hidden`), and an empty sector announces itself politely instead of
 * rendering a blank region.
 */
export function ClientTabPanel({ tab, records, panelProps }: ClientTabPanelProps) {
  const t = useTranslations("clients");

  return (
    <div {...panelProps} className="clients-showcase__panel">
      {records.length > 0 ? (
        <div className="clients-showcase__grid">
          {records.map((record) => (
            <ClientCard key={record.canonicalId} record={record} />
          ))}
        </div>
      ) : (
        <div role="status" aria-live="polite" className="clients-showcase__empty">
          <p>{t("showcase.emptySector", { sector: tab.label })}</p>
        </div>
      )}
    </div>
  );
}

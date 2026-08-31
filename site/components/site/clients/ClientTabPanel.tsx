"use client";
import { useTranslations } from "next-intl";
import type { ClientRecord, SectorTabMeta } from "@/lib/clients/clientTypes";
import type { UseSectorTabsReturn } from "@/hooks/useSectorTabs";
import { ClientCard } from "./ClientCard";

interface ClientTabPanelProps {
  tab: SectorTabMeta;
  records: ClientRecord[];
  panelProps: ReturnType<UseSectorTabsReturn["getPanelProps"]>;
}

export function ClientTabPanel({
  tab,
  records,
  panelProps,
}: ClientTabPanelProps) {
  const t = useTranslations("clients.showcase");

  return (
    <div {...panelProps}>
      {records.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 md:gap-6">
          {records.map((record) => (
            <ClientCard key={record.canonicalId} record={record} />
          ))}
        </div>
      ) : (
        <div role="status" aria-live="polite" className="py-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            {t("emptySector", { sector: tab.label })}
          </p>
        </div>
      )}
    </div>
  );
}

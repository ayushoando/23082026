"use client";

import { useState } from "react";
import type { ClientRecord, SectorTabId, SectorTabMeta } from "@/lib/clients/clientTypes";
import { useSectorTabs } from "@/hooks/useSectorTabs";
import { SectorTabList } from "./SectorTabList";
import { ClientTabPanel } from "./ClientTabPanel";

export interface ClientShowcaseProps {
  grouped: Record<SectorTabId, ClientRecord[]>;
  tabs: SectorTabMeta[];
}

/**
 * Client boundary for the sector showcase. All four panels stay mounted;
 * `useSectorTabs` marks the inactive ones `hidden`, so tab switches never
 * remount grids and assistive tech sees a single coherent tablist.
 */
export function ClientShowcase({ grouped, tabs }: ClientShowcaseProps) {
  const [activeTab, setActiveTab] = useState<SectorTabId>("financial-services");
  const { getPanelProps } = useSectorTabs({
    tabs,
    activeTab,
    onSelect: setActiveTab,
  });

  return (
    <div className="clients-showcase">
      <SectorTabList tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
      {tabs.map((tab) => (
        <ClientTabPanel
          key={tab.id}
          tab={tab}
          records={grouped[tab.id] ?? []}
          panelProps={getPanelProps(tab)}
        />
      ))}
    </div>
  );
}

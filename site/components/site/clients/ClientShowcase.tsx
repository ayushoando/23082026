"use client";
import { useState } from "react";
import type { ClientRecord, SectorTabId } from "@/lib/clients/clientTypes";
import { SECTOR_TABS } from "@/lib/clients/clientRegistry";
import { SectorTabList } from "./SectorTabList";
import { ClientTabPanel } from "./ClientTabPanel";
import { useSectorTabs } from "@/hooks/useSectorTabs";

interface ClientShowcaseProps {
  grouped: Record<SectorTabId, ClientRecord[]>;
}

export function ClientShowcase({ grouped }: ClientShowcaseProps) {
  const [activeTab, setActiveTab] = useState<SectorTabId>("financial-services");
  const { getPanelProps } = useSectorTabs(SECTOR_TABS, activeTab);

  return (
    <div className="flex flex-col gap-6">
      <SectorTabList tabs={SECTOR_TABS} activeTab={activeTab} onSelect={setActiveTab} />
      {SECTOR_TABS.map((tab) => (
        <ClientTabPanel
          key={tab.id}
          tab={tab}
          records={grouped[tab.id]}
          panelProps={getPanelProps(tab)}
        />
      ))}
    </div>
  );
}

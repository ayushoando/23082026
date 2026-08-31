"use client";
import type { SectorTabId, SectorTabMeta } from "@/lib/clients/clientTypes";
import { useSectorTabs } from "@/hooks/useSectorTabs";
import { SectorTabButton } from "./SectorTabButton";

interface SectorTabListProps {
  tabs: SectorTabMeta[];
  activeTab: SectorTabId;
  onSelect: (id: SectorTabId) => void;
}

export function SectorTabList({ tabs, activeTab, onSelect }: SectorTabListProps) {
  const { getTabListProps, getTabProps, setActiveTab } = useSectorTabs(tabs, activeTab);

  function handleSelect(id: SectorTabId) {
    setActiveTab(id);
    onSelect(id);
  }

  const tabListProps = getTabListProps();

  return (
    <div
      {...tabListProps}
      className="flex gap-2 overflow-x-auto snap-x md:flex-wrap md:overflow-visible"
    >
      {tabs.map((tab, index) => {
        const tabProps = getTabProps(tab, index);
        return (
          <SectorTabButton
            key={tab.id}
            tab={tab}
            isSelected={activeTab === tab.id}
            tabProps={{
              ...tabProps,
              onClick: () => handleSelect(tab.id),
            }}
          />
        );
      })}
    </div>
  );
}

"use client";

import type { SectorTabId, SectorTabMeta } from "@/lib/clients/clientTypes";
import { useSectorTabs } from "@/hooks/useSectorTabs";
import { SectorTabButton } from "./SectorTabButton";

export interface SectorTabListProps {
  tabs: SectorTabMeta[];
  activeTab: SectorTabId;
  onSelect: (id: SectorTabId) => void;
}

/**
 * The tablist strip: horizontally scrollable on mobile (snap row) and
 * wrapping on desktop. Keyboard behaviour lives in `useSectorTabs`.
 */
export function SectorTabList({ tabs, activeTab, onSelect }: SectorTabListProps) {
  const { getTabListProps, getTabProps, registerTabRef } = useSectorTabs({
    tabs,
    activeTab,
    onSelect,
  });

  return (
    <div {...getTabListProps()} className="clients-showcase__tabs">
      {tabs.map((tab, index) => (
        <SectorTabButton
          key={tab.id}
          ref={registerTabRef(index)}
          tab={tab}
          isSelected={tab.id === activeTab}
          tabProps={getTabProps(tab, index)}
        />
      ))}
    </div>
  );
}

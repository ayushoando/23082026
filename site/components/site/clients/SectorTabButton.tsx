"use client";
import type { SectorTabMeta } from "@/lib/clients/clientTypes";
import type { UseSectorTabsReturn } from "@/hooks/useSectorTabs";

interface SectorTabButtonProps {
  tab: SectorTabMeta;
  isSelected: boolean;
  tabProps: ReturnType<UseSectorTabsReturn["getTabProps"]>;
}

export function SectorTabButton({
  tab,
  isSelected,
  tabProps,
}: SectorTabButtonProps) {
  return (
    <button
      {...tabProps}
      className={[
        "min-h-11 min-w-11 shrink-0 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
        isSelected
          ? "bg-primary text-white shadow-sm"
          : "text-body hover:bg-muted",
      ].join(" ")}
    >
      {tab.label}
    </button>
  );
}

"use client";
import type { SectorTabMeta } from "@/lib/clients/clientTypes";
import type { UseSectorTabsReturn } from "@/hooks/useSectorTabs";

interface SectorTabButtonProps {
  tab: SectorTabMeta;
  isSelected: boolean;
  tabProps: ReturnType<UseSectorTabsReturn["getTabProps"]>;
}

export function SectorTabButton({ tab, isSelected, tabProps }: SectorTabButtonProps) {
  return (
    <button
      {...tabProps}
      className={[
        "min-h-[44px] min-w-[44px] shrink-0 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:outline-none",
        isSelected
          ? "bg-[var(--surface-active)] text-[var(--text-on-active)] shadow-sm"
          : "text-[var(--text-body)] hover:bg-[var(--surface-hover)]",
      ].join(" ")}
    >
      {tab.label}
    </button>
  );
}

"use client";

import type { Ref } from "react";
import type { SectorTabMeta } from "@/lib/clients/clientTypes";
import type { UseSectorTabsReturn } from "@/hooks/useSectorTabs";

export interface SectorTabButtonProps {
  tab: SectorTabMeta;
  isSelected: boolean;
  tabProps: ReturnType<UseSectorTabsReturn["getTabProps"]>;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * A single tab button. Uses the hook-provided roving-focus props verbatim;
 * the 44px minimum keeps the hit area WCAG-conformant on touch devices and
 * the focus-visible ring keeps keyboard focus perceptible.
 */
export function SectorTabButton({
  tab,
  isSelected,
  tabProps,
  ref,
}: SectorTabButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      {...tabProps}
      className={`clients-showcase__tab${isSelected ? " clients-showcase__tab--selected" : ""}`}
    >
      {tab.label}
    </button>
  );
}

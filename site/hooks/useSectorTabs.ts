"use client";
import React, { useCallback, useState } from "react";
import type { SectorTabId, SectorTabMeta } from "@/lib/clients/clientTypes";

export interface UseSectorTabsReturn {
  activeTab: SectorTabId;
  focusedIndex: number;
  setActiveTab: (id: SectorTabId) => void;
  getTabListProps: () => {
    role: "tablist";
    "aria-label": string;
  };
  getTabProps: (
    tab: SectorTabMeta,
    index: number,
  ) => {
    role: "tab";
    id: string;
    "aria-selected": boolean;
    "aria-controls": string;
    tabIndex: number;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onClick: () => void;
  };
  getPanelProps: (tab: SectorTabMeta) => {
    role: "tabpanel";
    id: string;
    "aria-labelledby": string;
    hidden: boolean;
  };
}

export function useSectorTabs(
  tabs: SectorTabMeta[],
  defaultTabId: SectorTabId = "financial-services",
): UseSectorTabsReturn {
  const [activeTab, setActiveTab] = useState<SectorTabId>(defaultTabId);
  const [focusedIndex, setFocusedIndex] = useState<number>(() => {
    const idx = tabs.findIndex((t) => t.id === defaultTabId);
    return idx >= 0 ? idx : 0;
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const count = tabs.length;
      if (count === 0) return;

      switch (e.key) {
        case "ArrowRight": {
          e.preventDefault();
          const next = (index + 1) % count;
          setFocusedIndex(next);
          const tabBtn = document.querySelector<HTMLButtonElement>(
            `#${tabs[next].tabId}`,
          );
          tabBtn?.focus();
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const prev = (index - 1 + count) % count;
          setFocusedIndex(prev);
          const tabBtn = document.querySelector<HTMLButtonElement>(
            `#${tabs[prev].tabId}`,
          );
          tabBtn?.focus();
          break;
        }
        case "Home": {
          e.preventDefault();
          setFocusedIndex(0);
          const tabBtn = document.querySelector<HTMLButtonElement>(
            `#${tabs[0].tabId}`,
          );
          tabBtn?.focus();
          break;
        }
        case "End": {
          e.preventDefault();
          setFocusedIndex(count - 1);
          const tabBtn = document.querySelector<HTMLButtonElement>(
            `#${tabs[count - 1].tabId}`,
          );
          tabBtn?.focus();
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          setActiveTab(tabs[index].id);
          break;
        }
        default:
          break;
      }
    },
    [tabs],
  );

  return {
    activeTab,
    focusedIndex,
    setActiveTab,
    getTabListProps: () => ({
      role: "tablist",
      "aria-label": "Client industry sectors",
    }),
    getTabProps: (tab, index) => ({
      role: "tab",
      id: tab.tabId,
      "aria-selected": activeTab === tab.id,
      "aria-controls": tab.panelId,
      tabIndex: activeTab === tab.id ? 0 : -1,
      onKeyDown: (e) => handleKeyDown(e, index),
      onClick: () => {
        setActiveTab(tab.id);
        setFocusedIndex(index);
      },
    }),
    getPanelProps: (tab) => ({
      role: "tabpanel",
      id: tab.panelId,
      "aria-labelledby": tab.tabId,
      hidden: activeTab !== tab.id,
    }),
  };
}

"use client";

import { useCallback, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { SectorTabId, SectorTabMeta } from "@/lib/clients/clientTypes";

/**
 * Roving-focus keyboard model for the client sector tablist
 * (WAI-ARIA Tabs pattern).
 *
 * Focus moves with ArrowLeft/ArrowRight (wrapping), Home, and End;
 * Enter/Space activates the focused tab. The `Tab` key exits the tablist
 * naturally. Only the active tab carries `tabIndex={0}`.
 */

export interface UseSectorTabsOptions {
  tabs: readonly SectorTabMeta[];
  activeTab: SectorTabId;
  onSelect: (id: SectorTabId) => void;
}

export interface SectorTabButtonProps {
  role: "tab";
  id: string;
  "aria-selected": boolean;
  "aria-controls": string;
  tabIndex: number;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onClick: () => void;
}

export interface SectorTabListProps {
  role: "tablist";
}

export interface SectorTabPanelProps {
  role: "tabpanel";
  id: string;
  "aria-labelledby": string;
  hidden: boolean;
}

export interface UseSectorTabsReturn {
  /** Index of the tab that currently owns roving focus. */
  focusedIndex: number;
  /** Callback ref registrar so the hook can move DOM focus itself. */
  registerTabRef: (
    index: number,
  ) => (element: HTMLButtonElement | null) => void;
  getTabListProps: () => SectorTabListProps;
  getTabProps: (tab: SectorTabMeta, index: number) => SectorTabButtonProps;
  getPanelProps: (tab: SectorTabMeta) => SectorTabPanelProps;
}

function indexOfTab(tabs: readonly SectorTabMeta[], id: SectorTabId): number {
  const index = tabs.findIndex((tab) => tab.id === id);
  return index >= 0 ? index : 0;
}

export function useSectorTabs({
  tabs,
  activeTab,
  onSelect,
}: UseSectorTabsOptions): UseSectorTabsReturn {
  const [focusedIndex, setFocusedIndex] = useState(() =>
    indexOfTab(tabs, activeTab),
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const registerTabRef = useCallback(
    (index: number) => (element: HTMLButtonElement | null) => {
      tabRefs.current[index] = element;
    },
    [],
  );

  const getTabListProps = useCallback((): SectorTabListProps => {
    return { role: "tablist" };
  }, []);

  const moveFocusTo = useCallback((nextIndex: number) => {
    setFocusedIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }, []);

  const getTabProps = useCallback(
    (tab: SectorTabMeta, index: number): SectorTabButtonProps => {
      const lastIndex = tabs.length - 1;
      return {
        role: "tab",
        id: tab.tabId,
        "aria-selected": tab.id === activeTab,
        "aria-controls": tab.panelId,
        tabIndex: tab.id === activeTab ? 0 : -1,
        onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
          switch (event.key) {
            case "ArrowRight":
              event.preventDefault();
              moveFocusTo(focusedIndex >= lastIndex ? 0 : focusedIndex + 1);
              break;
            case "ArrowLeft":
              event.preventDefault();
              moveFocusTo(focusedIndex <= 0 ? lastIndex : focusedIndex - 1);
              break;
            case "Home":
              event.preventDefault();
              moveFocusTo(0);
              break;
            case "End":
              event.preventDefault();
              moveFocusTo(lastIndex);
              break;
            case "Enter":
            case " ":
            case "Spacebar":
              event.preventDefault();
              onSelect(tabs[focusedIndex]?.id ?? tab.id);
              break;
            default:
              break;
          }
        },
        onClick: () => {
          setFocusedIndex(index);
          onSelect(tab.id);
        },
      };
    },
    [activeTab, focusedIndex, moveFocusTo, onSelect, tabs],
  );

  const getPanelProps = useCallback(
    (tab: SectorTabMeta): SectorTabPanelProps => {
      return {
        role: "tabpanel",
        id: tab.panelId,
        "aria-labelledby": tab.tabId,
        hidden: tab.id !== activeTab,
      };
    },
    [activeTab],
  );

  return {
    focusedIndex,
    registerTabRef,
    getTabListProps,
    getTabProps,
    getPanelProps,
  };
}

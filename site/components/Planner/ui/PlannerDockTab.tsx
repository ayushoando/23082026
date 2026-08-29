"use client";

import { DockviewDefaultTab, type IDockviewPanelHeaderProps } from "dockview-react";

/**
 * Dockview's default close action is nested inside its interactive tab and
 * triggers axe's nested-interactive rule. Planner already exposes panel
 * toggles outside the tab strip, so keep the tab renderer but omit that
 * nested close control.
 */
export function PlannerDockTab(props: IDockviewPanelHeaderProps) {
  return <DockviewDefaultTab {...props} hideClose />;
}

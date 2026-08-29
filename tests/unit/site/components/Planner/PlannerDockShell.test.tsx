import { act, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DockPanelDef, DockviewApiLike } from "@planner/lib/plannerTypes";

const dockviewCapture = vi.hoisted(() => ({ props: undefined as unknown }));

vi.mock("dockview-react", () => ({
  DockviewReact: (props: unknown) => {
    dockviewCapture.props = props;
    return <div data-testid="dockview-double" />;
  },
  themeAbyss: { className: "dockview-theme-abyss" },
  themeLight: { className: "dockview-theme-light" },
}));
vi.mock("@planner/components/ui/PlannerDockFloatHeaderActions", () => ({ DockFloatHeaderActions: () => null }));
vi.mock("@planner/components/ui/PlannerDockTab", () => ({ PlannerDockTab: () => null }));

import { DockShell } from "@planner/components/PlannerDockShell";

type PanelHandle = NonNullable<ReturnType<DockviewApiLike["getPanel"]>>;
interface DockviewDouble {
  readonly api: DockviewApiLike;
  readonly panels: Map<string, PanelHandle>;
  readonly layoutListeners: Array<() => void>;
}

const Panel: ComponentType = () => <div />;
const panelDefinitions: DockPanelDef[] = [
  { id: "catalog", title: "Catalog", render: Panel },
  { id: "properties", title: "Properties", render: Panel },
];

function createDockviewDouble(initialIds: readonly string[] = []): DockviewDouble {
  const panels = new Map<string, PanelHandle>();
  for (const id of initialIds) panels.set(id, { api: { close: vi.fn(), setActive: vi.fn() } });
  const layoutListeners: Array<() => void> = [];
  const api: DockviewApiLike = {
    panels: initialIds.map((id) => ({ id })),
    getPanel: (id) => panels.get(id),
    addPanel: vi.fn((options) => {
      panels.set(options.id, { api: { close: vi.fn(), setActive: vi.fn() } });
    }),
    fromJSON: vi.fn(),
    toJSON: vi.fn(() => ({ grid: "planner" })),
    onDidLayoutChange: vi.fn((listener) => layoutListeners.push(listener)),
  };
  return { api, panels, layoutListeners };
}

function capturedProps() {
  return dockviewCapture.props as {
    onReady(event: { api: DockviewApiLike }): void;
    theme: { className: string };
    floatingGroupBounds: { minimumWidthWithinViewport: number; minimumHeightWithinViewport: number };
    defaultTabComponent: unknown;
    singleTabMode: string;
  };
}

describe("Planner DockShell", () => {
  beforeEach(() => {
    localStorage.clear();
    dockviewCapture.props = undefined;
  });

  it("passes Planner-specific tabs, stable floating bounds, and light theme", () => {
    render(<DockShell panels={panelDefinitions} />);
    expect(screen.getByTestId("dock-shell")).toHaveClass("dock-shell", "dockview-theme-light", "ff-workspace-dock");
    expect(capturedProps().floatingGroupBounds).toEqual({
      minimumWidthWithinViewport: 48,
      minimumHeightWithinViewport: 48,
    });
    expect(capturedProps().defaultTabComponent).toBeTypeOf("function");
    expect(capturedProps().singleTabMode).toBe("fullwidth");
  });

  it("adds missing panels in deterministic vertical order", () => {
    const dockview = createDockviewDouble();
    render(<DockShell panels={panelDefinitions} />);
    act(() => capturedProps().onReady({ api: dockview.api }));

    expect(dockview.api.addPanel).toHaveBeenNthCalledWith(1, {
      id: "catalog",
      component: "catalog",
      title: "Catalog",
    });
    expect(dockview.api.addPanel).toHaveBeenNthCalledWith(2, {
      id: "properties",
      component: "properties",
      title: "Properties",
      position: { direction: "below", referencePanel: "catalog" },
    });
  });

  it("restores only a panel-compatible layout and persists later changes", () => {
    localStorage.setItem(
      "planner-layout",
      JSON.stringify({ layout: { grid: "saved" }, panels: ["catalog", "properties"] }),
    );
    const dockview = createDockviewDouble();
    render(<DockShell panels={panelDefinitions} storageKey="planner-layout" />);
    act(() => capturedProps().onReady({ api: dockview.api }));

    expect(dockview.api.fromJSON).toHaveBeenCalledWith({ grid: "saved" });
    expect(dockview.layoutListeners).toHaveLength(1);
    act(() => dockview.layoutListeners[0]());
    expect(JSON.parse(localStorage.getItem("planner-layout") ?? "null")).toEqual({
      layout: { grid: "planner" },
      panels: ["catalog", "properties"],
    });
  });
});

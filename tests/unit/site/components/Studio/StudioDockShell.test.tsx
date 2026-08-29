import { act, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DockPanelDef, DockviewApiLike } from "@studio/lib/studioTypes";

const dockviewCapture = vi.hoisted(() => ({ props: undefined as unknown }));

vi.mock("dockview-react", () => ({
  DockviewReact: (props: unknown) => {
    dockviewCapture.props = props;
    return <div data-testid="dockview-double" />;
  },
  themeAbyss: { className: "dockview-theme-abyss" },
  themeLight: { className: "dockview-theme-light" },
}));
vi.mock("@studio/components/ui/StudioDockFloatHeaderActions", () => ({ DockFloatHeaderActions: () => null }));

import { DockShell } from "@studio/components/StudioDockShell";

type PanelHandle = NonNullable<ReturnType<DockviewApiLike["getPanel"]>>;
interface DockviewDouble {
  readonly api: DockviewApiLike;
  readonly panels: Map<string, PanelHandle>;
  readonly layoutListeners: Array<() => void>;
  readonly removeListeners: Array<() => void>;
}

const Panel: ComponentType = () => <div />;
const panelDefinitions: DockPanelDef[] = [
  { id: "color", title: "Color", render: Panel },
  { id: "layers", title: "Layers", render: Panel },
];

function createDockviewDouble(initialIds: readonly string[] = []): DockviewDouble {
  const panels = new Map<string, PanelHandle>();
  for (const id of initialIds) panels.set(id, { api: { close: vi.fn(), setActive: vi.fn() } });
  const layoutListeners: Array<() => void> = [];
  const removeListeners: Array<() => void> = [];
  const api: DockviewApiLike = {
    panels: initialIds.map((id) => ({ id })),
    getPanel: (id) => panels.get(id),
    addPanel: vi.fn((options) => {
      panels.set(options.id, { api: { close: vi.fn(), setActive: vi.fn() } });
    }),
    fromJSON: vi.fn(),
    toJSON: vi.fn(() => ({ grid: "studio" })),
    onDidLayoutChange: vi.fn((listener) => layoutListeners.push(listener)),
    onDidRemovePanel: vi.fn((listener) => removeListeners.push(listener)),
  };
  return { api, panels, layoutListeners, removeListeners };
}

function capturedProps() {
  return dockviewCapture.props as {
    onReady(event: { api: DockviewApiLike }): void;
    theme: { className: string };
    floatingGroupBounds: { minimumWidthWithinViewport: number; minimumHeightWithinViewport: number };
    defaultTabComponent?: unknown;
  };
}

describe("Studio DockShell", () => {
  beforeEach(() => {
    localStorage.clear();
    dockviewCapture.props = undefined;
  });

  it("uses Studio-owned chrome without importing Planner tab geometry", () => {
    render(<DockShell panels={panelDefinitions} theme="dark" />);
    expect(screen.getByTestId("dock-shell")).toHaveClass("dockview-theme-abyss");
    expect(capturedProps().floatingGroupBounds).toEqual({
      minimumWidthWithinViewport: 48,
      minimumHeightWithinViewport: 48,
    });
    expect(capturedProps().defaultTabComponent).toBeUndefined();
  });

  it("adds Studio panels and watches both layout and panel removal", () => {
    const dockview = createDockviewDouble();
    render(<DockShell panels={panelDefinitions} storageKey="studio-layout" />);
    act(() => capturedProps().onReady({ api: dockview.api }));

    expect(dockview.api.addPanel).toHaveBeenCalledTimes(2);
    expect(dockview.layoutListeners).toHaveLength(1);
    expect(dockview.removeListeners).toHaveLength(1);
  });

  it("clears persisted layout and reports an empty Studio dock", () => {
    localStorage.setItem("studio-layout", "saved");
    const onEmpty = vi.fn();
    const dockview = createDockviewDouble();
    render(<DockShell panels={panelDefinitions} storageKey="studio-layout" onEmpty={onEmpty} />);
    act(() => capturedProps().onReady({ api: dockview.api }));
    dockview.panels.clear();
    act(() => dockview.removeListeners[0]());

    expect(localStorage.getItem("studio-layout")).toBeNull();
    expect(onEmpty).toHaveBeenCalledOnce();
  });
});

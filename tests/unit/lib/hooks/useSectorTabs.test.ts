//
// Feature: client-showcase-tabs, Property 5: roving-focus keyboard model.
// Model-based enumeration of 4 initial focused tabs × 6 keys
// (plans/client-showcase-tabs task 8.3).

// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { useSectorTabs } from "@/hooks/useSectorTabs";
import type { SectorTabId, SectorTabMeta } from "@/lib/clients/clientTypes";

const TABS: SectorTabMeta[] = [
  {
    id: "financial-services",
    label: "Financial Services",
    tabId: "tab-financial-services",
    panelId: "panel-financial-services",
  },
  {
    id: "government-public-sector",
    label: "Government & Public Sector",
    tabId: "tab-government-public-sector",
    panelId: "panel-government-public-sector",
  },
  {
    id: "education-social-impact",
    label: "Education, Social Impact & Development",
    tabId: "tab-education-social-impact",
    panelId: "panel-education-social-impact",
  },
  {
    id: "corporates-multinationals",
    label: "Corporates & Multinationals",
    tabId: "tab-corporates-multinationals",
    panelId: "panel-corporates-multinationals",
  },
];

const INITIAL_TAB: SectorTabId = "financial-services";

const keyEvent = (key: string): KeyboardEvent<HTMLButtonElement> =>
  ({
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }) as unknown as KeyboardEvent<HTMLButtonElement>;

function setup() {
  const onSelect = vi.fn();
  const view = renderHook(() =>
    useSectorTabs({ tabs: TABS, activeTab: INITIAL_TAB, onSelect }),
  );
  return { onSelect, view };
}

/** Press `key` while roving focus sits on tab index `focusedIndex`. */
function press(
  view: ReturnType<typeof setup>["view"],
  focusedIndex: number,
  key: string,
) {
  act(() => {
    view.result.current.getTabProps(TABS[focusedIndex], focusedIndex).onKeyDown(keyEvent(key));
  });
}

const FOCUS_MOVING_KEYS = ["ArrowRight", "ArrowLeft", "Home", "End"] as const;
const ACTIVATING_KEYS = ["Enter", " "] as const;

describe("useSectorTabs — full 4×6 key model", () => {
  for (const start of [0, 1, 2, 3]) {
    for (const key of FOCUS_MOVING_KEYS) {
      // Feature: client-showcase-tabs, Property 5: Arrow/Home/End move focus
      // only; activeTab never changes on those keys.
      it(`focus ${key} from tab ${start} moves focus without activating`, () => {
        const fresh = setup();
        for (let step = 0; step < start; step += 1) {
          press(fresh.view, step, "ArrowRight");
        }
        expect(fresh.view.result.current.focusedIndex).toBe(start);

        press(fresh.view, start, key);
        const { focusedIndex } = fresh.view.result.current;

        const expected =
          key === "ArrowRight"
            ? (start + 1) % 4
            : key === "ArrowLeft"
              ? (start + 3) % 4
              : key === "Home"
                ? 0
                : 3;
        expect(focusedIndex).toBe(expected);
        expect(fresh.onSelect).not.toHaveBeenCalled();
        expect(fresh.view.result.current.getTabProps(TABS[0], 0)["aria-selected"]).toBe(true);
      });
    }

    for (const key of ACTIVATING_KEYS) {
      // Feature: client-showcase-tabs, Property 5: Enter/Space activate the
      // focused tab; focus does not move.
      it(`${key} on tab ${start} activates it without moving focus`, () => {
        const { view, onSelect } = setup();
        for (let step = 0; step < start; step += 1) {
          press(view, step, "ArrowRight");
        }
        onSelect.mockClear();

        press(view, start, key);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(TABS[start].id);
        expect(view.result.current.focusedIndex).toBe(start);
      });
    }
  }
});

describe("useSectorTabs — roving tabIndex and DOM wiring", () => {
  it("only the active tab receives tabIndex 0", () => {
    const { view } = setup();
    for (let index = 0; index < TABS.length; index += 1) {
      const props = view.result.current.getTabProps(TABS[index], index);
      expect(props.tabIndex).toBe(index === 0 ? 0 : -1);
      expect(props.role).toBe("tab");
      expect(props.id).toBe(TABS[index].tabId);
      expect(props["aria-controls"]).toBe(TABS[index].panelId);
      expect(props["aria-selected"]).toBe(index === 0);
    }
  });

  it("getTabListProps provides the tablist role", () => {
    const { view } = setup();
    expect(view.result.current.getTabListProps()).toEqual({ role: "tablist" });
  });

  it("getPanelProps hides every panel except the active one", () => {
    const { view } = setup();
    for (const tab of TABS) {
      const props = view.result.current.getPanelProps(tab);
      expect(props.role).toBe("tabpanel");
      expect(props.id).toBe(tab.panelId);
      expect(props["aria-labelledby"]).toBe(tab.tabId);
      expect(props.hidden).toBe(tab.id !== INITIAL_TAB);
    }
  });

  it("ArrowRight wraps from the last tab to the first", () => {
    const { view } = setup();
    for (let step = 0; step < 3; step += 1) {
      press(view, step, "ArrowRight");
    }
    expect(view.result.current.focusedIndex).toBe(3);
    press(view, 3, "ArrowRight");
    expect(view.result.current.focusedIndex).toBe(0);
    expect(view.result.current.getPanelProps(TABS[0]).hidden).toBe(false);
  });

  it("ArrowLeft wraps from the first tab to the last", () => {
    const { view } = setup();
    press(view, 0, "ArrowLeft");
    expect(view.result.current.focusedIndex).toBe(3);
  });

  it("click activates the clicked tab and moves roving focus", () => {
    const { view, onSelect } = setup();
    act(() => {
      view.result.current.getTabProps(TABS[2], 2).onClick();
    });
    expect(onSelect).toHaveBeenCalledWith("education-social-impact");
    expect(view.result.current.focusedIndex).toBe(2);
  });
});

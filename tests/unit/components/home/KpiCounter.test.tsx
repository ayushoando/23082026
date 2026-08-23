import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { KpiCounter } from "@/components/home/KpiCounter";
import { useInView } from "framer-motion";
import { formatKpiValuePlus } from "@/lib/kpiFormat";

vi.mock("framer-motion", () => ({
  useInView: vi.fn(),
}));

vi.mock("@/lib/kpiFormat", () => ({
  formatKpiValuePlus: vi.fn().mockImplementation((val: number) => `${val}+`),
}));

describe("KpiCounter — behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("renders target value with computed class and plus suffix when reduced motion is true", () => {
    vi.mocked(useInView).mockReturnValue(true);

    const { container } = render(<KpiCounter value={100} />);
    const p = container.querySelector("p") as HTMLElement;
    expect(p).toHaveClass("typ-stat");
    expect(p).toHaveClass("text-primary");
    expect(p).toHaveTextContent("100+");
    expect(p).toHaveTextContent(formatKpiValuePlus(100));
    expect(screen.getByText("100+")).toBeInTheDocument();
    expect(screen.queryByText("0+")).not.toBeInTheDocument();
    expect(screen.queryByText("88+")).not.toBeInTheDocument();
  });

  it("respects custom className and does not animate when not in view", () => {
    vi.mocked(useInView).mockReturnValue(false);
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<KpiCounter value={42} className="custom-stat" />);
    const p = container.querySelector("p") as HTMLElement;
    expect(p).toHaveClass("custom-stat");
    expect(p).not.toHaveClass("typ-stat");
    expect(p).toHaveTextContent("42+");
    expect(p).toHaveTextContent(formatKpiValuePlus(42));
    expect(screen.getByText("42+")).toBeInTheDocument();
    expect(screen.queryByText("0+")).not.toBeInTheDocument();
  });

  it("animates from 0+ to 88+ to 100+ with easing when motion enabled and in view", () => {
    vi.mocked(useInView).mockReturnValue(true);
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    const cancelSpy = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancelSpy);

    let nowVal = 0;
    vi.stubGlobal("performance", {
      now: () => nowVal,
    });

    const { container, unmount } = render(<KpiCounter value={100} />);
    const p = container.querySelector("p") as HTMLElement;

    // initial displayValue 0 when animating
    expect(p).toHaveTextContent("0+");
    expect(screen.getByText("0+")).toBeInTheDocument();
    expect(screen.queryByText("100+")).not.toBeInTheDocument();

    // tick at 50% duration (1100ms of 2200ms): eased 1-(1-0.5)^3 = 0.875 -> 88
    nowVal = 1100;
    act(() => {
      callbacks[0]?.(1100);
    });
    expect(p).toHaveTextContent("88+");
    expect(screen.getByText("88+")).toBeInTheDocument();
    expect(screen.queryByText("0+")).not.toBeInTheDocument();

    // final frame
    nowVal = 2200;
    act(() => {
      callbacks[1]?.(2200);
    });
    expect(p).toHaveTextContent("100+");
    expect(screen.getByText("100+")).toBeInTheDocument();
    expect(screen.queryByText("88+")).not.toBeInTheDocument();
    expect(screen.queryByText("0+")).not.toBeInTheDocument();

    // cleanup cancels frame on unmount
    unmount();
    expect(cancelSpy).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("formats varied values via source-of-truth formatKpiValuePlus", () => {
    const values = [0, 1, 99, 1000];
    for (const v of values) {
      const { unmount } = render(<KpiCounter value={v} />);
      expect(screen.getByText(`${v}+`)).toBeInTheDocument();
      expect(screen.getByText(`${v}+`)).toHaveTextContent(formatKpiValuePlus(v));
      unmount();
      expect(screen.queryByText(`${v}+`)).not.toBeInTheDocument();
    }
  });
});

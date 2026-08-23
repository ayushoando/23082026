import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createCanvasBlockColorResolver,
  renderBlock2DCentered,
  renderBlock2DToCanvas,
  resolveCanvasStrokeWidthMm,
} from "@/lib/catalog/renderBlock2DToCanvas";
import type { Block2D, Prim } from "@/lib/catalog/blocks2d";
import * as resolveBlockColors from "@/lib/catalog/resolveBlockColors";

function withHost(): { host: HTMLElement; dispose: () => void } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return {
    host,
    dispose: () => {
      host.remove();
    },
  };
}

describe("createCanvasBlockColorResolver", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps none, hex, and rgb without a live computed style", () => {
    const { host, dispose } = withHost();
    const resolve = createCanvasBlockColorResolver(host);
    expect(resolve(undefined)).toBe("transparent");
    expect(resolve("none")).toBe("transparent");
    expect(resolve("#abc")).toBe("#abc");
    expect(resolve("#aabbccdd")).toBe("#aabbccdd");
    expect(resolve("rgb(1, 2, 3)")).toBe("rgb(1, 2, 3)");
    expect(resolve("rgba(1, 2, 3, 0.5)")).toBe("rgba(1, 2, 3, 0.5)");
    (resolve as typeof resolve & { dispose?: () => void }).dispose?.();
    dispose();
  });

  it("uses host currentColor and falls back to #333 when computed color is empty", () => {
    const { host, dispose } = withHost();
    host.style.color = "rgb(9, 8, 7)";
    const resolve = createCanvasBlockColorResolver(host);
    expect(resolve("currentColor")).toBe(getComputedStyle(host).color || "#333");

    vi.spyOn(globalThis, "getComputedStyle").mockReturnValue({
      color: "",
    } as CSSStyleDeclaration);
    expect(resolve("currentColor")).toBe("#333");
    (resolve as typeof resolve & { dispose?: () => void }).dispose?.();
    dispose();
  });

  it("returns mapped hex tokens without probing computed style", () => {
    const { host, dispose } = withHost();
    const resolve = createCanvasBlockColorResolver(host);
    expect(resolve("var(--block-plant-base)")).toBe("#65a30d");
    (resolve as typeof resolve & { dispose?: () => void }).dispose?.();
    dispose();
  });

  it("probes var() and -- tokens and accepts a computed rgb", () => {
    const { host, dispose } = withHost();
    const appended: HTMLElement[] = [];
    const origAppend = host.appendChild.bind(host);
    host.appendChild = ((node: Node) => {
      appended.push(node as HTMLElement);
      return origAppend(node);
    }) as typeof host.appendChild;

    const resolve = createCanvasBlockColorResolver(host);
    const probe = appended[0];
    expect(probe).toBeDefined();

    const originalGet = globalThis.getComputedStyle.bind(globalThis);
    vi.spyOn(globalThis, "getComputedStyle").mockImplementation((el) => {
      if (el === probe) {
        return { color: "rgb(12, 34, 56)" } as CSSStyleDeclaration;
      }
      return originalGet(el);
    });

    expect(resolve("var(--block-surface)")).toBe("rgb(12, 34, 56)");
    expect(resolve("--block-seat")).toBe("rgb(12, 34, 56)");
    (resolve as typeof resolve & { dispose?: () => void }).dispose?.();
    dispose();
  });

  it("falls through transparent computed colors and maps none from the base resolver", () => {
    const { host, dispose } = withHost();
    vi.spyOn(resolveBlockColors, "createBlockColorResolver").mockReturnValue((token) => {
      if (token === "ghost") {return "none";}
      if (token === "plain") {return "rebeccapurple";}
      if (token === "dash-token") {return "--mapped-token";}
      if (token === "mapped-rgb") {return "rgb(9, 9, 9)";}
      return token ?? "none";
    });

    const appended: HTMLElement[] = [];
    const origAppend = host.appendChild.bind(host);
    host.appendChild = ((node: Node) => {
      appended.push(node as HTMLElement);
      return origAppend(node);
    }) as typeof host.appendChild;

    const resolve = createCanvasBlockColorResolver(host);
    const probe = appended[0];
    const originalGet = globalThis.getComputedStyle.bind(globalThis);
    vi.spyOn(globalThis, "getComputedStyle").mockImplementation((el) => {
      if (el === probe) {
        return { color: "rgba(0, 0, 0, 0)" } as CSSStyleDeclaration;
      }
      return originalGet(el);
    });

    expect(resolve("ghost")).toBe("transparent");
    expect(resolve("mapped-rgb")).toBe("rgb(9, 9, 9)");
    expect(resolve("plain")).toBe("rebeccapurple");
    expect(resolve("dash-token")).toBe("--mapped-token");

    vi.mocked(globalThis.getComputedStyle).mockImplementation((el) => {
      if (el === probe) {
        return { color: "transparent" } as CSSStyleDeclaration;
      }
      return originalGet(el);
    });
    expect(resolve("plain")).toBe("rebeccapurple");

    Object.defineProperty(probe.style, "color", {
      configurable: true,
      set() {
        throw new Error("computed style unavailable");
      },
      get() {
        return "";
      },
    });
    expect(resolve("var(--anything)")).toBe("var(--anything)");

    (resolve as typeof resolve & { dispose?: () => void }).dispose?.();
    dispose();
  });

  it("wraps a mapped var() token and ignores an empty computed color", () => {
    const { host, dispose } = withHost();
    vi.spyOn(resolveBlockColors, "createBlockColorResolver").mockReturnValue((token) => {
      if (token === "mapped-var") {return "var(--mapped)";}
      return token ?? "none";
    });

    const appended: HTMLElement[] = [];
    const origAppend = host.appendChild.bind(host);
    host.appendChild = ((node: Node) => {
      appended.push(node as HTMLElement);
      return origAppend(node);
    }) as typeof host.appendChild;

    const resolve = createCanvasBlockColorResolver(host);
    const probe = appended[0];
    const originalGet = globalThis.getComputedStyle.bind(globalThis);
    vi.spyOn(globalThis, "getComputedStyle").mockImplementation((el) => {
      if (el === probe) {
        return { color: "" } as CSSStyleDeclaration;
      }
      return originalGet(el);
    });

    expect(resolve("mapped-var")).toBe("var(--mapped)");
    (resolve as typeof resolve & { dispose?: () => void }).dispose?.();
    dispose();
  });
});

describe("resolveCanvasStrokeWidthMm", () => {
  it("floors thin mm strokes under plan zoom so detail stays visible", () => {
    // scale 0.1 (typical Feasibility zoom) · 1.5mm → need ≥12.5mm user units for 1.25px
    expect(resolveCanvasStrokeWidthMm(1.5, 0.1, 1.25)).toBeCloseTo(12.5, 5);
    expect(resolveCanvasStrokeWidthMm(1.5, 1, 1.25)).toBe(1.5);
  });

  it("defaults non-finite or non-positive widths and a zero scale", () => {
    expect(resolveCanvasStrokeWidthMm(Number.NaN, 2)).toBe(1);
    expect(resolveCanvasStrokeWidthMm(0, 2)).toBe(1);
    expect(resolveCanvasStrokeWidthMm(-2, 0)).toBeGreaterThan(0);
  });
});

type GradientStop = { offset: number; color: string };

type MockContext = CanvasRenderingContext2D & {
  calls: string[];
  stops: GradientStop[];
  dashes: number[][];
};

function mockContext(opts?: {
  getTransform?: (() => { a: number; b: number }) | false;
  roundRect?: boolean;
}): MockContext {
  if (typeof globalThis.Path2D === "undefined") {
    class Path2DStub {
      constructor(public readonly data?: string) {}
    }
    (globalThis as { Path2D: unknown }).Path2D = Path2DStub;
  }

  const calls: string[] = [];
  const stops: GradientStop[] = [];
  const dashes: number[][] = [];
  const ctx: Record<string, unknown> = {
    calls,
    stops,
    dashes,
    save: () => {
      calls.push("save");
    },
    restore: () => {
      calls.push("restore");
    },
    translate: () => {
      calls.push("translate");
    },
    rotate: () => {
      calls.push("rotate");
    },
    scale: () => {
      calls.push("scale");
    },
    beginPath: () => {
      calls.push("beginPath");
    },
    rect: () => {
      calls.push("rect");
    },
    arc: () => {
      calls.push("arc");
    },
    moveTo: () => {
      calls.push("moveTo");
    },
    lineTo: () => {
      calls.push("lineTo");
    },
    fill: () => {
      calls.push("fill");
    },
    stroke: () => {
      calls.push("stroke");
    },
    setLineDash: (segments: number[]) => {
      dashes.push([...segments]);
      calls.push("setLineDash");
    },
    createLinearGradient: () => ({
      addColorStop: (offset: number, color: string) => {
        stops.push({ offset, color });
        calls.push("addColorStop");
      },
    }),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt" as CanvasLineCap,
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };

  if (opts?.getTransform === false) {
    // omit getTransform so contextUniformScale falls back to 1
  } else if (opts?.getTransform) {
    ctx.getTransform = opts.getTransform;
  } else {
    ctx.getTransform = () => ({ a: 0.1, b: 0, c: 0, d: 0.1, e: 0, f: 0 });
  }

  if (opts?.roundRect !== false) {
    ctx.roundRect = () => {
      calls.push("roundRect");
    };
  }

  return ctx as unknown as MockContext;
}

function footprintBlock(prims: Prim[]): Block2D {
  return { footprint: { L: 200, D: 200, H: 10 }, label: "mix", prims };
}

const tokenResolve = (t: string | undefined): string =>
  t && t !== "none" ? String(t) : "transparent";

describe("renderBlock2DToCanvas", () => {
  it("draws rect prims without throwing", () => {
    const block: Block2D = {
      footprint: { L: 1200, D: 600, H: 750 },
      label: "desk",
      prims: [
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 1200,
          h: 600,
          fill: "#DED2B6",
          stroke: "#333",
          strokeWidth: 2,
          radius: 8,
        },
      ],
    };
    const ctx = mockContext();
    renderBlock2DToCanvas(ctx, block, {
      resolve: (t) => (t && t !== "none" ? String(t) : "transparent"),
    });
    const calls = (ctx as unknown as { calls: string[] }).calls;
    expect(calls).toContain("save");
    expect(calls).toContain("fill");
    expect(calls).toContain("restore");
  });

  it("centers block via renderBlock2DCentered", () => {
    const block: Block2D = {
      footprint: { L: 100, D: 50, H: 10 },
      label: "box",
      prims: [
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 100,
          h: 50,
          fill: "#fff",
        },
      ],
    };
    const ctx = mockContext();
    renderBlock2DCentered(ctx, block, {
      resolve: (t) => String(t ?? "transparent"),
    });
    const calls = (ctx as unknown as { calls: string[] }).calls;
    expect(calls.filter((c) => c === "translate").length).toBeGreaterThanOrEqual(1);
  });

  it("draws circle, line, path, and arc prims", () => {
    const block: Block2D = {
      footprint: { L: 200, D: 200, H: 10 },
      label: "mix",
      prims: [
        { kind: "circle", cx: 10, cy: 10, r: 5, fill: "#000", stroke: "#111", strokeWidth: 1 },
        { kind: "line", points: [0, 0, 10, 10], stroke: "#222", strokeWidth: 1, dash: [2, 2] },

        {
          kind: "arc",
          cx: 5,
          cy: 5,
          r: 4,
          startAngle: 0,
          endAngle: 1,
          fill: "none",
          stroke: "#555",
          strokeWidth: 1,
        },
      ],
    };
    const ctx = mockContext();
    renderBlock2DToCanvas(ctx, block, {
      resolve: (t) => (t && t !== "none" ? String(t) : "transparent"),
    });
    const calls = (ctx as unknown as { calls: string[] }).calls;
    expect(calls).toContain("arc");
    expect(calls).toContain("moveTo");
    expect(calls).toContain("stroke");
  });

  it("returns immediately when the block has no prims", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(ctx, footprintBlock([]));
    expect(ctx.calls).toEqual([]);
  });

  it("uses the default color resolver when none is provided", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([{ kind: "rect", x: 0, y: 0, w: 10, h: 10, fill: "#111" }]),
    );
    expect(ctx.calls).toContain("fill");
  });

  it("draws a sharp rect when radius is 0 or roundRect is missing", () => {
    const ctx = mockContext({ roundRect: false });
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        { kind: "rect", x: 0, y: 0, w: 10, h: 10, fill: "none", radius: 0 },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.calls).toContain("rect");
    expect(ctx.calls).not.toContain("roundRect");
    expect(ctx.calls).not.toContain("fill");
  });

  it("applies rotation offsets and skipShadow on a rounded rect", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "rect",
          x: 1,
          y: 2,
          w: 8,
          h: 8,
          fill: "#abc",
          stroke: "#000",
          strokeWidth: 1,
          radius: 2,
          rotation: 90,
          offsetX: 4,
          offsetY: 5,
          shadowColor: "#333",
          shadowBlur: 3,
          shadowOffsetY: 2,
        },
      ]),
      { resolve: tokenResolve, skipShadow: true },
    );
    expect(ctx.calls.filter((c) => c === "translate")).toHaveLength(2);
    expect(ctx.calls).toContain("rotate");
    expect(ctx.calls).toContain("roundRect");
    expect(ctx.shadowColor).toBe("transparent");
    expect(ctx.shadowBlur).toBe(0);
  });

  it("applies resolved shadows and defaults missing blur/offset", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 4,
          h: 4,
          fill: "#fff",
          shadowColor: "#222",
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.shadowColor).toBe("#222");
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowOffsetY).toBe(0);
    expect(ctx.shadowOffsetX).toBe(0);
  });

  it("clears a shadow that resolves to none or transparent", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 4,
          h: 4,
          fill: "#fff",
          shadowColor: "none",
        },
        {
          kind: "rect",
          x: 1,
          y: 1,
          w: 4,
          h: 4,
          fill: "#fff",
          shadowColor: "transparent",
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.shadowColor).toBe("transparent");
  });

  it("builds a linear gradient and skips invalid color stops", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 20,
          h: 20,
          fill: "#ignored",
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 20, y: 0 },
          fillLinearGradientColorStops: [0, "#fff", 1, "none", Number.NaN, "#000", 0.5, "#abc"],
        },
      ]),
      {
        resolve: (token) => (token === "none" ? "none" : String(token ?? "transparent")),
      },
    );
    expect(ctx.stops).toEqual([
      { offset: 0, color: "#fff" },
      { offset: 0.5, color: "#abc" },
    ]);
    expect(ctx.calls).toContain("fill");
  });

  it("does not treat a short stop list as a gradient", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 8,
          h: 8,
          fill: "#321",
          fillLinearGradientColorStops: [0, "#fff"],
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.stops).toEqual([]);
    expect(ctx.fillStyle).toBe("#321");
  });

  it("draws a dashed circle and a fill-only circle", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "circle",
          cx: 4,
          cy: 4,
          r: 2,
          fill: "#000",
          stroke: "#111",
          strokeWidth: 1,
          dash: [3, 2],
        },
        { kind: "circle", cx: 8, cy: 8, r: 1, fill: "none" },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.calls).toContain("arc");
    expect(ctx.dashes.some((d) => d[0] === 3 && d[1] === 2)).toBe(true);
    expect(ctx.calls).toContain("setLineDash");
  });

  it("strokes a polyline with scaled dashes and a custom cap", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "line",
          points: [0, 0, 10, 10, 20, 0],
          stroke: "#222",
          strokeWidth: 1,
          dash: [2, 2],
          lineCap: "square",
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.calls).toContain("moveTo");
    expect(ctx.calls).toContain("lineTo");
    expect(ctx.lineCap).toBe("square");
    expect(ctx.dashes[0]?.[0]).toBeGreaterThanOrEqual(2);
  });

  it("strokes an undashed line when getTransform is missing", () => {
    const ctx = mockContext({ getTransform: false });
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "line",
          points: [0, 0, 4, 4],
          stroke: "#333",
          strokeWidth: undefined as unknown as number,
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.calls).toContain("stroke");
    expect(ctx.lineCap).toBe("round");
    expect(ctx.dashes.at(-1)).toEqual([]);
  });

  it("uses a unit scale when the transform hypot is zero", () => {
    const ctx = mockContext({
      getTransform: () => ({ a: 0, b: 0 }),
    });
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "line",
          points: [0, 0, 2, 2],
          stroke: "#444",
          strokeWidth: 1,
          dash: [1, 1],
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.dashes[0]?.[0]).toBeGreaterThanOrEqual(1);
  });

  it("fills and strokes a path prim, and skips a transparent path fill", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "path",
          data: "M 0 0 L 10 0 L 10 10 Z",
          fill: "#abc",
          stroke: "#000",
          strokeWidth: 1,
        },
        {
          kind: "path",
          data: "M 0 0 L 1 1",
          fill: "none",
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.calls).toContain("fill");
    expect(ctx.calls).toContain("stroke");
    expect(ctx.lineCap).toBe("round");
  });

  it("uses an explicit path lineCap and a path gradient fill", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "path",
          data: "M 0 0 H 10 V 10 Z",
          fill: "#111",
          stroke: "#222",
          strokeWidth: 2,
          lineCap: "butt",
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 10, y: 10 },
          fillLinearGradientColorStops: [0, "#000", 1, "#fff"],
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.lineCap).toBe("butt");
    expect(ctx.stops).toEqual([
      { offset: 0, color: "#000" },
      { offset: 1, color: "#fff" },
    ]);
  });

  it("fills an arc when the fill is opaque and defaults the cap", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "arc",
          cx: 5,
          cy: 5,
          r: 3,
          startAngle: 0,
          endAngle: 1,
          fill: "#555",
          stroke: "#666",
          strokeWidth: 1,
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.calls.filter((c) => c === "fill").length).toBeGreaterThan(0);
    expect(ctx.lineCap).toBe("round");
  });

  it("rotates a rect without offsets and falls back when roundRect is missing", () => {
    const ctx = mockContext({ roundRect: false });
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          fill: "#abc",
          stroke: "#000",
          strokeWidth: 1,
          radius: 3,
          rotation: 45,
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.calls).toContain("rotate");
    expect(ctx.calls).toContain("rect");
    expect(ctx.calls).not.toContain("roundRect");
  });

  it("skips a gradient when the start or end point is missing", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 8,
          h: 8,
          fill: "#321",
          fillLinearGradientEndPoint: { x: 8, y: 0 },
          fillLinearGradientColorStops: [0, "#fff", 1, "#000"],
        },
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 8,
          h: 8,
          fill: "#654",
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientColorStops: [0, "#fff", 1, "#000"],
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.stops).toEqual([]);
    expect(ctx.fillStyle).toBe("#654");
  });

  it("strokes an undashed circle, skips empty path fills, and honors an arc cap", () => {
    const ctx = mockContext();
    renderBlock2DToCanvas(
      ctx,
      footprintBlock([
        {
          kind: "circle",
          cx: 4,
          cy: 4,
          r: 2,
          fill: "#000",
          stroke: "#111",
          strokeWidth: 1,
        },
        { kind: "path", data: "M 0 0 L 2 2", fill: "transparent" },
        { kind: "path", data: "M 0 0 L 2 2" },
        { kind: "line", points: [], stroke: "#222", strokeWidth: 1 },
        {
          kind: "arc",
          cx: 5,
          cy: 5,
          r: 3,
          startAngle: 0,
          endAngle: 1,
          fill: "transparent",
          stroke: "#666",
          strokeWidth: 1,
          lineCap: "butt",
        },
      ]),
      { resolve: tokenResolve },
    );
    expect(ctx.calls).toContain("arc");
    expect(ctx.lineCap).toBe("butt");
    expect(ctx.calls).toContain("stroke");
  });
});

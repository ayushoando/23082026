// @vitest-environment node
//
// Feature: planner-comprehensive-audit, Property 11: Input-command parity
//
// **Validates: Requirements 7.1, 7.2, 7.3, 7.7**

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  buildCanvasCommands,
  executeCommand,
  findCommand,
  type FabricCanvasLike,
  type FabricObjectLike,
  type PlannerCommandContext,
} from "@planner/lib/commands/canvasCommands";

const PROPERTY_RUNS = 120;
const commands = buildCanvasCommands();
const stateChangingCommands = commands.filter(
  (command) => command.id !== "select-all",
);

type InputTransport = "pointer" | "touch" | "keyboard" | "accessible-control";
const transports: readonly InputTransport[] = [
  "pointer",
  "touch",
  "keyboard",
  "accessible-control",
];

function createObject(): FabricObjectLike {
  let object: FabricObjectLike;
  object = {
    left: 100,
    top: 100,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    data: { id: "object-1" },
    set: (properties) => Object.assign(object, properties),
    setCoords: () => {},
    clone: async () => createObject(),
    getScaledWidth: () => 50 * (object.scaleX ?? 1),
    getScaledHeight: () => 40 * (object.scaleY ?? 1),
  };
  return object;
}

function createCanvas(): FabricCanvasLike {
  const objects: FabricObjectLike[] = [createObject()];
  let activeObject: FabricObjectLike | null = objects[0] ?? null;
  let zoom = 1;
  let viewportTransform = [1, 0, 0, 1, 0, 0];

  return {
    getActiveObject: () => activeObject,
    getActiveObjects: () => (activeObject ? [activeObject] : []),
    setActiveObject: (object) => {
      activeObject = object;
    },
    discardActiveObject: () => {
      activeObject = null;
    },
    getObjects: () => objects,
    add: (object) => {
      objects.push(object);
    },
    remove: (object) => {
      const index = objects.indexOf(object);
      if (index >= 0) objects.splice(index, 1);
    },
    requestRenderAll: () => {},
    fire: () => {},
    getZoom: () => zoom,
    getWidth: () => 800,
    getHeight: () => 600,
    zoomToPoint: (_point, nextZoom) => {
      zoom = nextZoom;
    },
    setViewportTransform: (nextTransform) => {
      viewportTransform = [...nextTransform];
    },
    get viewportTransform() {
      return viewportTransform;
    },
    set viewportTransform(nextTransform: number[]) {
      viewportTransform = nextTransform;
    },
  };
}

function createContext(canvas: FabricCanvasLike): PlannerCommandContext {
  return {
    fabricCanvas: canvas,
    showToast: () => {},
    refreshLayers: () => {},
    bumpSceneVersion: () => {},
    markUnsaved: () => {},
  };
}

function boundCommandId(
  commandId: string,
  transport: InputTransport,
): string | null {
  const descriptor = findCommand(commands, commandId);
  if (!descriptor) return null;
  switch (transport) {
    case "pointer":
      return descriptor.pointerBinding ? descriptor.id : null;
    case "touch":
      return descriptor.touchBinding ? descriptor.id : null;
    case "keyboard":
      return descriptor.keyboardBinding ? descriptor.id : null;
    case "accessible-control":
      return descriptor.accessibleControlId ? descriptor.id : null;
  }
}

async function executeThroughTransport(
  commandId: string,
  transport: InputTransport,
): Promise<{
  readonly success: boolean;
  readonly objectCount: number;
  readonly activeObject: boolean;
  readonly left: number | undefined;
  readonly top: number | undefined;
  readonly angle: number | undefined;
  readonly scaleX: number | undefined;
  readonly scaleY: number | undefined;
  readonly zoom: number;
  readonly viewportTransform: readonly number[];
}> {
  const resolvedId = boundCommandId(commandId, transport);
  if (!resolvedId) throw new Error(`No ${transport} binding for ${commandId}`);
  const canvas = createCanvas();
  const result = await executeCommand(commands, resolvedId, createContext(canvas));
  const active = canvas.getActiveObject();
  return {
    success: result.success,
    objectCount: canvas.getObjects().length,
    activeObject: active !== null,
    left: active?.left,
    top: active?.top,
    angle: active?.angle,
    scaleX: active?.scaleX,
    scaleY: active?.scaleY,
    zoom: canvas.getZoom(),
    viewportTransform: [...canvas.viewportTransform],
  };
}

describe("Feature: planner-comprehensive-audit, Property 11: Input-command parity", () => {
  it("maps pointer, touch, keyboard, and accessible controls to the same semantic command with equivalent outcomes", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...stateChangingCommands.map((command) => command.id)),
        fc.constantFrom(...transports),
        async (commandId, transport) => {
          const descriptor = findCommand(commands, commandId);
          if (!descriptor) throw new Error(`Unknown command ${commandId}`);

          expect(boundCommandId(commandId, transport)).toBe(commandId);
          const viaPointer = await executeThroughTransport(commandId, "pointer");
          const viaTransport = await executeThroughTransport(commandId, transport);
          expect(viaTransport).toEqual(viaPointer);
        },
      ),
      { numRuns: PROPERTY_RUNS, seed: 11_202_608, endOnFailure: true },
    );
  });

  it("declares explicit visible alternatives for every multi-pointer zoom or pan outcome", () => {
    const viewportCommandIds = [
      "zoom-in",
      "zoom-out",
      "pan-left",
      "pan-right",
      "pan-up",
      "pan-down",
    ];
    fc.assert(
      fc.property(fc.constantFrom(...viewportCommandIds), (commandId) => {
        const descriptor = findCommand(commands, commandId);
        if (!descriptor) throw new Error(`Unknown command ${commandId}`);
        expect(descriptor.touchBinding?.trim()).not.toBe("");
        expect(descriptor.accessibleControlId?.trim()).not.toBe("");
        expect(descriptor.keyboardBinding?.trim()).not.toBe("");
      }),
      { numRuns: PROPERTY_RUNS, seed: 11_202_609, endOnFailure: true },
    );
  });
});

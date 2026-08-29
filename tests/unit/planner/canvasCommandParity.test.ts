// @vitest-environment node
//
// Task 3.10: Canvas command input parity
//
// Validates that every state-changing canvas action is represented as a
// semantic command with documented pointer, touch, keyboard, and accessible
// control bindings. Requirements 7.1–7.4, 7.7.

import { describe, expect, it } from "vitest";
import {
  buildCanvasCommands,
  findCommand,
  executeCommand,
  filterCanvasCommands,
  getKeyboardBindings,
  getAccessibleControls,
  createDeleteCommand,
  createDuplicateCommand,
  createRotateCommand,
  createMoveCommand,
  createResizeCommand,
  createZoomInCommand,
  createZoomOutCommand,
  createPanCommand,
  createSelectAllCommand,
  type FabricCanvasLike,
  type FabricObjectLike,
  type PlannerCommandContext,
  type PlannerCommandDescriptor,
} from "@planner/lib/commands/canvasCommands";

import {
  createCanvasActions,
  type CanvasActionCallbacks,
} from "@planner/lib/commands/useCanvasActions";

import {
  buildPaletteCommands,
  descriptorToPaletteCommand,
  filterCommands,
} from "@planner/lib/commands/registry";

// ── Test helpers ─────────────────────────────────────────────────────────

function makeFakeObject(overrides: Partial<FabricObjectLike> = {}): FabricObjectLike {
  return {
    left: 100,
    top: 100,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    data: {},
    set: () => {},
    setCoords: () => {},
    clone: async () => makeFakeObject(),
    getScaledWidth: () => 50,
    getScaledHeight: () => 50,
    ...overrides,
  };
}

function makeFakeCanvas(objects: FabricObjectLike[] = []): FabricCanvasLike {
  let activeObj: FabricObjectLike | null = objects[0] ?? null;
  return {
    getActiveObject: () => activeObj,
    getActiveObjects: () => (activeObj ? [activeObj] : []),
    setActiveObject: (obj) => { activeObj = obj; },
    discardActiveObject: () => { activeObj = null; },
    getObjects: () => objects,
    add: (obj) => { objects.push(obj); },
    remove: (obj) => {
      const idx = objects.indexOf(obj);
      if (idx >= 0) objects.splice(idx, 1);
    },
    requestRenderAll: () => {},
    fire: () => {},
    getZoom: () => 1,
    getWidth: () => 800,
    getHeight: () => 600,
    zoomToPoint: () => {},
    setViewportTransform: () => {},
    viewportTransform: [1, 0, 0, 1, 0, 0],
  };
}

function makeContext(canvas?: FabricCanvasLike): PlannerCommandContext {
  return {
    fabricCanvas: canvas ?? null,
    showToast: () => {},
    refreshLayers: () => {},
    bumpSceneVersion: () => {},
    markUnsaved: () => {},
  };
}

// ── Required command ids per Requirements 7.1–7.4, 7.7 ──────────────────

const REQUIRED_COMMAND_IDS = [
  // Selection
  "select-all",
  // Object mutation
  "delete",
  "duplicate",
  "rotate",
  // Nudge (move)
  "move-left",
  "move-right",
  "move-up",
  "move-down",
  // Resize
  "resize-width-grow",
  "resize-width-shrink",
  "resize-height-grow",
  "resize-height-shrink",
  // Viewport
  "zoom-in",
  "zoom-out",
  "pan-left",
  "pan-right",
  "pan-up",
  "pan-down",
];

// ── Tests ────────────────────────────────────────────────────────────────

describe("Canvas command registry — completeness", () => {
  const commands = buildCanvasCommands();

  it("registers every required command id", () => {
    const ids = new Set(commands.map((c) => c.id));
    for (const requiredId of REQUIRED_COMMAND_IDS) {
      expect(ids.has(requiredId), `Missing command: ${requiredId}`).toBe(true);
    }
  });

  it("each command has a unique id", () => {
    const ids = commands.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every command has a human-readable label", () => {
    for (const cmd of commands) {
      expect(cmd.label.length, `${cmd.id} needs a label`).toBeGreaterThan(0);
    }
  });
});

describe("Canvas command input parity — Req 7.1–7.4, 7.7", () => {
  const commands = buildCanvasCommands();

  it("every command has a keyboard binding", () => {
    for (const cmd of commands) {
      expect(
        cmd.keyboardBinding,
        `${cmd.id} must have a keyboard binding (Req 7.2, 7.3)`,
      ).toBeTruthy();
    }
  });

  it("every command has a pointer binding", () => {
    for (const cmd of commands) {
      expect(
        cmd.pointerBinding,
        `${cmd.id} must have a pointer binding (Req 7.1)`,
      ).toBeTruthy();
    }
  });

  it("every command has a touch binding", () => {
    for (const cmd of commands) {
      expect(
        cmd.touchBinding,
        `${cmd.id} must have a touch binding (Req 7.2)`,
      ).toBeTruthy();
    }
  });

  it("zoom and pan have explicit button alternatives for multi-pointer gestures (Req 7.7)", () => {
    const zoomPanIds = [
      "zoom-in",
      "zoom-out",
      "pan-left",
      "pan-right",
      "pan-up",
      "pan-down",
    ];
    for (const id of zoomPanIds) {
      const cmd = findCommand(commands, id);
      expect(cmd, `command ${id} must exist`).toBeDefined();
      expect(
        cmd!.accessibleControlId,
        `${id} must have an accessible control id (Req 7.7)`,
      ).toBeTruthy();
    }
  });

  it("object-mutation commands have accessible control ids", () => {
    const mutationIds = ["delete", "duplicate", "rotate"];
    for (const id of mutationIds) {
      const cmd = findCommand(commands, id);
      expect(cmd, `command ${id} must exist`).toBeDefined();
      expect(
        cmd!.accessibleControlId,
        `${id} must have an accessible control id`,
      ).toBeTruthy();
    }
  });
});

describe("Canvas command execution", () => {
  it("delete removes active objects and marks unsaved", async () => {
    const obj = makeFakeObject();
    const canvas = makeFakeCanvas([obj]);
    let unsavedCalled = false;
    const ctx = {
      ...makeContext(canvas),
      markUnsaved: () => { unsavedCalled = true; },
    };
    const cmd = createDeleteCommand();
    const result = await cmd.execute(ctx);
    expect(result.success).toBe(true);
    expect(canvas.getObjects()).toHaveLength(0);
    expect(unsavedCalled).toBe(true);
  });

  it("delete returns failure when no selection", async () => {
    const canvas = makeFakeCanvas([]);
    const ctx = makeContext(canvas);
    const cmd = createDeleteCommand();
    const result = await cmd.execute(ctx);
    expect(result.success).toBe(false);
  });

  it("rotate modifies angle of active object", async () => {
    let currentAngle = 0;
    const obj = makeFakeObject({
      angle: 0,
      set: (props: Record<string, unknown>) => {
        if (props.angle !== undefined) currentAngle = props.angle as number;
      },
      setCoords: () => {},
    });
    const canvas = makeFakeCanvas([obj]);
    const ctx = makeContext(canvas);
    const cmd = createRotateCommand(90);
    const result = await cmd.execute(ctx);
    expect(result.success).toBe(true);
    expect(currentAngle).toBe(90);
  });

  it("move-left shifts the active object leftward", async () => {
    let currentLeft = 100;
    const obj = makeFakeObject({
      left: 100,
      set: (props: Record<string, unknown>) => {
        if (props.left !== undefined) currentLeft = props.left as number;
      },
      setCoords: () => {},
    });
    const canvas = makeFakeCanvas([obj]);
    const ctx = makeContext(canvas);
    const cmd = createMoveCommand("left", 1);
    const result = await cmd.execute(ctx);
    expect(result.success).toBe(true);
    expect(currentLeft).toBe(99);
  });

  it("zoom-in increases zoom level", async () => {
    let zoomLevel = 1;
    const canvas = makeFakeCanvas();
    canvas.getZoom = () => zoomLevel;
    canvas.zoomToPoint = (_point, z) => { zoomLevel = z; };
    const ctx = makeContext(canvas);
    const cmd = createZoomInCommand();
    const result = await cmd.execute(ctx);
    expect(result.success).toBe(true);
    expect(zoomLevel).toBeGreaterThan(1);
  });

  it("zoom-out decreases zoom level", async () => {
    let zoomLevel = 1;
    const canvas = makeFakeCanvas();
    canvas.getZoom = () => zoomLevel;
    canvas.zoomToPoint = (_point, z) => { zoomLevel = z; };
    const ctx = makeContext(canvas);
    const cmd = createZoomOutCommand();
    const result = await cmd.execute(ctx);
    expect(result.success).toBe(true);
    expect(zoomLevel).toBeLessThan(1);
  });

  it("pan-right shifts the viewport transform", async () => {
    const vpt = [1, 0, 0, 1, 0, 0];
    const canvas = makeFakeCanvas();
    canvas.viewportTransform = [...vpt];
    canvas.setViewportTransform = (newVpt) => {
      canvas.viewportTransform = newVpt;
    };
    const ctx = makeContext(canvas);
    const cmd = createPanCommand("right", 50);
    const result = await cmd.execute(ctx);
    expect(result.success).toBe(true);
    // Pan right = negative x shift in the viewport transform
    expect(canvas.viewportTransform[4]).toBe(-50);
  });

  it("commands return failure when canvas is null", async () => {
    const ctx = makeContext(null);
    const result = await executeCommand(buildCanvasCommands(), "delete", ctx);
    expect(result.success).toBe(false);
  });
});

describe("createCanvasActions — callback factory", () => {
  it("returns callbacks for all required actions", () => {
    const actions = createCanvasActions({
      fabricCanvas: null,
      showToast: () => {},
      refreshLayers: () => {},
      bumpSceneVersion: () => {},
      markUnsaved: () => {},
    });

    // Verify every required callback exists
    expect(typeof actions.deleteSelected).toBe("function");
    expect(typeof actions.duplicateSelected).toBe("function");
    expect(typeof actions.rotate90).toBe("function");
    expect(typeof actions.selectAll).toBe("function");
    expect(typeof actions.zoomIn).toBe("function");
    expect(typeof actions.zoomOut).toBe("function");
    expect(typeof actions.panLeft).toBe("function");
    expect(typeof actions.panRight).toBe("function");
    expect(typeof actions.panUp).toBe("function");
    expect(typeof actions.panDown).toBe("function");
    expect(typeof actions.moveLeft).toBe("function");
    expect(typeof actions.moveRight).toBe("function");
    expect(typeof actions.moveUp).toBe("function");
    expect(typeof actions.moveDown).toBe("function");
  });

  it("exposes the command descriptors and context for palette integration", () => {
    const actions = createCanvasActions({
      fabricCanvas: null,
      showToast: () => {},
      refreshLayers: () => {},
      bumpSceneVersion: () => {},
      markUnsaved: () => {},
    });

    expect(actions.commands.length).toBeGreaterThan(0);
    expect(actions.commandContext).toBeDefined();
    expect(actions.commandContext.fabricCanvas).toBeNull();
  });
});

describe("Command palette integration", () => {
  it("canvas commands are merged into the palette when commandContext is provided", () => {
    const actions = createCanvasActions({
      fabricCanvas: null,
      showToast: () => {},
      refreshLayers: () => {},
      bumpSceneVersion: () => {},
      markUnsaved: () => {},
    });

    const paletteCommands = buildPaletteCommands({
      setTool: () => {},
      commandContext: actions.commandContext,
    });

    // The palette should include both base tool commands and canvas commands
    const ids = paletteCommands.map((c) => c.id);
    expect(ids).toContain("tool-select");
    // Canvas commands should be present
    expect(ids).toContain("delete");
    expect(ids).toContain("duplicate");
    expect(ids).toContain("zoom-in");
    expect(ids).toContain("zoom-out");
    expect(ids).toContain("pan-left");
  });

  it("descriptorToPaletteCommand binds execute to a run() callable", () => {
    const descriptor = createDeleteCommand();
    const ctx = makeContext(null);
    const palCmd = descriptorToPaletteCommand(descriptor, ctx);

    expect(palCmd.id).toBe("delete");
    expect(palCmd.label).toBe("Delete");
    expect(typeof palCmd.run).toBe("function");
  });

  it("filterCanvasCommands returns matching commands by label/id/keyword", () => {
    const commands = buildCanvasCommands();
    const zoom = filterCanvasCommands(commands, "zoom");
    expect(zoom.length).toBeGreaterThanOrEqual(2);
    expect(zoom.every((c) => c.id.includes("zoom") || c.label.toLowerCase().includes("zoom"))).toBe(true);
  });

  it("filterCommands on palette returns matching results", () => {
    const commands = buildPaletteCommands({ setTool: () => {} });
    const results = filterCommands(commands, "select");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((c) => c.id === "tool-select")).toBe(true);
  });
});

describe("Keyboard and accessible control coverage", () => {
  it("getKeyboardBindings returns all commands with keyboard bindings", () => {
    const commands = buildCanvasCommands();
    const bindings = getKeyboardBindings(commands);
    expect(bindings.length).toBe(commands.filter((c) => c.keyboardBinding).length);
    for (const b of bindings) {
      expect(b.binding.length).toBeGreaterThan(0);
    }
  });

  it("getAccessibleControls returns all commands with accessible control ids", () => {
    const commands = buildCanvasCommands();
    const controls = getAccessibleControls(commands);
    expect(controls.length).toBe(commands.filter((c) => c.accessibleControlId).length);
    for (const ctrl of controls) {
      expect(ctrl.controlId.length).toBeGreaterThan(0);
    }
  });
});

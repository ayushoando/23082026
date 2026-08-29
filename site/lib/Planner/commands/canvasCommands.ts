/**
 * Planner-owned semantic canvas commands.
 *
 * All keyboard, palette, visible-control, wheel, and pan entry points resolve
 * through this module; it deliberately has no Studio dependency.
 */

export interface PlannerCommandResult {
  /** Whether the command executed successfully. */
  success: boolean;
  /** Optional human-readable message (used for toasts). */
  message?: string;
}

/** Context passed to every command's execute function. */
export interface PlannerCommandContext {
  /** Reference to the Fabric canvas instance. */
  fabricCanvas: FabricCanvasLike | null;
  /** Callback to show a user-visible toast. */
  showToast: (message: string, variant?: string) => void;
  /** Callback to refresh the layer panel. */
  refreshLayers: () => void;
  /** Callback to bump scene version for reactivity. */
  bumpSceneVersion: () => void;
  /** Mark the document as having unsaved changes. */
  markUnsaved: () => void;
  /** Planner's true multi-selection implementation, supplied by the UI. */
  selectAll?: () => void;
  /** Synchronize React viewport state after a semantic viewport command. */
  onViewportChanged?: (zoom: number) => void;
}

/**
 * Minimal Fabric Canvas interface consumed by commands. We avoid importing
 * the full Fabric types so commands stay unit-testable.
 */
export interface FabricCanvasLike {
  getActiveObject(): FabricObjectLike | null;
  getActiveObjects(): FabricObjectLike[];
  setActiveObject(obj: FabricObjectLike): void;
  discardActiveObject(): void;
  getObjects(): FabricObjectLike[];
  add(obj: FabricObjectLike): void;
  remove(obj: FabricObjectLike): void;
  requestRenderAll(): void;
  fire(event: string, data?: Record<string, unknown>): void;
  getZoom(): number;
  getWidth(): number;
  getHeight(): number;
  zoomToPoint(point: { x: number; y: number }, zoom: number): void;
  setViewportTransform(vpt: number[]): void;
  viewportTransform: number[];
}

export interface FabricObjectLike {
  left?: number;
  top?: number;
  angle?: number;
  scaleX?: number;
  scaleY?: number;
  data?: Record<string, unknown>;
  set(props: Record<string, unknown>): void;
  setCoords(): void;
  clone(properties?: string[]): Promise<FabricObjectLike>;
  getScaledWidth(): number;
  getScaledHeight(): number;
}

/** Absolute viewport outcomes produced by wheel, drag, keyboard, or controls. */
export type PlannerViewportCommand =
  | {
      readonly type: "zoom";
      readonly zoom: number;
      readonly origin: { readonly x: number; readonly y: number };
    }
  | {
      readonly type: "pan";
      readonly viewportTransform: readonly number[];
    };

/**
 * Canonical Planner viewport mutation. It accepts the resulting viewport,
 * rather than a device-specific delta, so wheel, pinch alternatives, keyboard,
 * and visible controls can converge without importing browser event types.
 */
export function applyPlannerViewportCommand(
  canvas: FabricCanvasLike | null,
  command: PlannerViewportCommand,
): PlannerCommandResult {
  if (!canvas) return { success: false, message: "Canvas not ready" };
  if (command.type === "zoom") {
    const zoom = Math.max(0.1, Math.min(8, command.zoom));
    canvas.zoomToPoint(command.origin, zoom);
    return { success: true };
  }
  if (command.viewportTransform.length !== 6) {
    return { success: false, message: "Invalid viewport transform" };
  }
  canvas.setViewportTransform([...command.viewportTransform]);
  return { success: true };
}

/**
 * Descriptor for a Planner semantic command. Each command has a unique id,
 * a human label, an execute function, and documented bindings for pointer,
 * touch, keyboard, and accessible controls.
 */
export interface PlannerCommandDescriptor {
  /** Unique stable command identifier. */
  id: string;
  /** Human-readable label (used in command palette, tooltips, ARIA). */
  label: string;
  /** Optional search keywords for the command palette. */
  keywords?: string[];
  /** Execute the command against the current canvas context. */
  execute(context: PlannerCommandContext): PlannerCommandResult | Promise<PlannerCommandResult>;
  /** Pointer/mouse binding description (e.g. "click", "drag"). */
  pointerBinding?: string;
  /** Touch gesture binding description (e.g. "tap", "two-finger pinch"). */
  touchBinding?: string;
  /** Keyboard shortcut binding (e.g. "Delete", "Ctrl+D"). */
  keyboardBinding?: string;
  /** Test id of the visible accessible control that triggers this command. */
  accessibleControlId?: string;
  /** Whether this command requires an active selection. */
  requiresSelection?: boolean;
}

// ---------------------------------------------------------------------------
// Command implementations
// ---------------------------------------------------------------------------

export function createSelectAllCommand(): PlannerCommandDescriptor {
  return {
    id: "select-all",
    label: "Select all",
    keywords: ["select", "all"],
    keyboardBinding: "Ctrl+A",
    accessibleControlId: "cmd-select-all",
    pointerBinding: "command palette or selection menu",
    touchBinding: "command palette or selection menu",
    execute(ctx) {
      const canvas = ctx.fabricCanvas;
      if (!canvas) return { success: false, message: "Canvas not ready" };
      if (ctx.selectAll) {
        ctx.selectAll();
        return { success: true };
      }
      const objects = canvas.getObjects().filter(
        (object) =>
          !object.data?.isGridLine &&
          !object.data?.isSheet &&
          !object.data?.isGuide,
      );
      if (!objects.length) return { success: false, message: "Nothing to select" };
      canvas.setActiveObject(objects[0]);
      canvas.requestRenderAll();
      return { success: true };
    },
  };
}

export function createDeleteCommand(): PlannerCommandDescriptor {
  return {
    id: "delete",
    label: "Delete",
    keywords: ["delete", "remove", "trash"],
    keyboardBinding: "Delete",
    accessibleControlId: "ctx-delete",
    pointerBinding: "context menu → Delete",
    touchBinding: "context menu → Delete",
    requiresSelection: true,
    execute(ctx) {
      const canvas = ctx.fabricCanvas;
      if (!canvas) return { success: false, message: "Canvas not ready" };
      const active = canvas.getActiveObjects();
      if (!active.length) return { success: false, message: "No selection" };
      for (const object of active) canvas.remove(object);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      ctx.refreshLayers();
      ctx.bumpSceneVersion();
      ctx.markUnsaved();
      return { success: true, message: `Deleted ${active.length} object(s)` };
    },
  };
}

export function createDuplicateCommand(): PlannerCommandDescriptor {
  return {
    id: "duplicate",
    label: "Duplicate",
    keywords: ["duplicate", "clone", "copy"],
    keyboardBinding: "Ctrl+D",
    accessibleControlId: "ctx-duplicate",
    pointerBinding: "context menu → Duplicate",
    touchBinding: "context menu → Duplicate",
    requiresSelection: true,
    async execute(ctx) {
      const canvas = ctx.fabricCanvas;
      if (!canvas) return { success: false, message: "Canvas not ready" };
      const active = canvas.getActiveObject();
      if (!active) return { success: false, message: "No selection" };
      const cloned = await active.clone(["data"]);
      cloned.set({ left: (active.left ?? 0) + 20, top: (active.top ?? 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      ctx.refreshLayers();
      ctx.bumpSceneVersion();
      ctx.markUnsaved();
      return { success: true, message: "Duplicated" };
    },
  };
}

export function createRotateCommand(angleDeg: number = 90): PlannerCommandDescriptor {
  return {
    id: "rotate",
    label: `Rotate ${angleDeg}°`,
    keywords: ["rotate", "turn"],
    keyboardBinding: "R (when selected)",
    accessibleControlId: "ctx-rotate90",
    pointerBinding: "context menu → Rotate 90°",
    touchBinding: "context menu → Rotate 90°",
    requiresSelection: true,
    execute(ctx) {
      const canvas = ctx.fabricCanvas;
      if (!canvas) return { success: false, message: "Canvas not ready" };
      const active = canvas.getActiveObject();
      if (!active) return { success: false, message: "No selection" };
      active.set({ angle: (active.angle ?? 0) + angleDeg });
      active.setCoords();
      canvas.fire("object:modified", { target: active });
      canvas.requestRenderAll();
      ctx.bumpSceneVersion();
      ctx.markUnsaved();
      return { success: true, message: `Rotated ${angleDeg}°` };
    },
  };
}

export function createMoveCommand(
  direction: "left" | "right" | "up" | "down",
  stepPx: number = 1,
): PlannerCommandDescriptor {
  const deltas: Record<string, { dx: number; dy: number }> = {
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
  };
  const delta = deltas[direction];
  const arrowKey = `Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`;

  return {
    id: `move-${direction}`,
    label: `Move ${direction}`,
    keywords: ["move", "nudge", direction],
    keyboardBinding: arrowKey,
    pointerBinding: "drag",
    touchBinding: "drag",
    accessibleControlId: `cmd-move-${direction}`,
    requiresSelection: true,
    execute(ctx) {
      const canvas = ctx.fabricCanvas;
      if (!canvas) return { success: false, message: "Canvas not ready" };
      const active = canvas.getActiveObject();
      if (!active) return { success: false, message: "No selection" };
      active.set({
        left: (active.left ?? 0) + delta.dx * stepPx,
        top: (active.top ?? 0) + delta.dy * stepPx,
      });
      active.setCoords();
      canvas.fire("object:modified", { target: active });
      canvas.requestRenderAll();
      ctx.bumpSceneVersion();
      ctx.markUnsaved();
      return { success: true };
    },
  };
}

export function createResizeCommand(
  dimension: "width" | "height",
  delta: number,
): PlannerCommandDescriptor {
  const action = delta > 0 ? "grow" : "shrink";
  return {
    id: `resize-${dimension}-${action}`,
    label: `Resize ${dimension} ${delta > 0 ? "larger" : "smaller"}`,
    keywords: ["resize", "scale", dimension],
    keyboardBinding:
      dimension === "width"
        ? delta > 0
          ? "Shift+ArrowRight"
          : "Shift+ArrowLeft"
        : delta > 0
          ? "Shift+ArrowDown"
          : "Shift+ArrowUp",
    pointerBinding: "corner handle drag",
    touchBinding: "corner handle drag",
    accessibleControlId: `cmd-resize-${dimension}-${action}`,
    requiresSelection: true,
    execute(ctx) {
      const canvas = ctx.fabricCanvas;
      if (!canvas) return { success: false, message: "Canvas not ready" };
      const active = canvas.getActiveObject();
      if (!active) return { success: false, message: "No selection" };
      const currentWidth = active.getScaledWidth();
      const currentHeight = active.getScaledHeight();
      if (dimension === "width") {
        const nextWidth = Math.max(1, currentWidth + delta);
        active.set({ scaleX: (active.scaleX ?? 1) * (nextWidth / currentWidth) });
      } else {
        const nextHeight = Math.max(1, currentHeight + delta);
        active.set({ scaleY: (active.scaleY ?? 1) * (nextHeight / currentHeight) });
      }
      active.setCoords();
      canvas.fire("object:modified", { target: active });
      canvas.requestRenderAll();
      ctx.bumpSceneVersion();
      ctx.markUnsaved();
      return { success: true };
    },
  };
}

export function createZoomInCommand(): PlannerCommandDescriptor {
  return {
    id: "zoom-in",
    label: "Zoom in",
    keywords: ["zoom", "in", "magnify"],
    keyboardBinding: "+",
    accessibleControlId: "vp-zoom-in",
    pointerBinding: "Ctrl+scroll up",
    touchBinding: "two-finger pinch out",
    execute(ctx) {
      const canvas = ctx.fabricCanvas;
      if (!canvas) return { success: false, message: "Canvas not ready" };
      const zoom = Math.min(8, canvas.getZoom() * 1.2);
      const result = applyPlannerViewportCommand(canvas, {
        type: "zoom",
        zoom,
        origin: { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 },
      });
      if (result.success) ctx.onViewportChanged?.(zoom);
      return result;
    },
  };
}

export function createZoomOutCommand(): PlannerCommandDescriptor {
  return {
    id: "zoom-out",
    label: "Zoom out",
    keywords: ["zoom", "out", "shrink"],
    keyboardBinding: "-",
    accessibleControlId: "vp-zoom-out",
    pointerBinding: "Ctrl+scroll down",
    touchBinding: "two-finger pinch in",
    execute(ctx) {
      const canvas = ctx.fabricCanvas;
      if (!canvas) return { success: false, message: "Canvas not ready" };
      const zoom = Math.max(0.1, canvas.getZoom() / 1.2);
      const result = applyPlannerViewportCommand(canvas, {
        type: "zoom",
        zoom,
        origin: { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 },
      });
      if (result.success) ctx.onViewportChanged?.(zoom);
      return result;
    },
  };
}

export function createPanCommand(
  direction: "left" | "right" | "up" | "down",
  stepPx: number = 50,
): PlannerCommandDescriptor {
  const deltas: Record<string, { dx: number; dy: number }> = {
    left: { dx: 1, dy: 0 },
    right: { dx: -1, dy: 0 },
    up: { dx: 0, dy: 1 },
    down: { dx: 0, dy: -1 },
  };
  const delta = deltas[direction];

  return {
    id: `pan-${direction}`,
    label: `Pan ${direction}`,
    keywords: ["pan", "scroll", direction],
    keyboardBinding: `H then Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
    pointerBinding: "middle-mouse drag / scroll wheel",
    touchBinding: "two-finger drag",
    accessibleControlId: `vp-pan-${direction}`,
    execute(ctx) {
      const canvas = ctx.fabricCanvas;
      if (!canvas) return { success: false, message: "Canvas not ready" };
      const viewportTransform = [...canvas.viewportTransform];
      viewportTransform[4] += delta.dx * stepPx;
      viewportTransform[5] += delta.dy * stepPx;
      const result = applyPlannerViewportCommand(canvas, {
        type: "pan",
        viewportTransform,
      });
      if (result.success) ctx.onViewportChanged?.(canvas.getZoom());
      return result;
    },
  };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** Build the complete set of Planner semantic canvas commands. */
export function buildCanvasCommands(): PlannerCommandDescriptor[] {
  return [
    createSelectAllCommand(),
    createDeleteCommand(),
    createDuplicateCommand(),
    createRotateCommand(90),
    createMoveCommand("left"),
    createMoveCommand("right"),
    createMoveCommand("up"),
    createMoveCommand("down"),
    createResizeCommand("width", 5),
    createResizeCommand("width", -5),
    createResizeCommand("height", 5),
    createResizeCommand("height", -5),
    createZoomInCommand(),
    createZoomOutCommand(),
    createPanCommand("left"),
    createPanCommand("right"),
    createPanCommand("up"),
    createPanCommand("down"),
  ];
}

/** Look up a command by id from a command array. */
export function findCommand(
  commands: readonly PlannerCommandDescriptor[],
  id: string,
): PlannerCommandDescriptor | undefined {
  return commands.find((command) => command.id === id);
}

/** Execute a command by id. Returns the result or a failure if not found. */
export async function executeCommand(
  commands: readonly PlannerCommandDescriptor[],
  id: string,
  context: PlannerCommandContext,
): Promise<PlannerCommandResult> {
  const command = findCommand(commands, id);
  if (!command) return { success: false, message: `Command "${id}" not found` };
  return command.execute(context);
}

/** Filter semantic canvas commands for command-palette discovery. */
export function filterCanvasCommands(
  commands: readonly PlannerCommandDescriptor[],
  query: string,
): PlannerCommandDescriptor[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...commands];
  return commands.filter((command) =>
    command.label.toLowerCase().includes(normalizedQuery) ||
    command.id.toLowerCase().includes(normalizedQuery) ||
    (command.keywords ?? []).some((keyword) =>
      keyword.toLowerCase().includes(normalizedQuery),
    ),
  );
}

/** Get every command with a documented keyboard binding. */
export function getKeyboardBindings(
  commands: readonly PlannerCommandDescriptor[],
): Array<{ id: string; label: string; binding: string }> {
  return commands
    .filter((command) => command.keyboardBinding)
    .map((command) => ({
      id: command.id,
      label: command.label,
      binding: command.keyboardBinding!,
    }));
}

/** Get every command with a visible accessible-control binding. */
export function getAccessibleControls(
  commands: readonly PlannerCommandDescriptor[],
): Array<{ id: string; label: string; controlId: string }> {
  return commands
    .filter((command) => command.accessibleControlId)
    .map((command) => ({
      id: command.id,
      label: command.label,
      controlId: command.accessibleControlId!,
    }));
}

/**
 * useCanvasActions — binds semantic canvas commands to Planner callbacks.
 *
 * This module provides a factory that creates action callbacks from the
 * PlannerCommandDescriptor registry. Every state-changing canvas action
 * (select, move, rotate, resize, duplicate, delete, zoom, pan) passes
 * through the semantic command layer so pointer, touch, keyboard, and
 * accessible controls invoke the same logic.
 *
 * Requirements 7.1–7.4, 7.7.
 */

import {
  buildCanvasCommands,
  executeCommand,
  type FabricCanvasLike,
  type PlannerCommandContext,
  type PlannerCommandDescriptor,
} from "./canvasCommands";

export interface CanvasActionCallbacks {
  /** Delete selected objects (keyboard Delete, context menu, button). */
  deleteSelected: () => void;
  /** Duplicate active object (Ctrl+D, context menu, button). */
  duplicateSelected: () => Promise<void>;
  /** Rotate active object 90° (context menu, button). */
  rotate90: () => void;
  /** Select all non-decoration objects (Ctrl+A). */
  selectAll: () => void;
  /** Zoom in (+ key, button, pinch-out). */
  zoomIn: () => void;
  /** Zoom out (- key, button, pinch-in). */
  zoomOut: () => void;
  /** Pan canvas in a direction (scroll, two-finger drag, keyboard). */
  panLeft: () => void;
  panRight: () => void;
  panUp: () => void;
  panDown: () => void;
  /** Move selected object by one step (arrow keys). */
  moveLeft: () => void;
  moveRight: () => void;
  moveUp: () => void;
  moveDown: () => void;
  /** All registered canvas command descriptors for palette integration. */
  commands: PlannerCommandDescriptor[];
  /** The shared command context (useful for palette command binding). */
  commandContext: PlannerCommandContext;
}

export interface CanvasActionDeps {
  fabricCanvas: FabricCanvasLike | null;
  showToast: (message: string, variant?: string) => void;
  refreshLayers: () => void;
  bumpSceneVersion: () => void;
  markUnsaved: () => void;
  /** Synchronise React zoom state after a viewport command (optional). */
  onViewportChanged?: (zoom: number) => void;
}

/**
 * Create canvas action callbacks bound to the semantic command registry.
 * This is intentionally a plain factory (not a React hook) so it can be
 * called from both React components and unit tests.
 */
export function createCanvasActions(deps: CanvasActionDeps): CanvasActionCallbacks {
  const ctx: PlannerCommandContext = {
    fabricCanvas: deps.fabricCanvas,
    showToast: deps.showToast,
    refreshLayers: deps.refreshLayers,
    bumpSceneVersion: deps.bumpSceneVersion,
    markUnsaved: deps.markUnsaved,
    onViewportChanged: deps.onViewportChanged,
  };

  const commands = buildCanvasCommands();

  const exec = (id: string) => {
    void executeCommand(commands, id, ctx);
  };

  return {
    deleteSelected: () => exec("delete"),
    duplicateSelected: async () => {
      await executeCommand(commands, "duplicate", ctx);
    },
    rotate90: () => exec("rotate"),
    selectAll: () => exec("select-all"),
    zoomIn: () => exec("zoom-in"),
    zoomOut: () => exec("zoom-out"),
    panLeft: () => exec("pan-left"),
    panRight: () => exec("pan-right"),
    panUp: () => exec("pan-up"),
    panDown: () => exec("pan-down"),
    moveLeft: () => exec("move-left"),
    moveRight: () => exec("move-right"),
    moveUp: () => exec("move-up"),
    moveDown: () => exec("move-down"),
    commands,
    commandContext: ctx,
  };
}

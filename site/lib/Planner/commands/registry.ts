import {
  buildCanvasCommands,
  type PlannerCommandDescriptor,
  type PlannerCommandContext,
} from "./canvasCommands";

export type PlannerCommand = {
  id: string;
  label: string;
  keywords?: string[];
  run: () => void;
};

export function filterCommands(
  commands: readonly PlannerCommand[],
  query: string,
): PlannerCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...commands];
  return commands.filter((c) => {
    if (c.label.toLowerCase().includes(q)) return true;
    if (c.id.toLowerCase().includes(q)) return true;
    return (c.keywords ?? []).some((k) => k.toLowerCase().includes(q));
  });
}

/**
 * Adapt a PlannerCommandDescriptor to the PlannerCommand shape consumed by
 * the command palette. Each descriptor's `execute` is bound to the provided
 * context so the palette can call `run()` without context plumbing.
 */
export function descriptorToPaletteCommand(
  descriptor: PlannerCommandDescriptor,
  ctx: PlannerCommandContext,
): PlannerCommand {
  return {
    id: descriptor.id,
    label: descriptor.label,
    keywords: descriptor.keywords,
    run: () => {
      void descriptor.execute(ctx);
    },
  };
}

export function buildPaletteCommands(handlers: {
  setTool: (tool: string) => void;
  undo?: () => void;
  redo?: () => void;
  toggleSnap?: () => void;
  goReview?: () => void;
  exportPng?: () => void;
  /** When provided, canvas commands are included in the palette. */
  commandContext?: PlannerCommandContext;
}): PlannerCommand[] {
  const base: PlannerCommand[] = [
    { id: "tool-select", label: "Tool: Select", keywords: ["v"], run: () => handlers.setTool("select") },
    { id: "tool-pan", label: "Tool: Pan", keywords: ["h", "hand"], run: () => handlers.setTool("pan") },
    { id: "tool-wall", label: "Tool: Wall", keywords: ["w"], run: () => handlers.setTool("wall") },
    { id: "tool-door", label: "Tool: Door", keywords: ["door"], run: () => handlers.setTool("door") },
    { id: "tool-window", label: "Tool: Window", keywords: ["window"], run: () => handlers.setTool("window") },
    ...(handlers.undo
      ? [{ id: "undo", label: "Undo", keywords: ["undo"], run: handlers.undo }]
      : []),
    ...(handlers.redo
      ? [{ id: "redo", label: "Redo", keywords: ["redo"], run: handlers.redo }]
      : []),
    ...(handlers.toggleSnap
      ? [{ id: "toggle-snap", label: "Toggle snap", keywords: ["snap"], run: handlers.toggleSnap }]
      : []),
    ...(handlers.goReview
      ? [{ id: "go-review", label: "Go to Review", keywords: ["review", "boq"], run: handlers.goReview }]
      : []),
    ...(handlers.exportPng
      ? [{ id: "export-png", label: "Export PNG", keywords: ["export", "png"], run: handlers.exportPng }]
      : []),
  ];

  // Merge semantic canvas commands into the palette when a context is available
  if (handlers.commandContext) {
    const canvasDescriptors = buildCanvasCommands();
    const canvasEntries = canvasDescriptors.map((d) =>
      descriptorToPaletteCommand(d, handlers.commandContext!),
    );
    // Avoid duplicating ids already in the base list
    const baseIds = new Set(base.map((c) => c.id));
    for (const entry of canvasEntries) {
      if (!baseIds.has(entry.id)) {
        base.push(entry);
      }
    }
  }

  return base;
}

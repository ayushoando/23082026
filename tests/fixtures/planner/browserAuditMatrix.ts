export interface PlannerBrowserAuditProfile {
  readonly id: string;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly orientation: "landscape" | "portrait";
  readonly input: "pointer" | "touch" | "keyboard";
}

export const PLANNER_BROWSER_AUDIT_PROFILES = [
  { id: "desktop-landscape-pointer", viewport: { width: 1_440, height: 900 }, orientation: "landscape", input: "pointer" },
  { id: "tablet-portrait-keyboard", viewport: { width: 768, height: 1_024 }, orientation: "portrait", input: "keyboard" },
  { id: "phone-portrait-touch", viewport: { width: 390, height: 844 }, orientation: "portrait", input: "touch" },
] as const satisfies readonly PlannerBrowserAuditProfile[];

export const PLANNER_RENDERED_BEHAVIOR_REQUIREMENTS = [
  "desktop-tablet-phone-layout",
  "resize-orientation-context",
  "touch-keyboard-parity",
  "focus-entry-restoration",
  "dialogs",
  "200-percent-reflow",
  "reduced-motion",
  "contrast-visual-states",
  "offline-recovery",
  "conflict-recovery",
  "accessibility",
  "required-performance-profiles",
] as const;

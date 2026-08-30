export type PlannerBrowserProject =
  | "chromium-desktop"
  | "chromium-tablet"
  | "chromium-mobile"
  | "firefox-tablet"
  | "webkit-mobile";

export interface PlannerBrowserAuditProfile {
  readonly id: string;
  readonly project: PlannerBrowserProject;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly orientation: "landscape" | "portrait";
  readonly input: "pointer" | "touch" | "keyboard";
  readonly coverage: "required" | "extended";
}

export const PLANNER_BROWSER_AUDIT_PROFILES = [
  { id: "desktop-landscape-pointer", project: "chromium-desktop", viewport: { width: 1_440, height: 900 }, orientation: "landscape", input: "pointer", coverage: "required" },
  { id: "tablet-portrait-keyboard", project: "chromium-tablet", viewport: { width: 768, height: 1_024 }, orientation: "portrait", input: "keyboard", coverage: "required" },
  { id: "phone-portrait-touch", project: "chromium-mobile", viewport: { width: 390, height: 844 }, orientation: "portrait", input: "touch", coverage: "required" },
  { id: "firefox-tablet-keyboard", project: "firefox-tablet", viewport: { width: 768, height: 1_024 }, orientation: "portrait", input: "keyboard", coverage: "extended" },
  { id: "webkit-mobile-touch", project: "webkit-mobile", viewport: { width: 390, height: 844 }, orientation: "portrait", input: "touch", coverage: "extended" },
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

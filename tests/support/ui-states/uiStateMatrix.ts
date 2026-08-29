export const REQUIRED_UI_STATES = [
  "default",
  "loading",
  "empty",
  "error",
  "overflow",
  "keyboard-focus",
] as const;

export type RequiredUiState = (typeof REQUIRED_UI_STATES)[number];

export interface UiStateScenario {
  readonly state: RequiredUiState;
  readonly description: string;
}

export const UI_STATE_SCENARIOS = [
  { state: "default", description: "Populated steady state" },
  { state: "loading", description: "Pending content with stable geometry" },
  { state: "empty", description: "No user or catalog records" },
  { state: "error", description: "Recoverable error with an actionable message" },
  { state: "overflow", description: "Long labels and dense content remain contained" },
  { state: "keyboard-focus", description: "Keyboard order and visible focus treatment" },
] as const satisfies readonly UiStateScenario[];

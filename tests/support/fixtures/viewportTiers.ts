export interface ViewportTier {
  readonly name: "desktop" | "tablet" | "mobile";
  readonly width: number;
  readonly height: number;
}

export const VIEWPORT_TIERS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
] as const satisfies readonly ViewportTier[];

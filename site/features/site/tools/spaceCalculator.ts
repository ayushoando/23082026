/**
 * Phase 1 — Space calculators (A + F)
 * Pure-function engine: room dims → usable area (NBC norms) → seats by density.
 * No DOM, no Planner/Studio imports, no persistence — client-side math only.
 * Share one engine for both /tools/office-space-calculator and /tools/meeting-room-capacity-calculator.
 * NBC reference: National Building Code of India 2016 (Part 4 / occupancy norms) — India-specific wedge vs US/EU calculators.
 */

export type RoomDimensions = {
  /** Length in metres (internal clear). Must be > 0. */
  lengthM: number;
  /** Width in metres (internal clear). Must be > 0. */
  widthM: number;
};

export type DensityPresetId =
  | "open-office"
  | "cubicle"
  | "meeting"
  | "classroom"
  | "clinic-waiting";

export type DensityPreset = {
  id: DensityPresetId;
  label: string;
  /** Gross sqm per seat before circulation deduction (India-calibrated). */
  sqmPerSeat: number;
  /** Circulation / services deduction per NBC planning allowance (0–1). */
  circulationRatio: number;
  description: string;
};

/**
 * India-calibrated density presets — single source for A (office-space) and F (meeting-room).
 * Values are planning bands, not furniture SKU prices; bands refresh with module 8 matrix (phase 2).
 * Keep gross sqmPerSeat conservative vs US 8–10 sqm open-office norms — NBC + local practice.
 */
export const DENSITY_PRESETS: Record<DensityPresetId, DensityPreset> = {
  "open-office": {
    id: "open-office",
    label: "Open office",
    sqmPerSeat: 6,
    circulationRatio: 0.32,
    description: "Bench / hot-desk open plan — India NBC circulation ~32% (corridors, fire egress, services).",
  },
  cubicle: {
    id: "cubicle",
    label: "Cubicle / semi-enclosed",
    sqmPerSeat: 8,
    circulationRatio: 0.35,
    description: "120° / 60° cubicles — higher partition + aisle allowance.",
  },
  meeting: {
    id: "meeting",
    label: "Meeting room",
    sqmPerSeat: 2.2,
    circulationRatio: 0.25,
    description: "Board / meeting — NBC meeting allowance ~2.0–2.5 sqm per seat plus table.",
  },
  classroom: {
    id: "classroom",
    label: "Classroom / training",
    sqmPerSeat: 1.85,
    circulationRatio: 0.28,
    description: "Row seating with aisle — IS/NBC classroom band.",
  },
  "clinic-waiting": {
    id: "clinic-waiting",
    label: "Clinic / waiting",
    sqmPerSeat: 1.5,
    circulationRatio: 0.30,
    description: "Waiting / lounge — higher density, circulation for movement.",
  },
};

/** Tool A uses workstation-relevant presets; Tool F narrows to meeting-room presets but reuses same engine. */
export const OFFICE_SPACE_PRESET_IDS: readonly DensityPresetId[] = [
  "open-office",
  "cubicle",
  "meeting",
  "classroom",
  "clinic-waiting",
] as const;

export const MEETING_ROOM_PRESET_IDS: readonly DensityPresetId[] = [
  "meeting",
  "classroom",
  "open-office",
] as const;

export function isDensityPresetId(value: string): value is DensityPresetId {
  return value in DENSITY_PRESETS;
}

export function grossAreaSqm(dims: RoomDimensions): number {
  if (!Number.isFinite(dims.lengthM) || !Number.isFinite(dims.widthM)) return 0;
  if (dims.lengthM <= 0 || dims.widthM <= 0) return 0;
  return dims.lengthM * dims.widthM;
}

export function usableAreaSqm(grossSqm: number, circulationRatio: number): number {
  if (!Number.isFinite(grossSqm) || grossSqm <= 0) return 0;
  const ratio = Number.isFinite(circulationRatio) ? Math.min(Math.max(circulationRatio, 0), 0.6) : 0;
  return grossSqm * (1 - ratio);
}

export function seatsByDensity(usableSqm: number, sqmPerSeat: number): number {
  if (!Number.isFinite(usableSqm) || usableSqm <= 0) return 0;
  if (!Number.isFinite(sqmPerSeat) || sqmPerSeat <= 0) return 0;
  return Math.floor(usableSqm / sqmPerSeat);
}

export type CalculateSpaceInput = {
  dims: RoomDimensions;
  /** Runtime input is validated by calculateSpace before lookup. */
  presetId: string;
};

export type CalculateSpaceResult = {
  preset: DensityPreset;
  grossSqm: number;
  usableSqm: number;
  seats: number;
  sqmPerSeat: number;
};

export function calculateSpace(input: CalculateSpaceInput): CalculateSpaceResult {
  if (!isDensityPresetId(input.presetId)) {
    throw new RangeError(`Unknown density preset: ${input.presetId}`);
  }
  const preset = DENSITY_PRESETS[input.presetId];
  const gross = grossAreaSqm(input.dims);
  const usable = usableAreaSqm(gross, preset.circulationRatio);
  const seats = seatsByDensity(usable, preset.sqmPerSeat);
  return {
    preset,
    grossSqm: gross,
    usableSqm: usable,
    seats,
    sqmPerSeat: preset.sqmPerSeat,
  };
}

/** Convenience for direct length/width/preset without object nesting — still pure. */
export function calculateSpaceFromDims(
  lengthM: number,
  widthM: number,
  presetId: DensityPresetId,
): CalculateSpaceResult {
  return calculateSpace({ dims: { lengthM, widthM }, presetId });
}

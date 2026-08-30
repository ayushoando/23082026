"use client";
import React, { useState } from "react";
import { HueSlider } from "@planner/components/ui/PlannerHueSlider";
import { OO, OO_SWATCHES, transparentChecker } from "@planner/lib/plannerPalette";

interface ColorPaletteProps {
  fill?: string;
  stroke?: string;
  onFillChange?: (c: string) => void;
  onStrokeChange?: (c: string) => void;
}

export const ColorPalette = ({ fill, stroke, onFillChange, onStrokeChange }: ColorPaletteProps) => {
  const [mode, setMode] = useState<"fill" | "stroke">("fill");
  const current = mode === "fill" ? fill : stroke;
  const onPick = (c: string) => {
    if (mode === "fill") onFillChange?.(c);
    else onStrokeChange?.(c);
  };
  return (
    <div className="color-palette" data-testid="color-palette">
      <div className="segmented" style={{ width: "100%", justifyContent: "stretch" }} role="group" aria-label="Choose color target">
        <button
          type="button"
          style={{ flex: 1 }}
          data-active={mode === "fill"}
          aria-pressed={mode === "fill"}
          onClick={() => setMode("fill")}
          data-testid="cp-fill"
        >
          Fill
        </button>
        <button
          type="button"
          style={{ flex: 1 }}
          data-active={mode === "stroke"}
          aria-pressed={mode === "stroke"}
          onClick={() => setMode("stroke")}
          data-testid="cp-stroke"
        >
          Stroke
        </button>
      </div>
      <div className="color-palette__current">
        <div
          className="color-palette__preview"
          style={{ background: current === "transparent" ? transparentChecker(8) : current }}
          aria-hidden="true"
        />
        <input
          type="color"
          value={current && current !== "transparent" ? current : OO.colorPickerFallback}
          onChange={(e) => onPick(e.target.value)}
          className="color-palette__picker"
          data-testid="cp-picker"
          aria-label={`${mode === "fill" ? "Fill" : "Stroke"} color picker`}
        />
        <input
          className="input input--sm"
          value={current || ""}
          onChange={(e) => onPick(e.target.value)}
          spellCheck={false}
          data-testid="cp-hex"
          aria-label={`${mode === "fill" ? "Fill" : "Stroke"} color hex`}
        />
      </div>
      <HueSlider
        value={current}
        fallback={OO.colorPickerFallback}
        onChange={onPick}
        disabled={current === "transparent"}
      />
      <div className="color-palette__swatches" role="group" aria-label={`${mode === "fill" ? "Fill" : "Stroke"} color swatches`}>
        {OO_SWATCHES.map((c) => {
          const label = c === "transparent" ? "Transparent" : `Color ${c}`;
          return (
            <button
              key={c}
              type="button"
              className="color-palette__swatch"
              style={{ background: c === "transparent" ? transparentChecker(6) : c }}
              data-active={current === c}
              aria-pressed={current === c}
              onClick={() => onPick(c)}
              data-testid={`cp-swatch-${c}`}
              title={label}
              aria-label={label}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorPalette;

"use client";
import { PropertiesEmptyHint } from "@planner/components/ui/PlannerPropertiesEmptyHint";
import { OO_DRAW } from "@planner/lib/plannerPalette";
import React, { useEffect, useState } from "react";
import { fromMm, toMm, formatDim } from "@planner/lib/plannerUnits";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import type { OoFabricObject } from "@planner/lib/plannerTypes";

interface NumRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  disabled?: boolean;
  suffix?: string;
  testId?: string;
  instructionId?: string;
  min?: number;
}

const NumRow = ({
  label,
  value,
  onChange,
  step = 1,
  disabled,
  suffix,
  testId,
  instructionId,
  min,
}: NumRowProps) => {
  const [invalid, setInvalid] = useState(false);
  const inputId = testId ? `${testId}-input` : undefined;
  const labelId = testId ? `${testId}-label` : undefined;
  const unitId = suffix && testId ? `${testId}-unit` : undefined;
  const errorId = testId ? `${testId}-error` : undefined;

  useEffect(() => {
    setInvalid(!Number.isFinite(value));
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const next = Number(raw);
    const nextInvalid = raw.trim() === "" || !Number.isFinite(next) || (min !== undefined && next < min);
    setInvalid(nextInvalid);
    if (!nextInvalid) onChange(next);
  };

  const describedBy = [unitId, instructionId, invalid ? errorId : undefined]
    .filter((id): id is string => Boolean(id))
    .join(" ");

  return (
    <div className="prop-row">
      <label className="prop-row__label" id={labelId} htmlFor={inputId}>
        {label}
      </label>
      <div className="prop-row__inputs">
        <input
          id={inputId}
          className="input"
          type="number"
          step={step}
          min={min}
          value={Number.isFinite(value) ? Math.round(value * 100) / 100 : ""}
          onChange={handleChange}
          disabled={disabled}
          data-testid={testId}
          aria-label={testId ? undefined : label}
          aria-labelledby={labelId}
          aria-invalid={invalid}
          aria-describedby={describedBy || undefined}
        />
        {suffix ? (
          <div id={unitId} style={{ fontSize: 11, color: "var(--text-subtle)", alignSelf: "center", minWidth: 20 }}>
            {suffix}
          </div>
        ) : null}
        {invalid ? (
          <span id={errorId} className="planner-field-error" role="alert">
            Enter a valid {label.toLowerCase()}{min !== undefined ? ` of at least ${min}` : ""}.
          </span>
        ) : null}
      </div>
    </div>
  );
};

interface PropertiesPanelProps {
  selected: OoFabricObject | null;
  scalePxPerMm: number;
  onChange: (patch: Record<string, unknown>) => void;
}

export const PropertiesPanel = ({ selected, scalePxPerMm, onChange }: PropertiesPanelProps) => {
  const unit = usePlannerUIStore((s) => s.unit);

  if (!selected) {
    return <PropertiesEmptyHint />;
  }

  const px = selected.__props || {};
  const toMmValue = (value: number | undefined): number => {
    if (!Number.isFinite(scalePxPerMm) || scalePxPerMm <= 0) return Number.NaN;
    return typeof value === "number" ? value / scalePxPerMm : 0;
  };
  const mmW = toMmValue(px.width);
  const mmH = toMmValue(px.height);
  const mmX = toMmValue(px.left);
  const mmY = toMmValue(px.top);
  const angle = typeof px.angle === "number" ? px.angle : 0;
  const instructionId = "properties-unit-instructions";
  const realWorld = Number.isFinite(mmW) && Number.isFinite(mmH)
    ? `${formatDim(mmW, unit)} × ${formatDim(mmH, unit)}`
    : "Unavailable";

  return (
    <div data-testid="properties-panel" role="region" aria-labelledby="properties-panel-title">
      <h3 id="properties-panel-title" className="sr-only">Selected object properties</h3>
      <p id={instructionId} className="ai-hint">Numeric values use the selected {unit} unit unless a field shows another unit.</p>
      <div style={{ height: 6 }} />
      <NumRow
        label="Width"
        value={fromMm(mmW, unit)}
        onChange={(v) => onChange({ width: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={unit === "in" ? 0.1 : 1}
        min={0}
        instructionId={instructionId}
        testId="prop-width"
      />
      <NumRow
        label="Height"
        value={fromMm(mmH, unit)}
        onChange={(v) => onChange({ height: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={unit === "in" ? 0.1 : 1}
        min={0}
        instructionId={instructionId}
        testId="prop-height"
      />
      <NumRow
        label="X"
        value={fromMm(mmX, unit)}
        onChange={(v) => onChange({ left: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={unit === "in" ? 0.1 : 1}
        instructionId={instructionId}
        testId="prop-x"
      />
      <NumRow
        label="Y"
        value={fromMm(mmY, unit)}
        onChange={(v) => onChange({ top: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={unit === "in" ? 0.1 : 1}
        instructionId={instructionId}
        testId="prop-y"
      />
      <NumRow
        label="Rotation"
        value={angle}
        onChange={(v) => onChange({ angle: v })}
        suffix="°"
        step={1}
        instructionId={instructionId}
        testId="prop-angle"
      />
      {px.stroke !== undefined && (
        <div className="prop-row">
          <div className="prop-row__label" id="prop-stroke-label">Stroke</div>
          <input
            id="prop-stroke"
            className="input input--sm"
            type="color"
            value={px.stroke || OO_DRAW.stroke}
            onChange={(e) => onChange({ stroke: e.target.value })}
            data-testid="prop-stroke"
            aria-labelledby="prop-stroke-label"
          />
        </div>
      )}
      {px.fill !== undefined && typeof px.fill === "string" && (
        <div className="prop-row">
          <div className="prop-row__label" id="prop-fill-label">Fill</div>
          <input
            id="prop-fill"
            className="input input--sm"
            type="color"
            value={px.fill || OO_DRAW.fill}
            onChange={(e) => onChange({ fill: e.target.value })}
            data-testid="prop-fill"
            aria-labelledby="prop-fill-label"
          />
        </div>
      )}
      {px.strokeWidth !== undefined && (
        <NumRow
          label="Stroke width"
          value={typeof px.strokeWidth === "number" ? px.strokeWidth : 1}
          step={0.5}
          min={0}
          instructionId={instructionId}
          onChange={(v) => onChange({ strokeWidth: v })}
          suffix="px"
          testId="prop-strokewidth"
        />
      )}

      <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 12, fontFamily: "var(--font-mono)" }} aria-live="polite">
        Real world: {realWorld}
      </div>
    </div>
  );
};

export default PropertiesPanel;

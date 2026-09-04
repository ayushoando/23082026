"use client";

import { useMemo, useState, type FormEvent } from "react";

export type SpaceCalculatorPreset = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly circulationFraction: number;
  readonly areaPerPersonSqm: number;
};

export type SpaceEstimate = {
  readonly grossAreaSqm: number;
  readonly circulationAreaSqm: number;
  readonly usableAreaSqm: number;
  readonly recommendedCapacity: number;
};

export interface SpaceCalculatorProps {
  readonly id: string;
  readonly title: string;
  readonly capacityLabel: string;
  readonly initialPresetId: string;
  readonly presets: readonly SpaceCalculatorPreset[];
}

export function calculateSpaceEstimate(
  lengthMetres: number,
  widthMetres: number,
  preset: SpaceCalculatorPreset,
): SpaceEstimate {
  const grossAreaSqm = lengthMetres * widthMetres;
  const circulationAreaSqm = grossAreaSqm * preset.circulationFraction;
  const usableAreaSqm = grossAreaSqm - circulationAreaSqm;

  return {
    grossAreaSqm,
    circulationAreaSqm,
    usableAreaSqm,
    recommendedCapacity: Math.max(0, Math.floor(usableAreaSqm / preset.areaPerPersonSqm)),
  };
}

function formatSquareMetres(value: number): string {
  return `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value)} m²`;
}

function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function SpaceCalculator({
  id,
  title,
  capacityLabel,
  initialPresetId,
  presets,
}: SpaceCalculatorProps) {
  const [length, setLength] = useState("10");
  const [width, setWidth] = useState("8");
  const [presetId, setPresetId] = useState(initialPresetId);
  const [estimate, setEstimate] = useState<SpaceEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === presetId) ?? presets[0],
    [presetId, presets],
  );

  if (!selectedPreset) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lengthMetres = parsePositiveNumber(length);
    const widthMetres = parsePositiveNumber(width);

    if (!lengthMetres || !widthMetres) {
      setEstimate(null);
      setError("Enter a length and width greater than zero to calculate your estimate.");
      return;
    }

    setError(null);
    setEstimate(calculateSpaceEstimate(lengthMetres, widthMetres, selectedPreset));
  };

  const handleReset = () => {
    setLength("10");
    setWidth("8");
    setPresetId(initialPresetId);
    setEstimate(null);
    setError(null);
  };

  return (
    <section className="tools-calculator" aria-labelledby={`${id}-title`}>
      <div className="tools-calculator__header">
        <p className="typ-label tools-calculator__eyebrow">Planning estimate</p>
        <h2 id={`${id}-title`} className="tools-calculator__title">
          {title}
        </h2>
        <p className="tools-calculator__note">
          Start with room dimensions and a planning preset. This is an indicative estimate,
          not a code-compliance or construction drawing.
        </p>
      </div>

      <div className="tools-calculator__body">
        <form className="tools-calculator__form" noValidate onSubmit={handleSubmit}>
          <div className="tools-calculator__dimension-grid">
            <label className="tools-calculator__field" htmlFor={`${id}-length`}>
              <span>Length</span>
              <span className="tools-calculator__input-wrap">
                <input
                  id={`${id}-length`}
                  name="length"
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  value={length}
                  onChange={(event) => setLength(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
                <span aria-hidden="true">m</span>
              </span>
            </label>

            <label className="tools-calculator__field" htmlFor={`${id}-width`}>
              <span>Width</span>
              <span className="tools-calculator__input-wrap">
                <input
                  id={`${id}-width`}
                  name="width"
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  value={width}
                  onChange={(event) => setWidth(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
                <span aria-hidden="true">m</span>
              </span>
            </label>
          </div>

          <label className="tools-calculator__field" htmlFor={`${id}-preset`}>
            <span>Planning preset</span>
            <select
              id={`${id}-preset`}
              name="preset"
              value={presetId}
              onChange={(event) => setPresetId(event.target.value)}
              aria-describedby={`${id}-preset-description`}
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <p id={`${id}-preset-description`} className="tools-calculator__preset-description">
            {selectedPreset.description}
          </p>

          {error ? (
            <p id={`${id}-error`} className="tools-calculator__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="tools-calculator__actions">
            <button className="tools-calculator__button tools-calculator__button--primary" type="submit">
              Calculate estimate
            </button>
            <button className="tools-calculator__button tools-calculator__button--secondary" type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        <aside className="tools-calculator__result" aria-live="polite" data-testid={`${id}-result`}>
          {estimate ? (
            <>
              <p className="typ-label tools-calculator__result-label">Indicative capacity</p>
              <p className="tools-calculator__result-value">
                {estimate.recommendedCapacity} <span>{capacityLabel}</span>
              </p>
              <dl className="tools-calculator__result-breakdown">
                <div>
                  <dt>Gross area</dt>
                  <dd>{formatSquareMetres(estimate.grossAreaSqm)}</dd>
                </div>
                <div>
                  <dt>Planning circulation</dt>
                  <dd>{formatSquareMetres(estimate.circulationAreaSqm)}</dd>
                </div>
                <div>
                  <dt>Usable planning area</dt>
                  <dd>{formatSquareMetres(estimate.usableAreaSqm)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className="typ-label tools-calculator__result-label">Your estimate</p>
              <p className="tools-calculator__result-empty">
                Enter dimensions and calculate to see the available planning area and capacity.
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

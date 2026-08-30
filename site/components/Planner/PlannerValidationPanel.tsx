"use client";

import { useMemo } from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import { usePlanner } from "@planner/hooks/usePlannerDockBridge";
import { buildValidationFloorFromCanvas } from "@planner/lib/buildValidationFloor";
import { runFloorValidation } from "@planner/lib/validation/runValidation";
import type { ValidationIssue } from "@planner/lib/validation/types";

function severityClass(severity: ValidationIssue["severity"]): string {
  if (severity === "error") return "planner-validation__item--error";
  if (severity === "warning") return "planner-validation__item--warning";
  return "planner-validation__item--advisory";
}

/** Review-step validation list from live Fabric scene. */
export function ValidationPanel() {
  const { getCanvas, scalePxPerMm, sheet, sceneVersion } = usePlanner();

  const result = useMemo(() => {
    const fabricCanvas = getCanvas();
    void sceneVersion;
    const floor = buildValidationFloorFromCanvas(fabricCanvas, scalePxPerMm, sheet);
    return runFloorValidation(floor);
  }, [getCanvas, scalePxPerMm, sheet, sceneVersion]);

  if (result.issues.length === 0) {
    return (
      <section
        className="planner-validation planner-validation--success"
        data-state="success"
        data-testid="planner-validation-empty"
        aria-labelledby="planner-validation-title"
        aria-live="polite"
      >
        <h3 id="planner-validation-title" className="sr-only">Layout validation</h3>
        <div className="planner-validation__status" aria-hidden="true">
          <PhIcon name="checkCircle" size={18} weight="duotone" />
        </div>
        <p className="ai-hint" role="status">No layout issues detected.</p>
      </section>
    );
  }

  return (
    <section
      className="planner-validation planner-validation--error"
      data-state="validation-error"
      data-testid="planner-validation"
      aria-labelledby="planner-validation-title"
      aria-live="polite"
    >
      <h3 id="planner-validation-title" className="sr-only">Layout validation</h3>
      <div className="planner-validation__summary" data-testid="planner-validation-summary" role="status" aria-live="polite" aria-atomic="true">
        <PhIcon name="warning" size={18} weight="duotone" />
        <span data-testid="planner-validation-errors">{result.errors} errors</span>
        <span data-testid="planner-validation-warnings">{result.warnings} warnings</span>
      </div>
      <ul className="planner-validation__list" aria-label="Layout validation issues">
        {result.issues.map((issue) => (
          <li
            key={issue.id}
            className={`planner-validation__item ${severityClass(issue.severity)}`}
            data-testid={`planner-validation-issue-${issue.rule}`}
            data-rule={issue.rule}
            data-severity={issue.severity}
          >
            <strong>{issue.severity}</strong>
            <span>{issue.message}</span>
            <span className="ai-hint">{issue.remedy}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ValidationPanel;

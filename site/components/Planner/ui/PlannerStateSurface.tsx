"use client";

import { useId, useRef, useEffect, type ReactNode, type RefObject } from "react";
import { PhIcon, type PhIconName } from "@planner/components/ui/PlannerPhIcon";

export type PlannerVisualStateKind =
  | "default"
  | "loading"
  | "empty"
  | "validation-error"
  | "server-error"
  | "unauthenticated"
  | "forbidden"
  | "rate-limited"
  | "conflict"
  | "stale"
  | "offline"
  | "recovery"
  | "success"
  | "not-found";

export interface PlannerStateSurfaceProps {
  kind: PlannerVisualStateKind;
  heading: string;
  message: ReactNode;
  actions?: ReactNode;
  detail?: ReactNode;
  icon?: PhIconName;
  role?: "status" | "alert" | "region";
  live?: "off" | "polite" | "assertive";
  busy?: boolean;
  focusOnRender?: boolean;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  headingId?: string;
  headingLevel?: 1 | 2 | 3;
  className?: string;
  testId?: string;
}

const STATE_ICONS: Record<PlannerVisualStateKind, PhIconName> = {
  default: "info",
  loading: "spinner",
  empty: "folder",
  "validation-error": "warning",
  "server-error": "x",
  unauthenticated: "lockOpen",
  forbidden: "lock",
  "rate-limited": "clock",
  conflict: "arrowsRefresh",
  stale: "arrowClockwise",
  offline: "wifiOff",
  recovery: "wifi",
  success: "checkCircle",
  "not-found": "folder",
};

const ALERT_STATES = new Set<PlannerVisualStateKind>([
  "validation-error",
  "server-error",
  "unauthenticated",
  "forbidden",
  "rate-limited",
  "conflict",
  "stale",
  "offline",
  "not-found",
]);

/**
 * Planner-local visual state primitive. It owns only presentation and
 * accessibility metadata; callers continue to own state transitions and
 * provide the existing links/buttons as actions.
 */
export function PlannerStateSurface({
  kind,
  heading,
  message,
  actions,
  detail,
  icon = STATE_ICONS[kind],
  role,
  live,
  busy = kind === "loading",
  focusOnRender = false,
  headingRef,
  headingId,
  headingLevel = 2,
  className,
  testId,
}: PlannerStateSurfaceProps) {
  const generatedHeadingId = useId();
  const internalHeadingRef = useRef<HTMLHeadingElement>(null);
  const resolvedHeadingRef = headingRef ?? internalHeadingRef;
  const resolvedRole = role ?? (ALERT_STATES.has(kind) ? "alert" : "status");
  const resolvedLive = live ?? (resolvedRole === "alert" ? "assertive" : "polite");
  const resolvedHeadingId = headingId ?? `planner-state-heading-${generatedHeadingId.replace(/:/g, "")}`;
  const headingClassName = "planner-state-surface__heading";
  const headingProps = {
    className: headingClassName,
    id: resolvedHeadingId,
    ref: resolvedHeadingRef,
    tabIndex: focusOnRender ? -1 : undefined,
    "data-planner-state-heading": true,
  } as const;

  useEffect(() => {
    if (focusOnRender) resolvedHeadingRef.current?.focus();
  }, [focusOnRender, kind, resolvedHeadingRef]);

  const headingNode =
    headingLevel === 1 ? (
      <h1 {...headingProps}>{heading}</h1>
    ) : headingLevel === 3 ? (
      <h3 {...headingProps}>{heading}</h3>
    ) : (
      <h2 {...headingProps}>{heading}</h2>
    );

  return (
    <section
      className={[
        "planner-state-surface",
        `planner-state-surface--${kind}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-state={kind}
      data-busy={busy ? "true" : "false"}
      data-testid={testId}
      role={resolvedRole}
      aria-live={resolvedLive}
      aria-busy={busy ? "true" : undefined}
      aria-labelledby={resolvedHeadingId}
    >
      <div className="planner-state-surface__icon" aria-hidden="true">
        <PhIcon name={icon} size={22} weight={kind === "loading" ? "bold" : "duotone"} />
      </div>
      <div className="planner-state-surface__content">
        {headingNode}
        <p className="planner-state-surface__message">{message}</p>
        {detail ? <div className="planner-state-surface__detail">{detail}</div> : null}
      </div>
      {actions ? <div className="planner-state-surface__actions">{actions}</div> : null}
    </section>
  );
}

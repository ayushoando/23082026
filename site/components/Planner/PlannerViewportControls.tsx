"use client";
import React from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";

interface ViewportControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onZoom100: () => void;
  autoFit?: boolean;
  onToggleAutoFit?: () => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  /** Explicit pan callbacks — alternatives to multi-pointer gestures (Req 7.7). */
  onPanLeft?: () => void;
  onPanRight?: () => void;
  onPanUp?: () => void;
  onPanDown?: () => void;
}

/**
 * Viewport controls with explicit zoom and pan buttons. Pan buttons serve as
 * accessible alternatives to two-finger scroll / middle-mouse drag gestures
 * so users without multi-pointer input can still pan the canvas.
 * Requirements 7.1–7.4, 7.7.
 */
export const ViewportControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onZoom100,
  autoFit = false,
  onToggleAutoFit,
  fullscreen = false,
  onToggleFullscreen,
  onPanLeft,
  onPanRight,
  onPanUp,
  onPanDown,
}: ViewportControlsProps) => {
  const hasPan = onPanLeft || onPanRight || onPanUp || onPanDown;

  return (
    <div className="viewport-controls" role="group" aria-label="Viewport controls" data-testid="viewport-controls">
      <button type="button" className="vp-btn" onClick={onZoomOut} title="Zoom out (−)" aria-label="Zoom out" data-testid="vp-zoom-out"><PhIcon name="minus" size={18} /></button>
      <button type="button" className="vp-btn vp-btn--wide" onClick={onZoom100} title="Zoom 100% / home view (0)" aria-label={`Zoom ${Math.round(zoom * 100)} percent`} data-testid="vp-zoom-100">{Math.round(zoom * 100)}%</button>
      <button type="button" className="vp-btn" onClick={onZoomIn} title="Zoom in (+)" aria-label="Zoom in" data-testid="vp-zoom-in"><PhIcon name="plus" size={18} /></button>
      <div className="vp-sep" aria-hidden="true" />
      <button type="button" className="vp-btn" onClick={onFit} title="Fit to content (F)" aria-label="Fit to content" data-testid="vp-fit">Fit</button>
      <button
        className="vp-btn"
        data-active={autoFit}
        onClick={onToggleAutoFit}
        title="Auto-fit when the window resizes"
        aria-label="Auto-fit when the window resizes"
        data-testid="vp-auto-fit"
        type="button"
      >
        Auto
      </button>
      {hasPan ? (
        <>
          <div className="vp-sep" aria-hidden="true" />
          <div className="vp-pan-group" role="group" aria-label="Pan canvas" data-testid="vp-pan-group">
            {onPanLeft ? (
              <button type="button" className="vp-btn" onClick={onPanLeft} title="Pan left" aria-label="Pan left" data-testid="vp-pan-left"><PhIcon name="arrowLeft" size={16} /></button>
            ) : null}
            {onPanUp ? (
              <button type="button" className="vp-btn" onClick={onPanUp} title="Pan up" aria-label="Pan up" data-testid="vp-pan-up"><PhIcon name="arrowUp" size={16} /></button>
            ) : null}
            {onPanDown ? (
              <button type="button" className="vp-btn" onClick={onPanDown} title="Pan down" aria-label="Pan down" data-testid="vp-pan-down"><PhIcon name="arrowDown" size={16} /></button>
            ) : null}
            {onPanRight ? (
              <button type="button" className="vp-btn" onClick={onPanRight} title="Pan right" aria-label="Pan right" data-testid="vp-pan-right"><PhIcon name="arrowRight" size={16} /></button>
            ) : null}
          </div>
        </>
      ) : null}
      <div className="vp-sep" aria-hidden="true" />
      <button
        className="vp-btn"
        data-active={fullscreen}
        onClick={onToggleFullscreen}
        title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        data-testid="vp-fullscreen"
        type="button"
      >
        <PhIcon name={fullscreen ? "minimize" : "maximize"} size={18} />
      </button>
    </div>
  );
};

export default ViewportControls;

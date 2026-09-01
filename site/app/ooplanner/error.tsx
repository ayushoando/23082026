"use client";

import { useEffect } from "react";

export default function PlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[planner-error-boundary]", error);
  }, [error]);

  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <p>The planner could not load. Your local backup is safe.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

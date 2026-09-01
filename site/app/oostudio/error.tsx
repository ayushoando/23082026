"use client";

import { useEffect } from "react";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[studio-error-boundary]", error);
  }, [error]);

  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <p>The studio could not load. Unsaved work may be recoverable from your draft.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

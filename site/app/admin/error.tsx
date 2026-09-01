"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-error-boundary]", error);
  }, [error]);

  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred in the admin area.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

"use client";

import NextError from "next/error";
import { useEffect } from "react";

/**
 * App Router global error boundary (must define its own html/body).
 * Sentry removed 2026-07-09 — use product logging / reportClientError if needed.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Log digest + full stack for debug — digest alone is opaque for ChunkLoadError.
    console.error("[global-error]", {
      digest: error?.digest,
      message: error?.message,
      stack: error?.stack,
      error,
    });
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* `NextError` requires statusCode; App Router does not expose HTTP status here. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}

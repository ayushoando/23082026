import { timingSafeEqual } from "node:crypto";
import { getMetricsRegistry } from "@/lib/observability/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 8.3: warn once per server instance when metrics are served without a token. */
let warnedOpenMetrics = false;

function isAuthorizedMetricsRequest(
  request: Request,
  expectedToken: string | undefined,
): boolean {
  // No token configured: metrics stay open (dev/local default). Once a token
  // is set, every request must present it — closes SEC-H02.
  if (!expectedToken) {
    if (!warnedOpenMetrics && process.env.NODE_ENV !== "test") {
      warnedOpenMetrics = true;
      console.warn(
        "[metrics] METRICS_AUTH_TOKEN is not configured — /api/metrics is unauthenticated (dev/local default; production 404s unless OBSERVABILITY_METRICS_ENABLED=1).",
      );
    }
    return true;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!provided) {return false;}

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expectedToken);
  if (providedBuffer.length !== expectedBuffer.length) {return false;}
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function GET(request: Request) {
  const expectedToken = process.env.METRICS_AUTH_TOKEN?.trim();

  if (
    process.env.NODE_ENV === "production" &&
    process.env.OBSERVABILITY_METRICS_ENABLED !== "1"
  ) {
    return new Response("Not Found", { status: 404 });
  }

  if (process.env.NODE_ENV === "production" && !expectedToken) {
    return new Response("Metrics endpoint is not configured", { status: 503 });
  }

  if (!isAuthorizedMetricsRequest(request, expectedToken)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const registry = getMetricsRegistry();

  return new Response(await registry.metrics(), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": registry.contentType,
    },
  });
}

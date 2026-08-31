import { timingSafeEqual } from "node:crypto";
import { getMetricsRegistry } from "@/lib/observability/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedMetricsRequest(request: Request): boolean {
  const expectedToken = process.env.METRICS_AUTH_TOKEN?.trim();
  // No token configured: metrics stay open (dev/local default). Once a token
  // is set, every request must present it — closes SEC-H02.
  if (!expectedToken) {return true;}

  const authHeader = request.headers.get("authorization") ?? "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!provided) {return false;}

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expectedToken);
  if (providedBuffer.length !== expectedBuffer.length) {return false;}
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function GET(request: Request) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.OBSERVABILITY_METRICS_ENABLED !== "1"
  ) {
    return new Response("Not Found", { status: 404 });
  }

  if (!isAuthorizedMetricsRequest(request)) {
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

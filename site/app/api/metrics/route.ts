import { getMetricsRegistry } from "@/lib/observability/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.OBSERVABILITY_METRICS_ENABLED !== "1"
  ) {
    return new Response("Not Found", { status: 404 });
  }

  const registry = getMetricsRegistry();

  return new Response(await registry.metrics(), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": registry.contentType,
    },
  });
}

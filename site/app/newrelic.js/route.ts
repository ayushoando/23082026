import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse } from "next/server";

/**
 * New Relic Browser agent loader.
 *
 * Serves the vendored loader template with the license key substituted from a
 * server environment variable, so the key never sits in a committed or public
 * static file. Browser ingest keys are public to the browser agent by design.
 *
 * The template lives outside `public/` (site/lib/analytics) so Next never
 * serves it raw; only this route resolves it.
 */

// Next compiles this handler below `site/.next/.../app/newrelic.js`; walk back
// to the traced `site/lib` template rather than depending on process.cwd().
const TEMPLATE_PATH = resolve(
  __dirname,
  "../../../../lib/analytics/newrelic-agent.template.js",
);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBrowserIngestKey(): string | undefined {
  return (
    process.env.NEW_RELIC_BROWSER_KEY?.trim() ??
    process.env.NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY?.trim()
  );
}

export async function GET() {
  const key = getBrowserIngestKey();

  // Key absent (dev without env): serve a no-op so the page never 404s and
  // no agent loads. Do not log or echo the key.
  if (!key) {
    return new NextResponse(
      "/* New Relic disabled: NEW_RELIC_BROWSER_KEY is not set */\n",
      {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  let template: string;
  try {
    template = await readFile(TEMPLATE_PATH, "utf8");
  } catch (err) {
    console.error("newrelic loader: template read failed", err);
    return new NextResponse("/* newrelic loader unavailable */\n", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // The key is an NRJS-* browser ingest key (public by design for the browser
  // agent); it still comes from env, not source control.
  const body = template.replaceAll("__NEW_RELIC_LICENSE_KEY__", key);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}

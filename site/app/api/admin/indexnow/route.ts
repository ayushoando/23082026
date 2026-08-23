import { NextRequest, NextResponse } from "next/server";
import { enforceAdminRateLimit, requireAdminSession } from "@/app/api/admin/_lib/server";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { CSRF_REJECTION_HEADER_NAME } from "@/lib/security/csrfConstants";
import { submitToIndexNow } from "@/lib/seo/indexnow";

export async function POST(req: NextRequest) {
  const rateLimitError = await enforceAdminRateLimit(req, "indexnow", 10, 60 * 1000);
  if (rateLimitError) return rateLimitError;

  const authError = await requireAdminSession();
  if (authError) return authError;

  const isCsrfValid = await validateCsrfRequest(req);
  if (!isCsrfValid) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403, headers: { [CSRF_REJECTION_HEADER_NAME]: "1" } },
    );
  }

  try {
    const body = await req.json();
    const urls = Array.isArray(body?.urls) ? body.urls : [];
    const dryRun = Boolean(body?.dryRun);

    if (urls.length === 0) {
      return NextResponse.json({ error: "Missing 'urls' array in request body." }, { status: 400 });
    }

    const result = await submitToIndexNow(urls, { dryRun });
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

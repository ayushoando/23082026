import { NextResponse } from "next/server";
import {
  isDevAuthBypassEnabled,
  isDevAuthBypassRequestAllowed,
} from "@/lib/auth/devAuthBypass";

/**
 * Dev diagnostic — reports whether server-side auth bypass is active.
 * Never returns secrets. Hidden in production (same posture as dev-tools).
 *
 * `bypassEnabled` is the effective (7.1 host-guarded) value: the env flag may
 * be set while the request host is not allowed, in which case the bypass is
 * inert for this request.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host");

  return NextResponse.json({
    bypassEnabled:
      isDevAuthBypassEnabled() && isDevAuthBypassRequestAllowed(host),
    nodeEnv: process.env.NODE_ENV ?? null,
    flagSet: process.env.DEV_AUTH_BYPASS === "1",
  });
}

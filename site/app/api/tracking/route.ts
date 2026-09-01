import type { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicApiIp } from "@/app/api/_lib/public";
import {
  createSupabaseAuthAdminClient,
  createSupabaseAuthAnonClient,
} from '@/platform/supabase/auth-admin';
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { success, error, rateLimitedError } from "@/features/shared/api/apiResponse";
import { rateLimit } from '@/lib/rateLimit';
import {
  createAnonymousUserId,
  normalizeAnonymousUserId,
} from "@/lib/tracking/anonymousUserId";
import {
  TRACKING_ANON_COOKIE,
  TRACKING_ANON_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/tracking/trackingCookie";
import {
  fetchViewedProducts,
  upsertViewedProducts,
} from "@/lib/tracking/userHistoryRepository";

type TrackingPayload = {
  productId?: string;
};

async function parseTrackingPayload(req: NextRequest): Promise<TrackingPayload> {
  try {
    return (await req.json()) as TrackingPayload;
  } catch {
    return {};
  }
}

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {return null;}

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {return null;}

  return match[1].trim();
}

function normalizeId(value: unknown): string {
  if (typeof value !== "string") {return "";}
  return value.trim();
}

function trackingNoopResponse(
  userId: string,
  productId: string,
  viewedProducts = [productId],
) {
  return success({
    tracked: false,
    userId,
    viewedProducts,
  });
}

function withAnonCookie(
  response: NextResponse,
  anonId: string | null,
): NextResponse {
  if (!anonId) {return response;}
  response.cookies.set(TRACKING_ANON_COOKIE, anonId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TRACKING_ANON_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

type ResolvedTrackingIdentity = {
  userId: string;
  newAnonId: string | null;
  /** The verified bearer token, when the visitor resolved to a real session. */
  accessToken: string | null;
};

async function resolveUserId(req: NextRequest): Promise<ResolvedTrackingIdentity> {
  const token = getBearerToken(req);
  if (token) {
    try {
      // SEC-R08: token verification runs on the anon-key client (auth.getUser
      // validates the caller's own JWT) instead of the service-role key.
      const authClient = createSupabaseAuthAnonClient(token);
      const { data: authData } = await authClient.auth.getUser(token);
      const authUserId = normalizeId(authData?.user?.id);
      if (authUserId) {
        return { userId: authUserId, newAnonId: null, accessToken: token };
      }
    } catch {
      // fall through to cookie-bound anonymous id
    }
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(TRACKING_ANON_COOKIE)?.value;
  const cookieAnonId = normalizeAnonymousUserId(cookieValue);
  if (cookieAnonId) {
    return { userId: cookieAnonId, newAnonId: null, accessToken: null };
  }

  const newAnonId = createAnonymousUserId();
  return { userId: newAnonId, newAnonId, accessToken: null };
}

export async function POST(req: NextRequest) {
  // Use first client IP only — full XFF chains are attacker-controllable and
  // would mint a new rate-limit key on every request if used raw.
  const ip = getPublicApiIp(req);
  const rl = await rateLimit(`tracking:${ip}`, 30, 60000);
  if (!rl.success) {
    return rateLimitedError("Too many requests", rl.reset);
  }

  try {
    const payload = await parseTrackingPayload(req);
    const productId = normalizeId(payload.productId);

    if (!productId) {
      return error(
        new ApiError(400, API_ERROR_CODES.VALIDATION_ERROR, "Missing productId"),
      );
    }

    const { userId, newAnonId, accessToken } = await resolveUserId(req);
    // Both clients share the repository's SupabaseClient contract; the
    // anon/session variant only changes which RLS role PostgREST sees.
    let persistenceClient: SupabaseClient;

    try {
      // SEC-R08: authenticated visitors persist through their own session
      // (anon key + bearer token) so the owner-scoped RLS policy on
      // user_history enforces row ownership. Cookie-only anonymous visitors
      // have no JWT to prove ownership, so their writes remain server-mediated
      // via the service-role key.
      persistenceClient = accessToken
        ? createSupabaseAuthAnonClient(accessToken)
        : createSupabaseAuthAdminClient();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[tracking] Supabase client unavailable; skipping history write.",
          error,
        );
      }
      return withAnonCookie(trackingNoopResponse(userId, productId), newAnonId);
    }

    const existing = await fetchViewedProducts(persistenceClient, userId);
    const withoutDuplicate = existing.filter((item) => item !== productId);
    const viewedProducts = [...withoutDuplicate, productId].slice(-10);

    const upsertResult = await upsertViewedProducts(persistenceClient, userId, viewedProducts);
    if (!upsertResult.ok) {
      return withAnonCookie(trackingNoopResponse(userId, productId, viewedProducts), newAnonId);
    }

    return withAnonCookie(success({ userId, viewedProducts }), newAnonId);
  } catch (err) {
    console.error("Tracking API Error:", err);
    return error(
      new ApiError(500, API_ERROR_CODES.INTERNAL_ERROR, "Tracking failed"),
    );
  }
}

/**
 * GET /api/admin/themes — List planner block themes (admin only).
 *
 * Auth: `admin` role required (enforced by `withAuth`). Rate-limited per IP.
 * Response (200): `{ success: true, themes: ThemeRow[], source }`.
 *
 * When `block_themes` is empty or unavailable, returns built-in planner
 * starter packs (woods/metals/fabrics/lighting) so the manager is usable.
 */

import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { withAuth } from "@/features/shared/api/withAuth";
import { success } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { isMissingTableError, createAdminServiceClient } from "@/platform/supabase/adminServer";
import { PLANNER_THEME_PACKS } from "@/lib/theme/plannerThemePacks";

type ThemeRow = {
  id: string;
  name: string;
  is_active: boolean;
  description?: string;
  tokens: Record<string, string>;
  tokenCount: number;
  source: "block_themes" | "starter";
};

function starterThemes(): ThemeRow[] {
  return PLANNER_THEME_PACKS.map((pack) => ({
    id: pack.id,
    name: pack.name,
    is_active: pack.is_active,
    description: pack.description,
    tokens: pack.tokens,
    tokenCount: Object.keys(pack.tokens).length,
    source: "starter" as const,
  }));
}

function normalizeTokens(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {return {};}
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") {out[key] = value;}
  }
  return out;
}

async function handleThemesGet(): Promise<NextResponse> {
  let supabase: ReturnType<typeof createAdminServiceClient> | null = null;
  try {
    supabase = createAdminServiceClient();
  } catch {
    supabase = null;
  }
  if (!supabase) {
    return success({
      themes: starterThemes(),
      source: "starter",
    });
  }

  // `block_themes` is optional at runtime (missing → starter packs). Admin
  // generated types may not list it; use a narrow query shape instead of `any`.
  type BlockThemeRow = {
    id: string;
    name: string;
    is_active: boolean;
    tokens: unknown;
  };
  type BlockThemesQuery = {
    from: (table: "block_themes") => {
      select: (columns: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<{
          data: BlockThemeRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };

  const { data, error: dbError } = await (supabase as unknown as BlockThemesQuery)
    .from("block_themes")
    .select("id, name, is_active, tokens")
    .order("created_at", { ascending: false });

  if (dbError) {
    if (isMissingTableError(dbError.message)) {
      return success({
        themes: starterThemes(),
        source: "starter",
      });
    }
    console.error("[admin/themes] GET error:", dbError.message);
    throw ApiError.fromCode(API_ERROR_CODES.INTERNAL_ERROR, "Failed to load themes.");
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return success({
      themes: starterThemes(),
      source: "starter",
    });
  }

  const themes: ThemeRow[] = rows.map((row) => {
    const tokens = normalizeTokens(row.tokens);
    return {
      id: String(row.id),
      name: String(row.name),
      is_active: Boolean(row.is_active),
      tokens,
      tokenCount: Object.keys(tokens).length,
      source: "block_themes" as const,
    };
  });

  return success({
    themes,
    source: "block_themes",
  });
}

export const GET = withAuth(
  async (_req: NextRequest) => handleThemesGet(),
  { role: "admin", rateLimitScope: "themes:list", rateLimit: 30 },
);

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { enforceAdminMutationGuard } from "@/app/api/admin/_lib/server";
import {
  contentTypeForKey,
  createR2CatalogClient,
  resolveCatalogBucketName,
} from "@/lib/storage/r2Catalog";
import { logAdminAction } from "@/lib/audit/logAdminAction";

function isThemeName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-z0-9][a-z0-9-_]{1,63}$/i.test(value.trim())
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function POST(req: NextRequest) {
  const guard = await enforceAdminMutationGuard(req, "themes:publish", 10);
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const themeName = (body as { themeName?: unknown }).themeName;
    const tokens = (body as { tokens?: unknown }).tokens;

    if (!isThemeName(themeName) || !isPlainObject(tokens)) {
      return NextResponse.json(
        { success: false, error: "Missing themeName or tokens" },
        { status: 400 },
      );
    }

    const fileKey = `themes/${themeName.trim()}.json`;
    const payload = JSON.stringify(tokens, null, 2);

    const r2Client = createR2CatalogClient();
    const bucket = resolveCatalogBucketName();

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        Body: payload,
        ContentType: contentTypeForKey(fileKey),
        CacheControl: "public, max-age=60",
      }),
    );

    void logAdminAction(guard.actorId, "theme:publish", themeName.trim());

    const cdnBase =
      process.env.CLOUDFLARE_CDN_URL?.trim() ||
      process.env.CDN_ENDPOINT?.trim() ||
      process.env.CLOUDFLARE_S3_URL?.trim() ||
      process.env.CLOULDFLARE_CDN_URL?.trim() ||
      process.env.CLOULDFLARE_S3_URL?.trim() ||
      "";
    const cdnUrl = cdnBase
      ? `${cdnBase.replace(/\/$/, "")}/${fileKey}`
      : fileKey;

    return NextResponse.json({
      success: true,
      message: "Theme successfully published to Cloudflare R2.",
      url: cdnUrl,
    });
  } catch (err: unknown) {
    console.error("CDN Upload Error:", err);
    const message = err instanceof Error ? err.message : "CDN upload failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

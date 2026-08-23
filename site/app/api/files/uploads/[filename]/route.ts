import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { UPLOADS_DIR, ensureStorageDirs, safeFilename } from "@studio/server/studioStore";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";
import type { NextRequest } from "next/server";
import { diskFileUnavailableResponse } from "../../_lib/diskFileAccess";

type Ctx = { params: Promise<{ filename: string }> };

export const GET = withAuth(
  async (_request: NextRequest, _auth: AuthContext, context: Ctx) => {
    const unavailable = diskFileUnavailableResponse("furniture");
    if (unavailable) return unavailable;

    const { filename } = await context.params;
    const safe = safeFilename(filename);
    if (!safe) return NextResponse.json({ detail: "Bad filename" }, { status: 400 });
    await ensureStorageDirs();
    try {
      const data = await fs.readFile(path.join(UPLOADS_DIR, safe));
      const ext = path.extname(safe).toLowerCase();
      const type =
        ext === ".svg"
          ? "image/svg+xml"
          : ext === ".png"
            ? "image/png"
            : "application/octet-stream";
      return new NextResponse(data, {
        headers: { "Content-Type": type, "Cache-Control": "private, max-age=60" },
      });
    } catch {
      return NextResponse.json({ detail: "Not found" }, { status: 404 });
    }
  },
  {
    role: "member",
    rateLimitScope: "files-uploads:get",
    rateLimit: 60,
  },
);

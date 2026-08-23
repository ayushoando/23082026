import { buildPublicOpenApiDocument } from "@/lib/apiCatalog";

export function GET() {
  return Response.json(buildPublicOpenApiDocument(), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

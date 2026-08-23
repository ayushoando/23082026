import { buildPublicApiDocsMarkdown } from "@/lib/apiCatalog";

export function GET() {
  return new Response(buildPublicApiDocsMarkdown(), {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

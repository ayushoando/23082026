import { SITE_URL } from "@/lib/siteUrl";

export function GET() {
  const origin = SITE_URL.replace(/\/+$/, "");
  return Response.json(
    {
      resource: origin,
      authorization_servers: [origin],
      scopes_supported: ["catalog:read", "quotes:write", "planner:read", "planner:write"],
      bearer_methods_supported: ["header"],
      resource_documentation: `${origin}/auth.md`,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}

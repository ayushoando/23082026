import { SITE_URL } from "@/lib/siteUrl";

export function GET() {
  const origin = SITE_URL.replace(/\/+$/, "");
  return Response.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}/access/`,
      token_endpoint: `${origin}/api/auth/token`,
      jwks_uri: `${origin}/.well-known/jwks.json`,
      response_types_supported: ["code", "token", "id_token"],
      grant_types_supported: ["authorization_code", "client_credentials"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "profile", "email", "catalog:read", "quotes:write"],
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

import { SITE_URL } from "@/lib/siteUrl";

export function GET() {
  const origin = SITE_URL.replace(/\/+$/, "");
  return Response.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}/access/`,
      token_endpoint: `${origin}/api/auth/token`,
      jwks_uri: `${origin}/.well-known/jwks.json`,
      registration_endpoint: `${origin}/api/agent/register`,
      scopes_supported: ["catalog:read", "quotes:write", "planner:read", "planner:write"],
      response_types_supported: ["code", "token"],
      grant_types_supported: [
        "authorization_code",
        "client_credentials",
        "urn:ietf:params:oauth:grant-type:token-exchange",
      ],
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
      service_documentation: `${origin}/auth.md`,
      agent_auth: {
        skill: `${origin}/.well-known/agent-skills/index.json`,
        register_uri: `${origin}/api/agent/register`,
        supported_methods: ["anonymous", "verified_email", "client_credentials"],
      },
      identity_types_supported: ["identity_assertion", "anonymous"],
      identity_assertion: {
        assertion_types_supported: [
          "urn:ietf:params:oauth:token-type:id-jag",
          "verified_email",
        ],
        credential_types_supported: ["bearer_token"],
        claim_uri: `${origin}/api/agent/claim`,
      },
      anonymous: {
        credential_types_supported: ["ephemeral_session"],
        claim_uri: `${origin}/api/agent/claim`,
      },
      revocation_uri: `${origin}/api/auth/revoke`,
      events_supported: [
        "https://schemas.openid.net/secevent/oauth/event-type/token-revocation",
      ],
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

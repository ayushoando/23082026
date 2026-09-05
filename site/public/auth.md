# auth.md ? One&Only Agent Registration & Authorization

This document specifies authentication, authorization, and discovery protocols for autonomous AI agents, enterprise procurement tools, and space-planning assistants interacting with the One&Only commercial workspace platform (`https://oando.co.in`).

## 1. Agent Audience & Scope

- **Audience**: Autonomous procurement agents, LLM assistants (ChatGPT, Claude, Perplexity, Meta-ExternalAgent), interior architectural bots, and corporate facility procurement systems.
- **Scope**: Commercial office furniture catalog lookup, product dimension extraction, 2D/3D workspace planning layout generation, and enterprise Request For Quotation (RFQ) processing.

## 2. Discovery Endpoints

One&Only publishes standard discovery documents per RFC 8414, RFC 9727, RFC 8288, and the Agent Skills / ACP specifications:

- **OAuth Protected Resource Metadata (PRM)**: `https://oando.co.in/.well-known/oauth-protected-resource`
- **OAuth Authorization Server Metadata**: `https://oando.co.in/.well-known/oauth-authorization-server`
- **OpenID Connect Discovery**: `https://oando.co.in/.well-known/openid-configuration`
- **JSON Web Key Set (JWKS)**: `https://oando.co.in/.well-known/jwks.json`
- **A2A Agent Card**: `https://oando.co.in/.well-known/agent-card.json`
- **Agent Skills Discovery Index**: `https://oando.co.in/.well-known/agent-skills/index.json`
- **Agentic Commerce Protocol (ACP)**: `https://oando.co.in/.well-known/acp.json`
- **API Catalog**: `https://oando.co.in/.well-known/api-catalog`

## 3. Supported Authentication Methods

### Method A: Anonymous Read Access (Default)
All public product catalog routes, categories, specifications, CAD assets, and marketing photography require no authentication or credentials:
- `GET https://oando.co.in/products`
- `GET https://oando.co.in/products/{category}`
- `GET https://oando.co.in/products/{category}/{slug}`

### Method B: Verified Client & RFQ Submissions
Commercial inquiries and RFQ submissions are authenticated via contact email verification and rate-limited session tokens:
- **Endpoint**: `POST https://oando.co.in/api/customer-queries`
- **Content-Type**: `application/json`
- **Claim URI**: `https://oando.co.in/api/agent/claim`

### Method C: OAuth 2.0 / OIDC Bearer Tokens
Authenticated agent operations utilize standard OAuth Bearer tokens in the `Authorization` header:
```http
Authorization: Bearer <access_token>
```
- **Issuer**: `https://oando.co.in`
- **Token Endpoint**: `https://oando.co.in/api/auth/token`
- **Registration URI**: `https://oando.co.in/api/agent/register`
- **Identity Assertions**: Supports ID-JAG assertion (`urn:ietf:params:oauth:token-type:id-jag`) and `verified_email`.
- **Supported Scopes**: `catalog:read`, `quotes:write`, `planner:read`, `planner:write`.

## 4. Skills Reference

Agents can discover machine-readable skills at `https://oando.co.in/.well-known/agent-skills/index.json`:
- `oando-catalog-discovery`: Browse commercial furniture catalog, dimensions, and materials.
- `oando-rfq-enquiry`: Submit project proposals, seat counts, and tender documents.

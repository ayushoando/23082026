# SEO & Security Audit Plan

**Created:** 2026-08-31
**Status:** Audit complete, remedy plan ready for execution
**Owner:** Repository owner

## Documents

| Document | Purpose |
|---|---|
| [`security-audit-report.md`](./security-audit-report.md) | Full security audit: 64 API routes, auth, CSRF, rate limiting, XSS, secrets, headers, worker proxy |
| [`seo-audit-report.md`](./seo-audit-report.md) | Full SEO audit: Google Search Console analysis, structured data, sitemap, robots, indexing crisis |
| [`remedy-plan.md`](./remedy-plan.md) | Prioritized 4-wave remedy plan with code examples and timelines |

## Key Findings

### Security
- **2 Critical:** No middleware.ts for auth enforcement; no CSP on HTML pages
- **4 High:** File routes unprotected, metrics endpoint exposed, origin check bypass, missing rate limits
- **5 Medium:** No CORS policy, static admin token, tracking uses service role key, upload pre-check
- **Strengths:** withAuth HOF, CSRF (timing-safe), rate limiting (dual backend), secret isolation, sanitized JSON-LD

### SEO
- **Indexing crisis:** 31 indexed / 198 not-indexed (as of Aug 21, 2026)
- **59 pages returning 404** — missing redirects for legacy URLs
- **Jun 6-9 incident:** Indexed pages dropped from 12 to 1 — needs root cause analysis
- **Strengths:** Excellent structured data (7+ types), dynamic sitemap, canonical URLs, OG/Twitter cards, 60+ redirects

## Data Sources
- Codebase static analysis (64 API route handlers, auth files, security config)
- Google Search Console export: `results/stupidgoogle/`
- OWASP Top 10 2025, Next.js security best practices, Supabase security checklist

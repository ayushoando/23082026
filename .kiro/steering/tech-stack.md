---
inclusion: always
---

# Tech Stack

## Application and Toolchain

- The product is a Next.js 16 App Router application under `site/`, written in TypeScript and React 19.
- Install and run the monorepo from the repository root with pnpm. Product dependencies are declared in the root `package.json`; there is no separate `site/package.json`.
- The primary application TypeScript configuration is `site/tsconfig.json`.
- The root `typecheck:scripts` command is unavailable because its referenced `scripts/tsconfig.json` file is absent; do not offer it as validation.
- Styling uses Tailwind CSS v4 through `@tailwindcss/postcss`, with the repo's FOCSS token and zone layer under `site/focss/`.
- Linting uses oxlint through the root pnpm scripts and `.oxlintrc.json`.

## Data and AI

- Supabase provides two separate Postgres databases. Products (`erpweaiypimorcunaimz`) owns the marketing catalog and configurator; Admin (`rxzpznmxbaoxpikowmfc`) owns staff/customer data, plans, furniture, and descriptors.
- Products migrations live in `site/platform/supabase/migrations/`; Admin migrations live in `site/platform/supabase/migrations.admin/`.
- Drizzle ORM definitions live under `site/platform/drizzle/schema/`; deployable database changes still go through the appropriate Supabase migration directory.
- AI and retrieval use Mastra with Amazon Bedrock, LanceDB vector search, Orama full-text search, and Fuse.js fuzzy catalog search. The server-side AI modules live under `site/lib/ai/mastra/`.

## Testing and Deployment

- Vitest covers unit and integration tests; Playwright covers end-to-end and browser workflows. Test sources and shared configuration live under `tests/` and `config/build/`.
- Vercel deploys the Next.js application using `vercel.json`.
- The Cloudflare Worker under `workers/oando-worker-proxy/` fronts the Vercel origin and binds Cloudflare R2 for asset delivery; R2 backup and catalog operations are exposed through root pnpm commands.

## Observability and Analytics

- OpenTelemetry is registered in `site/instrumentation.ts` through `@vercel/otel`.
- Prometheus metrics are implemented in `site/lib/observability/metrics.ts`; local Prometheus and Grafana configuration lives under `config/observability/`.
- Vercel Analytics and Speed Insights are mounted by `site/components/site/SiteAnalytics.tsx` and remain consent-gated.
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.
# Tech Stack

## Core Framework
- Next.js 14+ (App Router) with TypeScript
- React with hooks-based architecture
- Tailwind CSS for all styling — no inline styles, no CSS modules
- ESLint configured via `eslint.config.mjs`

## Database & Auth
- Supabase (Postgres) — migrations live in `/supabase/`
- Use Supabase client from `/lib/` — never initialize directly in components
- All DB schema changes go through Supabase migration files

## Deployment
- Vercel — config in `vercel.json`
- Environment variables managed via Vercel dashboard + `.env.local` locally

## Testing
- Playwright for E2E tests — located in `/tests/`, reports in `/playwright-report/`
- Run tests before any major deployment

## Key Directories
- `/app` — Next.js App Router pages and layouts
- `/components` — reusable React components
- `/lib` — shared utilities, Supabase client, helpers
- `/hooks` — custom React hooks
- `/data` — static data, seed files
- `/scripts` — one-off migration/utility scripts
- `/public` — static assets
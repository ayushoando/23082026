---
inclusion: always
---

# Coding Standards

## General Rules
- Always use TypeScript — no `.js` files in `site/app/`, `site/components/`, `site/lib/`, or `site/hooks/`
- Use named exports, not default exports for components
- Prefer `async/await` over `.then()` chains
- Never commit `.env` files — use `.env.local` locally

## Component Rules
- One component per file
- Props must be typed with an interface, not inline types
- No business logic in `site/app/**/page.tsx` files — extract to `site/hooks/` or `site/lib/` functions
- Use Tailwind utility classes only — no custom CSS unless absolutely necessary

## Database Rules
- All Supabase queries go through helper functions under `site/lib/`
- Put Products database migrations in `site/platform/supabase/migrations/`
- Put Admin database migrations in `site/platform/supabase/migrations.admin/`
- Never write raw SQL in `site/components/` or `site/app/**/page.tsx` files
- Use RLS (Row Level Security) — never bypass with service role key on client side

## File Naming
- Components under `site/components/`: `PascalCase.tsx`
- Hooks under `site/hooks/`: `useFeatureName.ts`
- Utilities under `site/lib/`: `camelCase.ts`
- Pages under `site/app/`: Next.js App Router convention (`page.tsx`, `layout.tsx`)

## Cleanup (Important)
- Do NOT commit build logs, link error files, or `.txt` audit files to the repo
- Files like `build-error.log`, `link_errors.json`, `unique_broken.txt` should be in `.gitignore`
# Coding Standards

## General Rules
- Always use TypeScript — no `.js` files in `/app`, `/components`, `/lib`, `/hooks`
- Use named exports, not default exports for components
- Prefer `async/await` over `.then()` chains
- Never commit `.env` files — use `.env.local` locally

## Component Rules
- One component per file
- Props must be typed with an interface, not inline types
- No business logic in page files — extract to hooks or lib functions
- Use Tailwind utility classes only — no custom CSS unless absolutely necessary

## Database Rules
- All Supabase queries go through `/lib/` helper functions
- Never write raw SQL in components or pages
- Use RLS (Row Level Security) — never bypass with service role key on client side

## File Naming
- Components: `PascalCase.tsx`
- Hooks: `useFeatureName.ts`
- Utilities: `camelCase.ts`
- Pages: Next.js App Router convention (`page.tsx`, `layout.tsx`)

## Cleanup (Important)
- Do NOT commit build logs, link error files, or `.txt` audit files to the repo
- Files like `build-error.log`, `link_errors.json`, `unique_broken.txt` should be in `.gitignore`
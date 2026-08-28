# Technology Stack

## Core Framework & Language
* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript 
* **Package Manager:** pnpm 

## Frontend & UI
* **Libraries:** React 19, React DOM 19
* **Styling:** Tailwind CSS v4, `clsx`, `tailwind-merge`
* **Animations:** GSAP (`@gsap/react`), Framer Motion, `tw-animate-css`
* **State Management:** Zustand (global state), TanStack React Query (async state)
* **Forms & Validation:** React Hook Form, Zod (`@hookform/resolvers`)
* **Components:** React Aria Components, Embla Carousel

## Backend & Data
* **Database & Auth:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`), PostgreSQL
* **ORM:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)

## AI, Vectors & Search
* **Agent Framework:** Mastra (`@mastra/core`, `@mastra/memory`, `@mastra/rag`)
* **LLM Provider:** AWS Bedrock (`@ai-sdk/amazon-bedrock`)
* **Vector/Search DB:** LanceDB (`@lancedb/lancedb`), Orama, Fuse.js

## Testing & Observability
* **Testing:** Playwright (E2E), Vitest (Unit/Component), Testing Library
* **Observability:** Datadog RUM, Vercel Analytics, Vercel Speed Insights, OpenTelemetry (`@vercel/otel`)
* **Emails:** Resend
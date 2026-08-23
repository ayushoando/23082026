# Research — Supplementary Best Practices (P3)

**Task:** `research_practices` · **Scope:** AI/LanceDB vector search in Next.js, canvas-based configurator patterns, CRM telemetry event design. **Format:** concise, grounded (URL per claim), supplementary to [`plans/PLAN.md`](../plans/PLAN.md).

---

## 1. AI / LanceDB vector search in Next.js

- **LanceDB** is an open-source multimodal AI lakehouse built on the Lance columnar format; supports vector similarity search, full-text search, and SQL; ships native **TypeScript SDK** (`@lancedb/lancedb`), plus Python/Rust/REST. Cloud offers serverless production vector search.
  - `https://github.com/lancedb/lancedb` (README: Key Features, Ecosystem, Products); TS SDK ref `https://lancedb.github.io/lancedb/js/globals/`
- **Server-side only + lazy init** is the correct Next.js pattern: the project wraps LanceDB in `lanceVectorStore.ts`, imports `"server-only"`, opens a single cached `Connection` (`getLanceCatalogVectorStore()`), resolves URI from `LANCE_DB_URI` or defaults to local `.data/lancedb/catalog`, and guards local `mkdirSync` with `assertDevDiskWritable` (EROFS in prod). This keeps the vector store out of client bundles and off the read-only prod FS.
  - local `site/lib/ai/mastra/lanceVectorStore.ts`
- Embeddings are produced with Mastra's `embedV2` using **Gemini `gemini-embedding-001`, 768-dim**, with an OpenRouter fallback; a `catalogRag.ts` module builds typed `CatalogVectorDocument`s (product/category/page) and uses Mastra's `createVectorQueryTool` for semantic recall. `catalog_nav` index, cosine similarity.
  - local `site/lib/ai/mastra/embedder.ts`, `site/lib/ai/mastra/catalogRag.ts`, `docs/architecture/stack.md` (AI / LanceDB)
- Pattern takeaway: keep a dedicated vector-store adapter (`extends MastraVector`) so DB swap (remote `LANCE_DB_URI`) is config-only; gate recall behind an "embeddings available" flag (`isVectorRecallEnabled()`).

## 2. Canvas-based configurator patterns

- **Scene-graph / object-oriented canvas** is the dominant pattern: Konva advertises "high-performance 2D graphics with an object-oriented API" and its React binding (`react-konva`) exposes shapes (`Rect`, `Circle`, `Text`, …) as JSX components with **drag-and-drop**, events, select/transform, **groups+layers**, and undo/redo — matching a spatial configurator (drag furniture, transform, nest groups, animate).
  - `https://konvajs.org/docs/react/index.html` (Konva project metadata, react-konva overview)
- **Declarative data flow:** with `react-konva` you hold geometry in React state/data and render canvas the same way as React DOM; use `onDragEnd`/`onTransformEnd` to persist state (not live drag ticks). The package must match the React major version (react-konva 18 ↔ React 18, current ↔ React 19).
  - `https://konvajs.org/docs/react/index.html`
- Perf note: this repo scales canvas rendering at **Studio 0.2 px/mm vs Planner 0.05 px/mm** — transform/snap helpers must stay in sync with that scale factor and use layers/groups to bound redraws.
  - local `docs/architecture/stack.md`

## 3. CRM telemetry event design

- **Typed, first-party event taxonomies** are the established approach: define a fixed set of named events with a schema, buffer client-side, and flush in batches (project buffers in memory and flushes **batches of 10 or every 5 s** via Beacon API keepalive). Recursively scrub PII before dispatch.
  - project: local `site/lib/analytics/siteEvents.ts`, `site/lib/analytics/beaconTransport.ts`
- **Insert-only + RLS** telemetry tables: PostgreSQL `analytics_events` must reject `UPDATE`/`DELETE` via strict insert-only RLS; zero PII rule; `-- rollback` migration tag. This is a first-party alternative to third-party tag managers (PostHog-style capture-at-edge).
  - local `supabase/admin-migrations/`, `docs/database/schema.md`
- Back-office triage lifecycle modeled as status machine: `New → In Progress → Contacted → Closed`, with optimistic UI updates and staff notes (timestamped, author id). Honeypot + IP rate limiting + CSRF protect the public intake origin.
  - local `site/app/api/customer-queries/route.ts`, `docs/architecture/routes.md`
- Naming/property guidance aligns with industry analytics tools (PostHog/Segment-style `event` + typed `properties`); keep property names snake_case and ids namespaced (e.g. `product:${id}`) to avoid collisions and enable funnel joins.
  - `https://posthog.com/docs/product-analytics/capture-events` (event + property model)

---

## Key citations (URLs)

- LanceDB — https://github.com/lancedb/lancedb · TS SDK https://lancedb.github.io/lancedb/js/globals/
- react-konva / Konva — https://konvajs.org/docs/react/index.html
- PostHog events model — https://posthog.com/docs/product-analytics/capture-events
- Local: `AGENTS.md`, `plans/README.md`, `plans/PLAN.md`, `site/lib/ai/mastra/{lanceVectorStore,embedder,catalogRag}.ts`, `site/lib/analytics/*`

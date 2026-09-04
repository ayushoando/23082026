import { MermaidDiagram } from '../components/MermaidDiagram'
import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { GeneratedKeyValueTable, GeneratedSimpleTable } from '../components/GeneratedDataTables'
import { LiveRepoSection } from '../components/LiveRepoSection'
import {
  databaseCommands,
  databaseMigrations,
  databaseTables,
} from '../data/databaseData'
import { databaseBoundaries, databasePersistenceRoutes } from '../data/databaseBoundaries'

const schemaDiagram = `erDiagram
    profiles ||--o{ oando_plans : owns
    profiles ||--o{ planner_operation_idempotency : owns
    catalog_products ||--o{ catalog_product_images : has
    catalog_products ||--o{ catalog_product_specs : describes
    catalog_products ||--o{ catalog_product_slug_aliases : resolves
    planner_managed_products ||--o{ svg_revisions : publishes
    svg_revisions ||--o{ svg_revision_artifacts : emits

    profiles {
        uuid id PK
        text display_name
        text avatar_url
        timestamptz created_at
    }
    oando_plans {
        uuid id PK
        uuid user_id FK
        text name
        text engine
        jsonb payload
        text status
        bigint revision
        integer schema_version
        timestamptz created_at
        timestamptz updated_at
    }
    planner_operation_idempotency {
        uuid owner_id FK
        text operation
        uuid project_id
        text idempotency_key
        text response_status
        bigint response_revision
    }
    audit_events {
        uuid id PK
        uuid team_id
        uuid actor_id
        text action
        jsonb metadata
        timestamptz created_at
    }
    furniture_catalog {
        text id PK
        text name
        text category
        jsonb dimensions
        text thumbnail_url
        jsonb top_fabric_json
        timestamptz updated_at
    }
    block_descriptors {
        text slug PK
        integer current_version
        text current_checksum
        jsonb descriptor
        text lifecycle
        timestamptz updated_at
    }
    catalog_products {
        uuid id PK
        text slug
        text name
        text category
        text flagship_image
        jsonb specs
        jsonb metadata
    }
    catalog_product_images {
        uuid id PK
        uuid product_id FK
        text image_url
        text image_kind
        int sort_order
    }
    catalog_product_specs {
        uuid product_id PK
        jsonb specs
        text source
    }
    catalog_product_slug_aliases {
        uuid id PK
        text alias_slug
        text canonical_slug
        boolean is_active
    }
    configurator_products {
        uuid id PK
        text slug
        text name
        text category
        text sizing_type
        jsonb size_options
        boolean active
    }
    planner_managed_products {
        uuid id PK
        text slug
        text planner_source_slug
        text name
        text category
        jsonb specs
        boolean active
        text published_svg_revision_id
    }
    svg_revisions {
        text revision_id PK
        text slug
        integer version
        jsonb definition
        timestamptz published_at
    }
    svg_revision_artifacts {
        uuid id PK
        text revision_id FK
        text kind
        text checksum
        text storage_key
    }`

const rlsDiagram = `flowchart LR
    Client["Client Request<br/>+ JWT"]
    Supa["Supabase API"]
    RLS["RLS Policies<br/>Admin owned data"]
    DB[("PostgreSQL")]
    Result{"Filtered<br/>Rows"}
    Service["Service role<br/>ops/admin scripts"]

    Client --> Supa
    Supa --> RLS
    RLS --> DB
    Service --> DB
    DB --> Result

    Result -->|auth.uid owns row| Pass["Rows returned"]
    Result -->|not owner| Empty["No rows"]

    style RLS fill:#0E1925,stroke:#22c55e
    style Service fill:#0E1925,stroke:#38bdf8
    style Pass fill:#0E1925,stroke:#22c55e
    style Empty fill:#221E16,stroke:#ef4444`

const migrationCommands = [
  { cmd: 'pnpm run db:apply', desc: 'Apply pending migrations to linked Supabase' },
  { cmd: 'pnpm run ops db:sync-drizzle', desc: 'Sync Drizzle schema to Supabase' },
  { cmd: 'pnpm run db:types', desc: 'Generate TypeScript types from Supabase schema' },
  { cmd: 'pnpm run db:types:admin', desc: 'Generate admin-specific types' },
  { cmd: 'pnpm run ops db:advisors:security', desc: 'Run security advisor checks' },
  { cmd: 'pnpm run ops db:advisors:performance', desc: 'Run performance advisor checks' },
  { cmd: 'pnpm run db:test', desc: 'Test database connection' },
  { cmd: 'pnpm run ops db:ensure-plans', desc: 'Ensure plans table exists' },
  { cmd: 'pnpm run ops db:backup-dropped', desc: 'Backup dropped tables before changes' },
  { cmd: 'pnpm run ops seed', desc: 'Seed development data' },
]

export function Database() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Database</h1>
        <p className="section-subheading">
          PostgreSQL on Supabase — schema design, Drizzle ORM, migrations, and Row Level Security.
        </p>
      </header>

      <section id="projects" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Two Supabase projects</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Customer/staff data lives on <strong className="text-docs-text">Admin</strong>; catalog/configurator data on{' '}
          <strong className="text-docs-text">Products</strong>. Never dual-write between them. Mode-aware wrappers pick disk vs Supabase in dev.
        </p>
        <div className="overflow-x-auto rounded-xl border border-docs-border mb-6">
          <table className="w-full text-left text-sm leading-relaxed">
            <thead className="bg-docs-surface-raised text-xs uppercase tracking-wide text-docs-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Project ID</th>
                <th className="px-4 py-3 font-medium">Env (URL / anon / service)</th>
                <th className="px-4 py-3 font-medium">Code entry</th>
              </tr>
            </thead>
            <tbody>
              {databaseBoundaries.map((row) => (
                <tr key={row.projectId} className="border-t border-docs-border/80 align-top">
                  <td className="px-4 py-3 text-docs-text-strong text-xs">{row.role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-600">{row.projectId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text-muted break-all">
                    {row.urlEnv} · {row.anonKeyEnv} · {row.serviceRoleEnv}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text break-all">{row.serverEntry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3">Persistence routes (not HTTP)</h3>
        <div className="overflow-x-auto rounded-xl border border-docs-border">
          <table className="w-full text-left text-sm leading-relaxed">
            <thead className="bg-docs-surface-raised text-xs uppercase tracking-wide text-docs-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Dev</th>
                <th className="px-4 py-3 font-medium">Prod</th>
                <th className="px-4 py-3 font-medium">Selector module</th>
              </tr>
            </thead>
            <tbody>
              {databasePersistenceRoutes.map((row) => (
                <tr key={row.domain} className="border-t border-docs-border/80 align-top">
                  <td className="px-4 py-3 font-medium text-docs-text-strong">{row.domain}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text-muted break-all">{row.dev}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text-muted break-all">{row.prod}</td>
                  <td className="px-4 py-3 font-mono text-xs text-docs-text break-all">{row.selector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Schema */}
      <section id="schema" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Schema Overview</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          The live schema is split by authority: Admin stores Planner saves, profiles, audit, furniture, and
          published block descriptors; Products stores the marketing catalog, configurator rows, feature-facing
          catalog records, and SVG publication metadata.
        </p>
        <MermaidDiagram chart={schemaDiagram} title="Entity Relationship Diagram" />
      </section>

      {/* RLS */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Row Level Security (RLS)</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          User-owned Planner data is protected on Admin with owner-scoped RLS policies over{' '}
          <code className="text-brand-400 bg-docs-surface px-1 rounded">oando_plans</code> and
          idempotency receipts. Shared furniture is guest-readable, block descriptors are service-role only,
          and backup/admin scripts must use service-role credentials deliberately.
        </p>
        <MermaidDiagram chart={rlsDiagram} title="RLS Policy Enforcement" />

        <div className="mt-6">
          <CodeBlock
            title="Example RLS policy (SQL migration)"
            language="sql"
            code={`-- Enable RLS on the live Planner table
alter table public.oando_plans enable row level security;

-- Authenticated users can only see their own Planner saves
create policy oando_plans_authenticated_select_own
  on public.oando_plans for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can only insert rows they own
create policy oando_plans_authenticated_insert_own
  on public.oando_plans for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Direct table updates stay owner-scoped; app mutations use planner_mutate_plan_v1
create policy oando_plans_authenticated_update_own
  on public.oando_plans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy oando_plans_authenticated_delete_own
  on public.oando_plans for delete
  to authenticated
  using (auth.uid() = user_id);`}
          />
        </div>
      </section>

      {/* Drizzle ORM */}
      <section id="drizzle" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Drizzle ORM</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Drizzle provides type-safe schema definitions and a query builder that compiles to SQL. It runs alongside 
          the Supabase client for direct DB access in scripts and server routes.
        </p>

        <CollapsibleSection title="Schema Definition (Drizzle)">
          <CodeBlock
            title="drizzle schema (pattern)"
            language="typescript"
            code={`import { bigint, boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at'),
})

export const plans = pgTable('oando_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  engine: text('engine').notNull(),
  payload: jsonb('payload').notNull().default({}),
  status: text('status').notNull().default('draft'),
  revision: bigint('revision', { mode: 'number' }).notNull().default(1),
  schemaVersion: integer('schema_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const catalogProducts = pgTable('catalog_products', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category'),
  flagshipImage: text('flagship_image'),
  specs: jsonb('specs'),
  metadata: jsonb('metadata'),
})

export const furnitureCatalog = pgTable('furniture_catalog', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull().default('uncategorized'),
  dimensions: jsonb('dimensions').notNull().default({}),
  isCustom: boolean('is_custom').notNull().default(true),
})`}
          />
        </CollapsibleSection>

        <div className="mt-4">
          <CollapsibleSection title="Query Example" defaultOpen={false}>
            <CodeBlock
              title="drizzle query (pattern)"
              language="typescript"
              code={`import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, desc } from 'drizzle-orm'
import postgres from 'postgres'
import { plans } from './schema/planner'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// Fetch a user's Admin-backed Planner saves
export async function getUserPlans(userId: string) {
  return db
    .select({
      id: plans.id,
      name: plans.name,
      payload: plans.payload,
      revision: plans.revision,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.updatedAt))
}

// Insert a new ooplanner save
export async function createPlan(userId: string, name: string, payload: unknown) {
  const [plan] = await db
    .insert(plans)
    .values({ userId, name, engine: 'ooplanner', payload })
    .returning()
  return plan
}`}
            />
          </CollapsibleSection>
        </div>
      </section>

      {/* Migrations */}
      <section id="migrations" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-docs-text-strong mb-2">Migrations</h2>
        <p className="text-sm text-docs-text-muted mb-4">
          Migrations are applied through dedicated scripts for the Products and Admin projects. Apply dry-runs
          first, keep rollback blocks, and regenerate both Products and Admin Supabase types after schema changes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {migrationCommands.map(({ cmd, desc }) => (
            <div key={cmd} className="card flex flex-col gap-1">
              <code className="text-brand-400 text-xs font-mono">{cmd}</code>
              <span className="text-docs-text-subtle text-xs font-sans">{desc}</span>
            </div>
          ))}
        </div>

        <CodeBlock
          title="scripts/db_apply_migrations.ts (pattern)"
          language="typescript"
          code={`import postgres from 'postgres'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

async function applyMigrations() {
  const migrationsDir = join(process.cwd(), 'config/database/migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), 'utf8')
    console.log(\`Applying \${file}...\`)
    await sql.unsafe(content)
  }

  console.log(\`Applied \${files.length} migrations\`)
  await sql.end()
}

applyMigrations().catch((err) => {
  console.error(err)
  process.exit(1)
})`}
        />
      </section>

      {/* Generated types */}
      <section className="mb-12">
        <CollapsibleSection title="Generated TypeScript Types" badge="Type Safety">
          <div className="space-y-3 text-sm text-docs-text-muted">
            <p>
              Supabase generates TypeScript types from the live database schemas into{' '}
              <code className="text-brand-400 bg-docs-surface px-1 rounded">site/platform/types/database.types.ts</code>
              {' '}and{' '}
              <code className="text-brand-400 bg-docs-surface px-1 rounded">site/platform/types/database.admin.types.ts</code>.
              These power the typed Supabase client so queries are fully type-checked at compile time.
            </p>
            <CodeBlock
              title="Generated types (excerpt)"
              language="typescript"
              code={`export type AdminDatabase = {
  public: {
    Tables: {
      oando_plans: {
        Row: {
          id: string
          user_id: string
          name: string
          engine: string
          payload: Json
          revision: number
          schema_version: number
          created_at: string
          updated_at: string
        }
      }
      furniture_catalog: {
        Row: {
          id: string
          name: string
          category: string
          dimensions: Json
          is_custom: boolean
        }
      }
      block_descriptors: {
        Row: {
          slug: string
          current_version: number
          descriptor: Json
          lifecycle: string
        }
      }
    }
  }
}

export type ProductsDatabase = {
  public: {
    Tables: {
      catalog_products: { Row: { id: string; slug: string; name: string; specs: Json | null } }
      configurator_products: { Row: { id: string; slug: string; sizing_type: string; active: boolean } }
      planner_managed_products: { Row: { id: string; slug: string; published_svg_revision_id: string | null } }
    }
  }
}`}
            />
          </div>
        </CollapsibleSection>
      </section>

      <LiveRepoSection title="Live database inventory">
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3">Tables</h3>
        <GeneratedSimpleTable
          columns={[
            { key: 'name', header: 'Table' },
            { key: 'sourcePath', header: 'Source' },
          ]}
          rows={databaseTables.map((table) => ({
            name: table.name,
            sourcePath: table.sourcePath,
          }))}
        />
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3 mt-8">Migrations</h3>
        <GeneratedSimpleTable
          columns={[
            { key: 'path', header: 'Migration' },
            { key: 'sourcePath', header: 'Source' },
          ]}
          rows={databaseMigrations.map((migration) => ({
            path: migration.path,
            sourcePath: migration.sourcePath,
          }))}
        />
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3 mt-8">DB scripts</h3>
        <GeneratedKeyValueTable
          rows={databaseCommands.map((command) => ({
            label: command.scriptName,
            value: command.command,
            sourcePath: command.sourcePath,
            sourcePointer: command.sourcePointer,
          }))}
        />
      </LiveRepoSection>
    </div>
  )
}

// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Task 6.4: Fixture-based unit/integration tests for extractor surfaces.
//
// Validates: Requirements 2.1, 2.3, 3.1, 3.4, 4.1, 4.2, 4.4, 5.1, 5.4, 7.1, 8.1, 9.3
//
// All fixtures are repository-local strings. No provider, network, or service
// access is performed.

import { describe, expect, it } from "vitest";

import {
  compareAlignment,
  extractDatabaseReview,
  extractMonitoringReview,
  extractR2WorkflowReview,
  extractVercelReview,
  extractWorkerReview,
  redactSecrets,
  validateOutputPath,
  type AlignmentInput,
  type DatabaseReviewSources,
  type MonitoringReviewSources,
  type R2WorkflowReviewSources,
  type RepositorySource,
  type VercelExtractionSources,
  type WorkerReviewSources,
} from "../../scripts/operations-review";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function src(filePath: string, content: string): RepositorySource {
  return {
    content,
    source: {
      path: filePath,
      locator: "fixture",
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `sha256-fixture-${filePath.replace(/[^a-z0-9]/gi, "-")}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Vercel extractor fixtures
// ---------------------------------------------------------------------------

// The extractor checks for these exact literal substrings in packageManifest / operationsRouter
// so fixtures must produce them verbatim (not via JSON.stringify which omits spaces).
const VERCEL_PACKAGE_MANIFEST_CONTENT = `{
  "scripts": {
    "vercel:prod": "node scripts/run-ops.mjs vercel:prod",
    "vercel:preview": "node scripts/run-ops.mjs vercel:preview"
  }
}`;

const VERCEL_OPERATIONS_ROUTER_CONTENT = [
  '"vercel:prod": () => execSync("vercel --prod --yes")',
  '"vercel:preview": () => execSync("vercel --yes")',
].join("\n");

function makeVercelSources(overrides?: Partial<VercelExtractionSources>): VercelExtractionSources {
  return {
    vercelConfig: src(
      "vercel.json",
      JSON.stringify({
        buildCommand: "pnpm run build",
        installCommand: "pnpm install --frozen-lockfile",
        outputDirectory: ".next",
        framework: "nextjs",
        regions: ["sin1"],
      }),
    ),
    packageManifest: src("package.json", VERCEL_PACKAGE_MANIFEST_CONTENT),
    operationsRouter: src("scripts/run-ops.mjs", VERCEL_OPERATIONS_ROUTER_CONTENT),
    runbook: src(
      "OPERATIONS_RUNBOOK.md",
      [
        "## 1. Deploy",
        "Order: **migrations → seed → code.**",
        "```",
        "pnpm run vercel:prod",
        "```",
        "Smoke in browser: /ooplanner rail, place, save, reload",
        "## 4. Rollback",
        "Revert migrations newest-first. Instant Rollback once schema safe.",
        "§4 Rollback: schema-before-code ordering and compatibility hazard",
      ].join("\n"),
    ),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Worker extractor fixtures
// ---------------------------------------------------------------------------

// Worker package.json and root package.json must include the exact literal
// strings that requireText() checks for — use verbatim content, not JSON.stringify.
const WORKER_PACKAGE_CONTENT = `{
  "scripts": {
    "deploy": "wrangler deploy"
  }
}`;

const WORKER_ROOT_PACKAGE_CONTENT = `{
  "scripts": {
    "worker:deploy": "pnpm --dir workers/oando-worker-proxy deploy"
  }
}`;

function makeWorkerSources(overrides?: Partial<WorkerReviewSources>): WorkerReviewSources {
  return {
    wrangler: src(
      "workers/oando-worker-proxy/wrangler.toml",
      [
        'main = "src/index.js"',
        'name = "oando-worker-proxy"',
        "",
        "[[r2_buckets]]",
        'binding = "ASSET_BUCKET"',
        'bucket_name = "oando-asset-cdn"',
        "",
        "[vars]",
        'VERCEL_ORIGIN = "https://oando1408.vercel.app"',
      ].join("\n"),
    ),
    workerSource: src(
      "workers/oando-worker-proxy/src/index.js",
      [
        "const object = await env.ASSET_BUCKET.get(key);",
        "if (object) { return new Response(object.body, { headers: { 'x-oando-proxy': 'r2' } }); }",
        "let r2Errored = false;",
        "try {",
        "  await env.ASSET_BUCKET.get(key);",
        "} catch (e) {",
        "  r2Errored = true;",
        "}",
        "if (isAssetPath && !assetObject && !r2Errored) {",
        "  return new Response(null, { headers: { 'x-oando-proxy': 'r2-fallback' } });",
        "}",
        "const upstream = env.VERCEL_ORIGIN;",
        "return await fetch(upstreamRequest);",
        "return new Response('r2-fallback', { status: 404 });",
      ].join("\n"),
    ),
    rootPackage: src("package.json", WORKER_ROOT_PACKAGE_CONTENT),
    workerPackage: src("workers/oando-worker-proxy/package.json", WORKER_PACKAGE_CONTENT),
    runbook: src(
      "OPERATIONS_RUNBOOK.md",
      [
        "## 1. Deploy",
        "### Edge worker",
        "pnpm run worker:deploy",
        "Verify dead asset path and valid asset response headers",
        "Expected: x-oando-proxy: r2-fallback for dead asset, x-oando-proxy: r2` for valid asset, 200 image/png",
      ].join("\n"),
    ),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Database extractor fixtures
// ---------------------------------------------------------------------------

const PRODUCTS_MIGRATION_CONTENT = `-- migration: create_products_table
CREATE TABLE products (id uuid PRIMARY KEY);

-- rollback
DROP TABLE products;`;

const ADMIN_MIGRATION_CONTENT = `-- migration: create_admin_table
CREATE TABLE admin_profiles (id uuid PRIMARY KEY);

-- rollback
DROP TABLE admin_profiles;`;

const DATABASE_OPS_CONTENT = [
  "## 1. Nightly Backups",
  "| Path | DB |",
  "|------|-----|",
  "| `backups/products/pgdump-products-*.dump` | Products DB |",
  "| `backups/admin/pgdump-admin-*.dump` | Admin DB |",
  "| `backups/catalog/catalog-latest.json` | Catalog snapshot for degraded reads |",
  "| `backups/repo/oofplweb-*.zip` | Git archive |",
  "",
  "Owner: database-ops-team",
  "Retention: 30 days",
  "",
  "## 3. Restore from R2",
  "Download the artifact from R2 and restore with pg_restore. Supabase provider restore available.",
  "pitr: point-in-time recovery available via Supabase dashboard.",
].join("\n");

const RUNBOOK_CONTENT = [
  "## 0. Environments",
  "| Env | Supabase | Filesystem |",
  "Prod uses Supabase only. DEV_AUTH_BYPASS never enabled in prod.",
  "",
  "## 1. Deploy",
  "Order: **migrations → seed → code.**",
  "```",
  "pnpm run vercel:prod",
  "```",
  "Smoke in browser: /ooplanner rail, place, save, reload",
  "pnpm run db:test",
  "",
  "## 4. Rollback",
  "Revert migrations newest-first. Instant Rollback once schema safe.",
  "schema rollback ordering before code rollback.",
  "",
  "## 6. Backups",
  "both DBs must have a confirmed backup before any release.",
  "restore drill required for both Products and Admin.",
  "Owner: ops-team",
].join("\n");

function makeDatabaseSources(overrides?: Partial<DatabaseReviewSources>): DatabaseReviewSources {
  return {
    runbook: src("OPERATIONS_RUNBOOK.md", RUNBOOK_CONTENT),
    productsMigrationsDir: [
      src("site/platform/supabase/migrations/001_create_products.sql", PRODUCTS_MIGRATION_CONTENT),
    ],
    adminMigrationsDir: [
      src("site/platform/supabase/migrations.admin/001_create_admin.sql", ADMIN_MIGRATION_CONTENT),
    ],
    databaseOps: src("docs/database/ops.md", DATABASE_OPS_CONTENT),
    rootPackage: src(
      "package.json",
      JSON.stringify({
        scripts: {
          "db:backup:products": "node scripts/run-ops.mjs backup:products",
          "db:backup:admin": "node scripts/run-ops.mjs backup:admin",
        },
      }),
    ),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// R2 extractor fixtures
// ---------------------------------------------------------------------------

const R2_WORKFLOW_CONTENT = [
  "on:",
  "  schedule:",
  "    - cron: \"15 2 * * *\"",
  "  workflow_dispatch:",
  "jobs:",
  "  backup:",
  "    timeout-minutes: 30",
  "    steps:",
  "      - run: pnpm run ops backup:supabase:r2",
  "        env:",
  "          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}",
  "          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}",
  "          R2_BUCKET_NAME: ${{ secrets.R2_BUCKET_NAME }}",
].join("\n");

// R2 package.json must contain the exact literal substrings that assertContains checks for.
const R2_ROOT_PACKAGE_CONTENT = `{
  "scripts": {
    "r2:backup": "node scripts/run-ops.mjs backup:r2",
    "r2:catalog-snapshot": "node scripts/run-ops.mjs catalog:snapshot:r2",
    "r2:repo-backup": "node scripts/run-ops.mjs repo:backup:r2"
  }
}`;

function makeR2Sources(overrides?: Partial<R2WorkflowReviewSources>): R2WorkflowReviewSources {
  return {
    workflow: src(".github/workflows/supabase-backup-r2.yml", R2_WORKFLOW_CONTENT),
    rootPackage: src("package.json", R2_ROOT_PACKAGE_CONTENT),
    operationsRouter: src(
      "scripts/run-ops.mjs",
      [
        '"backup:supabase:r2": () => runTsx("db_backup_upload_r2.ts")',
        '"catalog:snapshot:r2": () => runTsx("catalog_snapshot_upload_r2.ts")',
        '"repo:backup:r2": () => runTsx("repo_backup_upload_r2.ts")',
      ].join("\n"),
    ),
    databaseOperations: src(
      "docs/database/ops.md",
      [
        "## 1. Nightly Backups",
        "| `backups/products/pgdump-products-*.dump` | Products DB |",
        "| `backups/admin/pgdump-admin-*.dump` | Admin DB |",
        "| `backups/catalog/catalog-latest.json` | Catalog snapshot for degraded reads |",
        "| `backups/repo/oofplweb-*.zip` | Git archive |",
        "",
        "## 3. Restore from R2",
        "Download and restore.",
      ].join("\n"),
    ),
    runbook: src(
      "OPERATIONS_RUNBOOK.md",
      "Nightly: `.github/workflows/supabase-backup-r2.yml` (02:15 UTC)\nRestore via pg_restore.",
    ),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Monitoring extractor fixtures
// ---------------------------------------------------------------------------

function makeMonitoringSources(
  overrides?: Partial<MonitoringReviewSources>,
): MonitoringReviewSources {
  return {
    instrumentation: src(
      "site/instrumentation.ts",
      [
        "import { registerOTel } from '@vercel/otel';",
        "export function register() {",
        "  registerOTel({ serviceName: process.env.OTEL_SERVICE_NAME ?? 'oando-next-site' });",
        "}",
      ].join("\n"),
    ),
    metrics: src(
      "site/lib/observability/metrics.ts",
      [
        "import { collectDefaultMetrics, Counter, Histogram } from 'prom-client';",
        "collectDefaultMetrics({ prefix: 'oando_' });",
        "new Counter({ name: 'oando_http_requests_total', help: 'Total HTTP requests' });",
        "new Histogram({ name: 'oando_http_duration_seconds', help: 'HTTP request duration' });",
      ].join("\n"),
    ),
    prometheusConfig: src(
      "config/observability/prometheus.yml",
      [
        "global:",
        "  scrape_interval: 15s",
        "  evaluation_interval: 15s",
        "scrape_configs:",
        "  - job_name: oando-site",
        "    metrics_path: /api/metrics",
        "    static_configs:",
        "      - targets:",
        "          - localhost:3000",
      ].join("\n"),
    ),
    dockerCompose: src(
      "config/observability/docker-compose.yml",
      [
        "services:",
        "  prometheus:",
        "    image: prom/prometheus:latest",
        "    ports:",
        "      - '9090:9090'",
        "    volumes:",
        "      - prometheus_data:/prometheus",
        "  grafana:",
        "    image: grafana/grafana:latest",
        "    ports:",
        "      - '3001:3000'",
        "    volumes:",
        "      - grafana_data:/var/lib/grafana",
      ].join("\n"),
    ),
    grafanaConfig: src(
      "config/observability/grafana/provisioning/datasources/prometheus.yml",
      [
        "apiVersion: 1",
        "datasources:",
        "  - name: Prometheus",
        "    type: prometheus",
        "    url: http://prometheus:9090",
        "    isDefault: true",
      ].join("\n"),
    ),
    runbook: src(
      "OPERATIONS_RUNBOOK.md",
      [
        "## 1. Deploy",
        "Order: **migrations → seed → code.**",
        "pnpm run vercel:prod",
        "pnpm run db:test",
        "Smoke in browser: /ooplanner rail, place, save, reload",
        "pnpm run worker:deploy",
        "Verify dead asset path and valid asset response headers",
        "200 image/png with x-oando-proxy: r2-fallback",
        "x-oando-proxy: r2`",
        "",
        "## 4. Rollback",
        "Revert migrations newest-first. Instant Rollback once schema safe.",
        "",
        "## 5. Incidents",
        "Catalog outage: R2 fallback path for catalog reads.",
        "",
        "## 6. Backups",
        "Both DBs (both DBs) backed up nightly.",
        "restore drill required before marking recovery complete.",
      ].join("\n"),
    ),
    rootPackage: src(
      "package.json",
      JSON.stringify({
        scripts: {
          "observability:up": "docker compose -f config/observability/docker-compose.yml up -d",
          "observability:down": "docker compose -f config/observability/docker-compose.yml down",
          "observability:logs": "docker compose -f config/observability/docker-compose.yml logs -f",
          "worker:tail": "wrangler tail --env production",
          "db:test": "node scripts/run-ops.mjs db:test",
          "r2:backup": "node scripts/run-ops.mjs backup:r2",
        },
      }),
    ),
    operationsRouter: src(
      "scripts/run-ops.mjs",
      '"db:test": () => runTsx("db_test.ts")',
    ),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Alignment comparator fixtures
// ---------------------------------------------------------------------------

function makeAlignmentInput(overrides?: Partial<AlignmentInput>): AlignmentInput {
  return {
    runbook: src(
      "OPERATIONS_RUNBOOK.md",
      [
        "## 1. Deploy",
        "1. Run pnpm run db:apply",
        "2. Run pnpm run seed:furniture",
        "3. Run pnpm run vercel:prod",
        "Owner: release-owner",
        "",
        "## 4. Rollback",
        "Rollback: pnpm run db:rollback",
      ].join("\n"),
    ),
    rootPackage: src(
      "package.json",
      JSON.stringify({
        scripts: {
          "vercel:prod": "node scripts/run-ops.mjs vercel:prod",
          "db:apply": "node scripts/run-ops.mjs db:apply",
          "seed:furniture": "node scripts/run-ops.mjs seed:furniture",
          "db:rollback": "node scripts/run-ops.mjs db:rollback",
        },
      }),
    ),
    vercelConfig: src(
      "vercel.json",
      JSON.stringify({
        buildCommand: "pnpm run build",
        framework: "nextjs",
      }),
    ),
    workerConfig: src(
      "workers/oando-worker-proxy/wrangler.toml",
      'name = "oando-worker-proxy"\nmain = "src/index.js"',
    ),
    ciWorkflow: src(
      ".github/workflows/supabase-backup-r2.yml",
      [
        "on:",
        "  schedule:",
        "    - cron: '0 2 * * *'",
        "  workflow_dispatch:",
        "jobs:",
        "  backup:",
        "    steps:",
        "      - run: pnpm run r2:backup",
      ].join("\n"),
    ),
    operationsRouter: src(
      "scripts/run-ops.mjs",
      '"vercel:prod": () => execSync("vercel --prod --yes")',
    ),
    ...overrides,
  };
}

// ============================================================================
// Test suites
// ============================================================================

// ---------------------------------------------------------------------------
// Vercel extractor tests (Requirements 2.1, 2.3)
// ---------------------------------------------------------------------------

describe("Vercel extractor — fixture-based", () => {
  it("extracts configured build route and deployment command from vercel.json and package.json (Req 2.1)", () => {
    const result = extractVercelReview(makeVercelSources());

    // Build route observation is present
    const buildFact = result.observedConfiguration.find((f) => f.id === "vercel.build.configuration");
    expect(buildFact).toBeDefined();
    expect(buildFact!.status).toBe("observed-local");
    expect(buildFact!.statement).toContain("pnpm run build");
    expect(buildFact!.source.path).toBe("vercel.json");

    // Deployment routes are observed
    const routesFact = result.observedConfiguration.find((f) => f.id === "vercel.deploy.routes");
    expect(routesFact).toBeDefined();
    expect(routesFact!.status).toBe("observed-local");

    // Release decision surface is vercel-application
    expect(result.releaseDecision.surface).toBe("vercel-application");
    expect(result.releaseDecision.approvalPoint.length).toBeGreaterThan(0);
    expect(result.releaseDecision.expectedVerificationEvidence.length).toBeGreaterThan(0);
  });

  it("marks hosted deployment state as unverified when no authorized evidence is supplied (Req 2.4)", () => {
    const result = extractVercelReview(makeVercelSources());

    const unverifiedFact = result.unverifiedExternalState.find(
      (f) => f.id === "vercel.hosted-state.unverified",
    );
    expect(unverifiedFact).toBeDefined();
    expect(unverifiedFact!.status).toBe("unverified");
  });

  it("produces attributable gaps for all missing persisted-data release prerequisites (Req 2.3)", () => {
    // Supply an empty persisted-data input to trigger all prerequisite gaps
    const result = extractVercelReview(makeVercelSources(), {
      databaseOwners: [],
      migrationImpact: "",
      seedImpact: "",
      backupPrerequisite: "",
      compatibilityHazard: "",
      codeReleaseOrder: "",
      rollbackPath: "",
    });

    const gapIds = result.gaps.map((g) => g.id);
    expect(gapIds).toContain("vercel.persisted-data.owner.missing");
    expect(gapIds).toContain("vercel.persisted-data.migration-impact.missing");
    expect(gapIds).toContain("vercel.persisted-data.backup-prerequisite.missing");
    expect(gapIds).toContain("vercel.persisted-data.compatibility-hazard.missing");
    expect(gapIds).toContain("vercel.persisted-data.code-release-order.missing");
    expect(gapIds).toContain("vercel.persisted-data.rollback-path.missing");

    // Each gap cites a source path
    for (const gap of result.gaps) {
      expect(gap.sourcePaths.length).toBeGreaterThan(0);
      for (const p of gap.sourcePaths) {
        expect(p.trim().length).toBeGreaterThan(0);
      }
    }

    // Missing prerequisites must not produce a persistedDataImpact
    expect(result.releaseDecision.persistedDataImpact).toBeUndefined();
  });

  it("throws when vercel.json is malformed JSON (missing source handling)", () => {
    const sources = makeVercelSources({
      vercelConfig: src("vercel.json", "{ not valid json }"),
    });
    expect(() => extractVercelReview(sources)).toThrow();
  });

  it("throws when vercel.json is valid JSON but missing required fields (malformed source)", () => {
    const sources = makeVercelSources({
      vercelConfig: src("vercel.json", JSON.stringify({ framework: "nextjs" })),
    });
    expect(() => extractVercelReview(sources)).toThrow();
  });

  it("throws gracefully when package.json is missing required script routes (missing source)", () => {
    const sources = makeVercelSources({
      packageManifest: src("package.json", JSON.stringify({ scripts: {} })),
    });
    expect(() => extractVercelReview(sources)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Worker extractor tests (Requirements 3.1, 3.2, 3.4)
// ---------------------------------------------------------------------------

describe("Worker extractor — fixture-based", () => {
  it("captures all four routing cases in the matrix (Req 3.4)", () => {
    const result = extractWorkerReview(makeWorkerSources());

    const caseIds = result.routingCases.map((c) => c.id);
    expect(caseIds).toContain("r2-hit");
    expect(caseIds).toContain("r2-miss");
    expect(caseIds).toContain("r2-error");
    expect(caseIds).toContain("origin-forwarding");
    expect(result.routingCases).toHaveLength(4);
  });

  it("marks all four routing case behaviors as unverified (Req 3.3)", () => {
    const result = extractWorkerReview(makeWorkerSources());

    for (const routingCase of result.routingCases) {
      expect(routingCase.status).toBe("unverified");
      expect(routingCase.source.path.length).toBeGreaterThan(0);
    }
  });

  it("produces an independent Worker-only release decision with pending-authorization status (Req 3.2)", () => {
    const result = extractWorkerReview(makeWorkerSources());

    const rd = result.releaseDecision;
    expect(rd.surface).toBe("cloudflare-worker");
    expect(rd.releaseState).toBe("pending-authorization");
    expect(rd.approvalPoint.length).toBeGreaterThan(0);
    expect(rd.rollbackOrRecoveryProcedure.length).toBeGreaterThan(0);
    expect(rd.expectedVerificationEvidence.length).toBeGreaterThan(0);
    // Must reference all four routing cases in verification evidence
    const evidenceText = rd.expectedVerificationEvidence.join(" ");
    expect(evidenceText).toContain("R2 hit");
    expect(evidenceText).toContain("R2 miss");
    expect(evidenceText).toContain("R2-error");
  });

  it("extracts ASSET_BUCKET R2 binding and VERCEL_ORIGIN dependency (Req 3.1)", () => {
    const result = extractWorkerReview(makeWorkerSources());

    const bindingFact = result.observedConfiguration.find(
      (f) => f.id === "worker-r2-binding",
    );
    expect(bindingFact).toBeDefined();
    expect(bindingFact!.statement).toContain("ASSET_BUCKET");

    const originFact = result.observedConfiguration.find(
      (f) => f.id === "worker-vercel-origin",
    );
    expect(originFact).toBeDefined();
    expect(originFact!.statement).toContain("VERCEL_ORIGIN");
  });

  it("classifies the Worker deployment as a protected operation (Req 1.2)", () => {
    const result = extractWorkerReview(makeWorkerSources());

    const op = result.deploymentOperation;
    expect(op.classification).toBe("protected-operation");
    expect(op.executionStatus).toBe("pending-authorization");
    expect(op.targetSurface).toBe("cloudflare-worker");
    expect(op.expectedEvidence.length).toBeGreaterThan(0);
  });

  it("throws when wrangler.toml is missing the ASSET_BUCKET binding (missing source)", () => {
    const sources = makeWorkerSources({
      wrangler: src(
        "workers/oando-worker-proxy/wrangler.toml",
        'main = "src/index.js"\n[vars]\nVERCEL_ORIGIN = "https://example.com"',
      ),
    });
    expect(() => extractWorkerReview(sources)).toThrow();
  });

  it("throws when worker source is empty (missing source)", () => {
    const sources = makeWorkerSources({
      workerSource: src("workers/oando-worker-proxy/src/index.js", "// empty"),
    });
    expect(() => extractWorkerReview(sources)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Database extractor tests — Products and Admin independently (Req 4.1, 4.2, 4.4, 7.1)
// ---------------------------------------------------------------------------

describe("Database extractor — Products (Req 4.1, 4.4)", () => {
  it("records Products project reference as erpweaiypimorcunaimz from the domain constant", () => {
    const result = extractDatabaseReview(makeDatabaseSources());

    expect(result.products.projectRef).toBe("erpweaiypimorcunaimz");
    expect(result.products.surface).toBe("products-database");
    expect(result.products.ownershipScope).toContain("marketing catalog");
  });

  it("emits observed-configuration facts citing Products source paths (Req 4.1)", () => {
    const result = extractDatabaseReview(makeDatabaseSources());

    const refFact = result.observedConfiguration.find(
      (f) => f.id === "db.products.project-ref",
    );
    expect(refFact).toBeDefined();
    expect(refFact!.surface).toBe("products-database");
    expect(refFact!.statement).toContain("erpweaiypimorcunaimz");
    expect(refFact!.source.path.length).toBeGreaterThan(0);
  });

  it("distinguishes schema rollback, provider recovery, PITR, and data restore as separate recovery paths (Req 4.4, 7.1)", () => {
    const result = extractDatabaseReview(makeDatabaseSources());
    const pathIds = result.products.recoveryPaths.map((rp) => rp.path);

    expect(pathIds).toContain("products-schema-rollback");
    expect(pathIds).toContain("provider-recovery");
    expect(pathIds).toContain("point-in-time-recovery");
    expect(pathIds).toContain("data-restore");
  });

  it("detects migrations containing rollback instructions", () => {
    const result = extractDatabaseReview(makeDatabaseSources());
    expect(result.products.hasRollbackInstruction).toBe(true);
  });

  it("emits a gap when a Products migration is missing the rollback annotation", () => {
    const sources = makeDatabaseSources({
      productsMigrationsDir: [
        src(
          "site/platform/supabase/migrations/001_no_rollback.sql",
          "CREATE TABLE foo (id uuid);",
        ),
      ],
    });
    const result = extractDatabaseReview(sources);

    expect(result.products.hasRollbackInstruction).toBe(false);
    const rollbackGap = result.gaps.find(
      (g) => g.id === "db.products.rollback-annotation.missing",
    );
    expect(rollbackGap).toBeDefined();
    expect(rollbackGap!.priority).toBe("P0");
    expect(rollbackGap!.risk).toBe("critical");
  });
});

describe("Database extractor — Admin (Req 4.1, 4.4)", () => {
  it("records Admin project reference as rxzpznmxbaoxpikowmfc from the domain constant", () => {
    const result = extractDatabaseReview(makeDatabaseSources());

    expect(result.admin.projectRef).toBe("rxzpznmxbaoxpikowmfc");
    expect(result.admin.surface).toBe("admin-database");
    expect(result.admin.ownershipScope).toContain("staff");
  });

  it("emits observed-configuration facts citing Admin source paths (Req 4.1)", () => {
    const result = extractDatabaseReview(makeDatabaseSources());

    const refFact = result.observedConfiguration.find(
      (f) => f.id === "db.admin.project-ref",
    );
    expect(refFact).toBeDefined();
    expect(refFact!.surface).toBe("admin-database");
    expect(refFact!.statement).toContain("rxzpznmxbaoxpikowmfc");
    expect(refFact!.source.path.length).toBeGreaterThan(0);
  });

  it("Products and Admin project refs are distinct and never merged (Req 4.2)", () => {
    const result = extractDatabaseReview(makeDatabaseSources());
    expect(result.products.projectRef).not.toBe(result.admin.projectRef);
    expect(result.products.surface).not.toBe(result.admin.surface);
  });

  it("produces protected-operations for both Products and Admin backup actions (Req 1.1)", () => {
    const result = extractDatabaseReview(makeDatabaseSources());

    const productsBu = result.protectedOperations.find(
      (op) => op.targetSurface === "products-database" && op.operation === "products-backup",
    );
    const adminBu = result.protectedOperations.find(
      (op) => op.targetSurface === "admin-database" && op.operation === "admin-backup",
    );
    expect(productsBu).toBeDefined();
    expect(adminBu).toBeDefined();
    expect(productsBu!.executionStatus).toBe("pending-authorization");
    expect(adminBu!.executionStatus).toBe("pending-authorization");
  });

  it("emits unverified backup-existence facts for both databases (Req 1.3)", () => {
    const result = extractDatabaseReview(makeDatabaseSources());

    const productsUnverified = result.unverifiedExternalState.find(
      (f) => f.id === "db.products.backup-existence.unverified",
    );
    const adminUnverified = result.unverifiedExternalState.find(
      (f) => f.id === "db.admin.backup-existence.unverified",
    );
    expect(productsUnverified).toBeDefined();
    expect(productsUnverified!.status).toBe("unverified");
    expect(adminUnverified).toBeDefined();
    expect(adminUnverified!.status).toBe("unverified");
  });

  it("handles missing migration directories gracefully with no crash", () => {
    const sources = makeDatabaseSources({
      productsMigrationsDir: [],
      adminMigrationsDir: [],
    });
    const result = extractDatabaseReview(sources);
    expect(result.products.migrationFiles).toHaveLength(0);
    expect(result.admin.migrationFiles).toHaveLength(0);
    // With empty directories hasRollbackInstruction returns false (no files to check)
    expect(result.products.hasRollbackInstruction).toBe(false);
  });

  it("handles malformed package.json gracefully without throwing (malformed source)", () => {
    const sources = makeDatabaseSources({
      rootPackage: src("package.json", "not-valid-json"),
    });
    // Should not throw; treats scripts as empty and emits gaps instead
    const result = extractDatabaseReview(sources);
    expect(result.products).toBeDefined();
    expect(result.admin).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// R2 extractor tests (Requirements 5.1, 5.2, 5.4)
// ---------------------------------------------------------------------------

describe("R2 extractor — fixture-based", () => {
  it("captures workflow schedule, trigger modes, timeout, and command route (Req 5.1, 5.2)", () => {
    const result = extractR2WorkflowReview(makeR2Sources());

    expect(result.workflow.schedule).toBe("15 2 * * *");
    expect(result.workflow.triggerModes).toContain("scheduled");
    expect(result.workflow.triggerModes).toContain("manual");
    expect(result.workflow.timeoutMinutes).toBe(30);
    expect(result.workflow.commandRoute).toBe("pnpm run ops backup:supabase:r2");
  });

  it("records only secret names, never secret values (Req 5.2)", () => {
    const result = extractR2WorkflowReview(makeR2Sources());

    // Secret names must be present
    expect(result.workflow.secretNames.length).toBeGreaterThan(0);
    // Secret names must look like variable names, not values
    for (const name of result.workflow.secretNames) {
      expect(name).toMatch(/^[A-Z][A-Z0-9_]+$/);
    }
    // The raw secret value placeholder must not appear in rendered observations
    for (const fact of result.observedConfiguration) {
      expect(fact.statement).not.toMatch(/\$\{\{\s*secrets\./);
    }
  });

  it("classifies four distinct artifact categories (Req 5.4)", () => {
    const result = extractR2WorkflowReview(makeR2Sources());

    const categoryIds = result.artifactCategories.map((c) => c.id);
    expect(categoryIds).toContain("database-dumps");
    expect(categoryIds).toContain("catalog-snapshots");
    expect(categoryIds).toContain("repository-backups");
    expect(categoryIds).toContain("delivery-assets");
  });

  it("marks artifact creation, retention, integrity, and retrievability as unverified (Req 5.3)", () => {
    const result = extractR2WorkflowReview(makeR2Sources());

    const unverifiedIds = result.unverifiedExternalState.map((f) => f.id);
    expect(unverifiedIds).toContain("r2.artifact-creation.unverified");
    expect(unverifiedIds).toContain("r2.artifact-retention.unverified");
    expect(unverifiedIds).toContain("r2.artifact-integrity.unverified");
    expect(unverifiedIds).toContain("r2.artifact-retrievability.unverified");

    for (const fact of result.unverifiedExternalState) {
      expect(fact.status).toBe("unverified");
    }
  });

  it("classifies R2 write and retrieval as protected operations (Req 1.2)", () => {
    const result = extractR2WorkflowReview(makeR2Sources());

    const r2WriteOp = result.protectedOperations.find((op) => op.operation === "r2-write");
    const r2GetOp = result.protectedOperations.find((op) => op.operation === "r2-retrieval");
    expect(r2WriteOp).toBeDefined();
    expect(r2GetOp).toBeDefined();
    expect(r2WriteOp!.executionStatus).toBe("pending-authorization");
    expect(r2GetOp!.executionStatus).toBe("pending-authorization");
  });

  it("throws when workflow is missing cron schedule (malformed source)", () => {
    const sources = makeR2Sources({
      workflow: src(
        ".github/workflows/supabase-backup-r2.yml",
        [
          "on:",
          "  workflow_dispatch:",
          "jobs:",
          "  backup:",
          "    timeout-minutes: 30",
          "    steps:",
          "      - run: pnpm run ops backup:supabase:r2",
          "        env:",
          "          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}",
        ].join("\n"),
      ),
    });
    expect(() => extractR2WorkflowReview(sources)).toThrow();
  });

  it("throws when workflow is missing workflow_dispatch (malformed source)", () => {
    const sources = makeR2Sources({
      workflow: src(
        ".github/workflows/supabase-backup-r2.yml",
        [
          "on:",
          "  schedule:",
          "    - cron: '0 2 * * *'",
          "jobs:",
          "  backup:",
          "    timeout-minutes: 30",
          "    steps:",
          "      - run: pnpm run ops backup:supabase:r2",
          "        env:",
          "          KEY: ${{ secrets.KEY }}",
        ].join("\n"),
      ),
    });
    expect(() => extractR2WorkflowReview(sources)).toThrow();
  });

  it("throws when expected database artifact paths are absent from databaseOperations (missing source)", () => {
    const sources = makeR2Sources({
      databaseOperations: src("docs/database/ops.md", "## Empty\nNo artifact declarations."),
    });
    expect(() => extractR2WorkflowReview(sources)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Monitoring extractor tests (Requirements 8.1)
// ---------------------------------------------------------------------------

describe("Monitoring extractor — fixture-based", () => {
  it("identifies OTel registration, Prometheus metrics, scrape config, and Grafana wiring (Req 8.1)", () => {
    const result = extractMonitoringReview(makeMonitoringSources());

    expect(result.otelStatus.registered).toBe(true);
    expect(result.otelStatus.serviceName).toBe("oando-next-site");
    expect(result.prometheusMetrics.length).toBeGreaterThan(0);
    expect(result.prometheusScrape.jobName).toBe("oando-site");
    expect(result.grafanaConfig.datasourceName).toBe("Prometheus");
  });

  it("emits a gap for every missing monitoring signal, owner, or escalation path (Req 8.3)", () => {
    // Use minimal runbook content that will not match any procedure markers,
    // so all procedures stay empty and produce gaps
    const sources = makeMonitoringSources({
      runbook: src(
        "OPERATIONS_RUNBOOK.md",
        "## 1. Deploy\npnpm run vercel:prod\nOrder: **migrations → seed → code.**\nSmoke in browser: placeholder\npnpm run db:test",
      ),
    });
    const result = extractMonitoringReview(sources);

    // Gaps must be present for monitoring evidence dimensions
    expect(result.gaps.length).toBeGreaterThan(0);
    // Each gap must have a non-empty source path
    for (const gap of result.gaps) {
      expect(gap.sourcePaths.length).toBeGreaterThan(0);
      expect(gap.surface.length).toBeGreaterThan(0);
    }
  });

  it("emits evidence-dimension gaps for collection, export, retention, queryability, and alerting", () => {
    const result = extractMonitoringReview(makeMonitoringSources());

    const gapIds = result.gaps.map((g) => g.id);
    expect(gapIds).toContain("monitoring.collection.proof.missing");
    expect(gapIds).toContain("monitoring.export.proof.missing");
    expect(gapIds).toContain("monitoring.retention.proof.missing");
    expect(gapIds).toContain("monitoring.queryability.proof.missing");
    expect(gapIds).toContain("monitoring.alerting.proof.missing");
  });

  it("classifies local observability service startup as a protected operation (Req 8.4)", () => {
    const result = extractMonitoringReview(makeMonitoringSources());

    const observabilityOp = result.protectedOperations.find(
      (op) => op.operation === "local-observability-startup",
    );
    expect(observabilityOp).toBeDefined();
    expect(observabilityOp!.executionStatus).toBe("pending-authorization");
  });

  it("emits a gap when OTel registration is absent from instrumentation.ts (missing source)", () => {
    const sources = makeMonitoringSources({
      instrumentation: src(
        "site/instrumentation.ts",
        "// no OTel registration here\nexport function register() {}",
      ),
    });
    const result = extractMonitoringReview(sources);

    const otelGap = result.gaps.find((g) => g.id === "monitoring.otel.registration.missing");
    expect(otelGap).toBeDefined();
    expect(otelGap!.sourcePaths).toContain("site/instrumentation.ts");
  });

  it("emits a gap when Prometheus metrics file has no recognized registrations (missing source)", () => {
    const sources = makeMonitoringSources({
      metrics: src("site/lib/observability/metrics.ts", "// no metrics"),
    });
    const result = extractMonitoringReview(sources);

    const metricsGap = result.gaps.find(
      (g) => g.id === "monitoring.metrics.registration.missing",
    );
    expect(metricsGap).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Redaction tests (Requirement 5.2, 1.3)
// ---------------------------------------------------------------------------

describe("redactSecrets — fixture-based", () => {
  it("redacts a PostgreSQL connection string value, preserving the schema prefix", () => {
    const input = "DATABASE_URL=postgresql://user:s3cr3tP@ssw0rd@db.example.com/mydb";
    const output = redactSecrets(input);
    expect(output).not.toContain("s3cr3tP@ssw0rd");
    expect(output).toContain("[REDACTED]");
  });

  it("redacts a long base-64-like token value", () => {
    const token = "A".repeat(44);
    const output = redactSecrets(token);
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain("A".repeat(44));
  });

  it("redacts the value portion of key=value forms while preserving the key name", () => {
    const input = "secret=my-very-secret-value";
    const output = redactSecrets(input);
    expect(output).toContain("secret");
    expect(output).not.toContain("my-very-secret-value");
    expect(output).toContain("[REDACTED]");
  });

  it("preserves short non-credential values without modification", () => {
    const input = "framework=nextjs";
    const output = redactSecrets(input);
    // Short value, not credential-keyed → no redaction
    expect(output).toBe(input);
  });

  it("preserves all string content when no credential patterns match", () => {
    const input = "Order: migrations → seed → code.";
    expect(redactSecrets(input)).toBe(input);
  });

  it("does not expose credential values that appear in R2 workflow secret references", () => {
    // Simulate a YAML snippet that would carry secret values from env vars
    const yamlSnippet = "SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.AAAA";
    const output = redactSecrets(yamlSnippet);
    expect(output).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(output).toContain("[REDACTED]");
  });
});

// ---------------------------------------------------------------------------
// Output-path enforcement (Requirement 9.4)
// ---------------------------------------------------------------------------

describe("validateOutputPath — fixture-based", () => {
  it("accepts the agents-work review directory path", () => {
    expect(() =>
      validateOutputPath("agents-work/operations-deployment-backup-review/reviews/report.md"),
    ).not.toThrow();
  });

  it("accepts the results evidence directory path", () => {
    expect(() =>
      validateOutputPath("results/operations-deployment-backup-review/evidence.json"),
    ).not.toThrow();
  });

  it("rejects a path under site/ (production source tree)", () => {
    expect(() => validateOutputPath("site/reports/output.json")).toThrow();
  });

  it("rejects the results/ root (without the sub-directory)", () => {
    expect(() => validateOutputPath("results/other-tool/output.json")).toThrow();
  });

  it("rejects HTTP URL paths", () => {
    expect(() => validateOutputPath("https://example.com/output.json")).toThrow();
  });

  it("rejects R2 bucket paths", () => {
    expect(() => validateOutputPath("r2://my-bucket/output.json")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// CI/runbook alignment mismatch tests (Requirement 9.3)
// ---------------------------------------------------------------------------

describe("Alignment comparator — CI/runbook mismatch (Req 9.3)", () => {
  it("detects a command referenced in CI but absent from package.json", () => {
    const input = makeAlignmentInput({
      ciWorkflow: src(
        ".github/workflows/supabase-backup-r2.yml",
        [
          "on:",
          "  workflow_dispatch:",
          "jobs:",
          "  backup:",
          "    steps:",
          "      - run: pnpm run missing:ci:command",
        ].join("\n"),
      ),
    });
    const result = compareAlignment(input);

    const commandDiffs = result.differences.filter(
      (d) =>
        d.dimension === "command" &&
        d.exactDifference.includes("missing:ci:command"),
    );
    expect(commandDiffs.length).toBeGreaterThan(0);

    const diff = commandDiffs[0]!;
    expect(diff.sourcePaths[0].length).toBeGreaterThan(0);
    expect(diff.sourcePaths[1].length).toBeGreaterThan(0);
    expect(diff.exactDifference.trim().length).toBeGreaterThan(0);
    expect(diff.recommendedResolution.trim().length).toBeGreaterThan(0);
  });

  it("detects a runbook command absent from package.json", () => {
    const input = makeAlignmentInput({
      runbook: src(
        "OPERATIONS_RUNBOOK.md",
        [
          "## 1. Deploy",
          "1. Run pnpm run vercel:prod",
          "2. Run pnpm run nonexistent:deploy:step",
          "Owner: release-owner",
          "## 4. Rollback",
          "pnpm run db:rollback",
        ].join("\n"),
      ),
    });
    const result = compareAlignment(input);

    const commandDiffs = result.differences.filter(
      (d) =>
        d.dimension === "command" &&
        d.exactDifference.includes("nonexistent:deploy:step"),
    );
    expect(commandDiffs.length).toBeGreaterThan(0);
  });

  it("detects owner named in runbook but no CI approval gate present", () => {
    const input = makeAlignmentInput({
      ciWorkflow: src(
        ".github/workflows/supabase-backup-r2.yml",
        [
          "on:",
          "  schedule:",
          "    - cron: '0 2 * * *'",
          "  workflow_dispatch:",
          "jobs:",
          "  backup:",
          "    steps:",
          "      - run: pnpm run r2:backup",
        ].join("\n"),
      ),
      runbook: src(
        "OPERATIONS_RUNBOOK.md",
        [
          "## 1. Deploy",
          "Owner: release-owner",
          "pnpm run vercel:prod",
          "## 4. Rollback",
          "pnpm run db:rollback",
        ].join("\n"),
      ),
    });
    const result = compareAlignment(input);

    const ownerDiffs = result.differences.filter((d) => d.dimension === "owner");
    expect(ownerDiffs.length).toBeGreaterThan(0);

    for (const diff of ownerDiffs) {
      expect(diff.sourcePaths[0].length).toBeGreaterThan(0);
      expect(diff.sourcePaths[1].length).toBeGreaterThan(0);
    }
  });

  it("emits source-linked difference records with non-empty exact difference and resolution (Req 9.2)", () => {
    const input = makeAlignmentInput({
      ciWorkflow: src(
        ".github/workflows/supabase-backup-r2.yml",
        [
          "on:",
          "  workflow_dispatch:",
          "jobs:",
          "  backup:",
          "    steps:",
          "      - run: pnpm run ci:only:command",
        ].join("\n"),
      ),
    });
    const result = compareAlignment(input);

    for (const diff of result.differences) {
      expect(diff.sourcePaths[0].trim().length).toBeGreaterThan(0);
      expect(diff.sourcePaths[1].trim().length).toBeGreaterThan(0);
      expect(diff.exactDifference.trim().length).toBeGreaterThan(0);
      expect(diff.recommendedResolution.trim().length).toBeGreaterThan(0);
    }
  });

  it("returns zero command differences when CI, runbook, and package.json are all consistent", () => {
    // Build a scenario where all commands referenced by CI exist in package.json
    const input = makeAlignmentInput({
      rootPackage: src(
        "package.json",
        JSON.stringify({
          scripts: {
            "vercel:prod": "node scripts/run-ops.mjs vercel:prod",
            "db:apply": "node scripts/run-ops.mjs db:apply",
            "seed:furniture": "node scripts/run-ops.mjs seed:furniture",
            "db:rollback": "node scripts/run-ops.mjs db:rollback",
            "r2:backup": "node scripts/run-ops.mjs backup:r2",
          },
        }),
      ),
    });
    const result = compareAlignment(input);
    const commandDiffs = result.differences.filter((d) => d.dimension === "command");
    expect(commandDiffs).toHaveLength(0);
  });
});

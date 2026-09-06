import { AuthorizationGuard } from "../authorizationGuard";
import type {
  EvidenceFact,
  Gap,
  ProtectedOperation,
  SourceReference,
  Surface,
} from "../models";
import type { RepositorySource } from "../sourceAdapter";

const MONITORING_SURFACE = "monitoring" as const;

export type MonitoringEvidenceDimension =
  | "collection"
  | "export"
  | "retention"
  | "queryability"
  | "alerting";

export type MonitoringProcedureKind = "release" | "recovery";
export type MonitoringProcedureField =
  | "signals"
  | "expected-conditions"
  | "owner"
  | "escalation-path";

export interface MonitoringReviewSources {
  /** site/instrumentation.ts — OTel registration via @vercel/otel */
  readonly instrumentation: RepositorySource;
  /** site/lib/observability/metrics.ts — Prometheus metric definitions */
  readonly metrics: RepositorySource;
  /** config/observability/prometheus.yml — local Prometheus scrape configuration */
  readonly prometheusConfig: RepositorySource;
  /** config/observability/docker-compose.yml — local Prometheus/Grafana services */
  readonly dockerCompose?: RepositorySource;
  /** config/observability/grafana/provisioning/datasources/prometheus.yml — Grafana datasource */
  readonly grafanaConfig: RepositorySource;
  /** OPERATIONS_RUNBOOK.md — runbook monitoring sections */
  readonly runbook: RepositorySource;
  /** package.json — root command routes */
  readonly rootPackage: RepositorySource;
  /** scripts/run-ops.mjs — operations command router */
  readonly operationsRouter: RepositorySource;
}

export interface OtelStatus {
  /** Whether registerOTel is called in instrumentation.ts */
  readonly registered: boolean;
  /** Fallback service name configured in the OTel registration */
  readonly serviceName: string;
  /** Source reference for the OTel registration */
  readonly source: SourceReference;
}

export interface PrometheusMetricEntry {
  /** Metric name as registered in the source */
  readonly name: string;
  /**
   * Metric type inferred from source (counter, histogram, gauge, summary,
   * or default-metrics for the collective oando_-prefixed default set).
   */
  readonly type: "counter" | "histogram" | "gauge" | "summary" | "default-metrics";
  /** Human-readable note on what this metric covers */
  readonly description: string;
  readonly source: SourceReference;
}

export interface PrometheusScrapeConfig {
  readonly scrapeInterval: string;
  readonly evaluationInterval: string;
  readonly jobName: string;
  readonly metricsPath: string;
  readonly target: string;
  readonly source: SourceReference;
}

export interface GrafanaConfigSummary {
  /** Local Grafana datasource name */
  readonly datasourceName: string;
  /** Datasource type */
  readonly datasourceType: string;
  /** Prometheus URL as configured in the provisioning file */
  readonly prometheusUrl: string;
  /** Whether the datasource is the default */
  readonly isDefault: boolean;
  readonly source: SourceReference;
}

export interface LocalObservabilityStackSummary {
  readonly prometheusImage: string;
  readonly grafanaImage: string;
  readonly prometheusPort: string;
  readonly grafanaPort: string;
  readonly prometheusStorageVolume: string;
  readonly grafanaStorageVolume: string;
  readonly source: SourceReference;
}

export interface MonitoringCommandRoute {
  readonly id: string;
  readonly command: string;
  readonly purpose: string;
  readonly status: "observed-local" | "gap";
  readonly source: SourceReference;
}

export interface MonitoringEvidenceAssessment {
  readonly dimension: MonitoringEvidenceDimension;
  readonly subject: string;
  readonly status: EvidenceFact["status"];
  readonly statement: string;
  readonly source: SourceReference;
}

export interface MonitoringProcedureAssessment {
  readonly id: string;
  readonly kind: MonitoringProcedureKind;
  readonly surface: Surface;
  readonly name: string;
  readonly signals: readonly string[];
  readonly expectedConditions: readonly string[];
  readonly owner?: string;
  readonly escalationPath?: string;
  readonly sources: readonly SourceReference[];
}

export interface MonitoringReview {
  readonly otelStatus: OtelStatus;
  readonly prometheusMetrics: readonly PrometheusMetricEntry[];
  readonly prometheusScrape: PrometheusScrapeConfig;
  readonly grafanaConfig: GrafanaConfigSummary;
  readonly localStack: LocalObservabilityStackSummary;
  readonly commandRoutes: readonly MonitoringCommandRoute[];
  readonly evidenceAssessments: readonly MonitoringEvidenceAssessment[];
  readonly procedures: readonly MonitoringProcedureAssessment[];
  readonly observedConfiguration: readonly EvidenceFact[];
  readonly unverifiedExternalState: readonly EvidenceFact[];
  readonly gaps: readonly Gap[];
  readonly protectedOperations: readonly ProtectedOperation[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sourceAt(source: RepositorySource, locator: string): SourceReference {
  return { ...source.source, locator };
}

function fact(
  id: string,
  statement: string,
  source: RepositorySource,
  locator: string,
  status: EvidenceFact["status"] = "observed-local",
): EvidenceFact {
  return {
    id,
    surface: MONITORING_SURFACE,
    statement,
    status,
    source: sourceAt(source, locator),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePackageScripts(source: RepositorySource): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source.content);
  } catch {
    return {};
  }

  if (!isRecord(parsed) || !isRecord(parsed.scripts)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed.scripts).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function scalar(content: string, pattern: RegExp): string {
  const match = content.match(pattern);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

function extractOtelStatus(instrumentation: RepositorySource): OtelStatus {
  const registered = /\bregisterOTel\s*\(/.test(instrumentation.content);
  const serviceNameMatch = instrumentation.content.match(
    /serviceName\s*:\s*(?:process\.env\.OTEL_SERVICE_NAME\s*\?\?\s*)?["']([^"']+)["']/, 
  );

  return {
    registered,
    serviceName: serviceNameMatch?.[1] ?? "oando-tech-stack",
    source: sourceAt(instrumentation, "register(): registerOTel({ serviceName })"),
  };
}

function extractPrometheusMetrics(
  metrics: RepositorySource,
): readonly PrometheusMetricEntry[] {
  const entries: PrometheusMetricEntry[] = [];
  const hasCollectDefaultMetrics = /\bcollectDefaultMetrics\s*\(/.test(metrics.content);
  const hasPrefix = /prefix\s*:\s*["']oando_["']/.test(metrics.content);

  if (hasCollectDefaultMetrics && hasPrefix) {
    entries.push({
      name: "oando_*",
      type: "default-metrics",
      description:
        'Prometheus default process and Node.js metrics collected with the "oando_" prefix via collectDefaultMetrics.',
      source: sourceAt(
        metrics,
        'collectDefaultMetrics({ prefix: "oando_" }) — all default Node.js/process metrics',
      ),
    });
  }

  const metricConstructors: Array<
    [string, PrometheusMetricEntry["type"]]
  > = [
    ["Counter", "counter"],
    ["Histogram", "histogram"],
    ["Gauge", "gauge"],
    ["Summary", "summary"],
  ];

  for (const [constructorName, metricType] of metricConstructors) {
    const pattern = new RegExp(
      `new\\s+${constructorName}\\s*\\(\\s*\\{[^}]*name\\s*:\\s*["']([^"']+)["'][^}]*\\}`,
      "gs",
    );

    for (const match of metrics.content.matchAll(pattern)) {
      const metricName = match[1];
      if (!metricName) {
        continue;
      }

      entries.push({
        name: metricName,
        type: metricType,
        description: `Explicitly registered ${metricType} metric "${metricName}".`,
        source: sourceAt(
          metrics,
          `new ${constructorName}({ name: "${metricName}", ... })`,
        ),
      });
    }
  }

  return entries;
}

function extractPrometheusScrapeConfig(
  prometheusConfig: RepositorySource,
): PrometheusScrapeConfig {
  return {
    scrapeInterval: scalar(
      prometheusConfig.content,
      /^\s*scrape_interval:\s*([^\s#]+)\s*$/m,
    ),
    evaluationInterval: scalar(
      prometheusConfig.content,
      /^\s*evaluation_interval:\s*([^\s#]+)\s*$/m,
    ),
    jobName: scalar(
      prometheusConfig.content,
      /^\s*-\s*job_name:\s*([^\s#]+)\s*$/m,
    ),
    metricsPath: scalar(
      prometheusConfig.content,
      /^\s*metrics_path:\s*([^\s#]+)\s*$/m,
    ),
    target: scalar(
      prometheusConfig.content,
      /^\s*-\s*([A-Za-z0-9_.-]+:\d+)\s*$/m,
    ),
    source: sourceAt(
      prometheusConfig,
      "global scrape settings and scrape_configs[0]",
    ),
  };
}

function extractGrafanaConfig(grafanaConfig: RepositorySource): GrafanaConfigSummary {
  return {
    datasourceName: scalar(grafanaConfig.content, /^\s*-\s*name:\s*(.+?)\s*$/m),
    datasourceType: scalar(grafanaConfig.content, /^\s*type:\s*(\S+)\s*$/m),
    prometheusUrl: scalar(grafanaConfig.content, /^\s*url:\s*(\S+)\s*$/m),
    isDefault: /^\s*isDefault:\s*true\s*$/m.test(grafanaConfig.content),
    source: sourceAt(
      grafanaConfig,
      "datasources[0]: name, type, url, isDefault",
    ),
  };
}

function extractLocalStackSummary(
  prometheusConfig: RepositorySource,
  dockerCompose: RepositorySource | undefined,
): LocalObservabilityStackSummary {
  const source = dockerCompose ?? prometheusConfig;
  const content = dockerCompose?.content ?? "";
  const images = Array.from(
    content.matchAll(/^\s{4}image:\s*(\S+)\s*$/gm),
    (match) => match[1] ?? "",
  );
  const ports = Array.from(
    content.matchAll(/^\s{6}-\s*["'](\d+):(\d+)["']\s*$/gm),
    (match) => `${match[1] ?? ""}:${match[2] ?? ""}`,
  );
  const volumes = Array.from(
    content.matchAll(/^\s{6}-\s*([^\s:]+):\/[^\s]+\s*$/gm),
    (match) => match[1] ?? "",
  );

  return {
    prometheusImage: images[0] ?? "",
    grafanaImage: images[1] ?? "",
    prometheusPort: ports[0] ?? "",
    grafanaPort: ports[1] ?? "",
    prometheusStorageVolume: volumes.find((volume) => volume.includes("prometheus")) ?? "",
    grafanaStorageVolume: volumes.find((volume) => volume.includes("grafana")) ?? "",
    source: sourceAt(
      source,
      dockerCompose
        ? "services.prometheus and services.grafana image, port, and volume declarations"
        : "config/observability/docker-compose.yml was not supplied to the extractor",
    ),
  };
}

const COMMAND_ROUTE_SPECS = [
  {
    id: "observability-up",
    script: "observability:up",
    purpose: "Start the local Prometheus and Grafana observability services.",
  },
  {
    id: "observability-down",
    script: "observability:down",
    purpose: "Stop the local Prometheus and Grafana observability services.",
  },
  {
    id: "observability-logs",
    script: "observability:logs",
    purpose: "Tail local Prometheus and Grafana service logs.",
  },
  {
    id: "worker-tail",
    script: "worker:tail",
    purpose: "Access the Cloudflare Worker provider log/tail route.",
  },
  {
    id: "database-test",
    script: "db:test",
    purpose: "Run the documented database recovery/release verification route.",
  },
  {
    id: "r2-backup",
    script: "r2:backup",
    purpose: "Run the documented R2 backup route used by recovery procedures.",
  },
] as const;

function extractCommandRoutes(
  rootPackage: RepositorySource,
): readonly MonitoringCommandRoute[] {
  const scripts = parsePackageScripts(rootPackage);

  return COMMAND_ROUTE_SPECS.map((spec) => ({
    id: spec.id,
    command: `pnpm run ${spec.script}`,
    purpose: spec.purpose,
    status:
      typeof scripts[spec.script] === "string" && scripts[spec.script].trim() !== ""
        ? "observed-local"
        : "gap",
    source: sourceAt(rootPackage, `$.scripts.${spec.script}`),
  }));
}

function markdownSection(content: string, heading: RegExp): string {
  const match = heading.exec(content);
  if (!match || match.index === undefined) {
    return "";
  }

  const nextHeading = content.indexOf("\n## ", match.index + match[0].length);
  return content.slice(match.index, nextHeading === -1 ? content.length : nextHeading);
}

function labeledValue(section: string, pattern: RegExp): string | undefined {
  const match = section.match(pattern);
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : undefined;
}

interface ProcedureSeed {
  readonly id: string;
  readonly kind: MonitoringProcedureKind;
  readonly surface: Surface;
  readonly name: string;
  readonly heading: RegExp;
  readonly activeWhen: (runbook: string) => boolean;
  readonly signalMarkers: readonly [string, string][];
  readonly expectedMarkers: readonly [string, string][];
  readonly sourceLocator: string;
  readonly commandScript?: string;
}

const PROCEDURE_SEEDS: readonly ProcedureSeed[] = [
  {
    id: "vercel-release",
    kind: "release",
    surface: "vercel-application",
    name: "Vercel application release",
    heading: /^## 1\. Deploy\b/m,
    activeWhen: (runbook) => runbook.includes("pnpm run vercel:prod"),
    signalMarkers: [
      ["pnpm run release:gate", "release-gate result"],
      ["pnpm run db:test", "database-test result"],
      ["Smoke in browser:", "Planner browser-smoke result"],
    ],
    expectedMarkers: [
      ["Order: **migrations → seed → code.**", "migrations, seed, and code follow the documented order"],
      ["pnpm run db:test", "the database verification route completes successfully"],
      ["Smoke in browser:", "the /ooplanner rail populates and place/save/reload smoke succeeds"],
    ],
    sourceLocator: "§1 Deploy: release order, verification commands, and browser smoke",
    commandScript: "db:test",
  },
  {
    id: "worker-release",
    kind: "release",
    surface: "cloudflare-worker",
    name: "Cloudflare Worker release",
    heading: /^## 1\. Deploy\b/m,
    activeWhen: (runbook) => runbook.includes("pnpm run worker:deploy"),
    signalMarkers: [
      ["pnpm run worker:tail", "Worker tail/log result"],
      ["x-oando-proxy: r2-fallback", "R2 fallback response header"],
      ["x-oando-proxy: r2`", "R2 hit response header"],
      ["200 image/png", "dead-asset HTTP status and content type"],
    ],
    expectedMarkers: [
      ["200 image/png", "dead asset returns 200 image/png"],
      ["x-oando-proxy: r2-fallback", "dead asset carries the r2-fallback header"],
      ["x-oando-proxy: r2`", "valid asset carries the r2 header"],
    ],
    sourceLocator: "§1 Deploy: Edge worker verification commands and response expectations",
    commandScript: "worker:tail",
  },
  {
    id: "vercel-code-recovery",
    kind: "recovery",
    surface: "vercel-application",
    name: "Vercel application code rollback",
    heading: /^## 4\. Rollback\b/m,
    activeWhen: (runbook) => runbook.includes("Instant Rollback"),
    signalMarkers: [["Instant Rollback", "rollback deployment result"]],
    expectedMarkers: [
      ["Revert migrations", "schema is reverted newest-first before code rollback when schema moved"],
      ["Instant Rollback", "the prior Vercel deployment is restored"],
    ],
    sourceLocator: "§4 Rollback: schema-before-code ordering and Instant Rollback",
  },
  {
    id: "products-database-recovery",
    kind: "recovery",
    surface: "products-database",
    name: "Products database recovery",
    heading: /^## 6\. Backups\b/m,
    activeWhen: (runbook) =>
      runbook.includes("both DBs") && runbook.includes("restore drill"),
    signalMarkers: [["restore drill", "Products restore-drill result"]],
    expectedMarkers: [["restore drill", "Products restore evidence is recorded before recovery is closed"]],
    sourceLocator: "§6 Backups: both-database backup and restore-drill requirement",
    commandScript: "db:test",
  },
  {
    id: "admin-database-recovery",
    kind: "recovery",
    surface: "admin-database",
    name: "Admin database recovery",
    heading: /^## 6\. Backups\b/m,
    activeWhen: (runbook) =>
      runbook.includes("both DBs") && runbook.includes("restore drill"),
    signalMarkers: [["restore drill", "Admin restore-drill result"]],
    expectedMarkers: [["restore drill", "Admin restore evidence is recorded before recovery is closed"]],
    sourceLocator: "§6 Backups: both-database backup and restore-drill requirement",
    commandScript: "db:test",
  },
  {
    id: "catalog-recovery",
    kind: "recovery",
    surface: "r2-backup",
    name: "Catalog outage recovery",
    heading: /^## 5\. Incidents\b/m,
    activeWhen: (runbook) => runbook.includes("Catalog outage"),
    signalMarkers: [["R2 fallback", "catalog R2-fallback response"]],
    expectedMarkers: [["R2 fallback", "catalog requests use the documented R2 fallback path"]],
    sourceLocator: "§5 Incidents: Catalog outage and R2 fallback",
  },
];

function extractProcedures(
  sources: MonitoringReviewSources,
  commandRoutes: readonly MonitoringCommandRoute[],
): readonly MonitoringProcedureAssessment[] {
  const packageRouteByScript = new Map(
    commandRoutes.map((route) => [route.id, route] as const),
  );

  return PROCEDURE_SEEDS.flatMap((seed) => {
    if (!seed.activeWhen(sources.runbook.content)) {
      return [];
    }

    const section = markdownSection(sources.runbook.content, seed.heading);
    const signals = seed.signalMarkers
      .filter(([marker]) => section.includes(marker))
      .map(([, signal]) => signal);
    const expectedConditions = seed.expectedMarkers
      .filter(([marker]) => section.includes(marker))
      .map(([, condition]) => condition);

    const owner = labeledValue(
      section,
      /^\s*(?:monitoring\s+)?owner\s*:\s*([^\n|]+)$/im,
    );
    const escalationPath = labeledValue(
      section,
      /^\s*(?:escalation(?:\s+path)?|escalate\s+to)\s*:\s*([^\n|]+)$/im,
    );

    const sourcesForProcedure: SourceReference[] = [
      sourceAt(sources.runbook, seed.sourceLocator),
    ];
    if (seed.commandScript) {
      const commandId = seed.commandScript.replaceAll(":", "-");
      const route = packageRouteByScript.get(commandId);
      if (route) {
        sourcesForProcedure.push(route.source);
      }
    }

    return [
      {
        id: seed.id,
        kind: seed.kind,
        surface: seed.surface,
        name: seed.name,
        signals,
        expectedConditions,
        ...(owner ? { owner } : {}),
        ...(escalationPath ? { escalationPath } : {}),
        sources: sourcesForProcedure,
      },
    ];
  });
}

function sourceWiringGaps(
  sources: MonitoringReviewSources,
  otelStatus: OtelStatus,
  prometheusMetrics: readonly PrometheusMetricEntry[],
  prometheusScrape: PrometheusScrapeConfig,
  grafanaConfig: GrafanaConfigSummary,
  localStack: LocalObservabilityStackSummary,
  commandRoutes: readonly MonitoringCommandRoute[],
): Gap[] {
  const gaps: Gap[] = [];
  const addGap = (
    id: string,
    surface: Surface,
    missingOrContradictoryElement: string,
    risk: Gap["risk"],
    priority: Gap["priority"],
    sourcePaths: readonly string[],
    recommendedFollowUp: string,
  ): void => {
    gaps.push({
      id,
      surface,
      missingOrContradictoryElement,
      risk,
      priority,
      sourcePaths,
      recommendedFollowUp,
      namedOwner: "observability owner",
    });
  };

  if (!otelStatus.registered) {
    addGap(
      "monitoring.otel.registration.missing",
      MONITORING_SURFACE,
      "site/instrumentation.ts does not contain a registerOTel call, so OpenTelemetry source wiring is not observed.",
      "high",
      "P1",
      [sources.instrumentation.source.path],
      "Add the approved OpenTelemetry registration and document the expected export path before relying on trace evidence.",
    );
  }

  if (prometheusMetrics.length === 0) {
    addGap(
      "monitoring.metrics.registration.missing",
      MONITORING_SURFACE,
      "site/lib/observability/metrics.ts does not expose a recognized Prometheus metric registration.",
      "high",
      "P1",
      [sources.metrics.source.path],
      "Expose a documented Prometheus registry and collect the minimum required process and application signals.",
    );
  }

  const scrapeFields: Array<[keyof PrometheusScrapeConfig, string]> = [
    ["scrapeInterval", "scrape interval"],
    ["evaluationInterval", "evaluation interval"],
    ["jobName", "job name"],
    ["metricsPath", "metrics path"],
    ["target", "scrape target"],
  ];
  for (const [field, label] of scrapeFields) {
    if (prometheusScrape[field]) {
      continue;
    }

    addGap(
      `monitoring.prometheus.${field}.missing`,
      MONITORING_SURFACE,
      `config/observability/prometheus.yml does not declare a ${label}.`,
      "high",
      "P1",
      [sources.prometheusConfig.source.path],
      `Declare the Prometheus ${label} and document its expected monitoring scope.`,
    );
  }

  const grafanaFields: Array<[keyof GrafanaConfigSummary, string]> = [
    ["datasourceName", "datasource name"],
    ["datasourceType", "datasource type"],
    ["prometheusUrl", "Prometheus datasource URL"],
  ];
  for (const [field, label] of grafanaFields) {
    if (grafanaConfig[field]) {
      continue;
    }

    addGap(
      `monitoring.grafana.${field}.missing`,
      MONITORING_SURFACE,
      `Grafana provisioning does not declare a ${label}.`,
      "high",
      "P1",
      [sources.grafanaConfig.source.path],
      `Declare the Grafana ${label} and document how operators query the monitoring source.`,
    );
  }

  if (!sources.dockerCompose) {
    addGap(
      "monitoring.local-stack.compose-source.missing",
      MONITORING_SURFACE,
      "The local Prometheus/Grafana docker-compose source was not supplied to the review, so local service wiring cannot be confirmed.",
      "high",
      "P1",
      [sources.prometheusConfig.source.path],
      "Supply config/observability/docker-compose.yml through the repository source adapter before treating local-service wiring as observed.",
    );
  } else {
    const stackFields: Array<[keyof LocalObservabilityStackSummary, string]> = [
      ["prometheusImage", "Prometheus image"],
      ["grafanaImage", "Grafana image"],
      ["prometheusPort", "Prometheus port mapping"],
      ["grafanaPort", "Grafana port mapping"],
    ];
    for (const [field, label] of stackFields) {
      if (localStack[field]) {
        continue;
      }

      addGap(
        `monitoring.local-stack.${field}.missing`,
        MONITORING_SURFACE,
        `config/observability/docker-compose.yml does not declare a ${label}.`,
        "medium",
        "P2",
        [sources.dockerCompose.source.path],
        `Declare the local ${label} so operators can identify the reviewable observability topology.`,
      );
    }
  }

  for (const route of commandRoutes.filter((candidate) => candidate.status === "gap")) {
    addGap(
      `monitoring.command-route.${route.id}.missing`,
      MONITORING_SURFACE,
      `Root package.json does not expose the expected ${route.command} monitoring/recovery route.`,
      "high",
      "P1",
      [sources.rootPackage.source.path, sources.operationsRouter.source.path],
      `Document or add the approved ${route.command} route before making it a release or recovery prerequisite.`,
    );
  }

  const hasCustomMetric = prometheusMetrics.some(
    (metric) => metric.type !== "default-metrics",
  );
  if (!hasCustomMetric) {
    addGap(
      "monitoring.metrics.no-custom-counters",
      MONITORING_SURFACE,
      "site/lib/observability/metrics.ts registers only default Node.js/process metrics prefixed with oando_. No application-specific counters, histograms, or gauges are registered for business-critical paths.",
      "medium",
      "P2",
      [sources.metrics.source.path],
      "Identify the top release and recovery paths and register named application metrics for their success and failure signals.",
    );
  }

  const hasExporterConfiguration = /exporter|OTEL_EXPORTER|traceExporter/i.test(
    sources.instrumentation.content,
  );
  if (!hasExporterConfiguration) {
    addGap(
      "monitoring.otel.exporter-config.missing",
      MONITORING_SURFACE,
      "site/instrumentation.ts configures an OTel service name but does not declare an exporter endpoint, sampler, or propagator; trace export remains unverified.",
      "medium",
      "P2",
      [sources.instrumentation.source.path],
      "Document the expected OTel exporter ownership and environment configuration without exposing secret values.",
    );
  }

  return gaps;
}

function evidenceDimensionGaps(
  sources: MonitoringReviewSources,
  hasAlertingConfiguration: boolean,
): Gap[] {
  const gaps: Gap[] = [];
  const dimensions: Array<{
    dimension: MonitoringEvidenceDimension;
    statement: string;
    risk: Gap["risk"];
    priority: Gap["priority"];
    sourcePaths: readonly string[];
    recommendation: string;
  }> = [
    {
      dimension: "collection",
      statement:
        "The Prometheus scrape configuration is source wiring only; no current evidence proves that the target collected a metric sample.",
      risk: "high",
      priority: "P1",
      sourcePaths: [sources.prometheusConfig.source.path, sources.metrics.source.path],
      recommendation:
        "Record an authorized scrape/target-health observation for the configured target before using collection as release or recovery evidence.",
    },
    {
      dimension: "export",
      statement:
        "OpenTelemetry registration and a Prometheus registry do not prove that traces or metrics were exported to an external or hosted collector.",
      risk: "high",
      priority: "P1",
      sourcePaths: [sources.instrumentation.source.path, sources.metrics.source.path],
      recommendation:
        "Name the authorized exporter destination and retain evidence of export success for the release/recovery procedure.",
    },
    {
      dimension: "retention",
      statement:
        "Local Prometheus/Grafana volumes provide storage wiring, but no retention duration or retained-artifact evidence is declared.",
      risk: "high",
      priority: "P1",
      sourcePaths: [
        (sources.dockerCompose ?? sources.prometheusConfig).source.path,
        sources.prometheusConfig.source.path,
      ],
      recommendation:
        "Document the retention duration, storage owner, and evidence needed to prove that release and recovery observations remain available.",
    },
    {
      dimension: "queryability",
      statement:
        "Grafana provisioning wires a Prometheus datasource, but no authorized query result proves that the datasource is reachable or useful.",
      risk: "high",
      priority: "P1",
      sourcePaths: [sources.grafanaConfig.source.path, sources.prometheusConfig.source.path],
      recommendation:
        "Record an authorized queryability observation for the release and recovery signals used by operators.",
    },
    {
      dimension: "alerting",
      statement: hasAlertingConfiguration
        ? "Prometheus alerting configuration is wired locally, but alert evaluation and notification delivery remain unverified."
        : "The reviewed Prometheus configuration has no rule_files or alerting section, so local alerting wiring is absent.",
      risk: "high",
      priority: "P1",
      sourcePaths: [sources.prometheusConfig.source.path, sources.grafanaConfig.source.path],
      recommendation:
        "Define alert rules, notification ownership, and escalation routing, then retain authorized evidence that a release/recovery alert reaches its owner.",
    },
  ];

  for (const item of dimensions) {
    gaps.push({
      id: `monitoring.${item.dimension}.proof.missing`,
      surface: MONITORING_SURFACE,
      missingOrContradictoryElement: item.statement,
      risk: item.risk,
      priority: item.priority,
      sourcePaths: item.sourcePaths,
      recommendedFollowUp: item.recommendation,
      namedOwner: "observability owner",
    });
  }

  return gaps;
}

function procedureGaps(
  procedures: readonly MonitoringProcedureAssessment[],
): Gap[] {
  const gaps: Gap[] = [];
  const requiredFields: readonly [
    MonitoringProcedureField,
    string,
    (procedure: MonitoringProcedureAssessment) => boolean,
    string,
  ][] = [
    [
      "signals",
      "named observable signals",
      (procedure) => procedure.signals.length > 0,
      "Name the exact metrics, logs, traces, headers, or health observations that operators must inspect.",
    ],
    [
      "expected-conditions",
      "expected values or conditions",
      (procedure) => procedure.expectedConditions.length > 0,
      "Define the expected value or condition for every named monitoring signal.",
    ],
    [
      "owner",
      "monitoring owner",
      (procedure) => Boolean(procedure.owner),
      "Name the role or operator responsible for reviewing the monitoring evidence.",
    ],
    [
      "escalation-path",
      "escalation path",
      (procedure) => Boolean(procedure.escalationPath),
      "Document the threshold, destination, and next operator for escalation when the expected condition fails.",
    ],
  ];

  for (const procedure of procedures) {
    for (const [field, label, present, recommendation] of requiredFields) {
      if (present(procedure)) {
        continue;
      }

      gaps.push({
        id: `monitoring.procedure.${procedure.id}.${field}.missing`,
        surface: procedure.surface,
        missingOrContradictoryElement: `${procedure.name} lacks ${label}.`,
        risk: "high",
        priority: "P1",
        sourcePaths: [...new Set(procedure.sources.map((source) => source.path))],
        recommendedFollowUp: recommendation,
        namedOwner: "observability owner",
      });
    }
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Public extractor
// ---------------------------------------------------------------------------

/**
 * Extracts monitoring configuration evidence from repository sources only.
 *
 * This function performs no command execution, network access, environment
 * variable inspection, credential access, provider access, or output writing.
 * Source wiring is observed locally; collection, export, retention,
 * queryability, alerting, and hosted log state remain unverified unless the
 * caller supplies separately authorized evidence (which this extractor does
 * not execute or fetch).
 */
export function extractMonitoringReview(
  sources: MonitoringReviewSources,
): MonitoringReview {
  const otelStatus = extractOtelStatus(sources.instrumentation);
  const prometheusMetrics = extractPrometheusMetrics(sources.metrics);
  const prometheusScrape = extractPrometheusScrapeConfig(sources.prometheusConfig);
  const grafanaConfig = extractGrafanaConfig(sources.grafanaConfig);
  const localStack = extractLocalStackSummary(
    sources.prometheusConfig,
    sources.dockerCompose,
  );
  const commandRoutes = extractCommandRoutes(sources.rootPackage);
  const procedures = extractProcedures(sources, commandRoutes);
  const hasAlertingConfiguration = /^(?:\s*)(?:rule_files|alerting):/m.test(
    sources.prometheusConfig.content,
  );

  const hasOtelWiring = otelStatus.registered;
  const hasMetricWiring = prometheusMetrics.length > 0;
  const hasScrapeWiring = Boolean(
    prometheusScrape.jobName &&
      prometheusScrape.metricsPath &&
      prometheusScrape.target,
  );
  const hasGrafanaWiring = Boolean(
    grafanaConfig.datasourceName &&
      grafanaConfig.datasourceType &&
      grafanaConfig.prometheusUrl,
  );
  const hasStackWiring = Boolean(
    localStack.prometheusImage &&
      localStack.grafanaImage &&
      localStack.prometheusPort &&
      localStack.grafanaPort,
  );

  const observedConfiguration: EvidenceFact[] = [];
  if (hasOtelWiring) {
    observedConfiguration.push(
      fact(
        "monitoring.otel.registered",
        `OpenTelemetry is registered in site/instrumentation.ts via @vercel/otel registerOTel with fallback service name "${otelStatus.serviceName}"; runtime exporter state is separate evidence.`,
        sources.instrumentation,
        "register(): registerOTel({ serviceName: process.env.OTEL_SERVICE_NAME ?? \"oando-tech-stack\" })",
      ),
    );
  }
  if (hasMetricWiring) {
    observedConfiguration.push(
      fact(
        "monitoring.prometheus.metrics-registered",
        `site/lib/observability/metrics.ts exposes ${prometheusMetrics.map((metric) => metric.name).join(", ")} through the Prometheus registry.`,
        sources.metrics,
        "collectDefaultMetrics()/metric registrations and getMetricsRegistry()",
      ),
    );
  }
  if (hasScrapeWiring) {
    observedConfiguration.push(
      fact(
        "monitoring.prometheus.scrape-config",
        `Local Prometheus job "${prometheusScrape.jobName}" is configured to scrape ${prometheusScrape.target}${prometheusScrape.metricsPath} every ${prometheusScrape.scrapeInterval || "an unspecified interval"}; evaluation interval is ${prometheusScrape.evaluationInterval || "unspecified"}.`,
        sources.prometheusConfig,
        "global scrape settings and scrape_configs[0]",
      ),
    );
  }
  if (hasGrafanaWiring) {
    observedConfiguration.push(
      fact(
        "monitoring.grafana.datasource",
        `Local Grafana provisioning declares a ${grafanaConfig.datasourceType} datasource named "${grafanaConfig.datasourceName}" targeting ${grafanaConfig.prometheusUrl}${grafanaConfig.isDefault ? " (default)" : ""}.`,
        sources.grafanaConfig,
        "datasources[0]: name, type, url, isDefault",
      ),
    );
  }
  if (hasStackWiring && sources.dockerCompose) {
    observedConfiguration.push(
      fact(
        "monitoring.local-stack.compose",
        `The local observability stack is wired with ${localStack.prometheusImage} on ${localStack.prometheusPort} and ${localStack.grafanaImage} on ${localStack.grafanaPort}; storage volumes are configured in docker-compose.yml.`,
        sources.dockerCompose,
        "services.prometheus and services.grafana image, port, and volume declarations",
      ),
    );
  }

  const hasRunbookMonitoringSection = /(?:^|\n)##\s+[^\n]*(?:monitor|observ|alert)/i.test(
    sources.runbook.content,
  );
  const hasRouterObservabilityRoute = /\bobservability(?::|-)/i.test(
    sources.operationsRouter.content,
  );
  observedConfiguration.push(
    fact(
      "monitoring.root-command-routes",
      `Root package.json exposes ${commandRoutes
        .filter((route) => route.status === "observed-local")
        .map((route) => route.command)
        .join(", ") || "no recognized monitoring/recovery routes"}; the operations router ${hasRouterObservabilityRoute ? "also contains" : "does not contain"} a dedicated observability command entry.`,
      sources.rootPackage,
      "$.scripts observability, worker:tail, db:test, and r2:backup routes",
    ),
  );
  observedConfiguration.push(
    fact(
      "monitoring.operations-router.reviewed",
      hasRouterObservabilityRoute
        ? "scripts/run-ops.mjs contains a dedicated observability command route in the reviewed COMMANDS table."
        : "scripts/run-ops.mjs was reviewed and does not contain a dedicated observability command route; local observability routes remain package scripts.",
      sources.operationsRouter,
      "COMMANDS table: observability route presence/absence",
    ),
  );
  if (hasRunbookMonitoringSection) {
    observedConfiguration.push(
      fact(
        "monitoring.runbook.section",
        "The runbook contains a dedicated monitoring/observability/alert/incident heading for operator evidence.",
        sources.runbook,
        "Markdown monitoring/observability/alert/incident heading",
      ),
    );
  }

  const unverifiedExternalState: EvidenceFact[] = [
    fact(
      "monitoring.collection.unverified",
      `The Prometheus scrape wiring for job "${prometheusScrape.jobName || "unidentified"}" does not prove that a target has collected a metric sample; current authorized target-health evidence is required.`,
      sources.prometheusConfig,
      "scrape_configs[0] configures a target but contains no observed scrape result",
      "unverified",
    ),
    fact(
      "monitoring.export.unverified",
      "OpenTelemetry registration and the Prometheus registry do not prove trace or metric export to a hosted collector; exporter and delivery state require current authorized evidence.",
      sources.instrumentation,
      "registerOTel and getMetricsRegistry source wiring does not contain an observed exporter result",
      "unverified",
    ),
    fact(
      "monitoring.retention.unverified",
      "Local storage-volume wiring does not prove a retention duration, retained sample window, or recoverable monitoring artifact.",
      (sources.dockerCompose ?? sources.prometheusConfig),
      "docker-compose storage wiring and Prometheus config contain no observed retention result",
      "unverified",
    ),
    fact(
      "monitoring.queryability.unverified",
      `Grafana datasource wiring to ${grafanaConfig.prometheusUrl || "an unspecified Prometheus URL"} does not prove a successful operator query or useful release/recovery dashboard result.`,
      sources.grafanaConfig,
      "datasources[0] wiring contains no observed query result",
      "unverified",
    ),
    fact(
      "monitoring.alerting.unverified",
      "Repository-local alert wiring and hosted notification delivery do not prove that an alert reaches an operator; current authorized alert evidence is required.",
      sources.prometheusConfig,
      "prometheus.yml rule_files/alerting configuration and Grafana datasource contain no observed notification result",
      "unverified",
    ),
    fact(
      "monitoring.provider-logs.unverified",
      "Root worker:tail and local observability log routes describe how logs could be accessed, but no provider or local-service log output was accessed by this review.",
      sources.rootPackage,
      "$.scripts.worker:tail and $.scripts.observability:logs",
      "unverified",
    ),
  ];

  const evidenceAssessments: MonitoringEvidenceAssessment[] = [
    {
      dimension: "collection",
      subject: "Prometheus scrape target",
      status: "unverified",
      statement:
        "Scrape configuration is observed locally; collection success and target health are unverified.",
      source: sourceAt(sources.prometheusConfig, "scrape_configs[0]"),
    },
    {
      dimension: "export",
      subject: "OpenTelemetry and Prometheus export",
      status: "unverified",
      statement:
        "Source registration is observed locally; exporter destination and delivery are unverified.",
      source: sourceAt(sources.instrumentation, "registerOTel and metrics registry wiring"),
    },
    {
      dimension: "retention",
      subject: "Local monitoring storage",
      status: "unverified",
      statement:
        "Storage volume wiring is observed when docker-compose.yml is supplied; retention policy and retained data are unverified.",
      source: sourceAt(
        sources.dockerCompose ?? sources.prometheusConfig,
        sources.dockerCompose
          ? "volumes.prometheus-data and volumes.grafana-data"
          : "docker-compose source not supplied",
      ),
    },
    {
      dimension: "queryability",
      subject: "Grafana Prometheus datasource",
      status: "unverified",
      statement:
        "Datasource wiring is observed locally; successful queryability and dashboard usefulness are unverified.",
      source: sourceAt(sources.grafanaConfig, "datasources[0]"),
    },
    {
      dimension: "alerting",
      subject: "Prometheus/Grafana alerting",
      status: hasAlertingConfiguration ? "unverified" : "gap",
      statement: hasAlertingConfiguration
        ? "Local alert configuration is wired, but evaluation and notification delivery are unverified."
        : "No local rule_files or alerting section is wired in the reviewed Prometheus configuration.",
      source: sourceAt(sources.prometheusConfig, "rule_files/alerting configuration"),
    },
  ];

  const gaps = [
    ...sourceWiringGaps(
      sources,
      otelStatus,
      prometheusMetrics,
      prometheusScrape,
      grafanaConfig,
      localStack,
      commandRoutes,
    ),
    ...evidenceDimensionGaps(sources, hasAlertingConfiguration),
    ...procedureGaps(procedures),
  ];

  if (!hasRunbookMonitoringSection) {
    gaps.push({
      id: "monitoring.runbook.incident-response.missing",
      surface: MONITORING_SURFACE,
      missingOrContradictoryElement:
        "The runbook does not contain an observed dedicated monitoring, alert, or incident-response section with operator triage and escalation instructions.",
      risk: "high",
      priority: "P1",
      sourcePaths: [sources.runbook.source.path],
      recommendedFollowUp:
        "Add a monitoring and incident-response section covering signals, expected conditions, owner, escalation, local-service boundaries, and recovery references.",
      namedOwner: "runbook owner",
    });
  }

  const authorizationGuard = new AuthorizationGuard();
  const protectedOperations: ProtectedOperation[] = [
    authorizationGuard.classify({
      action: "local-observability-startup",
      targetSurface: MONITORING_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization to start the local Docker Compose observability stack.",
        "Observed docker compose up output showing Prometheus and Grafana containers started successfully.",
        "Observed Prometheus target health for the configured oando-next target.",
        "Observed metrics response confirming the configured metric output from the local Next.js instance.",
      ],
    }),
    authorizationGuard.classify({
      action: "provider-log-access",
      targetSurface: MONITORING_SURFACE,
      expectedEvidence: [
        "Explicit owner authorization identifying the provider and log access scope.",
        "Authorized provider output confirming OTel trace export and service identity.",
        "Authorized provider output confirming hosted alert-rule and notification-channel state.",
        "If worker:tail is used, authorized Cloudflare Worker log output with the target version and time window.",
      ],
    }),
  ];

  return {
    otelStatus,
    prometheusMetrics,
    prometheusScrape,
    grafanaConfig,
    localStack,
    commandRoutes,
    evidenceAssessments,
    procedures,
    observedConfiguration,
    unverifiedExternalState,
    gaps,
    protectedOperations,
  };
}

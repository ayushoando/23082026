import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const readFixture = (relativePath: string): string =>
  readFileSync(resolve(REPO_ROOT, relativePath), "utf8");

const router = readFixture(".kiro/skills/oando-master/SKILL.md");
const guide = readFixture("agents-work/oando-repository-guide/README.md");
const repositoryMap = readFixture(
  "agents-work/oando-repository-guide/markdown/01-repository-map.md",
);
const workingWithKiro = readFixture(
  "agents-work/oando-repository-guide/markdown/11-working-with-kiro.md",
);

const sectionBetween = (
  source: string,
  startMarker: string,
  endMarker: string,
): string => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);

  if (start < 0 || end < 0) {
    throw new Error(
      `Could not locate section markers ${JSON.stringify(startMarker)} and ${JSON.stringify(endMarker)}.`,
    );
  }

  return source.slice(start, end);
};

const expectInOrder = (source: string, markers: readonly string[]): void => {
  let previousIndex = -1;

  for (const marker of markers) {
    const currentIndex = source.indexOf(marker);
    expect(currentIndex, `Expected marker ${JSON.stringify(marker)}.`).toBeGreaterThan(
      previousIndex,
    );
    previousIndex = currentIndex;
  }
};

const ordinaryLanguageOutcomeArbitrary = fc
  .array(
    fc.constantFrom(
      "map",
      "the",
      "repository",
      "for",
      "a",
      "safe",
      "change",
      "in",
      "the",
      "catalog",
      "and",
      "show",
      "evidence",
    ),
    { minLength: 1, maxLength: 10 },
  )
  .map((words) => words.join(" "));

const routerBeginHere = sectionBetween(
  router,
  "### Begin Here and Route Record",
  "### Conditional skill routing",
);
const guideBeginHere = sectionBetween(
  guide,
  "## Begin Here: describe the outcome, not the repository vocabulary",
  "## Coverage-Audited Repository Domain Index",
);
const firstEvidence = sectionBetween(
  repositoryMap,
  "### Exact first evidence and current guide workstream",
  "The live guide Markdown workstream",
);
const operatingSequence = sectionBetween(
  workingWithKiro,
  "### Operating sequence",
  "### Handoff Record",
);

const authorityOrder = [
  "current user instruction",
  "live code and fresh command output",
  "`AGENTS.md`",
  "`Agents/`",
  "`docs/`",
] as const;

const workflowModes = ["Vibe", "Plan", "Spec", "Autopilot", "Supervised"] as const;
const commandClasses = [
  "read-only inspection",
  "Normal-Agent Eligible Check",
  "Protected Command",
  "no-run pending authorization",
] as const;
const firstEvidencePaths = [
  "`./START.md`",
  "`./AGENTS.md`",
  "`./docs/architecture/layout.md`",
  "`./docs/architecture/stack.md`",
  "`./docs/architecture/routes.md`",
  "`./docs/architecture/product-map.md`",
  "`./plans/README.md`",
  "`./agents-work/oando-repository-guide/README.md`",
  "`./agents-work/oando-repository-guide/markdown/01-repository-map.md`",
] as const;

// **Validates: Requirements SR1.1, 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.9, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 21.1, 21.2, 21.3, 21.4, 21.5**
describe("Property 1: First-router authority and Begin Here ordering", () => {
  it("preserves the routing contract for every ordinary-language outcome", () => {
    fc.assert(
      fc.property(ordinaryLanguageOutcomeArbitrary, (desiredOutcome) => {
        expect(desiredOutcome).toMatch(/[a-z]/i);

        expectInOrder(routerBeginHere, [
          "Read this skill first",
          "Restate the outcome",
          "Select exact first evidence locations",
          "Choose a D01–D22 Repository Domain Index",
          "Select every matching Package Skill",
          "Select `Vibe`, `Plan`, `Spec`, `Autopilot`, or `Supervised`",
          "Classify every proposed command",
          "Ask only unavoidable Owner Decisions",
        ]);
        expectInOrder(guideBeginHere, [
          "Read `./.kiro/skills/oando-master/SKILL.md` first",
          "Restate the outcome",
          "Select exact first evidence locations",
          "Select one D01–D22 Domain Index card",
          "Select every matching Package Skill",
          "Choose `Vibe`, `Plan`, `Spec`, `Autopilot`, or `Supervised`",
          "Classify each proposed command",
          "Request only unavoidable Owner Decisions",
        ]);

        expectInOrder(routerBeginHere, authorityOrder);
        expectInOrder(guideBeginHere, authorityOrder);
        expectInOrder(firstEvidence, firstEvidencePaths);

        expect(router).toContain(".kiro/skills/oando-master/SKILL.md");
        expect(guideBeginHere.indexOf("./.kiro/skills/oando-master/SKILL.md")).toBeLessThan(
          guideBeginHere.indexOf("./AGENTS.md"),
        );

        expect(router).toContain("D01–D22");
        expect(router).toContain("using D22 for an unfamiliar area");
        expect(guide).toContain("D22 when the topic is unfamiliar");

        for (const mode of workflowModes) {
          expect(router).toContain(`\`${mode}\``);
          expect(workingWithKiro).toContain(`\`${mode}\``);
        }
        for (const commandClass of commandClasses) {
          expect(router).toContain(commandClass);
          expect(workingWithKiro).toContain(commandClass);
        }

        expectInOrder(router, [
          "Workflow Mode:",
          "Operational-Risk Classification:",
          "Command Classification:",
          "Unavoidable Owner Decisions:",
        ]);
        expectInOrder(guide, [
          "Workflow Mode:",
          "Operational-Risk Classification:",
          "Command Classification for every proposed command:",
          "Unavoidable Owner Decisions:",
        ]);

        expect(router).toContain(
          "Every Repository Task begins with exactly four Active Agent slots",
        );
        expect(workingWithKiro).toContain(
          "Every Repository Task starts in Standing Multi-Agent Mode with exactly four Active Agent slots",
        );
        expectInOrder(operatingSequence, [
          "Coordinator publishes four roster entries",
          "Scout/Map and Planner/Risk return read-only handoffs",
          "Implementer receives write permission only for approved exclusive paths",
        ]);
      }),
      { numRuns: 100 },
    );
  });
});

interface DomainCardExpectation {
  readonly id: string;
  readonly title: string;
  readonly chapters: string;
  readonly startPaths: readonly string[];
}

const property3CardExpectations: readonly DomainCardExpectation[] = [
  {
    id: "D01",
    title: "Map repository authority",
    chapters: "01",
    startPaths: [
      "./START.md",
      "./AGENTS.md",
      "./docs/architecture/layout.md",
      "./docs/architecture/stack.md",
      "./docs/architecture/routes.md",
      "./docs/architecture/product-map.md",
      "./agents-work/oando-repository-guide/README.md",
      "./agents-work/oando-repository-guide/markdown/01-repository-map.md",
      "./plans/README.md",
    ],
  },
  {
    id: "D02",
    title: "Initialize, develop, and debug safely",
    chapters: "09",
    startPaths: [
      "./START.md",
      "./AGENTS.md",
      "./package.json",
      "./site/",
      "./config/build/",
      "./Failures.md",
      "./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md",
    ],
  },
  {
    id: "D03",
    title: "Trace auth, security, and secrets",
    chapters: "04",
    startPaths: [
      "./site/proxy.ts",
      "./site/lib/security/",
      "./site/platform/supabase/",
      "./.env.example",
      "./.env.local",
      "./site/.env.local",
      "./docs/architecture/stack.md",
    ],
  },
  {
    id: "D04",
    title: "Classify environment state",
    chapters: "09",
    startPaths: [
      "./.env.example",
      "./.env.local",
      "./site/.env.local",
      "./package.json",
      "./pnpm-workspace.yaml",
      "./START.md",
      "./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md",
    ],
  },
  {
    id: "D05",
    title: "Locate and assess APIs",
    chapters: "04",
    startPaths: [
      "./site/app/api/",
      "./site/lib/apiCatalog.ts",
      "./site/proxy.ts",
      "./docs/architecture/routes.md",
      "./agents-work/oando-repository-guide/markdown/04-data-api-persistence.md",
    ],
  },
  {
    id: "D06",
    title: "Improve Site UI, SEO, accessibility, or performance",
    chapters: "02–03",
    startPaths: [
      "./site/app/(site)/",
      "./site/features/site/",
      "./site/components/home/",
      "./site/focss/site/",
      "./site/i18n/",
      "./docs/architecture/routes.md",
      "./docs/architecture/product-map.md",
      "./docs/architecture/stack.md",
    ],
  },
  {
    id: "D07",
    title: "Polish UI, icons, alignment, motion, or assets",
    chapters: "03",
    startPaths: [
      "./site/components/",
      "./site/focss/",
      "./site/public/",
      "./scripts/generate-svg/",
      "./docs/architecture/css.md",
      "./docs/architecture/stack.md",
      "./agents-work/oando-repository-guide/markdown/03-product-domains.md",
    ],
  },
  {
    id: "D08",
    title: "Work in Admin",
    chapters: "03",
    startPaths: [
      "./site/app/admin/",
      "./site/features/admin/",
      "./site/components/",
      "./site/lib/admin/",
      "./docs/architecture/routes.md",
      "./docs/architecture/product-map.md",
    ],
  },
  {
    id: "D09",
    title: "Assess CRM demo versus customer-query operations",
    chapters: "03, 06",
    startPaths: [
      "./site/app/admin/crm/",
      "./site/features/crm/",
      "./site/app/admin/customer-queries/",
      "./site/app/api/customer-queries/",
      "./site/features/ops/",
      "./docs/architecture/product-map.md",
      "./docs/architecture/routes.md",
    ],
  },
  {
    id: "D10",
    title: "Trace catalog, configurator, quotes, or inventory",
    chapters: "03–04",
    startPaths: [
      "./site/lib/catalog/",
      "./site/features/shared/catalog/",
      "./site/app/(site)/products/",
      "./site/app/(site)/quote-cart/",
      "./site/app/admin/catalog/",
      "./site/app/admin/inventory/",
      "./site/app/api/configurator/",
      "./site/platform/supabase/migrations/",
    ],
  },
  {
    id: "D11",
    title: "Change Planner safely",
    chapters: "03",
    startPaths: [
      "./site/app/ooplanner/",
      "./site/features/Planner/",
      "./site/components/Planner/",
      "./site/lib/Planner/",
      "./site/hooks/Planner/",
      "./site/store/Planner/",
      "./site/server/Planner/",
      "./site/platform/Planner/",
      "./site/app/api/Planner/",
      "./agents-work/oando-repository-guide/markdown/03-product-domains.md",
    ],
  },
  {
    id: "D12",
    title: "Change Studio safely",
    chapters: "03",
    startPaths: [
      "./site/app/oostudio/",
      "./site/features/Studio/",
      "./site/components/Studio/",
      "./site/lib/Studio/",
      "./site/hooks/Studio/",
      "./site/store/Studio/",
      "./site/server/Studio/",
      "./site/platform/Studio/",
      "./site/app/api/Studio/",
      "./agents-work/oando-repository-guide/markdown/03-product-domains.md",
    ],
  },
  {
    id: "D13",
    title: "Assess AI and retrieval",
    chapters: "03",
    startPaths: [
      "./site/lib/ai/mastra/",
      "./site/app/api/ai-advisor/",
      "./site/app/api/Studio/ai/",
      "./site/features/Studio/",
      "./docs/architecture/stack.md",
      "./agents-work/oando-repository-guide/markdown/03-product-domains.md",
    ],
  },
  {
    id: "D14",
    title: "Select database ownership and persistence mode",
    chapters: "04",
    startPaths: [
      "./site/platform/supabase/migrations/",
      "./site/platform/supabase/migrations.admin/",
      "./site/platform/drizzle/schema/",
      "./site/lib/Planner/plannerPersistenceMode.ts",
      "./site/lib/catalog/furnitureCatalogMode.ts",
      "./site/platform/Planner/data/",
      "./site/platform/shared/data/furniture/",
      "./site/inventory/descriptors/",
      "./docs/database/schema.md",
      "./docs/database/ops.md",
      "./docs/database/drizzle.md",
    ],
  },
  {
    id: "D15",
    title: "Plan tests, fixtures, mocks, and validation",
    chapters: "05, 10",
    startPaths: [
      "./tests/",
      "./tests/unit/",
      "./tests/integration/",
      "./tests/e2e/",
      "./tests/fixtures/",
      "./tests/helpers/",
      "./tests/tech-docs-generator/",
      "./config/build/",
      "./Testing-handbook.md",
      "./package.json",
    ],
  },
  {
    id: "D16",
    title: "Inspect scripts and command registry",
    chapters: "05",
    startPaths: [
      "./package.json",
      "./scripts/",
      "./scripts/run-ops.mjs",
      "./scripts/ops-command-registry.mjs",
      "./config/build/",
      "./docs/architecture/scripts.md",
      "./agents-work/oando-repository-guide/markdown/05-tooling-ci-tech-docs.md",
    ],
  },
  {
    id: "D17",
    title: "Map packages, dependencies, and workspace boundaries",
    chapters: "05",
    startPaths: [
      "./package.json",
      "./pnpm-workspace.yaml",
      "./pnpm-lock.yaml",
      "./site/",
      "./site/tsconfig.json",
      "./tech-docs-generator/",
      "./tech-docs-generator/package.json",
      "./config/build/",
      "./docs/architecture/stack.md",
    ],
  },
  {
    id: "D18",
    title: "Maintain documentation and locked guidance",
    chapters: "07",
    startPaths: [
      "./docs/architecture/",
      "./docs/database/",
      "./docs/governance/",
      "./docs/governance/charter.md",
      "./docs/governance/focss-stop-drift.md",
      "./AGENTS.md",
      "./DOC-MAP.md",
      "./CONTENTS.md",
      "./site/data/storage/",
      "./agents-work/oando-repository-guide/markdown/07-docs-governance-planning.md",
    ],
  },
  {
    id: "D19",
    title: "Place results, generated documents, agent work, and blockers",
    chapters: "07, 09",
    startPaths: [
      "./results/",
      "./results/tests/",
      "./results/site/",
      "./results/site-ui/",
      "./results/ops/",
      "./generated-documents/",
      "./agents-work/",
      "./plans/",
      "./plans/README.md",
      "./Failures.md",
      "./agent-reports/",
      "./agents-work/oando-repository-guide/markdown/09-local-generated-environment.md",
    ],
  },
  {
    id: "D20",
    title: "Route Kiro skills, Powers, MCP, and agents",
    chapters: "08",
    startPaths: [
      "./.kiro/",
      "./.kiro/skills/",
      "./.kiro/agents/",
      "./.kiro/mcp/",
      "./.kiro/settings/mcp.json",
      "./.kiro/hooks/",
      "./skills-lock.json",
      "./agents-work/oando-repository-guide/markdown/08-kiro-workspace.md",
    ],
  },
  {
    id: "D21",
    title: "Plan operations, deployment, backups, and incidents",
    chapters: "06",
    startPaths: [
      "./vercel.json",
      "./workers/oando-worker-proxy/",
      "./config/observability/",
      "./.github/workflows/supabase-backup-r2.yml",
      "./OPERATIONS_RUNBOOK.md",
      "./scripts/",
      "./Failures.md",
      "./site/instrumentation.ts",
      "./agents-work/oando-repository-guide/markdown/06-operations-infrastructure.md",
    ],
  },
  {
    id: "D22",
    title: "Discover an unknown area safely",
    chapters: "01, 07, 08",
    startPaths: [
      "./START.md",
      "./AGENTS.md",
      "./docs/architecture/layout.md",
      "./agents-work/oando-repository-guide/markdown/01-repository-map.md",
      "./agents-work/oando-repository-guide/README.md",
      "./plans/README.md",
      "./.kiro/skills/repo-map/SKILL.md",
      "./Failures.md",
    ],
  },
] as const;

const orderedCardEvidenceSteps =
  "(1) read authority sources in authority order; (2) inspect the listed Start Paths; (3) compare documentation with live repository evidence; (4) classify Surface Status and operational risk; (5) record evidence, gaps, the Route Record, and the Next Decision.";

const requiredCardFields = [
  "Chapter mapping",
  "Goal",
  "Start Paths",
  "Scope",
  "Required Actions",
  "Evidence Steps",
  "Allowed Actions",
  "Forbidden Actions",
  "Risk",
  "Routing and Command Classification",
  "Surface Status / Coverage Gap",
  "Artifact Boundary (when output is produced)",
  "Site Write Gate (when a target is under `./site/`)",
  "Expected Evidence",
  "Next Decision",
] as const;

const property3CardIdArbitrary = fc.constantFrom(
  "D01",
  "D02",
  "D03",
  "D04",
  "D05",
  "D06",
  "D07",
  "D08",
  "D09",
  "D10",
  "D11",
  "D12",
  "D13",
  "D14",
  "D15",
  "D16",
  "D17",
  "D18",
  "D19",
  "D20",
  "D21",
  "D22",
);

const property3TableRows = (source: string): string[][] =>
  source
    .split("\n")
    .filter((line) => /^\| D\d{2}\b/.test(line))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()));

const property3FieldValue = (section: string, label: string): string => {
  const marker = `- **${label}:**`;
  const line = section.split("\n").find((candidate) => candidate.startsWith(marker));

  if (!line) {
    throw new Error(`Missing card field ${JSON.stringify(label)}.`);
  }

  return line.slice(marker.length).trim();
};

const property3InlineCodeValues = (value: string): string[] =>
  [...value.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? "");

const property3CardSection = (cardId: string): string => {
  const startMarker = `### ${cardId} —`;
  const start = guide.indexOf(startMarker);
  const nextCard = guide.indexOf("\n### D", start + startMarker.length);
  const end =
    nextCard >= 0 ? nextCard : guide.indexOf("\n### Coverage Audit", start + startMarker.length);

  if (start < 0 || end < 0) {
    throw new Error(`Could not locate the complete ${cardId} card section.`);
  }

  return guide.slice(start, end);
};

const assertProperty3Card = (cardId: string): void => {
  const expectation = property3CardExpectations.find((card) => card.id === cardId);

  if (!expectation) {
    throw new Error(`No Property 3 expectation exists for ${cardId}.`);
  }

  const section = property3CardSection(cardId);

  for (const label of requiredCardFields) {
    expect(property3FieldValue(section, label), `${cardId} ${label}`).not.toBe("");
  }

  expect(property3FieldValue(section, "Chapter mapping")).toContain(
    "Coverage Audit row",
  );
  expect(property3FieldValue(section, "Chapter mapping")).toContain(
    "numbered guide chapter",
  );
  expect(property3FieldValue(section, "Start Paths")).toContain("./");
  expect(property3InlineCodeValues(property3FieldValue(section, "Start Paths"))).toEqual(
    expectation.startPaths,
  );
  expect(property3FieldValue(section, "Evidence Steps")).toBe(orderedCardEvidenceSteps);
  expect(property3FieldValue(section, "Required Actions")).toContain(
    "ordered Evidence Steps",
  );
  expect(property3FieldValue(section, "Routing and Command Classification")).toContain(
    "matching classifier row",
  );
  expect(property3FieldValue(section, "Surface Status / Coverage Gap")).toContain(
    "Coverage-Gap Admission",
  );
};

// **Validates: Requirements SR2.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 20.1, 20.2, 20.3, 20.4, 20.5, 20.7, 20.8**
describe("Property 3: Complete 22-card coverage and ordered evidence", () => {
  it("preserves each coverage-audited card contract for arbitrary card selections", () => {
    fc.assert(
      fc.property(property3CardIdArbitrary, (cardId) => {
        assertProperty3Card(cardId);
      }),
      { numRuns: 100 },
    );
  });

  it("keeps the complete card index, classifier, Coverage Audit, and D22 fallback aligned", () => {
    const expectedCardIds = property3CardExpectations.map((card) => card.id);
    const cardHeadings = [...guide.matchAll(/^### (D\d{2}) — (.+)$/gm)].map((match) => ({
      id: match[1] ?? "",
      title: match[2] ?? "",
    }));

    expect(cardHeadings).toHaveLength(22);
    expect(new Set(cardHeadings.map((heading) => heading.id)).size).toBe(22);
    expect(cardHeadings).toEqual(
      property3CardExpectations.map(({ id, title }) => ({ id, title })),
    );

    for (const expectation of property3CardExpectations) {
      assertProperty3Card(expectation.id);
    }

    const coverageAudit = sectionBetween(
      guide,
      "### Coverage Audit",
      "### Surface Status and Coverage-Gap Admission",
    );
    const coverageHeader = coverageAudit
      .split("\n")
      .find((line) => line.startsWith("| Card |"));
    const coverageRows = property3TableRows(coverageAudit);

    expect(coverageHeader).toBe(
      "| Card | Outcome | Chapter | Verified Paths | Surface Status | Evidence Sources | Evidence Limitation | Next Decision |",
    );
    expect(coverageRows).toHaveLength(22);
    expect(coverageRows.map((row) => row[0])).toEqual(expectedCardIds);

    for (const expectation of property3CardExpectations) {
      const row = coverageRows.find(([cardId]) => cardId === expectation.id);

      expect(row, `${expectation.id} Coverage Audit row`).toBeDefined();
      if (!row) {
        continue;
      }

      expect(row).toHaveLength(8);
      expect(row[1]).not.toBe("");
      expect(row[2]).toBe(expectation.chapters);
      expect(row[3]).toBe(`${expectation.id} Start Paths above`);
      expect(row[4]).toMatch(
        /wired|demo\/local-only|present-but-unverified|unwired\/absent|legacy/,
      );
      for (const cell of row.slice(5)) {
        expect(cell).not.toBe("");
      }
    }

    const classifier = sectionBetween(
      guide,
      "## Task-classifier table",
      "### Protected-root scope clarification",
    );
    const classifierHeader = classifier
      .split("\n")
      .find((line) => line.startsWith("| Card |"));
    const classifierRows = property3TableRows(classifier);

    expect(classifierHeader).toBe(
      "| Card | Trigger | First Local Evidence | Selected skills | Command classification | Completion evidence |",
    );
    expect(classifierRows).toHaveLength(22);
    expect(new Set(classifierRows.map((row) => row[0]?.slice(0, 3))).size).toBe(22);
    expect(classifierRows.map((row) => row[0]?.slice(0, 3))).toEqual(expectedCardIds);

    for (const row of classifierRows) {
      expect(row).toHaveLength(6);
      for (const cell of row.slice(1)) {
        expect(cell).not.toBe("");
      }
      expect(row[2]).toMatch(/`[^`]+`|Local Evidence/);
      expect(row[3]).toMatch(/`[^`]+`|Local Evidence/);
    }

    const d22Classifier = classifierRows.find((row) => row[0]?.startsWith("D22 "));
    expect(d22Classifier).toBeDefined();
    if (!d22Classifier) {
      return;
    }

    expect(d22Classifier[1]).toContain("Omitted, unfamiliar, or newly discovered repository area");
    expect(d22Classifier[2]).toContain("`./START.md`");
    expect(d22Classifier[3]).toContain("`repo-map`");
    expect(d22Classifier[4]).toContain("Read-only inspection first");
    expect(d22Classifier[5]).toContain("Coverage-Gap Admission");

    expect(guide).toContain(
      "Select one D01–D22 Domain Index card, or D22 when the topic is unfamiliar.",
    );
    expect(guide).toContain("### D22 — Discover an unknown area safely");
    expect(guide).toContain(
      "These fields are guidance records only: they do not prove runtime loading, enforcement, rendered behavior, hosted persistence, HTML parity, relocation, or a wired capability.",
    );
    expect(guide).toContain(
      "This table makes the D01–D22 routing decision inspectable. It is a prose index, not a runtime scanner.",
    );
  });
});


const responseLifecycleArbitrary = fc.constantFrom(
  "task-start",
  "progress",
  "handoff",
  "pause",
  "completion",
);

const responseContractFields = [
  "Outcome",
  "Known",
  "Unverified",
  "Exact First Evidence Locations",
  "Selected Skills",
  "Rejected Skills and Reasons",
  "Numbered Next Actions",
  "Likely Files or Areas",
  "Risk",
  "Allowed Checks",
  "Protected or Pending Checks",
  "Exact Completion Proof",
  "Unavoidable Owner Decisions",
] as const;

const guideResponseContract = sectionBetween(
  guide,
  "## Plain-Language Response Contract",
  "## Standing Multi-Agent Mode",
);
const routerResponseContract = sectionBetween(
  router,
  "### Plain-Language Response Contract",
  "### Standing Multi-Agent Mode and compliance",
);
const guideCompletionRecord = sectionBetween(
  guide,
  "### Completion Record",
  "## Standing Multi-Agent Mode",
);
const guideStandingMultiAgent = sectionBetween(
  guide,
  "## Standing Multi-Agent Mode",
  "## Separate Approval Work boundaries",
);
const routerStandingMultiAgent = sectionBetween(
  router,
  "### Standing Multi-Agent Mode and compliance",
  "### Separate Approval Work and completion",
);

// **Validates: Requirements SR2.2, SR2.3, SR2.4, 15.1, 15.2, 15.3, 15.4, 15.5, 21.6, 21.7, 21.8, 21.9, 21.10, 22.7**
describe("Property 4: Mandatory ordered Plain-Language Response Contract", () => {
  it("preserves the response contract for every task lifecycle state", () => {
    fc.assert(
      fc.property(responseLifecycleArbitrary, (lifecycle) => {
        expect(lifecycle).toMatch(/^(task-start|progress|handoff|pause|completion)$/);

        for (const responseSection of [guideResponseContract, routerResponseContract]) {
          expectInOrder(responseSection, responseContractFields);
          expect(responseSection).toContain("Explain specialized terms before");
          expect(responseSection).toContain("Artifact Class");
          expect(responseSection).toContain("filename pattern");
          expect(responseSection).toContain("rejected placements");
          expect(responseSection).toContain("Site Write Gate");
        }

        for (const responseKind of [
          "task-start",
          "progress",
          "handoff",
          "pause",
          "completion",
        ]) {
          expect(guideResponseContract).toContain(responseKind);
          expect(routerResponseContract).toContain(responseKind);
        }

        expectInOrder(guideBeginHere, [
          "define specialized terms before requesting a decision",
          "Request only unavoidable Owner Decisions",
        ]);
        expectInOrder(routerBeginHere, [
          "define specialized terms",
          "Ask only unavoidable Owner Decisions",
        ]);
        expectInOrder(guideResponseContract, [
          "Explain specialized terms before requesting a decision",
          "Unavoidable Owner Decisions",
        ]);
        expectInOrder(routerResponseContract, [
          "Explain specialized terms before decisions",
          "Unavoidable Owner Decisions",
        ]);

        expect(guideResponseContract).toContain(
          "Missing proof remains `pending`, `blocked`, or `not-observed`",
        );
        expect(guideResponseContract).toContain(
          "never silently promoted to pass, wired, complete, runtime, rendered, hosted, or relocated",
        );
        expect(guideCompletionRecord).toContain(
          "pending validation with the exact command and authorization limitation",
        );
        expect(guideCompletionRecord).toContain("next owner");
        expect(router).toContain("An unavailable value is `not-observed`, not omitted.");
        expect(router).toContain(
          "does not promote missing evidence to `verified` or `complete`",
        );
        expect(router).toContain("Pending User Validation");
        expect(guide).toContain("Validation State:");
        expect(router).toContain("Validation State:");
        expect(router).toContain(
          "Every observed check records exact command, repository-root cwd, scope, authorization state, Hook Decision, exit status, output limitation, and behavior not verified.",
        );
        expect(router).toMatch(/next owner/i);

        expectInOrder(guideStandingMultiAgent, [
          "Before action, publish the Agent Roster",
          "Pre-Action Gate Records",
          "Close only after verification with exact proof",
        ]);
        expect(guideCompletionRecord).toContain("At completion or pause");
        expect(guideCompletionRecord).toContain(
          "exact observed static or authorized evidence",
        );
        expectInOrder(router, [
          "Publish Agent Roster",
          "Every handoff contains",
          "Completion states exact changed scope, observed static evidence, pending checks",
        ]);
        expect(routerStandingMultiAgent).toContain("Pre-Action Gate Records");

        for (const artifactField of [
          "Workstream Subfolder or Purpose Subfolder",
          "owning source or script",
          "authored-or-generated state",
          "Locked Path Gate",
          "observed placement",
        ]) {
          expect(guideResponseContract, `Guide artifact field: ${artifactField}`).toContain(
            artifactField,
          );
        }
        for (const artifactField of [
          "selected subfolder",
          "owner/source",
          "authored/generated state",
          "observed placement",
          "Site Write Gate state",
        ]) {
          expect(routerResponseContract, `Router artifact field: ${artifactField}`).toContain(
            artifactField,
          );
        }
        expect(guide).toContain("Locked Path Gate");
        expect(router).toContain("Locked Path Gate state:");
        expect(guide).toContain("Site Write Gate");
        expect(router).toContain("Site Write Gate state:");

        expect(guide).toContain(
          "A command name, plan, inline marker, path, import, or prose rule is not a command result.",
        );
        expect(guide).toContain("universal pre-action interceptor");
        expect(router).toContain(
          "without claiming runtime loading, command success, rendered behavior, hosted persistence, connected MCP, installed Power, or relocation from prose alone.",
        );
        expect(router).toContain("universal pre-action interceptor");
      }),
      { numRuns: 100 },
    );
  });
});

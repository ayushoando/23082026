import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

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
const kiroWorkspace = readFixture(
  "agents-work/oando-repository-guide/markdown/08-kiro-workspace.md",
);
const mcpConfiguration = readFixture(".kiro/settings/mcp.json");
const aiRetrievalSkillPath = ".kiro/skills/ai-retrieval/SKILL.md";
const aiRetrievalSkillPresent = existsSync(
  resolve(REPO_ROOT, aiRetrievalSkillPath),
);
const aiRetrievalSkill = aiRetrievalSkillPresent
  ? readFixture(aiRetrievalSkillPath)
  : "";

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
const property6RouterRouting = sectionBetween(
  router,
  "### Conditional skill routing",
  "### Domain and surface safeguards",
);
const property6GuideRouting = sectionBetween(
  kiroWorkspace,
  "## Conditional repository skill routing",
  "## Kiro Markdown inventory baseline",
);
const property6GuideCapabilityEvidence = sectionBetween(
  kiroWorkspace,
  "## Static versus runtime capability evidence",
  "Use the Plain-Language Response Contract",
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

interface PromptCookbookCategoryExpectation {
  readonly number: number;
  readonly name: string;
  readonly scopeBoundary: string;
  readonly firstEvidence: string;
  readonly stopCondition: string;
  readonly routingMarker?: string;
}

const property5CategoryExpectations: readonly PromptCookbookCategoryExpectation[] = [
  {
    number: 1,
    name: "Understand Repository",
    scopeBoundary: "map only; do not edit product code or protected files.",
    firstEvidence:
      "`./START.md`, `./AGENTS.md`, `./docs/architecture/layout.md`, and `./agents-work/oando-repository-guide/README.md`.",
    stopCondition:
      "Stop before modification or command execution and state the next owner decision.",
    routingMarker: "select every matching skill",
  },
  {
    number: 2,
    name: "Find Where to Work",
    scopeBoundary: "discover the owner and candidate paths only; do not edit.",
    firstEvidence:
      "`./site/app/`, `./site/features/`, `./site/components/`, `./site/lib/`, `./site/platform/`, and the matching D01–D22 card.",
    stopCondition:
      "Stop on competing owners, absent paths, or a proposed `./site/` Non-Core Artifact.",
    routingMarker: "select every matching skill",
  },
  {
    number: 3,
    name: "Small UI/Icon/Alignment Fix",
    scopeBoundary:
      "one bounded interface outcome; do not add an icon library, custom CSS system, or unrelated cleanup.",
    firstEvidence:
      "user-facing route, nearby component, `./site/focss/`, existing Phosphor abstraction, and `./scripts/generate-svg/` when assets are involved.",
    stopCondition:
      "Stop before any unowned write or external asset/tool proposal.",
    routingMarker: "select every matching skill including `focss-css` when triggered",
  },
  {
    number: 4,
    name: "Feature",
    scopeBoundary:
      "trace route → feature → component → shared/server → platform/persistence → proof; do not implement adjacent work.",
    firstEvidence:
      "matching route, feature, component, `./site/lib/`, `./site/server/`, `./site/platform/`, and tests.",
    stopCondition: "Stop at an unverified external/data boundary or scope expansion.",
    routingMarker: "select every matching skill",
  },
  {
    number: 5,
    name: "Site UI",
    scopeBoundary:
      "Site UI/SEO/i18n/accessibility/performance only; no report or generated file under `./site/`.",
    firstEvidence:
      "`./site/app/(site)/`, `./site/features/site/`, `./site/components/home/`, `./site/focss/site/`, and `./site/i18n/`.",
    stopCondition: "Stop before claiming browser/performance proof.",
    routingMarker: "select every matching skill including `focss-css` when triggered",
  },
  {
    number: 6,
    name: "Planner",
    scopeBoundary: "Planner only; do not import Studio or modify unowned paths.",
    firstEvidence:
      "`./site/app/ooplanner/`, `./site/features/Planner/`, `./site/components/Planner/`, `./site/lib/Planner/`, `./site/hooks/Planner/`, `./site/store/Planner/`, `./site/server/Planner/`, `./site/platform/Planner/`, and `./site/app/api/Planner/`.",
    stopCondition: "Stop before cross-fork writes or persistence action.",
    routingMarker: "select `planner-studio` and `fork-boundaries` when the Fork Tree or imports are involved",
  },
  {
    number: 7,
    name: "Studio",
    scopeBoundary: "Studio only; do not borrow Planner modules or claim Planner proof.",
    firstEvidence:
      "`./site/app/oostudio/`, `./site/features/Studio/`, `./site/components/Studio/`, `./site/lib/Studio/`, `./site/hooks/Studio/`, `./site/store/Studio/`, `./site/server/Studio/`, `./site/platform/Studio/`, and `./site/app/api/Studio/`.",
    stopCondition: "Stop before cross-fork or publish changes.",
    routingMarker: "select `planner-studio` and `fork-boundaries` when the Fork Tree or imports are involved",
  },
  {
    number: 8,
    name: "Admin",
    scopeBoundary: "Admin route/feature/auth/data ownership; no remote mutation or secret exposure.",
    firstEvidence:
      "`./site/app/admin/`, `./site/features/admin/`, `./site/lib/admin/`, route docs, and the relevant database owner.",
    stopCondition: "Stop before migration, remote action, or service-role use.",
    routingMarker:
      "select every matching skill including `db-migrations`, `focss-css`, or `graph-impact` only when triggered",
  },
  {
    number: 9,
    name: "CRM/Unwired Assessment",
    scopeBoundary:
      "compare CRM browser workspace and customer-query operations; do not combine them.",
    firstEvidence:
      "`./site/app/admin/crm/`, `./site/features/crm/`, `./site/app/admin/customer-queries/`, `./site/app/api/customer-queries/`, and `./site/features/ops/`.",
    stopCondition: "Stop before calling an unverified surface wired.",
    routingMarker: "select matching skills",
  },
  {
    number: 10,
    name: "Catalog/Configurator/Quotes/Inventory",
    scopeBoundary:
      "catalog/configurator/quote/inventory trace; no seed/publish/storage/migration action.",
    firstEvidence:
      "`./site/lib/catalog/`, `./site/features/shared/catalog/`, `./site/app/(site)/products/`, `./site/app/(site)/quote-cart/`, `./site/app/admin/catalog/`, `./site/app/admin/inventory/`, `./site/app/api/configurator/`, and Products migrations.",
    stopCondition: "Stop before remote or data mutation.",
    routingMarker:
      "select matching `db-migrations`, `focss-css`, and `graph-impact` skills when triggered",
  },
  {
    number: 11,
    name: "Database",
    scopeBoundary:
      "plan/review only unless exact migration ownership is approved; no apply.",
    firstEvidence:
      "`./site/platform/supabase/migrations/`, `./site/platform/supabase/migrations.admin/`, `./site/platform/drizzle/schema/`, persistence selectors, and database docs.",
    stopCondition: "Stop before SQL apply, seed, or remote access.",
    routingMarker:
      "select `db-migrations` for schema/SQL/RLS/grants/rollback/ownership and every other matching skill",
  },
  {
    number: 12,
    name: "AI/Retrieval",
    scopeBoundary: "advisory server-side AI/retrieval assessment; no provider call, package, or deployment.",
    firstEvidence:
      "`./site/lib/ai/mastra/`, `./site/app/api/ai-advisor/`, `./site/app/api/Studio/ai/`, `./site/features/Studio/`, and stack guidance.",
    stopCondition: "Stop before unsupported evaluation or deployment claims.",
    routingMarker:
      "select `ai-retrieval` only if `./.kiro/skills/ai-retrieval/SKILL.md` exists and select all other matching skills",
  },
  {
    number: 13,
    name: "Image/Animation/Assets",
    scopeBoundary: "asset/motion work only; no external capability or new package by assumption.",
    firstEvidence:
      "`./site/public/`, `./scripts/generate-svg/`, nearby component patterns, `./site/focss/`, and existing motion imports.",
    stopCondition: "Stop before publication or external tooling.",
    routingMarker: "select every matching visual/impact skill",
  },
  {
    number: 14,
    name: "API/Security",
    scopeBoundary: "API/security trace; no security-control weakening or hosted call.",
    firstEvidence:
      "`./site/app/api/`, `./site/lib/apiCatalog.ts`, `./site/proxy.ts`, `./site/lib/security/`, and route docs.",
    stopCondition: "Stop before changing security controls or exposing secrets.",
    routingMarker: "select `db-migrations` or `graph-impact` when evidence triggers",
  },
  {
    number: 15,
    name: "Environment",
    scopeBoundary: "classify environment only; do not print, sync, commit, or change secrets.",
    firstEvidence:
      "`./.env.example`, local env paths, `./package.json`, `./pnpm-workspace.yaml`, `./START.md`, and D04.",
    stopCondition: "Stop before service launch or environment mutation.",
    routingMarker: "select matching skills",
  },
  {
    number: 16,
    name: "Bug/Failing Test",
    scopeBoundary:
      "inspect the symptom and narrow source/test owner; do not infer a failure cause from unobserved output.",
    firstEvidence:
      "reported symptom, relevant test source, `./Failures.md`, and narrow implementation path.",
    stopCondition: "Stop before running a test or changing configuration without authorization.",
    routingMarker: "select matching skills",
  },
  {
    number: 17,
    name: "Gate-Failure Triage",
    scopeBoundary:
      "read-only Full Gate Failure Triage; do not alter hooks, baselines, tests, or allowlists.",
    firstEvidence:
      "exact reported command, repository root, authorization/hook state, and any current output.",
    stopCondition: "Stop if current authorized output is absent and label the cause unverified.",
  },
  {
    number: 18,
    name: "Refactor",
    scopeBoundary: "preserve behavior and exact approved paths; no opportunistic cleanup.",
    firstEvidence:
      "owning source, imports/consumers, fork roots, persistence boundary, and narrow proof source.",
    stopCondition: "Stop on shared/unowned paths, fork boundary, or new behavior.",
    routingMarker:
      "use `graph-impact` for Shared Code or blast radius and every other matching skill",
  },
  {
    number: 19,
    name: "Documentation",
    scopeBoundary:
      "update only the approved guide/workstream path; do not edit locked docs or HTML without provenance.",
    firstEvidence:
      "`./AGENTS.md`, `./DOC-MAP.md`, `./CONTENTS.md`, `./Agents/05-documentation.md`, `./plans/README.md`, and the owning document.",
    stopCondition: "Stop before a handwritten report under `./results/` or a locked write.",
    routingMarker: "select matching skills",
  },
  {
    number: 20,
    name: "Package/Dependency",
    scopeBoundary: "assess package status only; no install, manifest, lockfile, or workspace move.",
    firstEvidence:
      "`./package.json`, `./pnpm-workspace.yaml`, `./pnpm-lock.yaml`, live imports, `./site/tsconfig.json`, `./tech-docs-generator/package.json`, and stack docs.",
    stopCondition: "Stop before package installation or moving `./tech-docs-generator/` into `./site/`/`./results/site/`.",
    routingMarker:
      "select `powers-skills-model` or `graph-impact` only when triggered",
  },
  {
    number: 21,
    name: "Deployment/Ops",
    scopeBoundary: "read-only target/risk/rollback plan; no deploy, remote mutation, service, or backup.",
    firstEvidence:
      "`./vercel.json`, Worker, R2, observability, runbook, workflows, scripts, and instrumentation.",
    stopCondition: "Stop before external action.",
    routingMarker: "select matching operational/database skills",
  },
  {
    number: 22,
    name: "Backup/Import/Export",
    scopeBoundary: "plan backup/import/export/recovery only; no data movement.",
    firstEvidence:
      "`./OPERATIONS_RUNBOOK.md`, R2 scripts/registry, backup workflow, data owner, and recovery path.",
    stopCondition: "Stop before backup, import, export, or external storage action.",
    routingMarker: "select matching operational/database skills",
  },
  {
    number: 23,
    name: "Unknown Task",
    scopeBoundary:
      "D22 read-only discovery; do not create a category, package, Power, MCP, or runtime implementation.",
    firstEvidence:
      "`./START.md`, `./AGENTS.md`, layout docs, this guide, `./plans/README.md`, `./.kiro/skills/repo-map/SKILL.md`, and `./Failures.md`.",
    stopCondition: "Stop before editing from guesswork.",
    routingMarker: "select every matching skill",
  },
  {
    number: 24,
    name: "Finish Current Task",
    scopeBoundary:
      "reconcile only the current Route Record, ownership, changed paths, handoffs, gaps, and evidence; do not add cleanup.",
    firstEvidence:
      "current Route Record, Agent Roster, Ownership Matrix, changed scope, handoffs, and target files.",
    stopCondition: "Stop if proof, ownership, or authorization is unresolved.",
    routingMarker: "select every matching skill",
  },
  {
    number: 25,
    name: "Emergency Prompt for an Overwhelmed Owner",
    scopeBoundary: "",
    firstEvidence: "",
    stopCondition: "",
    routingMarker: "select every matching Package Skill",
  },
] as const;

const property5PromptCookbook = sectionBetween(
  workingWithKiro,
  "## Complete Prompt Cookbook",
  "## Six Standing Multi-Agent prompts outside the cookbook count",
);
const property5SafetyPreamble = sectionBetween(
  workingWithKiro,
  "## Prompt Safety Preamble",
  "## Complete Prompt Cookbook",
);
const property5StandingPromptSection = sectionBetween(
  workingWithKiro,
  "## Six Standing Multi-Agent prompts outside the cookbook count",
  "## Artifact and owner-control reminder",
);
const property5StandingPromptNames = [
  "Start Standing Multi-Agent Mode",
  "Launch Scout/Map and Planner/Risk in parallel",
  "Hand an approved scope to Implementer",
  "Launch Verifier/Reporter",
  "Resolve a multi-agent conflict",
  "Finish and close a multi-agent task",
] as const;
const property5SafetyPreambleMarkers = [
  "start with `oando-master`, then `repo-map`",
  "use Local Evidence before assumptions",
  "do not guess paths, package names, Package Skills, or commands",
  "select every matching Package Skill and reject the rest with plain-language reasons",
  "classify every command as read-only inspection, Normal-Agent Eligible Check, Protected Command, or no-run pending authorization before suggesting or running it",
  "do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission",
  "treat inline markers as insufficient",
  "classify Artifact Class, exact approved Workstream/Purpose Subfolder, filename pattern, owning source or script, authored-or-generated state, rejected placements, and Site Write Gate state before an Output-Producing Task",
  "keep `./tech-docs-generator/` as a root-level sibling of `./site/`",
  "keep generated tech-docs in `./generated-documents/`",
  "Machine Evidence in `./results/<purpose>/`",
  "authored work in `./agents-work/<workstream>/<report-type>/`",
  "active plans in `./plans/<name>/`",
  "canonical blockers in root `./Failures.md`",
  "apply the Locked Path Gate and Site Write Gate",
  "treat AI/retrieval output as advisory",
  "keep hooks, policy, runtime, packages, databases, deployments, backups, external MCP, Power activation, automatic spawning, and workspace-boundary changes as Separate Approval Work",
  "return the Plain-Language Response Contract and exact completion proof or an explicit unverified/pending state.",
] as const;

const property5CategoryArbitrary = fc.constantFrom(
  "Understand Repository",
  "Find Where to Work",
  "Small UI/Icon/Alignment Fix",
  "Feature",
  "Site UI",
  "Planner",
  "Studio",
  "Admin",
  "CRM/Unwired Assessment",
  "Catalog/Configurator/Quotes/Inventory",
  "Database",
  "AI/Retrieval",
  "Image/Animation/Assets",
  "API/Security",
  "Environment",
  "Bug/Failing Test",
  "Gate-Failure Triage",
  "Refactor",
  "Documentation",
  "Package/Dependency",
  "Deployment/Ops",
  "Backup/Import/Export",
  "Unknown Task",
  "Finish Current Task",
  "Emergency Prompt for an Overwhelmed Owner",
);

const property5CategorySection = (
  expectation: PromptCookbookCategoryExpectation,
): string => {
  const heading = `### ${expectation.number}. ${expectation.name}`;
  const start = property5PromptCookbook.indexOf(heading);
  const nextHeading = property5PromptCookbook.indexOf(
    "\n### ",
    start + heading.length,
  );
  const end = nextHeading >= 0 ? nextHeading : property5PromptCookbook.length;

  if (start < 0 || end < 0) {
    throw new Error(`Could not locate Prompt Cookbook category ${expectation.name}.`);
  }

  return property5PromptCookbook.slice(start, end);
};

const property5PromptBody = (
  expectation: PromptCookbookCategoryExpectation,
): string => {
  const section = property5CategorySection(expectation);
  const blocks = [...section.matchAll(/```text\r?\n([\s\S]*?)\r?\n```/g)];

  if (blocks.length !== 1) {
    throw new Error(
      `Expected exactly one text prompt block for ${expectation.name}, found ${blocks.length}.`,
    );
  }

  return blocks[0]?.[1] ?? "";
};

const property5FieldValue = (body: string, label: string): string => {
  const marker = `${label}:`;
  const line = body.split(/\r?\n/).find((candidate) => candidate.startsWith(marker));

  if (!line) {
    throw new Error(`Missing Prompt Cookbook field ${JSON.stringify(label)}.`);
  }

  return line.slice(marker.length).trim();
};

const property5CategoryExpectation = (
  categoryName: string,
): PromptCookbookCategoryExpectation => {
  const expectation = property5CategoryExpectations.find(
    ({ name }) => name === categoryName,
  );

  if (!expectation) {
    throw new Error(`No Property 5 expectation exists for ${categoryName}.`);
  }

  return expectation;
};

const assertProperty5Category = (categoryName: string): void => {
  const expectation = property5CategoryExpectation(categoryName);
  const body = property5PromptBody(expectation);

  for (const marker of [
    "Start with `oando-master`, then `repo-map`",
    "Local Evidence before assumptions",
    "Protected Command",
    "exact current-session Explicit User Authorization",
    "Hook Permission",
    "Plain-Language Response Contract",
  ]) {
    expect(body, `${expectation.name} safety marker: ${marker}`).toContain(marker);
  }

  expect(body).toMatch(/classify every (?:proposed )?(?:command|check)/i);

  if (expectation.name !== "Emergency Prompt for an Overwhelmed Owner") {
    expect(property5FieldValue(body, "Desired outcome")).toBe("[DESIRED_OUTCOME]");
    expect(property5FieldValue(body, "Ordinary-language context")).toBe("[CONTEXT]");
    expect(property5FieldValue(body, "Scope boundary")).toBe(expectation.scopeBoundary);
    expect(property5FieldValue(body, "First evidence")).toBe(expectation.firstEvidence);
    expect(property5FieldValue(body, "Expected evidence")).not.toBe("");

    const stopCondition = body
      .split(/\r?\n/)
      .find((line) => line.startsWith("Stop "));
    expect(stopCondition, `${expectation.name} stop condition`).toBe(
      expectation.stopCondition,
    );
    expect(body).toMatch(/exact completion proof|Completion Record|Coverage-Gap Admission Card/);
  }

  if (expectation.routingMarker) {
    expect(body, `${expectation.name} additive skill routing`).toContain(
      expectation.routingMarker,
    );
  }

  if (body.includes("Output-Producing Tasks")) {
    for (const artifactMarker of [
      "Artifact Class",
      "exact Workstream/Purpose Subfolder",
      "filename pattern",
      "owning source or script",
      "authored-or-generated state",
      "rejected placements",
      "Site Write Gate state",
    ]) {
      expect(body, `${expectation.name} artifact marker: ${artifactMarker}`).toContain(
        artifactMarker,
      );
    }
  }
};

// **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7**
describe("Property 5: Complete safe Prompt Cookbook", () => {
  it("preserves the safe prompt contract for arbitrary cookbook categories", () => {
    fc.assert(
      fc.property(property5CategoryArbitrary, (categoryName) => {
        assertProperty5Category(categoryName);
      }),
      { numRuns: 100 },
    );
  });

  it("keeps exactly 25 categories ordered once and standing prompts outside the count", () => {
    expectInOrder(property5SafetyPreamble, property5SafetyPreambleMarkers);
    expect(property5SafetyPreamble).toContain(
      "Every cookbook block below includes this complete safety instruction:",
    );
    expect(property5SafetyPreamble).toContain(
      "Each fenced block then supplies its own desired-outcome placeholder, ordinary-language context placeholder, scope boundary, exact first Local Evidence, expected evidence, and stop condition.",
    );

    const categoryHeadings = [
      ...property5PromptCookbook.matchAll(/^### (\d+)\. (.+)$/gm),
    ].map((match) => ({
      number: Number(match[1] ?? "0"),
      name: match[2] ?? "",
    }));
    const expectedHeadings = property5CategoryExpectations.map(({ number, name }) => ({
      number,
      name,
    }));

    expect(categoryHeadings).toHaveLength(25);
    expect(new Set(categoryHeadings.map(({ name }) => name)).size).toBe(25);
    expect(categoryHeadings).toEqual(expectedHeadings);

    for (const expectation of property5CategoryExpectations) {
      expect(
        categoryHeadings.filter(({ number, name }) =>
          number === expectation.number && name === expectation.name,
        ),
        `${expectation.name} heading count`,
      ).toHaveLength(1);
      assertProperty5Category(expectation.name);
    }

    const standingPromptHeadings = [
      ...property5StandingPromptSection.matchAll(/^### (.+)$/gm),
    ].map((match) => match[1]?.trim() ?? "");

    expect(standingPromptHeadings).toEqual(property5StandingPromptNames);
    expect(standingPromptHeadings).toHaveLength(6);
    expect(
      standingPromptHeadings.some((name) =>
        property5CategoryExpectations.some((expectation) => expectation.name === name),
      ),
    ).toBe(false);

    const emergencyExpectation = property5CategoryExpectation(
      "Emergency Prompt for an Overwhelmed Owner",
    );
    const emergencyBody = property5PromptBody(emergencyExpectation).trim();

    expect(emergencyBody).toBe(
      "Start with `oando-master`, then `repo-map`; use Local Evidence before assumptions, classify every command, do not run a Protected Command without exact current-session Explicit User Authorization and Hook Permission, select every matching Package Skill, and return the Plain-Language Response Contract while helping me choose the safest next action for [DESIRED_OUTCOME].",
    );
    expect(emergencyBody.split(/\r?\n/)).toHaveLength(1);
    expect(emergencyBody.match(/[.!?](?:\s|$)/g) ?? []).toHaveLength(1);
  });
});


const existingSkillNames = [
  "db-migrations",
  "focss-css",
  "fork-boundaries",
  "graph-impact",
  "oando-master",
  "planner-studio",
  "powers-skills-model",
  "repo-map",
  "verify-and-gate",
] as const;

const property6SkillArbitrary = fc.constantFrom(...existingSkillNames);

const property6McpStates = [
  "schema",
  "configuration",
  "connection",
] as const;

// **Validates: Requirements 3.7, 5.1, 5.2, 5.4, 5.5, 5.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.3, 9.4, 9.5, 9.6, 13.1, 13.2, 13.3, 13.4**
describe("Property 6: Conditional skill routing and local-first capability selection", () => {
  it("requires every matching skill to be selected and every non-matching skill rejected with a reason", () => {
    fc.assert(
      fc.property(property6SkillArbitrary, (skillName) => {
        // Router documents that every matching skill is selected additively
        expect(property6RouterRouting).toContain("Route additively when evidence matches");

        // Guide routing section documents conditional selection with rejection
        expect(property6GuideRouting).toContain("every matching");
        expect(property6GuideRouting).toContain("rejected");
        expect(property6GuideRouting).toContain("reason");

        // Router Begin Here requires rejection with reasons
        expect(router).toContain("reject every non-matching");
        expect(router).toContain("plain-language reason");

        // Each existing skill name appears in the router routing section or the guide routing section
        const skillInRouter = property6RouterRouting.includes(`\`${skillName}\``);
        const skillInGuide = property6GuideRouting.includes(`\`${skillName}\``);
        expect(
          skillInRouter || skillInGuide,
          `Skill ${skillName} must appear in router or guide routing section`,
        ).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("enforces Local Evidence before Powers or MCP", () => {
    // Router: "Use Local Evidence before any Power"
    expect(property6RouterRouting).toContain(
      "Use Local Evidence before any Power",
    );
    expect(property6RouterRouting).toContain("MCP");

    // Guide capability evidence section enforces local-first with distinct power/mcp states
    expect(property6GuideCapabilityEvidence).toContain("Power");
    expect(property6GuideCapabilityEvidence).toContain("MCP");

    // The router requires local evidence before power/mcp
    expect(router).toContain(
      "Local Evidence before",
    );
  });

  it("requires Installed-Power Registry confirmation before presenting a Power as available", () => {
    // Router routing section requires registry consultation
    expect(property6RouterRouting).toContain("Installed-Power Registry");
    expect(property6RouterRouting).toContain("Consult");

    // An unconfirmed candidate is not represented as available
    expect(property6RouterRouting).toContain(
      "do not represent the proposal as an available skill",
    );

    // Guide capability evidence section also requires registry confirmation
    expect(property6GuideCapabilityEvidence).toContain("Installed-Power Registry");
    expect(property6GuideCapabilityEvidence).toContain("Confirm");
  });

  it("blocks requested activation without confirmation", () => {
    // Never activate automatically
    expect(property6RouterRouting).toContain("never activate automatically");

    // No runtime activation claim from prose alone
    expect(router).toContain(
      "without claiming runtime loading",
    );
    expect(property6GuideCapabilityEvidence).toContain(
      "prose is not runtime enforcement",
    );
  });

  it("treats MCP schema, configuration, and connection as distinct states", () => {
    // All three MCP states are mentioned distinctly
    for (const state of property6McpStates) {
      expect(
        property6RouterRouting.toLowerCase().includes(state) ||
          property6GuideCapabilityEvidence.toLowerCase().includes(state),
        `MCP state "${state}" must appear in router routing or guide capability evidence`,
      ).toBe(true);
    }

    // The guide capability evidence section distinguishes the three states
    expect(property6GuideCapabilityEvidence).toContain("schema");
    expect(property6GuideCapabilityEvidence).toContain("Configuration");
    expect(property6GuideCapabilityEvidence).toContain("connection");
  });

  it("confirms ai-retrieval skill is conditional on file existence", () => {
    // The router documents ai-retrieval as conditional
    expect(property6RouterRouting).toContain("ai-retrieval");
    expect(property6RouterRouting).toMatch(
      /ai-retrieval.*guidance-only|ai-retrieval.*remains|not proof.*automatic activation/i,
    );

    // The guide routing section also documents the conditional nature
    expect(property6GuideRouting).toContain("ai-retrieval");

    // The design fact: ai-retrieval is selected only after the file exists
    if (!aiRetrievalSkillPresent) {
      // When absent, the route record should admit the gap
      expect(property6RouterRouting).toMatch(
        /absent|gap|not.*exist|does not exist|optional/i,
      );
    }
  });

  it("lists the current skill inventory in the routing section", () => {
    fc.assert(
      fc.property(property6SkillArbitrary, (skillName) => {
        // Every existing skill must be inventoried somewhere in the routing guidance
        const inRouter = property6RouterRouting.includes(skillName);
        const inGuide = property6GuideRouting.includes(skillName);
        const inCapability = property6GuideCapabilityEvidence.includes(skillName);
        expect(
          inRouter || inGuide || inCapability,
          `Skill ${skillName} must be inventoried in routing guidance`,
        ).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("does not claim runtime activation, loading, or discovery from prose", () => {
    // No runtime discovery claim in the routing section
    for (const runtimeClaim of [
      "runtime discovery engine",
    ]) {
      expect(property6RouterRouting).not.toContain(runtimeClaim);
    }

    // The routing section negates automatic activation — it says "not proof of... automatic activation"
    expect(property6RouterRouting).toContain("not proof of");
    expect(property6RouterRouting).toContain("automatic activation");

    // Guide capability evidence section enforces the same
    expect(property6GuideCapabilityEvidence).toMatch(
      /does not prove|not.*claim|not.*runtime/i,
    );
  });
});

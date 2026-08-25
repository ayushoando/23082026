/* Static source registry for the OandO Agent Workflow Guide. */
window.GUIDE_DATA = {
  rules: [
    { number: '01', title: 'Authority order', text: '<strong>User request wins.</strong> Then trust live code and fresh commands, followed by <code>AGENTS.md</code>, <code>Agents/</code>, and <code>docs/</code>.', search: 'authority user live code fresh commands agents docs truth' },
    { number: '02', title: 'Repository floor', text: 'Work from the root, use <code>pnpm</code>, keep secrets in local env files, and use <code>http://localhost:3000</code> for UI proof.', search: 'pnpm root worktree secrets localhost' },
    { number: '03', title: 'Fork boundary', text: 'Studio and Planner are separate trees. Never cross-import them; run <code>pnpm run scan:boundaries</code> before committing either fork.', search: 'studio planner fork boundaries imports geometry' },
    { number: '04', title: 'Persistence honesty', text: 'Production disk is read-only. Runtime writes use mode-aware wrappers and the correct Admin or Products Supabase path.', search: 'production filesystem read only persistence supabase disk' },
    { number: '05', title: 'Two-lane testing', text: '<code>pnpm run test</code> runs default and tech-docs Vitest lanes. Read both; one green summary is not the whole suite.', search: 'tests two lanes vitest gate fast release' },
    { number: '06', title: 'Evidence location', text: 'Generated evidence belongs in <code>results/</code>. Agent notes belong in <code>Agents/</code>. Hard blockers belong in <code>Failures.md</code>.', search: 'results failures reports documentation' }
  ],
  skills: [
    { icon: '⌂', tone: 'blue', name: 'repo-map', meta: 'Skill · orient', text: 'Read canonical architecture docs before scanning. Use the import graph for dependency questions.', command: 'AGENTS.md → START.md → layout / stack / routes', search: 'repo-map orientation canonical docs where code lives' },
    { icon: '⌘', tone: 'violet', name: 'graph-impact', meta: 'Skill · impact', text: 'Measure fan-in, fan-out, dependents, cycles, and suggested focused tests before a broad suite.', command: 'node scripts/graph-impact.mjs --file=<path>', search: 'graph-impact blast radius imports tests cycles ts morph' },
    { icon: '✓', tone: 'green', name: 'verify-and-gate', meta: 'Skill · proof', text: 'Use focused tests first, then the fast gate; use the full gate at ship time. Browser proof is separate from unit proof.', command: 'pnpm run gate:fast', search: 'verify gate testing two vitest lanes fast release' },
    { icon: '↔', tone: 'orange', name: 'fork-boundaries', meta: 'Skill · architecture', text: 'Keep Studio and Planner imports, CSS zones, APIs, and geometry helpers isolated.', command: 'pnpm run scan:boundaries', search: 'fork boundaries studio planner scan' },
    { icon: '✦', tone: 'pink', name: 'focss-css', meta: 'Skill · styling', text: 'Use semantic FOCSS tokens on top of Tailwind v4, with one zone per product surface.', command: 'pnpm run verify:focss', search: 'focss css tailwind tokens zones lint style' },
    { icon: '▣', tone: 'gold', name: 'db-migrations', meta: 'Skill · data', text: 'Choose Admin or Products, add rollback plus grants/policies, dry-run first, and regenerate types.', command: 'pnpm run db:apply -- --dry', search: 'db migrations supabase rollback grants policies dry run admin products' }
  ],
  powers: [
    { symbol: 'OW', tone: 'local', meta: 'Local workflow power · default router', name: 'oando-workflow', text: 'Routes repository questions to local skills and only reaches for external powers when the repo cannot answer.', tags: ['graph', 'boundaries', 'gates'], search: 'oando workflow repo map graph boundaries gate verify routing local power' },
    { symbol: 'NA', tone: 'browser', meta: 'Browser QA · natural-language missions', name: 'nova-act', text: 'Explore pages, execute missions, extract data, verify UI, and generate session evidence. Ask for headed/headless mode first; never kill browser processes.', tags: ['execute', 'extract', 'snapshot'], search: 'nova act browser automation qa playwright extraction headed headless localhost' },
    { symbol: 'KC', tone: 'browser', meta: 'Browser QA · structured scenarios', name: 'kane-cli', text: 'Drive real browser flows, generate test cases, author scenarios, capture screenshots, and produce replay-cached testmd artifacts.', tags: ['generate', 'testmd', 'smoke'], search: 'kane cli browser qa scenarios testmd screenshots deployment mobile' },
    { symbol: 'PM', tone: 'api', meta: 'API resources · MCP', name: 'postman', text: 'Inspect .postman.json first, avoid duplicates, use Postman MCP only, and validate Collection Format v2.1.0.', tags: ['collections', 'environments', 'tests'], search: 'postman api collection environment rest mcp 2.1.0' },
    { symbol: 'C7', tone: 'docs', meta: 'Documentation · MCP', name: 'context7', text: 'Find current, version-aware documentation and examples when local code and docs cannot resolve an API question.', tags: ['official docs', 'versions'], search: 'context7 current docs sdk framework library api reference' },
    { symbol: 'EX', tone: 'research', meta: 'Research · MCP', name: 'exa', text: 'Search, crawl, and extract external sources. Cite sources and do not transmit private project data without permission.', tags: ['search', 'crawl', 'sources'], search: 'exa web search crawl research code company current external' },
    { symbol: 'SB', tone: 'data', meta: 'Hosted data · MCP', name: 'supabase-hosted', text: 'Inspect or operate hosted Postgres, auth, storage, realtime, and RLS after confirming Admin vs Products and risk.', tags: ['RLS', 'schema', 'storage'], search: 'supabase hosted postgres auth storage realtime rls database admin products' },
    { symbol: 'DD', tone: 'ops', meta: 'Observability · MCP', name: 'datadog', text: 'Query production logs, metrics, traces, RUM, incidents, and monitors with the narrowest useful scope.', tags: ['logs', 'traces', 'RUM'], search: 'datadog logs metrics traces rum apm incidents monitors production' },
    { symbol: 'CL', tone: 'media', meta: 'Media · MCP', name: 'cloudinary', text: 'Upload, transform, optimize, search, and analyze images or videos while preserving asset conventions.', tags: ['upload', 'transform', 'analysis'], search: 'cloudinary image video upload transform optimize media assets' },
    { symbol: 'CU', tone: 'review', meta: 'Review · MCP', name: 'cubic-code-review', text: 'Use external AI review, security scans, wikis, and team patterns only when private-code authorization and task value are clear.', tags: ['review', 'security'], search: 'cubic code review security scan wiki pr patterns' },
    { symbol: 'DS', tone: 'design', meta: 'Scaffolding · project generator', name: 'design-system-power-builder', text: 'Generate a governed design-system skill project with component specs, accessibility rules, UI guidance, and validation.', tags: ['components', 'governance', 'a11y'], search: 'design system builder scaffold components accessibility governance tailwind' },
    { symbol: 'LT', tone: 'memory', meta: 'Project memory · local power', name: 'ltm-power', text: 'Scaffold, recall, validate, repair, and update durable project memory without putting secrets into memory.', tags: ['recall', 'state', 'repair'], search: 'ltm memory long term recall project state reset validate repair' }
  ],
  commands: [
    { title: 'Daily loop', icon: '$', code: 'pnpm install\npnpm dev\npnpm run typecheck\npnpm run lint\npnpm run gate:fast', text: 'Run from the repository root. Keep product UI on localhost:3000.', search: 'install dev build typecheck lint pnpm core commands' },
    { title: 'Focused proof', icon: '$', code: 'pnpm exec vitest run --config tests/vitest.config.ts tests/unit/<path>\npnpm exec vitest run --config tests/vitest.tech-docs.config.ts\npnpm run test:a11y', text: 'Focus first. Remember that the full test command has two lanes.', search: 'tests vitest two lanes focused e2e playwright' },
    { title: 'Ship bar', icon: '$', code: 'pnpm run check:layout\npnpm run gate:fast\npnpm run gate', text: 'Use gate for release readiness, not every small edit.', search: 'release gate full ship build coverage governance' },
    { title: 'Database safety', icon: '$', code: 'pnpm run db:apply -- --dry\npnpm run db:apply:admin -- --dry\npnpm run db:types\npnpm run db:types:admin', text: 'Dry-run the selected project before applying. Migrations need rollback, grants, and policies.', search: 'database migration dry admin products rollback types' },
    { title: 'Docs health', icon: '$', code: 'pnpm run check:layout\npnpm run check:agents-md\npnpm run check:agents-folder\npnpm run check:docs-all', text: 'Use generators for generated inventories; keep hand-written guidance in Agents/.', search: 'docs agents layout purity sync tech docs' },
    { title: 'Special checks', icon: '$', code: 'pnpm run scan:boundaries\npnpm run scan:secrets\npnpm run verify:focss\npnpm run check:style-tokens', text: 'Run checks relevant to the changed surface, then include them in final evidence.', search: 'boundaries secrets css tokens verify' }
  ],
  opsGroups: {
    'Assets · catalog · backups': ['alt:sync:apply','alt:sync:dry','assets:audit:thirdparty','assets:cdn:audit','assets:cdn:catalog','assets:cdn:fix','assets:cdn:replacements','assets:cdn:sync','assets:cdn:upload','assets:cdn:upload:incremental','assets:r2:count','assets:r2:create-bucket','assets:r2:delete-bucket','audit:products:quality','audit:slug-id','audit:supabase:admin','audit:supabase:catalog','audit:svg-catalog','backup:github-secrets:sync','backup:r2','backup:supabase:r2','catalog:blocks:qa','catalog:organize:apply','catalog:organize:dry','catalog:organize:sync','catalog:qa:sheet','catalog:snapshot:r2','repo:backup:r2','supabase:assets:arrange','supabase:backfill:canonical','supabase:backfill:images','supabase:backup','sync:descriptor-svgs'],
    'Checks · lint · environment': ['check-sharp','check:active-docs','check:agents-folder','check:agents-md','check:composer-styles','check:docs-all','check:docs-purity','check:failures','check:governance','check:i18n:parity','check:launch','check:layout','check:plans-purity','check:product-icons','check:site-ui','check:site-ui:copy','check:site-ui:dialect','check:site-ui:inline-style','check:site-ui:shell','check:style-tokens','check:ui-assets','check:worker-origin','codemod:homepage-dialect','env:sync','failures:sync','launch:env','launch:smoke','lint:secrets','lint:type-aware','lint:ui','scan:hardcoding','scan:secrets','scan:tokens'],
    'Database · seeds': ['db:advisors','db:advisors:admin','db:advisors:performance','db:advisors:security','db:apply','db:apply:admin','db:backup-dropped','db:backup:pgdump','db:ensure-plans','db:sync-drizzle','db:test','db:types','db:types:admin','seed','seed:block-descriptors','seed:configurator','seed:furniture','seed:managed','verify:db-svg'],
    'Docs · planning · site UI': ['dev:turbo','docs:check','docs:check:coverage','docs:check:root-links','docs:sync','docs:sync:all','docs:sync:coverage','docs:sync:routes','docs:sync:sitemap-csv','gate:open3d','gate:planner','gate:site-ui','i18n:sync:deferred-locales','i18n:sync:hi-wave1','i18n:sync:marketing','i18n:translate:deferred-locales','p0:svg','planner:lift','planner:lift-verify','site-ui:matrix','tech-docs:build','tech-docs:check','tech-docs:generate','tech-docs:test','tech-docs:typecheck','vercel:preview','vercel:prod'],
    'Tests · browser · coverage': ['test:admin:production-auth','test:apps','test:audit','test:audit:api-routes','test:audit:eslint-disable','test:audit:fake-test','test:audit:fast','test:audit:gate-skips','test:audit:hollow','test:auth:env','test:auth:seed-users','test:browsers:install','test:coverage:admin','test:coverage:inventory','test:design-kit','test:e2e:admin-retire-restore','test:e2e:assistant','test:e2e:nav','test:e2e:open3d-world','test:e2e:visual','test:e2e:world-standard-w1w2','test:layout:check','test:planner','test:planner-catalog:watch','test:planner:watch','test:site-ui','test:tech-docs','test:ui','test:unit','typecheck:scripts']
  },
  workflow: [
    ['Translate the request', 'Write the exact output, path, behavior, values, format, and proof required. Ask only when ambiguity changes risk or scope.', 'acceptance criteria user request exact output path values format'],
    ['Orient', 'Read the process floor and nearest architecture/doc source. Locate the feature before scanning the whole tree.', 'orient repo map canonical docs live code'],
    ['Route', 'Choose the smallest skill or power. Activate before using its MCP. Prefer local code and scripts over external services.', 'route smallest skill power activate mcp'],
    ['Inspect', 'Read the target and nearest neighbor. Search symbols and imports. Never propose code changes you have not seen.', 'inspect existing implementation target neighbor search'],
    ['Edit once per file', 'Prefer a targeted change. Avoid duplicate sources of truth, unrelated refactors, and secret-bearing examples.', 'edit smallest sound one logical file preserve unrelated'],
    ['Measure impact', 'Run graph impact for shared code; run boundary, CSS, or migration checks when those domains apply.', 'impact graph suggested test boundaries css migration'],
    ['Verify at the right bar', 'Run the narrowest useful validation, then gate:fast for development or gate for release.', 'focused test gate fast release verify evidence'],
    ['Report evidence', 'Name changed files, exact commands, meaningful results, skipped checks, and real blockers. Never turn partial green into PASS.', 'report changed verified not run blocked honesty']
  ],
  recipes: [
    ['UI / CSS', 'Change a product surface', ['Read browser, architecture, and CSS handbooks.', 'Use FOCSS tokens and the correct zone.', 'Run CSS checks and browser proof on localhost.', 'Finish with the fast gate.'], 'ui css component browser visual localhost focss'],
    ['Studio / Planner', 'Change an app fork', ['Stay inside the owning fork.', 'Check API casing and geometry scale.', 'Run boundary scan and focused tests.', 'Review graph impact if shared code is touched.'], 'planner studio fork api geometry boundary'],
    ['Database', 'Change schema safely', ['Choose Admin or Products.', 'Write rollback, grants, and policies.', 'Dry-run before apply and regenerate types.', 'Prove the Supabase-mode write path.'], 'database sql migration supabase rollback policy dry run'],
    ['Browser QA', 'Prove a user flow', ['Choose Nova Act or Kane based on mission vs scenario.', 'Choose headed or headless first.', 'Use localhost:3000 for local UI.', 'Capture the evidence that matches the claim.'], 'browser qa nova kane scenario screenshot smoke'],
    ['Research', 'Resolve a current API question', ['Search local code/docs first.', 'Use Context7 for versioned library docs.', 'Use Exa only for external research.', 'Cite sources and protect private data.'], 'context7 exa current docs web research sources']
  ],
  sources: [
    ['Repository floor', '../../AGENTS.md', 'Root rules loaded into every session.', 'rule'],
    ['Onboarding', '../../START.md', 'Read order and local setup.', 'guide'],
    ['Agent index', '../INDEX.md', 'Handbook map and placement rules.', 'guide'],
    ['Standard handbook', '../01-standard.md', 'Work bar, evidence, and execution floor.', 'guide'],
    ['Testing handbook', '../02-testing.md', 'Focused tests, two lanes, and persistence mocks.', 'guide'],
    ['Browser handbook', '../03-browser.md', 'Rules for UI and browser claims.', 'guide'],
    ['Failures handbook', '../04-failures.md', 'Blocker recording and recovery.', 'guide'],
    ['Documentation handbook', '../05-documentation.md', 'Doc authority and placement.', 'guide'],
    ['Architecture handbook', '../06-architecture.md', 'Placement, forks, persistence, and product shape.', 'guide'],
    ['CSS handbook', '../07-css.md', 'FOCSS and product styling rules.', 'guide'],
    ['Markdown workflow guide', './README.md', 'The full agent-readable source for this static walkthrough.', 'guide'],
    ['Architecture layout', '../../docs/architecture/layout.md', 'Top-level repository map.', 'architecture'],
    ['Architecture stack', '../../docs/architecture/stack.md', 'Toolchain and wired packages.', 'architecture'],
    ['Architecture routes', '../../docs/architecture/routes.md', 'Surface and API inventory.', 'architecture'],
    ['Product map', '../../docs/architecture/product-map.md', 'Feature and package placement.', 'architecture'],
    ['CSS architecture', '../../docs/architecture/css.md', 'FOCSS zone and token model.', 'architecture'],
    ['Database schema', '../../docs/database/schema.md', 'Database ownership and schema facts.', 'database'],
    ['Database operations', '../../docs/database/ops.md', 'Operational database procedures.', 'database'],
    ['Testing handbook', '../../Testing-handbook.md', 'Repository testing contract.', 'testing'],
    ['Package scripts', '../../package.json', 'Workspace commands and gates.', 'cli'],
    ['Graph implementation', '../../scripts/graph-impact.mjs', 'ts-morph import graph CLI.', 'graph'],
    ['Repo workflow power', '../../.kiro/powers/oando-workflow/POWER.md', 'Local routing and capability policy.', 'power'],
    ['repo-map skill', '../../.kiro/skills/repo-map/SKILL.md', 'Canonical orientation procedure.', 'skill'],
    ['graph-impact skill', '../../.kiro/skills/graph-impact/SKILL.md', 'Blast-radius and scoped-test procedure.', 'skill'],
    ['verify-and-gate skill', '../../.kiro/skills/verify-and-gate/SKILL.md', 'Verification sequence and honesty bar.', 'skill'],
    ['fork-boundaries skill', '../../.kiro/skills/fork-boundaries/SKILL.md', 'Studio/Planner boundary procedure.', 'skill'],
    ['focss-css skill', '../../.kiro/skills/focss-css/SKILL.md', 'FOCSS-on-Tailwind procedure.', 'skill'],
    ['db-migrations skill', '../../.kiro/skills/db-migrations/SKILL.md', 'Two-database migration procedure.', 'skill'],
    ['Installed power catalog', '#powers', 'Current installed powers: design system, Nova Act, Postman, Context7, Exa, Datadog, LTM, Cubic, Kane, Cloudinary, Supabase, and OandO workflow.', 'power']
  ]
};

# OandO Workflow — routing detail

Loaded on demand with the OandO Workflow power.

## Routing loop

1. Read `AGENTS.md`, the relevant live source, and repository guidance before changing files.
2. Use `repo-map` for location and `graph-impact` when shared-code blast radius matters.
3. Route Studio/Planner, FOCSS, migration, and planning work to their focused skills.
4. Route observability, analytics, and security work to the corresponding local power.
5. Keep tests, typechecks, gates, coverage, builds, browser checks/runners, and local services owner-authorized. The enabled `.kiro/hooks/block-agent-tests.json` hook blocks prohibited agent shell calls before execution.
6. Use static inspection only for claims it can prove; never turn it into a behavioral pass.

## Capability status

- **wired:** live source/configuration is invoked or mounted.
- **present but unmounted:** package/component exists without live invocation.
- **schema present:** a snapshot exists under `.kiro/mcp/**`.
- **workspace configured:** `.kiro/settings/mcp.json` contains a server entry.
- **runtime installed:** direct registry evidence confirms availability.

An empty workspace `mcpServers` object proves only that no server is configured in this workspace. Without a direct registry check, runtime availability is not verified.

## Database boundary

Admin `rxzpznmxbaoxpikowmfc` owns plans, profiles, handoffs, teams, price books, queries, audit, furniture, and descriptors. Products `erpweaiypimorcunaimz` owns marketing catalog, configurator, flags, and themes. Confirm the owner database before migration work.
Apply the Kiro Agent Contract at ./.kiro/skills/oando-master/SKILL.md before any action.
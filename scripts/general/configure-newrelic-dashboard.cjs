// Explicit operator action: updates only the known Oando dashboard when --apply is passed.
const fs = require('node:fs');
const path = require('node:path');
require('./loadEnvLocal.cjs').loadEnvLocal();
const accountId = 8474489;
const guid = 'ODQ3NDQ4OXxWSVp8REFTSEJPQVJEfGRhOjEzMTMzNTE2';
async function graph(query, variables = {}) {
  const response = await fetch('https://api.newrelic.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'API-Key': process.env.NEW_RELIC_USER_LICENSE_KEY },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json();
  if (!response.ok || result.errors) throw new Error(`New Relic GraphQL HTTP ${response.status}: ${result.errors?.map(error => error.message).join('; ') ?? 'request rejected'}`);
  return result.data;
}
const read = `query($guid:EntityGuid!) { actor { entity(guid:$guid) { ... on DashboardEntity {
  guid name description permissions pages { guid name description widgets {
    id title visualization { id } layout { column row width height } rawConfiguration
  } } } } } }`;
const scope = "FROM Span WHERE service.name = 'ai-planner-backend'";
const ai = " AND (gen_ai.request.model IS NOT NULL OR gen_ai.response.model IS NOT NULL)";
const definitions = [
  ['Received backend spans', `SELECT count(*) ${scope} SINCE 1 hour ago`, 'viz.billboard'],
  ['Backend span latency (ms)', `SELECT percentile(duration.ms, 50, 95, 99) ${scope} SINCE 1 hour ago`, 'viz.billboard'],
  ['Backend error span percentage', `SELECT percentage(count(*), WHERE otel.status_code = 'ERROR') ${scope} SINCE 1 hour ago`, 'viz.billboard'],
  ['Backend span throughput', `SELECT rate(count(*), 1 minute) ${scope} TIMESERIES SINCE 1 hour ago`, 'viz.line'],
  ['Backend spans by environment', `SELECT count(*) ${scope} FACET deployment.environment.name SINCE 1 hour ago`, 'viz.table'],
  ['Backend spans by kind', `SELECT count(*) ${scope} FACET span.kind SINCE 1 hour ago`, 'viz.table'],
  ['Backend HTTP status codes', `SELECT count(*) ${scope} FACET http.status_code SINCE 1 hour ago`, 'viz.table'],
  ['Received AI model spans — zero means no observed AI coverage', `SELECT count(*) ${scope}${ai} SINCE 1 day ago`, 'viz.billboard'],
  ['AI model latency (ms)', `SELECT percentile(duration.ms, 50, 95) ${scope}${ai} FACET gen_ai.request.model SINCE 1 day ago`, 'viz.table'],
  ['AI tokens — requires usage instrumentation', `SELECT sum(gen_ai.usage.input_tokens), sum(gen_ai.usage.output_tokens) ${scope}${ai} SINCE 1 day ago`, 'viz.billboard'],
];
async function main() {
  const before = (await graph(read, { guid })).actor.entity;
  if (!before || before.pages.length !== 1) throw new Error('Unexpected dashboard structure; no mutation performed');
  const widgets = [{
    title: 'Coverage and privacy', visualization: { id: 'viz.markdown' },
    layout: { column: 1, row: 1, width: 12, height: 3 },
    rawConfiguration: { text: '## Oando backend and AI telemetry\nService: **ai-planner-backend**. Backend charts count spans, not distinct user requests. AI charts use GenAI attributes; an empty chart is an instrumentation/traffic gap, not proof of health. No prompts, responses, authorization headers, or guessed model costs are displayed. Local and hosted traffic may coexist; use the environment breakdown. Browser monitoring is separate.' },
  }];
  for (let index = 0; index < definitions.length; index++) {
    const [title, query, visualization] = definitions[index];
    const result = await graph('query($q:Nrql!) { actor { account(id:8474489) { nrql(query:$q) { results } } } }', { q: query });
    console.log(JSON.stringify({ title, resultRows: result.actor.account.nrql.results.length }));
    widgets.push({ title, visualization: { id: visualization },
      layout: { column: (index % 2) * 6 + 1, row: Math.floor(index / 2) * 3 + 4, width: 6, height: 3 },
      rawConfiguration: { nrqlQueries: [{ accountIds: [accountId], query }] },
    });
  }
  const dashboard = { name: before.name, description: 'Oando Next.js backend and AI telemetry using observed OpenTelemetry attributes.',
    permissions: before.permissions,
    pages: [{ guid: before.pages[0].guid, name: 'Backend & AI Coverage', widgets }],
  };
  const folder = path.resolve('results/newrelic');
  fs.mkdirSync(folder, { recursive: true });
  const stamp = Date.now();
  fs.writeFileSync(path.join(folder, `dashboard-before-${stamp}.json`), JSON.stringify(before, null, 2));
  fs.writeFileSync(path.join(folder, `dashboard-proposed-${stamp}.json`), JSON.stringify(dashboard, null, 2));
  if (!process.argv.includes('--apply')) { console.log('Queries verified; no dashboard mutation requested'); return; }
  const result = await graph(`mutation($guid:EntityGuid!,$dashboard:DashboardInput!) {
    dashboardUpdate(guid:$guid,dashboard:$dashboard) { entityResult { guid name } errors { type description } }
  }`, { guid, dashboard });
  if (result.dashboardUpdate.errors?.length) throw new Error('Dashboard update rejected; original saved');
  const after = (await graph(read, { guid })).actor.entity;
  fs.writeFileSync(path.join(folder, `dashboard-after-${stamp}.json`), JSON.stringify(after, null, 2));
  if (after.pages[0].widgets.length !== widgets.length) throw new Error('Dashboard readback count mismatch');
  console.log(JSON.stringify({ updated: true, guid: after.guid, widgets: after.pages[0].widgets.length, backup: `results/newrelic/dashboard-before-${stamp}.json` }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

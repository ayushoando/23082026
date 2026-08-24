---
inclusion: manual
---

# CAST Imaging — Graph Layer (Pending Setup)

## Status: NOT YET CONFIGURED
The API key is available but the CAST Imaging MCP server is not set up yet. Once the server FQDN/IP and port are known, follow the onboarding steps below.

## Setup steps (when ready)

1. Provide the MCP server FQDN (or IP) and port.
2. Validate connection: `curl -s -o NUL -w "%{http_code}" https://<server>:<port>/mcp/healthcheck`
3. Provide the CAST Imaging services FQDN and port (may differ from MCP host).
4. Validate API key: `curl -s -o NUL -w "%{http_code}" -H "x-api-key: <key>" https://<server>:<port>/rest/ready`
5. Write `.kiro/settings/mcp.json`:
```json
{
  "mcpServers": {
    "CASTImaging": {
      "type": "http",
      "url": "https://<mcp-server>:<port>/mcp",
      "headers": {
        "x-api-key": "<validated-api-key>"
      }
    }
  }
}
```
6. Add `.kiro/settings/mcp.json` to `.gitignore`.

## How it will integrate (once live)

### Impact analysis before any code change
```
objects(filters="name:contains:<target>") → get object ID
object_details(focus="inward") → who calls it
object_details(focus="outward") → what it calls
transactions_using_object(filters="id:eq:<id>") → affected end-to-end flows
```

### Scoped testing
Instead of running the full test suite, use the graph to find only the tests that cover the changed object, then run those.

### Boundary enforcement
Use `architectural_graph` at the component level to verify Planner/Studio never import each other — a graph-based complement to `scan:boundaries`.

### Database migration safety
Use `application_database_explorer` and `data_graphs` to trace which code paths read/write the affected tables before applying a migration.

### Quality hotspots
Use `quality_insights(nature="structural-flaws")` to prioritize which code to refactor based on structural risk, not just gut feel.

## Token efficiency with graph
- Graph queries replace broad file reads. One `transactions_using_object` call replaces grepping the entire repo.
- Narrow sub-agent scope: dispatch agents only to the files identified by the graph.
- Loop coding: graph tells you the blast radius, so fix-verify cycles only recheck affected paths.

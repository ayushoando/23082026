import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { extractRouteRecords } from "../tech-docs-generator/scripts/extract-routes.mjs";

const ROOT = process.cwd();
const OUT = path.resolve(readArg("--out", "results/site/page-component-graph"));
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "results", "dist", "coverage"]);
const EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css"];
const INDEX_FILES = ["index.ts", "index.tsx", "index.js", "index.jsx", "index.mjs", "index.cjs"];
const IMPORT_PATTERNS = [
  /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  /(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"]/g,
];

function readArg(name, fallback = null) {
  const hit = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
}

function walk(directory, files = []) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs|css)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

function normalize(relativePath) {
  return relativePath.replace(/\\/g, "/");
}

function resolveSpecifier(specifier, fromFile) {
  const aliases = [
    ["@/", "site/"],
    ["@focss/", "site/focss/"],
    ["@planner/components/", "site/components/Planner/"],
    ["@planner/lib/", "site/lib/Planner/"],
    ["@planner/hooks/", "site/hooks/Planner/"],
    ["@planner/store/", "site/store/Planner/"],
    ["@planner/server/", "site/server/Planner/"],
    ["@studio/components/", "site/components/Studio/"],
    ["@studio/lib/", "site/lib/Studio/"],
    ["@studio/hooks/", "site/hooks/Studio/"],
    ["@studio/store/", "site/store/Studio/"],
    ["@studio/server/", "site/server/Studio/"],
  ];
  for (const [prefix, target] of aliases) {
    if (specifier.startsWith(prefix)) return target + specifier.slice(prefix.length);
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return normalize(path.posix.normalize(`${path.posix.dirname(fromFile)}/${specifier}`));
  }
  return null;
}

function findFile(resolved) {
  for (const extension of EXTENSIONS) {
    const candidate = path.join(ROOT, resolved + extension);
    if (existsSync(candidate) && statSync(candidate).isFile()) return normalize(resolved + extension);
  }
  for (const indexFile of INDEX_FILES) {
    const candidate = path.join(ROOT, resolved, indexFile);
    if (existsSync(candidate) && statSync(candidate).isFile()) return normalize(`${resolved}/${indexFile}`);
  }
  return null;
}

function stripComments(source, isCss) {
  let result = source.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "));
  if (!isCss) result = result.replace(/(^|[^:])\/\/[^\n]*/g, (match, prefix) => prefix + " ".repeat(match.length - prefix.length));
  return result;
}

function importsFor(relativePath, source) {
  const dependencies = new Set();
  const code = stripComments(source, relativePath.endsWith(".css"));
  for (const pattern of IMPORT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(code)) !== null) {
      const resolved = resolveSpecifier(match[1], relativePath);
      const file = resolved ? findFile(resolved) : null;
      if (file) dependencies.add(file);
    }
  }
  return [...dependencies].sort();
}

function nodeKind(relativePath, routeSources) {
  if (routeSources.has(relativePath)) return "page";
  if (/\.css$/.test(relativePath)) return "style";
  if (/\/components\//.test(relativePath) || /\/features\//.test(relativePath)) return "component";
  return "module";
}

function safeMermaidId(index) {
  return `n${index}`;
}

function escapeMermaidLabel(value) {
  return value.replace(/"/g, "'").replace(/[\r\n]+/g, " ");
}

const routeRecords = extractRouteRecords({ repoRoot: ROOT });
const allSourceFiles = walk(path.join(ROOT, "site"));
const sourceByRelativePath = new Map();
for (const absolute of allSourceFiles) {
  const relativePath = normalize(path.relative(ROOT, absolute));
  sourceByRelativePath.set(relativePath, await readFile(absolute, "utf8"));
}

const routeSources = new Set(routeRecords.map((record) => record.sourcePath));
const directGraph = new Map();
for (const [relativePath, source] of sourceByRelativePath) {
  directGraph.set(relativePath, importsFor(relativePath, source));
}

const nodes = [];
const edges = [];
const nodeIds = new Set();
const edgeIds = new Set();
const addNode = (node) => {
  if (nodeIds.has(node.id)) return;
  nodeIds.add(node.id);
  nodes.push(node);
};
const addEdge = (edge) => {
  if (edgeIds.has(edge.id)) return;
  edgeIds.add(edge.id);
  edges.push(edge);
};

for (const record of routeRecords) {
  const routeId = `route:${record.path}`;
  const fileId = `file:${record.sourcePath}`;
  addNode({ id: routeId, kind: "route", label: record.path, sourcePath: record.sourcePath });
  addNode({ id: fileId, kind: "page", label: path.basename(record.sourcePath), sourcePath: record.sourcePath });
  addEdge({ id: `owns:${routeId}->${fileId}`, kind: "owns", from: routeId, to: fileId });
}

const reachableFilesByRoute = {};
for (const record of routeRecords) {
  const visited = new Set();
  const queue = [record.sourcePath];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const dependency of directGraph.get(current) ?? []) {
      if (!visited.has(dependency)) queue.push(dependency);
    }
  }
  reachableFilesByRoute[record.path] = [...visited].sort();
}

const allReachableFiles = new Set(Object.values(reachableFilesByRoute).flat());
for (const relativePath of allReachableFiles) {
  addNode({
    id: `file:${relativePath}`,
    kind: nodeKind(relativePath, routeSources),
    label: path.basename(relativePath),
    sourcePath: relativePath,
  });
}
for (const relativePath of allReachableFiles) {
  for (const dependency of directGraph.get(relativePath) ?? []) {
    if (!allReachableFiles.has(dependency)) continue;
    addEdge({
      id: `imports:file:${relativePath}->file:${dependency}`,
      kind: "imports",
      from: `file:${relativePath}`,
      to: `file:${dependency}`,
    });
  }
}

const routeDirectImports = routeRecords.map((record) => ({
  route: record.path,
  sourcePath: record.sourcePath,
  imports: (directGraph.get(record.sourcePath) ?? []).map((sourcePath) => ({
    sourcePath,
    kind: nodeKind(sourcePath, routeSources),
  })),
}));
const graph = {
  generatedAt: new Date().toISOString(),
  source: "site/app/**/page.tsx + local repository imports",
  routeCount: routeRecords.length,
  nodeCount: nodes.length,
  edgeCount: edges.length,
  countsByKind: Object.fromEntries(
    [...new Set(nodes.map((node) => node.kind))].map((kind) => [kind, nodes.filter((node) => node.kind === kind).length]),
  ),
  nodes,
  edges,
  routeDirectImports,
  reachableFilesByRoute,
};

function buildGraphHtml(graphData) {
  const graphJson = JSON.stringify(graphData).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>O&amp;O Page / Component Graph</title>
  <style>
    :root { color-scheme: dark; --bg: #0b1120; --panel: #111827; --panel-2: #172033; --line: #334155; --text: #e5edf7; --muted: #94a3b8; --accent: #7dd3fc; }
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; }
    body { background: var(--bg); color: var(--text); font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; overflow: hidden; }
    header { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; padding: 18px 22px 12px; border-bottom: 1px solid var(--line); background: #0f172a; }
    h1 { font-size: 20px; line-height: 1.2; margin: 0; }
    header p { color: var(--muted); margin: 4px 0 0; }
    .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; padding: 12px 22px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .toolbar label { color: var(--muted); display: inline-flex; align-items: center; gap: 7px; }
    input, select, button { border: 1px solid #475569; border-radius: 6px; background: #0f172a; color: var(--text); padding: 7px 9px; font: inherit; }
    input[type="search"] { min-width: 250px; }
    button { cursor: pointer; }
    button:hover { border-color: var(--accent); }
    .checks { display: inline-flex; flex-wrap: wrap; gap: 8px; }
    .checks label { color: var(--text); }
    .checks input { accent-color: var(--accent); }
    .stats { margin-left: auto; color: var(--muted); white-space: nowrap; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; height: calc(100vh - 132px); }
    .graph-shell { min-width: 0; min-height: 0; overflow: auto; background: radial-gradient(circle at 20% 10%, #16243b 0, var(--bg) 42%); }
    svg { display: block; min-width: 1500px; min-height: 800px; width: 100%; height: 100%; cursor: grab; }
    svg.dragging { cursor: grabbing; }
    .edge { stroke: #475569; stroke-width: 1; opacity: .45; marker-end: url(#arrow); }
    .edge.owns { stroke: #7dd3fc; opacity: .75; }
    .node { cursor: pointer; }
    .node rect { stroke-width: 1.4; rx: 6; }
    .node text { fill: #f8fafc; font-size: 11px; pointer-events: none; }
    .node .source { fill: #94a3b8; font-size: 9px; }
    .node.selected rect { stroke: #f8fafc; stroke-width: 3; }
    .node.dim { opacity: .2; }
    .detail { min-height: 0; overflow: auto; padding: 18px; border-left: 1px solid var(--line); background: var(--panel); }
    .detail h2 { font-size: 15px; margin: 0 0 12px; }
    .detail dl { margin: 0; }
    .detail dt { color: var(--muted); font-size: 11px; margin-top: 12px; text-transform: uppercase; letter-spacing: .06em; }
    .detail dd { margin: 3px 0 0; overflow-wrap: anywhere; }
    .detail ul { padding-left: 18px; margin: 6px 0 0; }
    .legend { display: flex; flex-wrap: wrap; gap: 8px 14px; color: var(--muted); font-size: 12px; }
    .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 4px; vertical-align: -1px; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) 230px; height: calc(100vh - 177px); } .detail { border-left: 0; border-top: 1px solid var(--line); } .stats { margin-left: 0; width: 100%; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>O&amp;O Page / Component Graph</h1>
      <p>Generated from <code>site/app/**/page.tsx</code> and local repository imports.</p>
    </div>
    <div class="legend">
      <span><i class="swatch" style="background:#19324d"></i>route</span>
      <span><i class="swatch" style="background:#38526d"></i>page</span>
      <span><i class="swatch" style="background:#315c4a"></i>component</span>
      <span><i class="swatch" style="background:#4b465f"></i>module</span>
      <span><i class="swatch" style="background:#6b4a32"></i>style</span>
    </div>
  </header>
  <div class="toolbar">
    <label>Search <input id="search" type="search" placeholder="route, component, or source path"></label>
    <label>Route scope <select id="routeScope"><option value="all">All routes</option></select></label>
    <div class="checks" aria-label="Node kinds">
      <label><input type="checkbox" value="route" checked> routes</label>
      <label><input type="checkbox" value="page" checked> pages</label>
      <label><input type="checkbox" value="component" checked> components</label>
      <label><input type="checkbox" value="module" checked> modules</label>
      <label><input type="checkbox" value="style" checked> styles</label>
    </div>
    <button id="reset" type="button">Reset view</button>
    <span id="stats" class="stats"></span>
  </div>
  <main class="layout">
    <section class="graph-shell" aria-label="Interactive graph. Use the mouse wheel to zoom and drag to pan.">
      <svg id="graph" role="img" aria-label="Page and component dependency graph">
        <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#64748b"></path></marker></defs>
        <g id="scene"><g id="edges"></g><g id="nodes"></g></g>
      </svg>
    </section>
    <aside class="detail" id="detail">
      <h2>Graph overview</h2>
      <p>Select a node to inspect its source path and direct relationships.</p>
      <dl>
        <dt>Generated</dt><dd id="generated"></dd>
        <dt>Nodes</dt><dd id="nodeTotal"></dd>
        <dt>Edges</dt><dd id="edgeTotal"></dd>
      </dl>
    </aside>
  </main>
  <script>
    const GRAPH = ${graphJson};
    const SVG_NS = "http://www.w3.org/2000/svg";
    const COLORS = { route: "#19324d", page: "#38526d", component: "#315c4a", module: "#4b465f", style: "#6b4a32" };
    const state = { query: "", route: "all", kinds: new Set(["route", "page", "component", "module", "style"]), zoom: 1, panX: 0, panY: 0, selected: null };
    const nodeById = new Map(GRAPH.nodes.map((node) => [node.id, node]));
    const routeScopeByPath = new Map(Object.entries(GRAPH.reachableFilesByRoute));
    const svg = document.getElementById("graph");
    const scene = document.getElementById("scene");
    const edgeLayer = document.getElementById("edges");
    const nodeLayer = document.getElementById("nodes");
    const stats = document.getElementById("stats");
    const detail = document.getElementById("detail");
    const search = document.getElementById("search");
    const routeScope = document.getElementById("routeScope");
    const positions = new Map();

    GRAPH.nodes.filter((node) => node.kind === "route").forEach((node) => {
      const option = document.createElement("option");
      option.value = node.label;
      option.textContent = node.label;
      routeScope.appendChild(option);
    });
    document.getElementById("generated").textContent = GRAPH.generatedAt;
    document.getElementById("nodeTotal").textContent = GRAPH.nodeCount + " (" + Object.entries(GRAPH.countsByKind).map((entry) => entry[0] + ": " + entry[1]).join(", ") + ")";
    document.getElementById("edgeTotal").textContent = GRAPH.edgeCount;

    function nodeVisible(node) {
      if (!state.kinds.has(node.kind)) return false;
      if (state.route !== "all") {
        if (node.kind === "route") return node.label === state.route;
        const scope = routeScopeByPath.get(state.route) || [];
        if (!scope.includes(node.sourcePath)) return false;
      }
      if (!state.query) return true;
      const query = state.query.toLowerCase();
      return (node.label + " " + (node.sourcePath || "")).toLowerCase().includes(query);
    }

    function shortLabel(value, limit) {
      return value.length > limit ? value.slice(0, limit - 1) + "…" : value;
    }

    function applyTransform() {
      scene.setAttribute("transform", "translate(" + state.panX + " " + state.panY + ") scale(" + state.zoom + ")");
    }

    function render() {
      const visibleNodes = GRAPH.nodes.filter(nodeVisible);
      const visibleIds = new Set(visibleNodes.map((node) => node.id));
      const columns = { route: 40, page: 330, component: 650, module: 980, style: 1310 };
      const rowByKind = { route: 0, page: 0, component: 0, module: 0, style: 0 };
      positions.clear();
      visibleNodes.forEach((node) => {
        const row = rowByKind[node.kind]++;
        positions.set(node.id, { x: columns[node.kind] || 40, y: 45 + row * 34, w: 250, h: 24 });
      });
      const maxRows = Math.max(1, ...Object.values(rowByKind));
      const width = 1600;
      const height = Math.max(800, 80 + maxRows * 34);
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      edgeLayer.replaceChildren();
      nodeLayer.replaceChildren();

      GRAPH.edges.forEach((edge) => {
        if (!visibleIds.has(edge.from) || !visibleIds.has(edge.to)) return;
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", from.x + from.w);
        line.setAttribute("y1", from.y + from.h / 2);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y + to.h / 2);
        line.setAttribute("class", "edge " + edge.kind);
        line.dataset.from = edge.from;
        line.dataset.to = edge.to;
        edgeLayer.appendChild(line);
      });

      visibleNodes.forEach((node) => {
        const position = positions.get(node.id);
        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("class", "node" + (state.selected === node.id ? " selected" : ""));
        group.dataset.id = node.id;
        group.setAttribute("transform", "translate(" + position.x + " " + position.y + ")");
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("width", position.w);
        rect.setAttribute("height", position.h);
        rect.setAttribute("fill", COLORS[node.kind] || "#334155");
        rect.setAttribute("stroke", COLORS[node.kind] || "#64748b");
        const text = document.createElementNS(SVG_NS, "text");
        text.setAttribute("x", "8");
        text.setAttribute("y", "16");
        text.textContent = shortLabel(node.label, 34);
        const title = document.createElementNS(SVG_NS, "title");
        title.textContent = node.label + (node.sourcePath ? "\\n" + node.sourcePath : "");
        group.append(rect, text, title);
        group.addEventListener("click", () => selectNode(node.id));
        nodeLayer.appendChild(group);
      });
      stats.textContent = visibleNodes.length + " nodes · " + GRAPH.edges.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to)).length + " edges shown";
      applyTransform();
    }

    function selectNode(id) {
      state.selected = id;
      const node = nodeById.get(id);
      if (!node) return;
      const outgoing = GRAPH.edges.filter((edge) => edge.from === id).map((edge) => nodeById.get(edge.to)).filter(Boolean);
      const incoming = GRAPH.edges.filter((edge) => edge.to === id).map((edge) => nodeById.get(edge.from)).filter(Boolean);
      detail.replaceChildren();
      const heading = document.createElement("h2");
      heading.textContent = node.label;
      detail.appendChild(heading);
      const dl = document.createElement("dl");
      addDetail(dl, "Kind", node.kind);
      addDetail(dl, "Source", node.sourcePath || "—");
      addDetail(dl, "Direct imports", String(outgoing.length));
      addDetail(dl, "Direct dependents", String(incoming.length));
      detail.appendChild(dl);
      addList("Imports", outgoing);
      addList("Imported by", incoming);
      render();
    }

    function addDetail(dl, label, value) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      dl.append(dt, dd);
    }

    function addList(label, nodes) {
      const heading = document.createElement("h3");
      heading.textContent = label + " (" + nodes.length + ")";
      detail.appendChild(heading);
      if (!nodes.length) return;
      const list = document.createElement("ul");
      nodes.slice(0, 30).forEach((node) => {
        const item = document.createElement("li");
        item.textContent = node.label;
        list.appendChild(item);
      });
      if (nodes.length > 30) {
        const more = document.createElement("li");
        more.textContent = "…and " + (nodes.length - 30) + " more";
        list.appendChild(more);
      }
      detail.appendChild(list);
    }

    search.addEventListener("input", () => { state.query = search.value.trim(); render(); });
    routeScope.addEventListener("change", () => { state.route = routeScope.value; render(); });
    document.querySelectorAll(".checks input").forEach((input) => input.addEventListener("change", () => {
      if (input.checked) state.kinds.add(input.value); else state.kinds.delete(input.value);
      render();
    }));
    document.getElementById("reset").addEventListener("click", () => {
      state.query = ""; state.route = "all"; state.kinds = new Set(["route", "page", "component", "module", "style"]); state.zoom = 1; state.panX = 0; state.panY = 0; state.selected = null;
      search.value = ""; routeScope.value = "all"; document.querySelectorAll(".checks input").forEach((input) => { input.checked = true; });
      render();
    });

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    svg.addEventListener("wheel", (event) => {
      event.preventDefault();
      state.zoom = Math.max(.2, Math.min(4, state.zoom * (event.deltaY < 0 ? 1.12 : .89)));
      applyTransform();
    }, { passive: false });
    svg.addEventListener("pointerdown", (event) => { dragging = true; lastX = event.clientX; lastY = event.clientY; svg.classList.add("dragging"); svg.setPointerCapture(event.pointerId); });
    svg.addEventListener("pointermove", (event) => { if (!dragging) return; state.panX += event.clientX - lastX; state.panY += event.clientY - lastY; lastX = event.clientX; lastY = event.clientY; applyTransform(); });
    svg.addEventListener("pointerup", (event) => { dragging = false; svg.classList.remove("dragging"); svg.releasePointerCapture(event.pointerId); });
    svg.addEventListener("pointercancel", () => { dragging = false; svg.classList.remove("dragging"); });
    render();
  </script>
</body>
</html>
`;
}

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "page-component-graph.json"), JSON.stringify(graph, null, 2));
await writeFile(path.join(OUT, "page-component-graph.html"), buildGraphHtml(graph));

const mermaidLines = ["flowchart LR", "  classDef route fill:#19324d,stroke:#7dd3fc,color:#fff", "  classDef page fill:#38526d,stroke:#bfdbfe,color:#fff", "  classDef component fill:#315c4a,stroke:#86efac,color:#fff", "  classDef module fill:#4b465f,stroke:#c4b5fd,color:#fff", "  classDef style fill:#6b4a32,stroke:#fdba74,color:#fff"];
const mermaidIds = new Map();
let mermaidIndex = 0;
for (const node of nodes) {
  mermaidIndex += 1;
  mermaidIds.set(node.id, safeMermaidId(mermaidIndex));
  if (node.kind === "route" || node.kind === "page" || node.kind === "component" || node.kind === "style" || node.kind === "module") {
    mermaidLines.push(`  ${safeMermaidId(mermaidIndex)}["${escapeMermaidLabel(node.label)}"]:::${node.kind}`);
  }
}
for (const edge of edges) {
  if (edge.kind === "owns") mermaidLines.push(`  ${mermaidIds.get(edge.from)} -->|owns| ${mermaidIds.get(edge.to)}`);
}
for (const edge of edges) {
  if (edge.kind === "imports" && mermaidIds.has(edge.from) && mermaidIds.has(edge.to)) {
    mermaidLines.push(`  ${mermaidIds.get(edge.from)} -. imports .-> ${mermaidIds.get(edge.to)}`);
  }
}
await writeFile(path.join(OUT, "page-component-graph.mmd"), `${mermaidLines.join("\n")}\n`);
await writeFile(
  path.join(OUT, "summary.txt"),
  [
    `generatedAt=${graph.generatedAt}`,
    `routes=${graph.routeCount}`,
    `nodes=${graph.nodeCount}`,
    `edges=${graph.edgeCount}`,
    ...Object.entries(graph.countsByKind).map(([kind, count]) => `${kind}Nodes=${count}`),
    `json=page-component-graph.json`,
    `html=page-component-graph.html`,
    `mermaid=page-component-graph.mmd`,
  ].join("\n") + "\n",
);
console.log(JSON.stringify({
  generatedAt: graph.generatedAt,
  routeCount: graph.routeCount,
  nodeCount: graph.nodeCount,
  edgeCount: graph.edgeCount,
  countsByKind: graph.countsByKind,
  output: OUT,
}, null, 2));

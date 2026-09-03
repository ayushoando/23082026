/**
 * Oando TUI — project-local pi extension for this repo (D:/23082026)
 *
 * What forks here (why this is project-local, not global):
 * - Studio (/oostudio) and Planner (/ooplanner) are forked — nav + boundaries guard
 * - Two DBs (Admin rxzpznmxbaoxpikowmfc / Products erpweaiypimorcunaimz) + disk<>supabase persistence
 * - API catalog in site/lib/apiCatalog.ts + site/app/api route inventory
 * - Gate system: check:layout / verify:focss / gate:fast / gate (ship) / scan:boundaries
 * - Furniture + descriptors under site/platform/shared/data/furniture & site/inventory/descriptors
 *
 * Requires: @earendil-works/pi-tui ^0.84.4 (installed in D:/23082026/.pi/extensions/oando-tui)
 *
 * Install deps once:  pnpm --dir D:/23082026/.pi/extensions/oando-tui install
 *                      (or: npm install --prefix D:/23082026/.pi/extensions/oando-tui)
 * Reload after edits: /reload  (project-local extensions are auto-discovered)
 * Open:               /oando  or  /oando <subcommand>
 */

import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { BorderedLoader, DynamicBorder, getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import {
  Container,
  Markdown,
  Text,
  Spacer,
  type SelectItem,
  SelectList,
  SettingsList,
  type SettingItem,
} from "@earendil-works/pi-tui";

// ---------- helpers ----------

const REPO_ROOT = "D:/23082026";

function repoPath(...parts: string[]) {
  return join(REPO_ROOT, ...parts);
}

function listFurnitureIds(limit = 40): { id: string; label: string; description?: string }[] {
  const dir = repoPath("site/platform/shared/data/furniture");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).slice(0, limit);
  return files.map((f) => {
    const p = join(dir, f);
    try {
      const j = JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
      const name = (j["name"] as string) || (j["title"] as string) || f.replace(/\.json$/, "");
      const sku = (j["sku"] as string) || (j["id"] as string) || "";
      return { id: f, label: name.slice(0, 48), description: sku ? `${sku} · ${f}` : f };
    } catch {
      return { id: f, label: f };
    }
  });
}

function readFurnitureMarkdown(id: string, themeHint?: string): string {
  const p = repoPath("site/platform/shared/data/furniture", id);
  if (!existsSync(p)) return `_Not found: ${id}_`;
  const raw = readFileSync(p, "utf-8");
  let j: Record<string, unknown>;
  try { j = JSON.parse(raw); } catch { return "```json\n" + raw.slice(0, 4000) + "\n```"; }
  const name = (j["name"] as string) || id;
  const sku = (j["sku"] as string) || "";
  const dims = j["dimensions"] ? JSON.stringify(j["dimensions"]) : "";
  const price = j["price"] != null ? String(j["price"]) : "";
  return [
    `## ${name}`,
    sku ? `**SKU:** \`${sku}\`  ·  **file:** \`${id}\`` : `**file:** \`${id}\``,
    price ? `**price:** ${price}` : "",
    dims ? `**dimensions:** \`${dims}\`` : "",
    "",
    "```json",
    JSON.stringify(j, null, 2).slice(0, 6000),
    "```",
    themeHint ? `\n> theme hint: ${themeHint}` : "",
  ].filter(Boolean).join("\n");
}

// Minimal API catalog snapshot (kept in sync with site/lib/apiCatalog.ts — full list lives there)
// Using a short curated set for the TUI; the API explorer also reads the file live when available.
const API_GROUPS: { label: string; items: { value: string; label: string; description: string }[] }[] = [
  { label: "Core", items: [
    { value: "/api/health", label: "GET /api/health", description: "Liveness probe" },
    { value: "/api/products", label: "GET /api/products", description: "Product listing" },
    { value: "/api/categories", label: "GET /api/categories", description: "Category list" },
    { value: "/api/nav-search", label: "GET/POST /api/nav-search", description: "Site search" },
    { value: "/api/theme/active", label: "GET /api/theme/active", description: "Active theme tokens" },
  ]},
  { label: "Studio", items: [
    { value: "/api/Studio/furniture", label: "GET/POST /api/Studio/furniture", description: "Studio furniture collection" },
    { value: "/api/Studio/furniture/{id}", label: "GET/PATCH/DELETE /api/Studio/furniture/{id}", description: "Furniture item" },
    { value: "/api/Studio/ai/generate", label: "POST /api/Studio/ai/generate", description: "AI generate" },
  ]},
  { label: "Planner", items: [
    { value: "/api/Planner/projects", label: "GET/POST /api/Planner/projects", description: "Planner projects" },
    { value: "/api/Planner/catalog", label: "GET /api/Planner/catalog", description: "Planner catalog read" },
    { value: "/api/Planner/handoff", label: "POST /api/Planner/handoff", description: "BOQ handoff" },
  ]},
  { label: "Ops/Admin", items: [
    { value: "/api/admin/plans", label: "GET /api/admin/plans", description: "Admin plans" },
    { value: "/api/admin/themes", label: "GET /api/admin/themes", description: "Admin themes" },
    { value: "/api/files/furniture/{filename}", label: "GET /api/files/furniture/{…}", description: "Furniture bytes" },
    { value: "/.well-known/api-catalog", label: "GET /.well-known/api-catalog", description: "RFC 9727 catalog" },
  ]},
];

const GATE_ITEMS: SelectItem[] = [
  { value: "gate:fast", label: "gate:fast", description: "Dev loop  — check:layout + verify:focss + typecheck + p0 + audits" },
  { value: "gate", label: "gate (ship)", description: "Full suite + build + coverage — release:gate" },
  { value: "check:layout", label: "check:layout", description: "Fork boundaries + repo layout" },
  { value: "verify:focss", label: "verify:focss", description: "CSS @focss/* contract" },
  { value: "scan:boundaries", label: "scan:boundaries", description: "Studio ↔ Planner import guard" },
  { value: "scan:secrets", label: "scan:secrets", description: "Secret scan" },
  { value: "typecheck", label: "typecheck", description: "tsc -p site/tsconfig.json" },
  { value: "lint", label: "lint", description: "oxlint" },
  { value: "ops:list", label: "ops:list", description: "Long-tail ops list (db, r2, vercel…)" },
];

const MAIN_ITEMS: SelectItem[] = [
  { value: "gate", label: "Gate & Checks…", description: "gate:fast / gate / check:layout / verify:focss / scan:boundaries" },
  { value: "api", label: "API Catalog…", description: "Browse site/lib/apiCatalog.ts + /api route inventory" },
  { value: "furniture", label: "Furniture Browser…", description: "Browse site/platform/shared/data/furniture/*.json" },
  { value: "descriptors", label: "Descriptors…", description: "site/inventory/descriptors/*.json" },
  { value: "persistence", label: "Persistence Modes", description: "Disk (DEV_AUTH_BYPASS=1) vs Supabase + mode wrappers" },
  { value: "forks", label: "Fork Map (Studio/Planner)", description: "Aliases @studio/* vs @planner/* — no cross-imports" },
  { value: "commands", label: "Commands & Shortcuts", description: "All /oando subcommands + keybinding" },
];

async function runPnpmScript(
  ctx: ExtensionContext,
  script: string,
  extraArgs: string[] = [],
): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    // Run via pnpm in repo root; stream to a buffer then resolve.
    // Shown inside a BorderedLoader via ctx.ui.custom — caller handles UI.
    const child = spawn("pnpm", ["run", script, ...extraArgs], {
      cwd: REPO_ROOT,
      shell: true,
      env: process.env,
    });
    let out = "";
    const cap = (d: Buffer) => {
      out += d.toString();
      if (out.length > 12000) out = out.slice(-12000);
    };
    child.stdout?.on("data", cap);
    child.stderr?.on("data", cap);
    child.on("close", (code) => resolve({ ok: code === 0, output: out || `(exit ${code})` }));
    child.on("error", (e) => resolve({ ok: false, output: String(e) }));
  });
}

function pnpmHelp(): string {
  return [
    "### `pnpm` only — repo root only",
    "",
    "- **Install:** `pnpm install` (never inside `site/` or `tech-docs-generator/`)",
    "- **Dev:** `pnpm dev` → http://localhost:3000 (never 127.0.0.1)",
    "- **Gate (ship):** `pnpm run gate` (= release:gate)",
    "- **Gate (fast):** `pnpm run gate:fast`",
    "- **Boundaries:** `pnpm run scan:boundaries` before committing Studio/Planner",
    "- **CSS:** `pnpm run verify:focss` · `lint:ui:strict` · `check:style-tokens`",
    "- **Tests:** `pnpm run test` (two vitest lanes, happy-dom)",
    "",
    "See `AGENTS.md` §2/§3 and `README.md` §Forks for the Studio/Planner fork contract.",
  ].join("\n");
}

// ---------- TUI pickers ----------

async function pickWithSelectList(
  ctx: ExtensionContext,
  title: string,
  items: SelectItem[],
  hint = "↑↓ navigate • enter select • esc cancel",
): Promise<string | null> {
  return ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
    const c = new Container();
    c.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    c.addChild(new Text(theme.fg("accent", theme.bold(title)), 1, 0));
    const list = new SelectList(items, Math.min(items.length, 12), {
      selectedPrefix: (t) => theme.fg("accent", t),
      selectedText: (t) => theme.fg("accent", t),
      description: (t) => theme.fg("muted", t),
      scrollInfo: (t) => theme.fg("dim", t),
      noMatch: (t) => theme.fg("warning", t),
    });
    list.onSelect = (it) => done(it.value);
    list.onCancel = () => done(null);
    c.addChild(list);
    c.addChild(new Text(theme.fg("dim", hint), 1, 0));
    c.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    return {
      render: (w) => c.render(w),
      invalidate: () => c.invalidate(),
      handleInput: (d) => { list.handleInput(d); tui.requestRender(); },
    };
  });
}

async function showMarkdownModal(ctx: ExtensionContext, title: string, md: string) {
  // Try themed markdown; fall back to plain container if getMarkdownTheme unavailable
  let mdTheme: unknown = undefined;
  try {
    const mod = await import("@earendil-works/pi-coding-agent");
    const g = (mod as unknown as Record<string, unknown>)["getMarkdownTheme"];
    if (typeof g === "function") mdTheme = (g as () => unknown)();
  } catch { /* ignore */ }

  await ctx.ui.custom<void>((tui, theme, _kb, done) => {
    const c = new Container();
    c.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    c.addChild(new Text(theme.fg("accent", theme.bold(title)), 1, 0));
    if (mdTheme) {
      c.addChild(new Markdown(md, 1, 0, mdTheme as never));
    } else {
      // plain fallback — wrap with Text
      for (const line of md.split("\n")) c.addChild(new Text(line, 1, 0));
    }
    c.addChild(new Spacer(1));
    c.addChild(new Text(theme.fg("dim", "esc / q to close"), 1, 0));
    c.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    return {
      render: (w) => c.render(w),
      invalidate: () => c.invalidate(),
      handleInput: (d) => {
        const lower = d.toLowerCase();
        if (d === "\x1b" || lower === "q" || lower === "\x03") { done(undefined); return; }
        // allow scrolling inside Markdown via its own handler if needed — just re-render
        tui.requestRender();
      },
    };
  });
}

async function runWithLoader<T>(ctx: ExtensionContext, message: string, work: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
  return ctx.ui.custom<T | null>((tui, theme, _kb, done) => {
    const loader = new BorderedLoader(tui, theme, message);
    loader.onAbort = () => done(null);
    work(loader.signal).then((v) => done(v)).catch(() => done(null));
    return loader;
  });
}

// ---------- feature flows ----------

async function flowGate(ctx: ExtensionContext) {
  const choice = await pickWithSelectList(ctx, "Oando — Gate & Checks", GATE_ITEMS);
  if (!choice) return;
  const pretty: Record<string, string> = {
    "gate:fast": "gate:fast", gate: "gate", "check:layout": "check:layout",
    "verify:focss": "verify:focss", "scan:boundaries": "scan:boundaries",
    "scan:secrets": "scan:secrets", typecheck: "typecheck", lint: "lint", "ops:list": "ops:list",
  };
  const script = pretty[choice] ?? choice;
  const result = await runWithLoader(ctx, `Running pnpm run ${script}…  (esc to cancel)`, async (signal) => {
    // cooperative cancel — if aborted, kill child via signal wiring in runPnpmScript would need plumbing;
    // for now we just run and honor abort as "dismiss loader" (child still finishes, output truncated)
    if (signal.aborted) return null as unknown as { ok: boolean; output: string };
    return runPnpmScript(ctx, script);
  });
  if (!result) { ctx.ui.notify("Cancelled", "info"); return; }
  const r = result as { ok: boolean; output: string };
  const icon = r.ok ? "✓" : "✗";
  const md = [
    `## ${icon} \`pnpm run ${script}\` — ${r.ok ? "pass" : "fail"}`,
    "",
    "```",
    r.output.slice(0, 8000) || "(no output)",
    "```",
  ].join("\n");
  await showMarkdownModal(ctx, `Result — ${script}`, md);
  ctx.ui.notify(r.ok ? `${script} passed` : `${script} failed — see modal`, r.ok ? "info" : "warning");
}

async function flowApiCatalog(ctx: ExtensionContext) {
  // Flatten groups for picker
  const flat: SelectItem[] = [];
  for (const g of API_GROUPS) for (const it of g.items) flat.push({ value: it.value, label: `[${g.label}] ${it.label}`, description: it.description });
  flat.push({ value: "__open_file", label: "Open site/lib/apiCatalog.ts…", description: "Full catalog + REWRITE_API_ALIASES + DISCOVERY_ENDPOINTS" });
  flat.push({ value: "__open_routes", label: "Open docs/architecture/routes.md…", description: "Route inventory docs" });
  const choice = await pickWithSelectList(ctx, "Oando — API Catalog", flat);
  if (!choice) return;
  if (choice === "__open_file") {
    const p = repoPath("site/lib/apiCatalog.ts");
    const md = existsSync(p) ? "```ts\n" + readFileSync(p, "utf-8").slice(0, 9000) + "\n```" : "_site/lib/apiCatalog.ts not found_";
    await showMarkdownModal(ctx, "site/lib/apiCatalog.ts", md);
    return;
  }
  if (choice === "__open_routes") {
    const p = repoPath("docs/architecture/routes.md");
    const md = existsSync(p) ? readFileSync(p, "utf-8").slice(0, 9000) : "_docs/architecture/routes.md not found_";
    await showMarkdownModal(ctx, "docs/architecture/routes.md", md);
    return;
  }
  const md = [
    `## \`${choice}\``,
    "",
    `Try it:`,
    "```bash",
    `curl -s http://localhost:3000${choice.replace(/\{[^}]+\}/g, "123")} | jq .`,
    "```",
    "",
    `Catalog source: \`site/lib/apiCatalog.ts\` → \`DISK_API_ROUTES\` / \`API_CATALOG_ENTRIES\``,
    `Docs: \`docs/architecture/routes.md\` · Discovery: \`/.well-known/api-catalog\``,
  ].join("\n");
  await showMarkdownModal(ctx, choice, md);
}

async function flowFurniture(ctx: ExtensionContext) {
  const ids = listFurnitureIds(60);
  if (ids.length === 0) {
    await showMarkdownModal(ctx, "Furniture", "_No JSON files in `site/platform/shared/data/furniture/`_");
    return;
  }
  const items: SelectItem[] = ids.map((x) => ({ value: x.id, label: x.label, description: x.description }));
  const choice = await pickWithSelectList(ctx, "Oando — Furniture Browser", items, "↑↓ navigate • enter preview • esc back");
  if (!choice) return;
  const md = readFurnitureMarkdown(choice);
  await showMarkdownModal(ctx, choice, md);
  // loop back for quick browsing
  await flowFurniture(ctx);
}

async function flowDescriptors(ctx: ExtensionContext) {
  const dir = repoPath("site/inventory/descriptors");
  if (!existsSync(dir)) { await showMarkdownModal(ctx, "Descriptors", "_site/inventory/descriptors/ not found_"); return; }
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).slice(0, 80);
  if (files.length === 0) { await showMarkdownModal(ctx, "Descriptors", "_No descriptor JSON files found_"); return; }
  const items: SelectItem[] = files.map((f) => ({ value: f, label: f }));
  const choice = await pickWithSelectList(ctx, "Oando — Descriptors", items);
  if (!choice) return;
  const p = join(dir, choice);
  const md = "```json\n" + readFileSync(p, "utf-8").slice(0, 8000) + "\n```";
  await showMarkdownModal(ctx, choice, md);
}

async function flowPersistence(ctx: ExtensionContext) {
  const md = [
    "## Persistence — no dual-write",
    "",
    "> Production filesystem is **read-only**. Raw disk helpers throw `EROFS`. All runtime writes must use mode-aware wrappers.",
    "",
    "| Data | Disk (dev) | Supabase | Selector |",
    "|------|----------|----------|----------|",
    "| Plans | `site/platform/Planner/data/projects/` | `oando_plans` | `plannerPersistenceMode.ts` |",
    "| Furniture | `site/platform/shared/data/furniture/` | `furniture_catalog` | `furnitureCatalogMode.ts` |",
    "| Descriptors | `site/inventory/descriptors/` | `block_descriptors` | _(same as furniture)_ |",
    "",
    "- **Mode:** `DEV_AUTH_BYPASS=1` (non-prod) → **disk**, else **Supabase**",
    "- **Wrappers:** `writeFurnitureItem`, `readFurnitureItem`, etc. — never raw disk helpers in prod",
    "- **Seed:** `pnpm run seed:furniture` (off the read path)",
    "- **DBs:** Admin `rxzpznmxbaoxpikowmfc` (plans/profiles/furniture/descriptors), Products `erpweaiypimorcunaimz` (marketing catalog)",
    "",
    `**Current env:** \`DEV_AUTH_BYPASS=${process.env["DEV_AUTH_BYPASS"] ?? "(unset)"}\` · \`NODE_ENV=${process.env["NODE_ENV"] ?? "(unset)"}\``,
  ].join("\n");
  await showMarkdownModal(ctx, "Persistence Modes", md);
}

async function flowForks(ctx: ExtensionContext) {
  const md = [
    "## Studio / Planner — fully forked",
    "",
    "- **Never import each other.** Run `pnpm run scan:boundaries` before committing either tree.",
    "",
    "| Path | Role |",
    "|------|------|",
    "| `site/app/(site)` , `site/app/admin` | Marketing + Admin |",
    "| `site/{components,lib,hooks,store,server}/{Studio,Planner}/` | Fork trees |",
    "| `site/focss/` | CSS (`@focss/*`) |",
    "| `site/platform/shared/data/` | Furniture (disk dev only) |",
    "",
    "- Aliases: `@studio/*` ↔ `@planner/*` (no cross-imports)",
    "- Layout guard: `pnpm run check:layout`",
    "- Harness & tests: `tests/` · `tech-docs-generator/` · `config/build/`",
    "- Plans: `plans/PLAN.md` · hub flow `plans/client-hub/flowcharts/clients-hub-flow.md`",
  ].join("\n");
  await showMarkdownModal(ctx, "Fork Map — Studio / Planner", md);
}

async function flowCommands(ctx: ExtensionContext) {
  const md = [
    "## /oando — commands",
    "",
    "```",
    "/oando                 Main menu (this picker)",
    "/oando gate            Gate & checks picker",
    "/oando api             API catalog explorer",
    "/oando furniture       Furniture browser",
    "/oando descriptors     Descriptors browser",
    "/oando persistence     Persistence modes",
    "/oando forks           Studio/Planner fork map",
    "/oando help            Show pnpm + layout help",
    "/oando settings        Toggle extension settings (demo of SettingsList)",
    "```",
    "",
    "- **Shortcut:** `Ctrl+Shift+O` → open /oando menu",
    "- **Reload:** `/reload` after editing `D:/23082026/.pi/extensions/oando-tui/index.ts`",
    "- **Deps:** `pnpm --dir D:/23082026/.pi/extensions/oando-tui install`",
    "",
    pnpmHelp(),
  ].join("\n");
  await showMarkdownModal(ctx, "Commands & Shortcuts", md);
}

async function flowSettings(ctx: ExtensionContext) {
  const items: SettingItem[] = [
    { id: "statusLine", label: "Status line", currentValue: "on", values: ["on", "off"] },
    { id: "guardBypass", label: "Warn on 127.0.0.1", currentValue: "on", values: ["on", "off"] },
    { id: "furnitureFollow", label: "Furniture loop-back", currentValue: "on", values: ["on", "off"] },
  ];
  await ctx.ui.custom<void>((tui, theme, _kb, done) => {
    const c = new Container();
    c.addChild(new Text(theme.fg("accent", theme.bold("Oando TUI — Settings")), 1, 0));
    const list = new SettingsList(
      items, Math.min(items.length + 2, 12), getSettingsListTheme(),
      (_id, _val) => { /* demo — wire to real state if needed */ },
      () => done(undefined),
      { enableSearch: false },
    );
    c.addChild(list);
    c.addChild(new Text(theme.fg("dim", "enter/space toggle • esc close"), 1, 0));
    return { render: (w) => c.render(w), invalidate: () => c.invalidate(), handleInput: (d) => { list.handleInput?.(d); tui.requestRender(); } };
  });
}

// ---------- extension ----------

export default function (pi: ExtensionAPI) {
  // Status indicator while idle
  pi.on("session_start", async (_e, ctx) => {
    ctx.ui.setStatus("oando-tui", ctx.ui.theme.fg("accent", "◆ oando:tui") + ctx.ui.theme.fg("dim", "  /oando"));
  });
  pi.on("session_shutdown", async (_e, ctx) => {
    ctx.ui.setStatus("oando-tui", undefined);
  });

  // Guard: AGENTS.md §2 — never use 127.0.0.1, use localhost
  pi.on("tool_call", async (event, ctx) => {
    const input = event.input as Record<string, unknown> | undefined;
    const hay = JSON.stringify(input ?? "").toLowerCase();
    if (hay.includes("127.0.0.1")) {
      ctx.ui.notify("Use http://localhost:3000 — not 127.0.0.1 (AGENTS.md §2)", "warning");
    }
  });

  // Keybinding: Ctrl+Shift+O opens menu
  try {
    pi.registerShortcut("ctrl+shift+o", {
      description: "Open Oando TUI menu (/oando)",
      handler: async (ctx) => { await openMain(ctx); },
    });
  } catch { /* older pi without registerShortcut — ignore */ }

  pi.registerCommand("oando", {
    description: "Oando TUI — gate, API catalog, furniture browser, fork map (try /oando help)",
    handler: async (args, ctx) => {
      const a = (args ?? "").trim().toLowerCase();
      if (!a) return openMain(ctx);
      if (a === "gate" || a.startsWith("gate")) return flowGate(ctx);
      if (a === "api" || a.startsWith("api")) return flowApiCatalog(ctx);
      if (a === "furniture" || a.startsWith("furn")) return flowFurniture(ctx);
      if (a === "descriptors" || a.startsWith("desc")) return flowDescriptors(ctx);
      if (a === "persistence" || a.startsWith("persist")) return flowPersistence(ctx);
      if (a === "forks" || a.startsWith("fork")) return flowForks(ctx);
      if (a === "help" || a === "--help" || a === "-h") return flowCommands(ctx);
      if (a === "settings" || a === "config") return flowSettings(ctx);
      if (a === "status") { ctx.ui.notify("oando:tui ready — /oando to open", "info"); return; }
      // bare subcommand like "gate:fast"
      if (["gate:fast", "gate:full", "check:layout", "verify:focss", "scan:boundaries"].some((k) => a.includes(k))) {
        return flowGate(ctx);
      }
      await openMain(ctx);
    },
  });

  async function openMain(ctx: ExtensionContext) {
    if (ctx.mode !== "tui") {
      ctx.ui.notify("Oando TUI needs TUI mode. Run pi normally (not -p / --json). Try /oando help for CLI usage.", "warning");
      return;
    }
    const choice = await pickWithSelectList(ctx, "Oando — Project TUI  (D:/23082026)", MAIN_ITEMS, "↑↓ navigate • enter open • esc close  •  Ctrl+Shift+O");
    if (!choice) return;
    if (choice === "gate") return flowGate(ctx);
    if (choice === "api") return flowApiCatalog(ctx);
    if (choice === "furniture") return flowFurniture(ctx);
    if (choice === "descriptors") return flowDescriptors(ctx);
    if (choice === "persistence") return flowPersistence(ctx);
    if (choice === "forks") return flowForks(ctx);
    if (choice === "commands") return flowCommands(ctx);
  }
}

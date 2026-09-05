import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

const token = (process.env.VERCEL_TOKEN || "").trim();
if (!token) {
  process.stderr.write("VERCEL_TOKEN missing in .env.local\n");
  process.exit(1);
}

const SKIP = new Set(["DEV_AUTH_BYPASS"]);
const ONLY_ADD = new Set([
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "VERCEL_TOKEN",
  "VERCEL_SITE_API_TOKEN",
  "VERCEL_TECH_STACK_API_TOKEN",
  "VERCEL_OIDC_TOKEN",
  "NEW_RELIC_USER_KEY",
  "NEW_RELIC_LICENSE_KEY",
  "OTEL_SERVICE_NAME",
  "OTEL_EXPORTER_OTLP_PROTOCOL",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "OTEL_EXPORTER_OTLP_HEADERS",
  "TRACELOOP_BASE_URL",
  "TRACELOOP_HEADERS",
]);

const raw = fs.readFileSync(
  new URL("../.env.local", import.meta.url),
  "utf8",
);
const parsed = [];
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq <= 0) continue;
  const k = t.slice(0, eq).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
  let v = t.slice(eq + 1).trim();
  if (
    v.length >= 2 &&
    ((v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'")))
  ) {
    v = v.slice(1, -1);
  }
  if (SKIP.has(k)) continue;
  if (!ONLY_ADD.has(k)) continue;
  if (!v) continue;
  parsed.push([k, v]);
}
const vars = new Map(parsed);

let ok = 0;
const failed = [];
let i = 0;
for (const [k, v] of vars) {
  i += 1;
  const sensitive = !k.startsWith("NEXT_PUBLIC_");
  const args = [
    "dlx",
    "vercel",
    "env",
    "add",
    k,
    "production",
    "--force",
    sensitive ? "--sensitive" : "--no-sensitive",
    "--token",
    token,
    "--yes",
  ];
  const r = spawnSync("pnpm", args, {
    encoding: "utf8",
    shell: true,
    input: v + "\n",
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  if (r.status === 0) {
    ok += 1;
    process.stdout.write(`[${i}/${vars.size}] OK ${k}\n`);
  } else {
    failed.push(k);
    process.stdout.write(
      `[${i}/${vars.size}] FAIL ${k} status=${r.status} ${out.slice(-300)}\n`,
    );
  }
}
process.stdout.write(`\nDONE ok=${ok} failed=${failed.length} total=${vars.size}\n`);
if (failed.length > 0) {
  process.stdout.write(`FAILED: ${failed.join(" ")}\n`);
  process.exit(1);
}

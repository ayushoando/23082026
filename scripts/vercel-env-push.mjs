import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

// Determine authentication: prefer VERCEL_TOKEN if valid, otherwise use active CLI session
let tokenArgs = [];
const rawToken = (process.env.VERCEL_TOKEN || "").trim();
if (rawToken) {
  const check = spawnSync("pnpm", ["dlx", "vercel", "whoami", "--token", rawToken], {
    encoding: "utf8",
    shell: true,
  });
  if (check.status === 0) {
    tokenArgs = ["--token", rawToken];
    process.stdout.write("Using valid VERCEL_TOKEN from environment\n");
  } else {
    process.stdout.write("VERCEL_TOKEN in .env.local unauthorized; checking active Vercel CLI session...\n");
  }
}

if (tokenArgs.length === 0) {
  const check = spawnSync("pnpm", ["dlx", "vercel", "whoami"], {
    encoding: "utf8",
    shell: true,
  });
  if (check.status === 0) {
    const user = (check.stdout || check.stderr || "").trim().split(/\r?\n/).pop() || "authenticated";
    process.stdout.write(`Using active Vercel CLI session: ${user}\n`);
  } else {
    process.stderr.write("No valid Vercel credentials found. Run `vercel login` or set a valid VERCEL_TOKEN.\n");
    process.exit(1);
  }
}

// Load keys from site/.env.example
const examplePath = new URL("../site/.env.example", import.meta.url);
const exampleRaw = fs.readFileSync(examplePath, "utf8");
const exampleKeys = [];
const defaultMap = new Map();

for (const line of exampleRaw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq <= 0) continue;
  const k = t.slice(0, eq).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
  const defVal = t.slice(eq + 1).trim();
  exampleKeys.push(k);
  if (defVal) defaultMap.set(k, defVal);
}

// NEVER push DEV_AUTH_BYPASS to production
const SKIP = new Set(["DEV_AUTH_BYPASS"]);
const targetEnv = process.argv[2] || "production,preview";

const vars = new Map();
for (const k of exampleKeys) {
  if (SKIP.has(k)) continue;
  let v = process.env[k];
  if (v === undefined || v === "") {
    v = defaultMap.get(k) || "";
  }
  if (
    v.length >= 2 &&
    ((v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'")))
  ) {
    v = v.slice(1, -1);
  }
  if (!v) continue;
  vars.set(k, v);
}

process.stdout.write(`Prepared ${vars.size} environment variables matching site/.env.example for targets: [${targetEnv}]\n`);

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
    targetEnv,
    "--force",
    sensitive ? "--sensitive" : "--no-sensitive",
    ...tokenArgs,
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

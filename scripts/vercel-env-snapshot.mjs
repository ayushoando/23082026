import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();
const token = (process.env.VERCEL_TOKEN || "").trim();
if (!token) {
  process.stderr.write("VERCEL_TOKEN missing\n");
  process.exit(1);
}
const r = spawnSync("pnpm", ["dlx", "vercel", "env", "ls", "--token", token], {
  encoding: "utf8",
  shell: true,
});
const fs = await import("node:fs");
fs.writeFileSync(
  new URL("./vercel-env-snapshot.out.txt", import.meta.url),
  `STATUS=${r.status}\n---STDOUT---\n${r.stdout || ""}\n---STDERR---\n${r.stderr || ""}\n`,
);
process.stdout.write(`STATUS=${r.status} written to vercel-env-snapshot.out.txt\n`);

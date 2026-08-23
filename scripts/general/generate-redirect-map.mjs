#!/usr/bin/env node
/** Export next.config redirect list for plan 02 module 1 evidence. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const config = require(path.join(root, "config/build/next.config.js"));
const outPath = path.join(root, "results", "seo", "redirect-map.txt");

async function main() {
  const redirects = await config.redirects();
  const lines = [
    `# Redirect map (${redirects.length} rules)`,
    `generatedAt: ${new Date().toISOString()}`,
    "",
    "source\tdestination\tpermanent",
    ...redirects.map((r) => `${r.source}\t${r.destination}\t${r.permanent ? "308/301" : "302"}`),
  ];
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

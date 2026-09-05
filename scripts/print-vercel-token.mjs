import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();
const t = (process.env.VERCEL_TOKEN || "").trim();
if (!t) {
  process.stderr.write("TOKEN_MISSING\n");
  process.exit(1);
}
process.stdout.write(`TOKEN_SET len=${t.length}\n`);

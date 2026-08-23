import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const root = process.env.PLANS_PURITY_ROOT
  ? path.resolve(process.env.PLANS_PURITY_ROOT)
  : process.env.MONOREPO_ROOT
    ? path.resolve(process.env.MONOREPO_ROOT)
    : defaultRoot;
const planRoot = path.join(root, "plans");

if (!fs.existsSync(planRoot) || !fs.statSync(planRoot).isDirectory()) {
  console.error("check:plans-purity FAIL:\n  missing: plans/");
  process.exit(1);
}

console.log("check:plans-purity OK - plans/ exists");

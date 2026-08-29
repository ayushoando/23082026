/** Coverage policy shared by Planner, Studio, Site, Admin, and reports. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repositoryRoot, "tests", "manifests", "coverage-exceptions.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

/** The approved policy is data, not a copied comment or profile-local constant. */
export const APPROVED_COVERAGE_POLICY = Object.freeze({ ...manifest.policy });

function gate(profile, meaning) {
  return Object.freeze({ ...APPROVED_COVERAGE_POLICY, profile, meaning });
}

export const COVERAGE_GATE_PLANNER = gate(
  "planner",
  "Full Planner and Studio fork surfaces; expand tests rather than lowering the gate.",
);
export const COVERAGE_GATE_ADMIN = gate(
  "admin",
  "Admin feature surface; expand tests rather than lowering the gate.",
);
export const COVERAGE_GATE_SITE = gate(
  "site",
  "Scoped marketing, catalog, configurator, advisor, assistant, and operations logic.",
);

/** @deprecated alias — prefer an explicit profile gate. */
export const COVERAGE_GATE = COVERAGE_GATE_SITE;

/** Broad diagnostic meter; it does not fail the release gate by itself. */
export const COVERAGE_INVENTORY_ASPIRATION = gate(
  "planner-inventory",
  "Broad source inventory aspiration; the inventory profile remains diagnostic-only.",
);

export function fileStatusVsGate(pct, metric = "lines", profile = "site") {
  const profiles = {
    planner: COVERAGE_GATE_PLANNER,
    admin: COVERAGE_GATE_ADMIN,
    site: COVERAGE_GATE_SITE,
  };
  const gateForProfile = profiles[profile] ?? COVERAGE_GATE_SITE;
  const floor = gateForProfile[metric] ?? gateForProfile.lines;
  if (pct >= floor) return `PASS (>= ${floor}% ${profile} gate)`;
  if (pct > 0 && pct >= floor * 0.5) return `PARTIAL (< ${floor}% ${profile} gate)`;
  if (pct > 0) return `LOW (< ${Math.round(floor * 0.5)}%)`;
  return "FAIL (0%)";
}

export function isHighMassFile(stmtTotal, universeTotal, share = 0.01) {
  if (!universeTotal || universeTotal <= 0) return false;
  return stmtTotal / universeTotal >= share;
}

export function isLargeBucket(stmtTotal, universeTotal, share = 0.05) {
  if (!universeTotal || universeTotal <= 0) return false;
  return stmtTotal / universeTotal >= share;
}

export function coverageReadmeForAgents() {
  return [
    "Planner, Studio, Site, and Admin use the policy in tests/manifests/coverage-exceptions.json.",
    "Ship gate: 100% lines, 100% functions, 95% statements, and 95% branches.",
    "Every eligibility exclusion is owner-reviewed; metric exceptions must be explicit and expiring.",
    "The broad inventory profile is diagnostic-only.",
  ].join(" ");
}

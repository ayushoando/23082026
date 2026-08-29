import path from "node:path";

import {
  collectPlannerCoverage,
  type PlannerCoverageInventory,
} from "./coverageCollector";

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, "../..");

/**
 * Rebuilds the authored initial inventory from the current repository tree.
 * No historical route or source file list is stored here: the collector owns
 * discovery, import reachability, status evidence, and documentation conflicts.
 */
export function createInitialPlannerInventory(
  repositoryRoot: string = REPOSITORY_ROOT,
): PlannerCoverageInventory {
  return collectPlannerCoverage({ repositoryRoot });
}

/**
 * The Task 1.2 initial inventory. Its value is deterministic for a given tree
 * and intentionally has no timestamp or environment-specific absolute paths.
 */
export const initialPlannerInventory = createInitialPlannerInventory();

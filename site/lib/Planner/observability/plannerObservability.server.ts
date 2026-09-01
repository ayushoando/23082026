import "server-only";

import {
  observePlannerApiResponse,
  runObservedPlannerPersistence,
  type ObservePlannerApiResponseInput,
  type ObservePlannerPersistenceInput,
} from "./plannerObservabilityAdapters";
import { plannerObservabilityDependencies } from "./plannerObservabilityExporter.server";

/** W4 call-site adapter: returns the exact response object it receives. */
export function observePlannerApiResponseAtCallSite(
  input: ObservePlannerApiResponseInput,
): Response {
  return observePlannerApiResponse(input, plannerObservabilityDependencies);
}

/** W2 call-site adapter: preserves the exact persistence result or thrown value. */
export function runObservedPlannerPersistenceAtCallSite<T>(
  input: ObservePlannerPersistenceInput<T>,
): Promise<T> {
  return runObservedPlannerPersistence(input, plannerObservabilityDependencies);
}

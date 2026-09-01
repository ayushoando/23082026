// Portal-owned surface over the Planner project store. Portal pages import
// from here — never directly from @planner/* — so the shared-surface →
// product-namespace edge stays in one audited module.
export {
  isMissingOandoPlansTableError,
  isPlannerDatabaseConfigured,
  listPlannerDocumentsFromStore,
  loadPlannerDocumentFromStore,
} from "@planner/lib/projectsStore";
export type { PlannerSaveSummary } from "@planner/lib/projectsStore";

/**
 * Mode-aware wrapper for starter workspace creation.
 * The canonical template lives at site/lib/Planner/starterProjectTemplate.ts
 * (bundled TS data, 6 items). Persistence is exclusively via plannerApi.createProject
 * which hits /api/Planner/projects -> projectsStore -> mode-aware
 * plannerPersistenceMode (disk when DEV_AUTH_BYPASS=1, Supabase oando_plans otherwise).
 * Never use raw fs / disk helpers directly.
 *
 * Planner feature code is intentionally kept under the case-sensitive
 * `features/Planner/` tree and exposed through the `@planner/*` aliases. Do not
 * add a lowercase duplicate path.
 */
export { buildStarterProjectPayload } from "@planner/lib/starterProjectTemplate";

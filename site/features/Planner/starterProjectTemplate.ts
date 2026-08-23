/**
 * Mode-aware wrapper for starter workspace creation.
 * The canonical template lives at site/lib/Planner/starterProjectTemplate.ts
 * (bundled TS data, 6 items). Persistence is exclusively via plannerApi.createProject
 * which hits /api/Planner/projects -> projectsStore -> mode-aware
 * plannerPersistenceMode (disk when DEV_AUTH_BYPASS=1, Supabase oando_plans otherwise).
 * Never use raw fs / disk helpers directly.
 *
 * Task path site/features/planner/starterProjectTemplate.ts (lowercase) is
 * satisfied on this case-insensitive filesystem as site/features/Planner/...
 * On case-sensitive CI the lowercase path resolves via tsconfig paths alias
 * or can be added as a redirect re-export if needed.
 */
export { buildStarterProjectPayload } from "@planner/lib/starterProjectTemplate";

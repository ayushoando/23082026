import {
  WORKFLOW_STAGE_ORDER,
  type CoverageDimensions,
  type CoverageItem,
  type EvidenceRecord,
  type FindingRef,
  type RequirementRef,
  type ValidationRef,
  type WorkflowTrace,
  type WorkflowTraceStage,
} from "./auditModel";

export const TASK_1_3_REQUIREMENTS = [
  "1.3",
  "1.6",
  "5.1",
  "6.1",
  "7.1",
  "10.1",
  "10.2",
  "10.3",
  "10.4",
  "10.5",
  "19.3",
] as const satisfies readonly RequirementRef[];

export const TASK_1_3_VALIDATION_ID =
  "validation:task-1.3-workflow-matrix" as const satisfies ValidationRef;

export type PlannerWorkflowKey =
  | "entry-auth"
  | "project-list"
  | "project-create"
  | "project-load"
  | "project-edit"
  | "project-save"
  | "project-delete"
  | "catalog-browse"
  | "catalog-select"
  | "catalog-upload"
  | "handoff"
  | "sketch-to-plan"
  | "offline-reconnect"
  | "conflict-recovery"
  | "unsaved-destructive-navigation";

export type WorkflowReachability =
  | "wired"
  | "present-but-unverified"
  | "gap-detected";

type StageBlueprint = readonly [sourcePath: string, summary: string];

type CompleteStageBlueprints = readonly [
  StageBlueprint,
  StageBlueprint,
  StageBlueprint,
  StageBlueprint,
  StageBlueprint,
  StageBlueprint,
  StageBlueprint,
  StageBlueprint,
  StageBlueprint,
  StageBlueprint,
];

export interface PlannerWorkflowBlueprint {
  key: PlannerWorkflowKey;
  name: string;
  routePath: "/ooplanner" | "/ooplanner/projects" | "/ooplanner/projects/[id]";
  reachability: WorkflowReachability;
  reachabilityNote: string;
  coverage: CoverageDimensions;
  requirementRefs: RequirementRef[];
  stages: CompleteStageBlueprints;
}

const ALL_VIEWPORTS: CoverageDimensions["viewportClasses"] = [
  "desktop",
  "tablet",
  "phone",
];
const ALL_INPUTS: CoverageDimensions["inputMethods"] = [
  "pointer",
  "touch",
  "keyboard",
];
const BOTH_PERSISTENCE_MODES: CoverageDimensions["persistenceModes"] = [
  "disk",
  "supabase",
];

function coverage(
  stateIds: CoverageDimensions["stateIds"],
  securityControlIds: CoverageDimensions["securityControlIds"],
): CoverageDimensions {
  return {
    viewportClasses: [...ALL_VIEWPORTS],
    inputMethods: [...ALL_INPUTS],
    stateIds,
    securityControlIds,
    persistenceModes: [...BOTH_PERSISTENCE_MODES],
  };
}

function requirements(
  ...accessRefs: Array<"10.1" | "10.2" | "10.3" | "10.4" | "10.5">
): RequirementRef[] {
  return ["1.3", "1.6", "5.1", "6.1", "7.1", ...accessRefs, "19.3"];
}

export const PLANNER_WORKFLOW_BLUEPRINTS: readonly PlannerWorkflowBlueprint[] = [
  {
    key: "entry-auth",
    name: "Planner entry and authentication routing",
    routePath: "/ooplanner",
    reachability: "wired",
    reachabilityNote:
      "The bare route renders the Planner and member project calls map authentication failures to a sign-in recovery surface.",
    coverage: coverage(
      ["default", "loading", "success", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
      ["authentication", "owner-scope", "rate-limit", "safe-error"],
    ),
    requirementRefs: requirements("10.1", "10.3"),
    stages: [
      ["site/app/ooplanner/page.tsx", "The App Router enters the bare Planner route."],
      ["site/features/Planner/page.tsx", "The thin feature view renders the Planner workspace."],
      ["site/components/Planner/Planner.tsx", "The workspace resolves route or remembered project context."],
      ["site/components/Planner/plannerLoadState.ts", "The discriminated load state separates draft, loading, auth, access, missing, and transient outcomes."],
      ["site/lib/Planner/plannerApi.ts", "Project context uses the Planner browser client when a project id must load."],
      ["site/features/shared/api/withAuth.ts", "Member endpoints resolve the verified session and reject unauthenticated project operations."],
      ["site/lib/Planner/projectsStore.ts", "An authenticated operation enters the mode-aware project facade."],
      ["site/lib/Planner/projectsStore.supabase.ts", "Supabase mode uses the Admin oando_plans adapter; development bypass can select disk instead."],
      ["site/components/Planner/Planner.tsx", "API and network outcomes are converted to typed Planner load states."],
      ["site/components/Planner/PlannerProjectLoadState.tsx", "The user sees the workspace, sign-in action, access result, or deterministic recovery action."],
    ],
  },
  {
    key: "project-list",
    name: "List owned Planner projects",
    routePath: "/ooplanner/projects",
    reachability: "wired",
    reachabilityNote:
      "The projects route calls the authenticated collection endpoint and renders loading, empty, list, and retry states.",
    coverage: coverage(
      ["loading", "empty", "success", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
      ["authentication", "owner-scope", "request-validation", "rate-limit", "method-contract", "safe-error"],
    ),
    requirementRefs: requirements("10.3", "10.4"),
    stages: [
      ["site/app/ooplanner/projects/page.tsx", "The App Router enters the project collection route."],
      ["site/features/Planner/projects/page.tsx", "The feature view renders the Planner project list."],
      ["site/components/Planner/PlannerProjectsList.tsx", "The list mounts, requests projects, and exposes retry, create, open, and delete controls."],
      ["site/components/Planner/PlannerProjectsList.tsx", "Local loading, list, empty, error, and retry state controls the view."],
      ["site/lib/Planner/plannerApi.ts", "listProjects issues the browser GET request."],
      ["site/app/api/Planner/projects/route.ts", "The GET handler requires member auth and passes the verified owner id in Supabase mode."],
      ["site/lib/Planner/projectsStore.ts", "listProjectRecords selects exactly one persistence source."],
      ["site/lib/Planner/projectsStore.supabase.ts", "The Supabase adapter filters oando_plans by the verified owner id; disk mode uses the Planner disk store."],
      ["site/components/Planner/PlannerProjectsList.tsx", "The response or safe client error updates list state."],
      ["site/components/Planner/PlannerProjectsList.tsx", "The user sees owned project cards, an empty-state next action, or retry feedback."],
    ],
  },
  {
    key: "project-create",
    name: "Create a Planner project",
    routePath: "/ooplanner",
    reachability: "wired",
    reachabilityNote:
      "Saving a draft or selecting the sample action posts a project and navigates to its item route.",
    coverage: coverage(
      ["default", "loading", "success", "validation-error", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
      ["authentication", "owner-scope", "request-validation", "csrf-origin", "rate-limit", "method-contract", "safe-error"],
    ),
    requirementRefs: requirements("10.3"),
    stages: [
      ["site/app/ooplanner/page.tsx", "The user enters the Planner draft route."],
      ["site/features/Planner/page.tsx", "The feature view provides the editable Planner workspace."],
      ["site/components/Planner/Planner.tsx", "The Save command serializes a draft project; the list also offers a starter-project action."],
      ["site/lib/Planner/starterProjectTemplate.ts", "Draft or starter content is converted to a project payload."],
      ["site/lib/Planner/plannerApi.ts", "createProject posts the project payload with browser request controls."],
      ["site/app/api/Planner/projects/route.ts", "The POST handler enforces member auth, rate limit, CSRF, input parsing, and server-derived owner context."],
      ["site/lib/Planner/projectsStore.ts", "writeProjectRecord selects the configured project persistence facade."],
      ["site/lib/Planner/projectsStore.supabase.ts", "The selected Supabase adapter writes one owner-bound record; development bypass can use the guarded disk adapter."],
      ["site/components/Planner/Planner.tsx", "The created response updates id and name, remembers the project, and maps failures to an error toast."],
      ["site/components/Planner/Planner.tsx", "The user is routed to the new project and sees a saved confirmation or recoverable failure."],
    ],
  },
  {
    key: "project-load",
    name: "Load an owned Planner project",
    routePath: "/ooplanner/projects/[id]",
    reachability: "wired",
    reachabilityNote:
      "The dynamic project route loads the record, restores canvas and metadata, and renders distinct auth/access/missing/transient outcomes.",
    coverage: coverage(
      ["loading", "success", "unauthenticated", "forbidden", "rate-limited", "stale", "server-error", "recovery"],
      ["authentication", "owner-scope", "request-validation", "rate-limit", "method-contract", "safe-error"],
    ),
    requirementRefs: requirements("10.3", "10.5"),
    stages: [
      ["site/app/ooplanner/projects/[id]/page.tsx", "The dynamic route enters with the requested project id."],
      ["site/features/Planner/projects/[id]/page.tsx", "The feature view renders the shared Planner workspace for the item route."],
      ["site/components/Planner/Planner.tsx", "The workspace computes the effective id and begins a cancellable load."],
      ["site/components/Planner/plannerLoadState.ts", "A request-keyed state machine rejects stale responses and classifies load outcomes."],
      ["site/lib/Planner/plannerApi.ts", "getProject issues the item GET request with abort support."],
      ["site/app/api/Planner/projects/[id]/route.ts", "The GET handler enforces member auth and a non-disclosing owner check."],
      ["site/lib/Planner/projectsStore.ts", "loadProjectRecord selects the configured persistence source."],
      ["site/lib/Planner/projectsStore.supabase.ts", "The selected adapter loads the record; development bypass can load the guarded disk record."],
      ["site/components/Planner/Planner.tsx", "The project metadata, sheet, and canvas JSON are restored or the error maps to a typed load state."],
      ["site/components/Planner/PlannerProjectLoadState.tsx", "The user sees the restored workspace or a focused sign-in, access, not-found, or retry surface."],
    ],
  },
  {
    key: "project-edit",
    name: "Edit a Planner project in memory",
    routePath: "/ooplanner/projects/[id]",
    reachability: "wired",
    reachabilityNote:
      "Planner commands update Fabric and local stores in memory; persistence is intentionally deferred until Save.",
    coverage: coverage(
      ["default", "success", "validation-error", "server-error", "recovery"],
      ["authentication", "owner-scope", "request-validation", "safe-error"],
    ),
    requirementRefs: requirements("10.5"),
    stages: [
      ["site/app/ooplanner/projects/[id]/page.tsx", "The user enters an existing project route."],
      ["site/features/Planner/projects/[id]/page.tsx", "The Planner feature supplies the editable workspace."],
      ["site/components/Planner/Planner.tsx", "Toolbar, canvas, panel, pointer, touch, and keyboard interactions invoke edit operations."],
      ["site/lib/Planner/commands/registry.ts", "Semantic Planner commands and local Fabric/store helpers apply edits."],
      ["site/components/Planner/Planner.tsx", "No browser API request occurs for an in-memory edit before Save."],
      ["site/components/Planner/Planner.tsx", "No route handler is invoked for the local edit stage."],
      ["site/components/Planner/Planner.tsx", "The persistence facade is intentionally deferred while the edit remains in memory."],
      ["site/components/Planner/Planner.tsx", "Neither disk nor Supabase adapter is called until an explicit Save."],
      ["site/store/Planner/plannerUiStore.ts", "Local state and toast mapping expose edit feedback without replacing the document."],
      ["site/components/Planner/Planner.tsx", "The canvas and panels display the edited in-memory project."],
    ],
  },
  {
    key: "project-save",
    name: "Save a Planner project",
    routePath: "/ooplanner/projects/[id]",
    reachability: "present-but-unverified",
    reachabilityNote:
      "The save path is wired with expected-revision and idempotency metadata, typed conflict/offline/reauth recovery, and an Admin RPC-backed CAS contract; runtime behavior remains unverified.",
    coverage: coverage(
      ["default", "loading", "success", "validation-error", "unauthenticated", "forbidden", "rate-limited", "conflict", "stale", "offline", "server-error", "recovery"],
      ["authentication", "owner-scope", "request-validation", "csrf-origin", "rate-limit", "method-contract", "safe-error", "revision", "idempotency", "schema-version"],
    ),
    requirementRefs: requirements("10.3", "10.5"),
    stages: [
      ["site/app/ooplanner/projects/[id]/page.tsx", "The save begins from the active project route."],
      ["site/features/Planner/projects/[id]/page.tsx", "The feature view hosts the editable project."],
      ["site/components/Planner/Planner.tsx", "The Save command serializes canvas, sheet, layers, and thumbnail while retaining the in-memory document."],
      ["site/lib/Planner/plannerFabricSerialize.ts", "Planner serialization removes editor-only decorations from the persisted payload."],
      ["site/lib/Planner/plannerApi.ts", "updateProject sends the PATCH request through the browser API wrapper."],
      ["site/app/api/Planner/projects/[id]/route.ts", "The PATCH handler enforces member auth, owner scope, CSRF, quota, and input parsing."],
      ["site/lib/Planner/projectsStore.ts", "writeProjectRecord selects one project persistence source."],
      ["site/lib/Planner/projectsStore.supabase.ts", "The selected Supabase adapter uses the Admin RPC-backed revision/idempotency contract; development bypass can use the guarded disk adapter."],
      ["site/components/Planner/Planner.tsx", "A successful response updates local identity and route; typed conflict, offline, reauthentication, and server branches retain the current document and expose recovery actions."],
      ["site/components/Planner/Planner.tsx", "The user sees a saved confirmation or an explicit conflict, offline, reauthentication, or retry recovery action while the current canvas remains present."],
    ],
  },
  {
    key: "project-delete",
    name: "Delete an owned Planner project",
    routePath: "/ooplanner/projects",
    reachability: "wired",
    reachabilityNote:
      "The list requires confirmation, calls the authenticated item endpoint, then refreshes the deterministic list state.",
    coverage: coverage(
      ["default", "loading", "success", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
      ["authentication", "owner-scope", "request-validation", "csrf-origin", "rate-limit", "method-contract", "safe-error"],
    ),
    requirementRefs: requirements("10.3", "10.5"),
    stages: [
      ["site/app/ooplanner/projects/page.tsx", "Deletion starts from the project collection route."],
      ["site/features/Planner/projects/page.tsx", "The feature view renders project cards and actions."],
      ["site/components/Planner/PlannerProjectsList.tsx", "The delete control requests explicit confirmation for the selected project."],
      ["site/components/Planner/PlannerProjectsList.tsx", "The component retains list state while the delete request runs."],
      ["site/lib/Planner/plannerApi.ts", "deleteProject sends the item DELETE request."],
      ["site/app/api/Planner/projects/[id]/route.ts", "The DELETE handler enforces member auth, owner scope, CSRF, and quota."],
      ["site/lib/Planner/projectsStore.ts", "deleteProjectRecord selects the configured persistence source."],
      ["site/lib/Planner/projectsStore.supabase.ts", "The selected adapter deletes the record; development bypass can delete guarded disk files."],
      ["site/components/Planner/PlannerProjectsList.tsx", "Success triggers a list refresh and failure maps to an error toast."],
      ["site/components/Planner/PlannerProjectsList.tsx", "The user sees the refreshed list or a delete-failed recovery message."],
    ],
  },
  {
    key: "catalog-browse",
    name: "Browse the guest Planner catalog",
    routePath: "/ooplanner",
    reachability: "wired",
    reachabilityNote:
      "The catalog rail refreshes through a guest endpoint and locally filters public furniture by search and category.",
    coverage: coverage(
      ["default", "loading", "empty", "success", "rate-limited", "server-error", "recovery"],
      ["request-validation", "rate-limit", "method-contract", "safe-error", "redaction"],
    ),
    requirementRefs: requirements("10.1"),
    stages: [
      ["site/app/ooplanner/page.tsx", "The guest enters the Planner workspace route."],
      ["site/features/Planner/page.tsx", "The Planner feature renders the workspace and catalog surface."],
      ["site/components/Planner/PlannerCatalogRail.tsx", "The catalog rail triggers refresh and exposes search/category controls."],
      ["site/store/Planner/plannerCatalogStore.ts", "The catalog store tracks items, categories, loading, and error state."],
      ["site/lib/Planner/plannerApi.ts", "listFurniture requests the guest catalog endpoint."],
      ["site/app/api/Planner/catalog/route.ts", "The guest GET handler applies quota and optional search/category filtering."],
      ["site/server/Planner/plannerStore.ts", "listCatalog selects the mode-aware catalog facade."],
      ["site/lib/catalog/furnitureCatalogStore.supabase.ts", "Supabase mode reads the furniture catalog; development bypass can use shared disk furniture."],
      ["site/store/Planner/plannerCatalogStore.ts", "The response becomes sorted categories/items or a retained error state."],
      ["site/components/Planner/PlannerCatalogRail.tsx", "The user sees public catalog cards, filtered results, or an empty result."],
    ],
  },
  {
    key: "catalog-select",
    name: "Select and place guest catalog furniture",
    routePath: "/ooplanner",
    reachability: "wired",
    reachabilityNote:
      "Click, keyboard activation, and drag/drop share Planner-local placement logic; selection remains in memory until Save.",
    coverage: coverage(
      ["default", "success", "validation-error", "server-error", "recovery"],
      ["request-validation", "safe-error"],
    ),
    requirementRefs: requirements("10.1"),
    stages: [
      ["site/app/ooplanner/page.tsx", "The guest enters the Planner workspace."],
      ["site/features/Planner/page.tsx", "The feature renders catalog and canvas together."],
      ["site/components/Planner/PlannerCatalogRail.tsx", "Pointer, keyboard, or drag activation selects a catalog item."],
      ["site/components/Planner/Planner.tsx", "placeFurnitureItem and placeFurnitureAt apply the same in-memory placement result."],
      ["site/components/Planner/Planner.tsx", "No additional browser API call is required after the already-loaded catalog item is selected."],
      ["site/components/Planner/Planner.tsx", "No route handler is invoked for local placement."],
      ["site/components/Planner/Planner.tsx", "The project persistence facade is deferred until explicit Save."],
      ["site/components/Planner/Planner.tsx", "No persistence adapter runs for the unsaved placement."],
      ["site/store/Planner/plannerUiStore.ts", "Placement feedback maps to local canvas and toast state."],
      ["site/components/Planner/Planner.tsx", "The selected furniture appears on the active canvas without granting project-operation access."],
    ],
  },
  {
    key: "catalog-upload",
    name: "Upload custom Planner catalog furniture",
    routePath: "/ooplanner",
    reachability: "wired",
    reachabilityNote:
      "The catalog upload UI posts multipart data to the member-only Planner upload route and refreshes the catalog after success.",
    coverage: coverage(
      ["default", "loading", "success", "validation-error", "unauthenticated", "forbidden", "rate-limited", "server-error", "recovery"],
      ["authentication", "request-validation", "csrf-origin", "rate-limit", "method-contract", "safe-error"],
    ),
    requirementRefs: requirements("10.1", "10.3"),
    stages: [
      ["site/app/ooplanner/page.tsx", "The upload flow starts in the Planner workspace."],
      ["site/features/Planner/page.tsx", "The Planner feature exposes the catalog rail."],
      ["site/components/Planner/PlannerCatalogRail.tsx", "The upload dialog validates required name/file fields and builds multipart data."],
      ["site/components/Planner/PlannerCatalogRail.tsx", "Local upload form, open, success, and failure state is retained in the component."],
      ["site/lib/Planner/plannerApi.ts", "uploadFurniture sends multipart data through the browser client."],
      ["site/app/api/Planner/catalog/upload/route.ts", "The POST handler enforces member auth, CSRF, quota, multipart parsing, and size limits."],
      ["site/server/Planner/plannerStore.ts", "Catalog metadata and bytes use the mode-aware Planner catalog facade."],
      ["site/lib/catalog/furnitureCatalogStore.supabase.ts", "Supabase mode persists furniture assets/data; development bypass can use guarded shared disk storage."],
      ["site/components/Planner/PlannerCatalogRail.tsx", "Success resets the form and refreshes; errors preserve the dialog state and show a safe message."],
      ["site/components/Planner/PlannerCatalogRail.tsx", "The user sees the uploaded item after refresh or an upload-failed recovery message."],
    ],
  },
  {
    key: "handoff",
    name: "Submit a guest Planner lead handoff",
    routePath: "/ooplanner",
    reachability: "wired",
    reachabilityNote:
      "The guest quote dialog posts validated BOQ/contact data and displays a stable handoff reference without project-operation access.",
    coverage: coverage(
      ["default", "loading", "success", "validation-error", "rate-limited", "server-error", "recovery"],
      ["request-validation", "csrf-origin", "rate-limit", "method-contract", "safe-error", "idempotency", "redaction"],
    ),
    requirementRefs: requirements("10.2"),
    stages: [
      ["site/app/ooplanner/page.tsx", "The guest enters the Planner workspace."],
      ["site/features/Planner/page.tsx", "The feature renders the Planner review and BOQ surfaces."],
      ["site/components/Planner/PlannerHandoffDialog.tsx", "The quote dialog collects contact, notes, and BOQ context and preserves its draft on failure."],
      ["site/components/Planner/PlannerHandoffDialog.tsx", "Busy, error, and reference state controls the handoff result."],
      ["site/lib/api/browserApi.ts", "browserApiFetch attaches request credentials and mutation CSRF controls."],
      ["site/app/api/Planner/handoff/route.ts", "The guest POST handler validates schema, CSRF, quota, and safe response envelopes."],
      ["site/lib/Planner/handoff/createPlannerHandoff.ts", "The handoff service applies idempotency and selects its persistence port."],
      ["site/lib/Planner/handoff/createPlannerHandoff.ts", "The configured Admin Supabase handoff store inserts or replays the stable reference."],
      ["site/components/Planner/PlannerHandoffDialog.tsx", "The client maps structured success to a reference and failures to a retained retryable draft."],
      ["site/components/Planner/PlannerHandoffDialog.tsx", "The user sees a stable handoff reference or an error while entered values remain available."],
    ],
  },
  {
    key: "sketch-to-plan",
    name: "Convert a sketch to Planner geometry",
    routePath: "/ooplanner",
    reachability: "wired",
    reachabilityNote:
      "The AI panel sends a bounded guest request, presents preview/fallback/error states, and requires explicit acceptance before applying geometry.",
    coverage: coverage(
      ["default", "loading", "success", "validation-error", "forbidden", "rate-limited", "server-error", "recovery"],
      ["request-validation", "csrf-origin", "rate-limit", "method-contract", "safe-error", "redaction"],
    ),
    requirementRefs: requirements("10.1"),
    stages: [
      ["site/app/ooplanner/page.tsx", "The user enters the Planner workspace."],
      ["site/features/Planner/page.tsx", "The feature renders Planner AI support when enabled."],
      ["site/components/Planner/PlannerAiPanel.tsx", "The AI panel reads an image and starts sketch conversion."],
      ["site/lib/Planner/ai/sketchToPlanShared.ts", "Typed conversion state and schemas normalize preview, fallback, and error outcomes."],
      ["site/lib/api/browserApi.ts", "browserApiFetch posts the sketch request with mutation controls."],
      ["site/app/api/Planner/sketch-to-plan/route.ts", "The guest POST handler enforces feature flag, schema, CSRF, and strict quota."],
      ["site/server/Planner/sketchToPlan.server.ts", "The server facade resolves the provider chain and validates normalized geometry."],
      ["site/server/Planner/sketchToPlan.server.ts", "The selected AI provider produces bounded response text or a classified fallback/error."],
      ["site/components/Planner/PlannerAiPanel.tsx", "The client maps the response to converting, preview, fallback, or error state."],
      ["site/components/Planner/SketchToPlanDialog.tsx", "The user explicitly accepts/rejects preview geometry or dismisses a recovery result."],
    ],
  },
  {
    key: "offline-reconnect",
    name: "Preserve work offline and recover after reconnect",
    routePath: "/ooplanner/projects/[id]",
    reachability: "present-but-unverified",
    reachabilityNote:
      "Planner-owned online/offline listeners and explicit offline/recovery states preserve the current document and expose deterministic reconnect actions; runtime behavior remains unverified.",
    coverage: coverage(
      ["offline", "server-error", "stale", "conflict", "recovery"],
      ["authentication", "owner-scope", "safe-error", "revision"],
    ),
    requirementRefs: requirements("10.5"),
    stages: [
      ["site/app/ooplanner/projects/[id]/page.tsx", "The connected project route is the starting context before connectivity loss."],
      ["site/features/Planner/projects/[id]/page.tsx", "The feature continues rendering the Planner workspace."],
      ["site/components/Planner/Planner.tsx", "The current canvas remains in component/Fabric memory while a request fails."],
      ["site/components/Planner/plannerLoadState.ts", "The discriminated load state includes dedicated offline and connection-restored recovery states."],
      ["site/lib/Planner/plannerApi.ts", "Fetch maps network loss to a typed offline result; reconnect remains an explicit client retry rather than an automatic replacement."],
      ["site/app/api/Planner/projects/[id]/route.ts", "No route handler is reached while the browser is offline."],
      ["site/lib/Planner/projectsStore.ts", "No persistence facade call completes while the request cannot reach the server."],
      ["site/lib/Planner/projectsStore.supabase.ts", "No selected adapter is reached during browser disconnection."],
      ["site/components/Planner/Planner.tsx", "The load effect and save path preserve the current canvas, classify offline/recovery transitions, and require an explicit reconnect or retry action."],
      ["site/components/Planner/PlannerProjectLoadState.tsx", "The user sees an explicit offline or connection-restored indicator with a deterministic retry action; runtime rendering remains unverified."],
    ],
  },
  {
    key: "conflict-recovery",
    name: "Recover from a stale project conflict",
    routePath: "/ooplanner/projects/[id]",
    reachability: "present-but-unverified",
    reachabilityNote:
      "Project payloads, handlers, and the selected Admin RPC expose expected revision/idempotency and typed conflict recovery; runtime behavior remains unverified.",
    coverage: coverage(
      ["conflict", "stale", "server-error", "recovery"],
      ["authentication", "owner-scope", "request-validation", "csrf-origin", "safe-error", "revision", "idempotency"],
    ),
    requirementRefs: requirements("10.5"),
    stages: [
      ["site/app/ooplanner/projects/[id]/page.tsx", "The stale editor starts from an existing project route."],
      ["site/features/Planner/projects/[id]/page.tsx", "The feature renders the editable project."],
      ["site/components/Planner/Planner.tsx", "Save serializes the current in-memory project with an expected revision and bounded idempotency key."],
      ["site/lib/Planner/plannerFabricSerialize.ts", "The payload preserves canvas content while the Planner API adds expected-revision and idempotency metadata at mutation time."],
      ["site/lib/Planner/plannerApi.ts", "updateProject sends the PATCH request with expected revision and idempotency metadata through the browser API wrapper."],
      ["site/app/api/Planner/projects/[id]/route.ts", "The PATCH handler enforces member auth, owner scope, CSRF, quota, input parsing, expected revision, and idempotency before persistence."],
      ["site/lib/Planner/projectsStore.ts", "writeProjectRecord forwards one expected-revision/idempotent mutation through the selected persistence contract."],
      ["site/lib/Planner/projectsStore.supabase.ts", "The Supabase project adapter delegates revision/idempotency mutation to the Admin RPC; development bypass can use the guarded disk adapter."],
      ["site/components/Planner/Planner.tsx", "Conflict responses map to an explicit latest-versus-local decision rather than a generic save-error toast."],
      ["site/components/Planner/Planner.tsx", "The user retains the current canvas and can explicitly use the latest saved version or keep the local revision before retrying."],
    ],
  },
  {
    key: "unsaved-destructive-navigation",
    name: "Confirm destructive navigation with unsaved work",
    routePath: "/ooplanner",
    reachability: "present-but-unverified",
    reachabilityNote:
      "Starting a new plan asks for confirmation, and a dirty document installs a beforeunload guard; in-app route navigation remains runtime-unverified.",
    coverage: coverage(
      ["default", "success", "recovery"],
      ["request-validation", "safe-error"],
    ),
    requirementRefs: requirements("10.3"),
    stages: [
      ["site/app/ooplanner/page.tsx", "The active draft or project route contains the work at risk."],
      ["site/features/Planner/page.tsx", "The feature renders project-level navigation commands."],
      ["site/components/Planner/Planner.tsx", "The New Project action opens a native discard confirmation."],
      ["site/components/Planner/Planner.tsx", "Planner tracks hasUnsavedChanges and installs a beforeunload guard while the document is dirty."],
      ["site/components/Planner/Planner.tsx", "The confirmed local replacement does not call a browser API."],
      ["site/components/Planner/Planner.tsx", "No route handler participates in the discard decision."],
      ["site/components/Planner/Planner.tsx", "No persistence call occurs before confirmed local replacement."],
      ["site/components/Planner/Planner.tsx", "Neither adapter is called by the discard action."],
      ["site/components/Planner/Planner.tsx", "Cancel preserves the current canvas; confirm clears objects and remembered project identity."],
      ["site/components/Planner/Planner.tsx", "The user can cancel the local replacement or confirm it after the dirty-state decision; beforeunload protects browser exits while dirty."],
    ],
  },
];

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function workflowId(key: PlannerWorkflowKey): string {
  return `workflow:${key}`;
}

export function workflowFindingId(key: PlannerWorkflowKey): FindingRef {
  return `finding:trace:${key}`;
}

export function workflowEvidenceId(key: PlannerWorkflowKey): string {
  return `evidence:trace:${key}`;
}

function pageRouteId(
  coverageItems: readonly CoverageItem[],
  routePath: PlannerWorkflowBlueprint["routePath"],
): string {
  const route = coverageItems.find(
    (item) =>
      item.kind === "route" &&
      item.routeFileKind === "page" &&
      item.routePath === routePath,
  );
  if (!route) {
    throw new Error(`Planner workflow route is absent from inventory: ${routePath}`);
  }
  return route.id;
}

function buildStages(
  blueprint: PlannerWorkflowBlueprint,
  evidenceRef: string,
): WorkflowTraceStage[] {
  return blueprint.stages.map(([sourcePath, summary], index) => {
    const kind = WORKFLOW_STAGE_ORDER[index];
    if (!kind) {
      throw new Error(
        `Workflow stage index is outside the canonical order: ${blueprint.key}:${index}`,
      );
    }
    return {
      id: `${workflowId(blueprint.key)}:stage:${String(index + 1).padStart(2, "0")}`,
      kind,
      sourcePath,
      summary,
      evidenceRefs: [evidenceRef],
    };
  });
}

export function buildPlannerWorkflowTraces(
  coverageItems: readonly CoverageItem[],
): WorkflowTrace[] {
  return PLANNER_WORKFLOW_BLUEPRINTS.map((blueprint) => {
    const evidenceRef = workflowEvidenceId(blueprint.key);
    return {
      id: workflowId(blueprint.key),
      name: blueprint.name,
      routeIds: [pageRouteId(coverageItems, blueprint.routePath)],
      stages: buildStages(blueprint, evidenceRef),
      coverage: structuredClone(blueprint.coverage),
      requirementRefs: [...blueprint.requirementRefs],
      findingIds: [workflowFindingId(blueprint.key)],
      verificationRefs: [TASK_1_3_VALIDATION_ID],
      evidenceRefs: [evidenceRef],
    };
  });
}

export function buildPlannerWorkflowEvidence(): EvidenceRecord[] {
  return PLANNER_WORKFLOW_BLUEPRINTS.map((blueprint) => ({
    id: workflowEvidenceId(blueprint.key),
    class: "repository" as const,
    summary: `${blueprint.name}: ${blueprint.reachabilityNote}`,
    sourceRefs: Array.from(
      new Set(blueprint.stages.map(([sourcePath]) => sourcePath)),
    ).sort(compareText),
    limitation:
      blueprint.reachability === "wired"
        ? "Static repository tracing establishes source connectivity only; rendered, browser, integration, hosted, and persistence behavior remain unverified."
        : "Static repository tracing identifies a missing or incomplete behavior path; runtime proof and remediation belong to later authorized tasks.",
    artifact: {
      authorship: "authored" as const,
      path: "plans/planner-comprehensive-audit/firstEvidenceMatrix.ts" as const,
    },
  })).sort((left, right) => compareText(left.id, right.id));
}

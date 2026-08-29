/**
 * Typed required-state mappings for every covered Planner workflow.
 *
 * Each workflow declares which states from the Required State Set apply, and
 * every applicable state carries an accessible status, focus target,
 * memory-preservation rule, and deterministic next/recovery action.
 *
 * The module is pure data/types — no React, Fabric, or runtime dependency.
 *
 * @module plannerWorkflowState
 * @see Requirements 4.8, 5.1–5.8
 * @see Design: Required State Model, Property 8
 */

/* ------------------------------------------------------------------ */
/*  Required-state discriminant                                        */
/* ------------------------------------------------------------------ */

/**
 * All members of the Required State Set defined in the glossary.
 * Each workflow selects applicable members via its state mapping.
 */
export type PlannerRequiredStateKind =
  | "default"
  | "loading"
  | "empty"
  | "success"
  | "validation-error"
  | "server-error"
  | "unauthenticated"
  | "forbidden"
  | "rate-limited"
  | "conflict"
  | "stale"
  | "offline"
  | "recovery";

/* ------------------------------------------------------------------ */
/*  Accessible status and focus-target contracts                       */
/* ------------------------------------------------------------------ */

/** ARIA live-region politeness used when the state is announced. */
export type AriaLivePoliteness = "off" | "polite" | "assertive";

/** Where focus should move when transitioning into this state. */
export type FocusTarget =
  | { kind: "heading"; selector: string }
  | { kind: "primary-action"; selector: string }
  | { kind: "first-invalid-field" }
  | { kind: "none" };

/** Whether the component tree is busy (shows spinners/disables actions). */
export type BusyState = "idle" | "busy";

/** Accessible status metadata attached to each required state. */
export interface AccessibleStatus {
  /** The ARIA role for the container (e.g. "status", "alert", "none"). */
  readonly role: "status" | "alert" | "none";
  /** Whether the container is aria-busy. */
  readonly busy: BusyState;
  /** Live-region politeness for screen-reader announcements. */
  readonly live: AriaLivePoliteness;
  /** Label announced to assistive technology (concise, action-oriented). */
  readonly label: string;
}

/* ------------------------------------------------------------------ */
/*  Memory-preservation rules                                          */
/* ------------------------------------------------------------------ */

/**
 * Declares what happens to in-memory unsaved project state on transition.
 *
 * - `preserve`: Unsaved in-memory work survives; UI must not discard it.
 * - `clear`: The state transition discards unsaved work (success/post-delete).
 * - `prompt`: The user must decide before work can be discarded (Req 4.7).
 */
export type MemoryPreservation = "preserve" | "clear" | "prompt";

/* ------------------------------------------------------------------ */
/*  Deterministic next/recovery action                                 */
/* ------------------------------------------------------------------ */

/**
 * A user-facing action the UI must present for recovery or progression.
 */
export interface StateAction {
  /** Stable action identifier. */
  readonly id: string;
  /** Human-readable button label. */
  readonly label: string;
  /** Whether this is the primary (visually emphasized) action. */
  readonly primary: boolean;
}

/* ------------------------------------------------------------------ */
/*  Required-state descriptor                                          */
/* ------------------------------------------------------------------ */

/**
 * Complete typed descriptor for one member of the Required State Set,
 * bound to a specific Planner workflow. This is the core deliverable
 * of task 3.3.
 */
export interface PlannerRequiredState {
  /** Discriminant from the Required State Set. */
  readonly kind: PlannerRequiredStateKind;

  /** Human-readable heading shown in the UI. */
  readonly heading: string;

  /** Concise explanation text. */
  readonly message: string;

  /** WCAG 2.2 AA accessible status contract. */
  readonly accessible: AccessibleStatus;

  /** Where focus moves on entering this state. */
  readonly focusTarget: FocusTarget;

  /** Memory-preservation rule for in-memory project state (Req 4.6, 5.6). */
  readonly memoryRule: MemoryPreservation;

  /**
   * Ordered list of deterministic actions. The first `primary: true` action
   * is the default recovery/next step. Empty only for transient "success"
   * states that auto-dismiss.
   */
  readonly actions: readonly StateAction[];

  /**
   * Whether a successful retry in this state should clear it and return
   * to the preceding operational state (Req 4.8).
   */
  readonly clearOnRetrySuccess: boolean;
}

/* ------------------------------------------------------------------ */
/*  Covered Planner workflows                                          */
/* ------------------------------------------------------------------ */

/**
 * Every workflow the audit covers. State mappings are keyed by this type.
 */
export type PlannerWorkflowId =
  | "project-list"
  | "project-create"
  | "project-load"
  | "project-save"
  | "project-delete"
  | "project-edit"
  | "catalog-browse"
  | "catalog-upload"
  | "lead-handoff"
  | "sketch-to-plan"
  | "entry-routing";

/* ------------------------------------------------------------------ */
/*  Workflow → applicable-state mapping type                           */
/* ------------------------------------------------------------------ */

/**
 * A mapping from a workflow to its applicable required states.
 * Not every workflow uses every state — the map declares exactly which
 * members apply (Req 5.1).
 */
export type PlannerWorkflowStateMap = Readonly<
  Record<PlannerWorkflowId, ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState>>
>;

/* ------------------------------------------------------------------ */
/*  State factory helpers (DRY builders for common state shapes)       */
/* ------------------------------------------------------------------ */

function makeState(
  kind: PlannerRequiredStateKind,
  heading: string,
  message: string,
  accessible: AccessibleStatus,
  focusTarget: FocusTarget,
  memoryRule: MemoryPreservation,
  actions: readonly StateAction[],
  clearOnRetrySuccess: boolean,
): PlannerRequiredState {
  return Object.freeze({
    kind,
    heading,
    message,
    accessible,
    focusTarget,
    memoryRule,
    actions,
    clearOnRetrySuccess,
  });
}

/* -- Shared action constants ---------------------------------------- */

const ACTION_RETRY: StateAction = { id: "retry", label: "Try again", primary: true };
const ACTION_SIGN_IN: StateAction = { id: "sign-in", label: "Sign in", primary: true };
const ACTION_BACK_LIST: StateAction = { id: "back-to-projects", label: "Back to projects", primary: false };
const ACTION_GUEST_WORKSPACE: StateAction = { id: "guest-workspace", label: "Continue in guest workspace", primary: false };
const ACTION_CREATE_PROJECT: StateAction = { id: "create-project", label: "New project", primary: true };
const ACTION_RELOAD: StateAction = { id: "reload", label: "Reload", primary: true };
const ACTION_KEEP_LOCAL: StateAction = { id: "keep-local", label: "Keep my changes", primary: false };
const ACTION_USE_SERVER: StateAction = { id: "use-server", label: "Use server version", primary: false };
const ACTION_DISMISS: StateAction = { id: "dismiss", label: "Dismiss", primary: false };
const ACTION_WAIT_RETRY: StateAction = { id: "wait-retry", label: "Wait and retry", primary: true };
const ACTION_RECONNECT: StateAction = { id: "reconnect", label: "Reconnect", primary: true };
const ACTION_SAVE: StateAction = { id: "save", label: "Save", primary: true };
const ACTION_DISCARD: StateAction = { id: "discard", label: "Discard", primary: false };
const ACTION_CANCEL: StateAction = { id: "cancel", label: "Cancel", primary: false };

/* -- Shared accessible status presets -------------------------------- */

const ALERT_IDLE: AccessibleStatus = { role: "alert", busy: "idle", live: "assertive", label: "" };
const STATUS_BUSY: AccessibleStatus = { role: "status", busy: "busy", live: "polite", label: "" };
const STATUS_IDLE: AccessibleStatus = { role: "status", busy: "idle", live: "polite", label: "" };
const NONE_IDLE: AccessibleStatus = { role: "none", busy: "idle", live: "off", label: "" };

function alertIdle(label: string): AccessibleStatus {
  return { ...ALERT_IDLE, label };
}
function statusBusy(label: string): AccessibleStatus {
  return { ...STATUS_BUSY, label };
}
function statusIdle(label: string): AccessibleStatus {
  return { ...STATUS_IDLE, label };
}
function noneIdle(label: string): AccessibleStatus {
  return { ...NONE_IDLE, label };
}

const FOCUS_HEADING: FocusTarget = { kind: "heading", selector: "[data-planner-state-heading]" };
const FOCUS_PRIMARY: FocusTarget = { kind: "primary-action", selector: "[data-planner-primary-action]" };
const FOCUS_INVALID: FocusTarget = { kind: "first-invalid-field" };
const FOCUS_NONE: FocusTarget = { kind: "none" };

/* ================================================================== */
/*  Per-workflow state mappings                                        */
/* ================================================================== */

/* -- project-list -------------------------------------------------- */

function projectListStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Saved plans", "Viewing your saved floor plans.", noneIdle("Saved plans"), FOCUS_NONE, "preserve", [], false)],
    ["loading", makeState("loading", "Loading plans…", "Retrieving your saved floor plans.", statusBusy("Loading saved plans"), FOCUS_HEADING, "preserve", [], false)],
    ["empty", makeState("empty", "No saved plans", "You have not created any floor plans yet.", statusIdle("No saved plans"), FOCUS_PRIMARY, "preserve", [ACTION_CREATE_PROJECT], false)],
    ["success", makeState("success", "Plans loaded", "Your saved floor plans are ready.", statusIdle("Plans loaded"), FOCUS_NONE, "clear", [], false)],
    ["server-error", makeState("server-error", "Saved plans are temporarily unavailable", "We could not load your saved plans. Your existing plans have not been changed.", alertIdle("Saved plans temporarily unavailable"), FOCUS_HEADING, "preserve", [ACTION_RETRY, ACTION_GUEST_WORKSPACE], true)],
    ["unauthenticated", makeState("unauthenticated", "Sign in required", "Your session ended. Sign in again to view your saved plans.", alertIdle("Sign in required to view plans"), FOCUS_HEADING, "preserve", [ACTION_SIGN_IN, ACTION_GUEST_WORKSPACE], false)],
    ["forbidden", makeState("forbidden", "Saved plans unavailable", "Your account does not have permission to access saved plans.", alertIdle("Access denied to saved plans"), FOCUS_HEADING, "preserve", [ACTION_GUEST_WORKSPACE], false)],
    ["rate-limited", makeState("rate-limited", "Please wait before retrying", "Saved plans could not be loaded because too many requests were made.", alertIdle("Rate limited — please wait"), FOCUS_HEADING, "preserve", [ACTION_WAIT_RETRY], true)],
    ["offline", makeState("offline", "You are offline", "Saved plans cannot be loaded without a network connection.", alertIdle("Offline — cannot load plans"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "Your network connection has returned. Reload to view your latest plans.", statusIdle("Connection restored"), FOCUS_PRIMARY, "preserve", [ACTION_RELOAD], true)],
  ]);
}

/* -- project-create ------------------------------------------------ */

function projectCreateStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "New project", "Configure your new floor plan.", noneIdle("New project form"), FOCUS_NONE, "preserve", [], false)],
    ["loading", makeState("loading", "Creating project…", "Your new floor plan is being set up.", statusBusy("Creating project"), FOCUS_HEADING, "preserve", [], false)],
    ["success", makeState("success", "Project created", "Your new floor plan is ready for editing.", statusIdle("Project created"), FOCUS_NONE, "clear", [], false)],
    ["validation-error", makeState("validation-error", "Fix project details", "Some project fields need correction before creation.", alertIdle("Project creation validation failed"), FOCUS_INVALID, "preserve", [ACTION_RETRY], true)],
    ["server-error", makeState("server-error", "Could not create project", "An error prevented creating your floor plan. No data was lost.", alertIdle("Project creation failed"), FOCUS_HEADING, "preserve", [ACTION_RETRY, ACTION_BACK_LIST], true)],
    ["unauthenticated", makeState("unauthenticated", "Sign in required", "Sign in to create a new floor plan.", alertIdle("Sign in required to create project"), FOCUS_HEADING, "preserve", [ACTION_SIGN_IN, ACTION_GUEST_WORKSPACE], false)],
    ["forbidden", makeState("forbidden", "Cannot create project", "Your account does not have permission to create floor plans.", alertIdle("Not authorized to create projects"), FOCUS_HEADING, "preserve", [ACTION_GUEST_WORKSPACE], false)],
    ["rate-limited", makeState("rate-limited", "Too many requests", "Please wait before trying to create another project.", alertIdle("Rate limited — wait before creating"), FOCUS_HEADING, "preserve", [ACTION_WAIT_RETRY], true)],
    ["offline", makeState("offline", "You are offline", "Projects cannot be created without a network connection. Your entered details are preserved.", alertIdle("Offline — cannot create project"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. You can now create your project.", statusIdle("Connection restored"), FOCUS_PRIMARY, "preserve", [ACTION_RETRY], true)],
  ]);
}

/* -- project-load -------------------------------------------------- */

function projectLoadStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Select a plan", "Choose a floor plan to open.", noneIdle("Project selection"), FOCUS_NONE, "preserve", [], false)],
    ["loading", makeState("loading", "Loading plan…", "Retrieving your floor plan data.", statusBusy("Loading plan"), FOCUS_HEADING, "preserve", [], false)],
    ["success", makeState("success", "Plan loaded", "Your floor plan is ready for editing.", statusIdle("Plan loaded successfully"), FOCUS_NONE, "clear", [], false)],
    ["server-error", makeState("server-error", "Temporarily unavailable", "The plan could not be loaded right now. Please try again.", alertIdle("Plan temporarily unavailable"), FOCUS_HEADING, "preserve", [ACTION_RETRY, ACTION_BACK_LIST], true)],
    ["unauthenticated", makeState("unauthenticated", "Sign in required", "Sign in to continue working on this plan.", alertIdle("Sign in required to load plan"), FOCUS_HEADING, "preserve", [ACTION_SIGN_IN, ACTION_GUEST_WORKSPACE], false)],
    ["forbidden", makeState("forbidden", "Access denied", "You do not have access to this plan.", alertIdle("Access denied to this plan"), FOCUS_HEADING, "preserve", [ACTION_BACK_LIST], false)],
    ["rate-limited", makeState("rate-limited", "Please wait", "Too many requests. Please wait before loading this plan again.", alertIdle("Rate limited — wait before loading"), FOCUS_HEADING, "preserve", [ACTION_WAIT_RETRY], true)],
    ["conflict", makeState("conflict", "Plan has changed", "This plan was updated elsewhere. Choose which version to keep.", alertIdle("Plan version conflict"), FOCUS_HEADING, "preserve", [ACTION_USE_SERVER, ACTION_KEEP_LOCAL], false)],
    ["stale", makeState("stale", "Outdated plan data", "The loaded plan may not reflect the latest saved version.", alertIdle("Plan data may be outdated"), FOCUS_PRIMARY, "preserve", [ACTION_RELOAD, ACTION_DISMISS], true)],
    ["offline", makeState("offline", "You are offline", "The plan cannot be loaded without a network connection.", alertIdle("Offline — cannot load plan"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. Reload to get the latest version of your plan.", statusIdle("Connection restored"), FOCUS_PRIMARY, "preserve", [ACTION_RELOAD], true)],
  ]);
}

/* -- project-save -------------------------------------------------- */

function projectSaveStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Unsaved changes", "Your plan has unsaved changes.", noneIdle("Unsaved changes"), FOCUS_NONE, "preserve", [ACTION_SAVE], false)],
    ["loading", makeState("loading", "Saving plan…", "Your floor plan is being saved.", statusBusy("Saving plan"), FOCUS_HEADING, "preserve", [], false)],
    ["success", makeState("success", "Plan saved", "All changes have been saved successfully.", statusIdle("Plan saved"), FOCUS_NONE, "clear", [], false)],
    ["validation-error", makeState("validation-error", "Cannot save plan", "Some plan data needs correction before saving.", alertIdle("Save validation failed"), FOCUS_INVALID, "preserve", [ACTION_RETRY], true)],
    ["server-error", makeState("server-error", "Save failed", "Your plan could not be saved right now. Your work is still in memory.", alertIdle("Plan save failed — work preserved"), FOCUS_HEADING, "preserve", [ACTION_RETRY], true)],
    ["unauthenticated", makeState("unauthenticated", "Sign in to save", "Your session ended. Sign in again to save your changes. Your work is preserved in memory.", alertIdle("Sign in required to save — work preserved"), FOCUS_HEADING, "preserve", [ACTION_SIGN_IN], false)],
    ["forbidden", makeState("forbidden", "Cannot save", "You do not have permission to save this plan.", alertIdle("Not authorized to save this plan"), FOCUS_HEADING, "preserve", [ACTION_BACK_LIST], false)],
    ["rate-limited", makeState("rate-limited", "Too many save requests", "Please wait before saving again. Your work is preserved in memory.", alertIdle("Rate limited — wait before saving"), FOCUS_HEADING, "preserve", [ACTION_WAIT_RETRY], true)],
    ["conflict", makeState("conflict", "Save conflict", "This plan was saved by another session. Choose how to resolve the conflict.", alertIdle("Save conflict — choose version"), FOCUS_HEADING, "preserve", [ACTION_USE_SERVER, ACTION_KEEP_LOCAL], false)],
    ["stale", makeState("stale", "Working on outdated data", "Your plan may be based on an older version. Reload before saving to avoid overwriting newer changes.", alertIdle("Plan data is stale — reload recommended"), FOCUS_PRIMARY, "preserve", [ACTION_RELOAD, { id: "force-save", label: "Save anyway", primary: false }], true)],
    ["offline", makeState("offline", "You are offline", "Your plan cannot be saved without a network connection. Your work is preserved in memory.", alertIdle("Offline — cannot save — work preserved"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. Save your plan now to preserve your changes.", statusIdle("Connection restored — ready to save"), FOCUS_PRIMARY, "preserve", [ACTION_SAVE], true)],
  ]);
}

/* -- project-delete ------------------------------------------------ */

function projectDeleteStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Delete plan", "Confirm that you want to permanently delete this plan.", noneIdle("Delete plan confirmation"), FOCUS_PRIMARY, "prompt", [{ id: "confirm-delete", label: "Delete", primary: true }, ACTION_CANCEL], false)],
    ["loading", makeState("loading", "Deleting plan…", "Removing the selected floor plan.", statusBusy("Deleting plan"), FOCUS_HEADING, "preserve", [], false)],
    ["success", makeState("success", "Plan deleted", "The plan has been permanently removed.", statusIdle("Plan deleted"), FOCUS_NONE, "clear", [ACTION_BACK_LIST], false)],
    ["server-error", makeState("server-error", "Could not delete plan", "The plan could not be deleted right now. It has not been changed.", alertIdle("Plan deletion failed"), FOCUS_HEADING, "preserve", [ACTION_RETRY, ACTION_CANCEL], true)],
    ["unauthenticated", makeState("unauthenticated", "Sign in required", "Your session ended. Sign in again to delete this plan.", alertIdle("Sign in required to delete plan"), FOCUS_HEADING, "preserve", [ACTION_SIGN_IN, ACTION_CANCEL], false)],
    ["forbidden", makeState("forbidden", "Cannot delete plan", "You do not have permission to delete this plan.", alertIdle("Not authorized to delete this plan"), FOCUS_HEADING, "preserve", [ACTION_BACK_LIST], false)],
    ["rate-limited", makeState("rate-limited", "Too many requests", "Please wait before trying to delete again.", alertIdle("Rate limited — wait before deleting"), FOCUS_HEADING, "preserve", [ACTION_WAIT_RETRY], true)],
    ["conflict", makeState("conflict", "Plan has changed", "This plan was updated elsewhere since you last loaded it. Reload before deleting.", alertIdle("Plan changed — reload before deleting"), FOCUS_HEADING, "preserve", [ACTION_RELOAD, ACTION_CANCEL], false)],
    ["offline", makeState("offline", "You are offline", "Plans cannot be deleted without a network connection.", alertIdle("Offline — cannot delete plan"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. You can now proceed with deletion.", statusIdle("Connection restored — ready to delete"), FOCUS_PRIMARY, "preserve", [{ id: "confirm-delete", label: "Delete", primary: true }, ACTION_CANCEL], true)],
  ]);
}

/* -- project-edit -------------------------------------------------- */

function projectEditStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Editing plan", "Make changes to your floor plan.", noneIdle("Editing floor plan"), FOCUS_NONE, "preserve", [], false)],
    ["loading", makeState("loading", "Applying change…", "Your edit is being applied.", statusBusy("Applying edit"), FOCUS_NONE, "preserve", [], false)],
    ["success", makeState("success", "Change applied", "Your edit was applied successfully.", statusIdle("Edit applied"), FOCUS_NONE, "preserve", [], false)],
    ["validation-error", makeState("validation-error", "Invalid edit", "The edit could not be applied. Check the values and try again.", alertIdle("Edit validation failed"), FOCUS_INVALID, "preserve", [ACTION_RETRY, ACTION_DISMISS], true)],
    ["server-error", makeState("server-error", "Edit failed", "The edit could not be completed. Your previous state is preserved.", alertIdle("Edit failed — previous state preserved"), FOCUS_HEADING, "preserve", [ACTION_RETRY, ACTION_DISMISS], true)],
    ["offline", makeState("offline", "You are offline", "Some edits may not sync until your connection returns. Local changes are preserved.", alertIdle("Offline — local edits preserved"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. Unsaved edits can now be saved.", statusIdle("Connection restored — save available"), FOCUS_NONE, "preserve", [ACTION_SAVE], true)],
    ["stale", makeState("stale", "Working on outdated data", "The plan may have changed elsewhere. Consider reloading before continuing.", alertIdle("Plan data may be stale"), FOCUS_PRIMARY, "preserve", [ACTION_RELOAD, ACTION_DISMISS], true)],
  ]);
}

/* -- catalog-browse ------------------------------------------------ */

function catalogBrowseStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Furniture catalog", "Browse furniture to place on your plan.", noneIdle("Furniture catalog"), FOCUS_NONE, "preserve", [], false)],
    ["loading", makeState("loading", "Loading catalog…", "Retrieving available furniture items.", statusBusy("Loading furniture catalog"), FOCUS_HEADING, "preserve", [], false)],
    ["empty", makeState("empty", "No furniture found", "No items match your current filter. Try a different category or search term.", statusIdle("No catalog items found"), FOCUS_PRIMARY, "preserve", [{ id: "clear-filter", label: "Clear filters", primary: true }], false)],
    ["success", makeState("success", "Catalog loaded", "Furniture items are ready to browse.", statusIdle("Catalog loaded"), FOCUS_NONE, "preserve", [], false)],
    ["server-error", makeState("server-error", "Catalog unavailable", "The furniture catalog could not be loaded right now.", alertIdle("Catalog temporarily unavailable"), FOCUS_HEADING, "preserve", [ACTION_RETRY], true)],
    ["rate-limited", makeState("rate-limited", "Too many requests", "Please wait before browsing the catalog again.", alertIdle("Rate limited — wait before browsing"), FOCUS_HEADING, "preserve", [ACTION_WAIT_RETRY], true)],
    ["offline", makeState("offline", "You are offline", "The catalog cannot be loaded without a network connection.", alertIdle("Offline — cannot load catalog"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. Reload to view the latest catalog.", statusIdle("Connection restored"), FOCUS_PRIMARY, "preserve", [ACTION_RELOAD], true)],
  ]);
}

/* -- catalog-upload ------------------------------------------------ */

function catalogUploadStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Upload furniture", "Add a custom furniture item to the catalog.", noneIdle("Upload furniture form"), FOCUS_NONE, "preserve", [], false)],
    ["loading", makeState("loading", "Uploading…", "Your custom furniture item is being uploaded.", statusBusy("Uploading furniture"), FOCUS_HEADING, "preserve", [], false)],
    ["success", makeState("success", "Upload complete", "Your custom furniture item has been added to the catalog.", statusIdle("Furniture uploaded"), FOCUS_NONE, "clear", [], false)],
    ["validation-error", makeState("validation-error", "Fix upload details", "Some fields need correction before uploading.", alertIdle("Upload validation failed"), FOCUS_INVALID, "preserve", [ACTION_RETRY], true)],
    ["server-error", makeState("server-error", "Upload failed", "The furniture item could not be uploaded right now.", alertIdle("Furniture upload failed"), FOCUS_HEADING, "preserve", [ACTION_RETRY], true)],
    ["unauthenticated", makeState("unauthenticated", "Sign in required", "Sign in to upload custom furniture.", alertIdle("Sign in required to upload"), FOCUS_HEADING, "preserve", [ACTION_SIGN_IN], false)],
    ["forbidden", makeState("forbidden", "Upload not allowed", "Your account cannot upload custom furniture.", alertIdle("Not authorized to upload"), FOCUS_HEADING, "preserve", [ACTION_DISMISS], false)],
    ["rate-limited", makeState("rate-limited", "Too many uploads", "Please wait before uploading another item.", alertIdle("Rate limited — wait before uploading"), FOCUS_HEADING, "preserve", [ACTION_WAIT_RETRY], true)],
    ["offline", makeState("offline", "You are offline", "Furniture cannot be uploaded without a network connection.", alertIdle("Offline — cannot upload"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. You can now upload your furniture item.", statusIdle("Connection restored — upload available"), FOCUS_PRIMARY, "preserve", [ACTION_RETRY], true)],
  ]);
}

/* -- lead-handoff -------------------------------------------------- */

function leadHandoffStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Request a quote", "Fill in your details to submit a quote request.", noneIdle("Quote request form"), FOCUS_NONE, "preserve", [], false)],
    ["loading", makeState("loading", "Submitting…", "Your quote request is being submitted.", statusBusy("Submitting quote request"), FOCUS_HEADING, "preserve", [], false)],
    ["success", makeState("success", "Quote request sent", "Your request has been submitted. You will receive a reference number.", statusIdle("Quote request submitted"), FOCUS_HEADING, "clear", [], false)],
    ["validation-error", makeState("validation-error", "Fix your details", "Some fields need correction. Valid entries have been preserved.", alertIdle("Quote form validation failed"), FOCUS_INVALID, "preserve", [ACTION_RETRY], true)],
    ["server-error", makeState("server-error", "Could not submit request", "Your quote request could not be submitted right now. Your draft is preserved.", alertIdle("Quote submission failed — draft preserved"), FOCUS_HEADING, "preserve", [ACTION_RETRY], true)],
    ["rate-limited", makeState("rate-limited", "Too many requests", "Please wait before submitting another quote request.", alertIdle("Rate limited — wait before submitting"), FOCUS_HEADING, "preserve", [ACTION_WAIT_RETRY], true)],
    ["offline", makeState("offline", "You are offline", "The quote request cannot be submitted without a network connection. Your draft is preserved.", alertIdle("Offline — cannot submit — draft preserved"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. Submit your quote request now.", statusIdle("Connection restored — ready to submit"), FOCUS_PRIMARY, "preserve", [ACTION_RETRY], true)],
  ]);
}

/* -- sketch-to-plan ------------------------------------------------ */

function sketchToPlanStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Convert sketch", "Upload a sketch image to convert it into a floor plan.", noneIdle("Sketch to plan conversion"), FOCUS_NONE, "preserve", [], false)],
    ["loading", makeState("loading", "Converting…", "Your sketch is being analyzed and converted.", statusBusy("Converting sketch"), FOCUS_HEADING, "preserve", [], false)],
    ["success", makeState("success", "Conversion complete", "Your sketch has been converted. Review the generated objects before applying.", statusIdle("Sketch converted"), FOCUS_NONE, "preserve", [], false)],
    ["validation-error", makeState("validation-error", "Invalid sketch input", "The sketch data is not valid. Check the image and prompt.", alertIdle("Sketch conversion validation failed"), FOCUS_INVALID, "preserve", [ACTION_RETRY], true)],
    ["server-error", makeState("server-error", "Conversion failed", "The sketch could not be converted right now. Your original image is preserved.", alertIdle("Sketch conversion failed"), FOCUS_HEADING, "preserve", [ACTION_RETRY], true)],
    ["rate-limited", makeState("rate-limited", "Conversion limit reached", "Please wait before converting another sketch.", alertIdle("Rate limited — wait before converting"), FOCUS_HEADING, "preserve", [ACTION_WAIT_RETRY], true)],
    ["offline", makeState("offline", "You are offline", "Sketch conversion requires a network connection.", alertIdle("Offline — cannot convert sketch"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. You can now convert your sketch.", statusIdle("Connection restored — conversion available"), FOCUS_PRIMARY, "preserve", [ACTION_RETRY], true)],
  ]);
}

/* -- entry-routing ------------------------------------------------- */

function entryRoutingStates(): ReadonlyMap<PlannerRequiredStateKind, PlannerRequiredState> {
  return new Map<PlannerRequiredStateKind, PlannerRequiredState>([
    ["default", makeState("default", "Floor Planner", "Welcome to the floor planner.", noneIdle("Floor planner entry"), FOCUS_NONE, "preserve", [], false)],
    ["loading", makeState("loading", "Starting planner…", "Checking your session and preparing the workspace.", statusBusy("Starting planner"), FOCUS_HEADING, "preserve", [], false)],
    ["success", makeState("success", "Planner ready", "The floor planner workspace is ready.", statusIdle("Planner ready"), FOCUS_NONE, "clear", [], false)],
    ["unauthenticated", makeState("unauthenticated", "Guest workspace", "You are browsing as a guest. Sign in to access your saved plans.", statusIdle("Guest workspace — sign in for saved plans"), FOCUS_NONE, "preserve", [ACTION_SIGN_IN], false)],
    ["server-error", makeState("server-error", "Could not start planner", "The planner workspace could not be initialized.", alertIdle("Planner initialization failed"), FOCUS_HEADING, "preserve", [ACTION_RETRY], true)],
    ["offline", makeState("offline", "You are offline", "The planner requires a network connection to start.", alertIdle("Offline — cannot start planner"), FOCUS_HEADING, "preserve", [ACTION_RECONNECT], true)],
    ["recovery", makeState("recovery", "Connection restored", "You are back online. Retry to start the planner.", statusIdle("Connection restored"), FOCUS_PRIMARY, "preserve", [ACTION_RETRY], true)],
  ]);
}

/* ================================================================== */
/*  Assembled workflow → state map                                     */
/* ================================================================== */

export const PLANNER_WORKFLOW_STATE_MAP: PlannerWorkflowStateMap = {
  "project-list": projectListStates(),
  "project-create": projectCreateStates(),
  "project-load": projectLoadStates(),
  "project-save": projectSaveStates(),
  "project-delete": projectDeleteStates(),
  "project-edit": projectEditStates(),
  "catalog-browse": catalogBrowseStates(),
  "catalog-upload": catalogUploadStates(),
  "lead-handoff": leadHandoffStates(),
  "sketch-to-plan": sketchToPlanStates(),
  "entry-routing": entryRoutingStates(),
};

/* ================================================================== */
/*  Lookup and transition helpers                                      */
/* ================================================================== */

/**
 * Get the required state descriptor for a workflow and state kind.
 * Returns `undefined` if that state is not applicable to the workflow.
 */
export function getPlannerRequiredState(
  workflowId: PlannerWorkflowId,
  kind: PlannerRequiredStateKind,
): PlannerRequiredState | undefined {
  return PLANNER_WORKFLOW_STATE_MAP[workflowId].get(kind);
}

/**
 * Get all applicable state kinds for a workflow.
 */
export function getApplicableStateKinds(
  workflowId: PlannerWorkflowId,
): readonly PlannerRequiredStateKind[] {
  return [...PLANNER_WORKFLOW_STATE_MAP[workflowId].keys()];
}

/**
 * All members of the full Required State Set (the glossary-defined universe).
 */
export const ALL_REQUIRED_STATE_KINDS: readonly PlannerRequiredStateKind[] = [
  "default",
  "loading",
  "empty",
  "success",
  "validation-error",
  "server-error",
  "unauthenticated",
  "forbidden",
  "rate-limited",
  "conflict",
  "stale",
  "offline",
  "recovery",
] as const;

/**
 * All covered workflow identifiers.
 */
export const ALL_WORKFLOW_IDS: readonly PlannerWorkflowId[] = [
  "project-list",
  "project-create",
  "project-load",
  "project-save",
  "project-delete",
  "project-edit",
  "catalog-browse",
  "catalog-upload",
  "lead-handoff",
  "sketch-to-plan",
  "entry-routing",
] as const;

/* ------------------------------------------------------------------ */
/*  Obsolete-error clearing after successful retry (Req 4.8)           */
/* ------------------------------------------------------------------ */

/**
 * Pure transition: given a current error state and a successful retry
 * result, returns the cleared state descriptor (success or default)
 * if the current state's `clearOnRetrySuccess` flag is true.
 *
 * Returns `null` when the current state is not clearable or the retry
 * did not produce a clearable transition.
 */
export function clearObsoleteErrorOnRetry(
  workflowId: PlannerWorkflowId,
  currentKind: PlannerRequiredStateKind,
): PlannerRequiredState | null {
  const current = getPlannerRequiredState(workflowId, currentKind);
  if (!current || !current.clearOnRetrySuccess) return null;

  // After successful retry, transition to success if available, else default.
  const successState = getPlannerRequiredState(workflowId, "success");
  if (successState) return successState;

  const defaultState = getPlannerRequiredState(workflowId, "default");
  return defaultState ?? null;
}

/**
 * Type guard: returns true when a state kind represents an error that
 * should be cleared after a successful retry.
 */
export function isClearableErrorState(
  workflowId: PlannerWorkflowId,
  kind: PlannerRequiredStateKind,
): boolean {
  const state = getPlannerRequiredState(workflowId, kind);
  return state?.clearOnRetrySuccess === true;
}

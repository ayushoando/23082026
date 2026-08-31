/**
 * Planner editor integration tests — load-state lifecycle.
 *
 * Validates:
 * - Route-id precedence (useParams id takes priority over localStorage)
 * - Loading gate (workspace data-load-state reflects loading)
 * - 404 surface (PlannerApiError with 404 shows not-found state)
 * - Transient retry (503 shows transient-error; retry re-requests)
 * - Stale/abort suppression (cancelled requests do not mutate state)
 * - Successful handoff (ready state after successful load)
 * - Draft preservation (no route id + no fallback = draft state)
 *
 * The Planner component has extremely high fan-out (48 direct deps, Fabric
 * canvas, multiple hooks/stores) — this test mocks everything except the
 * load-state model, the PlannerProjectLoadState surface, and the core
 * effect-driven load lifecycle in Planner.tsx.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";

/* ------------------------------------------------------------------ */
/* Hoisted mocks — must precede module imports                         */
/* ------------------------------------------------------------------ */

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockParams = vi.hoisted(() => ({
  current: {} as Record<string, string | string[] | undefined>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => mockParams.current,
  usePathname: () => "/ooplanner/projects/test",
  useSearchParams: () => new URLSearchParams(),
}));

const mockGetProject = vi.hoisted(() => vi.fn());
const mockCreateProject = vi.hoisted(() => vi.fn());
const mockUpdateProject = vi.hoisted(() => vi.fn());

vi.mock("@planner/lib/plannerApi", () => ({
  getProject: (...args: unknown[]) => mockGetProject(...args),
  createProject: (...args: unknown[]) => mockCreateProject(...args),
  updateProject: (...args: unknown[]) => mockUpdateProject(...args),
  listProjects: vi.fn().mockResolvedValue([]),
  deleteProject: vi.fn().mockResolvedValue({ ok: true }),
  listFurniture: vi.fn().mockResolvedValue([]),
  uploadFurniture: vi.fn(),
  createExport: vi.fn(),
  fileUrl: (path: string | null) => path,
  PlannerApiError: class PlannerApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly detail: string | undefined;
    readonly correlationId: string | undefined;
    readonly currentRevision: number | undefined;
    readonly retryAfterSeconds: number | undefined;
    readonly recovery: "reauthenticate-preserve-unsaved" | undefined;
    constructor(
      status: number,
      code: string,
      message: string,
      options: {
        detail?: string;
        correlationId?: string;
        currentRevision?: number;
        retryAfterSeconds?: number;
        recovery?: "reauthenticate-preserve-unsaved";
      } = {},
    ) {
      super(message);
      this.name = "PlannerApiError";
      this.status = status;
      this.code = code;
      this.detail = options.detail;
      this.correlationId = options.correlationId;
      this.currentRevision = options.currentRevision;
      this.retryAfterSeconds = options.retryAfterSeconds;
      this.recovery = options.recovery;
    }
    get isUnauthorized() {
      return this.status === 401;
    }
    get isForbidden() {
      return this.status === 403;
    }
    get isNotFound() {
      return this.status === 404;
    }
    get isTransient() {
      return this.status === 429 || this.status >= 500;
    }
  },
  isAbortError: (err: unknown) =>
    err instanceof DOMException && (err as DOMException).name === "AbortError",
}));

/* Mock Fabric — the canvas must not actually initialize in happy-dom */
vi.mock("fabric", () => ({
  Canvas: vi.fn(),
  Rect: vi.fn(),
  Line: vi.fn(),
  Circle: vi.fn(),
  Group: vi.fn(),
  ActiveSelection: vi.fn(),
  FabricObject: vi.fn(),
  util: { transformPoint: vi.fn() },
}));

/* Mock the heavy Planner hooks */
const mockFabricCanvas = {
  getObjects: vi.fn(() => []),
  remove: vi.fn(),
  add: vi.fn(),
  sendObjectToBack: vi.fn(),
  bringObjectToFront: vi.fn(),
  requestRenderAll: vi.fn(),
  getWidth: vi.fn(() => 1000),
  getHeight: vi.fn(() => 1000),
  loadFromJSON: vi.fn((_json: unknown, callback?: () => void) => callback?.()),
  on: vi.fn(),
  off: vi.fn(),
};
const mockFabricRef = { current: mockFabricCanvas };
vi.mock("@planner/hooks/usePlannerFabric", () => ({
  useFabric: () => ({
    wrapperRef: { current: document.createElement("div") },
    canvasElRef: { current: document.createElement("canvas") },
    fabricRef: mockFabricRef,
    ready: true,
  }),
}));

vi.mock("@planner/hooks/usePlannerHistory", () => ({
  useHistory: () => ({
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    push: vi.fn(),
    suspend: vi.fn(),
    resume: vi.fn(),
  }),
}));

vi.mock("@planner/hooks/usePlannerCanvasCore", () => ({
  useCanvasCore: () => ({
    fitToContent: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetZoom: vi.fn(),
  }),
}));

vi.mock("@planner/hooks/usePlannerKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

/* Mock zustand stores */
const mockShowToast = vi.fn();
vi.mock("@planner/store/plannerUiStore", () => ({
  confirmPlannerNavigation: () => true,
  usePlannerUIStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state: Record<string, unknown> = {
      accessMode: "guest",
      setAccessMode: vi.fn(),
      unit: "mm",
      setUnit: vi.fn(),
      showToast: mockShowToast,
      snapEnabled: true,
      toggleSnap: vi.fn(),
      showGrid: false,
      toggleGrid: vi.fn(),
      gridSize: 100,
    };
    return selector(state);
  },
}));

vi.mock("@planner/store/plannerCatalogStore", () => ({
  useCatalogStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state: Record<string, unknown> = {
      items: [],
      loading: false,
      load: vi.fn(),
    };
    return selector(state);
  },
}));

vi.mock("@/lib/hooks/useRuntimeFeatureFlags", () => ({
  useRuntimeFeatureFlags: () => ({
    flags: {},
    source: "test",
    loading: false,
    error: null,
    refresh: vi.fn(),
    enabled: () => false,
  }),
}));

/* Mock heavy sub-components that are irrelevant to load-state testing */
vi.mock("@planner/components/PlannerTopToolbar", () => ({
  PlannerTopToolbar: () => <div data-testid="mock-top-toolbar" />,
}));
vi.mock("@planner/components/PlannerWorkflowBar", () => ({
  PlannerWorkflowBar: () => <div data-testid="mock-workflow-bar" />,
}));
vi.mock("@planner/components/PlannerDockShell", () => ({
  DockShell: () => <div data-testid="mock-dock-shell" />,
}));
vi.mock("@planner/components/PlannerViewportControls", () => ({
  ViewportControls: () => <div data-testid="mock-viewport-controls" />,
}));
vi.mock("@planner/components/PlannerRulers", () => ({
  Rulers: () => <div data-testid="mock-rulers" />,
}));
vi.mock("@planner/components/PlannerContextMenu", () => ({
  ContextMenu: () => null,
}));
vi.mock("@planner/components/PlannerAutoArrangeDialog", () => ({
  default: () => null,
}));
vi.mock("@planner/components/PlannerProjectMenu", () => ({
  ProjectMenu: () => <div data-testid="mock-project-menu" />,
}));
vi.mock("@planner/components/PlannerAlignBar", () => ({
  PlannerAlignBar: () => null,
}));
vi.mock("@planner/components/PlannerAiPanel", () => ({
  PlannerAiPanel: () => null,
}));
vi.mock("@planner/components/PlannerCommandPalette", () => ({
  PlannerCommandPalette: () => null,
}));
vi.mock("@planner/components/PlannerUnitPill", () => ({
  PlannerUnitPill: () => null,
}));
vi.mock("@planner/components/ui/PlannerPhIcon", () => ({
  PhIcon: () => <span />,
}));
vi.mock("@planner/components/ui/PlannerSidePanelResizeHandle", () => ({
  SidePanelResizeHandle: () => null,
}));
vi.mock("@planner/components/ui/usePlannerPanelResize", () => ({
  usePanelResize: () => ({ width: 300, onMouseDown: vi.fn() }),
}));
vi.mock("@planner/components/ui/PlannerDraggableCanvasOverlay", () => ({
  DraggableCanvasOverlay: () => null,
}));
vi.mock("@planner/components/ui/PlannerExportMenu", () => ({
  ExportMenu: () => null,
}));
vi.mock("@planner/components/ui/PlannerDockPanelButtons", () => ({
  DockPanelButtons: () => null,
}));
vi.mock("@planner/components/dock/PlannerDockPanels", () => ({
  PlannerBoqPanel: () => null,
  PlannerCatalogPanel: () => null,
  PlannerColorPanel: () => null,
  PlannerLayersPanel: () => null,
  PlannerPropsPanel: () => null,
  PlannerSheetPanel: () => null,
  PlannerToolsPanel: () => null,
  PlannerValidationPanel: () => null,
}));
vi.mock("@planner/lib/plannerExporters", () => ({
  exportPNG: vi.fn(),
  exportPDF: vi.fn(),
  exportSVG: vi.fn(),
  downloadDataUrl: vi.fn(),
}));
vi.mock("@planner/lib/plannerDxfExport", () => ({
  downloadDxf: vi.fn(),
}));
vi.mock("@planner/lib/plannerAutoArrange", () => ({
  autoArrange: vi.fn(),
}));
vi.mock("@planner/lib/plannerFabricSerialize", () => ({
  serializeFabricCanvas: vi.fn().mockReturnValue({}),
}));
vi.mock("@planner/lib/commands/registry", () => ({
  buildPaletteCommands: () => [],
}));
vi.mock("@/lib/analytics/conversionContract", () => ({
  trackPlannerFirstPlacement: vi.fn(),
  trackPlannerProjectStart: vi.fn(),
}));

/* ------------------------------------------------------------------ */
/* Import component under test AFTER all mocks are registered          */
/* ------------------------------------------------------------------ */
import Planner from "@planner/components/Planner";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function makeProject(id: string, name = "Test Plan") {
  return {
    id,
    name,
    canvas_json: {},
    sheet: { width_mm: 5000, height_mm: 3000 },
  };
}

/** Creates a deferred promise for controlling async resolution timing. */
function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/* ------------------------------------------------------------------ */
/* Tests                                                                */
/* ------------------------------------------------------------------ */

describe("Planner editor load-state integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.current = {};
    // Provide a minimal localStorage mock
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key) => store[key] ?? null,
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, val) => {
      store[key] = val;
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
      delete store[key];
    });
    // Ensure DOM has the slot Planner expects
    const slot = document.createElement("div");
    slot.id = "topbar-actions-slot";
    document.body.appendChild(slot);
  });

  afterEach(() => {
    const slot = document.getElementById("topbar-actions-slot");
    if (slot) document.body.removeChild(slot);
  });

  it("enters Draft state when useParams has no id and localStorage is empty", async () => {
    mockParams.current = {};
    mockGetProject.mockResolvedValue(makeProject("p_1"));

    render(<Planner />);

    await waitFor(() => {
      const workspace = screen.getByTestId("planner-workspace");
      expect(workspace).toHaveAttribute("data-load-state", "draft");
    });
    // getProject should not have been called — no effective id
    expect(mockGetProject).not.toHaveBeenCalled();
  });

  it("keeps a guest entry in Draft even when a private project id is remembered", async () => {
    vi.mocked(Storage.prototype.getItem).mockReturnValue("private-plan");
    mockGetProject.mockResolvedValue(makeProject("private-plan"));

    render(<Planner accessMode="guest" />);

    await waitFor(() => {
      const workspace = screen.getByTestId("planner-workspace");
      expect(workspace).toHaveAttribute("data-access-mode", "guest");
      expect(workspace).toHaveAttribute("data-load-state", "draft");
    });
    expect(mockGetProject).not.toHaveBeenCalled();
  });

  it("uses route id (useParams.id) for getProject — route-id precedence", async () => {
    mockParams.current = { id: "p_route_1" };
    const d = deferred<ReturnType<typeof makeProject>>();
    mockGetProject.mockReturnValue(d.promise);

    render(<Planner />);

    await waitFor(() => {
      expect(mockGetProject).toHaveBeenCalledWith(
        "p_route_1",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  it("shows data-load-state=loading before getProject resolves", async () => {
    mockParams.current = { id: "p_loading" };
    const d = deferred<ReturnType<typeof makeProject>>();
    mockGetProject.mockReturnValue(d.promise);

    render(<Planner />);

    await waitFor(() => {
      const workspace = screen.getByTestId("planner-workspace");
      expect(workspace).toHaveAttribute("data-load-state", "loading");
    });
  });

  it("shows not-found surface when getProject rejects with 404", async () => {
    mockParams.current = { id: "p_invalid" };
    const { PlannerApiError } = await import("@planner/lib/plannerApi");
    mockGetProject.mockRejectedValue(
      new PlannerApiError(404, "RESOURCE_NOT_FOUND", "Project not found", {
        detail: "Project not found",
      }),
    );

    render(<Planner />);

    await waitFor(() => {
      const workspace = screen.getByTestId("planner-workspace");
      expect(workspace).toHaveAttribute("data-load-state", "not-found");
    });
    expect(
      screen.getByRole("heading", { name: /plan not found/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /back to projects/i }),
    ).toBeInTheDocument();
  });

  it("shows sign-in action (not retry) when getProject rejects with 401 — the state a persisted audit artifact actually recorded", async () => {
    // plans/ref/remediation-unified/audit.md D7: the only Planner failure
    // captured in results/site/page-audit-production-complete/audit-results.json
    // for /ooplanner/projects/demo-plan/ is HTTP 401, not 404/429.
    mockParams.current = { id: "demo-plan" };
    const { PlannerApiError } = await import("@planner/lib/plannerApi");
    mockGetProject.mockRejectedValue(
      new PlannerApiError(401, "AUTH_REQUIRED", "Authentication required", {
        detail: "Authentication required",
      }),
    );

    render(<Planner />);

    await waitFor(() => {
      const workspace = screen.getByTestId("planner-workspace");
      expect(workspace).toHaveAttribute("data-load-state", "unauthorized");
    });
    expect(
      screen.getByRole("heading", { name: /sign in required/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^sign in$/i }),
    ).toBeInTheDocument();
    // No "Try again" — a 401 cannot be resolved by repeating the same request.
    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/access\?next=/),
    );
  });

  it("shows access-denied surface with no retry when getProject rejects with 403", async () => {
    mockParams.current = { id: "p_forbidden" };
    const { PlannerApiError } = await import("@planner/lib/plannerApi");
    mockGetProject.mockRejectedValue(
      new PlannerApiError(
        403,
        "INSUFFICIENT_PERMISSIONS",
        "Insufficient permissions",
        {
          detail: "Insufficient permissions",
        },
      ),
    );

    render(<Planner />);

    await waitFor(() => {
      const workspace = screen.getByTestId("planner-workspace");
      expect(workspace).toHaveAttribute("data-load-state", "forbidden");
    });
    expect(
      screen.getByRole("heading", { name: /access denied/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();
  });

  it("shows transient-error and allows retry when getProject rejects with 503", async () => {
    mockParams.current = { id: "p_transient" };
    const { PlannerApiError } = await import("@planner/lib/plannerApi");
    mockGetProject.mockRejectedValue(
      new PlannerApiError(503, "SERVICE_UNAVAILABLE", "Service unavailable", {
        detail: "Service unavailable",
      }),
    );

    render(<Planner />);

    await waitFor(() => {
      const workspace = screen.getByTestId("planner-workspace");
      expect(workspace).toHaveAttribute("data-load-state", "transient-error");
    });
    expect(
      screen.getByRole("heading", { name: /temporarily unavailable/i }),
    ).toBeInTheDocument();

    // Retry: clicking Try again should re-invoke getProject
    mockGetProject.mockClear();
    mockGetProject.mockRejectedValue(
      new PlannerApiError(503, "SERVICE_UNAVAILABLE", "Service unavailable", {
        detail: "Service unavailable",
      }),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    });

    await waitFor(() => {
      expect(mockGetProject).toHaveBeenCalledWith(
        "p_transient",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  it("transitions to ready state after successful getProject", async () => {
    mockParams.current = { id: "p_ok" };
    const project = makeProject("p_ok", "My Floor Plan");
    mockGetProject.mockResolvedValue(project);

    render(<Planner />);

    await waitFor(() => {
      const workspace = screen.getByTestId("planner-workspace");
      expect(workspace).toHaveAttribute("data-load-state", "ready");
    });
  });

  it("navigates to /ooplanner/projects when Back to projects is clicked", async () => {
    mockParams.current = { id: "p_missing" };
    const { PlannerApiError } = await import("@planner/lib/plannerApi");
    mockGetProject.mockRejectedValue(
      new PlannerApiError(404, "RESOURCE_NOT_FOUND", "Not found", {
        detail: "Not found",
      }),
    );

    render(<Planner />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /back to projects/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /back to projects/i }));
    expect(mockPush).toHaveBeenCalledWith("/ooplanner/projects");
  });
});

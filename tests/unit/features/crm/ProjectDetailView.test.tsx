import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import ProjectDetailView from "@/features/crm/ProjectDetailView";
import { CRM_PROJECTS_PATH } from "@/features/crm/crmRoutes";
import { memberSuitePlannerProjectHref } from "@/features/shared/shell/memberSuiteRoutes";

const mockProjects = [
  {
    id: "proj1",
    clientId: "c1",
    name: "Project Alpha",
    notes: "Brief notes for Alpha",
    planIds: ["local1"],
    createdAt: "2026-06-25T00:00:00Z",
    updatedAt: "2026-06-26T00:00:00Z",
  },
] as const;

const mockClients = [
  {
    id: "c1",
    name: "Client Acme",
    company: "Acme Corp",
    email: "acme@example.com",
    phone: "+12345678",
  },
] as const;

const mockAssignPlan = vi.fn();
const mockRemovePlan = vi.fn();
const mockPush = vi.fn();
const mockBrowserApiFetch = vi.fn();

vi.mock("@/features/crm/stores/crmStore", () => ({
  useCrmStore: vi.fn(() => ({
    projects: mockProjects,
    clients: mockClients,
    assignPlanToProject: mockAssignPlan,
    removePlanFromProject: mockRemovePlan,
  })),
}));

vi.mock("@planner/lib/projectIndex", () => ({
  getSavedPlans: vi.fn(() => [
    {
      id: "local1",
      name: "Local Blueprint 1",
      furniture: [{}, {}],
      savedAt: "2026-06-26T00:00:00Z",
    },
  ]),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/features/shared/shell/GlobalNavHeader", () => ({
  GlobalNavHeader: () => <div data-testid="mock-global-nav-header">Header</div>,
}));

vi.mock("@/lib/api/browserApi", () => ({
  apiPath: (path: string) => (path.endsWith("/") ? path : `${path}/`),
  browserApiFetch: (...args: Parameters<typeof mockBrowserApiFetch>) => mockBrowserApiFetch(...args),
}));

vi.mock("@phosphor-icons/react", async () => {
  const ReactMod = await vi.importActual<typeof import("react")>("react");
  const icon = (testId: string) => (props: Record<string, unknown>) =>
    ReactMod.createElement("span", { "data-testid": testId, "aria-hidden": "true", ...props });
  return {
    ArrowLeft: icon("icon-arrow-left"),
    ArrowRight: icon("icon-arrow-right"),
    Envelope: icon("icon-envelope"),
    Mail: icon("icon-envelope"),
    Phone: icon("icon-phone"),
    Clock: icon("icon-clock"),
    FileText: icon("icon-file-text"),
    Cube: icon("icon-cube"),
    Box: icon("icon-cube"),
    WarningCircle: icon("icon-warning-circle"),
    AlertCircle: icon("icon-warning-circle"),
    Plus: icon("icon-plus"),
    X: icon("icon-x"),
  };
});

const EXPECTED_CANVAS_HREF = memberSuitePlannerProjectHref("local1");
const EXPECTED_CANVAS_HREF_ONLINE = memberSuitePlannerProjectHref("online1");

describe("ProjectDetailView — behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.alert = vi.fn() as unknown as typeof window.alert;

    mockBrowserApiFetch.mockImplementation(async (url: string, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "POST") {
        return {
          ok: true,
          json: async () => ({
            id: "p_new-cabinet-layout_abc123",
            name: "New Cabinet Layout",
          }),
        } as unknown as Response;
      }
      return {
        ok: true,
        json: async () => [
          {
            id: "online1",
            name: "Online Blueprint 1",
            objects_count: 5,
            updated_at: "2026-06-26T00:00:00Z",
          },
        ],
      } as unknown as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders not-found shell with alert icon, computed back hrefs, and absence of project chrome", () => {
    const { container } = render(<ProjectDetailView projectId="non-existent" />);

    expect(screen.getByTestId("icon-warning-circle")).toBeInTheDocument();
    const warningIcon = screen.getByTestId("icon-warning-circle");
    expect(warningIcon).toHaveAttribute("aria-hidden", "true");

    const heading = screen.getByRole("heading", { level: 2, name: "Project not found" });
    expect(heading).toBeInTheDocument();
    // Not-found shell: embedded => crm-project-detail-view, standalone => admin-page. Assert either + absence of project chrome.
    const shell = container.querySelector(".crm-project-detail-view") ?? container.querySelector(".admin-page");
    expect(shell).not.toBeNull();

    const backLinks = screen.getAllByRole("link", { name: "Back to Projects" });
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of backLinks) {
      expect(link).toHaveAttribute("href", CRM_PROJECTS_PATH);
    }

    expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Local Blueprint 1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Floor Plans/i })).not.toBeInTheDocument();
  });

  it("renders project header, client card, and assigned plan grid with computed hrefs/classes", async () => {
    const { container } = render(<ProjectDetailView projectId="proj1" />);

    await waitFor(() => expect(mockBrowserApiFetch).toHaveBeenCalledWith("/api/Planner/projects/"));
    const fetchCall = mockBrowserApiFetch.mock.calls.find(([url]) => String(url).includes("/api/Planner/projects"));
    expect(fetchCall).toBeDefined();
    expect(String(fetchCall?.[0])).toBe("/api/Planner/projects/");

    // Header eyebrow vs embedded, heading level, back link
    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.getByText("Project Detail")).toBeInTheDocument();
    const h1 = screen.getByRole("heading", { level: 1, name: "Project Alpha" });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveClass("text-2xl");

    const backLink = screen.getByLabelText("Back to projects");
    expect(backLink).toHaveAttribute("href", CRM_PROJECTS_PATH);
    expect(screen.getByTestId("icon-arrow-left")).toBeInTheDocument();

    // Client card iteration from source-of-truth mockClients[0]
    const client = mockClients[0];
    expect(screen.getByText(client.name)).toBeInTheDocument();
    expect(screen.getByText(client.company)).toBeInTheDocument();
    expect(screen.getByText(client.email)).toBeInTheDocument();
    expect(screen.getByText(client.phone)).toBeInTheDocument();
    expect(screen.getByTestId("icon-envelope")).toBeInTheDocument();
    expect(screen.getByTestId("icon-phone")).toBeInTheDocument();
    const avatar = screen.getByText(client.name.charAt(0).toUpperCase());
    expect(avatar).toHaveClass("bg-primary");

    // Notes + timestamps
    expect(screen.getByText(mockProjects[0].notes)).toBeInTheDocument();
    expect(screen.getByText("Project Brief")).toBeInTheDocument();
    expect(screen.getByText("Timestamps")).toBeInTheDocument();
    expect(container.querySelector(".admin-panel")).not.toBeNull();

    // Assigned plans grid — local1 with computed canvas href, type badge, counts
    await waitFor(() => expect(screen.getByText("Local Blueprint 1")).toBeInTheDocument());
    expect(screen.getByText("local")).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByTestId("icon-cube")).toBeInTheDocument();
    expect(screen.getByTestId("icon-clock")).toBeInTheDocument();

    const canvasLink = screen.getByRole("link", { name: "Open in Canvas" });
    expect(canvasLink).toHaveAttribute("href", EXPECTED_CANVAS_HREF);
    expect(canvasLink).toHaveClass("btn-primary");

    // Unlink button with title + icon
    const unlinkBtn = screen.getByTitle("Unlink plan");
    expect(unlinkBtn).toHaveAttribute("title", "Unlink plan");
    expect(within(unlinkBtn).getByTestId("icon-x")).toBeInTheDocument();

    // Header counts derived: "1 plan grouped"
    expect(screen.getByText(/1 plan grouped/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Link Plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Plan/i })).toBeInTheDocument();
    expect(screen.queryByText("No plans linked yet")).not.toBeInTheDocument();
  });

  it("unlinks assigned plan via fireEvent with vi.fn count+args and class", async () => {
    render(<ProjectDetailView projectId="proj1" />);
    await waitFor(() => expect(screen.getByText("Local Blueprint 1")).toBeInTheDocument());

    const unlinkBtn = screen.getByTitle("Unlink plan");
    expect(unlinkBtn).toHaveClass("hover:text-danger");
    fireEvent.click(unlinkBtn);

    expect(mockRemovePlan).toHaveBeenCalledTimes(1);
    expect(mockRemovePlan).toHaveBeenCalledWith("proj1", "local1");
    expect(mockRemovePlan.mock.calls[0]).toEqual(["proj1", "local1"]);
    expect(mockAssignPlan).not.toHaveBeenCalled();
  });

  it("opens link modal, iterates unassigned plans from source-of-truth, and links via click+keyboard", async () => {
    const { container } = render(<ProjectDetailView projectId="proj1" />);
    await waitFor(() => expect(screen.getByText("Local Blueprint 1")).toBeInTheDocument());

    // Closed initially
    expect(screen.queryByRole("heading", { name: "Link Floor Plan" })).not.toBeInTheDocument();
    expect(container.querySelector(".bg-black\\/60")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Link Plan" }));
    const dialogHeading = screen.getByRole("heading", { level: 2, name: "Link Floor Plan" });
    expect(dialogHeading).toBeInTheDocument();
    expect(screen.getByText(/Select an existing workspace plan/i)).toBeInTheDocument();
    const overlay = container.querySelector(".bg-black\\/60");
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveClass("backdrop-blur-sm");

    // Iterate unassigned: online1 not in proj1.planIds
    const onlineOption = screen.getByText("Online Blueprint 1");
    expect(onlineOption).toBeInTheDocument();
    expect(screen.getByText("online · 5 items")).toBeInTheDocument();
    expect(screen.getByTestId("icon-arrow-right")).toBeInTheDocument();

    const optionRow = screen.getByLabelText("Link plan Online Blueprint 1");
    expect(optionRow).toHaveAttribute("role", "button");
    expect(optionRow).toHaveAttribute("tabIndex", "0");
    expect(optionRow).toHaveClass("cursor-pointer");

    // Click path
    fireEvent.click(onlineOption);
    expect(mockAssignPlan).toHaveBeenCalledWith("proj1", "online1");
    expect(mockAssignPlan).toHaveBeenCalledTimes(1);

    // Click closed the modal — reopen to test keyboard path
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Link Floor Plan" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Link Plan" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Link Floor Plan" })).toBeInTheDocument());
    const kbRow = screen.getByLabelText("Link plan Online Blueprint 1");
    fireEvent.keyDown(kbRow, { key: "Enter" });
    expect(mockAssignPlan).toHaveBeenCalledTimes(2);
    expect(mockAssignPlan).toHaveBeenLastCalledWith("proj1", "online1");

    // Cancel closes — modal is closed by assign, but handle either state: reopen if needed then close
    let cancelBtn = screen.queryByRole("button", { name: "Cancel" });
    if (!cancelBtn) {
      fireEvent.click(screen.getByRole("button", { name: "Link Plan" }));
      await waitFor(() => expect(screen.getByRole("heading", { name: "Link Floor Plan" })).toBeInTheDocument());
      cancelBtn = screen.getByRole("button", { name: "Cancel" });
    }
    fireEvent.click(cancelBtn as HTMLElement);
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Link Floor Plan" })).not.toBeInTheDocument());

    // Create fallback link inside empty? not shown when unassigned exists
    expect(screen.queryByText("Create a new plan instead")).not.toBeInTheDocument();
  });

  it("creates a floor plan via Planner API with computed POST body and navigates", async () => {
    const { container } = render(<ProjectDetailView projectId="proj1" />);
    await waitFor(() => expect(screen.getByText("Local Blueprint 1")).toBeInTheDocument());

    expect(screen.queryByRole("heading", { name: "Create New Floor Plan" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Plan" }));
    expect(screen.getByRole("heading", { level: 2, name: "Create New Floor Plan" })).toBeInTheDocument();
    expect(screen.getByText(/Set up a blank floor plan/i)).toBeInTheDocument();
    const overlay = container.querySelector(".bg-black\\/60");
    expect(overlay).not.toBeNull();

    const input = screen.getByPlaceholderText("e.g. Executive Cabin Blueprint");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("required");
    expect(input).toHaveValue("");

    const submitBtn = screen.getByRole("button", { name: "Create & Launch" });
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveClass("btn-primary");

    // Type triggers enabled
    fireEvent.change(input, { target: { value: "New Cabinet Layout" } });
    expect(input).toHaveValue("New Cabinet Layout");
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() =>
      expect(mockBrowserApiFetch).toHaveBeenCalledWith(
        "/api/Planner/projects/",
        expect.objectContaining({ method: "POST" }),
      ),
    );

    const postCall = mockBrowserApiFetch.mock.calls.find(([, init]) => (init as RequestInit)?.method === "POST");
    expect(postCall).toBeDefined();
    expect(String(postCall?.[0])).toBe("/api/Planner/projects/");
    const body = JSON.parse(String((postCall?.[1] as RequestInit)?.body));
    expect(body).toEqual(
      expect.objectContaining({
        name: "New Cabinet Layout",
        canvas_json: { objects: [] },
        sheet: {},
        layers: [],
      }),
    );
    expect((postCall?.[1] as RequestInit)?.headers).toEqual(expect.objectContaining({ "content-type": "application/json" }));

    await waitFor(() => {
      expect(mockAssignPlan).toHaveBeenCalledWith("proj1", "p_new-cabinet-layout_abc123");
      expect(mockPush).toHaveBeenCalledWith(memberSuitePlannerProjectHref("p_new-cabinet-layout_abc123"));
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toBe("/planner/projects/p_new-cabinet-layout_abc123");
  });

  it("alerts when Planner create API fails and does not assign or push", async () => {
    mockBrowserApiFetch.mockImplementation(async (url: string, init?: RequestInit) => {
      if ((init?.method ?? "GET").toUpperCase() === "POST") {
        return { ok: false, json: async () => ({ detail: "nope" }) } as unknown as Response;
      }
      return { ok: true, json: async () => [] } as unknown as Response;
    });

    render(<ProjectDetailView projectId="proj1" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Create Plan" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Create Plan" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. Executive Cabin Blueprint"), {
      target: { value: "Broken" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create & Launch" }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Could not create floor plan on the server."),
    );
    expect(window.alert).toHaveBeenCalledTimes(1);
    expect(mockAssignPlan).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    // Modal stays open on failure — absence of navigation, presence of dialog
    expect(screen.getByRole("heading", { name: "Create New Floor Plan" })).toBeInTheDocument();
  });

  it("does not render suite header chromes and uses compact embedded chrome", async () => {
    const { rerender } = render(<ProjectDetailView projectId="proj1" embedded={false} />);
    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.getByText("Project Detail")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Project Alpha" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Project Alpha" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Back to projects")).toHaveAttribute("href", CRM_PROJECTS_PATH);

    rerender(<ProjectDetailView projectId="proj1" embedded />);
    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.queryByText("Project Detail")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: "Project Alpha" })).toBeInTheDocument(),
    );
    const h2 = screen.getByRole("heading", { level: 2, name: "Project Alpha" });
    expect(h2).toHaveClass("text-lg");
    expect(screen.getByLabelText("Back to projects")).toHaveAttribute("href", CRM_PROJECTS_PATH);
    expect(screen.queryByText("Project not found")).not.toBeInTheDocument();
  });

  it("guards empty create submit and renders filtered plan type badges", async () => {
    render(<ProjectDetailView projectId="proj1" />);
    await waitFor(() => expect(screen.getByText("Local Blueprint 1")).toBeInTheDocument());

    // Badge for assigned local plan — only assigned plans render as cards; unassigned online appears only in Link modal
    const badge = screen.getByText("local");
    expect(badge).toHaveClass("bg-[color:var(--surface-soft)]");
    expect(screen.queryByText("online · 5 items")).not.toBeInTheDocument();
    // Verify online plan is available via Link modal as unassigned
    fireEvent.click(screen.getByRole("button", { name: "Link Plan" }));
    expect(await screen.findByText("online · 5 items")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Link Floor Plan" })).not.toBeInTheDocument());

    // Computed hrefs for assigned plan cards
    expect(screen.getByRole("link", { name: "Open in Canvas" })).toHaveAttribute("href", EXPECTED_CANVAS_HREF);
    expect(EXPECTED_CANVAS_HREF).toBe("/planner/projects/local1");
    expect(EXPECTED_CANVAS_HREF_ONLINE).toBe("/planner/projects/online1");

    // Try submitting empty — disabled prevents call
    fireEvent.click(screen.getByRole("button", { name: "Create Plan" }));
    const input = screen.getByPlaceholderText("e.g. Executive Cabin Blueprint");
    fireEvent.change(input, { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Create & Launch" })).toBeDisabled();
    // No fetch POST yet beyond initial GET
    const postCallsBefore = mockBrowserApiFetch.mock.calls.filter(([, init]) => (init as RequestInit)?.method === "POST");
    expect(postCallsBefore.length).toBe(0);
    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
  });
});

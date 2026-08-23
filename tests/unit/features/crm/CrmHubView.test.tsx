import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import CrmHubView from "@/features/crm/CrmHubView";
import { CRM_CLIENTS_PATH, CRM_PROJECTS_PATH, CRM_QUOTES_PATH, crmProjectDetailPath } from "@/features/crm/crmRoutes";
import { computeCrmMetrics, formatInrCompact } from "@/features/crm/crmMetrics";
import { crmProjectStatus, crmQuoteStatusColumns } from "@/features/crm/crmUi";

const mockState = {
  clients: [
    {
      id: "c1",
      name: "Client Acme",
      company: "Acme",
      email: "a@x.com",
      phone: "",
      address: "",
      notes: "",
      createdAt: "2026-01-01",
    },
  ],
  projects: [
    {
      id: "p1",
      name: "HQ Fit-out",
      clientId: "c1",
      status: "active" as const,
      notes: "Phase 1",
      planIds: ["plan-1"],
      createdAt: "2026-01-01",
      updatedAt: "2026-06-01",
    },
  ],
  quotes: [
    {
      id: "q1",
      title: "Phase 1 quote",
      clientId: "c1",
      projectId: "p1",
      planId: "plan-1",
      items: [],
      totalAmount: 250000,
      status: "sent" as const,
      createdAt: "2026-01-01",
      updatedAt: "2026-06-02",
    },
  ],
  seedDemoData: vi.fn(),
  clearAll: vi.fn(),
  exportSnapshot: vi.fn(() => ({ version: 1, exportedAt: "", clients: [], projects: [], quotes: [] })),
  importSnapshot: vi.fn(() => true),
};

vi.mock("@/features/crm/stores/crmStore", () => ({
  useCrmStore: (selector?: (s: typeof mockState) => unknown) =>
    typeof selector === "function" ? selector(mockState) : mockState,
}));

vi.mock("@/features/crm/CrmDemoBanner", () => ({
  CrmDemoBanner: () => <div data-testid="crm-demo-banner">Demo workspace banner</div>,
}));

vi.mock("@/features/crm/CrmWorkspaceBanner", () => ({
  CrmWorkspaceBanner: () => (
    <div data-testid="crm-workspace-banner">
      <span>Browser-only CRM demo.</span>
      <button type="button" onClick={() => mockState.seedDemoData()}>
        Reset to sample data
      </button>
      <button type="button" onClick={() => mockState.clearAll()}>
        Clear all
      </button>
    </div>
  ),
}));

vi.mock("@phosphor-icons/react", () => ({
  ArrowRight: () => <span data-testid="icon-arrow-right" aria-hidden="true" />,
}));

vi.mock("@/features/admin/ui/AdminKpiLink", () => ({
  AdminKpiLink: ({
    href,
    label,
    hint,
    cta,
    tone,
    hintClassName,
  }: {
    href: string;
    label: string;
    hint: unknown;
    cta: unknown;
    tone: string;
    hintClassName?: string;
  }) => (
    <a href={href} data-testid={`kpi-${label}`} data-tone={tone} className={`admin-kpi admin-kpi--${tone} ${hintClassName ?? ""}`}>
      <span className="admin-kpi__label">{label}</span>
      <span className="admin-kpi__hint">{String(hint)}</span>
      <span className="admin-kpi__cta">{cta as string}</span>
    </a>
  ),
}));

vi.mock("@/features/admin/ui/AdminPanelCard", () => ({
  AdminPanelCard: ({ title, children, action, className }: { title: string; children: unknown; action?: unknown; className?: string }) => (
    <section data-testid={`panel-${title}`} className={className}>
      <h2>{title}</h2>
      {action ? <div data-testid={`panel-action-${title}`}>{action as string}</div> : null}
      <div>{children as string}</div>
    </section>
  ),
}));

describe("CrmHubView — behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders honesty banners, KPI group with computed hrefs, tones, and compact formatting", () => {
    const metrics = computeCrmMetrics(mockState.clients, mockState.projects, mockState.quotes);
    const { container } = render(<CrmHubView />);

    expect(screen.getByTestId("crm-demo-banner")).toBeInTheDocument();
    expect(screen.getByTestId("crm-workspace-banner")).toBeInTheDocument();
    expect(screen.getByText(/Browser-only CRM demo/)).toBeInTheDocument();

    const group = screen.getByLabelText("CRM summary");
    expect(group).toHaveAttribute("aria-label", "CRM summary");
    expect(group).toHaveClass("admin-kpi-grid");

    const kpiExpectations: Array<{ label: string; href: string; tone: string }> = [
      { label: "Clients", href: CRM_CLIENTS_PATH, tone: "neutral" },
      { label: "Active projects", href: CRM_PROJECTS_PATH, tone: "info" },
      { label: "Pipeline value", href: CRM_QUOTES_PATH, tone: "warn" },
      { label: "Approved value", href: CRM_QUOTES_PATH, tone: "success" },
    ];
    for (const { label, href, tone } of kpiExpectations) {
      const link = screen.getByTestId(`kpi-${label}`);
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("data-tone", tone);
      expect(link).toHaveClass(`admin-kpi--${tone}`);
      expect(link).toHaveClass("admin-kpi");
    }

    expect(screen.getByTestId("kpi-Clients")).toHaveTextContent(String(metrics.clientCount));
    expect(screen.getByTestId("kpi-Pipeline value")).toHaveTextContent(formatInrCompact(metrics.pipelineValue));
    expect(screen.getByTestId("kpi-Approved value")).toHaveTextContent(formatInrCompact(metrics.approvedValue));

    expect(screen.getAllByTestId("icon-arrow-right").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector(".crm-hub")).not.toBeNull();
    expect(container.querySelector(".crm-hub")).toHaveClass("crm-hub");
    expect(screen.queryByText("CRM workspace is empty")).not.toBeInTheDocument();
    expect(screen.queryByText("Load sample data")).not.toBeInTheDocument();
  });

  it("iterates recent projects from source-of-truth sorted by updatedAt with computed detail href and badge variant", () => {
    const { clients, projects } = mockState;
    const sorted = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
    render(<CrmHubView />);

    const panel = screen.getByTestId("panel-Recent projects");
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText("Recent projects")).toBeInTheDocument();
    expect(within(panel).getByText("View all").closest("a")).toHaveAttribute("href", CRM_PROJECTS_PATH);

    for (const project of sorted) {
      const link = screen.getByRole("link", { name: project.name });
      expect(link).toHaveAttribute("href", crmProjectDetailPath(project.id));
      expect(link).toHaveClass("text-strong");
      const client = clients.find((c) => c.id === project.clientId);
      const row = link.closest("li") as HTMLElement | null;
      expect(row).not.toBeNull();
      expect(within(row as HTMLElement).getByText(new RegExp(client?.name ?? "Unassigned"))).toBeInTheDocument();
      expect(within(row as HTMLElement).getByText(new RegExp(`${project.planIds.length} plan`))).toBeInTheDocument();
      const status = crmProjectStatus[project.status as keyof typeof crmProjectStatus] ?? crmProjectStatus.active;
      expect(within(row as HTMLElement).getByText(status.label)).toBeInTheDocument();
      const badge = within(row as HTMLElement).getByText(status.label);
      expect(badge).toHaveClass("rounded-full");
      expect(badge.className).toContain(status.badge.split(" ")[0]);
    }

    expect(screen.queryByText("No projects yet.")).not.toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /empty/i })).not.toBeInTheDocument();
  });

  it("iterates recent quotes from source-of-truth with client lookup, compact INR, and status badge", () => {
    const { clients, quotes } = mockState;
    const sorted = [...quotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
    render(<CrmHubView />);

    const panel = screen.getByTestId("panel-Recent quotes");
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText("Recent quotes")).toBeInTheDocument();

    for (const quote of sorted) {
      expect(within(panel).getByText(quote.title)).toBeInTheDocument();
      const client = clients.find((c) => c.id === quote.clientId);
      expect(within(panel).getByText(new RegExp(client?.name ?? "Unassigned"))).toBeInTheDocument();
      expect(panel.textContent).toContain(formatInrCompact(quote.totalAmount));
      const col = crmQuoteStatusColumns.find((c) => c.value === quote.status) ?? crmQuoteStatusColumns[0];
      const badge = within(panel).getByText(col.label);
      expect(badge).toHaveClass("rounded-full");
      expect(badge.className).toContain(col.badge.split(" ")[0]);
    }

    expect(screen.queryByText("No quotes yet.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("panel-Recent quotes-unknown")).not.toBeInTheDocument();
  });

  it("renders quick-actions panel with computed hrefs and meta line derived from metrics", () => {
    const metrics = computeCrmMetrics(mockState.clients, mockState.projects, mockState.quotes);
    render(<CrmHubView />);

    const panel = screen.getByTestId("panel-Quick actions");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass("p-4");

    const newClientLink = screen.getByRole("link", { name: "New client" });
    expect(newClientLink).toHaveAttribute("href", CRM_CLIENTS_PATH);
    expect(screen.getByRole("link", { name: "New project" })).toHaveAttribute("href", CRM_PROJECTS_PATH);
    expect(screen.getByRole("link", { name: "New quote" })).toHaveAttribute("href", CRM_QUOTES_PATH);
    expect(screen.getByRole("link", { name: "Customer queries" })).toHaveAttribute("href", "/admin/customer-queries");
    expect(screen.getByRole("link", { name: "Planner plans" })).toHaveAttribute("href", "/admin/plans");

    const meta = screen.getByText(new RegExp(`${metrics.plansLinked} floor plan link`));
    expect(meta).toBeInTheDocument();
    expect(meta).toHaveClass("admin-page__meta");
    expect(meta).toHaveTextContent(`${metrics.onHoldProjects} on hold`);
    expect(meta).toHaveTextContent(`${metrics.completedProjects} completed`);

    expect(screen.queryByRole("link", { name: /nonexistent-action/i })).not.toBeInTheDocument();
  });

  it("fires banner actions via fireEvent and counts vi.fn calls with correct absence checks", () => {
    render(<CrmHubView />);

    const resetBtn = screen.getByRole("button", { name: "Reset to sample data" });
    expect(resetBtn).toHaveAttribute("type", "button");
    expect(mockState.seedDemoData).not.toHaveBeenCalled();
    fireEvent.click(resetBtn);
    expect(mockState.seedDemoData).toHaveBeenCalledTimes(1);
    expect(mockState.seedDemoData).toHaveBeenCalledWith();

    const clearBtn = screen.getByRole("button", { name: "Clear all" });
    expect(clearBtn).toHaveAttribute("type", "button");
    expect(mockState.clearAll).not.toHaveBeenCalled();
    fireEvent.click(clearBtn);
    expect(mockState.clearAll).toHaveBeenCalledTimes(1);
    expect(mockState.clearAll).toHaveBeenCalledWith();

    fireEvent.click(resetBtn);
    expect(mockState.seedDemoData).toHaveBeenCalledTimes(2);
    expect(mockState.clearAll).toHaveBeenCalledTimes(1);

    expect(screen.queryByRole("button", { name: "Load sample data" })).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ClientsView from "@/features/crm/ClientsView";

const mockClients = [
  {
    id: "1",
    name: "John Doe",
    company: "Nexus Tech",
    email: "john@nexus.com",
    phone: "+919999",
    address: "123 St",
    notes: "Prefers mesh chairs",
  },
  { id: "2", name: "Alice Smith", company: "", email: "alice@test.com", phone: "", address: "", notes: "" },
] as const;
const mockProjects = [
  { id: "p1", name: "Office Fitout", clientId: "1", status: "in_progress" as const },
];

const mockAddClient = vi.fn();
const mockDeleteClient = vi.fn();

const mockStoreState = {
  clients: [...mockClients],
  projects: [...mockProjects],
  quotes: [],
  addClient: mockAddClient,
  deleteClient: mockDeleteClient,
  seedDemoData: vi.fn(),
  clearAll: vi.fn(),
  exportSnapshot: vi.fn(() => ({ version: 1 as const, exportedAt: "", clients: [], projects: [], quotes: [] })),
  importSnapshot: vi.fn(() => true),
};

vi.mock("@/features/crm/stores/crmStore", () => ({
  useCrmStore: (selector?: (s: typeof mockStoreState) => unknown) =>
    typeof selector === "function" ? selector(mockStoreState) : mockStoreState,
}));

vi.mock("@/features/crm/CrmWorkspaceBanner", () => ({
  CrmWorkspaceBanner: () => <div data-testid="crm-workspace-banner">Browser-only CRM</div>,
}));

vi.mock("@/features/shared/shell/GlobalNavHeader", () => ({
  GlobalNavHeader: () => <div data-testid="mock-global-nav-header">Header</div>,
}));

vi.mock("@phosphor-icons/react", () => ({
  Users: () => <span data-testid="icon-users" aria-hidden="true" />,
  Plus: () => <span data-testid="icon-plus" aria-hidden="true" />,
  MagnifyingGlass: () => <span data-testid="icon-search" aria-hidden="true" />,
  Trash: () => <span data-testid="icon-trash" aria-hidden="true" />,
  Envelope: () => <span data-testid="icon-mail" aria-hidden="true" />,
  Phone: () => <span data-testid="icon-phone" aria-hidden="true" />,
  MapPin: () => <span data-testid="icon-mappin" aria-hidden="true" />,
  Buildings: () => <span data-testid="icon-building" aria-hidden="true" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" aria-hidden="true" />,
  X: () => <span data-testid="icon-x" aria-hidden="true" />,
  Clock: () => <span data-testid="icon-clock" aria-hidden="true" />,
}));

describe("ClientsView — behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.clients = [...mockClients];
    (mockStoreState.projects as unknown[]) = [...mockProjects];
  });

  it("does not render suite header in any mode and exposes chrome by embedded flag", () => {
    const { container: c1, unmount } = render(<ClientsView embedded={false} />);
    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("crm-workspace-banner")).not.toBeInTheDocument();
    expect(c1.querySelector(".crm-clients-view")).toBeNull();
    expect(c1.querySelector(".admin-page")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Client Directory" })).toBeInTheDocument();
    expect(screen.getByText("CRM demo · browser only")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Client/i })).toHaveAttribute("type", "button");
    unmount();

    const { container: c2 } = render(<ClientsView embedded={true} />);
    expect(screen.queryByTestId("mock-global-nav-header")).not.toBeInTheDocument();
    expect(screen.getByTestId("crm-workspace-banner")).toBeInTheDocument();
    expect(c2.querySelector(".crm-clients-view")).not.toBeNull();
    expect(c2.querySelector(".crm-clients-toolbar")).not.toBeNull();
    expect(screen.getByText("2 clients in this browser.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Client Directory" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New Client/i })).toHaveClass("w-full");
  });

  it("renders stats group with computed values and admin-panel classes", () => {
    const { container } = render(<ClientsView />);

    const group = screen.getByRole("group", { name: "Client statistics" });
    expect(group).toHaveAttribute("aria-label", "Client statistics");
    expect(group).toHaveClass("crm-clients-kpi-grid");

    const cards = container.querySelectorAll(".crm-clients-kpi");
    expect(cards).toHaveLength(3);
    for (const card of cards) expect(card).toHaveClass("admin-panel");

    expect(screen.getByText("Total Clients").nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Corporate Accounts").nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText("Linked Projects").nextElementSibling).toHaveTextContent("1");
    expect(screen.queryByText("0 clients")).not.toBeInTheDocument();
  });

  it("exposes search input with computed attributes and filters source-of-truth", () => {
    render(<ClientsView />);

    const searchInput = screen.getByPlaceholderText("Search by name, company, or email...") as HTMLInputElement;
    expect(searchInput).toHaveAttribute("type", "search");
    expect(searchInput).toHaveAttribute("placeholder", "Search by name, company, or email...");
    expect(searchInput).toHaveAttribute("aria-label", "Search clients");
    expect(searchInput).toHaveClass("min-h-11");
    expect(searchInput).toHaveClass("pl-10");
    expect(screen.getByTestId("icon-search")).toBeInTheDocument();

    for (const client of mockClients) {
      expect(screen.getByText(client.name)).toBeInTheDocument();
    }
    expect(screen.getByText("Nexus Tech")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Nexus" } });
    expect(searchInput).toHaveValue("Nexus");
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    expect(screen.queryByText("No clients found")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("shows empty state when no clients match search query with status role", () => {
    render(<ClientsView />);
    const searchInput = screen.getByPlaceholderText("Search by name, company, or email...");

    fireEvent.change(searchInput, { target: { value: "nobody" } });
    expect(screen.getByText("No clients found")).toBeInTheDocument();
    expect(screen.getByText("No contacts match this search. Try another name, company, or email.")).toBeInTheDocument();
    const status = screen.getByRole("status");
    expect(status).toHaveClass("admin-empty");
    expect(screen.getAllByTestId("icon-users").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("selects client and displays detail with computed mailto href, avatar initials, and associated projects", () => {
    const { container } = render(<ClientsView />);

    expect(screen.getByText("Select a contact")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "john@nexus.com" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("John Doe"));

    const mailLink = screen.getByRole("link", { name: "john@nexus.com" });
    expect(mailLink).toHaveAttribute("href", "mailto:john@nexus.com");
    expect(screen.getByText("+919999")).toBeInTheDocument();
    expect(screen.getByText("123 St")).toBeInTheDocument();
    expect(screen.getByText("Prefers mesh chairs")).toBeInTheDocument();
    expect(screen.getByText("Correspondence Notes")).toBeInTheDocument();
    expect(container.querySelector(".bg-primary")).not.toBeNull();
    expect(screen.getAllByText("JD").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Associated Projects (1)")).toBeInTheDocument();
    expect(screen.getByText("Office Fitout")).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
    expect(screen.queryByText("Select a contact")).not.toBeInTheDocument();
    expect(screen.queryByText("No contact details on file.")).not.toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /Close client details/i });
    expect(closeBtn).toHaveAttribute("aria-label", "Close client details");
    expect(closeBtn).toHaveClass("min-h-11");
  });

  it("shows second client without company and handles project empty + close + keyboard", () => {
    render(<ClientsView />);

    fireEvent.click(screen.getByText("John Doe"));
    fireEvent.click(screen.getByText("Alice Smith"));

    expect(screen.getByText("No projects linked to this client yet.")).toBeInTheDocument();
    expect(screen.getAllByText("AS").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Prefers mesh chairs")).not.toBeInTheDocument();
    expect(screen.queryByText("123 St")).not.toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /Close client details/i });
    fireEvent.click(closeBtn);
    expect(screen.getByText("Select a contact")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "john@nexus.com" })).not.toBeInTheDocument();

    const firstCard = screen.getByText("John Doe").closest('[role="button"]') as HTMLElement;
    expect(firstCard).toHaveAttribute("tabIndex", "0");
    expect(firstCard).toHaveAttribute("role", "button");
    fireEvent.keyDown(firstCard, { key: "Enter" });
    expect(screen.getByRole("link", { name: "john@nexus.com" })).toBeInTheDocument();

    fireEvent.keyDown(firstCard, { key: " " });
    expect(screen.getByRole("link", { name: "john@nexus.com" })).toBeInTheDocument();

    const secondCard = screen.getByText("Alice Smith").closest('[role="button"]') as HTMLElement;
    fireEvent.keyDown(secondCard, { key: "Escape" });
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("calls deleteClient with correct id and clears selected detail", () => {
    render(<ClientsView />);

    fireEvent.click(screen.getByText("John Doe"));
    expect(screen.getByRole("link", { name: "john@nexus.com" })).toBeInTheDocument();

    const deleteBtns = screen.getAllByTitle("Delete client");
    expect(deleteBtns[0]).toHaveAttribute("title", "Delete client");
    expect(deleteBtns[0]).toHaveAttribute("aria-label", "Delete client John Doe");
    expect(deleteBtns[0]).toHaveClass("min-h-11");

    fireEvent.click(deleteBtns[0]);
    expect(mockDeleteClient).toHaveBeenCalledTimes(1);
    expect(mockDeleteClient).toHaveBeenCalledWith("1");
    expect(screen.getByText("Select a contact")).toBeInTheDocument();
    expect(mockDeleteClient).not.toHaveBeenCalledWith("2");
  });

  it("opens modal, validates required name, and submits trimmed form with vi.fn args", () => {
    render(<ClientsView />);

    const newBtn = screen.getByRole("button", { name: /New Client/i });
    expect(newBtn).toHaveAttribute("type", "button");
    fireEvent.click(newBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Add New Client")).toBeInTheDocument();
    expect(within(dialog).getByText("Enter client details to create a new contact profile.")).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText("Full Name") as HTMLInputElement;
    const companyInput = screen.getByPlaceholderText("e.g. Nexus Tech") as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText("name@company.com") as HTMLInputElement;
    const phoneInput = screen.getByPlaceholderText("+91...") as HTMLInputElement;
    const addressInput = screen.getByPlaceholderText("Office Address") as HTMLInputElement;
    const notesInput = screen.getByPlaceholderText("Client preferences, project scoping details...") as HTMLInputElement;

    expect(nameInput).toHaveAttribute("type", "text");
    expect(nameInput).toHaveAttribute("required", "");
    expect(nameInput).toHaveAttribute("placeholder", "Full Name");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(nameInput).toHaveValue("");

    const saveBtn = screen.getByRole("button", { name: "Save Client" });
    expect(saveBtn).toHaveAttribute("type", "submit");
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveClass("w-full");

    fireEvent.change(nameInput, { target: { value: "  Bob Vance  " } });
    expect(nameInput).toHaveValue("  Bob Vance  ");
    expect(saveBtn).toBeEnabled();

    fireEvent.change(companyInput, { target: { value: "Vance Refrigeration" } });
    fireEvent.change(emailInput, { target: { value: "bob@vance.com" } });
    fireEvent.change(phoneInput, { target: { value: "+918888" } });
    fireEvent.change(addressInput, { target: { value: "Scranton" } });
    fireEvent.change(notesInput, { target: { value: "Refrigeration units" } });

    expect(companyInput).toHaveValue("Vance Refrigeration");
    expect(emailInput).toHaveValue("bob@vance.com");

    fireEvent.click(saveBtn);

    expect(mockAddClient).toHaveBeenCalledTimes(1);
    expect(mockAddClient).toHaveBeenCalledWith({
      name: "Bob Vance",
      company: "Vance Refrigeration",
      email: "bob@vance.com",
      phone: "+918888",
      address: "Scranton",
      notes: "Refrigeration units",
    });
    // Dialog closes on submit (setIsModalOpen(false)) — verify absence
    expect(screen.queryByText("Add New Client")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Full Name")).not.toBeInTheDocument();
  });

  it("renders initials and company presence per source-of-truth", () => {
    render(<ClientsView />);

    for (const client of mockClients) {
      expect(screen.getByText(client.name)).toBeInTheDocument();
    }
    expect(screen.getByText("Nexus Tech")).toBeInTheDocument();
    expect(screen.getAllByText("JD").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("AS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("icon-building")).toHaveLength(1);
    expect(screen.queryByText("No contact details on file.")).not.toBeInTheDocument();
  });
});

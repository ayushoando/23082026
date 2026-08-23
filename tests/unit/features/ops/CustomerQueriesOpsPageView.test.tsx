import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import CustomerQueriesOpsPageView from "@/features/ops/CustomerQueriesOpsPageView";

vi.mock("@phosphor-icons/react", async () => {
  const ReactMod = await vi.importActual<typeof import("react")>("react");
  const icon = (testId: string) => (props: Record<string, unknown>) =>
    ReactMod.createElement("span", { "data-testid": testId, "aria-hidden": "true", ...props });
  return {
    ArrowsClockwise: icon("icon-refresh"),
    CircleNotch: icon("icon-loader"),
    FloppyDisk: icon("icon-save"),
  };
});

const sampleQuery = {
  id: "query-1",
  created_at: "2026-05-27T10:00:00.000Z",
  updated_at: "2026-05-27T10:00:00.000Z",
  source: "homepage-chatbot",
  source_path: "/",
  name: "Anita Sharma",
  company: "Acme Corp",
  email: "anita@example.com",
  phone: "9999999999",
  preferred_contact: "email",
  message: "Need 60 workstations for a Patna office.",
  requirement: "workstations",
  budget: "25 lakh",
  timeline: "1-3 months",
  status: "new" as const,
  followup_channel: "email" as const,
  followup_target: "anita@example.com",
  followup_notes: "Initial intake",
} as const;

const sparseQuery = {
  ...sampleQuery,
  id: "query-2",
  company: null,
  email: null,
  phone: null,
  created_at: "not-a-date",
  message: "Phone-only walk-in enquiry.",
} as const;

function okJson(payload: unknown): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response);
}

function errorJson(status: number, payload: unknown): Promise<Response> {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => payload,
  } as Response);
}

describe("CustomerQueriesOpsPageView — behavior", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders primary heading, labelled shell, filter, actions, and empty sync with absent error", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() => okJson({ items: [] }));
    const { container } = render(<CustomerQueriesOpsPageView />);

    const h1 = screen.getByRole("heading", { level: 1, name: "Customer queries" });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveClass("typ-h1");
    expect(container.querySelector(".customer-queries-ops")).not.toBeNull();
    expect(container.querySelector(".customer-queries-ops")).toHaveClass("container");

    expect(screen.getByText(/Live server inbox with 10-second auto-refresh/i)).toBeInTheDocument();
    expect(screen.getByText("Admin token")).toBeInTheDocument();
    expect(screen.getByLabelText("Admin token")).toBeInTheDocument();
    expect(screen.getByText("Filter")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter")).toBeInTheDocument();
    const filterSelect = screen.getByLabelText("Filter") as HTMLSelectElement;
    expect(filterSelect).toHaveAttribute("id", "customer-queries-status-filter");
    expect(filterSelect).toHaveValue("all");

    const refreshBtn = screen.getByRole("button", { name: "Refresh" });
    expect(refreshBtn).toBeInTheDocument();
    expect(refreshBtn).toHaveAttribute("type", "button");
    expect(screen.getByTestId("icon-refresh")).toBeInTheDocument();

    const applyBtn = screen.getByRole("button", { name: "Apply token" });
    expect(applyBtn).toHaveClass("w-full");
    expect(applyBtn).toHaveAttribute("type", "button");

    const tokenInput = screen.getByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i) as HTMLInputElement;
    expect(tokenInput).toHaveAttribute("type", "password");
    expect(tokenInput).toHaveAttribute("placeholder", "Paste CUSTOMER_QUERIES_ADMIN_TOKEN or use admin session");
    expect(screen.getByText(/Kept in memory for this tab only/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    const emptyCard = (await screen.findByText("No queries yet")).closest("div")?.parentElement;
    expect(emptyCard).not.toBeNull();
    expect(screen.getByText(/^Last sync:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open public contact form/i })).toHaveAttribute("href", "/contact");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Unable to load queries.")).not.toBeInTheDocument();
    expect(container.querySelector(".rounded-xl.border-soft")).not.toBeNull();
  });

  it("uses admin shell heading, status info, hides token chrome, and shows CRM links when embedded", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() => okJson({ items: [] }));
    const { container } = render(<CustomerQueriesOpsPageView embedded />);

    const h1 = screen.getByRole("heading", { level: 1, name: "Customer queries" });
    expect(h1).toHaveClass("admin-page__title");
    expect(container.querySelector(".customer-queries-ops")).toHaveClass("space-y-4");
    expect(screen.getByText(/Live server inbox from contact forms/i)).toBeInTheDocument();
    expect(screen.getByText("CRM & ops")).toBeInTheDocument();
    expect(screen.getAllByText(/Server-backed inbox/i).length).toBeGreaterThanOrEqual(1);
    const infoAlert = container.querySelector('[role="status"]');
    expect(infoAlert).not.toBeNull();

    expect(screen.queryByText("Admin token")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply token" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByText("Filter")).toBeInTheDocument();
    expect(container.querySelector(".admin-toolbar")).not.toBeNull();

    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open public contact form/i })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: /Open CRM hub/i })).toHaveAttribute("href", "/admin/crm");
    expect(screen.queryByText("Kept in memory")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Use token above/i })).not.toBeInTheDocument();
  });

  it("shows network error state with alert, retry, and sync absence", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("offline"));
    const { container } = render(<CustomerQueriesOpsPageView />);

    expect(await screen.findByText("Unable to load queries.")).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Could not load queries");
    expect(alert).toHaveClass("admin-alert");
    expect(screen.getByRole("button", { name: "Retry" })).toHaveAttribute("type", "button");
    expect(screen.getByText("Not synced yet")).toBeInTheDocument();
    expect(screen.queryByText("No queries yet")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/i })).toHaveAttribute("href", "/login");
    expect(container.querySelector(".customer-queries-ops__list")).not.toBeNull();
  });

  it("shows API error message with auth blocked title when manage endpoint rejects", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "bad-token");
    vi.spyOn(global, "fetch").mockImplementation(() => errorJson(401, { error: "Invalid token" }));
    render(<CustomerQueriesOpsPageView />);

    expect(await screen.findByText("Invalid token")).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Sign-in or token required");
    expect(alert).toHaveTextContent("Invalid token");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByText("Not synced yet")).toBeInTheDocument();
    expect(screen.queryByText("No queries yet")).not.toBeInTheDocument();
  });

  it("renders envelope error objects as human-readable alert text with CRM hub when embedded", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      errorJson(401, {
        success: false,
        error: { code: "AUTH_REQUIRED", message: "Unauthorized" },
      }),
    );
    render(<CustomerQueriesOpsPageView embedded />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unauthorized");
    expect(alert).toHaveTextContent("Sign-in or token required");
    expect(screen.getByRole("link", { name: /Open CRM hub/i })).toHaveAttribute("href", "/admin/crm");
    expect(screen.queryByText("No queries yet")).not.toBeInTheDocument();
  });

  it("shows empty inbox after successful load with computed contact link and sync time", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() => okJson({ items: [] }));
    render(<CustomerQueriesOpsPageView />);

    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(screen.getByText(/The inbox is empty/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open public contact form/i })).toHaveAttribute("href", "/contact");
    expect(screen.getByText(/^Last sync:/)).toBeInTheDocument();
    expect(screen.queryByText("Unable to load queries.")).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/customer-queries/manage?"),
      expect.objectContaining({ headers: { "x-admin-token": "secret-token" }, cache: "no-store", credentials: "include" }),
    );
    expect(screen.getAllByRole("button", { name: "Refresh" }).length).toBeGreaterThanOrEqual(1);
    for (const btn of screen.getAllByRole("button", { name: "Refresh" })) {
      expect(btn).not.toBeDisabled();
      expect(btn).toHaveAttribute("data-slot", "button");
    }
  });

  it("loads query rows and renders contact fields with computed article classes and fetch headers", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [sampleQuery] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    const { container } = render(<CustomerQueriesOpsPageView />);

    const heading = await screen.findByRole("heading", { level: 2, name: sampleQuery.name });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("font-semibold");
    const article = heading.closest("article") as HTMLElement;
    expect(article).not.toBeNull();
    expect(article).toHaveClass("rounded-xl");

    expect(screen.getByText(sampleQuery.message)).toHaveClass("whitespace-pre-wrap");
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/homepage-chatbot/)).toBeInTheDocument();
    expect(screen.getByText(/\(\/\)/)).toBeInTheDocument();
    const emailInput = screen.getByDisplayValue(sampleQuery.email) as HTMLInputElement;
    expect(emailInput).toHaveAttribute("type", "text");
    expect(emailInput).toHaveValue(sampleQuery.email);
    expect(within(article).getByDisplayValue(sampleQuery.followup_target)).toHaveAttribute("placeholder", "email / phone");

    const saveBtn = within(article).getByRole("button", { name: "Save" });
    expect(saveBtn).toHaveAttribute("type", "button");
    expect(saveBtn).toHaveClass("min-h-11");
    expect(within(article).getByTestId("icon-save")).toBeInTheDocument();

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Follow-up channel")).toBeInTheDocument();
    expect(screen.getByText("Follow-up target")).toBeInTheDocument();
    expect(screen.getByText("Follow-up notes")).toBeInTheDocument();
    expect(container.querySelector(".customer-queries-ops__list")).not.toBeNull();
    expect(screen.queryByText("No queries yet")).not.toBeInTheDocument();
    expect(screen.queryByText("No queries match this filter")).not.toBeInTheDocument();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/customer-queries/manage?"),
      expect.objectContaining({
        headers: { "x-admin-token": "secret-token" },
        cache: "no-store",
        credentials: "include",
      }),
    );
    const fetchUrl = String(fetchSpy.mock.calls[0][0]);
    expect(fetchUrl).toContain("limit=200");
  });

  it("applies an admin token in memory and reloads with computed header", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    render(<CustomerQueriesOpsPageView />);

    const tokenInput = screen.getByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i) as HTMLInputElement;
    expect(tokenInput).toHaveValue("");
    fireEvent.change(tokenInput, { target: { value: "fresh-token" } });
    expect(tokenInput).toHaveValue("fresh-token");
    const applyBtn = screen.getByRole("button", { name: "Apply token" });
    expect(applyBtn).toHaveClass("w-full");
    fireEvent.click(applyBtn);

    await waitFor(() => expect(window.localStorage.getItem("customer_queries_admin_token")).toBeNull());
    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/customer-queries/manage?"),
      expect.objectContaining({ headers: { "x-admin-token": "fresh-token" } }),
    );
    const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
    expect((lastCall[1] as RequestInit)?.headers).toEqual({ "x-admin-token": "fresh-token" });
  });

  it("clears the admin token from storage and rerenders empty when Apply token is empty", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) {
        const headers = init?.headers as Record<string, string> | undefined;
        if (!headers?.["x-admin-token"]) return okJson({ items: [] });
        return okJson({ items: [sampleQuery] });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    render(<CustomerQueriesOpsPageView />);
    expect(await screen.findByText(sampleQuery.message)).toBeInTheDocument();

    const tokenInput = screen.getByPlaceholderText(/Paste CUSTOMER_QUERIES_ADMIN_TOKEN/i) as HTMLInputElement;
    fireEvent.change(tokenInput, { target: { value: "   " } });
    expect(tokenInput).toHaveValue("   ");
    fireEvent.click(screen.getByRole("button", { name: "Apply token" }));

    await waitFor(() => expect(window.localStorage.getItem("customer_queries_admin_token")).toBeNull());
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/customer-queries/manage?"),
        expect.objectContaining({ headers: undefined }),
      ),
    );
    const clearedCalls = fetchSpy.mock.calls.filter(([, init]) => !(init as RequestInit)?.headers);
    expect(clearedCalls.length).toBeGreaterThan(0);
    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(screen.queryByText(sampleQuery.message)).not.toBeInTheDocument();
    expect(screen.getByText(/^Last sync:/)).toBeInTheDocument();
  });

  it("saves draft status and follow-up fields through PATCH with computed body and headers", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) return okJson({ items: [sampleQuery] });
      if (input === "/api/customer-queries/manage" && init?.method === "PATCH") {
        return okJson({
          item: { ...sampleQuery, status: "closed", followup_channel: "phone", followup_target: "8888888888", followup_notes: "Called and qualified." },
        });
      }
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    render(<CustomerQueriesOpsPageView />);

    const article = (await screen.findByText(sampleQuery.message)).closest("article") as HTMLElement;
    expect(article).not.toBeNull();
    const scoped = within(article);
    expect(scoped.getByText("Status")).toBeInTheDocument();

    const [statusSelect, channelSelect] = scoped.getAllByRole("combobox");
    expect(statusSelect).toHaveValue("new");
    fireEvent.change(statusSelect, { target: { value: "closed" } });
    expect(statusSelect).toHaveValue("closed");
    expect(channelSelect).toHaveValue("email");
    fireEvent.change(channelSelect, { target: { value: "phone" } });
    expect(channelSelect).toHaveValue("phone");

    const targetInput = scoped.getByPlaceholderText("email / phone") as HTMLInputElement;
    expect(targetInput).toHaveValue(sampleQuery.followup_target);
    fireEvent.change(targetInput, { target: { value: "8888888888" } });
    expect(targetInput).toHaveValue("8888888888");

    const notesInput = scoped.getByPlaceholderText("Call summary, next action, etc.") as HTMLTextAreaElement;
    fireEvent.change(notesInput, { target: { value: "Called and qualified." } });
    expect(notesInput).toHaveValue("Called and qualified.");

    const saveBtn = scoped.getByRole("button", { name: "Save" });
    expect(saveBtn).toHaveClass("min-h-11");
    fireEvent.click(saveBtn);

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/customer-queries/manage",
        expect.objectContaining({
          method: "PATCH",
          credentials: "include",
          headers: expect.objectContaining({ "Content-Type": "application/json", "x-admin-token": "secret-token" }),
        }),
      ),
    );
    const patchCall = fetchSpy.mock.calls.find(([, init]) => init?.method === "PATCH");
    expect(patchCall).toBeDefined();
    expect(patchCall?.[0]).toBe("/api/customer-queries/manage");
    const patchInit = patchCall?.[1] as RequestInit;
    expect(patchInit.body).toBeDefined();
    expect(JSON.parse(String(patchInit.body))).toEqual(
      expect.objectContaining({ id: sampleQuery.id, status: "closed", followUpChannel: "phone", followUpTarget: "8888888888", followUpNotes: "Called and qualified." }),
    );
    expect(scoped.getByTestId("icon-save")).toBeInTheDocument();
  });

  it("surfaces save failure errors from the manage endpoint with alert", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) return okJson({ items: [sampleQuery] });
      if (input === "/api/customer-queries/manage" && init?.method === "PATCH") return errorJson(400, { error: "Save rejected" });
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    render(<CustomerQueriesOpsPageView />);

    const article = (await screen.findByText(sampleQuery.message)).closest("article") as HTMLElement;
    fireEvent.click(within(article).getByRole("button", { name: "Save" }));

    const alert = await screen.findByText("Save rejected");
    expect(alert).toBeInTheDocument();
    expect(alert.closest('[role="alert"]') ?? screen.getByRole("alert")).toHaveTextContent("Save rejected");
    expect(screen.queryByText("No queries yet")).not.toBeInTheDocument();
  });

  it("filters by status and refetches with computed status query param", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.includes("/api/customer-queries/manage?") && input.includes("status=spam")) return okJson({ items: [] });
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) return okJson({ items: [sampleQuery] });
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    render(<CustomerQueriesOpsPageView />);
    expect(await screen.findByText(sampleQuery.message)).toBeInTheDocument();

    const filterSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    expect(filterSelect).toHaveValue("all");
    fireEvent.change(filterSelect, { target: { value: "spam" } });
    expect(filterSelect).toHaveValue("spam");

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("status=spam"),
        expect.objectContaining({ headers: { "x-admin-token": "secret-token" } }),
      ),
    );
    const spamCall = fetchSpy.mock.calls.find(([url]) => String(url).includes("status=spam"));
    expect(String(spamCall?.[0])).toContain("status=spam");
    expect(String(spamCall?.[0])).toContain("limit=200");
    expect(await screen.findByText("No queries match this filter")).toBeInTheDocument();
    expect(screen.getByText(/Nothing with status.*spam/i)).toBeInTheDocument();
    expect(screen.queryByText(sampleQuery.message)).not.toBeInTheDocument();
  });

  it("refetches the inbox when Refresh is clicked with call count growth", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) return okJson({ items: [sampleQuery] });
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    const { container } = render(<CustomerQueriesOpsPageView />);
    await screen.findByText(sampleQuery.message);

    const initialCalls = fetchSpy.mock.calls.length;
    const refreshBtn = screen.getByRole("button", { name: "Refresh" });
    expect(refreshBtn).toHaveAttribute("data-slot", "button");
    expect(refreshBtn).toHaveAttribute("data-variant", "outline");
    fireEvent.click(refreshBtn);
    await waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCalls));
    expect(fetchSpy.mock.calls.length).toBe(initialCalls + 1);
    expect(container.querySelector(".customer-queries-ops__list")).not.toBeNull();
  });

  it("retries a 403 PATCH after bootstrapping a CSRF token with count growth", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    let patchCalls = 0;
    vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      const url = String(input);
      if (url.includes("/api/csrf")) return okJson({ token: "csrf-token" });
      if (url.startsWith("/api/customer-queries/manage?")) {
        return okJson({ items: [{ ...sampleQuery, followup_target: null, followup_notes: null, source_path: null }] });
      }
      if (url === "/api/customer-queries/manage" && init?.method === "PATCH") {
        patchCalls += 1;
        if (patchCalls === 1) return errorJson(403, { error: "csrf" });
        return okJson({ item: { ...sampleQuery, status: "in_progress" } });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    render(<CustomerQueriesOpsPageView />);
    const article = (await screen.findByText(sampleQuery.message)).closest("article") as HTMLElement;
    const sourceEl = article.querySelector("p.text-xs");
    expect(sourceEl?.textContent).not.toContain("(");
    fireEvent.click(within(article).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(patchCalls).toBe(2));
    expect(patchCalls).toBe(2);
  });

  it("treats a non-array inbox payload as empty with last sync", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    vi.spyOn(global, "fetch").mockImplementation(() => okJson({ items: { not: "an-array" } }));
    render(<CustomerQueriesOpsPageView />);
    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(screen.getByText(/^Last sync:/)).toBeInTheDocument();
    expect(screen.queryByText(sampleQuery.message)).not.toBeInTheDocument();
  });

  it("surfaces a generic update error when PATCH throws with alert", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) return okJson({ items: [sampleQuery] });
      if (input === "/api/customer-queries/manage" && init?.method === "PATCH") return Promise.reject(new Error("offline"));
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    render(<CustomerQueriesOpsPageView />);
    const article = (await screen.findByText(sampleQuery.message)).closest("article") as HTMLElement;
    fireEvent.click(within(article).getByRole("button", { name: "Save" }));
    const alert = await screen.findByText("Unable to update query.");
    expect(alert).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to update query.");
  });

  it("clears a status filter from the empty-match state with computed heading", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.includes("status=spam")) return okJson({ items: [] });
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) return okJson({ items: [sampleQuery] });
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    render(<CustomerQueriesOpsPageView />);
    expect(await screen.findByText(sampleQuery.message)).toBeInTheDocument();
    const filterSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    fireEvent.change(filterSelect, { target: { value: "spam" } });
    expect(filterSelect).toHaveValue("spam");
    expect(await screen.findByText("No queries match this filter")).toBeInTheDocument();
    const showAllBtn = screen.getByRole("button", { name: "Show all statuses" });
    expect(showAllBtn).toHaveAttribute("type", "button");
    expect(showAllBtn).toHaveAttribute("data-slot", "button");
    expect(showAllBtn).toHaveAttribute("data-variant", "primary");
    fireEvent.click(showAllBtn);
    expect(await screen.findByText(sampleQuery.message)).toBeInTheDocument();
    expect(screen.getByDisplayValue("anita@example.com")).toBeInTheDocument();
  });

  it("retries a failed load from the error alert with success recovery", async () => {
    let shouldFail = true;
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() => {
      if (shouldFail) return Promise.reject(new Error("offline"));
      return okJson({ items: [] });
    });
    render(<CustomerQueriesOpsPageView />);
    expect(await screen.findByText("Unable to load queries.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load queries");
    shouldFail = false;
    const retryBtn = screen.getByRole("button", { name: "Retry" });
    expect(retryBtn).toHaveAttribute("type", "button");
    fireEvent.click(retryBtn);
    expect(await screen.findByText("No queries yet")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Unable to load queries.")).not.toBeInTheDocument();
  });

  it("renders sparse contact placeholders when email and phone are missing with formatted date", async () => {
    window.localStorage.setItem("customer_queries_admin_token", "secret-token");
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (typeof input === "string" && input.startsWith("/api/customer-queries/manage?")) return okJson({ items: [sparseQuery] });
      throw new Error(`Unexpected fetch: ${String(input)}`);
    });
    const { container } = render(<CustomerQueriesOpsPageView />);
    expect(await screen.findByText(sparseQuery.message)).toBeInTheDocument();
    const article = screen.getByText(sparseQuery.message).closest("article") as HTMLElement;
    expect(article).not.toBeNull();
    expect(within(article).getByText(/No email/)).toBeInTheDocument();
    expect(within(article).getByText(/No phone/)).toBeInTheDocument();
    expect(screen.getByText("not-a-date")).toBeInTheDocument();
    expect(screen.queryByText(/Need 60 workstations/i)).not.toBeInTheDocument();
    // Draft hydration falls back to followup_target; sparse has null -> empty string, but initial sample still hydrates. Assert placeholder + absence of sample message.
    expect(within(article).getByPlaceholderText("email / phone")).toBeInTheDocument();
    const targetInputs = within(article).getAllByPlaceholderText("email / phone");
    expect(targetInputs[0]).toHaveAttribute("placeholder", "email / phone");
    expect(container.querySelector(".rounded-xl")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByTestId("icon-save")).toBeInTheDocument();
  });
});

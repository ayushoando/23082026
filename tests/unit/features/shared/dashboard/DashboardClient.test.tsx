import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { DashboardClient } from "@/features/shared/dashboard/DashboardClient";
import { signOutFromSupabase } from "@/lib/auth/supabaseServerActions";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/auth/supabaseServerActions", () => ({
  signOutFromSupabase: vi.fn(async () => ({ success: true })),
}));

// Mock workspaceHub
vi.mock("@/features/shared/dashboard/workspaceHub", () => ({
  WORKSPACE_HUB_SECTIONS: [
    {
      title: "Category One",
      summary: "Category summary",
      items: [
        {
          label: "Item One",
          description: "Item description",
          href: "/dest-one",
          icon: () => <span />,
        },
      ],
    },
  ],
}));

describe("DashboardClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders correctly with userEmail and static data", () => {
    render(<DashboardClient userEmail="user@example.com" />);

    expect(screen.getByText(/Signed in as user@example.com/)).toBeDefined();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Your office furniture planner hub/i,
      }),
    ).toBeDefined();
    expect(screen.getByText("Item One")).toBeDefined();
    expect(screen.getByText("Item description")).toBeDefined();
  });

  it("handles sign out correctly", async () => {
    render(<DashboardClient userEmail="user@example.com" />);

    const signOutBtn = screen.getByRole("button", { name: "Sign out" });
    fireEvent.click(signOutBtn);

    expect(screen.getByText("Signing out...")).toBeDefined();

    await waitFor(() => {
      expect(signOutFromSupabase).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/access?direct=true");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("still leaves the dashboard when server sign-out reports failure", async () => {
    vi.mocked(signOutFromSupabase).mockResolvedValueOnce({ success: false });
    render(<DashboardClient userEmail="user@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(signOutFromSupabase).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/access?direct=true");
    });
  });
});

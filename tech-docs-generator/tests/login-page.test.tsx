import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();

vi.mock("../src/lib/supabaseClient", () => ({
  getAuthSupabaseClient: () => ({
    auth: { signInWithPassword },
  }),
}));

import { LoginPage } from "../src/auth/LoginPage";

describe("LoginPage", () => {
  afterEach(() => {
    signInWithPassword.mockReset();
  });

  it("shows a friendly message for invalid credentials", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => {
      expect(screen.getByText("Email or password is incorrect.")).toBeTruthy();
    });
  });

  it("surfaces thrown client errors", async () => {
    signInWithPassword.mockRejectedValue(new Error("network down"));
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => {
      expect(screen.getByText("network down")).toBeTruthy();
    });
  });
});

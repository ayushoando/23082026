import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const unsubscribe = vi.fn();
const getSession = vi.fn();
const signOut = vi.fn();
const onAuthStateChange = vi.fn();

vi.mock("../../tech-docs-generator/src/lib/supabaseClient", () => ({
  getAuthSupabaseClient: () => ({
    auth: { getSession, onAuthStateChange, signOut },
  }),
}));

import {
  AuthProvider,
  signOutDocsSession,
  useSession,
} from "../../tech-docs-generator/src/auth/AuthProvider";

function Probe() {
  const s = useSession();
  return <div data-testid="status">{s.status}</div>;
}

afterEach(() => {
  unsubscribe.mockReset();
  getSession.mockReset();
  signOut.mockReset();
  onAuthStateChange.mockReset();
});

describe("AuthProvider", () => {
  it("starts loading then becomes unauthenticated when there is no session", async () => {
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    getSession.mockResolvedValue({ data: { session: null } });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId("status").textContent).toBe("loading");
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    });
  });

  it("authenticates when getSession returns an admin user", async () => {
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "u1",
            email: "a@oando.co.in",
            app_metadata: { role: "admin" },
          },
        },
      },
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });
  });

  it("prefers onAuthStateChange over a late getSession", async () => {
    let send: ((event: string, session: unknown) => void) | undefined;
    onAuthStateChange.mockImplementation((cb: (e: string, s: unknown) => void) => {
      send = cb;
      return { data: { subscription: { unsubscribe } } };
    });
    let resolveSession: (v: unknown) => void = () => {};
    getSession.mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      send?.("SIGNED_IN", {
        user: { id: "u2", email: "b@oando.co.in", app_metadata: { role: "member" } },
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });
    await act(async () => {
      resolveSession({ data: { session: null } });
    });
    expect(screen.getByTestId("status").textContent).toBe("authenticated");
  });

  it("getSession reject becomes unauthenticated", async () => {
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    getSession.mockRejectedValue(new Error("network"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
    });
  });

  it("signOutDocsSession calls supabase signOut", async () => {
    signOut.mockResolvedValue({});
    await signOutDocsSession();
    expect(signOut).toHaveBeenCalled();
  });

  it("unsubscribes on unmount", async () => {
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    getSession.mockResolvedValue({ data: { session: null } });
    const { unmount } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

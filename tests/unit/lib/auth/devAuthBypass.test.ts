// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import {
  DEV_BYPASS_USER,
  isDevAuthBypassActiveForRequest,
  isDevAuthBypassEnabled,
  isDevAuthBypassRequestAllowed,
  isLoopbackHost,
} from "@/lib/auth/devAuthBypass";
import { resolveAuthContext } from "@/features/shared/api/withAuth";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("DEV_BYPASS_USER", () => {
  it("uses a Postgres-valid UUID (oando_plans.user_id is uuid)", () => {
    expect(DEV_BYPASS_USER.id).toMatch(UUID_RE);
    // Guard against the historical non-hex suffix `…000dev`.
    expect(DEV_BYPASS_USER.id.toLowerCase()).not.toContain("dev");
  });
});

/**
 * Env matrix for isDevAuthBypassEnabled.
 * CSRF skip when bypass is on is covered in withAuth.test.ts (requireCsrf path).
 */
describe("isDevAuthBypassEnabled", () => {
  it.each([
    {
      name: "false by default (development, flag unset)",
      env: { NODE_ENV: "development" },
      expected: false,
    },
    {
      name: "true in development when DEV_AUTH_BYPASS=1",
      env: { NODE_ENV: "development", DEV_AUTH_BYPASS: "1" },
      expected: true,
    },
    {
      name: "false when DEV_AUTH_BYPASS is not exactly 1",
      env: { NODE_ENV: "development", DEV_AUTH_BYPASS: "true" },
      expected: false,
    },
    {
      name: "false in production even with DEV_AUTH_BYPASS=1",
      env: { NODE_ENV: "production", DEV_AUTH_BYPASS: "1" },
      expected: false,
    },
  ] as const)("$name", ({ env, expected }) => {
    process.env = {
      ...originalEnv,
      NODE_ENV: env.NODE_ENV,
    };
    delete process.env.DEV_AUTH_BYPASS;
    if ("DEV_AUTH_BYPASS" in env && env.DEV_AUTH_BYPASS !== undefined) {
      process.env.DEV_AUTH_BYPASS = env.DEV_AUTH_BYPASS;
    }
    expect(isDevAuthBypassEnabled(process.env)).toBe(expected);
  });
});

describe("resolveAuthContext with bypass", () => {
  it("returns synthetic admin when bypass enabled on a loopback host", async () => {
    setNodeEnv("development");
    process.env.DEV_AUTH_BYPASS = "1";
    const auth = await resolveAuthContext("admin", {
      requestHost: "localhost:3000",
    });
    expect(auth.isAdmin).toBe(true);
    expect(auth.user?.id).toBe(DEV_BYPASS_USER.id);
    expect(auth.user?.email).toBe(DEV_BYPASS_USER.email);
  });

  it("still synthesizes admin for member/guest required roles under bypass", async () => {
    setNodeEnv("development");
    process.env.DEV_AUTH_BYPASS = "1";
    const member = await resolveAuthContext("member", {
      requestHost: "127.0.0.1:3000",
    });
    expect(member.isAdmin).toBe(true);
    expect(member.user?.id).toBe(DEV_BYPASS_USER.id);
    expect(member.requiredRole).toBe("member");

    const guest = await resolveAuthContext("guest", {
      requestHost: "localhost",
    });
    expect(guest.isAdmin).toBe(true);
    expect(guest.user?.id).toBe(DEV_BYPASS_USER.id);
    expect(guest.requiredRole).toBe("guest");
  });

  it("falls through to real session checks for non-loopback hosts (7.1 fail-closed)", async () => {
    setNodeEnv("development");
    process.env.DEV_AUTH_BYPASS = "1";
    // Guest required-role never throws — it just reports no admin.
    const staging = await resolveAuthContext("guest", {
      requestHost: "staging.example.com",
    });
    expect(staging.isAdmin).toBe(false);
    // No request host (outside request scope) also fails closed.
    const hostless = await resolveAuthContext("guest", { requestHost: null });
    expect(hostless.isAdmin).toBe(false);
  });
});

describe("7.1 allowed-host guard", () => {
  afterEach(() => {
    delete process.env.DEV_AUTH_BYPASS_ALLOW_HOSTS;
  });

  it.each([
    "localhost",
    "localhost:3000",
    "admin.localhost",
    "127.0.0.1",
    "127.9.9.9:4000",
    "[::1]",
    "[::1]:5173",
    "::1",
  ])("treats %s as loopback", (host) => {
    expect(isLoopbackHost(host)).toBe(true);
  });

  it.each(["example.com", "0.0.0.0", "192.168.1.10", "", null, undefined])(
    "does not treat %s as loopback",
    (host) => {
      expect(isLoopbackHost(host)).toBe(false);
    },
  );

  it("allows loopback hosts regardless of allowlist env", () => {
    expect(isDevAuthBypassRequestAllowed("localhost:3000")).toBe(true);
  });

  it("denies non-loopback hosts without the allowlist env", () => {
    expect(isDevAuthBypassRequestAllowed("staging.internal:3000")).toBe(false);
    expect(isDevAuthBypassRequestAllowed(null)).toBe(false);
    expect(isDevAuthBypassRequestAllowed(undefined)).toBe(false);
  });

  it("honors explicit DEV_AUTH_BYPASS_ALLOW_HOSTS entries (port ignored)", () => {
    process.env.DEV_AUTH_BYPASS_ALLOW_HOSTS =
      " Staging.internal:3000 , 10.0.0.8 ";
    expect(isDevAuthBypassRequestAllowed("staging.internal:8080")).toBe(true);
    expect(isDevAuthBypassRequestAllowed("10.0.0.8")).toBe(true);
    expect(isDevAuthBypassRequestAllowed("other.internal")).toBe(false);
  });

  it("combined decision: flag + loopback in non-prod only", () => {
    expect(
      isDevAuthBypassActiveForRequest("localhost:3000", {
        NODE_ENV: "development",
        DEV_AUTH_BYPASS: "1",
      }),
    ).toBe(true);
    // Production fails closed even on loopback with the flag set.
    expect(
      isDevAuthBypassActiveForRequest("localhost:3000", {
        NODE_ENV: "production",
        DEV_AUTH_BYPASS: "1",
      }),
    ).toBe(false);
    // Non-production loopback without the flag fails closed.
    expect(
      isDevAuthBypassActiveForRequest("localhost:3000", {
        NODE_ENV: "development",
      }),
    ).toBe(false);
  });
});

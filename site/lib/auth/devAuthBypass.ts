/**
 * Development auth bypass for admin/UI/API.
 *
 * ENABLED only when:
 *   - DEV_AUTH_BYPASS=1 (server env), AND
 *   - NODE_ENV is not "production"
 *
 * Never enable in production builds/deployments. Playwright/dev webServer
 * should set DEV_AUTH_BYPASS=1 only for local/CI non-prod servers.
 */

export const DEV_AUTH_BYPASS_ENV = "DEV_AUTH_BYPASS" as const;

export type DevBypassUser = {
  id: string;
  email: string;
  role: "admin";
};

/**
 * Stable synthetic admin for bypass sessions.
 * Must be a real UUID (hex only) — oando_plans.user_id and profiles.id are uuid.
 * The old suffix `…000dev` is not valid hex and broke every portal/list query.
 */
export const DEV_BYPASS_USER: DevBypassUser = {
  id: "00000000-0000-4000-8000-0000000000d1",
  email: "dev-bypass@localhost",
  role: "admin",
};

/**
 * True when server-side auth may be short-circuited for local/dev E2E.
 * Production always returns false even if the env flag is set.
 */
function readFlag(env: NodeJS.ProcessEnv, key: string): string | undefined {
  // Dynamic key access avoids some bundlers inlining missing env as undefined.
  return env[key];
}

export function isDevAuthBypassEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const bypass = readFlag(env, DEV_AUTH_BYPASS_ENV);
  const nodeEnv = readFlag(env, "NODE_ENV");

  if (nodeEnv === "production") {
    return false;
  }
  return bypass === "1";
}

/**
 * Allowlist escape hatch for 7.1: comma-separated request hosts that may use
 * the bypass on an explicitly non-loopback dev host (e.g. `DEV_AUTH_BYPASS_ALLOW_HOSTS=staging.internal:3000`).
 * Loopback hosts are always allowed when the env flag is set; anything else
 * must appear here verbatim (host, port ignored).
 */
export const DEV_AUTH_BYPASS_ALLOW_HOSTS_ENV = "DEV_AUTH_BYPASS_ALLOW_HOSTS" as const;

/** True for loopback-style request hosts: `localhost`, `*.localhost`, `127.0.0.0/8`, `::1` (port ignored). */
export function isLoopbackHost(host: string | null | undefined): boolean {
  if (!host) {
    return false;
  }
  const trimmed = host.trim().toLowerCase();
  if (!trimmed) {
    return false;
  }
  // Bracketed IPv6 (`[::1]` or `[::1]:3000`): extract the literal first so the
  // port-strip below cannot mangle it.
  const bracketed = trimmed.match(/^\[(.+)\](?::\d+)?$/);
  let bare: string;
  if (bracketed) {
    bare = bracketed[1];
  } else if ((trimmed.match(/:/g) ?? []).length === 1) {
    // Exactly one colon → `host:port`; strip the port.
    bare = trimmed.replace(/:\d+$/, "");
  } else {
    // Unbracketed multi-colon → bare IPv6 literal (e.g. `::1`); keep as-is.
    bare = trimmed;
  }
  bare = bare.replace(/^\[|\]$/g, "");
  if (!bare) {
    return false;
  }
  if (bare === "localhost" || bare.endsWith(".localhost")) {
    return true;
  }
  if (bare === "::1") {
    return true;
  }
  return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(bare);
}

/**
 * 7.1 allowed-host guard: even with `DEV_AUTH_BYPASS=1` set in a
 * non-production environment, only loopback request hosts (or hosts listed in
 * `DEV_AUTH_BYPASS_ALLOW_HOSTS`) may exercise the synthetic admin. Deployed
 * non-production hosts (staging containers, networked `next dev`) therefore
 * fail closed instead of granting `DEV_BYPASS_USER` full admin access.
 */
export function isDevAuthBypassRequestAllowed(
  host: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (isLoopbackHost(host)) {
    return true;
  }
  const allow = readFlag(env, DEV_AUTH_BYPASS_ALLOW_HOSTS_ENV) ?? "";
  const bareHost = (host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  if (!bareHost) {
    return false;
  }
  return allow
    .split(",")
    .map((entry) => entry.trim().toLowerCase().replace(/:\d+$/, ""))
    .filter(Boolean)
    .includes(bareHost);
}

/** Combined env + request-host decision for the dev bypass (fail closed). */
export function isDevAuthBypassActiveForRequest(
  host: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isDevAuthBypassEnabled(env) && isDevAuthBypassRequestAllowed(host, env);
}

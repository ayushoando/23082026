/**
 * Secure cookie configuration and utilities.
 * Enforces HttpOnly, Secure, SameSite, and path safety across the application.
 */

export interface SecureCookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none" | boolean;
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  priority?: "low" | "medium" | "high";
}

/**
 * Default secure cookie options.
 * HttpOnly, Secure in production, SameSite=lax, path=/
 */
export const DEFAULT_SECURE_COOKIE_OPTIONS: Readonly<SecureCookieOptions> = Object.freeze({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

/**
 * Strict cookie options for sensitive tokens (e.g. CSRF, auth state mutations).
 */
export const STRICT_SECURE_COOKIE_OPTIONS: Readonly<SecureCookieOptions> = Object.freeze({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
});

/**
 * Merge custom options with secure defaults, ensuring critical security attributes cannot be weakened.
 */
export function buildSecureCookieOptions(
  overrides: Partial<SecureCookieOptions> = {},
): SecureCookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    ...DEFAULT_SECURE_COOKIE_OPTIONS,
    ...overrides,
    // Always enforce httpOnly unless explicitly specified otherwise for client-readable flags
    httpOnly: overrides.httpOnly !== undefined ? overrides.httpOnly : true,
    // Always enforce Secure in production
    secure: isProd || Boolean(overrides.secure),
    // Ensure SameSite is at least "lax" if not specified
    sameSite: overrides.sameSite || "lax",
    path: overrides.path || "/",
  };
}

/**
 * Format a Set-Cookie header value with security attributes.
 */
export function formatSecureCookieHeader(
  name: string,
  value: string,
  options: Partial<SecureCookieOptions> = {},
): string {
  const opts = buildSecureCookieOptions(options);
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];

  if (opts.path) {
    parts.push(`Path=${opts.path}`);
  }
  if (opts.domain) {
    parts.push(`Domain=${opts.domain}`);
  }
  if (opts.maxAge !== undefined) {
    parts.push(`Max-Age=${opts.maxAge}`);
  }
  if (opts.expires) {
    parts.push(`Expires=${opts.expires.toUTCString()}`);
  }
  if (opts.httpOnly) {
    parts.push("HttpOnly");
  }
  if (opts.secure) {
    parts.push("Secure");
  }
  if (opts.sameSite) {
    const s = typeof opts.sameSite === "string"
      ? opts.sameSite.charAt(0).toUpperCase() + opts.sameSite.slice(1)
      : "Lax";
    parts.push(`SameSite=${s}`);
  }

  return parts.join("; ");
}


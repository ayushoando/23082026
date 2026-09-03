/**
 * Security utilities for sanitizing content injected via dangerouslySetInnerHTML.
 * Prevents XSS attacks by escaping characters that could break out of JSON-LD script blocks.
 */

/**
 * Sanitize JSON data for safe injection into <script> tags.
 * Escapes <, >, and & to prevent script injection attacks.
 */
export function sanitizeJsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Strip script tags and inline event handlers from trusted-but-inline SVG markup. */
export function sanitizeInlineSvg(markup: string): string {
  return markup
    // Paired and self-closing script nodes (SVG XSS vectors).
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    // foreignObject can host HTML/script in some browsers.
    .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<foreignObject\b[^>]*\/>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function stripControlChars(str: string): string {
  let res = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Keep tab (9), newline (10), carriage return (13), and non-control characters (>= 32 except 127)
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) {
      res += str[i];
    }
  }
  return res;
}

/**
 * Sanitize plain user text input for forms, query params, and storage.
 * Strips HTML tags, script injection vectors, null bytes, and control characters.
 */
export function sanitizeInput(input: unknown, maxLen = 3000): string {
  if (typeof input !== "string") {
    return "";
  }
  const cleaned = stripControlChars(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  return cleaned.slice(0, maxLen);
}

/**
 * Sanitize query parameters from URL search params.
 */
export function sanitizeQueryParam(input: unknown, maxLen = 500): string {
  if (typeof input !== "string") {
    return "";
  }
  return sanitizeInput(input, maxLen);
}

/**
 * Escape HTML special characters to prevent XSS when reflecting values.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Strip all HTML markup and normalize whitespace.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Recursively sanitize all string properties in a form data payload.
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "string") {
      result[key] = sanitizeInput(val);
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = sanitizeFormData(val as Record<string, unknown>);
    } else if (Array.isArray(val)) {
      result[key] = val.map((item) =>
        typeof item === "string" ? sanitizeInput(item) : item,
      );
    } else {
      result[key] = val;
    }
  }
  return result as T;
}


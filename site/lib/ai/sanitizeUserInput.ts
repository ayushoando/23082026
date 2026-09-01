/**
 * Prompt-injection guard for user-supplied text interpolated into AI prompts
 * or system messages (remediation AI-FIX-08).
 *
 * Collapses newlines, strips the injection-prone `< > { }` characters, trims,
 * and caps the length. Shared by the server advisor paths and the browser
 * planner client, so this module must stay free of `server-only` imports.
 */
export function sanitizeUserInput(input: string, maxLen = 500): string {
  return input
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/[<>{}]/g, "")
    .trim()
    .slice(0, maxLen);
}

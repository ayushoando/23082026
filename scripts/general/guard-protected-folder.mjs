#!/usr/bin/env node
/**
 * Guard script for docs/protected-folder.
 * Enforces safety when called as an Antigravity hook (via stdin JSON payload)
 * or when called directly as a shell hook.
 */

let inputData = "";

process.stdin.setEncoding("utf8");

const timer = setTimeout(() => {
  // If no stdin received within 150ms, exit cleanly
  process.exit(0);
}, 150);

process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  clearTimeout(timer);
  if (!inputData.trim()) {
    process.exit(0);
  }

  try {
    const payload = JSON.parse(inputData);
    const serialized = JSON.stringify(payload).toLowerCase();

    // Check if any tool args or path targets docs/protected-folder
    if (
      serialized.includes("docs/protected-folder") ||
      serialized.includes("docs\\protected-folder") ||
      serialized.includes("docs\\\\protected-folder")
    ) {
      const output = {
        decision: "deny",
        reason: "Access denied: docs/protected-folder is protected by .agentsignore and repository safety hooks."
      };
      process.stdout.write(JSON.stringify(output) + "\n");
      process.exit(1);
    }

    // Default allow
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
    process.exit(0);
  } catch {
    // If not JSON, exit cleanly
    process.exit(0);
  }
});

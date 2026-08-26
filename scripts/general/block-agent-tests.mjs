#!/usr/bin/env node
// PreToolUse guard: block agents from running test/gate commands.
// The user runs tests, not the agent. Reads hook JSON from stdin.
// Exit 2 = block (stderr shown to agent). Exit 0 = allow.

import { readFileSync } from "node:fs";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// Patterns that indicate a test/gate/coverage run. Matched case-insensitively
// against the command string the agent is about to execute. The hook payload
// does not expose a trusted user-vs-agent or skill-invocation signal, so this
// guard remains unconditional even when the user has asked about verify-and-gate.
const BLOCKED = [
  /\b(?:vitest|jest|playwright|mocha|cypress|pytest|phpunit)\b/,
  /\b(?:node\s+--test|go\s+test|cargo\s+test|dotnet\s+test)\b/,
  /\b(?:pnpm|npm|yarn|bun)\s+(?:exec\s+)?(?:run\s+)?(?:test|test:[\w-]+|coverage|coverage:[\w-]+|gate|gate:[\w-]+|release:gate|p0:unit|typecheck:tests|test:priority-[\w-]+|check:layout)\b/,
  /\b(?:test:coverage|test:a11y|test:audit(?:[:\w-]*)?|test:planner-catalog)\b/,
  /\b(?:node|python|python3)\s+.*(?:\b(?:vitest|jest|playwright|pytest|unittest)\b|(?:^|\W)(?:test|tests)\.(?:mjs|cjs|js|py)\b)/,
];

function extractCommand(payload) {
  // Be liberal: the shape of the hook payload can vary. Search common fields
  // and fall back to the whole blob.
  const candidates = [];
  if (payload && typeof payload === "object") {
    const ti = payload.tool_input ?? payload.toolInput ?? payload.input ?? {};
    for (const key of ["command", "shellCommand", "cmd"]) {
      if (typeof ti[key] === "string") candidates.push(ti[key]);
      if (typeof payload[key] === "string") candidates.push(payload[key]);
    }
    if (Array.isArray(ti.args)) candidates.push(ti.args.join(" "));
  }
  return candidates;
}

const raw = readStdin();
let payload = null;
try {
  payload = JSON.parse(raw);
} catch {
  // Not JSON — scan the raw text as a last resort.
}

const commands = payload ? extractCommand(payload) : [];
const haystacks = commands.length ? commands : [raw];

for (const cmd of haystacks) {
  if (typeof cmd !== "string") continue;
  const lc = cmd.toLowerCase();
  for (const re of BLOCKED) {
    if (re.test(lc)) {
      process.stderr.write(
        "BLOCKED: agents may not run tests or gates in this repo. " +
          "Tests are user-driven. Tell the user which command to run " +
          "(e.g. the one you were about to run) and let them trigger it.\n"
      );
      process.exit(2);
    }
  }
}

process.exit(0);

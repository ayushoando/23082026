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
// against the command string the agent is about to execute.
const BLOCKED = [
  /\bvitest\b/,
  /\bjest\b/,
  /\bplaywright\b/,
  /pnpm\s+(run\s+)?test\b/,
  /pnpm\s+(run\s+)?test:/,
  /pnpm\s+(run\s+)?gate\b/,
  /pnpm\s+(run\s+)?gate:fast\b/,
  /pnpm\s+(run\s+)?release:gate/,
  /\btest:coverage\b/,
  /\btest:a11y\b/,
  /\btest:audit\b/,
  /\btest:planner-catalog\b/,
];

function extractCommand(payload) {
  // Be liberal: the shape of the hook payload can vary. Search common fields
  // and fall back to the whole blob.
  const candidates = [];
  if (payload && typeof payload === "object") {
    const ti = payload.tool_input ?? payload.toolInput ?? payload.input ?? {};
    if (typeof ti.command === "string") candidates.push(ti.command);
    if (typeof payload.command === "string") candidates.push(payload.command);
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

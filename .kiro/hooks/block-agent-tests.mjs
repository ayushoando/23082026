import { readFileSync } from "node:fs";

const BLOCKED_SCRIPT =
  String.raw`(?:[\w-]+:)*(?:test|gate|coverage|build|typecheck|e2e|playwright|browser|dev|start|serve|preview)(?::[\w-]+)*`;

const BLOCKED = [
  new RegExp(
    String.raw`\bpnpm(?:\.cmd)?\s+(?:run\s+)?(?:${BLOCKED_SCRIPT}|check:layout)\b`,
    "i",
  ),
  new RegExp(
    String.raw`\b(?:npm|yarn|bun)(?:\.cmd)?\s+(?:run\s+)?${BLOCKED_SCRIPT}\b`,
    "i",
  ),
  /\b(?:npx|pnpm(?:\.cmd)?\s+(?:exec|dlx))\s+(?:vitest|playwright|jest|cypress|next\s+(?:build|dev|start))\b/i,
  /(?:^|[;&|]\s*|\s)(?:vitest|playwright|jest|cypress)(?:\.cmd)?(?:\s|$)/i,
  /\bnext(?:\.cmd)?\s+(?:build|dev|start)\b/i,
  /\bdocker(?:\.exe)?\s+(?:compose\s+)?(?:up|run|start|restart|build)\b/i,
  /\bdocker-compose(?:\.exe)?\s+(?:up|run|start|restart|build)\b/i,
];

const COMMAND_KEYS = new Set(["command", "shellCommand", "cmd"]);

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function extractCommands(value, commands = [], seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) {
    return commands;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      extractCommands(item, commands, seen);
    }
    return commands;
  }

  for (const [key, field] of Object.entries(value)) {
    if (COMMAND_KEYS.has(key) && typeof field === "string") {
      commands.push(field);
      continue;
    }

    if (key === "args" && Array.isArray(field)) {
      const args = field.filter((item) => typeof item === "string");
      if (args.length > 0) {
        commands.push(args.join(" "));
      }
      continue;
    }

    extractCommands(field, commands, seen);
  }

  return commands;
}

/**
 * Owner override. The hook runs in a separate process and does not inherit the
 * agent shell environment, so authorization must appear in the command text
 * itself. Prefixing a command with `KIRO_OWNER_AUTHORIZED=1` (or setting
 * `$env:KIRO_OWNER_AUTHORIZED=1` inline) marks it as explicitly owner-approved.
 */
const OWNER_OVERRIDE = /KIRO_OWNER_AUTHORIZED\s*=\s*1/;

const raw = readStdin();
let payload;

try {
  payload = JSON.parse(raw);
} catch {
  payload = undefined;
}

const commands = extractCommands(payload);
const haystacks = commands.length > 0 ? commands : [raw];

for (const command of haystacks) {
  if (typeof command !== "string") {
    continue;
  }

  if (OWNER_OVERRIDE.test(command)) {
    continue;
  }

  if (BLOCKED.some((matcher) => matcher.test(command))) {
    process.stderr.write(
      "User authorization required: agents may not run tests, gates, coverage, browser runners, builds, typechecks, or local services.\n",
    );
    process.exit(2);
  }
}

process.exit(0);

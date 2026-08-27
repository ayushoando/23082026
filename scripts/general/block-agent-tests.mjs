import { readFileSync } from "node:fs";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

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
        "User Authorization required: agents may run tests or gates in this repo with user authority"
      );
      process.exit(2);
    }
  }
}

process.exit(0);
